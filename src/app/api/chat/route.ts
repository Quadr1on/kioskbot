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
6. **Appointment Lookup**: Help users check if they have any existing appointments booked by searching with their name or phone number.

## CRITICAL RULES FOR APPOINTMENT BOOKING

### NEVER call bookAppointment tool until you have ALL of these:
1. Patient's full name (from conversation)
2. Phone number (from conversation)
3. Preferred date (from conversation)
4. Doctor ID (from getDoctorTimeSlots result)
5. Slot ID (from getDoctorTimeSlots result, user must select one)

### APPOINTMENT BOOKING FLOW - Follow EXACTLY in order:

**Step 1 - Name**: Say: "I will help you book an appointment. May I have your full name please?"
- Wait for user response. Just acknowledge and move to Step 2. DO NOT call any tool.

**Step 2 - Phone**: Say: "Thank you, [name]. What is your phone number?"
- Wait for user response. Just acknowledge and move to Step 3. DO NOT call any tool.

**Step 3 - Department**: Say: "Which department would you like to visit? We have Cardiology, Neurology, Orthopedics, General Medicine, Pediatrics, Gynecology, Dermatology, ENT, Ophthalmology, and Gastroenterology."
- Wait for user response. Then call getDoctorAvailability tool.

**Step 4 - Show Doctors**: After getDoctorAvailability returns, list ONLY the doctor names and their specializations. DO NOT show time slots yet. Say: "Here are the doctors available in [department]: [list doctors with name and specialization only]. Which doctor would you like to see?"
- Wait for user to choose a doctor.

**Step 5 - Ask Date**: Say: "What date would you like to book the appointment? You can say today, tomorrow, or a specific date."
- Wait for user response. Parse the date to YYYY-MM-DD format.

**Step 6 - Show Time Slots**: Call getDoctorTimeSlots with the doctor name and date. Then list available slots: "Dr. [name] has these available slots on [date]: [list times]. Which time works for you?"
- Wait for user to choose a slot.

**Step 7 - Confirm & Book**: NOW you have all 5 pieces. Call bookAppointment with: patientName, phone, appointmentDate, doctorId, slotId.
- After success, confirm: "Your appointment is booked! Details: [patient name], [doctor name], [date], [time], [department]."

## OTHER IMPORTANT RULES

- ONLY use findPatient tool when user asks to FIND or LOCATE an admitted patient. NEVER use it during booking.
- When collecting name/phone during booking, just acknowledge and ask next question. No tools needed.
- If user gives incomplete info, gently ask again.
- Be warm, patient, speak clearly (many users are elderly).
- Use simple language, avoid medical jargon.
- DO NOT use emojis or special characters.
- Respond in the same language as the user (English or Tamil).
- When you use a tool, you MUST provide a verbal response describing the result.

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
            description: 'Get list of doctors in a specific department with their names and specializations ONLY. DO NOT show time slots - those are shown separately via getDoctorTimeSlots after user picks a doctor and date.',
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

                // Build query for doctors - only get basic info, NOT time slots
                let query = supabase
                    .from('doctors')
                    .select(`
                        id, name, specialization, qualification, available_days, department_id,
                        departments (name, floor)
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
                    })),
                };
            },
        }),

        bookAppointment: tool({
            description: `Book an appointment with a doctor for a patient. 
CRITICAL: DO NOT call this tool until you have collected ALL of the following from the user through conversation:
1. Patient's full name (collected in Step 1)
2. Phone number (collected in Step 2)
3. Preferred appointment date (collected in Step 5)
4. Doctor ID (obtained from getDoctorTimeSlots result after user selects a doctor)
5. Slot ID (obtained after user selects a time slot)

If you do not have ALL 5 pieces of information, DO NOT call this tool. Instead, continue the conversation to collect the missing information.`,
            inputSchema: z.object({
                patientName: z.string().min(1).describe('Full name of the patient - REQUIRED, must be collected from user'),
                phone: z.string().min(1).describe('Phone number of the patient - REQUIRED, must be collected from user'),
                appointmentDate: z.string().describe('Date of the appointment in YYYY-MM-DD format - REQUIRED, must be collected from user'),
                slotId: z.number().positive().describe('ID of the time slot to book - REQUIRED, user must select from available slots'),
                doctorId: z.number().positive().describe('ID of the doctor - REQUIRED, user must select a doctor first'),
            }),
            execute: async ({ patientName, phone, appointmentDate, slotId, doctorId }) => {
                console.log('DEBUG: bookAppointment called with:', { patientName, phone, appointmentDate, slotId, doctorId });

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

                // Create the appointment with date
                const { data, error } = await supabase
                    .from('appointments')
                    .insert({
                        patient_name: patientName,
                        phone,
                        doctor_id: doctorId,
                        slot_id: slotId,
                        appointment_date: appointmentDate,
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
            description: 'Get available time slots for a specific doctor on a specific date. Use this AFTER user has chosen a doctor AND provided their preferred date.',
            inputSchema: z.object({
                doctorName: z.string().optional().describe('Name of the doctor'),
                doctorId: z.number().optional().describe('ID of the doctor if known'),
                date: z.string().optional().describe('Date to check availability for in YYYY-MM-DD format. If not provided, defaults to today.'),
            }),
            execute: async ({ doctorName, doctorId, date }) => {
                console.log('DEBUG: getDoctorTimeSlots called with:', { doctorName, doctorId, date });

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

                // Use provided date or default to today
                const targetDate = date || new Date().toISOString().split('T')[0];

                // Validate date range: must be between today and today+7 days
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayStr = today.toISOString().split('T')[0];

                const maxDate = new Date(today);
                maxDate.setDate(maxDate.getDate() + 7);
                const maxDateStr = maxDate.toISOString().split('T')[0];

                if (targetDate < todayStr) {
                    return {
                        doctorId: docId,
                        doctorName: doctorInfo?.name,
                        date: targetDate,
                        message: `Cannot book appointments for past dates. Please choose today or a future date within the next 7 days.`
                    };
                }

                if (targetDate > maxDateStr) {
                    return {
                        doctorId: docId,
                        doctorName: doctorInfo?.name,
                        date: targetDate,
                        message: `You can only book appointments for the next 7 days (until ${maxDateStr}). Please choose an earlier date.`
                    };
                }

                // Fetch available slots for this doctor on the target date
                const { data: slots, error } = await supabase
                    .from('time_slots')
                    .select('id, date, start_time, end_time, is_booked')
                    .eq('doctor_id', docId)
                    .eq('date', targetDate)
                    .eq('is_booked', false)
                    .order('start_time');

                console.log('DEBUG: Time slots for doctor:', { docId, targetDate, slots, error });

                if (error) {
                    console.error('DEBUG: getDoctorTimeSlots error:', error);
                    return { error: 'Failed to fetch time slots' };
                }

                if (!slots || slots.length === 0) {
                    return {
                        doctorId: docId,
                        doctorName: doctorInfo?.name,
                        date: targetDate,
                        message: `No available slots for ${doctorInfo?.name || 'this doctor'} on ${targetDate}. Would you like to check another date or choose a different doctor?`
                    };
                }

                return {
                    doctorId: docId,
                    doctorName: doctorInfo?.name,
                    specialization: doctorInfo?.specialization,
                    department: doctorInfo?.departments?.name,
                    date: targetDate,
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

        getAppointmentDetails: tool({
            description: 'Look up existing appointments for a patient by their name and/or phone number. Use this when a user asks if they have any appointments booked or wants to check their appointment details.',
            inputSchema: z.object({
                patientName: z.string().optional().describe('Name of the patient to search for'),
                phone: z.string().optional().describe('Phone number of the patient'),
            }),
            execute: async ({ patientName, phone }) => {
                console.log('DEBUG: getAppointmentDetails called with:', { patientName, phone });

                if (!patientName && !phone) {
                    return { message: 'Please provide either your name or phone number to look up your appointments.' };
                }

                // Build the query with joins to get full appointment details
                let query = supabase
                    .from('appointments')
                    .select(`
                        id,
                        patient_name,
                        phone,
                        appointment_date,
                        status,
                        created_at,
                        doctors (
                            id,
                            name,
                            specialization,
                            departments (
                                name,
                                floor
                            )
                        ),
                        time_slots (
                            date,
                            start_time,
                            end_time
                        )
                    `)
                    .order('appointment_date', { ascending: false });

                // Apply filters based on what was provided
                if (patientName && phone) {
                    // If both provided, match both (more precise)
                    query = query.ilike('patient_name', `%${patientName}%`).eq('phone', phone);
                } else if (patientName) {
                    query = query.ilike('patient_name', `%${patientName}%`);
                } else if (phone) {
                    query = query.eq('phone', phone);
                }

                const { data, error } = await query.limit(10);

                console.log('DEBUG: Appointments query result:', { data, error });

                if (error) {
                    console.error('DEBUG: getAppointmentDetails error:', error);
                    return { error: 'Failed to fetch appointment details' };
                }

                if (!data || data.length === 0) {
                    return {
                        message: `No appointments found${patientName ? ` for "${patientName}"` : ''}${phone ? ` with phone number ${phone}` : ''}. Would you like to book a new appointment?`
                    };
                }

                return {
                    appointments: data.map((apt: any) => ({
                        id: apt.id,
                        patientName: apt.patient_name,
                        phone: apt.phone,
                        doctorName: apt.doctors?.name,
                        specialization: apt.doctors?.specialization,
                        department: apt.doctors?.departments?.name,
                        floor: apt.doctors?.departments?.floor,
                        date: apt.time_slots?.date || apt.appointment_date,
                        time: apt.time_slots ? `${apt.time_slots.start_time} - ${apt.time_slots.end_time}` : null,
                        status: apt.status,
                        bookedOn: apt.created_at,
                    })),
                    message: `Found ${data.length} appointment(s)`,
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


