'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import ChatInterface from '@/components/ChatInterface';
import VoiceMode from '@/components/VoiceMode';

type Mode = 'select' | 'chat' | 'voice';

export default function Home() {
  const [mode, setMode] = useState<Mode>('select');

  if (mode === 'chat') {
    return <ChatInterface onSwitchToVoice={() => setMode('voice')} />;
  }

  if (mode === 'voice') {
    return <VoiceMode onSwitchToChat={() => setMode('chat')} />;
  }

  // Inline styles matching ChatInterface design
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#121212',
      padding: '48px 24px',
    },
    logo: {
      width: '120px',
      height: '120px',
      background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
      borderRadius: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '32px',
      boxShadow: '0 20px 60px rgba(59, 130, 246, 0.3)',
    },
    title: {
      fontSize: '36px',
      fontWeight: 700,
      color: 'white',
      margin: '0 0 12px 0',
      textAlign: 'center' as const,
      fontFamily: 'var(--font-roboto-slab), serif',
    },
    subtitle: {
      fontSize: '18px',
      color: '#9ca3af',
      margin: '0 0 48px 0',
      textAlign: 'center' as const,
    },
    cardsContainer: {
      display: 'flex',
      gap: '24px',
      marginBottom: '48px',
      flexWrap: 'wrap' as const,
      justifyContent: 'center',
    },
    card: {
      width: '280px',
      padding: '32px',
      backgroundColor: '#1a1a1a',
      borderRadius: '24px',
      border: '1px solid #2a2a2a',
      cursor: 'pointer',
      textAlign: 'left' as const,
      transition: 'all 0.3s ease',
    },
    cardIcon: {
      width: '64px',
      height: '64px',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '20px',
    },
    cardTitle: {
      fontSize: '22px',
      fontWeight: 600,
      color: 'white',
      margin: '0 0 8px 0',
    },
    cardDescription: {
      fontSize: '15px',
      color: '#9ca3af',
      margin: 0,
      lineHeight: 1.5,
    },
    quickActionsLabel: {
      fontSize: '14px',
      color: '#6b7280',
      marginBottom: '16px',
    },
    quickActionsContainer: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '12px',
      justifyContent: 'center',
    },
    quickActionButton: {
      padding: '14px 24px',
      backgroundColor: '#1a1a1a',
      border: '1px solid #2a2a2a',
      borderRadius: '16px',
      color: '#d1d5db',
      fontSize: '15px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    footer: {
      marginTop: '48px',
      textAlign: 'center' as const,
      color: '#4b5563',
      fontSize: '14px',
    },
  };

  const quickActions = ['Find Patient', 'Book Appointment', 'Visiting Hours', 'Emergency'];

  return (
    <div style={styles.container}>
      {/* Logo */}
      <motion.div 
        style={styles.logo}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <svg width="56" height="56" fill="none" stroke="white" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </motion.div>

      {/* Title */}
      <motion.h1 
        style={styles.title}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        Welcome to SIMS Hospital
      </motion.h1>
      <motion.p 
        style={styles.subtitle}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        How would you like to interact with me?
      </motion.p>

      {/* Mode Selection Cards */}
      <div style={styles.cardsContainer}>
        {/* Chat Mode Card */}
        <motion.button
          onClick={() => setMode('chat')}
          style={styles.card}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.1}}
          whileHover={{ 
            scale: 1.02, 
            borderColor: '#3B82F6',
            boxShadow: '0 10px 40px rgba(59, 130, 246, 0.2)'
          }}
          whileTap={{ scale: 0.98 }}
        >
          <div style={{ ...styles.cardIcon, backgroundColor: 'rgba(59, 130, 246, 0.15)' }}>
            <svg width="32" height="32" fill="none" stroke="#3B82F6" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 style={styles.cardTitle}>Chat Mode</h2>
          <p style={styles.cardDescription}>Type your questions using the on-screen keyboard</p>
        </motion.button>

        {/* Voice Mode Card */}
        <motion.button
          onClick={() => setMode('voice')}
          style={styles.card}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.1 }}
          whileHover={{ 
            scale: 1.02, 
            borderColor: '#8B5CF6',
            boxShadow: '0 10px 40px rgba(139, 92, 246, 0.2)'
          }}
          whileTap={{ scale: 0.98 }}
        >
          <div style={{ ...styles.cardIcon, backgroundColor: 'rgba(139, 92, 246, 0.15)' }}>
            <svg width="32" height="32" fill="#8B5CF6" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </div>
          <h2 style={styles.cardTitle}>Voice Mode</h2>
          <p style={styles.cardDescription}>Speak naturally in English or Tamil</p>
        </motion.button>
      </div>

      {/* Quick Actions */}
      <motion.p 
        style={styles.quickActionsLabel}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        Quick Actions
      </motion.p>
      <motion.div 
        style={styles.quickActionsContainer}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        {quickActions.map((action) => (
          <motion.button
            key={action}
            onClick={() => setMode('chat')}
            style={styles.quickActionButton}
            whileHover={{ 
              borderColor: '#3B82F6',
              color: 'white',
              backgroundColor: '#212121'
            }}
            whileTap={{ scale: 0.95 }}
          >
            {action}
          </motion.button>
        ))}
      </motion.div>

      {/* Footer */}
      <motion.footer 
        style={styles.footer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        Need help? Speak to our reception or call 1066
      </motion.footer>
    </div>
  );
}
