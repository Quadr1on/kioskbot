'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';

interface AnimatedOrbProps {
  state: 'idle' | 'recording' | 'processing' | 'speaking';
  analyser?: AnalyserNode | null;
}

function ParticleSphere({ state, analyser }: { state: string, analyser?: AnalyserNode | null }) {
  const points = useRef<THREE.Points>(null!);
  const noise3D = useMemo(() => createNoise3D(), []);
  
  // Initial positions for a sphere
  const count = 4000; // Increased particle count for better density
  const [positions, originalPositions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const orig = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        // Uniform sphere distribution
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const r = 1.2 + Math.random() * 0.3; // Base radius with some fuzziness

        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);

        pos[3 * i] = x;
        pos[3 * i + 1] = y;
        pos[3 * i + 2] = z;

        orig[3 * i] = x;
        orig[3 * i + 1] = y;
        orig[3 * i + 2] = z;
    }
    return [pos, orig];
  }, []);

  const color = useMemo(() => {
    switch (state) {
      case 'recording': return '#ef4444'; // Red
      case 'processing': return '#eab308'; // Yellow
      case 'speaking': return '#22c55e'; // Green
      case 'idle':
      default: return '#3b82f6'; // Blue
    }
  }, [state]);

  useFrame((stateContext) => {
    const { clock } = stateContext;
    const time = clock.getElapsedTime();
    
    let volume = 0;
    // Get volume data in real-time
    if (state === 'recording' && analyser) {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        // Calculate average volume
        const avg = dataArray.reduce((src, a) => src + a, 0) / dataArray.length;
        // Normalize and scale up for effect. Average is usually 0-255.
        // We want a value roughly 0 to 1.5
        volume = Math.max(0, (avg / 128) - 0.1); 
    } else if (state === 'speaking') {
         // Simulate talking animation
         volume = (Math.sin(time * 8) + 1) * 0.2;
    } else if (state === 'processing') {
         volume = 0.1 + Math.sin(time * 15) * 0.05;
    }

    if (points.current) {
        // Smooth color transition
        const currentColor = new THREE.Color(color);
        // We can interpolate if we wanted, but simple switch is fine for now or we can use lerp
        // points.current.material.color.lerp(currentColor, 0.1); // Need to cast material
        // For simplicity, just setting it (PointMaterial handles it well usually)
        
        const positionsArray = points.current.geometry.attributes.position.array as Float32Array;
        
        // Optimize: Don't recreate array, just mutate
        for(let i=0; i<count; i++) {
           const ix = i*3;
           const iy = i*3+1;
           const iz = i*3+2;
           
           const ox = originalPositions[ix];
           const oy = originalPositions[iy];
           const oz = originalPositions[iz];
           
           // Noise field for movement
           // Scale noise frequency and amplitude
           const noiseFreq = 0.5;
           const noiseAmp = 0.2;
           const nx = noise3D(ox * noiseFreq + time * 0.3, oy * noiseFreq + time * 0.3, oz * noiseFreq + time * 0.3);
           const ny = noise3D(oy * noiseFreq + time * 0.3, oz * noiseFreq + time * 0.3, ox * noiseFreq + time * 0.3);
           const nz = noise3D(oz * noiseFreq + time * 0.3, ox * noiseFreq + time * 0.3, oy * noiseFreq + time * 0.3);
           
           // Expansion based on volume
           // To scale "according to loudness", we multiply the position vector by a factor
           let expansion = 1;
           
           if (state === 'recording' || state === 'speaking') {
               // More volume = more expansion. 
               // Add a base expansion + volume factor
               expansion = 1 + volume * 0.8; 
           } else {
               // Breathing in idle
               expansion = 1 + Math.sin(time) * 0.05;
           }

           // Apply new positions
           positionsArray[ix] = (ox + nx * noiseAmp) * expansion;
           positionsArray[iy] = (oy + ny * noiseAmp) * expansion;
           positionsArray[iz] = (oz + nz * noiseAmp) * expansion;
       }
       points.current.geometry.attributes.position.needsUpdate = true;
       
       // Slower rotation for the whole sphere
       points.current.rotation.y = time * 0.05;
       points.current.rotation.x = time * 0.02;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
      </bufferGeometry>
      <PointMaterial
        transparent
        color={color}
        size={0.06}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function AnimatedOrb({ state, analyser }: AnimatedOrbProps) {
  return (
    // Ensure the canvas takes full size of the container
    <div className="w-[300px] h-[300px] md:w-[400px] md:h-[400px]">
        <Canvas camera={{ position: [0, 0, 4.5], fov: 60 }} gl={{ antialias: true, alpha: true }}>
            {/* Ambient light for subtle fill if we had standard material */}
            <ambientLight intensity={0.5} />
            <ParticleSphere state={state} analyser={analyser} />
        </Canvas>
    </div>
  );
}
