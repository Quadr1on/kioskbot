'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface HomeTileProps {
    icon: ReactNode;
    label: string;
    subtitle?: string;
    accentColor: string;
    onClick: () => void;
    isLarge?: boolean;
    index?: number;
}

export default function HomeTile({
    icon,
    label,
    subtitle,
    accentColor,
    onClick,
    isLarge = false,
    index = 0,
}: HomeTileProps) {
    return (
        <motion.button
            onClick={onClick}
            className={`glass-card group relative flex flex-col items-start justify-between overflow-hidden text-left
        ${isLarge ? 'col-span-2 row-span-2 p-8' : 'p-6'}
      `}
            style={{ '--tile-accent': accentColor } as React.CSSProperties}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                delay: 0.1 + index * 0.08,
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={{
                y: -4,
                scale: 1.02,
                transition: { duration: 0.25 },
            }}
            whileTap={{ scale: 0.97 }}
        >
            {/* Accent gradient background on hover */}
            <motion.div
                className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                    background: `linear-gradient(135deg, ${accentColor}08 0%, ${accentColor}15 100%)`,
                }}
            />

            {/* Accent glow border on hover */}
            <motion.div
                className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                    boxShadow: `inset 0 0 0 1.5px ${accentColor}40, 0 8px 32px ${accentColor}15`,
                }}
            />

            {/* Icon container */}
            <div
                className={`relative z-10 flex items-center justify-center rounded-[var(--radius-lg)] ${isLarge ? 'mb-6 h-16 w-16' : 'mb-4 h-12 w-12'}`}
                style={{
                    background: `${accentColor}12`,
                    color: accentColor,
                }}
            >
                {icon}
            </div>

            {/* Text */}
            <div className="relative z-10">
                <h3
                    className={`font-semibold ${isLarge ? 'text-xl' : 'text-base'}`}
                    style={{ color: 'var(--text-primary)' }}
                >
                    {label}
                </h3>
                {subtitle && (
                    <p
                        className={`mt-1 font-normal ${isLarge ? 'text-sm' : 'text-xs'}`}
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {subtitle}
                    </p>
                )}
            </div>

            {/* Arrow indicator */}
            <div
                className="absolute right-4 top-4 opacity-0 transition-opacity duration-200 group-hover:opacity-60"
                style={{ color: accentColor }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                </svg>
            </div>
        </motion.button>
    );
}
