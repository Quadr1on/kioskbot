'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ChoiceChipProps {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    variant?: 'default' | 'primary' | 'subtle';
    index?: number;
    disabled?: boolean;
}

export default function ChoiceChip({
    label,
    icon,
    onClick,
    variant = 'default',
    index = 0,
    disabled = false,
}: ChoiceChipProps) {
    const variantStyles = {
        default: {
            bg: 'var(--bg-secondary)',
            border: 'var(--border-medium)',
            text: 'var(--text-primary)',
            hoverBg: 'var(--sims-blue-subtle)',
            hoverBorder: 'var(--sims-blue)',
        },
        primary: {
            bg: 'var(--sims-blue)',
            border: 'var(--sims-blue)',
            text: '#FFFFFF',
            hoverBg: 'var(--sims-blue-dark)',
            hoverBorder: 'var(--sims-blue-dark)',
        },
        subtle: {
            bg: 'var(--bg-tertiary)',
            border: 'var(--border-light)',
            text: 'var(--text-secondary)',
            hoverBg: 'var(--bg-secondary)',
            hoverBorder: 'var(--border-medium)',
        },
    };

    const s = variantStyles[variant];

    return (
        <motion.button
            onClick={onClick}
            disabled={disabled}
            className="flex items-center gap-2 whitespace-nowrap font-medium transition-all"
            style={{
                background: s.bg,
                border: `1.5px solid ${s.border}`,
                borderRadius: 'var(--radius-full)',
                color: s.text,
                padding: '10px 20px',
                fontSize: '14px',
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
            }}
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.9 }}
            transition={{
                delay: index * 0.04,
                duration: 0.35,
                ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={!disabled ? {
                scale: 1.04,
                y: -2,
                transition: { duration: 0.2 },
            } : undefined}
            whileTap={!disabled ? { scale: 0.96 } : undefined}
            layout
        >
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {label}
        </motion.button>
    );
}
