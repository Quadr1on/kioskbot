'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppointmentFlow from './AppointmentFlow';
import { kioskServices, visitingHoursData, hospitalInfoData } from '@/lib/kioskData';

type KioskView = 'services' | 'book-appointment' | 'visiting-hours' | 'find-patient' | 'emergency' | 'pharmacy' | 'hospital-info';

interface KioskModeProps {
  onBack: () => void;
}

// Color scheme
const C = {
  bg: '#000000',
  card: '#111111',
  cardHover: '#161616',
  border: '#1a1a1a',
  borderLight: '#222222',
  inner: '#0a0a0a',
  accent: '#3B82F6',
  accentDark: '#1D4ED8',
  accentGlow: 'rgba(59, 130, 246, 0.25)',
  accentSubtle: 'rgba(59, 130, 246, 0.1)',
  accentBorder: 'rgba(59, 130, 246, 0.3)',
  text: '#ffffff',
  textSecondary: '#999999',
  textMuted: '#666666',
};

// First-load stagger (slow, fancy)
const staggerContainerFirst = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const staggerItemFirst = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      damping: 20,
      stiffness: 200,
    },
  },
};

// Return stagger (instant, no delay)
const staggerContainerReturn = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0,
      delayChildren: 0,
    },
  },
};

const staggerItemReturn = {
  hidden: { opacity: 1, y: 0, scale: 1 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0 },
  },
};

// Stagger used inside sub-pages (visiting hours, hospital info)
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.2 },
  },
};

export default function KioskMode({ onBack }: KioskModeProps) {
  const [currentView, setCurrentView] = useState<KioskView>('services');
  const hasShownGrid = useRef(false);

  const handleServiceClick = useCallback((serviceId: string) => {
    setCurrentView(serviceId as KioskView);
  }, []);

  const goToServices = useCallback(() => {
    setCurrentView('services');
  }, []);

  // Pick animation variants based on first-load vs return
  const isFirstLoad = !hasShownGrid.current;
  const gridContainerVariants = isFirstLoad ? staggerContainerFirst : staggerContainerReturn;
  const gridItemVariants = isFirstLoad ? staggerItemFirst : staggerItemReturn;

  // Full-page appointment flow
  if (currentView === 'book-appointment') {
    return <AppointmentFlow onBack={goToServices} />;
  }

  // Sub-page wrapper for other services
  const renderSubPage = (title: string, icon: string, content: React.ReactNode) => (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -300 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      style={{
        height: '100vh',
        backgroundColor: C.bg,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px 24px',
        gap: '16px',
        borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
      }}>
        <motion.button
          onClick={goToServices}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>{icon}</span>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: C.text, margin: 0 }}>{title}</h2>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px' }}>
        {content}
      </div>
    </motion.div>
  );

  // Visiting Hours
  if (currentView === 'visiting-hours') {
    return renderSubPage('Visiting Hours', '🕐', (
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}
      >
        {[
          { title: 'General Wards', data: visitingHoursData.general, icon: '🏥' },
          { title: 'ICU', data: visitingHoursData.icu, icon: '🚨' },
          { title: 'Pediatrics', data: visitingHoursData.pediatrics, icon: '👶' },
          { title: 'Maternity', data: visitingHoursData.maternity, icon: '🤱' },
        ].map((section) => (
          <motion.div
            key={section.title}
            variants={staggerItem}
            style={{
              backgroundColor: C.card,
              borderRadius: '20px',
              border: `1px solid ${C.borderLight}`,
              padding: '24px',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ fontSize: '28px' }}>{section.icon}</span>
              <h3 style={{ fontSize: '20px', fontWeight: 600, color: C.text, margin: 0 }}>{section.title}</h3>
            </div>
            {'morning' in section.data && (
              <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                <div style={{ flex: 1, backgroundColor: C.inner, borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: C.textMuted, marginBottom: '6px', fontWeight: 500 }}>☀️ MORNING</div>
                  <div style={{ fontSize: '16px', color: C.text, fontWeight: 600 }}>{section.data.morning}</div>
                </div>
                {'evening' in section.data && (
                  <div style={{ flex: 1, backgroundColor: C.inner, borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: C.textMuted, marginBottom: '6px', fontWeight: 500 }}>🌤️ EVENING</div>
                    <div style={{ fontSize: '16px', color: C.text, fontWeight: 600 }}>{section.data.evening}</div>
                  </div>
                )}
              </div>
            )}
            {'allDay' in section.data && (
              <div style={{ backgroundColor: C.inner, borderRadius: '12px', padding: '14px', textAlign: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', color: C.textMuted, marginBottom: '6px', fontWeight: 500 }}>🌞 ALL DAY</div>
                <div style={{ fontSize: '16px', color: C.text, fontWeight: 600 }}>{section.data.allDay}</div>
              </div>
            )}
            {'note' in section.data && (
              <div style={{ fontSize: '13px', color: C.accent, fontStyle: 'italic', marginTop: '8px' }}>
                ℹ️ {section.data.note}
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    ));
  }

  // Find Patient
  if (currentView === 'find-patient') {
    return renderSubPage('Find Patient', '🔍', (
      <div style={{ maxWidth: '500px', margin: '0 auto', width: '100%', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            backgroundColor: C.card,
            borderRadius: '24px',
            border: `1px solid ${C.borderLight}`,
            padding: '48px 32px',
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🔍</div>
          <h3 style={{ fontSize: '24px', fontWeight: 700, color: C.text, marginBottom: '12px' }}>
            Patient Lookup
          </h3>
          <p style={{ fontSize: '16px', color: C.textSecondary, lineHeight: 1.6, marginBottom: '24px' }}>
            Please visit the reception desk for assistance with locating a patient. Our staff will be happy to help you.
          </p>
          <div style={{ backgroundColor: C.inner, borderRadius: '14px', padding: '16px', border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: '14px', color: C.textSecondary, marginBottom: '4px' }}>Reception Desk</div>
            <div style={{ fontSize: '20px', color: C.accent, fontWeight: 600 }}>Ground Floor, Main Lobby</div>
          </div>
        </motion.div>
      </div>
    ));
  }

  // Emergency
  if (currentView === 'emergency') {
    return renderSubPage('Emergency', '🚨', (
      <div style={{ maxWidth: '500px', margin: '0 auto', width: '100%', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            backgroundColor: C.card,
            borderRadius: '24px',
            border: `1px solid ${C.accentBorder}`,
            padding: '48px 32px',
          }}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ fontSize: '72px', marginBottom: '24px' }}
          >
            🚨
          </motion.div>
          <h3 style={{ fontSize: '28px', fontWeight: 700, color: C.accent, marginBottom: '16px' }}>
            Emergency Services
          </h3>
          <p style={{ fontSize: '16px', color: C.textSecondary, lineHeight: 1.6, marginBottom: '32px' }}>
            For immediate medical attention, please proceed to the Emergency Department or call our emergency line.
          </p>
          <motion.div
            style={{
              background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '16px',
            }}
            whileTap={{ scale: 0.98 }}
          >
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginBottom: '4px' }}>Emergency Helpline</div>
            <div style={{ fontSize: '36px', color: '#fff', fontWeight: 700 }}>1066</div>
          </motion.div>
          <div style={{ backgroundColor: C.inner, borderRadius: '14px', padding: '16px', border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: '14px', color: C.textSecondary, marginBottom: '4px' }}>Ambulance Service</div>
            <div style={{ fontSize: '24px', color: C.accent, fontWeight: 600 }}>108</div>
          </div>
        </motion.div>
      </div>
    ));
  }

  // Pharmacy
  if (currentView === 'pharmacy') {
    return renderSubPage('Pharmacy', '💊', (
      <div style={{ maxWidth: '500px', margin: '0 auto', width: '100%', textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            backgroundColor: C.card,
            borderRadius: '24px',
            border: `1px solid ${C.borderLight}`,
            padding: '48px 32px',
          }}
        >
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>💊</div>
          <h3 style={{ fontSize: '24px', fontWeight: 700, color: C.text, marginBottom: '12px' }}>
            Pharmacy Services
          </h3>
          <p style={{ fontSize: '16px', color: C.textSecondary, lineHeight: 1.6, marginBottom: '24px' }}>
            Our pharmacy is open 24/7 for your convenience. Prescriptions can be filled at the pharmacy counter.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ backgroundColor: C.inner, borderRadius: '14px', padding: '16px', border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: '14px', color: C.textSecondary, marginBottom: '4px' }}>Location</div>
              <div style={{ fontSize: '18px', color: C.accent, fontWeight: 600 }}>Ground Floor, Block A</div>
            </div>
            <div style={{ backgroundColor: C.inner, borderRadius: '14px', padding: '16px', border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: '14px', color: C.textSecondary, marginBottom: '4px' }}>Hours</div>
              <div style={{ fontSize: '18px', color: C.accent, fontWeight: 600 }}>Open 24/7</div>
            </div>
          </div>
        </motion.div>
      </div>
    ));
  }

  // Hospital Info
  if (currentView === 'hospital-info') {
    return renderSubPage('Hospital Info', '🏥', (
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}
      >
        {/* Facilities */}
        <motion.div
          variants={staggerItem}
          style={{
            backgroundColor: C.card,
            borderRadius: '20px',
            border: `1px solid ${C.borderLight}`,
            padding: '24px',
            marginBottom: '16px',
          }}
        >
          <h3 style={{ fontSize: '20px', fontWeight: 600, color: C.text, marginBottom: '16px' }}>
            🏗️ Facilities
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {hospitalInfoData.facilities.map((facility) => (
              <div key={facility} style={{
                backgroundColor: C.inner,
                borderRadius: '10px',
                padding: '12px 14px',
                fontSize: '14px',
                color: '#ccc',
                fontWeight: 500,
              }}>
                <span style={{ color: C.accent }}>✓</span> {facility}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Contact */}
        <motion.div
          variants={staggerItem}
          style={{
            backgroundColor: C.card,
            borderRadius: '20px',
            border: `1px solid ${C.borderLight}`,
            padding: '24px',
            marginBottom: '16px',
          }}
        >
          <h3 style={{ fontSize: '20px', fontWeight: 600, color: C.text, marginBottom: '16px' }}>
            📞 Contact
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Emergency', value: hospitalInfoData.contact.emergency },
              { label: 'Reception', value: hospitalInfoData.contact.reception },
              { label: 'Ambulance', value: hospitalInfoData.contact.ambulance },
            ].map((item) => (
              <div key={item.label} style={{
                backgroundColor: C.inner,
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ fontSize: '15px', color: C.textSecondary }}>{item.label}</span>
                <span style={{ fontSize: '18px', color: C.accent, fontWeight: 600 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Address */}
        <motion.div
          variants={staggerItem}
          style={{
            backgroundColor: C.card,
            borderRadius: '20px',
            border: `1px solid ${C.borderLight}`,
            padding: '24px',
          }}
        >
          <h3 style={{ fontSize: '20px', fontWeight: 600, color: C.text, marginBottom: '16px' }}>
            📍 Address
          </h3>
          <p style={{ fontSize: '16px', color: '#ccc', lineHeight: 1.6 }}>
            {hospitalInfoData.address}
          </p>
        </motion.div>
      </motion.div>
    ));
  }

  // Main Services Grid
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        height: '100vh',
        backgroundColor: C.bg,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '20px 24px',
        gap: '16px',
        borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
      }}>
        <motion.button
          onClick={onBack}
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
          Home
        </motion.button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src="/sims-logo.jpg"
            alt="SIMS"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              objectFit: 'contain',
              backgroundColor: '#fff',
              padding: '4px',
            }}
          />
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: C.text, margin: 0 }}>SIMS Hospital</h1>
            <p style={{ fontSize: '13px', color: C.textSecondary, margin: 0 }}>What would you like to do?</p>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <motion.div
          variants={gridContainerVariants}
          initial="hidden"
          animate="show"
          onAnimationComplete={() => { hasShownGrid.current = true; }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px',
            maxWidth: '700px',
            width: '100%',
          }}
        >
          {kioskServices.map((service) => (
            <motion.button
              key={service.id}
              variants={gridItemVariants}
              onClick={() => handleServiceClick(service.id)}
              style={{
                background: C.card,
                border: `1px solid ${C.borderLight}`,
                borderRadius: '24px',
                padding: '32px 24px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                textAlign: 'center',
                minHeight: '160px',
                position: 'relative',
                overflow: 'hidden',
              }}
              whileHover={{
                scale: 1.04,
                borderColor: C.accent,
                boxShadow: `0 12px 40px ${C.accentGlow}`,
                transition: { duration: 0.2 },
              }}
              whileTap={{ scale: 0.96 }}
            >
              {/* Blue accent line on top */}
              <motion.div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: `linear-gradient(90deg, ${C.accent}, ${C.accentDark})`,
                  borderRadius: '24px 24px 0 0',
                  opacity: 0,
                }}
                whileHover={{ opacity: 1 }}
              />

              <div style={{
                fontSize: '42px',
                width: '72px',
                height: '72px',
                borderRadius: '20px',
                backgroundColor: C.accentSubtle,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${C.accentBorder}`,
              }}>
                {service.icon}
              </div>

              <div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: C.text,
                  marginBottom: '6px',
                }}>
                  {service.title}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: C.textSecondary,
                  lineHeight: 1.4,
                }}>
                  {service.description}
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '16px 24px',
        textAlign: 'center',
        borderTop: `1px solid ${C.border}`,
        flexShrink: 0,
      }}>
        <p style={{ fontSize: '13px', color: C.textMuted, margin: 0 }}>
          Need help? Speak to our reception or call <span style={{ color: C.accent }}>1066</span>
        </p>
      </div>
    </motion.div>
  );
}
