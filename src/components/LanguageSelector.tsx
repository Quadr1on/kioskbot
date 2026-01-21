'use client';

import { motion } from 'framer-motion';

interface LanguageSelectorProps {
  onSelect: (lang: 'en-IN' | 'ta-IN') => void;
}

export default function LanguageSelector({ onSelect }: LanguageSelectorProps) {
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      width: '100%',
      maxWidth: '896px', // max-w-4xl
      margin: '0 auto',
      padding: '0 24px',
    },
    titleContainer: {
      marginBottom: '48px',
      textAlign: 'center' as const,
    },
    title: {
      fontSize: '30px',
      fontWeight: 700,
      color: 'white',
      marginBottom: '8px',
    },
    subtitle: {
      display: 'block',
      fontSize: '18px',
      color: '#9ca3af',
      fontWeight: 400,
      marginTop: '8px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '32px',
      width: '100%',
    },
    card: {
      cursor: 'pointer',
      backgroundColor: 'rgba(31, 41, 55, 0.5)', // bg-gray-800/50
      border: '1px solid #374151', // border-gray-700
      padding: '32px',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      height: '256px', // h-64
      borderRadius: '24px', // rounded-xl check
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', // shadow-xl
      transition: 'all 0.3s ease',
    },
    iconContainer: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '24px',
      transition: 'background-color 0.3s',
    },
    cardTitle: {
      fontSize: '24px',
      fontWeight: 600,
      color: 'white',
      margin: 0,
    },
    cardText: {
      color: '#9ca3af',
      marginTop: '8px',
      margin: 0,
    },
  };

  return (
    <div style={styles.container}>
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={styles.titleContainer}
      >
        <h2 style={styles.title}>
          Select your preferred language
          <span style={styles.subtitle}>
              விரும்பிய மொழியைத் தேர்ந்தெடுக்கவும்
          </span>
        </h2>
      </motion.div>

      <div style={styles.grid}>
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ width: '100%' }}
        >
          <div 
            onClick={() => onSelect('en-IN')}
            style={styles.card}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1f2937'; // bg-gray-800
              e.currentTarget.style.borderColor = '#3b82f6'; // border-blue-500
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(31, 41, 55, 0.5)';
              e.currentTarget.style.borderColor = '#374151';
            }}
          >
            <div style={{ ...styles.iconContainer, backgroundColor: 'rgba(59, 130, 246, 0.2)' }}>
              <span style={{ fontSize: '36px' }}>🇬🇧</span>
            </div>
            <h3 style={styles.cardTitle}>English</h3>
            <p style={styles.cardText}>Tap to speak</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ width: '100%' }}
        >
          <div 
            onClick={() => onSelect('ta-IN')}
            style={styles.card}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1f2937';
              e.currentTarget.style.borderColor = '#a855f7'; // border-purple-500
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(31, 41, 55, 0.5)';
              e.currentTarget.style.borderColor = '#374151';
            }}
          >
            <div style={{ ...styles.iconContainer, backgroundColor: 'rgba(168, 85, 247, 0.2)' }}>
              <span style={{ fontSize: '36px', fontWeight: 'bold', color: 'white' }}>அ</span>
            </div>
            <h3 style={styles.cardTitle}>தமிழ் (Tamil)</h3>
            <p style={styles.cardText}>பேச தட்டவும்</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
