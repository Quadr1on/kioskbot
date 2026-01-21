'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import AnimatedOrb from './AnimatedOrb';
import LanguageSelector from './LanguageSelector';

interface VoiceModeProps {
  onSwitchToChat?: () => void;
}

export default function VoiceMode({ onSwitchToChat }: VoiceModeProps) {
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);
  const [status, setStatus] = useState<'idle' | 'recording' | 'processing' | 'speaking'>('idle');
  const [language, setLanguage] = useState<'en-IN' | 'ta-IN'>('en-IN');
  const [conversationHistory, setConversationHistory] = useState<{ role: string; content: string }[]>([]);
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const responseAudioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Styles matching the new design language
  const styles = {
    container: {
      position: 'relative' as const,
      minHeight: '100vh',
      backgroundColor: 'black',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backgroundGlow: {
      position: 'absolute' as const,
      inset: 0,
      background: 'radial-gradient(circle at center, rgba(30, 64, 175, 0.2), black, black)',
      pointerEvents: 'none' as const,
    },
    exitButtonContainer: {
      position: 'absolute' as const,
      top: '24px',
      left: '24px',
      zIndex: 10,
    },
    exitButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: 'transparent',
      border: 'none',
      color: '#9ca3af',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 500,
      transition: 'color 0.2s',
    },
    languageBadgeContainer: {
      position: 'absolute' as const,
      top: '24px',
      right: '24px',
      zIndex: 10,
    },
    languageBadge: {
      padding: '4px 12px',
      backgroundColor: '#1f2937',
      borderRadius: '9999px',
      fontSize: '12px',
      color: '#d1d5db',
      border: '1px solid #374151',
    },
    mainContent: {
      position: 'relative' as const,
      zIndex: 0,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      maxWidth: '512px',
      padding: '0 24px',
    },
    orbContainer: {
      cursor: 'pointer',
      transform: 'scale(1)',
      transition: 'transform 0.3s',
    },
    statusTextContainer: {
      marginTop: '48px',
      textAlign: 'center' as const,
    },
    statusText: {
      color: '#9ca3af',
      fontSize: '18px',
      fontWeight: 500,
      letterSpacing: '0.025em',
      margin: 0,
    },
  };

  // Initialize Audio Context
  const initAudioContext = () => {
    if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
    }
    if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
    }
  };

  const startRecording = async () => {
    try {
      initAudioContext();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Connect stream to analyser
      if (audioContextRef.current && analyserRef.current) {
          const source = audioContextRef.current.createMediaStreamSource(stream);
          source.connect(analyserRef.current);
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Stop all tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        setStatus('processing');
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setStatus('recording');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('language', language);

      const sttResponse = await fetch('/api/voice/stt', {
        method: 'POST',
        body: formData,
      });

      if (!sttResponse.ok) throw new Error('STT failed');
      const sttData = await sttResponse.json();
      const text = sttData.transcript;

      if (!text) {
          setStatus('idle');
          return;
      }

      await handleTranscript(text);
    } catch (error) {
      console.error('Processing error:', error);
      setStatus('idle');
    }
  };

  const handleTranscript = async (text: string) => {
    const newHistory = [...conversationHistory, { role: 'user', content: text }];
    setConversationHistory(newHistory);

    try {
      // Use non-streaming mode for voice - waits for complete response including tool results
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHistory, stream: false }),
      });

      if (!chatResponse.ok) throw new Error('Chat failed');

      const data = await chatResponse.json();
      const fullResponse = data.text || '';

      console.log('DEBUG: VoiceMode received response:', fullResponse);
      
      setConversationHistory([...newHistory, { role: 'assistant', content: fullResponse }]);

      if (fullResponse && fullResponse.trim().length > 0) {
        await playTTS(fullResponse);
      } else {
        console.log('DEBUG: No text response from LLM');
        setStatus('idle');
      }
    } catch (error) {
      console.error('Chat error:', error);
      setStatus('idle');
    }
  };

  const playTTS = async (text: string) => {
    try {
      const response = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audio) {
          if (responseAudioRef.current) {
              responseAudioRef.current.pause();
          }
          const audio = new Audio(`data:audio/wav;base64,${data.audio}`);
          responseAudioRef.current = audio;
          
          setStatus('speaking');
          
          audio.onended = () => setStatus('idle');
          await audio.play();
        } else {
            setStatus('idle');
        }
      } else {
          setStatus('idle');
      }
    } catch (error) {
      console.error('TTS error:', error);
      setStatus('idle');
    }
  };

  const stopSpeaking = () => {
      if (responseAudioRef.current) {
          responseAudioRef.current.pause();
          responseAudioRef.current = null;
      }
      setStatus('idle');
  };

  // Toggle recording
  const toggleRecording = () => {
    if (status === 'idle') {
        startRecording();
    } else if (status === 'recording') {
        stopRecording();
    } else if (status === 'speaking') {
        stopSpeaking();
    }
  };

  if (!hasSelectedLanguage) {
    return (
        <div style={styles.container}>
            <div style={styles.exitButtonContainer}>
                <button 
                    onClick={onSwitchToChat}
                    style={styles.exitButton}
                >
                    <X size={24} />
                    <span>Exit Voice Mode</span>
                </button>
            </div>
            <LanguageSelector onSelect={(lang) => {
                setLanguage(lang);
                setHasSelectedLanguage(true);
            }} />
        </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Background Ambient Glow */}
      <div style={styles.backgroundGlow} />

      {/* Header */}
      <div style={styles.exitButtonContainer}>
          <button 
              onClick={onSwitchToChat}
              style={styles.exitButton}
              onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
          >
              <X size={24} />
              <span>Exit</span>
          </button>
      </div>

      <div style={styles.languageBadgeContainer}>
          <span style={styles.languageBadge}>
              {language === 'en-IN' ? 'English' : 'தமிழ்'}
          </span>
      </div>

      {/* Main Content */}
      <main style={styles.mainContent}>
        <div 
            onClick={toggleRecording}
            style={styles.orbContainer}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
            <AnimatedOrb 
                state={status} 
                analyser={analyserRef.current} 
            />
        </div>

        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={styles.statusTextContainer}
        >
            <p style={styles.statusText}>
                {status === 'idle' && 'Tap to speak'}
                {status === 'recording' && 'Listening... Tap to stop'}
                {status === 'processing' && 'Thinking...'}
                {status === 'speaking' && 'Speaking... Tap to interrupt'}
            </p>
        </motion.div>
      </main>
    </div>
  );
}
