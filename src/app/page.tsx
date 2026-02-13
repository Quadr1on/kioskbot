'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatInterface from '@/components/ChatInterface';
import VoiceMode from '@/components/VoiceMode';
import Image from 'next/image';
import { preloadGreetings } from '@/lib/greetingCache';

type Mode = 'select' | 'chat' | 'voice';

export default function Home() {
  const [mode, setMode] = useState<Mode>('select');
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  // Hospital-themed background images URLs (using Unsplash for high-quality hospital images)
  const backgroundImages = [
    '/image.jpeg', // Modern hospital exterior
    '/image2.jpg', // Hospital corridor
    '/image3.jpeg', // Medical equipment
    '/image4.jpeg', // Hospital room
    '/image5.webp', // Medical team
    '/image7.jpeg', // Health on wheels
    '/image6.webp', // Healthcare technology
  ];

  // Preload voice mode greeting audio when home page mounts
  useEffect(() => {
    preloadGreetings();
  }, []);

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
    return <VoiceMode onClose={() => setMode('select')} />;
  }

  // Inline styles for split-screen layout
  const styles = {
    container: {
      display: 'flex',
      minHeight: '100vh',
      overflow: 'hidden',
      '@media (max-width: 768px)': {
        flexDirection: 'column',
      },
    },
    // Left section - Slideshow
    leftSection: {
      position: 'relative' as const,
      width: '50%',
      height: '100vh',
      overflow: 'hidden',
    },
    slideshowImage: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover' as const,
    },
    slideshowOverlay: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'linear-gradient(to right, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5))',
      zIndex: 1,
    },
    slideIndicators: {
      position: 'absolute' as const,
      bottom: '40px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: '12px',
      zIndex: 3,
    },
    indicator: {
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      backgroundColor: 'rgba(255, 255, 255, 0.4)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      border: '2px solid rgba(255, 255, 255, 0.6)',
    },
    activeIndicator: {
      width: '32px',
      borderRadius: '5px',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      border: '2px solid white',
    },
    // Right section - Content
    rightSection: {
      position: 'relative' as const,
      width: '50%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 40px',
      background: '#121212',
      overflowY: 'auto' as const,
    },
    contentWrapper: {
      width: '100%',
      maxWidth: '500px',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
    },
    logoContainer: {
      position: 'relative' as const,
      width: '120px',
      height: '120px',
      marginBottom: '24px',
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      boxShadow: '0 20px 60px rgba(255, 255, 255, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1)',
      border: '2px solid rgba(255, 255, 255, 0.2)',
    },
    logo: {
      width: '100%',
      height: '100%',
      objectFit: 'contain' as const,
    },
    title: {
      fontSize: '36px',
      fontWeight: 700,
      color: 'white',
      margin: '0 0 10px 0',
      textAlign: 'center' as const,
      fontFamily: 'var(--font-roboto-slab), serif',
      textShadow: '0 2px 20px rgba(0, 0, 0, 0.5)',
      letterSpacing: '-0.5px',
    },
    subtitle: {
      fontSize: '18px',
      color: '#9ca3af',
      margin: '0 0 40px 0',
      textAlign: 'center' as const,
    },
    cardsContainer: {
      display: 'flex',
      flexDirection: 'row' as const,
      gap: '20px',
      marginBottom: '40px',
      width: '100%',
    },
    card: {
      flex: 1,
      padding: '24px',
      backgroundColor: '#1a1a1a',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      border: '1px solid #2a2a2a',
      cursor: 'pointer',
      textAlign: 'center' as const,
      transition: 'all 0.1s ease',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: '16px',
    },
    cardIcon: {
      width: '60px',
      height: '60px',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      fontSize: '20px',
      fontWeight: 600,
      color: 'white',
      margin: '0 0 6px 0',
    },
    cardDescription: {
      fontSize: '13px',
      color: '#9ca3af',
      margin: 0,
      lineHeight: 1.5,
    },
    quickActionsLabel: {
      fontSize: '14px',
      color: '#9ca3af',
      marginBottom: '16px',
      fontWeight: 500,
      textTransform: 'uppercase' as const,
      letterSpacing: '1px',
    },
    quickActionsContainer: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '12px',
      justifyContent: 'center',
      width: '100%',
    },
    quickActionButton: {
      padding: '14px 22px',
      backgroundColor: '#212121',
      backdropFilter: 'blur(20px)',
      border: '1px solid #2a2a2a',
      borderRadius: '14px',
      color: '#9ca3af',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    },
    footer: {
      marginTop: '40px',
      textAlign: 'center' as const,
      color: '#6b7280',
      fontSize: '14px',
    },
  };

  const quickActions = ['Find Patient', 'Book Appointment', 'Visiting Hours', 'Emergency'];

  // Mobile responsive CSS
  const mobileStyles = `
    @media (max-width: 768px) {
      .home-container {
        flex-direction: column !important;
      }
      .slideshow-section {
        width: 100% !important;
        height: 35vh !important;
      }
      .content-section {
        width: 100% !important;
        height: auto !important;
        min-height: 65vh !important;
        padding: 24px 20px !important;
      }
      .cards-container {
        flex-direction: column !important;
      }
      .mode-card {
        width: 100% !important;
        flex: none !important;
      }
    }
  `;

  return (
    <>
      <style>{mobileStyles}</style>
      <div style={styles.container} className="home-container">
        {/* Left Section - Slideshow */}
        <div style={styles.leftSection} className="slideshow-section">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBgIndex}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            style={styles.slideshowImage}
          >
            <img
              src={backgroundImages[currentBgIndex]}
              alt="Hospital"
              style={styles.slideshowImage}
            />
          </motion.div>
        </AnimatePresence>
        <div style={styles.slideshowOverlay} />
        
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

      {/* Right Section - Content */}
      <div style={styles.rightSection} className="content-section">
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
          <div style={styles.cardsContainer} className="cards-container">
            {/* Chat Mode Card */}
            <motion.button
              onClick={() => setMode('chat')}
              style={styles.card}
              className="mode-card"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.1 }}
              whileHover={{ 
                scale: 1.03, 
                borderColor: 'rgba(59, 130, 246, 0.5)',
                boxShadow: '0 20px 60px rgba(59, 130, 246, 0.25)',
                transition: { duration: 0.1 }
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div style={{ ...styles.cardIcon, backgroundColor: 'rgba(59, 130, 246, 0.2)' }}>
                <svg width="28" height="28" fill="none" stroke="#3B82F6" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div style={styles.cardContent}>
                <h2 style={styles.cardTitle}>Chat Mode</h2>
                <p style={styles.cardDescription}>Type your questions using the on-screen keyboard</p>
              </div>
            </motion.button>

            {/* Voice Mode Card */}
            <motion.button
              onClick={() => setMode('voice')}
              style={styles.card}
              className="mode-card"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.1 }}
              whileHover={{ 
                scale: 1.03, 
                borderColor: 'rgba(139, 92, 246, 0.5)',
                boxShadow: '0 20px 60px rgba(139, 92, 246, 0.25)',
                transition: { duration: 0.1 }
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div style={{ ...styles.cardIcon, backgroundColor: 'rgba(139, 92, 246, 0.2)' }}>
                <svg width="28" height="28" fill="#8B5CF6" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
              </div>
              <div style={styles.cardContent}>
                <h2 style={styles.cardTitle}>Voice Mode</h2>
                <p style={styles.cardDescription}>Speak naturally in English or Tamil</p>
              </div>
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
                whileHover={{ 
                  borderColor: 'rgba(99, 102, 241, 0.5)',
                  color: 'white',
                  backgroundColor: 'rgba(99, 102, 241, 0.2)',
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
      </div>
    </div>
    </>
  );
}
