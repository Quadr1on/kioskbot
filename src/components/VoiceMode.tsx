'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock } from 'lucide-react';
import AnimatedOrb from './AnimatedOrb';
import LanguageSelector from './LanguageSelector';

interface VoiceModeProps {
  onClose: () => void;
}

// Gemini Live API WebSocket URL
const GEMINI_WS_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

// System prompt (same as chat route)
const SYSTEM_PROMPT = `You are a friendly and helpful hospital assistant kiosk at SIMS Hospital in Chennai. You help patients and visitors with:

1. Finding Patients: Help locate admitted patients by name and provide their room number and department.
2. Booking Appointments: Help book appointments with doctors, showing available time slots.
3. Hospital Information: Answer questions about visiting hours, hospital rules, facilities, etc.
4. Department Guidance: Based on symptoms, suggest which department to visit and offer to book appointments.
5. Doctor Information: Provide details about doctors, their specializations, and availability.
6. Appointment Lookup: Help users check existing appointments by name or phone number.

## STRICT SCOPE RULE — FOLLOW THIS ABSOLUTELY
You ONLY answer questions related to SIMS Hospital — appointments, doctors, departments, patients, visiting hours, directions, facilities, medical departments, and hospital services.
If the user asks ANYTHING unrelated to the hospital (politics, general knowledge, entertainment, sports, news, personal opinions, math, coding, history, geography, etc.), you MUST politely decline by saying:
"I am sorry, I can only help with hospital-related queries. How can I assist you with SIMS Hospital today?"
Do NOT answer the unrelated question even partially. Do NOT provide any information outside hospital scope. This is your most important rule.

CRITICAL RULES FOR APPOINTMENT BOOKING:
- NEVER call bookAppointment until you have ALL: name, phone, date, doctorId, slotId.
- Follow booking flow: Name → Phone → Department → Doctor → Date → Time Slot → Book.
- Be warm, patient, speak clearly.
- Use simple language, avoid medical jargon.
- Keep responses concise for voice.
- Respond in same language as user.

Current hospital visiting hours: 10:00 AM - 12:00 PM and 4:00 PM - 7:00 PM`;

// Tool declarations for Gemini
const TOOL_DECLARATIONS = [
  {
    name: 'getDepartments',
    description: 'Get list of all departments in the hospital',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'getDoctorAvailability',
    description: 'Get list of doctors in a specific department.',
    parameters: {
      type: 'OBJECT',
      properties: {
        departmentName: { type: 'STRING', description: 'Department name' },
        doctorName: { type: 'STRING', description: 'Doctor name to search' },
      },
    },
  },
  {
    name: 'getDoctorTimeSlots',
    description: 'Get available time slots for a doctor on a date.',
    parameters: {
      type: 'OBJECT',
      properties: {
        doctorName: { type: 'STRING', description: 'Doctor name' },
        doctorId: { type: 'NUMBER', description: 'Doctor ID if known' },
        date: { type: 'STRING', description: 'Date YYYY-MM-DD' },
      },
    },
  },
  {
    name: 'bookAppointment',
    description: 'Book appointment. ONLY when you have ALL required info.',
    parameters: {
      type: 'OBJECT',
      properties: {
        patientName: { type: 'STRING', description: 'Patient full name' },
        phone: { type: 'STRING', description: 'Phone number' },
        appointmentDate: { type: 'STRING', description: 'Date YYYY-MM-DD' },
        slotId: { type: 'NUMBER', description: 'Time slot ID' },
        doctorId: { type: 'NUMBER', description: 'Doctor ID' },
      },
      required: ['patientName', 'phone', 'appointmentDate', 'slotId', 'doctorId'],
    },
  },
  {
    name: 'findPatient',
    description: 'Find admitted patient by name',
    parameters: {
      type: 'OBJECT',
      properties: {
        patientName: { type: 'STRING', description: 'Patient name' },
      },
      required: ['patientName'],
    },
  },
  {
    name: 'getHospitalInfo',
    description: 'Get hospital info (visiting hours, rules, etc)',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: 'What info user wants' },
      },
      required: ['query'],
    },
  },
  {
    name: 'suggestDepartment',
    description: 'Suggest department based on symptoms',
    parameters: {
      type: 'OBJECT',
      properties: {
        symptoms: { type: 'STRING', description: 'Patient symptoms' },
      },
      required: ['symptoms'],
    },
  },
  {
    name: 'getAppointmentDetails',
    description: 'Look up existing appointments by name/phone',
    parameters: {
      type: 'OBJECT',
      properties: {
        patientName: { type: 'STRING', description: 'Patient name' },
        phone: { type: 'STRING', description: 'Phone number' },
      },
    },
  },
];

export default function VoiceMode({ onClose }: VoiceModeProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [userTranscript, setUserTranscript] = useState<string>('');
  const [aiTranscript, setAiTranscript] = useState<string>('');
  const [currentSpeaker, setCurrentSpeaker] = useState<'user' | 'ai' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Time slot buttons
  const [timeSlots, setTimeSlots] = useState<{ id: number; time: string }[]>([]);
  const [showTimeSlots, setShowTimeSlots] = useState(false);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const isConnectedRef = useRef(false);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sessionIdRef = useRef<string>(`voice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const aiTextBuffer = useRef<string>('');

  // Log conversation event to Supabase
  const logEvent = useCallback((role: string, content: string, metadata?: any) => {
    fetch('/api/admin/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionIdRef.current,
        mode: 'voice',
        language: selectedLanguage || 'en-IN',
        role,
        content,
        metadata,
      }),
    }).catch(err => console.error('Log error:', err));
  }, [selectedLanguage]);

  // Styles
  const styles: Record<string, React.CSSProperties> = {
    container: {
      position: 'fixed',
      inset: 0,
      background: '#000000',
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 24px',
      position: 'relative',
      zIndex: 10,
    },
    titleWrapper: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    title: {
      color: 'white',
      fontSize: '18px',
      fontWeight: 600,
    },
    statusDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: status === 'listening' ? '#22c55e' : status === 'processing' ? '#f59e0b' : status === 'speaking' ? '#3b82f6' : '#6b7280',
      boxShadow: status === 'listening' ? '0 0 8px #22c55e' : 'none',
    },
    closeButton: {
      color: '#9ca3af',
      cursor: 'pointer',
      padding: '8px',
      borderRadius: '8px',
      background: 'rgba(255,255,255,0.05)',
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
    },
    mainContent: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    orbContainer: {
      cursor: 'pointer',
      transition: 'transform 0.3s ease',
    },
    transcriptArea: {
      position: 'absolute',
      bottom: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '80%',
      maxWidth: '600px',
      textAlign: 'center',
    },
    transcriptText: {
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: '16px',
      lineHeight: 1.5,
      textShadow: '0 0 20px rgba(100, 100, 255, 0.3)',
    },
    statusText: {
      color: '#9ca3af',
      fontSize: '14px',
      textAlign: 'center',
      padding: '16px',
      letterSpacing: '0.05em',
    },
    speakerLabel: {
      color: '#6b7280',
      fontSize: '12px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.1em',
      marginBottom: '8px',
    },
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

  const wordVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.3, ease: 'easeOut' },
    }),
  };

  // Execute tool call via server API
  const executeTool = useCallback(async (functionName: string, args: any) => {
    console.log('DEBUG: Executing tool:', functionName, args);
    try {
      const response = await fetch('/api/voice/execute-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ functionName, args }),
      });
      const result = await response.json();
      console.log('DEBUG: Tool result:', result);

      // Check for time slots
      if (result.availableSlots && Array.isArray(result.availableSlots)) {
        setTimeSlots(result.availableSlots);
        setShowTimeSlots(true);
      }

      return result;
    } catch (error) {
      console.error('DEBUG: Tool error:', error);
      return { error: 'Tool execution failed' };
    }
  }, []);

  // ---- Audio Playback ----

  // Decode base64 PCM (16-bit, 24kHz) to Float32Array
  const decodePCM = (base64: string): Float32Array => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768.0;
    }
    return float32;
  };

  // Play audio from queue
  const playAudioQueue = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;
    isPlayingRef.current = true;
    setStatus('speaking');
    setCurrentSpeaker('ai');

    while (audioQueueRef.current.length > 0) {
      const float32 = audioQueueRef.current.shift()!;
      const ctx = audioContextRef.current;
      if (!ctx || ctx.state === 'closed') break;

      // Resume if suspended
      if (ctx.state === 'suspended') await ctx.resume();

      const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      // Route through analyser → gain → destination
      if (analyserRef.current && gainNodeRef.current) {
        source.connect(analyserRef.current);
        analyserRef.current.connect(gainNodeRef.current);
        gainNodeRef.current.connect(ctx.destination);
      } else {
        source.connect(ctx.destination);
      }

      source.start();
      await new Promise<void>(resolve => { source.onended = () => resolve(); });
    }

    isPlayingRef.current = false;
    setStatus('listening');
    setCurrentSpeaker(null);
    setIsAnimating(false);
  }, []);

  // ---- WebSocket Connection ----

  const connectToGemini = useCallback(async (language: string) => {
    try {
      setStatus('processing');
      console.log('DEBUG: Starting Gemini Live connection...');

      // Get API key
      const keyRes = await fetch('/api/voice/gemini-token');
      const keyData = await keyRes.json();
      if (!keyData.apiKey) {
        console.error('DEBUG: No API key');
        return;
      }

      // Create audio context for playback at 24kHz
      const audioCtx = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const gainNode = audioCtx.createGain();
      gainNode.gain.value = 1.0;
      gainNodeRef.current = gainNode;

      // Connect WebSocket
      const wsUrl = `${GEMINI_WS_URL}?key=${keyData.apiKey}`;
      console.log('DEBUG: Connecting to WebSocket...');
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('DEBUG: WebSocket connected! Sending setup...');
        isConnectedRef.current = true;

        const languageInstruction = language === 'ta-IN'
          ? '\nIMPORTANT: The user speaks Tamil. Respond in Tamil. Greet with "SIMS மருத்துவமனைக்கு வரவேற்கிறோம்!".'
          : '\nGreet the user with "Welcome to SIMS Hospital! How can I help you today?"';

        // Send BidiGenerateContentSetup
        const setupMessage = {
          setup: {
            model: 'models/gemini-2.5-flash-native-audio-preview-12-2025',
            generationConfig: {
              responseModalities: ['AUDIO'],
            },
            systemInstruction: {
              parts: [{ text: SYSTEM_PROMPT + languageInstruction }],
            },
            tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
          },
        };

        ws.send(JSON.stringify(setupMessage));
        console.log('DEBUG: Setup message sent');
      };

      ws.onmessage = async (event) => {
        try {
          let data: any;
          if (event.data instanceof Blob) {
            const text = await event.data.text();
            data = JSON.parse(text);
          } else {
            data = JSON.parse(event.data);
          }

          console.log('DEBUG: WS message:', Object.keys(data));

          // Setup complete
          if (data.setupComplete) {
            console.log('DEBUG: Setup complete! Starting mic...');
            await startMicCapture();
            setStatus('listening');
            return;
          }

          // Server content (audio/text response)
          if (data.serverContent) {
            const sc = data.serverContent;

            if (sc.interrupted) {
              console.log('DEBUG: Interrupted');
              audioQueueRef.current.length = 0;
              isPlayingRef.current = false;
              return;
            }

            if (sc.modelTurn?.parts) {
              for (const part of sc.modelTurn.parts) {
                if (part.inlineData?.data) {
                  setIsAnimating(true);
                  const float32 = decodePCM(part.inlineData.data);
                  audioQueueRef.current.push(float32);
                  playAudioQueue();
                }
                if (part.text) {
                  setAiTranscript(prev => prev + part.text);
                  aiTextBuffer.current += part.text;
                }
              }
            }

            if (sc.turnComplete) {
              console.log('DEBUG: Turn complete');
              // Log accumulated AI response text
              if (aiTextBuffer.current.trim()) {
                logEvent('assistant', aiTextBuffer.current);
                aiTextBuffer.current = '';
              }
            }
          }

          // Tool call from Gemini
          if (data.toolCall) {
            console.log('DEBUG: Tool call:', data.toolCall);
            setStatus('processing');

            const functionResponses: any[] = [];
            for (const fc of data.toolCall.functionCalls) {
              logEvent('tool_call', fc.name, { args: fc.args || {} });
              const result = await executeTool(fc.name, fc.args || {});
              logEvent('tool_result', fc.name, { result });
              functionResponses.push({
                name: fc.name,
                id: fc.id,
                response: result,
              });
            }

            // Send tool response back
            const toolResponseMsg = {
              toolResponse: { functionResponses },
            };
            ws.send(JSON.stringify(toolResponseMsg));
            console.log('DEBUG: Tool response sent');
          }

        } catch (err) {
          console.error('DEBUG: Error parsing WS message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('DEBUG: WebSocket error:', error);
      };

      ws.onclose = (event) => {
        console.log('DEBUG: WebSocket closed:', event.code, event.reason);
        isConnectedRef.current = false;
        setStatus('idle');
      };

    } catch (error) {
      console.error('DEBUG: Connection error:', error);
      setStatus('idle');
    }
  }, [executeTool, playAudioQueue]);

  // ---- Microphone Capture ----

  const startMicCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Create a separate AudioContext for mic capture at native rate
      // We need the worklet to handle resampling to 16kHz
      const audioCtx = audioContextRef.current;
      if (!audioCtx) return;

      // We use a ScriptProcessorNode for broader compatibility (AudioWorklet can have issues loading)
      // Create a separate context for mic at native sample rate
      const micCtx = new AudioContext();
      const source = micCtx.createMediaStreamSource(stream);

      const bufferSize = 4096;
      const scriptNode = micCtx.createScriptProcessor(bufferSize, 1, 1);

      scriptNode.onaudioprocess = (e) => {
        if (!isConnectedRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);

        // Resample from micCtx.sampleRate to 16000
        const ratio = micCtx.sampleRate / 16000;
        const outputLength = Math.floor(inputData.length / ratio);
        const pcm16 = new Int16Array(outputLength);

        for (let i = 0; i < outputLength; i++) {
          const srcIdx = Math.floor(i * ratio);
          const sample = Math.max(-1, Math.min(1, inputData[srcIdx]));
          pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        }

        // Convert to base64
        const bytes = new Uint8Array(pcm16.buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);

        // Send realtime input
        const realtimeMsg = {
          realtimeInput: {
            mediaChunks: [{
              data: base64,
              mimeType: 'audio/pcm;rate=16000',
            }],
          },
        };
        wsRef.current.send(JSON.stringify(realtimeMsg));
      };

      source.connect(scriptNode);
      scriptNode.connect(micCtx.destination); // Required to keep it alive
      
      console.log('DEBUG: Mic capture started at', micCtx.sampleRate, 'Hz');
      setStatus('listening');
    } catch (error) {
      console.error('DEBUG: Mic access error:', error);
    }
  };

  // Handle time slot button selection
  const handleTimeSlotSelect = (slot: { id: number; time: string }) => {
    setShowTimeSlots(false);
    setTimeSlots([]);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const selectionText = `I want the ${slot.time} slot. The slot ID is ${slot.id}.`;
      const clientMsg = {
        clientContent: {
          turns: [{ role: 'user', parts: [{ text: selectionText }] }],
          turnComplete: true,
        },
      };
      wsRef.current.send(JSON.stringify(clientMsg));
      setCurrentSpeaker('user');
      setUserTranscript(selectionText);
      setAiTranscript('');
      setStatus('processing');
    }
  };

  // Handle language selection
  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    connectToGemini(language);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      isConnectedRef.current = false;
    };
  }, []);

  // Language selector screen
  if (!selectedLanguage) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={styles.container}
      >
        <div style={styles.header}>
          <div style={styles.titleWrapper}>
            <span style={styles.title}>Voice Mode</span>
          </div>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={20} />
          </button>
        </div>
        <LanguageSelector onSelect={handleLanguageSelect} />
      </motion.div>
    );
  }

  const getStatusText = () => {
    switch (status) {
      case 'listening': return 'Listening...';
      case 'processing': return 'Processing...';
      case 'speaking': return 'Speaking...';
      default: return 'Connecting...';
    }
  };

  const displayTranscript = currentSpeaker === 'user' ? userTranscript : aiTranscript;
  const words = displayTranscript.split(' ').filter(w => w.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={styles.container}
    >
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.titleWrapper}>
          <span style={styles.title}>Voice Mode</span>
          <div style={styles.statusDot} />
        </div>
        <button onClick={onClose} style={styles.closeButton}>
          <X size={20} />
        </button>
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

      {/* Orb */}
      <main style={styles.mainContent}>
        <div
          style={styles.orbContainer}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <AnimatedOrb
            state={status}
            analyser={analyserRef.current}
          />
        </div>
      </main>

      {/* Status */}
      <div style={styles.statusText}>
        {getStatusText()}
      </div>
    </motion.div>
  );
}
