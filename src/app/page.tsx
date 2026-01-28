'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatInterface from '@/components/ChatInterface';
import VoiceMode from '@/components/VoiceMode';
import Image from 'next/image';

type Mode = 'select' | 'chat' | 'voice';

export default function Home() {
  const [mode, setMode] = useState<Mode>('select');
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  // Hospital-themed background images URLs (using Unsplash for high-quality hospital images)
  const backgroundImages = [
    '/image1.jpg', // Modern hospital exterior
    '/image2.jpg', // Hospital corridor
    '/image3.jpg', // Medical equipment
    '/image4.jpg', // Hospital room
    '/image5.webp', // Medical team
    '/image6.webp', // Healthcare technology
  ];

  // Auto-slide background images every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  if (mode === 'chat') {
    return <ChatInterface onSwitchToVoice={() => setMode('voice')} />;
  }

  if (mode === 'voice') {
    return <VoiceMode onSwitchToChat={() => setMode('chat')} />;
  }

  // Inline styles matching ChatInterface design
  const styles = {
    container: {
      position: 'relative' as const,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      overflow: 'hidden',
      padding: '48px 24px',
    },
    backgroundContainer: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
    },
    backgroundImage: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover' as const,
    },
    overlay: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 1,
    },
    contentWrapper: {
      position: 'relative' as const,
      zIndex: 2,
      width: '100%',
      maxWidth: '1200px',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
    },
    logoContainer: {
      position: 'relative' as const,
      width: '140px',
      height: '140px',
      marginBottom: '24px',
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      boxShadow: '0 20px 60px rgba(255, 255, 255, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1)',
      border: '2px solid rgba(255, 255, 255, 0.2)',
    },
    logo: {
      width: '100%',
      height: '100%',
      objectFit: 'contain' as const,
    },
    title: {
      fontSize: '42px',
      fontWeight: 700,
      color: 'white',
      margin: '0 0 12px 0',
      textAlign: 'center' as const,
      fontFamily: 'var(--font-roboto-slab), serif',
      textShadow: '0 2px 20px rgba(0, 0, 0, 0.5)',
      letterSpacing: '-0.5px',
    },
    subtitle: {
      fontSize: '20px',
      color: '#e5e7eb',
      margin: '0 0 56px 0',
      textAlign: 'center' as const,
      textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
    },
    cardsContainer: {
      display: 'flex',
      gap: '28px',
      marginBottom: '56px',
      flexWrap: 'wrap' as const,
      justifyContent: 'center',
    },
    card: {
      width: '300px',
      padding: '36px',
      backgroundColor: 'rgba(26, 26, 26, 0.85)',
      backdropFilter: 'blur(20px)',
      borderRadius: '28px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      cursor: 'pointer',
      textAlign: 'left' as const,
      transition: 'all 0.3s ease',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
    },
    cardIcon: {
      width: '72px',
      height: '72px',
      borderRadius: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '24px',
    },
    cardTitle: {
      fontSize: '24px',
      fontWeight: 600,
      color: 'white',
      margin: '0 0 10px 0',
    },
    cardDescription: {
      fontSize: '16px',
      color: '#d1d5db',
      margin: 0,
      lineHeight: 1.6,
    },
    quickActionsLabel: {
      fontSize: '15px',
      color: '#d1d5db',
      marginBottom: '20px',
      fontWeight: 500,
      textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
    },
    quickActionsContainer: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '14px',
      justifyContent: 'center',
      maxWidth: '700px',
    },
    quickActionButton: {
      padding: '16px 28px',
      backgroundColor: 'rgba(26, 26, 26, 0.85)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '18px',
      color: '#e5e7eb',
      fontSize: '15px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    },
    footer: {
      marginTop: '56px',
      textAlign: 'center' as const,
      color: '#d1d5db',
      fontSize: '15px',
      textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
    },
    slideIndicators: {
      position: 'absolute' as const,
      bottom: '30px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: '10px',
      zIndex: 3,
    },
    indicator: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    activeIndicator: {
      width: '24px',
      borderRadius: '4px',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
  };

  const quickActions = ['Find Patient', 'Book Appointment', 'Visiting Hours', 'Emergency'];

  return (
    <div style={styles.container}>
      {/* Sliding Background Images */}
      <div style={styles.backgroundContainer}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBgIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            style={styles.backgroundImage}
          >
            <img
              src={backgroundImages[currentBgIndex]}
              alt="Hospital background"
              style={styles.backgroundImage}
            />
          </motion.div>
        </AnimatePresence>
        <div style={styles.overlay} />
      </div>

      {/* Content */}
      <div style={styles.contentWrapper}>
        {/* SIMS Logo */}
        <motion.div 
          style={styles.logoContainer}
          initial={{ scale: 0.8, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <img 
            src="/sims-logo.jpg" 
            alt="SIMS Hospital Logo" 
            style={styles.logo}
          />
        </motion.div>

        {/* Title */}
        <motion.h1 
          style={styles.title}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Welcome to SIMS Hospital
        </motion.h1>
        <motion.p 
          style={styles.subtitle}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          How would you like to interact with me?
        </motion.p>

        {/* Mode Selection Cards */}
        <div style={styles.cardsContainer}>
          {/* Chat Mode Card */}
          <motion.button
            onClick={() => setMode('chat')}
            style={styles.card}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ 
              scale: 1.03, 
              borderColor: 'rgba(59, 130, 246, 0.5)',
              boxShadow: '0 20px 60px rgba(59, 130, 246, 0.3)',
              backgroundColor: 'rgba(35, 35, 35, 0.9)'
            }}
            whileTap={{ scale: 0.98 }}
          >
            <div style={{ ...styles.cardIcon, backgroundColor: 'rgba(59, 130, 246, 0.2)' }}>
              <svg width="36" height="36" fill="none" stroke="#3B82F6" viewBox="0 0 24 24">
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
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{ 
              scale: 1.03, 
              borderColor: 'rgba(139, 92, 246, 0.5)',
              boxShadow: '0 20px 60px rgba(139, 92, 246, 0.3)',
              backgroundColor: 'rgba(35, 35, 35, 0.9)'
            }}
            whileTap={{ scale: 0.98 }}
          >
            <div style={{ ...styles.cardIcon, backgroundColor: 'rgba(139, 92, 246, 0.2)' }}>
              <svg width="36" height="36" fill="#8B5CF6" viewBox="0 0 24 24">
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
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          Quick Actions
        </motion.p>
        <motion.div 
          style={styles.quickActionsContainer}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {quickActions.map((action, index) => (
            <motion.button
              key={action}
              onClick={() => setMode('chat')}
              style={styles.quickActionButton}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
              whileHover={{ 
                borderColor: 'rgba(59, 130, 246, 0.5)',
                color: 'white',
                backgroundColor: 'rgba(35, 35, 35, 0.95)',
                boxShadow: '0 8px 20px rgba(59, 130, 246, 0.2)'
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
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          Need help? Speak to our reception or call 1066
        </motion.footer>
      </div>

      {/* Slide Indicators */}
      <div style={styles.slideIndicators}>
        {backgroundImages.map((_, index) => (
          <motion.div
            key={index}
            style={{
              ...styles.indicator,
              ...(index === currentBgIndex ? styles.activeIndicator : {}),
            }}
            onClick={() => setCurrentBgIndex(index)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          />
        ))}
      </div>
    </div>
  );
}