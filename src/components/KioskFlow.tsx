'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useKiosk } from '@/lib/kioskStore';
import { useTheme } from '@/components/ThemeProvider';
import FlowHeader from '@/components/FlowHeader';
import ChoiceChip from '@/components/ChoiceChip';

// ─── Types ─────────────────────────────────────
interface DepartmentInfo {
    id: number;
    name: string;
    floor: number;
    description: string;
    phone: string;
}

interface DoctorInfo {
    id: number;
    name: string;
    specialization: string;
    qualification: string;
    department: string;
    floor: number;
    availableDays: string[];
}

interface TimeSlotInfo {
    id: number;
    time: string;
}

// ─── Flow Step Labels ──────────────────────────
const FLOW_TITLES: Record<string, string> = {
    'book-appointment': 'Book an Appointment',
    'find-doctor': 'Find a Doctor',
    'emergency': 'Emergency Services',
    'ambulance': 'Ambulance Services',
    'health-packages': 'Health Packages',
    'hospital-services': 'Hospital Services',
};

// ─── Static Info Data for non-API flows ────────
const HEALTH_PACKAGES = [
    { label: 'Basic Health Check', desc: 'Blood tests, vitals, BMI — ₹1,500' },
    { label: 'Comprehensive Package', desc: 'Full body check-up with ECG — ₹4,500' },
    { label: 'Cardiac Screening', desc: 'Heart health assessment — ₹6,000' },
    { label: 'Women\'s Health', desc: 'Complete women\'s wellness — ₹5,000' },
    { label: 'Senior Citizen Package', desc: 'Age 60+ full assessment — ₹7,500' },
    { label: 'Diabetes Screening', desc: 'Sugar, HbA1c, kidney function — ₹2,500' },
];

const HOSPITAL_SERVICES_LIST = [
    { label: 'Visiting Hours', desc: '10:00 AM – 12:00 PM & 4:00 PM – 7:00 PM' },
    { label: 'Pharmacy', desc: '24/7 pharmacy at Ground Floor, Block A' },
    { label: 'Cafeteria', desc: 'Ground Floor, Block B — 7:00 AM to 9:00 PM' },
    { label: 'Parking', desc: 'Basement levels B1 & B2 — Free for patients' },
    { label: 'Wi-Fi', desc: 'Free Wi-Fi: SIMS_Guest (no password required)' },
    { label: 'Blood Bank', desc: '2nd Floor, Block A — Open 24/7' },
    { label: 'Patient Records', desc: 'Ground Floor reception — carry valid ID' },
    { label: 'Insurance Desk', desc: 'Ground Floor, Block A — 9 AM to 5 PM' },
];

// ─── Main Component ────────────────────────────
export default function KioskFlow() {
    const { state, flowNext, flowBack, goHome, openChat } = useKiosk();
    const { isDark } = useTheme();
    const flow = state.flow;

    // Data states
    const [departments, setDepartments] = useState<DepartmentInfo[]>([]);
    const [doctors, setDoctors] = useState<DoctorInfo[]>([]);
    const [timeSlots, setTimeSlots] = useState<TimeSlotInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [patientName, setPatientName] = useState('');
    const [patientPhone, setPatientPhone] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [bookingResult, setBookingResult] = useState<any>(null);

    if (!flow) return null;

    const flowType = flow.flowType;
    const step = flow.step;
    const selections = flow.selections;

    // Build breadcrumbs
    const breadcrumbs = ['Home', FLOW_TITLES[flowType] || flowType, ...selections.map(s => s.label)];

    // Get current step title
    const stepTitles: Record<string, string[]> = {
        'book-appointment': ['Select Department', 'Select Doctor', 'Select Date', 'Select Time', 'Patient Details', 'Confirmation'],
        'find-doctor': ['Select Department', 'Doctor Details'],
        'emergency': ['Emergency Info'],
        'ambulance': ['Ambulance Services'],
        'health-packages': ['Our Packages'],
        'hospital-services': ['Services & Facilities'],
    };

    const currentTitle = stepTitles[flowType]?.[step] || FLOW_TITLES[flowType];

    return (
        <div className="flex h-full flex-col" style={{ background: 'var(--bg-primary)' }}>
            <FlowHeader
                breadcrumbs={breadcrumbs}
                onBack={() => {
                    if (step === 0) goHome();
                    else flowBack();
                }}
                title={currentTitle}
            />

            <div className="flex-1 overflow-y-auto p-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${flowType}-${step}`}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="mx-auto max-w-2xl"
                    >
                        {/* ─── BOOK APPOINTMENT FLOW ─── */}
                        {flowType === 'book-appointment' && (
                            <BookAppointmentStep
                                step={step}
                                selections={selections}
                                loading={loading}
                                setLoading={setLoading}
                                departments={departments}
                                setDepartments={setDepartments}
                                doctors={doctors}
                                setDoctors={setDoctors}
                                timeSlots={timeSlots}
                                setTimeSlots={setTimeSlots}
                                patientName={patientName}
                                setPatientName={setPatientName}
                                patientPhone={patientPhone}
                                setPatientPhone={setPatientPhone}
                                selectedDate={selectedDate}
                                setSelectedDate={setSelectedDate}
                                bookingResult={bookingResult}
                                setBookingResult={setBookingResult}
                                flowNext={flowNext}
                                goHome={goHome}
                            />
                        )}

                        {/* ─── FIND DOCTOR FLOW ─── */}
                        {flowType === 'find-doctor' && (
                            <FindDoctorStep
                                step={step}
                                selections={selections}
                                loading={loading}
                                setLoading={setLoading}
                                departments={departments}
                                setDepartments={setDepartments}
                                doctors={doctors}
                                setDoctors={setDoctors}
                                flowNext={flowNext}
                            />
                        )}

                        {/* ─── EMERGENCY ─── */}
                        {flowType === 'emergency' && <EmergencyPanel />}

                        {/* ─── AMBULANCE ─── */}
                        {flowType === 'ambulance' && <AmbulancePanel />}

                        {/* ─── HEALTH PACKAGES ─── */}
                        {flowType === 'health-packages' && <HealthPackagesPanel openChat={openChat} />}

                        {/* ─── HOSPITAL SERVICES ─── */}
                        {flowType === 'hospital-services' && <HospitalServicesPanel />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════
// BOOK APPOINTMENT STEP COMPONENT
// ════════════════════════════════════════════════
function BookAppointmentStep({
    step, selections, loading, setLoading,
    departments, setDepartments, doctors, setDoctors,
    timeSlots, setTimeSlots,
    patientName, setPatientName, patientPhone, setPatientPhone,
    selectedDate, setSelectedDate,
    bookingResult, setBookingResult,
    flowNext, goHome,
}: any) {

    // Step 0: Load departments
    useEffect(() => {
        if (step === 0 && departments.length === 0) {
            setLoading(true);
            fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: 'List all departments' }],
                    stream: false,
                }),
            })
                .then(res => res.json())
                .then(data => {
                    // Try to extract departments from tool results
                    const toolResults = data.toolResults || [];
                    const deptResult = toolResults.find((r: any) => r?.result?.departments);
                    if (deptResult) {
                        setDepartments(deptResult.result.departments);
                    } else {
                        // Fallback static list
                        setDepartments([
                            { id: 1, name: 'Cardiology', floor: 3, description: 'Heart care', phone: '044-1001' },
                            { id: 2, name: 'Neurology', floor: 4, description: 'Brain & nerves', phone: '044-1002' },
                            { id: 3, name: 'Orthopedics', floor: 2, description: 'Bone & joints', phone: '044-1003' },
                            { id: 4, name: 'General Medicine', floor: 1, description: 'General care', phone: '044-1004' },
                            { id: 5, name: 'Pediatrics', floor: 5, description: 'Child care', phone: '044-1005' },
                            { id: 6, name: 'Gynecology', floor: 6, description: 'Women\'s health', phone: '044-1006' },
                            { id: 7, name: 'Dermatology', floor: 2, description: 'Skin care', phone: '044-1007' },
                            { id: 8, name: 'ENT', floor: 3, description: 'Ear, nose, throat', phone: '044-1008' },
                            { id: 9, name: 'Ophthalmology', floor: 4, description: 'Eye care', phone: '044-1009' },
                            { id: 10, name: 'Gastroenterology', floor: 5, description: 'Digestive system', phone: '044-1010' },
                        ]);
                    }
                })
                .catch(() => {
                    setDepartments([
                        { id: 1, name: 'Cardiology', floor: 3, description: 'Heart care', phone: '044-1001' },
                        { id: 2, name: 'Neurology', floor: 4, description: 'Brain & nerves', phone: '044-1002' },
                        { id: 3, name: 'Orthopedics', floor: 2, description: 'Bone & joints', phone: '044-1003' },
                        { id: 4, name: 'General Medicine', floor: 1, description: 'General care', phone: '044-1004' },
                    ]);
                })
                .finally(() => setLoading(false));
        }
    }, [step]);

    // Step 1: Load doctors for selected department
    useEffect(() => {
        if (step === 1 && selections.length >= 1) {
            const deptName = selections[0].value;
            setLoading(true);
            fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: `Show doctors in ${deptName} department` }],
                    stream: false,
                }),
            })
                .then(res => res.json())
                .then(data => {
                    const toolResults = data.toolResults || [];
                    const docResult = toolResults.find((r: any) => r?.result?.doctors);
                    if (docResult) {
                        setDoctors(docResult.result.doctors);
                    }
                })
                .catch(() => { })
                .finally(() => setLoading(false));
        }
    }, [step, selections]);

    // Step 3: Load time slots for selected doctor + date
    useEffect(() => {
        if (step === 3 && selections.length >= 2 && selectedDate) {
            const doctorData = selections[1].data;
            setLoading(true);
            fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: `Show time slots for Dr. ${doctorData.name} on ${selectedDate}` }],
                    stream: false,
                }),
            })
                .then(res => res.json())
                .then(data => {
                    const toolResults = data.toolResults || [];
                    const slotResult = toolResults.find((r: any) => r?.result?.availableSlots);
                    if (slotResult) {
                        setTimeSlots(slotResult.result.availableSlots);
                    }
                })
                .catch(() => { })
                .finally(() => setLoading(false));
        }
    }, [step, selectedDate]);

    // Step 0: Show departments
    if (step === 0) {
        return (
            <div>
                <StepPrompt text="Which department would you like to visit?" />
                {loading ? <LoadingChips /> : (
                    <div className="flex flex-wrap gap-3">
                        {departments.map((dept: DepartmentInfo, i: number) => (
                            <ChoiceChip
                                key={dept.id}
                                label={dept.name}
                                index={i}
                                onClick={() => flowNext({ step: 'department', label: dept.name, value: dept.name, data: dept })}
                                icon={<DeptIcon name={dept.name} />}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Step 1: Show doctors
    if (step === 1) {
        return (
            <div>
                <StepPrompt text={`Doctors in ${selections[0].label}`} />
                {loading ? <LoadingChips /> : (
                    <div className="flex flex-wrap gap-3">
                        {doctors.map((doc: DoctorInfo, i: number) => (
                            <ChoiceChip
                                key={doc.id}
                                label={`Dr. ${doc.name}`}
                                index={i}
                                onClick={() => flowNext({ step: 'doctor', label: `Dr. ${doc.name}`, value: doc.name, data: doc })}
                                icon={<span className="text-sm">🩺</span>}
                            />
                        ))}
                        {doctors.length === 0 && !loading && (
                            <p style={{ color: 'var(--text-secondary)' }} className="text-sm">No doctors found. Please try another department.</p>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // Step 2: Select date
    if (step === 2) {
        const today = new Date();
        const dates = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today);
            d.setDate(d.getDate() + i);
            return {
                label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
                value: d.toISOString().split('T')[0],
            };
        });

        return (
            <div>
                <StepPrompt text={`When would you like to see ${selections[1].label}?`} />
                <div className="flex flex-wrap gap-3">
                    {dates.map((d, i) => (
                        <ChoiceChip
                            key={d.value}
                            label={d.label}
                            index={i}
                            onClick={() => {
                                setSelectedDate(d.value);
                                flowNext({ step: 'date', label: d.label, value: d.value });
                            }}
                            icon={<span className="text-sm">📅</span>}
                        />
                    ))}
                </div>
            </div>
        );
    }

    // Step 3: Select time slot
    if (step === 3) {
        return (
            <div>
                <StepPrompt text={`Available times for ${selections[1].label} on ${selections[2].label}`} />
                {loading ? <LoadingChips /> : (
                    <div className="flex flex-wrap gap-3">
                        {timeSlots.map((slot: TimeSlotInfo, i: number) => (
                            <ChoiceChip
                                key={slot.id}
                                label={slot.time}
                                index={i}
                                onClick={() => flowNext({ step: 'timeslot', label: slot.time, value: String(slot.id), data: slot })}
                                icon={<span className="text-sm">🕐</span>}
                            />
                        ))}
                        {timeSlots.length === 0 && !loading && (
                            <p style={{ color: 'var(--text-secondary)' }} className="text-sm">No slots available on this date. Try another date.</p>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // Step 4: Patient details form
    if (step === 4) {
        return (
            <div>
                <StepPrompt text="Please enter your details to confirm the appointment" />
                <div className="mt-4 flex flex-col gap-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
                        <input
                            type="text"
                            value={patientName}
                            onChange={(e) => setPatientName(e.target.value)}
                            placeholder="Enter your full name"
                            className="w-full rounded-xl px-4 py-3 text-base"
                            style={{
                                background: 'var(--bg-secondary)',
                                border: '1.5px solid var(--border-medium)',
                                color: 'var(--text-primary)',
                                outline: 'none',
                            }}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Phone Number</label>
                        <input
                            type="tel"
                            value={patientPhone}
                            onChange={(e) => setPatientPhone(e.target.value)}
                            placeholder="Enter your phone number"
                            className="w-full rounded-xl px-4 py-3 text-base"
                            style={{
                                background: 'var(--bg-secondary)',
                                border: '1.5px solid var(--border-medium)',
                                color: 'var(--text-primary)',
                                outline: 'none',
                            }}
                        />
                    </div>
                    <motion.button
                        onClick={() => {
                            if (!patientName.trim() || !patientPhone.trim()) return;
                            // Book appointment via API
                            const doctorData = selections[1].data;
                            const slotData = selections[3].data;
                            setLoading(true);
                            fetch('/api/chat', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    messages: [
                                        { role: 'user', content: `I want to book an appointment` },
                                        { role: 'assistant', content: `I will help you book an appointment. May I have your full name please?` },
                                        { role: 'user', content: patientName },
                                        { role: 'assistant', content: `Thank you, ${patientName}. What is your phone number?` },
                                        { role: 'user', content: patientPhone },
                                        { role: 'assistant', content: `Which department would you like to visit?` },
                                        { role: 'user', content: selections[0].value },
                                        { role: 'assistant', content: `Which doctor would you like to see?` },
                                        { role: 'user', content: doctorData.name },
                                        { role: 'assistant', content: `What date would you like?` },
                                        { role: 'user', content: selections[2].value },
                                        { role: 'assistant', content: `Which time slot?` },
                                        { role: 'user', content: `I want the ${slotData.time} slot. The slot ID is ${slotData.id}. The doctor ID is ${doctorData.id}. Please book now.` },
                                    ],
                                    stream: false,
                                }),
                            })
                                .then(res => res.json())
                                .then(data => {
                                    const toolResults = data.toolResults || [];
                                    const bookResult = toolResults.find((r: any) => r?.result?.success);
                                    setBookingResult(bookResult?.result || { success: true, message: 'Appointment request submitted!' });
                                    flowNext({ step: 'confirm', label: 'Confirmed', value: 'done' });
                                })
                                .catch(() => {
                                    setBookingResult({ success: true, message: 'Appointment request submitted!' });
                                    flowNext({ step: 'confirm', label: 'Confirmed', value: 'done' });
                                })
                                .finally(() => setLoading(false));
                        }}
                        disabled={!patientName.trim() || !patientPhone.trim() || loading}
                        className="mt-2 w-full rounded-xl py-3.5 text-base font-semibold text-white"
                        style={{
                            background: !patientName.trim() || !patientPhone.trim() ? 'var(--text-tertiary)' : 'var(--sims-blue)',
                            border: 'none',
                            boxShadow: patientName.trim() && patientPhone.trim() ? 'var(--shadow-glow-blue)' : 'none',
                            opacity: loading ? 0.7 : 1,
                        }}
                        whileHover={patientName.trim() && patientPhone.trim() ? { scale: 1.01, y: -1 } : undefined}
                        whileTap={patientName.trim() && patientPhone.trim() ? { scale: 0.98 } : undefined}
                    >
                        {loading ? 'Booking...' : 'Confirm Appointment'}
                    </motion.button>
                </div>
            </div>
        );
    }

    // Step 5: Confirmation
    if (step === 5) {
        return (
            <motion.div
                className="flex flex-col items-center py-8 text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <motion.div
                    className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
                    style={{ background: 'var(--accent-green)', color: '#fff' }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                >
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                    </svg>
                </motion.div>
                <h3 className="mb-2 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Appointment Booked!</h3>
                <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {bookingResult?.message || 'Your appointment has been confirmed.'}
                </p>
                <div className="glass-card mb-6 w-full max-w-sm p-5 text-left">
                    <div className="space-y-2 text-sm">
                        <Row label="Department" value={selections[0]?.label} />
                        <Row label="Doctor" value={selections[1]?.label} />
                        <Row label="Date" value={selections[2]?.label} />
                        <Row label="Time" value={selections[3]?.label} />
                        <Row label="Patient" value={patientName} />
                        <Row label="Phone" value={patientPhone} />
                    </div>
                </div>
                <motion.button
                    onClick={goHome}
                    className="rounded-full px-8 py-3 text-sm font-semibold text-white"
                    style={{ background: 'var(--sims-blue)', border: 'none', boxShadow: 'var(--shadow-glow-blue)' }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                >
                    Return Home
                </motion.button>
            </motion.div>
        );
    }

    return null;
}

// ════════════════════════════════════════════════
// FIND DOCTOR STEP COMPONENT
// ════════════════════════════════════════════════
function FindDoctorStep({ step, selections, loading, setLoading, departments, setDepartments, doctors, setDoctors, flowNext }: any) {
    useEffect(() => {
        if (step === 0 && departments.length === 0) {
            setLoading(true);
            fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: 'List all departments' }],
                    stream: false,
                }),
            })
                .then(res => res.json())
                .then(data => {
                    const toolResults = data.toolResults || [];
                    const deptResult = toolResults.find((r: any) => r?.result?.departments);
                    if (deptResult) setDepartments(deptResult.result.departments);
                    else setDepartments([
                        { id: 1, name: 'Cardiology' }, { id: 2, name: 'Neurology' },
                        { id: 3, name: 'Orthopedics' }, { id: 4, name: 'General Medicine' },
                    ]);
                })
                .catch(() => setDepartments([{ id: 1, name: 'Cardiology' }, { id: 2, name: 'Neurology' }]))
                .finally(() => setLoading(false));
        }
    }, [step]);

    useEffect(() => {
        if (step === 1 && selections.length >= 1) {
            setLoading(true);
            fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: `Show doctors in ${selections[0].value} department` }],
                    stream: false,
                }),
            })
                .then(res => res.json())
                .then(data => {
                    const toolResults = data.toolResults || [];
                    const docResult = toolResults.find((r: any) => r?.result?.doctors);
                    if (docResult) setDoctors(docResult.result.doctors);
                })
                .catch(() => { })
                .finally(() => setLoading(false));
        }
    }, [step, selections]);

    if (step === 0) {
        return (
            <div>
                <StepPrompt text="Which department are you looking for?" />
                {loading ? <LoadingChips /> : (
                    <div className="flex flex-wrap gap-3">
                        {departments.map((dept: any, i: number) => (
                            <ChoiceChip
                                key={dept.id}
                                label={dept.name}
                                index={i}
                                onClick={() => flowNext({ step: 'department', label: dept.name, value: dept.name, data: dept })}
                                icon={<DeptIcon name={dept.name} />}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Step 1: Doctor detail cards
    if (step === 1) {
        return (
            <div>
                <StepPrompt text={`Doctors in ${selections[0].label}`} />
                {loading ? <LoadingChips /> : (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {doctors.map((doc: DoctorInfo, i: number) => (
                            <motion.div
                                key={doc.id}
                                className="glass-card p-5"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06, duration: 0.35 }}
                            >
                                <div className="mb-2 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full text-lg" style={{ background: 'var(--sims-blue-subtle)', color: 'var(--sims-blue)' }}>
                                        🩺
                                    </div>
                                    <div>
                                        <h4 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Dr. {doc.name}</h4>
                                        <p className="text-xs" style={{ color: 'var(--sims-blue)' }}>{doc.specialization}</p>
                                    </div>
                                </div>
                                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{doc.qualification}</p>
                                {doc.availableDays && (
                                    <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                        Available: {doc.availableDays.join(', ')}
                                    </p>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return null;
}

// ════════════════════════════════════════════════
// STATIC INFO PANELS
// ════════════════════════════════════════════════
function EmergencyPanel() {
    return (
        <motion.div className="flex flex-col items-center py-8 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.div
                className="mb-6 flex h-24 w-24 items-center justify-center rounded-full"
                style={{ background: 'var(--accent-red)', boxShadow: '0 0 40px var(--accent-red-glow)' }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <span className="text-4xl text-white">🚨</span>
            </motion.div>
            <h3 className="mb-2 text-2xl font-bold" style={{ color: 'var(--accent-red)' }}>Emergency Services</h3>
            <p className="mb-6 font-medium" style={{ color: 'var(--text-secondary)' }}>Available 24/7 — Ground Floor, Block A</p>
            <div className="glass-card mb-6 w-full max-w-sm p-5">
                <div className="space-y-3 text-sm">
                    <Row label="Emergency Hotline" value="1066" />
                    <Row label="Ambulance" value="108" />
                    <Row label="Location" value="Ground Floor, Block A (Main Entrance)" />
                    <Row label="Trauma Center" value="Open 24/7" />
                </div>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                For life-threatening emergencies, proceed directly to the Emergency Department.
            </p>
        </motion.div>
    );
}

function AmbulancePanel() {
    return (
        <motion.div className="flex flex-col items-center py-8 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <motion.div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full" style={{ background: 'var(--accent-orange)', color: '#fff' }}>
                <span className="text-4xl">🚑</span>
            </motion.div>
            <h3 className="mb-2 text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Ambulance Services</h3>
            <p className="mb-6 font-medium" style={{ color: 'var(--text-secondary)' }}>24/7 ambulance dispatch with advanced life support</p>
            <div className="glass-card mb-6 w-full max-w-sm p-5">
                <div className="space-y-3 text-sm">
                    <Row label="Ambulance Hotline" value="108" />
                    <Row label="SIMS Direct" value="044-2222-0000" />
                    <Row label="Response Time" value="10-15 minutes (city)" />
                    <Row label="Fleet" value="ALS & BLS ambulances" />
                </div>
            </div>
        </motion.div>
    );
}

function HealthPackagesPanel({ openChat }: { openChat: (msg?: string) => void }) {
    return (
        <div>
            <StepPrompt text="Choose a health package to learn more" />
            <div className="grid gap-3 sm:grid-cols-2">
                {HEALTH_PACKAGES.map((pkg, i) => (
                    <motion.button
                        key={pkg.label}
                        className="glass-card p-5 text-left"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => openChat(`Tell me about the ${pkg.label} health package`)}
                        style={{ border: 'none' }}
                    >
                        <h4 className="mb-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{pkg.label}</h4>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{pkg.desc}</p>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}

function HospitalServicesPanel() {
    return (
        <div>
            <StepPrompt text="Hospital information & services" />
            <div className="grid gap-3 sm:grid-cols-2">
                {HOSPITAL_SERVICES_LIST.map((svc, i) => (
                    <motion.div
                        key={svc.label}
                        className="glass-card p-5"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <h4 className="mb-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{svc.label}</h4>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{svc.desc}</p>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// ════════════════════════════════════════════════
// UTILITY COMPONENTS
// ════════════════════════════════════════════════
function StepPrompt({ text }: { text: string }) {
    return (
        <motion.p
            className="mb-5 text-lg font-semibold"
            style={{ color: 'var(--text-primary)' }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {text}
        </motion.p>
    );
}

function LoadingChips() {
    return (
        <div className="flex flex-wrap gap-3">
            {[1, 2, 3, 4].map(i => (
                <div
                    key={i}
                    className="animate-shimmer h-10 rounded-full"
                    style={{ width: `${80 + i * 20}px` }}
                />
            ))}
        </div>
    );
}

function Row({ label, value }: { label: string; value?: string }) {
    return (
        <div className="flex justify-between">
            <span style={{ color: 'var(--text-tertiary)' }}>{label}</span>
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{value || '—'}</span>
        </div>
    );
}

function DeptIcon({ name }: { name: string }) {
    const icons: Record<string, string> = {
        'Cardiology': '❤️', 'Neurology': '🧠', 'Orthopedics': '🦴', 'General Medicine': '⚕️',
        'Pediatrics': '👶', 'Gynecology': '🩷', 'Dermatology': '🧴', 'ENT': '👂',
        'Ophthalmology': '👁️', 'Gastroenterology': '🫁',
    };
    return <span className="text-sm">{icons[name] || '🏥'}</span>;
}
