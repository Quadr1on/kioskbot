'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from './MessageBubble';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  onSwitchToVoice?: () => void;
}

// Quick action buttons for common tasks
const QUICK_ACTIONS = [
  { label: 'Book Appointment', message: 'I want to book an appointment' },
  { label: 'Find Patient', message: 'Find a patient by name' },
  { label: 'Visiting Hours', message: 'What are the visiting hours?' },
];

// Appointment flow quick actions
const APPOINTMENT_ACTIONS = {
  departments: [
    { label: 'Cardiology', message: 'Cardiology' },
    { label: 'Neurology', message: 'Neurology' },
    { label: 'Orthopedics', message: 'Orthopedics' },
    { label: 'General Medicine', message: 'General Medicine' },
  ],
};

export default function ChatInterface({ onSwitchToVoice }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [language, setLanguage] = useState<'en-IN' | 'ta-IN'>('en-IN');
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Detect if we're in appointment booking flow
  const isInAppointmentFlow = messages.some(m => 
    m.content.toLowerCase().includes('book an appointment') ||
    m.content.toLowerCase().includes('which department')
  );

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message to API
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
          language 
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
        content: language === 'ta-IN' 
          ? 'மன்னிக்கவும், பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.'
          : 'Sorry, I encountered an error. Please try again.',
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, language]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        const formData = new FormData();
        formData.append('audio', audioBlob);
        formData.append('language', language);

        try {
          const res = await fetch('/api/voice/stt', { method: 'POST', body: formData });
          if (res.ok) {
            const data = await res.json();
            if (data.transcript) {
              setInputValue(data.transcript);
            }
          }
        } catch (err) {
          console.error('STT error:', err);
        }
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  // Styles object for inline styles (bypasses Tailwind issues)
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      height: '100vh',
      width: '100%',
      backgroundColor: '#121212',
    },
    centerWrapper: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      width: '100%',
      padding: '24px',
    },
    chatBox: {
      display: 'flex',
      flexDirection: 'column' as const,
      width: '75%',
      maxWidth: '900px',
      height: '100%',
      backgroundColor: '#1a1a1a',
      borderRadius: '24px',
      overflow: 'hidden',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '24px 32px',
      borderBottom: '1px solid #2a2a2a',
    },
    title: {
      fontSize: '24px',
      fontWeight: 700,
      color: 'white',
      margin: 0,
    },
    menuButton: {
      padding: '8px',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      color: '#9ca3af',
    },
    menuDropdown: {
      position: 'absolute' as const,
      right: 0,
      top: '48px',
      width: '180px',
      backgroundColor: '#212121',
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
      zIndex: 50,
    },
    messagesArea: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: '24px 32px',
    },
    welcomeContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      textAlign: 'center' as const,
    },
    welcomeIcon: {
      width: '80px',
      height: '80px',
      background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '24px',
    },
    welcomeTitle: {
      fontSize: '28px',
      fontWeight: 600,
      color: 'white',
      margin: '0 0 8px 0',
    },
    welcomeText: {
      fontSize: '16px',
      color: '#9ca3af',
      margin: 0,
    },
    quickActions: {
      display: 'flex',
      gap: '12px',
      padding: '16px 32px',
      overflowX: 'auto' as const,
      borderTop: '1px solid #2a2a2a',
    },
    quickActionButton: {
      padding: '12px 20px',
      backgroundColor: '#212121',
      border: '1px solid #3a3a3a',
      borderRadius: '24px',
      color: 'white',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      whiteSpace: 'nowrap' as const,
      transition: 'all 0.2s',
    },
    inputArea: {
      padding: '16px 32px 32px',
    },
    inputContainer: {
      display: 'flex',
      alignItems: 'center',
      backgroundColor: '#212121',
      borderRadius: '28px',
      padding: '8px 16px',
    },
    micButton: {
      padding: '12px',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    textInput: {
      flex: 1,
      background: 'transparent',
      border: 'none',
      outline: 'none',
      color: 'white',
      fontSize: '16px',
      padding: '12px',
    },
    sendButton: {
      padding: '12px',
      background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
      border: 'none',
      borderRadius: '50%',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.centerWrapper}>
        <div style={styles.chatBox}>
          {/* Header */}
          <header style={styles.header}>
            <h1 style={styles.title}>SIMS AI</h1>
            
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                style={styles.menuButton}
              >
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="5" r="2"/>
                  <circle cx="12" cy="12" r="2"/>
                  <circle cx="12" cy="19" r="2"/>
                </svg>
              </button>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    style={styles.menuDropdown}
                  >
                    <div style={{ padding: '8px 0' }}>
                      <p style={{ padding: '8px 16px', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Language</p>
                      <button
                        onClick={() => { setLanguage('en-IN'); setShowMenu(false); }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          textAlign: 'left',
                          background: language === 'en-IN' ? '#374151' : 'transparent',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        English
                        {language === 'en-IN' && <span style={{ color: '#60a5fa' }}>✓</span>}
                      </button>
                      <button
                        onClick={() => { setLanguage('ta-IN'); setShowMenu(false); }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          textAlign: 'left',
                          background: language === 'ta-IN' ? '#374151' : 'transparent',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        தமிழ்
                        {language === 'ta-IN' && <span style={{ color: '#60a5fa' }}>✓</span>}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </header>

          {/* Messages Area */}
          <div style={styles.messagesArea}>
            {messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={styles.welcomeContainer}
              >
                <div style={styles.welcomeIcon}>
                  <svg width="40" height="40" fill="none" stroke="white" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 style={styles.welcomeTitle}>
                  {language === 'ta-IN' ? 'வணக்கம்!' : 'Welcome!'}
                </h2>
                <p style={styles.welcomeText}>
                  {language === 'ta-IN' 
                    ? 'நான் உங்களுக்கு எப்படி உதவ முடியும்?'
                    : 'How can I help you today?'}
                </p>
              </motion.div>
            )}

            <AnimatePresence>
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  role={message.role}
                  content={message.content}
                />
              ))}
            </AnimatePresence>

            {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
              <MessageBubble role="assistant" content="" isLoading />
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div style={styles.quickActions}>
            {(isInAppointmentFlow ? APPOINTMENT_ACTIONS.departments : QUICK_ACTIONS).map((action) => (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.02, borderColor: '#3B82F6' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => sendMessage(action.message)}
                disabled={isLoading}
                style={{
                  ...styles.quickActionButton,
                  opacity: isLoading ? 0.5 : 1,
                }}
              >
                {action.label}
              </motion.button>
            ))}
          </div>

          {/* Input Area */}
          <div style={styles.inputArea}>
            <form onSubmit={handleSubmit}>
              <div style={styles.inputContainer}>
                {/* Mic Button */}
                <button
                  type="button"
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  style={{
                    ...styles.micButton,
                    color: isRecording ? '#ef4444' : '#9ca3af',
                  }}
                >
                  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                </button>

                {/* Text Input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={language === 'ta-IN' ? 'உங்கள் செய்தியை தட்டச்சு செய்யவும்...' : 'Type your message...'}
                  style={styles.textInput}
                  disabled={isLoading}
                />

                {/* Send Button */}
                <motion.button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    ...styles.sendButton,
                    opacity: (!inputValue.trim() || isLoading) ? 0.3 : 1,
                  }}
                >
                  <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </motion.button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
