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

## APPOINTMENT BOOKING FLOW
When a user wants to book an appointment, you MUST follow these steps IN ORDER. Ask ONE question at a time and wait for the user's response before proceeding:

**Step 1 - Name**: "I will help you book an appointment. May I have your full name please?"
**Step 2 - Phone**: After receiving name, ask: "Thank you, [name]. What is your phone number?"
**Step 3 - Department**: After receiving phone, ask: "Which department would you like to visit? We have Cardiology, Neurology, Orthopedics, General Medicine, Pediatrics, Gynecology, Dermatology, ENT, Ophthalmology, and Gastroenterology."
**Step 4 - Show Doctors**: When they choose a department, use the getDoctorAvailability tool to get doctors in that department, then list them with their specializations.
**Step 5 - Choose Doctor**: Ask the user to choose a doctor from the list.
**Step 6 - Show Time Slots**: When they choose a doctor, use getDoctorTimeSlots tool to show available time slots for today.
**Step 7 - Choose Slot**: Ask them to choose a time slot.
**Step 8 - Confirm Booking**: Use bookAppointment tool with collected info (name, phone, doctorId, slotId) to book. Then confirm: "Your appointment is booked successfully! [Provide appointment details]"

IMPORTANT: 
- Keep track of all information provided (name, phone, department, doctor, slot) throughout the conversation
- If the user skips a step or provides incorrect info, gently ask again
- Always confirm the booking details before finalizing

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
            description: 'Get list of doctors in a specific department along with their specializations and available time slots. Use this when user asks about doctors available in a department like Cardiology, Neurology, Orthopedics, etc.',
            inputSchema: z.object({
                departmentName: z.string().optional().describe('Name of the department (e.g., Cardiology, Neurology, Orthopedics)'),
                doctorName: z.string().optional().describe('Name of the doctor to search for'),
                date: z.string().optional().describe('Date for availability check (YYYY-MM-DD)'),
            }),
            execute: async ({ departmentName, doctorName, date }) => {
                console.log('DEBUG: getDoctorAvailability called with:', { departmentName, doctorName, date });

                let departmentId: number | null = null;
                let departmentInfo: { name: string; floor: number } | null = null;

                // If department name is provided, first get the department ID
                if (departmentName) {
                    const { data: dept, error: deptError } = await supabase
                        .from('departments')
                        .select('id, name, floor')
                        .ilike('name', `%${departmentName}%`)
                        .single();

                    if (deptError || !dept) {
                        console.log('DEBUG: Department not found:', departmentName);
                        return {
                            message: `Department "${departmentName}" not found. Available departments include: Cardiology, Neurology, Orthopedics, General Medicine, Pediatrics, Gynecology, Dermatology, ENT, Ophthalmology, Gastroenterology.`
                        };
                    }
                    departmentId = dept.id;
                    departmentInfo = { name: dept.name, floor: dept.floor };
                    console.log('DEBUG: Found department:', dept);
                }

                // Build query for doctors
                let query = supabase
                    .from('doctors')
                    .select(`
                        id, name, specialization, qualification, available_days, department_id,
                        departments (name, floor),
                        time_slots (id, date, start_time, end_time, is_booked)
                    `);

                // Filter by department ID if provided
                if (departmentId) {
                    query = query.eq('department_id', departmentId);
                }

                // Filter by doctor name if provided
                if (doctorName) {
                    query = query.ilike('name', `%${doctorName}%`);
                }

                const { data, error } = await query.limit(10);

                console.log('DEBUG: Doctors query result:', { data, error });

                if (error) {
                    console.error('DEBUG: getDoctorAvailability error:', error);
                    return { error: 'Failed to fetch doctor availability' };
                }
                if (!data || data.length === 0) {
                    return { message: `No doctors found${departmentName ? ` in ${departmentName} department` : ''}` };
                }

                return {
                    department: departmentInfo,
                    doctors: data.map((d: any) => ({
                        id: d.id,
                        name: d.name,
                        specialization: d.specialization,
                        qualification: d.qualification,
                        department: d.departments?.name,
                        floor: d.departments?.floor,
                        availableDays: d.available_days,
                        availableSlots: d.time_slots
                            ?.filter((s: any) => !s.is_booked && (!date || s.date === date))
                            .slice(0, 5) // Limit slots to avoid overwhelming the response
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
            description: 'Book an appointment with a doctor for a patient. Use this ONLY after collecting: patient name, phone number, doctor ID, and slot ID.',
            inputSchema: z.object({
                patientName: z.string().describe('Full name of the patient'),
                phone: z.string().describe('Phone number of the patient'),
                slotId: z.number().describe('ID of the time slot to book'),
                doctorId: z.number().describe('ID of the doctor'),
            }),
            execute: async ({ patientName, phone, slotId, doctorId }) => {
                console.log('DEBUG: bookAppointment called with:', { patientName, phone, slotId, doctorId });

                // Get doctor and slot details for confirmation
                const { data: slotData } = await supabase
                    .from('time_slots')
                    .select('date, start_time, end_time')
                    .eq('id', slotId)
                    .single();

                const { data: doctorData } = await supabase
                    .from('doctors')
                    .select('name, departments(name)')
                    .eq('id', doctorId)
                    .single();

                // Mark the slot as booked
                const { error: slotError } = await supabase
                    .from('time_slots')
                    .update({ is_booked: true })
                    .eq('id', slotId);

                if (slotError) {
                    console.error('DEBUG: Failed to book slot:', slotError);
                    return { error: 'Failed to book time slot. It may already be booked.' };
                }

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

                if (error) {
                    console.error('DEBUG: Failed to create appointment:', error);
                    return { error: 'Failed to create appointment' };
                }

                console.log('DEBUG: Appointment created:', data);

                return {
                    success: true,
                    appointmentId: data.id,
                    patientName,
                    phone,
                    doctorName: doctorData?.name,
                    department: (doctorData as any)?.departments?.name,
                    date: slotData?.date,
                    time: slotData ? `${slotData.start_time} - ${slotData.end_time}` : undefined,
                    message: `Appointment booked successfully!`,
                };
            },
        }),

        getDoctorTimeSlots: tool({
            description: 'Get available time slots for a specific doctor today. Use this when the user has chosen a doctor and needs to see available times.',
            inputSchema: z.object({
                doctorName: z.string().optional().describe('Name of the doctor'),
                doctorId: z.number().optional().describe('ID of the doctor if known'),
            }),
            execute: async ({ doctorName, doctorId }) => {
                console.log('DEBUG: getDoctorTimeSlots called with:', { doctorName, doctorId });

                let docId = doctorId;
                let doctorInfo: any = null;

                // If doctor name provided, look up the doctor ID
                if (!docId && doctorName) {
                    const { data: doctor, error: docError } = await supabase
                        .from('doctors')
                        .select('id, name, specialization, departments(name)')
                        .ilike('name', `%${doctorName}%`)
                        .single();

                    if (docError || !doctor) {
                        console.log('DEBUG: Doctor not found:', doctorName);
                        return { message: `Could not find a doctor named "${doctorName}". Please try again with the correct name.` };
                    }
                    docId = doctor.id;
                    doctorInfo = doctor;
                    console.log('DEBUG: Found doctor:', doctor);
                } else if (docId) {
                    const { data: doctor } = await supabase
                        .from('doctors')
                        .select('id, name, specialization, departments(name)')
                        .eq('id', docId)
                        .single();
                    doctorInfo = doctor;
                }

                if (!docId) {
                    return { message: 'Please provide a doctor name or ID.' };
                }

                // Get today's date in YYYY-MM-DD format
                const today = new Date().toISOString().split('T')[0];

                // Fetch available slots for this doctor today
                const { data: slots, error } = await supabase
                    .from('time_slots')
                    .select('id, date, start_time, end_time, is_booked')
                    .eq('doctor_id', docId)
                    .eq('date', today)
                    .eq('is_booked', false)
                    .order('start_time');

                console.log('DEBUG: Time slots for doctor:', { docId, today, slots, error });

                if (error) {
                    console.error('DEBUG: getDoctorTimeSlots error:', error);
                    return { error: 'Failed to fetch time slots' };
                }

                if (!slots || slots.length === 0) {
                    return {
                        doctorId: docId,
                        doctorName: doctorInfo?.name,
                        message: `No available slots for ${doctorInfo?.name || 'this doctor'} today. Would you like to check another day or choose a different doctor?`
                    };
                }

                return {
                    doctorId: docId,
                    doctorName: doctorInfo?.name,
                    specialization: doctorInfo?.specialization,
                    department: doctorInfo?.departments?.name,
                    date: today,
                    availableSlots: slots.map((s: any) => ({
                        id: s.id,
                        time: `${s.start_time} - ${s.end_time}`,
                    })),
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


