'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff } from 'lucide-react';
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
      console.log('DEBUG: Tool calls:', data.toolCalls);
      console.log('DEBUG: Tool results:', data.toolResults);

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
          
          // Connect audio output to analyser for visualization if supported
          // Note: connecting Audio element to Web Audio API requires CORS / interaction
          // For simplicity/robustness, we'll simulate 'speaking' state in AnimatedOrb
          
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
        <div className="relative min-h-screen bg-black overflow-hidden flex flex-col">
            <div className="absolute top-6 left-6 z-10">
                <button 
                    onClick={onSwitchToChat}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                    <span className="text-sm font-medium">Exit Voice Mode</span>
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
    <div className="relative min-h-screen bg-black overflow-hidden flex flex-col items-center justify-center">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black pointer-events-none" />

      {/* Header */}
      <div className="absolute top-6 left-6 z-10">
          <button 
              onClick={onSwitchToChat}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
              <X className="w-6 h-6" />
              <span className="text-sm font-medium">Exit</span>
          </button>
      </div>

      <div className="absolute top-6 right-6 z-10">
          <span className="px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-300 border border-gray-700">
              {language === 'en-IN' ? 'English' : 'தமிழ்'}
          </span>
      </div>

      {/* Main Content */}
      <main className="relative z-0 flex flex-col items-center justify-center w-full max-w-lg px-6">
        <div 
            onClick={toggleRecording}
            className="cursor-pointer transform hover:scale-105 transition-transform duration-300"
        >
            <AnimatedOrb 
                state={status} 
                analyser={analyserRef.current} 
            />
        </div>

        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 text-center"
        >
            <p className="text-gray-400 text-lg font-medium tracking-wide">
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
