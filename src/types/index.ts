// Database types for the hospital kiosk application

export interface Department {
    id: number;
    name: string;
    floor: number;
    description: string;
    phone: string;
}

export interface Doctor {
    id: number;
    name: string;
    department_id: number;
    specialization: string;
    qualification: string;
    available_days: string[];
    image_url?: string;
}

export interface TimeSlot {
    id: number;
    doctor_id: number;
    date: string;
    start_time: string;
    end_time: string;
    is_booked: boolean;
}

export interface Patient {
    id: number;
    name: string;
    phone: string;
    room_number: string;
    department_id: number;
    admitted_at: string;
    diagnosis: string;
}

export interface Appointment {
    id: number;
    patient_name: string;
    phone: string;
    doctor_id: number;
    slot_id: number;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    created_at: string;
}

export interface HospitalInfo {
    id: number;
    category: string;
    title: string;
    content: string;
    embedding?: number[];
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export interface ChatSession {
    id: string;
    messages: ChatMessage[];
    created_at: Date;
}
