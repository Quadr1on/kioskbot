'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface AnimatedOrbProps {
  state: 'idle' | 'recording' | 'processing' | 'speaking';
  analyser?: AnalyserNode | null;
}

export default function AnimatedOrb({ state, analyser }: AnimatedOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    // Particles configuration
    const particles: { x: number; y: number; size: number; speed: number; offset: number }[] = [];
    const particleCount = 50;

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1,
            speed: Math.random() * 0.02 + 0.01,
            offset: Math.random() * Math.PI * 2,
        });
    }

    const draw = () => {
      time += 0.01;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Center coordinates
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Base gradient for the orb
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120);
      
      if (state === 'idle') {
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)'); // Blue core
        gradient.addColorStop(0.5, 'rgba(147, 197, 253, 0.4)'); // Light blue middle
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)'); // Transparent edge
      } else if (state === 'recording') {
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.8)'); // Red core
        gradient.addColorStop(0.5, 'rgba(252, 165, 165, 0.4)');
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
      } else if (state === 'processing') {
        gradient.addColorStop(0, 'rgba(234, 179, 8, 0.8)'); // Yellow core
        gradient.addColorStop(0.5, 'rgba(253, 224, 71, 0.4)');
        gradient.addColorStop(1, 'rgba(234, 179, 8, 0)');
      } else if (state === 'speaking') {
        gradient.addColorStop(0, 'rgba(34, 197, 94, 0.8)'); // Green core
        gradient.addColorStop(0.5, 'rgba(134, 239, 172, 0.4)');
        gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
      }

      // Draw main orb glow
      ctx.fillStyle = gradient;
      ctx.beginPath();
      
      // Dynamic radius based on state
      let radius = 100;
      if (state === 'idle') {
          radius = 100 + Math.sin(time) * 5;
      } else if (state === 'recording') {
          // If we had real audio data here, we'd use it. For now, simulate rapid movement
          const dataArray = new Uint8Array(analyser ? analyser.frequencyBinCount : 0);
          if (analyser) analyser.getByteFrequencyData(dataArray);
          const volume = analyser ? dataArray.reduce((src, a) => src + a, 0) / dataArray.length : 0;
          radius = 100 + (volume > 0 ? volume / 2 : Math.sin(time * 10) * 10);
      } else if (state === 'processing') {
          radius = 100 + Math.sin(time * 5) * 10;
      } else if (state === 'speaking') {
          // Simulate speaking pulses
          radius = 100 + Math.sin(time * 8) * 15;
      }

      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw floating particles
      particles.forEach((p, i) => {
          const orbitRadius = 130 + Math.sin(time + p.offset) * 20;
          const angle = time * p.speed + p.offset;
          const px = cx + Math.cos(angle) * orbitRadius;
          const py = cy + Math.sin(angle) * orbitRadius;
          
          ctx.globalAlpha = 0.6;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    // Set canvas size
    canvas.width = 400;
    canvas.height = 400;

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state, analyser]);

  return (
    <div className="relative flex items-center justify-center">
      {/* Background glow effects */}
      <motion.div
        className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full"
        animate={{
          scale: state === 'speaking' ? 1.2 : 1,
          opacity: state === 'idle' ? 0.5 : 0.8,
        }}
        transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
      />
      
      <canvas
        ref={canvasRef}
        className="relative z-10 w-[300px] h-[300px] md:w-[400px] md:h-[400px]"
      />
    </div>
  );
}
