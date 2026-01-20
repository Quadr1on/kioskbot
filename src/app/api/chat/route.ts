import { streamText, generateText, tool, stepCountIs } from 'ai';
import { llmModel } from '@/lib/groq';
import { createServerClient } from '@/lib/supabase';
import { z } from 'zod';
import { NextResponse } from 'next/server';

export const maxDuration = 30;

const SYSTEM_PROMPT = `You are a friendly and helpful hospital assistant kiosk at SIMS Hospital in Chennai. You help patients and visitors with:

1. **Finding Patients**: Help locate admitted patients by name and provide their room number and department.
2. **Booking Appointments**: Help book appointments with doctors, showing available time slots.
3. **Hospital Information**: Answer questions about visiting hours, hospital rules, facilities, etc.
4. **Department Guidance**: Based on symptoms, suggest which department to visit and offer to book appointments.
5. **Doctor Information**: Provide details about doctors, their specializations, and availability.

Guidelines:
- Be warm, patient, and speak clearly (many users are elderly)
- Use simple language, avoid medical jargon
- DO NOT use emojis or special characters in your response.
- STRICTLY respond in the same language as the user. If the user speaks English, respond ONLY in English. If the user speaks Tamil, respond ONLY in Tamil. Do not mix languages.
- IMPORTANT: When you use a tool (like findPatient), you MUST generate a verbal response describing the result to the user. Do not just run the tool and stay silent.
- When unsure, offer to connect with hospital reception
- Always confirm important details before taking actions
- For symptom-based queries, suggest departments but remind users this is not a medical diagnosis

Current hospital visiting hours: 10:00 AM - 12:00 PM and 4:00 PM - 7:00 PM`;

export async function POST(req: Request) {
    const { messages, stream = true } = await req.json();
    console.log('DEBUG: Chat Request Messages:', JSON.stringify(messages, null, 2));
    console.log('DEBUG: Stream mode:', stream);
    const supabase = createServerClient();

    // Filter out empty assistant messages to prevent silence loop
    const validMessages = messages.filter((m: any) =>
        !(m.role === 'assistant' && (!m.content || m.content.trim() === ''))
    );

    console.log('DEBUG: Valid Messages passed to LLM:', JSON.stringify(validMessages, null, 2));

    // Define tools once to use in both streaming and non-streaming modes
    const chatTools = {
        findPatient: tool({
            description: 'Find an admitted patient by their name and get their room number and department',
            inputSchema: z.object({
                patientName: z.string().describe('The name of the patient to search for'),
            }),
            execute: async ({ patientName }) => {
                console.log('DEBUG: findPatient tool called with:', patientName);
                const { data, error } = await supabase
                    .from('patients')
                    .select(`
              id, name, room_number, diagnosis, admitted_at,
              departments (name, floor)
            `)
                    .ilike('name', `%${patientName}%`)
                    .limit(5);

                if (error) {
                    console.error('DEBUG: findPatient error:', error);
                    return { error: 'Failed to search for patient' };
                }
                console.log('DEBUG: findPatient data:', data);
                if (!data || data.length === 0) return { message: 'No patient found with that name' };

                return {
                    patients: data.map((p: any) => ({
                        name: p.name,
                        room: p.room_number,
                        department: p.departments?.name,
                        floor: p.departments?.floor,
                        diagnosis: p.diagnosis,
                        admittedAt: p.admitted_at,
                    })),
                };
            },
        }),

        getDoctorAvailability: tool({
            description: 'Get available time slots for a doctor or department',
            inputSchema: z.object({
                departmentName: z.string().optional().describe('Name of the department'),
                doctorName: z.string().optional().describe('Name of the doctor'),
                date: z.string().optional().describe('Date for availability check (YYYY-MM-DD)'),
            }),
            execute: async ({ departmentName, doctorName, date }) => {
                let query = supabase
                    .from('doctors')
                    .select(`
              id, name, specialization, qualification, available_days,
              departments (name),
              time_slots (id, date, start_time, end_time, is_booked)
            `);

                if (departmentName) {
                    query = query.eq('departments.name', departmentName);
                }
                if (doctorName) {
                    query = query.ilike('name', `%${doctorName}%`);
                }

                const { data, error } = await query.limit(10);

                if (error) return { error: 'Failed to fetch doctor availability' };
                if (!data || data.length === 0) return { message: 'No doctors found' };

                return {
                    doctors: data.map((d: any) => ({
                        name: d.name,
                        specialization: d.specialization,
                        qualification: d.qualification,
                        department: d.departments?.name,
                        availableDays: d.available_days,
                        availableSlots: d.time_slots
                            ?.filter((s: any) => !s.is_booked && (!date || s.date === date))
                            .map((s: any) => ({
                                id: s.id,
                                date: s.date,
                                time: `${s.start_time} - ${s.end_time}`,
                            })),
                    })),
                };
            },
        }),

        bookAppointment: tool({
            description: 'Book an appointment with a doctor for a patient',
            inputSchema: z.object({
                patientName: z.string().describe('Name of the patient booking the appointment'),
                phone: z.string().describe('Phone number of the patient'),
                slotId: z.number().describe('ID of the time slot to book'),
                doctorId: z.number().describe('ID of the doctor'),
            }),
            execute: async ({ patientName, phone, slotId, doctorId }) => {
                // First mark the slot as booked
                const { error: slotError } = await supabase
                    .from('time_slots')
                    .update({ is_booked: true })
                    .eq('id', slotId);

                if (slotError) return { error: 'Failed to book time slot' };

                // Create the appointment
                const { data, error } = await supabase
                    .from('appointments')
                    .insert({
                        patient_name: patientName,
                        phone,
                        doctor_id: doctorId,
                        slot_id: slotId,
                        status: 'confirmed',
                    })
                    .select()
                    .single();

                if (error) return { error: 'Failed to create appointment' };

                return {
                    success: true,
                    appointmentId: data.id,
                    message: `Appointment booked successfully! Your appointment ID is ${data.id}`,
                };
            },
        }),

        getHospitalInfo: tool({
            description: 'Get general hospital information like visiting hours, rules, facilities, etc.',
            inputSchema: z.object({
                query: z.string().describe('What information the user is looking for'),
            }),
            execute: async ({ query }) => {
                const { data, error } = await supabase
                    .from('hospital_info')
                    .select('title, content, category')
                    .or(`title.ilike.%${query}%,content.ilike.%${query}%,category.ilike.%${query}%`)
                    .limit(5);

                if (error) return { error: 'Failed to fetch hospital information' };
                return { information: data };
            },
        }),

        getDepartments: tool({
            description: 'Get list of all departments in the hospital',
            inputSchema: z.object({}),
            execute: async () => {
                const { data, error } = await supabase
                    .from('departments')
                    .select('id, name, floor, description, phone')
                    .order('name');

                if (error) return { error: 'Failed to fetch departments' };
                return { departments: data };
            },
        }),

        suggestDepartment: tool({
            description: 'Suggest a department based on symptoms (NOT a medical diagnosis)',
            inputSchema: z.object({
                symptoms: z.string().describe('The symptoms described by the patient'),
            }),
            execute: async ({ symptoms }) => {
                // Simple keyword-based suggestion (in production, use a more sophisticated approach)
                const symptomMap: Record<string, string[]> = {
                    'Cardiology': ['chest pain', 'heart', 'breathing difficulty', 'blood pressure', 'palpitations'],
                    'Neurology': ['headache', 'dizziness', 'numbness', 'seizure', 'memory', 'nerve'],
                    'Orthopedics': ['bone', 'joint', 'fracture', 'back pain', 'knee', 'shoulder', 'spine'],
                    'Gastroenterology': ['stomach', 'abdomen', 'vomiting', 'nausea', 'digestion', 'liver'],
                    'ENT': ['ear', 'nose', 'throat', 'hearing', 'sinus', 'voice'],
                    'Ophthalmology': ['eye', 'vision', 'sight', 'blindness'],
                    'Dermatology': ['skin', 'rash', 'itching', 'allergy', 'hair'],
                    'General Medicine': ['fever', 'cold', 'cough', 'weakness', 'fatigue'],
                };

                const lowerSymptoms = symptoms.toLowerCase();
                const suggestions: string[] = [];

                for (const [dept, keywords] of Object.entries(symptomMap)) {
                    if (keywords.some(keyword => lowerSymptoms.includes(keyword))) {
                        suggestions.push(dept);
                    }
                }

                return {
                    suggestedDepartments: suggestions.length > 0 ? suggestions : ['General Medicine'],
                    disclaimer: 'This is only a suggestion based on keywords. Please consult with a doctor for proper diagnosis.',
                };
            },
        }),
    };

    // Non-streaming mode for voice - waits for complete response including tool results
    if (!stream) {
        try {
            const result = await generateText({
                model: llmModel,
                system: SYSTEM_PROMPT + "\n\nNote: If you use a tool, you must also provide a verbal response summarizing the result.",
                messages: validMessages,
                stopWhen: stepCountIs(5),
                tools: chatTools,
            });

            console.log('DEBUG: Non-streaming result text:', result.text);
            console.log('DEBUG: Tool calls made:', result.toolCalls);
            console.log('DEBUG: Tool results:', result.toolResults);

            return NextResponse.json({
                text: result.text,
                toolCalls: result.toolCalls,
                toolResults: result.toolResults,
            });
        } catch (error) {
            console.error('DEBUG: generateText error:', error);
            return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
        }
    }

    // Streaming mode for chat UI
    const result = streamText({
        model: llmModel,
        system: SYSTEM_PROMPT + "\n\nNote: If you use a tool, you must also provide a verbal response summarizing the result.",
        messages: validMessages,
        stopWhen: stepCountIs(5),
        tools: chatTools,
    });

    return result.toTextStreamResponse();
}


