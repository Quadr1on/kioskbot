'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import KioskKeyboard from './KioskKeyboard';
import KioskKeypad from './KioskKeypad';
import {
  departments,
  doctors,
  generateTimeSlots,
  type Department,
  type Doctor,
  type TimeSlot,
  type AppointmentData,
} from '@/lib/kioskData';

type AppointmentStep = 'name' | 'phone' | 'department' | 'doctor' | 'timeslot' | 'confirm' | 'success';

interface AppointmentFlowProps {
  onBack: () => void;
}

// Color scheme — black bg, blue accent
const C = {
  bg: '#000000',
  card: '#111111',
  border: '#1a1a1a',
  borderLight: '#222222',
  inner: '#0a0a0a',
  accent: '#3B82F6',
  accentDark: '#1D4ED8',
  accentGlow: 'rgba(59, 130, 246, 0.25)',
  accentSubtle: 'rgba(59, 130, 246, 0.1)',
  accentBorder: 'rgba(59, 130, 246, 0.3)',
  success: '#3B82F6',
  successDark: '#1D4ED8',
  text: '#ffffff',
  textSecondary: '#999999',
  textMuted: '#666666',
  disabled: '#1a1a1a',
  disabledText: '#444444',
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 400 : -400,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -400 : 400,
    opacity: 0,
    scale: 0.95,
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1 },
};

export default function AppointmentFlow({ onBack }: AppointmentFlowProps) {
  const [step, setStep] = useState<AppointmentStep>('name');
  const [direction, setDirection] = useState(1);
  const [appointment, setAppointment] = useState<AppointmentData>({
    patientName: '',
    phoneNumber: '',
    department: null,
    doctor: null,
    timeSlot: null,
  });
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (step === 'timeslot') {
      setTimeSlots(generateTimeSlots());
    }
  }, [step]);

  const filteredDoctors = useMemo(() => {
    if (!appointment.department) return [];
    return doctors.filter(d => d.departmentId === appointment.department!.id);
  }, [appointment.department]);

  const goNext = useCallback((nextStep: AppointmentStep) => {
    setDirection(1);
    setStep(nextStep);
  }, []);

  const goBack = useCallback((prevStep: AppointmentStep) => {
    setDirection(-1);
    setStep(prevStep);
  }, []);

  const handleNameKey = useCallback((key: string) => {
    setAppointment(prev => ({ ...prev, patientName: prev.patientName + key }));
  }, []);

  const handleNameBackspace = useCallback(() => {
    setAppointment(prev => ({ ...prev, patientName: prev.patientName.slice(0, -1) }));
  }, []);

  const handlePhoneKey = useCallback((key: string) => {
    setAppointment(prev => {
      if (prev.phoneNumber.length >= 10) return prev;
      return { ...prev, phoneNumber: prev.phoneNumber + key };
    });
  }, []);

  const handlePhoneBackspace = useCallback(() => {
    setAppointment(prev => ({ ...prev, phoneNumber: prev.phoneNumber.slice(0, -1) }));
  }, []);

  const selectDepartment = useCallback((dept: Department) => {
    setAppointment(prev => ({ ...prev, department: dept, doctor: null, timeSlot: null }));
    goNext('doctor');
  }, [goNext]);

  const selectDoctor = useCallback((doc: Doctor) => {
    setAppointment(prev => ({ ...prev, doctor: doc, timeSlot: null }));
    goNext('timeslot');
  }, [goNext]);

  const selectTimeSlot = useCallback((slot: TimeSlot) => {
    if (!slot.available) return;
    setAppointment(prev => ({ ...prev, timeSlot: slot }));
    goNext('confirm');
  }, [goNext]);

  const confirmAppointment = useCallback(() => {
    setShowConfetti(true);
    goNext('success');
    setTimeout(() => {
      onBack();
    }, 8000);
  }, [goNext, onBack]);

  const getStepNumber = () => {
    const steps: AppointmentStep[] = ['name', 'phone', 'department', 'doctor', 'timeslot', 'confirm'];
    const idx = steps.indexOf(step);
    return idx >= 0 ? idx + 1 : 0;
  };

  const totalSteps = 6;
  const progress = step === 'success' ? 100 : (getStepNumber() / totalSteps) * 100;

  const getBackStep = (): AppointmentStep | null => {
    switch (step) {
      case 'name': return null;
      case 'phone': return 'name';
      case 'department': return 'phone';
      case 'doctor': return 'department';
      case 'timeslot': return 'doctor';
      case 'confirm': return 'timeslot';
      default: return null;
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: C.bg,
      overflow: 'hidden',
    }}>
      {/* Header with back button and progress */}
      {step !== 'success' && (
        <motion.div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px 24px',
            gap: '16px',
            borderBottom: `1px solid ${C.border}`,
            flexShrink: 0,
          }}
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.button
            onClick={() => {
              const backStep = getBackStep();
              if (backStep) goBack(backStep);
              else onBack();
            }}
            style={{
              backgroundColor: C.card,
              border: `1px solid ${C.borderLight}`,
              borderRadius: '12px',
              color: C.text,
              padding: '10px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '15px',
              fontWeight: 500,
              minHeight: '44px',
              minWidth: '44px',
            }}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </motion.button>

          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '14px',
              color: C.textSecondary,
              marginBottom: '6px',
              fontWeight: 500,
            }}>
              Step {getStepNumber()} of {totalSteps}
            </div>
            <div style={{
              height: '6px',
              backgroundColor: C.card,
              borderRadius: '3px',
              overflow: 'hidden',
            }}>
              <motion.div
                style={{
                  height: '100%',
                  backgroundColor: C.accent,
                  borderRadius: '3px',
                }}
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Content area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <AnimatePresence mode="wait" custom={direction}>
          {/* Step 1: Patient Name */}
          {step === 'name' && (
            <motion.div
              key="name"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: '32px 24px 0',
              }}
            >
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  style={{ textAlign: 'center', marginBottom: '32px' }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
                  <h2 style={{ fontSize: '28px', fontWeight: 700, color: C.text, marginBottom: '8px' }}>
                    What&apos;s your name?
                  </h2>
                  <p style={{ fontSize: '16px', color: C.textSecondary }}>
                    Please enter your full name
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  style={{
                    width: '100%',
                    maxWidth: '600px',
                    backgroundColor: C.card,
                    borderRadius: '16px',
                    border: `2px solid ${C.accent}`,
                    padding: '20px 24px',
                    minHeight: '70px',
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '24px',
                  }}
                >
                  <span style={{
                    fontSize: '24px',
                    color: appointment.patientName ? C.text : C.textMuted,
                    fontWeight: 500,
                    letterSpacing: '0.5px',
                  }}>
                    {appointment.patientName || 'Tap keys to type...'}
                  </span>
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
                    style={{
                      width: '2px',
                      height: '28px',
                      backgroundColor: C.accent,
                      marginLeft: '2px',
                    }}
                  />
                </motion.div>

                <motion.button
                  onClick={() => appointment.patientName.trim().length >= 2 && goNext('phone')}
                  style={{
                    backgroundColor: appointment.patientName.trim().length >= 2 ? C.accent : C.disabled,
                    color: appointment.patientName.trim().length >= 2 ? C.text : C.disabledText,
                    border: 'none',
                    borderRadius: '14px',
                    padding: '16px 48px',
                    fontSize: '18px',
                    fontWeight: 600,
                    cursor: appointment.patientName.trim().length >= 2 ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    minHeight: '56px',
                  }}
                  whileTap={appointment.patientName.trim().length >= 2 ? { scale: 0.95 } : {}}
                >
                  Next →
                </motion.button>
              </div>

              <KioskKeyboard
                onKeyPress={handleNameKey}
                onBackspace={handleNameBackspace}
                onEnter={() => appointment.patientName.trim().length >= 2 && goNext('phone')}
                visible={true}
              />
            </motion.div>
          )}

          {/* Step 2: Phone Number */}
          {step === 'phone' && (
            <motion.div
              key="phone"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: '32px 24px',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '24px',
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center' }}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📱</div>
                <h2 style={{ fontSize: '28px', fontWeight: 700, color: C.text, marginBottom: '8px' }}>
                  Phone Number
                </h2>
                <p style={{ fontSize: '16px', color: C.textSecondary }}>
                  Enter your 10-digit mobile number
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                style={{
                  backgroundColor: C.card,
                  borderRadius: '16px',
                  border: `2px solid ${C.accent}`,
                  padding: '20px 32px',
                  minWidth: '350px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '14px', color: C.textSecondary, marginBottom: '8px' }}>+91</div>
                <div style={{
                  fontSize: '36px',
                  fontWeight: 700,
                  color: C.text,
                  letterSpacing: '4px',
                  fontVariantNumeric: 'tabular-nums',
                  minHeight: '44px',
                }}>
                  {appointment.phoneNumber
                    ? appointment.phoneNumber.replace(/(\d{5})(\d{0,5})/, '$1 $2').trim()
                    : '•••••  •••••'}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: appointment.phoneNumber.length === 10 ? C.accent : C.textMuted,
                  marginTop: '8px',
                  fontWeight: 500,
                }}>
                  {appointment.phoneNumber.length}/10 digits
                </div>
              </motion.div>

              <KioskKeypad
                onKeyPress={handlePhoneKey}
                onBackspace={handlePhoneBackspace}
                onEnter={() => appointment.phoneNumber.length === 10 && goNext('department')}
                visible={true}
              />

              <motion.button
                onClick={() => appointment.phoneNumber.length === 10 && goNext('department')}
                style={{
                  backgroundColor: appointment.phoneNumber.length === 10 ? C.accent : C.disabled,
                  color: appointment.phoneNumber.length === 10 ? C.text : C.disabledText,
                  border: 'none',
                  borderRadius: '14px',
                  padding: '16px 48px',
                  fontSize: '18px',
                  fontWeight: 600,
                  cursor: appointment.phoneNumber.length === 10 ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  minHeight: '56px',
                }}
                whileTap={appointment.phoneNumber.length === 10 ? { scale: 0.95 } : {}}
              >
                Next →
              </motion.button>
            </motion.div>
          )}

          {/* Step 3: Department Selection */}
          {step === 'department' && (
            <motion.div
              key="department"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: '32px 24px',
                overflowY: 'auto',
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', marginBottom: '32px' }}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏥</div>
                <h2 style={{ fontSize: '28px', fontWeight: 700, color: C.text, marginBottom: '8px' }}>
                  Select Department
                </h2>
                <p style={{ fontSize: '16px', color: C.textSecondary }}>
                  Choose the department for your appointment
                </p>
              </motion.div>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '16px',
                  maxWidth: '700px',
                  margin: '0 auto',
                  width: '100%',
                }}
              >
                {departments.map((dept) => (
                  <motion.button
                    key={dept.id}
                    variants={staggerItem}
                    onClick={() => selectDepartment(dept)}
                    style={{
                      backgroundColor: C.card,
                      border: `1px solid ${C.borderLight}`,
                      borderRadius: '20px',
                      padding: '24px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      minHeight: '80px',
                    }}
                    whileHover={{
                      borderColor: C.accent,
                      boxShadow: `0 8px 30px ${C.accentGlow}`,
                      scale: 1.02,
                    }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div style={{
                      fontSize: '36px',
                      width: '56px',
                      height: '56px',
                      borderRadius: '14px',
                      backgroundColor: C.accentSubtle,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {dept.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 600, color: C.text, marginBottom: '4px' }}>
                        {dept.name}
                      </div>
                      <div style={{ fontSize: '13px', color: C.textSecondary }}>
                        {dept.description}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* Step 4: Doctor Selection */}
          {step === 'doctor' && (
            <motion.div
              key="doctor"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: '32px 24px',
                overflowY: 'auto',
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', marginBottom: '32px' }}
              >
                <div style={{
                  fontSize: '36px',
                  marginBottom: '12px',
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  backgroundColor: C.accentSubtle,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  {appointment.department?.icon}
                </div>
                <h2 style={{ fontSize: '28px', fontWeight: 700, color: C.text, marginBottom: '8px' }}>
                  {appointment.department?.name}
                </h2>
                <p style={{ fontSize: '16px', color: C.textSecondary }}>
                  Select your preferred doctor
                </p>
              </motion.div>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate="show"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  maxWidth: '600px',
                  margin: '0 auto',
                  width: '100%',
                }}
              >
                {filteredDoctors.map((doc) => (
                  <motion.button
                    key={doc.id}
                    variants={staggerItem}
                    onClick={() => selectDoctor(doc)}
                    style={{
                      backgroundColor: C.card,
                      border: `1px solid ${C.borderLight}`,
                      borderRadius: '20px',
                      padding: '24px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '20px',
                      minHeight: '100px',
                    }}
                    whileHover={{
                      borderColor: C.accent,
                      boxShadow: `0 8px 30px ${C.accentGlow}`,
                      scale: 1.02,
                    }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${C.accent}60, ${C.accentDark}30)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '28px',
                      flexShrink: 0,
                    }}>
                      👨‍⚕️
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '20px', fontWeight: 600, color: C.text, marginBottom: '4px' }}>
                        {doc.name}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: C.accent,
                        fontWeight: 500,
                        marginBottom: '4px',
                      }}>
                        {doc.designation}
                      </div>
                      <div style={{ fontSize: '13px', color: C.textSecondary }}>
                        {doc.degree}
                      </div>
                    </div>
                    <svg width="24" height="24" fill="none" stroke={C.textMuted} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* Step 5: Time Slot Selection */}
          {step === 'timeslot' && (
            <motion.div
              key="timeslot"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: '32px 24px',
                overflowY: 'auto',
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', marginBottom: '32px' }}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🕐</div>
                <h2 style={{ fontSize: '28px', fontWeight: 700, color: C.text, marginBottom: '8px' }}>
                  Select Time Slot
                </h2>
                <p style={{ fontSize: '16px', color: C.textSecondary }}>
                  Choose an available time with {appointment.doctor?.name}
                </p>
              </motion.div>

              <div style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
                <div style={{ fontSize: '14px', color: C.textSecondary, fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  ☀️ Morning
                </div>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '12px',
                    marginBottom: '28px',
                  }}
                >
                  {timeSlots.filter(s => s.time.includes('AM')).map((slot) => (
                    <motion.button
                      key={slot.id}
                      variants={staggerItem}
                      onClick={() => selectTimeSlot(slot)}
                      disabled={!slot.available}
                      style={{
                        backgroundColor: !slot.available ? C.disabled : appointment.timeSlot?.id === slot.id ? C.accent : C.card,
                        border: `1px solid ${!slot.available ? C.border : appointment.timeSlot?.id === slot.id ? C.accent : C.borderLight}`,
                        borderRadius: '14px',
                        padding: '16px 12px',
                        cursor: slot.available ? 'pointer' : 'not-allowed',
                        opacity: slot.available ? 1 : 0.4,
                        fontSize: '15px',
                        fontWeight: 600,
                        color: slot.available ? C.text : C.disabledText,
                        minHeight: '52px',
                        textDecoration: !slot.available ? 'line-through' : 'none',
                      }}
                      whileHover={slot.available ? { scale: 1.05, borderColor: C.accent } : {}}
                      whileTap={slot.available ? { scale: 0.95 } : {}}
                    >
                      {slot.time.replace(' AM', '')}
                      <div style={{ fontSize: '11px', color: slot.available ? C.textSecondary : C.disabledText, marginTop: '2px' }}>AM</div>
                    </motion.button>
                  ))}
                </motion.div>

                <div style={{ fontSize: '14px', color: C.textSecondary, fontWeight: 600, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  🌤️ Afternoon
                </div>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '12px',
                  }}
                >
                  {timeSlots.filter(s => s.time.includes('PM')).map((slot) => (
                    <motion.button
                      key={slot.id}
                      variants={staggerItem}
                      onClick={() => selectTimeSlot(slot)}
                      disabled={!slot.available}
                      style={{
                        backgroundColor: !slot.available ? C.disabled : appointment.timeSlot?.id === slot.id ? C.accent : C.card,
                        border: `1px solid ${!slot.available ? C.border : appointment.timeSlot?.id === slot.id ? C.accent : C.borderLight}`,
                        borderRadius: '14px',
                        padding: '16px 12px',
                        cursor: slot.available ? 'pointer' : 'not-allowed',
                        opacity: slot.available ? 1 : 0.4,
                        fontSize: '15px',
                        fontWeight: 600,
                        color: slot.available ? C.text : C.disabledText,
                        minHeight: '52px',
                        textDecoration: !slot.available ? 'line-through' : 'none',
                      }}
                      whileHover={slot.available ? { scale: 1.05, borderColor: C.accent } : {}}
                      whileTap={slot.available ? { scale: 0.95 } : {}}
                    >
                      {slot.time.replace(' PM', '')}
                      <div style={{ fontSize: '11px', color: slot.available ? C.textSecondary : C.disabledText, marginTop: '2px' }}>PM</div>
                    </motion.button>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Step 6: Confirmation */}
          {step === 'confirm' && (
            <motion.div
              key="confirm"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: '32px 24px',
                alignItems: 'center',
                justifyContent: 'center',
                overflowY: 'auto',
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', marginBottom: '32px' }}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                <h2 style={{ fontSize: '28px', fontWeight: 700, color: C.text, marginBottom: '8px' }}>
                  Confirm Appointment
                </h2>
                <p style={{ fontSize: '16px', color: C.textSecondary }}>
                  Please review your appointment details
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                style={{
                  backgroundColor: C.card,
                  borderRadius: '24px',
                  border: `1px solid ${C.borderLight}`,
                  padding: '32px',
                  maxWidth: '500px',
                  width: '100%',
                  marginBottom: '32px',
                }}
              >
                {[
                  { label: 'Patient Name', value: appointment.patientName, icon: '👤' },
                  { label: 'Phone Number', value: `+91 ${appointment.phoneNumber}`, icon: '📱' },
                  { label: 'Department', value: appointment.department?.name || '', icon: appointment.department?.icon || '' },
                  { label: 'Doctor', value: appointment.doctor?.name || '', icon: '👨‍⚕️' },
                  { label: 'Designation', value: appointment.doctor?.designation || '', icon: '🏷️' },
                  { label: 'Time Slot', value: appointment.timeSlot?.time || '', icon: '🕐' },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.08 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '14px 0',
                      borderBottom: index < 5 ? `1px solid ${C.border}` : 'none',
                      gap: '12px',
                    }}
                  >
                    <span style={{ fontSize: '20px', width: '32px' }}>{item.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', color: C.textMuted, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '17px', color: C.text, fontWeight: 500, marginTop: '2px' }}>
                        {item.value}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <div style={{ display: 'flex', gap: '16px', width: '100%', maxWidth: '500px' }}>
                <motion.button
                  onClick={() => goBack('timeslot')}
                  style={{
                    flex: 1,
                    backgroundColor: C.card,
                    color: C.text,
                    border: `1px solid ${C.borderLight}`,
                    borderRadius: '14px',
                    padding: '18px',
                    fontSize: '17px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    minHeight: '56px',
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  Edit
                </motion.button>
                <motion.button
                  onClick={confirmAppointment}
                  style={{
                    flex: 2,
                    background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,
                    color: C.text,
                    border: 'none',
                    borderRadius: '14px',
                    padding: '18px',
                    fontSize: '17px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: `0 10px 30px ${C.accentGlow}`,
                    minHeight: '56px',
                  }}
                  whileHover={{ scale: 1.02, boxShadow: `0 15px 40px rgba(59, 130, 246, 0.4)` }}
                  whileTap={{ scale: 0.97 }}
                >
                  ✓ Confirm Appointment
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 7: Success */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '32px 24px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {showConfetti && (
                <>
                  {Array.from({ length: 40 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                      animate={{
                        x: (Math.random() - 0.5) * 600,
                        y: (Math.random() - 0.5) * 600,
                        scale: [0, 1, 0.5],
                        opacity: [1, 1, 0],
                        rotate: Math.random() * 720,
                      }}
                      transition={{ duration: 2, delay: Math.random() * 0.5, ease: 'easeOut' }}
                      style={{
                        position: 'absolute',
                        width: `${8 + Math.random() * 12}px`,
                        height: `${8 + Math.random() * 12}px`,
                        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                        backgroundColor: ['#3B82F6', '#60A5FA', '#93C5FD', '#1D4ED8', '#2563EB', '#DBEAFE'][Math.floor(Math.random() * 6)],
                        zIndex: 10,
                      }}
                    />
                  ))}
                </>
              )}

              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 150, delay: 0.2 }}
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '32px',
                  boxShadow: `0 20px 60px ${C.accentGlow}`,
                }}
              >
                <motion.svg
                  width="60"
                  height="60"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  <motion.path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                  />
                </motion.svg>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: C.text,
                  marginBottom: '12px',
                  textAlign: 'center',
                }}
              >
                Appointment Booked! 🎉
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                style={{ fontSize: '16px', color: C.textSecondary, textAlign: 'center', maxWidth: '400px', lineHeight: 1.6, marginBottom: '32px' }}
              >
                Your appointment with <span style={{ color: C.accent, fontWeight: 600 }}>{appointment.doctor?.name}</span> has been successfully scheduled for <span style={{ color: C.accent, fontWeight: 600 }}>{appointment.timeSlot?.time}</span>
              </motion.p>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                style={{
                  backgroundColor: C.card,
                  borderRadius: '20px',
                  border: `1px solid ${C.borderLight}`,
                  padding: '24px',
                  maxWidth: '400px',
                  width: '100%',
                  marginBottom: '32px',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {[
                    { label: 'Patient', value: appointment.patientName },
                    { label: 'Phone', value: `+91 ${appointment.phoneNumber}` },
                    { label: 'Department', value: appointment.department?.name },
                    { label: 'Time', value: appointment.timeSlot?.time },
                  ].map((item) => (
                    <div key={item.label}>
                      <div style={{ fontSize: '12px', color: C.textMuted, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '15px', color: C.text, fontWeight: 500, marginTop: '4px' }}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                onClick={onBack}
                style={{
                  background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,
                  color: C.text,
                  border: 'none',
                  borderRadius: '14px',
                  padding: '18px 48px',
                  fontSize: '17px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: `0 10px 30px ${C.accentGlow}`,
                  minHeight: '56px',
                }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                Return to Home
              </motion.button>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                style={{ fontSize: '13px', color: C.textMuted, marginTop: '16px' }}
              >
                Auto-redirecting in a few seconds...
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
