// Fake data for the kiosk mode - hardcoded for now

export interface Doctor {
    id: string;
    name: string;
    designation: string;
    degree: string;
    departmentId: string;
    avatar?: string;
}

export interface Department {
    id: string;
    name: string;
    icon: string;
    color: string;
    description: string;
}

export interface TimeSlot {
    id: string;
    time: string;
    available: boolean;
}

export interface AppointmentData {
    patientName: string;
    phoneNumber: string;
    department: Department | null;
    doctor: Doctor | null;
    timeSlot: TimeSlot | null;
}

export const departments: Department[] = [
    {
        id: 'cardiology',
        name: 'Cardiology',
        icon: '❤️',
        color: '#3B82F6',
        description: 'Heart & Cardiovascular',
    },
    {
        id: 'orthopedics',
        name: 'Orthopedics',
        icon: '🦴',
        color: '#3B82F6',
        description: 'Bones & Joints',
    },
    {
        id: 'neurology',
        name: 'Neurology',
        icon: '🧠',
        color: '#3B82F6',
        description: 'Brain & Nervous System',
    },
    {
        id: 'pediatrics',
        name: 'Pediatrics',
        icon: '👶',
        color: '#3B82F6',
        description: 'Child Healthcare',
    },
    {
        id: 'dermatology',
        name: 'Dermatology',
        icon: '🧴',
        color: '#3B82F6',
        description: 'Skin & Hair',
    },
    {
        id: 'ophthalmology',
        name: 'Ophthalmology',
        icon: '👁️',
        color: '#3B82F6',
        description: 'Eye Care',
    },
    {
        id: 'ent',
        name: 'ENT',
        icon: '👂',
        color: '#3B82F6',
        description: 'Ear, Nose & Throat',
    },
    {
        id: 'general-medicine',
        name: 'General Medicine',
        icon: '🩺',
        color: '#3B82F6',
        description: 'General Health',
    },
];

export const doctors: Doctor[] = [
    // Cardiology
    {
        id: 'doc-1',
        name: 'Dr. Rajesh Kumar',
        designation: 'Senior Cardiologist',
        degree: 'MBBS, MD, DM (Cardiology)',
        departmentId: 'cardiology',
    },
    {
        id: 'doc-2',
        name: 'Dr. Priya Sharma',
        designation: 'Interventional Cardiologist',
        degree: 'MBBS, DNB (Cardiology)',
        departmentId: 'cardiology',
    },
    {
        id: 'doc-3',
        name: 'Dr. Arun Mehta',
        designation: 'Consultant Cardiologist',
        degree: 'MBBS, MD, FACC',
        departmentId: 'cardiology',
    },
    // Orthopedics
    {
        id: 'doc-4',
        name: 'Dr. Suresh Patel',
        designation: 'Senior Orthopedic Surgeon',
        degree: 'MBBS, MS (Ortho), MCh',
        departmentId: 'orthopedics',
    },
    {
        id: 'doc-5',
        name: 'Dr. Anita Desai',
        designation: 'Joint Replacement Specialist',
        degree: 'MBBS, DNB (Ortho)',
        departmentId: 'orthopedics',
    },
    // Neurology
    {
        id: 'doc-6',
        name: 'Dr. Vikram Singh',
        designation: 'Senior Neurologist',
        degree: 'MBBS, MD, DM (Neuro)',
        departmentId: 'neurology',
    },
    {
        id: 'doc-7',
        name: 'Dr. Meera Nair',
        designation: 'Consultant Neurologist',
        degree: 'MBBS, MD (Neurology)',
        departmentId: 'neurology',
    },
    // Pediatrics
    {
        id: 'doc-8',
        name: 'Dr. Kavitha Raman',
        designation: 'Senior Pediatrician',
        degree: 'MBBS, MD (Pediatrics)',
        departmentId: 'pediatrics',
    },
    {
        id: 'doc-9',
        name: 'Dr. Sanjay Gupta',
        designation: 'Neonatologist',
        degree: 'MBBS, DCH, DNB',
        departmentId: 'pediatrics',
    },
    // Dermatology
    {
        id: 'doc-10',
        name: 'Dr. Lakshmi Iyer',
        designation: 'Senior Dermatologist',
        degree: 'MBBS, MD (Derma), DVD',
        departmentId: 'dermatology',
    },
    {
        id: 'doc-11',
        name: 'Dr. Ravi Krishnan',
        designation: 'Cosmetologist',
        degree: 'MBBS, DD, FRCP',
        departmentId: 'dermatology',
    },
    // Ophthalmology
    {
        id: 'doc-12',
        name: 'Dr. Sunita Menon',
        designation: 'Senior Ophthalmologist',
        degree: 'MBBS, MS (Ophthal), FICO',
        departmentId: 'ophthalmology',
    },
    {
        id: 'doc-13',
        name: 'Dr. Ashok Reddy',
        designation: 'Retina Specialist',
        degree: 'MBBS, DO, DNB',
        departmentId: 'ophthalmology',
    },
    // ENT
    {
        id: 'doc-14',
        name: 'Dr. Deepak Joshi',
        designation: 'Senior ENT Surgeon',
        degree: 'MBBS, MS (ENT), DLO',
        departmentId: 'ent',
    },
    {
        id: 'doc-15',
        name: 'Dr. Nandini Rao',
        designation: 'ENT Specialist',
        degree: 'MBBS, DNB (ENT)',
        departmentId: 'ent',
    },
    // General Medicine
    {
        id: 'doc-16',
        name: 'Dr. Mohan Prasad',
        designation: 'Chief Physician',
        degree: 'MBBS, MD (Gen Med), FICP',
        departmentId: 'general-medicine',
    },
    {
        id: 'doc-17',
        name: 'Dr. Revathi Subramaniam',
        designation: 'Consultant Physician',
        degree: 'MBBS, MD (Internal Med)',
        departmentId: 'general-medicine',
    },
];

export const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const times = [
        '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
        '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
        '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
        '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
    ];

    times.forEach((time, index) => {
        slots.push({
            id: `slot-${index}`,
            time,
            // Randomly make some slots unavailable for realism
            available: Math.random() > 0.3,
        });
    });

    return slots;
};

export const kioskServices = [
    {
        id: 'book-appointment',
        title: 'Book Appointment',
        description: 'Schedule a visit with our specialists',
        icon: '📅',
        color: '#3B82F6',
        gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
    },
    {
        id: 'visiting-hours',
        title: 'Visiting Hours',
        description: 'Check patient visiting schedules',
        icon: '🕐',
        color: '#3B82F6',
        gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
    },
    {
        id: 'find-patient',
        title: 'Find Patient',
        description: 'Locate a patient by name or ID',
        icon: '🔍',
        color: '#3B82F6',
        gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
    },
    {
        id: 'emergency',
        title: 'Emergency',
        description: 'Immediate medical assistance',
        icon: '🚨',
        color: '#3B82F6',
        gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
    },
    {
        id: 'pharmacy',
        title: 'Pharmacy',
        description: 'Medicine pickup & prescriptions',
        icon: '💊',
        color: '#3B82F6',
        gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
    },
    {
        id: 'hospital-info',
        title: 'Hospital Info',
        description: 'Facilities, departments & more',
        icon: '🏥',
        color: '#3B82F6',
        gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
    },
];

// Visiting hours data
export const visitingHoursData = {
    general: {
        morning: '10:00 AM - 12:00 PM',
        evening: '04:00 PM - 06:00 PM',
    },
    icu: {
        morning: '11:00 AM - 11:30 AM',
        evening: '05:00 PM - 05:30 PM',
        note: 'Only 2 visitors allowed at a time',
    },
    pediatrics: {
        allDay: '08:00 AM - 08:00 PM',
        note: 'Parents can stay 24/7',
    },
    maternity: {
        morning: '09:00 AM - 12:00 PM',
        evening: '04:00 PM - 07:00 PM',
        note: 'Spouse can stay 24/7',
    },
};

// Hospital info data
export const hospitalInfoData = {
    facilities: [
        '24/7 Emergency Services',
        'Advanced Diagnostic Lab',
        'Pharmacy',
        'Canteen & Cafeteria',
        'Prayer Room',
        'ATM & Banking',
        'Free Wi-Fi',
        'Wheelchair Access',
    ],
    contact: {
        emergency: '1066',
        reception: '+91 44 2860 0000',
        ambulance: '108',
    },
    address: 'No.1, Jawaharlal Nehru Salai, 100 Feet Road, Vadapalani, Chennai - 600026',
};
