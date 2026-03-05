'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';

interface MicOrbProps {
    onTranscript: (text: string) => void;
    disabled?: boolean;
    language?: string;
}

export default function MicOrb({ onTranscript, disabled = false, language = 'en-IN' }: MicOrbProps) {
    const { isDark } = useTheme();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animFrameRef = useRef<number>(0);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const [state, setState] = useState<'idle' | 'listening' | 'processing'>('idle');
    const [amplitude, setAmplitude] = useState(0);

    // Adaptive orb color: black on light, white on dark
    const orbColor = isDark ? '#FFFFFF' : '#1A1A2E';
    const orbGlow = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,102,204,0.3)';

    // Canvas animation
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const size = canvas.width;
        const center = size / 2;
        const baseRadius = size * 0.32;

        let time = 0;

        const draw = () => {
            ctx.clearRect(0, 0, size, size);
            time += 0.03;

            // Get volume from analyser
            let vol = 0;
            if (state === 'listening' && analyserRef.current) {
                const data = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(data);
                const avg = data.reduce((a, b) => a + b, 0) / data.length;
                vol = Math.min(1.2, avg / 100);
                setAmplitude(vol);
            } else if (state === 'processing') {
                vol = 0.3 + Math.sin(time * 4) * 0.15;
            } else {
                vol = 0;
                setAmplitude(0);
            }

            // Dynamic radius
            const radius = baseRadius + vol * baseRadius * 0.6;

            // Outer glow rings
            if (state === 'listening') {
                for (let i = 3; i >= 1; i--) {
                    const ringRadius = radius + i * 6 + Math.sin(time * 2 + i) * 3;
                    const alpha = 0.08 - i * 0.02;
                    ctx.beginPath();
                    ctx.arc(center, center, ringRadius, 0, Math.PI * 2);
                    ctx.strokeStyle = isDark
                        ? `rgba(255,255,255,${alpha})`
                        : `rgba(0,102,204,${alpha})`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }

            // Main orb with subtle noise
            const numPoints = 64;
            ctx.beginPath();
            for (let i = 0; i <= numPoints; i++) {
                const angle = (i / numPoints) * Math.PI * 2;
                const noise = state !== 'idle'
                    ? Math.sin(angle * 3 + time * 2) * vol * 4
                    + Math.sin(angle * 5 + time * 3) * vol * 2
                    : Math.sin(angle * 2 + time) * 0.5;
                const r = radius + noise;
                const x = center + Math.cos(angle) * r;
                const y = center + Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();

            // Fill with gradient
            const gradient = ctx.createRadialGradient(center, center, 0, center, center, radius);
            if (state === 'listening') {
                gradient.addColorStop(0, isDark ? 'rgba(255,255,255,0.95)' : 'rgba(0,102,204,0.9)');
                gradient.addColorStop(1, isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,102,204,0.5)');
            } else if (state === 'processing') {
                gradient.addColorStop(0, isDark ? 'rgba(255,200,50,0.9)' : 'rgba(237,137,54,0.9)');
                gradient.addColorStop(1, isDark ? 'rgba(255,200,50,0.5)' : 'rgba(237,137,54,0.5)');
            } else {
                gradient.addColorStop(0, isDark ? 'rgba(255,255,255,0.9)' : 'rgba(26,26,46,0.85)');
                gradient.addColorStop(1, isDark ? 'rgba(255,255,255,0.55)' : 'rgba(26,26,46,0.5)');
            }
            ctx.fillStyle = gradient;
            ctx.fill();

            // Mic icon in center
            ctx.save();
            ctx.translate(center, center);
            const iconScale = 0.55 + vol * 0.05;
            ctx.scale(iconScale, iconScale);

            const iconColor = state === 'listening'
                ? (isDark ? '#0A0E1A' : '#FFFFFF')
                : state === 'processing'
                    ? '#FFFFFF'
                    : (isDark ? '#0A0E1A' : '#FFFFFF');

            ctx.strokeStyle = iconColor;
            ctx.fillStyle = iconColor;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';

            // Mic body
            ctx.beginPath();
            ctx.roundRect(-8, -20, 16, 26, 8);
            ctx.fill();

            // Mic cup
            ctx.beginPath();
            ctx.arc(0, 6, 16, 0, Math.PI);
            ctx.stroke();

            // Mic stand
            ctx.beginPath();
            ctx.moveTo(0, 22);
            ctx.lineTo(0, 30);
            ctx.stroke();

            // Mic base
            ctx.beginPath();
            ctx.moveTo(-8, 30);
            ctx.lineTo(8, 30);
            ctx.stroke();

            ctx.restore();

            animFrameRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, [state, isDark]);

    // Start recording
    const startRecording = useCallback(async () => {
        if (disabled || state !== 'idle') return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Set up analyser for amplitude visualization
            const audioCtx = new AudioContext();
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;

            // Set up recorder
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus',
            });
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                stream.getTracks().forEach((t) => t.stop());
                analyserRef.current = null;
                await processAudio(audioBlob);
            };

            mediaRecorder.start();
            setState('listening');
        } catch (err) {
            console.error('Mic access denied:', err);
        }
    }, [disabled, state]);

    // Stop recording
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && state === 'listening') {
            mediaRecorderRef.current.stop();
            setState('processing');
        }
    }, [state]);

    // Process audio via STT
    const processAudio = async (audioBlob: Blob) => {
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob);
            formData.append('language', language);

            const resp = await fetch('/api/voice/stt', { method: 'POST', body: formData });
            if (!resp.ok) throw new Error('STT failed');

            const data = await resp.json();
            if (data.transcript) {
                onTranscript(data.transcript);
            }
        } catch (err) {
            console.error('STT error:', err);
        } finally {
            setState('idle');
        }
    };

    const toggleRecording = () => {
        if (state === 'idle') startRecording();
        else if (state === 'listening') stopRecording();
    };

    return (
        <div className="relative flex items-center justify-center">
            <motion.button
                onClick={toggleRecording}
                disabled={disabled || state === 'processing'}
                className="relative flex items-center justify-center"
                style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: 'transparent',
                    border: state === 'idle'
                        ? (isDark ? '2.5px solid rgba(0,102,204,0.6)' : '2.5px solid rgba(0,102,204,0.3)')
                        : '2.5px solid transparent',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.4 : 1,
                    boxShadow: state === 'idle' && isDark
                        ? '0 0 16px rgba(0,102,204,0.3), 0 0 4px rgba(0,102,204,0.2)'
                        : state === 'listening'
                            ? '0 0 24px rgba(0,102,204,0.5)'
                            : 'none',
                    transition: 'box-shadow 0.3s, border-color 0.3s',
                }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                animate={state === 'idle' ? {
                    boxShadow: isDark
                        ? ['0 0 12px rgba(0,102,204,0.2)', '0 0 20px rgba(0,102,204,0.4)', '0 0 12px rgba(0,102,204,0.2)']
                        : ['0 0 8px rgba(0,102,204,0.1)', '0 0 16px rgba(0,102,204,0.25)', '0 0 8px rgba(0,102,204,0.1)']
                } : undefined}
                transition={state === 'idle' ? { boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' } } : undefined}
                aria-label={state === 'listening' ? 'Stop recording' : 'Start voice input'}
            >
                <canvas
                    ref={canvasRef}
                    width={160}
                    height={160}
                    style={{
                        width: 72,
                        height: 72,
                    }}
                />
            </motion.button>

            {/* State label */}
            <AnimatePresence>
                {state !== 'idle' && (
                    <motion.span
                        className="absolute -bottom-6 whitespace-nowrap text-[11px] font-medium"
                        style={{ color: 'var(--text-tertiary)' }}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                    >
                        {state === 'listening' ? 'Tap to stop' : 'Processing…'}
                    </motion.span>
                )}
            </AnimatePresence>
        </div>
    );
}
