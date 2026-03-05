'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from './MessageBubble';
import VirtualKeyboard from './VirtualKeyboard';
import MicOrb from './MicOrb';
import AccessibilityPanel from './AccessibilityPanel';
import { useTheme } from './ThemeProvider';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  onBackToHome?: () => void;
  initialMessage?: string;
}

/* ════════════════════════════════════════════════════
   Outlined SVG Icons
   ════════════════════════════════════════════════════ */

function BackArrowIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function KeyboardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" ry="2" />
      <path d="M6 8h.01" /><path d="M10 8h.01" /><path d="M14 8h.01" /><path d="M18 8h.01" />
      <path d="M8 12h.01" /><path d="M12 12h.01" /><path d="M16 12h.01" />
      <path d="M7 16h10" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 14-7-7 14v-7z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" /><path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" /><path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

/* ── Quick Action Chip Icons (outlined stencil style) ─── */

function CalendarOutline() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function SearchOutline() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function ClockOutline() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function UserOutline() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

/* ── Department Chip Icons (outlined) ─── */

function HeartOutline() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function BrainOutline() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
      <path d="M12 5v9" />
    </svg>
  );
}

function BoneOutline() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5Z" />
    </svg>
  );
}

function StethOutline() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
      <path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4" />
      <circle cx="20" cy="10" r="2" />
    </svg>
  );
}

function EmergencyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 9v4" /><path d="M12 17h.01" />
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    </svg>
  );
}

function PersonnelIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

const QUICK_ACTIONS = [
  { label: 'Book Appointment', icon: <CalendarOutline />, message: 'I want to book an appointment' },
  { label: 'Find Patient', icon: <SearchOutline />, message: 'Find a patient by name' },
  { label: 'Visiting Hours', icon: <ClockOutline />, message: 'What are the visiting hours?' },
  { label: 'Find Doctor', icon: <UserOutline />, message: 'I want to find a doctor' },
  { label: 'Emergency', icon: <EmergencyIcon />, message: 'I have a medical emergency. What should I do?' },
  { label: 'Call Personnel', icon: <PersonnelIcon />, message: '__PERSONNEL_ALERT__' },
];

const DEPARTMENT_ACTIONS = [
  { label: 'Cardiology', icon: <HeartOutline />, message: 'Cardiology' },
  { label: 'Neurology', icon: <BrainOutline />, message: 'Neurology' },
  { label: 'Orthopedics', icon: <BoneOutline />, message: 'Orthopedics' },
  { label: 'General Medicine', icon: <StethOutline />, message: 'General Medicine' },
];

/* ════════════════════════════════════════════════════
   ChatInterface Component
   ════════════════════════════════════════════════════ */

export default function ChatInterface({ onBackToHome, initialMessage }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [language, setLanguage] = useState<'en-IN' | 'ta-IN'>('en-IN');
  const [isLoading, setIsLoading] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [personnelAlert, setPersonnelAlert] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialSentRef = useRef(false);
  const { isDark, toggleTheme } = useTheme();

  // Detect appointment flow for contextual chips
  const isInAppointmentFlow = messages.some(m =>
    m.content.toLowerCase().includes('book an appointment') ||
    m.content.toLowerCase().includes('which department')
  );

  const currentChips = isInAppointmentFlow ? DEPARTMENT_ACTIONS : QUICK_ACTIONS;

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle initial message from parent
  useEffect(() => {
    if (initialMessage && !initialSentRef.current) {
      initialSentRef.current = true;
      setTimeout(() => sendMessage(initialMessage), 400);
    }
  }, [initialMessage]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          language,
        }),
      });

      if (!response.ok) throw new Error('Chat request failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
      };

      setMessages([...newMessages, assistantMessage]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;
        setMessages([...newMessages, { ...assistantMessage, content: assistantContent }]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages([...newMessages, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, language]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  /* ─── Theme-aware colors — ALL from CSS vars for accessibility ─── */
  const bgPrimary = 'var(--bg-primary)';
  const bgCard = 'var(--bg-secondary)';
  const bgInput = 'var(--bg-tertiary)';
  const border = 'var(--border-light)';
  const textPri = 'var(--text-primary)';
  const textSec = 'var(--text-secondary)';
  const textTert = 'var(--text-tertiary)';
  const simsBlue = 'var(--sims-blue)';
  const greenDot = 'var(--accent-green)';

  // Personnel alert handler
  const handlePersonnelAlert = useCallback(() => {
    setPersonnelAlert(true);
    setTimeout(() => setPersonnelAlert(false), 5000);
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      width: '100%',
      background: bgPrimary,
      fontFamily: '"Inter", "SF Pro Display", "Segoe UI", sans-serif',
      overflow: 'hidden',
      transition: 'background 0.3s ease',
    }}>

      {/* ════════ HEADER ════════════════════════════════ */}
      <motion.div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          borderBottom: `1px solid ${border}`,
          background: 'var(--bg-glass-strong)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          zIndex: 10,
          flexShrink: 0,
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Back button */}
        {onBackToHome && (
          <motion.button
            onClick={onBackToHome}
            style={{
              width: 40, height: 40,
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--bg-tertiary)',
              color: textSec,
              border: 'none', cursor: 'pointer',
            }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
          >
            <BackArrowIcon />
          </motion.button>
        )}

        {/* Logo + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38,
            borderRadius: 12,
            background: simsBlue,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 'calc(15px * var(--text-scale, 1))', fontWeight: 700, color: textPri, letterSpacing: '-0.3px' }}>
              SIMS Assistant
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: greenDot }} />
              <span style={{ fontSize: 'calc(11px * var(--text-scale, 1))', fontWeight: 500, color: greenDot }}>Online</span>
            </div>
          </div>
        </div>

        {/* Right side actions */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
          <motion.button
            onClick={toggleTheme}
            style={{
              width: 38, height: 38,
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--bg-tertiary)',
              color: textSec,
              border: 'none', cursor: 'pointer',
            }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </motion.button>

          {/* Accessibility button */}
          <motion.button
            onClick={() => setShowAccessibility(!showAccessibility)}
            style={{
              width: 38, height: 38,
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: showAccessibility ? 'var(--sims-blue-subtle)' : 'var(--bg-tertiary)',
              color: showAccessibility ? simsBlue : textSec,
              border: 'none', cursor: 'pointer',
            }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" /><path d="M12 8h.01" />
            </svg>
          </motion.button>

          {/* Accessibility Dropdown */}
          <AccessibilityPanel
            isOpen={showAccessibility}
            onClose={() => setShowAccessibility(false)}
          />
        </div>
      </motion.div>

      {/* ════════ MESSAGES AREA ══════════════════════════ */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 12px 8px',
        scrollBehavior: 'smooth',
      }}>
        {/* Empty state — centered in viewport */}
        {messages.length === 0 && (
          <motion.div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '60vh',
              textAlign: 'center',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div style={{
              width: 80, height: 80,
              borderRadius: 24,
              background: 'var(--sims-blue-subtle)',
              border: `1px solid ${border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={simsBlue} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z" />
                <path d="M8 12h.01" /><path d="M12 12h.01" /><path d="M16 12h.01" />
              </svg>
            </div>
            <h3 style={{ fontSize: 'calc(22px * var(--text-scale, 1))', fontWeight: 700, color: textPri, margin: 0, letterSpacing: '-0.5px' }}>
              How can I help?
            </h3>
            <p style={{ fontSize: 'calc(14px * var(--text-scale, 1))', color: textTert, marginTop: 6 }}>
              Ask me anything about SIMS Hospital
            </p>
          </motion.div>
        )}

        {/* Message bubbles — centered */}
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
          ))}

          {isLoading && <MessageBubble role="assistant" content="" isLoading />}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ════════ BOTTOM BAR (Chips + Input + Keyboard) ═══ */}
      <div style={{
        borderTop: `1px solid ${border}`,
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '10px 12px 12px',
        flexShrink: 0,
      }}>
        {/* Center-constrained container */}
        <div style={{ maxWidth: 720, margin: '0 auto' }}>

          {/* Choice Chips */}
          <AnimatePresence mode="wait">
            {!isLoading && (
              <motion.div
                key={isInAppointmentFlow ? 'dept' : 'quick'}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: 8,
                  paddingBottom: 12,
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                {currentChips.map((chip, i) => {
                  const isEmergency = chip.label === 'Emergency';
                  const isPersonnel = chip.label === 'Call Personnel';
                  return (
                    <motion.button
                      key={chip.label}
                      onClick={() => {
                        if (isPersonnel) { handlePersonnelAlert(); return; }
                        sendMessage(chip.message);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        whiteSpace: 'nowrap',
                        fontWeight: 500,
                        fontSize: 'calc(13px * var(--text-scale, 1))',
                        background: isEmergency ? 'var(--accent-red)' : isPersonnel ? 'var(--accent-purple)' : 'var(--bg-secondary)',
                        border: `1.5px solid ${isEmergency || isPersonnel ? 'transparent' : border}`,
                        borderRadius: 100,
                        color: isEmergency || isPersonnel ? '#fff' : textPri,
                        padding: '9px 18px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      initial={{ opacity: 0, y: 12, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.9 }}
                      transition={{ delay: i * 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{ scale: 1.04, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <span style={{ color: isEmergency || isPersonnel ? '#fff' : simsBlue, display: 'flex', flexShrink: 0 }}>
                        {chip.icon}
                      </span>
                      {chip.label}
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Personnel Alert Banner */}
          <AnimatePresence>
            {personnelAlert && (
              <motion.div
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 18px', borderRadius: 14, marginBottom: 10,
                  background: 'var(--accent-purple)',
                  color: '#fff', fontSize: 14, fontWeight: 600,
                }}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Alerted nearby human assistant to help you
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Bar */}
          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {/* MicOrb */}
            <MicOrb
              onTranscript={(text) => {
                setInputValue(text);
                setTimeout(() => sendMessage(text), 200);
              }}
              disabled={isLoading}
              language={language}
            />

            {/* Input container */}
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-tertiary)',
              border: `1.5px solid ${border}`,
              borderRadius: 100,
              padding: '4px 6px 4px 20px',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            }}>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message…"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: 'calc(14px * var(--text-scale, 1))',
                  color: textPri,
                  minHeight: 44,
                  fontFamily: 'inherit',
                }}
                disabled={isLoading}
              />

              {/* Keyboard toggle */}
              <motion.button
                type="button"
                onClick={() => setShowKeyboard(!showKeyboard)}
                style={{
                  width: 38, height: 38,
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: showKeyboard ? 'var(--sims-blue-subtle)' : 'transparent',
                  color: showKeyboard ? simsBlue : textTert,
                  border: 'none', cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <KeyboardIcon />
              </motion.button>

              {/* Send button */}
              <motion.button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                style={{
                  width: 38, height: 38,
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: inputValue.trim() ? simsBlue : 'var(--bg-tertiary)',
                  color: inputValue.trim() ? 'var(--text-inverse)' : textTert,
                  border: 'none', cursor: 'pointer',
                  opacity: !inputValue.trim() || isLoading ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                }}
                whileHover={inputValue.trim() ? { scale: 1.1 } : undefined}
                whileTap={inputValue.trim() ? { scale: 0.9 } : undefined}
              >
                <SendIcon />
              </motion.button>
            </div>
          </form>

          {/* Virtual Keyboard */}
          <AnimatePresence>
            {showKeyboard && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                style={{ marginTop: 12 }}
              >
                <VirtualKeyboard
                  inputValue={inputValue}
                  onInputChange={setInputValue}
                  onSubmit={() => sendMessage(inputValue)}
                  onClose={() => setShowKeyboard(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}