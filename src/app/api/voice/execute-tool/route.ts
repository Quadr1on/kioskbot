import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {
        const { functionName, args } = await req.json();
        console.log('DEBUG: execute-tool called:', functionName, args);

        const supabase = createServerClient();
        let result: any;

        switch (functionName) {
            case 'getDepartments': {
                const { data, error } = await supabase
                    .from('departments')
                    .select('id, name, floor, description, phone')
                    .order('name');
                if (error) { result = { error: 'Failed to fetch departments' }; break; }
                result = { departments: data };
                break;
            }

            case 'getDoctorAvailability': {
                const { departmentName, doctorName } = args;
                let departmentId: number | null = null;
                let departmentInfo: any = null;

                if (departmentName) {
                    const { data: dept, error: deptError } = await supabase
                        .from('departments')
                        .select('id, name, floor')
                        .ilike('name', `%${departmentName}%`)
                        .single();
                    if (deptError || !dept) {
                        result = { message: `Department "${departmentName}" not found. Available: Cardiology, Neurology, Orthopedics, General Medicine, Pediatrics, Gynecology, Dermatology, ENT, Ophthalmology, Gastroenterology.` };
                        break;
                    }
                    departmentId = dept.id;
                    departmentInfo = { name: dept.name, floor: dept.floor };
                }

                let query = supabase
                    .from('doctors')
                    .select('id, name, specialization, qualification, available_days, department_id, departments (name, floor)');
                if (departmentId) query = query.eq('department_id', departmentId);
                if (doctorName) query = query.ilike('name', `%${doctorName}%`);

                const { data, error } = await query.limit(10);
                if (error) { result = { error: 'Failed to fetch doctor availability' }; break; }
                if (!data || data.length === 0) { result = { message: `No doctors found${departmentName ? ` in ${departmentName}` : ''}` }; break; }

                result = {
                    department: departmentInfo,
                    doctors: data.map((d: any) => ({
                        id: d.id, name: d.name, specialization: d.specialization,
                        qualification: d.qualification, department: d.departments?.name,
                        floor: d.departments?.floor, availableDays: d.available_days,
                    })),
                };
                break;
            }

            case 'getDoctorTimeSlots': {
                const { doctorName, doctorId, date } = args;
                let docId = doctorId;
                let doctorInfo: any = null;

                if (!docId && doctorName) {
                    const { data: doctor, error: docError } = await supabase
                        .from('doctors')
                        .select('id, name, specialization, departments(name)')
                        .ilike('name', `%${doctorName}%`)
                        .single();
                    if (docError || !doctor) { result = { message: `Could not find doctor "${doctorName}".` }; break; }
                    docId = doctor.id;
                    doctorInfo = doctor;
                } else if (docId) {
                    const { data: doctor } = await supabase
                        .from('doctors')
                        .select('id, name, specialization, departments(name)')
                        .eq('id', docId)
                        .single();
                    doctorInfo = doctor;
                }

                if (!docId) { result = { message: 'Please provide a doctor name or ID.' }; break; }

                const targetDate = date || new Date().toISOString().split('T')[0];
                const today = new Date(); today.setHours(0, 0, 0, 0);
                const maxDate = new Date(today); maxDate.setDate(maxDate.getDate() + 7);

                if (targetDate < today.toISOString().split('T')[0]) {
                    result = { doctorId: docId, doctorName: doctorInfo?.name, date: targetDate, message: 'Cannot book for past dates.' };
                    break;
                }
                if (targetDate > maxDate.toISOString().split('T')[0]) {
                    result = { doctorId: docId, doctorName: doctorInfo?.name, date: targetDate, message: `Can only book within next 7 days (until ${maxDate.toISOString().split('T')[0]}).` };
                    break;
                }

                const { data: slots, error } = await supabase
                    .from('time_slots')
                    .select('id, date, start_time, end_time, is_booked')
                    .eq('doctor_id', docId)
                    .eq('date', targetDate)
                    .eq('is_booked', false)
                    .order('start_time');

                if (error) { result = { error: 'Failed to fetch time slots' }; break; }
                if (!slots || slots.length === 0) {
                    result = { doctorId: docId, doctorName: doctorInfo?.name, date: targetDate, message: `No available slots for ${doctorInfo?.name || 'this doctor'} on ${targetDate}.` };
                    break;
                }

                result = {
                    doctorId: docId, doctorName: doctorInfo?.name,
                    specialization: doctorInfo?.specialization,
                    department: doctorInfo?.departments?.name, date: targetDate,
                    availableSlots: slots.map((s: any) => ({ id: s.id, time: `${s.start_time} - ${s.end_time}` })),
                };
                break;
            }

            case 'bookAppointment': {
                const { patientName, phone, appointmentDate, slotId, doctorId } = args;

                const { data: slotData } = await supabase.from('time_slots').select('date, start_time, end_time').eq('id', slotId).single();
                const { data: doctorData } = await supabase.from('doctors').select('name, departments(name)').eq('id', doctorId).single();

                const { error: slotError } = await supabase.from('time_slots').update({ is_booked: true }).eq('id', slotId);
                if (slotError) { result = { error: 'Failed to book time slot.' }; break; }

                const { data, error } = await supabase.from('appointments')
                    .insert({ patient_name: patientName, phone, doctor_id: doctorId, slot_id: slotId, appointment_date: appointmentDate, status: 'confirmed' })
                    .select().single();
                if (error) { result = { error: 'Failed to create appointment' }; break; }

                result = {
                    success: true, appointmentId: data.id, patientName, phone,
                    doctorName: doctorData?.name, department: (doctorData as any)?.departments?.name,
                    date: slotData?.date, time: slotData ? `${slotData.start_time} - ${slotData.end_time}` : undefined,
                    message: 'Appointment booked successfully!',
                };
                break;
            }

            case 'findPatient': {
                const { patientName } = args;
                const { data, error } = await supabase
                    .from('patients')
                    .select('id, name, room_number, diagnosis, admitted_at, departments (name, floor)')
                    .ilike('name', `%${patientName}%`)
                    .limit(5);
                if (error) { result = { error: 'Failed to search for patient' }; break; }
                if (!data || data.length === 0) { result = { message: 'No patient found with that name' }; break; }
                result = {
                    patients: data.map((p: any) => ({
                        name: p.name, room: p.room_number, department: p.departments?.name,
                        floor: p.departments?.floor, diagnosis: p.diagnosis, admittedAt: p.admitted_at,
                    })),
                };
                break;
            }

            case 'getHospitalInfo': {
                const { query } = args;
                const { data, error } = await supabase
                    .from('hospital_info')
                    .select('title, content, category')
                    .or(`title.ilike.%${query}%,content.ilike.%${query}%,category.ilike.%${query}%`)
                    .limit(5);
                if (error) { result = { error: 'Failed to fetch hospital information' }; break; }
                result = { information: data };
                break;
            }

            case 'suggestDepartment': {
                const { symptoms } = args;
                const symptomMap: Record<string, string[]> = {
                    'Cardiology': ['chest pain', 'heart', 'breathing difficulty', 'blood pressure'],
                    'Neurology': ['headache', 'dizziness', 'numbness', 'seizure', 'memory'],
                    'Orthopedics': ['bone', 'joint', 'fracture', 'back pain', 'knee', 'shoulder'],
                    'Gastroenterology': ['stomach', 'abdomen', 'vomiting', 'nausea', 'digestion'],
                    'ENT': ['ear', 'nose', 'throat', 'hearing', 'sinus'],
                    'Ophthalmology': ['eye', 'vision', 'sight'],
                    'Dermatology': ['skin', 'rash', 'itching', 'allergy'],
                    'General Medicine': ['fever', 'cold', 'cough', 'weakness', 'fatigue'],
                };
                const lower = symptoms.toLowerCase();
                const suggestions = Object.entries(symptomMap)
                    .filter(([, keywords]) => keywords.some(k => lower.includes(k)))
                    .map(([dept]) => dept);
                result = {
                    suggestedDepartments: suggestions.length > 0 ? suggestions : ['General Medicine'],
                    disclaimer: 'This is only a suggestion. Please consult with a doctor.',
                };
                break;
            }

            case 'getAppointmentDetails': {
                const { patientName, phone } = args;
                if (!patientName && !phone) { result = { message: 'Please provide name or phone number.' }; break; }

                let query = supabase.from('appointments')
                    .select('id, patient_name, phone, appointment_date, status, created_at, doctors (id, name, specialization, departments (name, floor)), time_slots (date, start_time, end_time)')
                    .order('appointment_date', { ascending: false });
                if (patientName && phone) { query = query.ilike('patient_name', `%${patientName}%`).eq('phone', phone); }
                else if (patientName) { query = query.ilike('patient_name', `%${patientName}%`); }
                else if (phone) { query = query.eq('phone', phone); }

                const { data, error } = await query.limit(10);
                if (error) { result = { error: 'Failed to fetch appointments' }; break; }
                if (!data || data.length === 0) { result = { message: `No appointments found.` }; break; }

                result = {
                    appointments: data.map((apt: any) => ({
                        id: apt.id, patientName: apt.patient_name, phone: apt.phone,
                        doctorName: apt.doctors?.name, specialization: apt.doctors?.specialization,
                        department: apt.doctors?.departments?.name, floor: apt.doctors?.departments?.floor,
                        date: apt.time_slots?.date || apt.appointment_date,
                        time: apt.time_slots ? `${apt.time_slots.start_time} - ${apt.time_slots.end_time}` : null,
                        status: apt.status, bookedOn: apt.created_at,
                    })),
                    message: `Found ${data.length} appointment(s)`,
                };
                break;
            }

            default:
                result = { error: `Unknown function: ${functionName}` };
        }

        console.log('DEBUG: execute-tool result:', JSON.stringify(result).substring(0, 200));
        return NextResponse.json(result);
    } catch (error) {
        console.error('DEBUG: execute-tool error:', error);
        return NextResponse.json({ error: 'Tool execution failed' }, { status: 500 });
    }
}
