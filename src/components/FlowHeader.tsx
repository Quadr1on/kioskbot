'use client';

import { motion } from 'framer-motion';

interface FlowHeaderProps {
    breadcrumbs: string[];
    onBack: () => void;
    title: string;
}

export default function FlowHeader({ breadcrumbs, onBack, title }: FlowHeaderProps) {
    return (
        <motion.div
            className="glass-strong flex items-center gap-4 px-6 py-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ borderBottom: '1px solid var(--border-light)' }}
        >
            {/* Back button */}
            <motion.button
                onClick={onBack}
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    border: 'none',
                }}
                whileHover={{ scale: 1.08, background: 'var(--sims-blue-subtle)' }}
                whileTap={{ scale: 0.92 }}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6" />
                </svg>
            </motion.button>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-1 overflow-hidden">
                {breadcrumbs.map((crumb, i) => (
                    <span key={i} className="flex items-center gap-1">
                        {i > 0 && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m9 18 6-6-6-6" />
                            </svg>
                        )}
                        <motion.span
                            className="whitespace-nowrap text-xs font-medium"
                            style={{
                                color: i === breadcrumbs.length - 1 ? 'var(--sims-blue)' : 'var(--text-tertiary)',
                            }}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05, duration: 0.3 }}
                        >
                            {crumb}
                        </motion.span>
                    </span>
                ))}
            </div>

            {/* Title */}
            <motion.h2
                className="ml-auto text-lg font-semibold"
                style={{ color: 'var(--text-primary)' }}
                key={title}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
            >
                {title}
            </motion.h2>
        </motion.div>
    );
}
