'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock } from 'lucide-react';
import AnimatedOrb from './AnimatedOrb';
import LanguageSelector from './LanguageSelector';
import { getPreloadedGreeting, areGreetingsLoaded, preloadGreetings, GREETINGS } from '@/lib/greetingCache';

interface VoiceModeProps {
  onSwitchToChat?: () => void;
}

export default function VoiceMode({ onSwitchToChat }: VoiceModeProps) {
  const [hasSelectedLanguage, setHasSelectedLanguage] = useState(false);
  const [status, setStatus] = useState<'idle' | 'greeting' | 'recording' | 'processing' | 'speaking'>('idle');
  const [language, setLanguage] = useState<'en-IN' | 'ta-IN'>('en-IN');
  const [conversationHistory, setConversationHistory] = useState<{ role: string; content: string }[]>([]);
  const [hasPlayedGreeting, setHasPlayedGreeting] = useState(false);
  
  // Transcript state for display
  const [userTranscript, setUserTranscript] = useState<string>('');
  const [aiTranscript, setAiTranscript] = useState<string>('');
  const [currentSpeaker, setCurrentSpeaker] = useState<'user' | 'ai' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Time slot buttons state
  const [timeSlots, setTimeSlots] = useState<{ id: number; time: string }[]>([]);
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  
  // Use a ref to track conversation history reliably (avoids React state update race conditions)
  const conversationHistoryRef = useRef<{ role: string; content: string }[]>([]);
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const responseAudioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Silence detection refs
  const silenceCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const silentFramesRef = useRef<number>(0);
  const hasSpeechStartedRef = useRef<boolean>(false); // Track if user has started speaking
  const SILENCE_THRESHOLD = 15; // Audio level threshold (0-255)
  const SPEECH_THRESHOLD = 25; // Higher threshold to detect actual speech
  const SILENCE_FRAMES_REQUIRED = 15; // ~750ms at 50ms intervals (more forgiving)
  
  // Ensure greetings are loaded (fallback if not preloaded on home page)
  useEffect(() => {
    if (!areGreetingsLoaded()) {
      preloadGreetings();
    }
  }, []);

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
    transcriptContainer: {
      marginTop: '24px',
      textAlign: 'center' as const,
      maxWidth: '400px',
      minHeight: '60px',
    },
    transcriptText: {
      color: '#e5e7eb',
      fontSize: '16px',
      lineHeight: 1.6,
      display: 'flex',
      flexWrap: 'wrap' as const,
      justifyContent: 'center',
      gap: '6px',
    },
    transcriptWord: {
      display: 'inline-block',
    },
    speakerLabel: {
      color: '#6b7280',
      fontSize: '12px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.1em',
      marginBottom: '8px',
    },
    // Time slot button styles
    timeSlotsOverlay: {
      position: 'absolute' as const,
      right: '24px',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 20,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'flex-end',
      gap: '8px',
      maxHeight: '70vh',
      overflowY: 'auto' as const,
      paddingRight: '4px',
    },
    timeSlotsTitle: {
      color: '#9ca3af',
      fontSize: '12px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.1em',
      marginBottom: '4px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    timeSlotButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 20px',
      background: 'rgba(30, 64, 175, 0.25)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(99, 130, 255, 0.3)',
      borderRadius: '9999px',
      color: '#c7d2fe',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap' as const,
      minWidth: '160px',
      justifyContent: 'center',
    },
  };

  // Animation variants for word-by-word reveal
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.06,
      },
    },
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const }
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
        // Clear silence detection
        if (silenceCheckIntervalRef.current) {
          clearInterval(silenceCheckIntervalRef.current);
          silenceCheckIntervalRef.current = null;
        }
        silentFramesRef.current = 0;
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Stop all tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // Only process if we have audio data
        if (audioChunksRef.current.length > 0) {
          setStatus('processing');
          await processAudio(audioBlob);
        } else {
          // No audio captured, restart recording
          startRecording();
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms for better chunking
      setStatus('recording');
      
      // Start silence detection - but only trigger AFTER user starts speaking
      silentFramesRef.current = 0;
      hasSpeechStartedRef.current = false; // Reset speech detection flag
      
      silenceCheckIntervalRef.current = setInterval(() => {
        if (!analyserRef.current || !mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
          return;
        }
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        
        // First, check if user has started speaking
        if (!hasSpeechStartedRef.current) {
          if (average >= SPEECH_THRESHOLD) {
            // User has started speaking!
            hasSpeechStartedRef.current = true;
            silentFramesRef.current = 0;
            console.log('DEBUG: Speech detected, now tracking silence');
          }
          // If user hasn't started speaking yet, don't do anything - keep listening
          return;
        }
        
        // User has started speaking - now track silence
        if (average < SILENCE_THRESHOLD) {
          silentFramesRef.current++;
          // Check if we've had enough silent frames after speech
          if (silentFramesRef.current >= SILENCE_FRAMES_REQUIRED && audioChunksRef.current.length > 0) {
            // User spoke and then stopped - process the audio
            console.log('DEBUG: Silence detected after speech, stopping recording');
            stopRecording();
          }
        } else {
          // Reset silence counter when voice is detected
          silentFramesRef.current = 0;
        }
      }, 50); // Check every 50ms
      
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

      // Set user transcript for display animation
      setCurrentSpeaker('user');
      setUserTranscript(text);
      setAiTranscript('');
      setIsAnimating(true);

      await handleTranscript(text);
    } catch (error) {
      console.error('Processing error:', error);
      setStatus('idle');
    }
  };

  const handleTranscript = async (text: string) => {
    // Use ref for reliable history tracking (avoids React state race conditions)
    const previousHistory = [...conversationHistoryRef.current]; // Save for rollback
    const newHistory = [...previousHistory, { role: 'user', content: text }];
    conversationHistoryRef.current = newHistory;
    setConversationHistory(newHistory);
    
    console.log('DEBUG: Sending conversation history to LLM:', JSON.stringify(newHistory, null, 2));

    try {
      // Use non-streaming mode for voice - waits for complete response including tool results
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHistory, stream: false }),
      });

      if (!chatResponse.ok) {
        console.error('Chat API error:', chatResponse.status);
        throw new Error(`Chat failed with status ${chatResponse.status}`);
      }

      const data = await chatResponse.json();
      const fullResponse = data.text || '';

      console.log('DEBUG: VoiceMode received response:', fullResponse);
      console.log('DEBUG: VoiceMode toolResults:', data.toolResults);

      // Check if the response contains time slot data from getDoctorTimeSlots
      let detectedSlots: { id: number; time: string }[] = [];
      if (data.toolResults && Array.isArray(data.toolResults)) {
        for (const result of data.toolResults) {
          if (result && result.availableSlots && Array.isArray(result.availableSlots)) {
            detectedSlots = result.availableSlots;
            break;
          }
        }
      }

      if (detectedSlots.length > 0) {
        // Show time slot buttons instead of reading them all out
        setTimeSlots(detectedSlots);
        setShowTimeSlots(true);
        console.log('DEBUG: Detected time slots, showing buttons:', detectedSlots);
      }

      // Update both ref and state with the assistant's response
      const updatedHistory = [...newHistory, { role: 'assistant', content: fullResponse }];
      conversationHistoryRef.current = updatedHistory;
      setConversationHistory(updatedHistory);

      if (fullResponse && fullResponse.trim().length > 0) {
        // If time slots are shown, don't auto-restart recording — wait for button tap
        await playTTS(fullResponse, detectedSlots.length === 0);
      } else {
        console.log('DEBUG: No text response from LLM');
        setStatus('idle');
        // Restart recording even on empty response
        setTimeout(() => startRecording(), 300);
      }
    } catch (error) {
      console.error('Chat error:', error);
      
      // Rollback conversation history to before this message
      // This prevents having orphan user messages without assistant responses
      conversationHistoryRef.current = previousHistory;
      setConversationHistory(previousHistory);
      
      // Play an error message to the user
      const errorMessage = language === 'en-IN' 
        ? 'Sorry, I had trouble processing that. Could you please repeat?' 
        : 'மன்னிக்கவும், அதை செயலாக்குவதில் சிக்கல் ஏற்பட்டது. தயவுசெய்து மீண்டும் சொல்ல முடியுமா?';
      
      setStatus('speaking');
      await playTTS(errorMessage, true);
    }
  };

  // Handle time slot button selection
  const handleTimeSlotSelect = (slot: { id: number; time: string }) => {
    // Hide the buttons
    setShowTimeSlots(false);
    setTimeSlots([]);

    // Stop any ongoing TTS
    stopSpeaking();

    // Send the selection as a user message
    const selectionText = `I'll take the ${slot.time} slot`;
    setCurrentSpeaker('user');
    setUserTranscript(selectionText);
    setAiTranscript('');
    setIsAnimating(true);
    setStatus('processing');

    // Feed it into the conversation
    handleTranscript(selectionText);
  };

  const playTTS = async (text: string, autoRestartRecording: boolean = true) => {
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
          
          // Set AI transcript for display animation
          setCurrentSpeaker('ai');
          setUserTranscript('');
          setAiTranscript(text);
          setIsAnimating(true);
          
          setStatus('speaking');
          
          audio.onended = () => {
            setStatus('idle');
            setIsAnimating(false);
            // Auto-restart recording after speaking for continuous conversation
            if (autoRestartRecording) {
              setTimeout(() => startRecording(), 300);
            }
          };
          await audio.play();
        } else {
            setStatus('idle');
            if (autoRestartRecording) {
              setTimeout(() => startRecording(), 300);
            }
        }
      } else {
          setStatus('idle');
          if (autoRestartRecording) {
            setTimeout(() => startRecording(), 300);
          }
      }
    } catch (error) {
      console.error('TTS error:', error);
      setStatus('idle');
      if (autoRestartRecording) {
        setTimeout(() => startRecording(), 300);
      }
    }
  };

  // Play greeting when entering voice mode - uses pre-loaded audio for instant playback
  const playGreeting = async (lang: 'en-IN' | 'ta-IN') => {
    setStatus('greeting');
    
    // Try to use pre-loaded audio from shared cache first
    const preloadedAudio = getPreloadedGreeting(lang);
    
    if (preloadedAudio) {
      // Use pre-loaded audio - instant playback!
      console.log('DEBUG: Using pre-loaded greeting audio from cache');
      if (responseAudioRef.current) {
        responseAudioRef.current.pause();
      }
      const audio = new Audio(`data:audio/wav;base64,${preloadedAudio}`);
      responseAudioRef.current = audio;
      
      audio.onended = () => {
        setHasPlayedGreeting(true);
        setStatus('idle');
        // Auto-start recording after greeting
        setTimeout(() => startRecording(), 300);
      };
      
      try {
        await audio.play();
        return;
      } catch (error) {
        console.error('Failed to play pre-loaded audio:', error);
        // Fall through to fetch fresh audio
      }
    }
    
    // Fallback: fetch greeting audio if pre-load failed
    console.log('DEBUG: Pre-loaded audio not available, fetching fresh');
    const greetingText = lang === 'en-IN' ? GREETINGS.en : GREETINGS.ta;
    
    try {
      const response = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: greetingText, language: lang }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.audio) {
          if (responseAudioRef.current) {
            responseAudioRef.current.pause();
          }
          const audio = new Audio(`data:audio/wav;base64,${data.audio}`);
          responseAudioRef.current = audio;
          
          audio.onended = () => {
            setHasPlayedGreeting(true);
            setStatus('idle');
            setTimeout(() => startRecording(), 300);
          };
          await audio.play();
        } else {
          setHasPlayedGreeting(true);
          setStatus('idle');
          setTimeout(() => startRecording(), 300);
        }
      } else {
        setHasPlayedGreeting(true);
        setStatus('idle');
        setTimeout(() => startRecording(), 300);
      }
    } catch (error) {
      console.error('Greeting TTS error:', error);
      setHasPlayedGreeting(true);
      setStatus('idle');
      setTimeout(() => startRecording(), 300);
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
    } else if (status === 'speaking' || status === 'greeting') {
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
                // Play greeting after language selection
                playGreeting(lang);
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

      {/* Time Slot Buttons */}
      <AnimatePresence>
        {showTimeSlots && timeSlots.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.3 }}
            style={styles.timeSlotsOverlay}
          >
            <div style={styles.timeSlotsTitle}>
              <Clock size={14} />
              <span>Select a time slot</span>
            </div>
            {timeSlots.map((slot, index) => (
              <motion.button
                key={slot.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.25, delay: index * 0.06 }}
                style={styles.timeSlotButton}
                onClick={() => handleTimeSlotSelect(slot)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 93, 214, 0.45)';
                  e.currentTarget.style.borderColor = 'rgba(129, 160, 255, 0.6)';
                  e.currentTarget.style.color = '#e0e7ff';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(30, 64, 175, 0.25)';
                  e.currentTarget.style.borderColor = 'rgba(99, 130, 255, 0.3)';
                  e.currentTarget.style.color = '#c7d2fe';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <Clock size={14} />
                {slot.time}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

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
                {status === 'idle' && 'Ready to listen'}
                {status === 'greeting' && 'Welcome...'}
                {status === 'recording' && 'Listening...'}
                {status === 'processing' && 'Thinking...'}
                {status === 'speaking' && 'Speaking... Tap to interrupt'}
            </p>
        </motion.div>

        {/* Transcript Display */}
        {(userTranscript || aiTranscript) && (
          <div style={styles.transcriptContainer}>
            <p style={styles.speakerLabel}>
              {currentSpeaker === 'user' ? 'You said:' : 'Assistant:'}
            </p>
            <motion.div
              key={`${currentSpeaker}-${userTranscript || aiTranscript}`}
              variants={containerVariants}
              initial="hidden"
              animate={isAnimating ? "visible" : "hidden"}
              style={styles.transcriptText}
            >
              {(currentSpeaker === 'user' ? userTranscript : aiTranscript)
                .split(' ')
                .filter(word => word.length > 0)
                .map((word, index) => (
                  <motion.span
                    key={index}
                    variants={wordVariants}
                    style={styles.transcriptWord}
                  >
                    {word}
                  </motion.span>
                ))}
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
