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

const QUICK_ACTIONS = [
  { label: '📅 Book Appointment', message: 'I want to book an appointment' },
  { label: '🔍 Find Patient', message: 'Find a patient by name' },
  { label: '🏥 Visiting Hours', message: 'What are the visiting hours?' },
];

const APPOINTMENT_ACTIONS = {
  departments: [
    { label: '❤️ Cardiology', message: 'Cardiology' },
    { label: '🧠 Neurology', message: 'Neurology' },
    { label: '🦴 Orthopedics', message: 'Orthopedics' },
    { label: '⚕️ General Medicine', message: 'General Medicine' },
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

  const isInAppointmentFlow = messages.some(m => 
    m.content.toLowerCase().includes('book an appointment') ||
    m.content.toLowerCase().includes('which department')
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100%',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #f3f4f6 100%)',
      fontFamily: '"Segoe UI", "Helvetica Neue", sans-serif',
    }}>
      <style>{`
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(0,0,0,0.1) transparent;
        }
        *::-webkit-scrollbar {
          width: 6px;
        }
        *::-webkit-scrollbar-track {
          background: transparent;
        }
        *::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.1);
          border-radius: 3px;
        }
        *::-webkit-scrollbar-thumb:hover {
          background: rgba(0,0,0,0.2);
        }
        input::placeholder {
          color: #a0aec0;
          font-weight: 400;
        }
      `}</style>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        width: '100%',
        padding: '0',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: '900px',
          height: '100%',
          backgroundColor: 'white',
          borderRadius: '0',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
        }}>
          {/* Header */}
          <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            borderBottom: '2px solid #e0f2fe',
            background: 'linear-gradient(90deg, #ffffff 0%, #f0f9ff 100%)',
            boxShadow: '0 2px 8px rgba(14, 165, 233, 0.08)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {/* Hospital Logo */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
                style={{
                  width: '44px',
                  height: '44px',
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
                }}
              >
                <img src="/sims-logo.jpg" alt="" />
              </motion.div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <h1 style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: '#0c2d4a',
                  margin: 0,
                  letterSpacing: '-0.5px',
                }}>SIMS Healthcare</h1>
                <p style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#0ea5e9',
                  margin: 0,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}>AI Assistant</p>
              </div>
            </div>
            
            <div style={{ position: 'relative' }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMenu(!showMenu)}
                style={{
                  padding: '8px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.color = '#1f2937';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#6b7280';
                }}
              >
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="5" r="2"/>
                  <circle cx="12" cy="12" r="2"/>
                  <circle cx="12" cy="19" r="2"/>
                </svg>
              </motion.button>

              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -10 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '48px',
                      width: '200px',
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                      zIndex: 50,
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <div style={{ padding: '8px 0' }}>
                      <p style={{ padding: '8px 16px', fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Language</p>
                      <motion.button
                        whileHover={{ background: '#f3f4f6' }}
                        onClick={() => { setLanguage('en-IN'); setShowMenu(false); }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          textAlign: 'left',
                          background: language === 'en-IN' ? '#eff6ff' : 'transparent',
                          border: 'none',
                          color: language === 'en-IN' ? '#1f2937' : '#4b5563',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '14px',
                          fontWeight: language === 'en-IN' ? 600 : 500,
                          transition: 'all 0.15s',
                        }}
                      >
                        English
                        {language === 'en-IN' && <span style={{ color: '#3b82f6', fontWeight: 700 }}>✓</span>}
                      </motion.button>
                      <motion.button
                        whileHover={{ background: '#f3f4f6' }}
                        onClick={() => { setLanguage('ta-IN'); setShowMenu(false); }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          textAlign: 'left',
                          background: language === 'ta-IN' ? '#eff6ff' : 'transparent',
                          border: 'none',
                          color: language === 'ta-IN' ? '#1f2937' : '#4b5563',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '14px',
                          fontWeight: language === 'ta-IN' ? 600 : 500,
                          transition: 'all 0.15s',
                        }}
                      >
                        தமிழ்
                        {language === 'ta-IN' && <span style={{ color: '#3b82f6', fontWeight: 700 }}>✓</span>}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.header>

          {/* Messages Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  textAlign: 'center',
                }}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  style={{
                    width: '90px',
                    height: '90px',
                    background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '28px',
                    boxShadow: '0 15px 40px rgba(14, 165, 233, 0.25)',
                    position: 'relative',
                  }}
                >
                  <svg width="50" height="50" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 7.5A2.5 2.5 0 016 5h12a2.5 2.5 0 012.5 2.5v9A2.5 2.5 0 0118 19H6a2.5 2.5 0 01-2.5-2.5v-9z" />
                  </svg>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                      position: 'absolute',
                      inset: '-4px',
                      border: '2px solid rgba(14, 165, 233, 0.3)',
                      borderRadius: '20px',
                      pointerEvents: 'none',
                    }}
                  />
                </motion.div>
                <motion.h2 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  style={{
                    fontSize: '32px',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #0c2d4a 0%, #0284c7 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    margin: '0 0 12px 0',
                    letterSpacing: '-0.8px',
                  }}
                >
                  {language === 'ta-IN' ? 'வணக்கம்!' : 'Welcome!'}
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  style={{
                    fontSize: '17px',
                    color: '#4b5563',
                    margin: 0,
                    fontWeight: 600,
                    lineHeight: '1.6',
                  }}
                >
                  {language === 'ta-IN' 
                    ? 'நிச்சய ஆரோக்கியத்துக்கு உங்கள் மருத்துவ உதவி'
                    : 'Your AI-powered healthcare companion'}
                </motion.p>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.55 }}
                  style={{
                    fontSize: '14px',
                    color: '#8b94a1',
                    margin: '8px 0 0 0',
                    fontWeight: 500,
                  }}
                >
                  {language === 'ta-IN' 
                    ? 'நियமன பதிவு, நோயாளி தகவல், மற்றும் மேலும் பல'
                    : 'Appointments, patient info, visiting hours & more'}
                </motion.p>
              </motion.div>
            )}

            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <MessageBubble
                    role={message.role}
                    content={message.content}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <MessageBubble role="assistant" content="" isLoading />
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              display: 'flex',
              gap: '8px',
              padding: '12px 24px',
              overflowX: 'auto',
              borderTop: '2px solid #e0f2fe',
              background: 'linear-gradient(180deg, #f8fafb 0%, #f0f9ff 100%)',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {(isInAppointmentFlow ? APPOINTMENT_ACTIONS.departments : QUICK_ACTIONS).map((action, index) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => sendMessage(action.message)}
                disabled={isLoading}
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'white',
                  border: '1.5px solid #cffafe',
                  borderRadius: '24px',
                  color: '#0c2d4a',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                  opacity: isLoading ? 0.5 : 1,
                  boxShadow: '0 2px 8px rgba(14, 165, 233, 0.08)',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.borderColor = '#0ea5e9';
                    e.currentTarget.style.color = '#0284c7';
                    e.currentTarget.style.backgroundColor = '#f0f9ff';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(14, 165, 233, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#cffafe';
                  e.currentTarget.style.color = '#0c2d4a';
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(14, 165, 233, 0.08)';
                }}
              >
                {action.label}
              </motion.button>
            ))}
          </motion.div>

          {/* Input Area */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{
              padding: '16px 24px 24px',
              background: 'linear-gradient(180deg, #ffffff 0%, #f0f9ff 100%)',
            }}
          >
            <form onSubmit={handleSubmit}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'white',
                borderRadius: '28px',
                padding: '10px 16px',
                border: '1.5px solid #cffafe',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(14, 165, 233, 0.08)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#0ea5e9';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(14, 165, 233, 0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#cffafe';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(14, 165, 233, 0.08)';
              }}
              >
                {/* Mic Button */}
                <motion.button
                  type="button"
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '10px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isRecording ? '#ef4444' : '#7c8ea3',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => !isRecording && (e.currentTarget.style.color = '#0ea5e9')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = isRecording ? '#ef4444' : '#7c8ea3')}
                >
                  <svg width="22" height="22" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                </motion.button>

                {/* Text Input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={language === 'ta-IN' ? 'உங்கள் செய்தியை தட்டச்சு செய்யவும்...' : 'Type your message...'}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#0c2d4a',
                    fontSize: '15px',
                    padding: '10px 12px',
                    fontFamily: 'inherit',
                    fontWeight: 500,
                  }}
                  disabled={isLoading}
                />

                {/* Send Button */}
                <motion.button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  whileHover={!(!inputValue.trim() || isLoading) ? { scale: 1.1 } : {}}
                  whileTap={!(!inputValue.trim() || isLoading) ? { scale: 0.95 } : {}}
                  style={{
                    padding: '10px',
                    background: !inputValue.trim() || isLoading ? '#e5e7eb' : 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: (!inputValue.trim() || isLoading) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    boxShadow: (!inputValue.trim() || isLoading) ? 'none' : '0 4px 12px rgba(14, 165, 233, 0.4)',
                  }}
                >
                  <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}