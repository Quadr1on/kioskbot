'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type TextSize = 'small' | 'medium' | 'large';
type ColorBlindMode = 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';

const TEXT_SIZES: Record<TextSize, number> = {
    small: 16,
    medium: 18,
    large: 22,
};

const COLOR_BLIND_FILTERS: Record<ColorBlindMode, string> = {
    none: 'none',
    deuteranopia: 'url(#deuteranopia-filter)',
    protanopia: 'url(#protanopia-filter)',
    tritanopia: 'url(#tritanopia-filter)',
};

export default function AccessibilityPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [textSize, setTextSize] = useState<TextSize>('medium');
    const [highContrast, setHighContrast] = useState(false);
    const [colorBlindMode, setColorBlindMode] = useState<ColorBlindMode>('none');

    // Load saved preferences
    useEffect(() => {
        const savedSize = localStorage.getItem('a11y-text-size') as TextSize;
        const savedContrast = localStorage.getItem('a11y-high-contrast');
        const savedCB = localStorage.getItem('a11y-color-blind') as ColorBlindMode;
        if (savedSize && TEXT_SIZES[savedSize]) setTextSize(savedSize);
        if (savedContrast === 'true') setHighContrast(true);
        if (savedCB && COLOR_BLIND_FILTERS[savedCB]) setColorBlindMode(savedCB);
    }, []);

    // Apply text size
    useEffect(() => {
        document.documentElement.style.fontSize = `${TEXT_SIZES[textSize]}px`;
        localStorage.setItem('a11y-text-size', textSize);
    }, [textSize]);

    // Apply high contrast
    useEffect(() => {
        if (highContrast) {
            document.documentElement.classList.add('high-contrast');
        } else {
            document.documentElement.classList.remove('high-contrast');
        }
        localStorage.setItem('a11y-high-contrast', String(highContrast));
    }, [highContrast]);

    // Apply color blind filter
    useEffect(() => {
        document.documentElement.style.filter = COLOR_BLIND_FILTERS[colorBlindMode];
        localStorage.setItem('a11y-color-blind', colorBlindMode);
    }, [colorBlindMode]);

    const cbModes: { id: ColorBlindMode; label: string; desc: string }[] = [
        { id: 'none', label: 'None', desc: 'Default colors' },
        { id: 'deuteranopia', label: 'Deuteranopia', desc: 'Red-green (common)' },
        { id: 'protanopia', label: 'Protanopia', desc: 'Red weakness' },
        { id: 'tritanopia', label: 'Tritanopia', desc: 'Blue-yellow' },
    ];

    return (
        <>
            {/* SVG Filters for Color Blind Simulation (hidden) */}
            <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
                <defs>
                    {/* Deuteranopia filter */}
                    <filter id="deuteranopia-filter">
                        <feColorMatrix type="matrix" values="
              0.625 0.375 0     0 0
              0.7   0.3   0     0 0
              0     0.3   0.7   0 0
              0     0     0     1 0
            " />
                    </filter>
                    {/* Protanopia filter */}
                    <filter id="protanopia-filter">
                        <feColorMatrix type="matrix" values="
              0.567 0.433 0     0 0
              0.558 0.442 0     0 0
              0     0.242 0.758 0 0
              0     0     0     1 0
            " />
                    </filter>
                    {/* Tritanopia filter */}
                    <filter id="tritanopia-filter">
                        <feColorMatrix type="matrix" values="
              0.95  0.05  0     0 0
              0     0.433 0.567 0 0
              0     0.475 0.525 0 0
              0     0     0     1 0
            " />
                    </filter>
                </defs>
            </svg>

            {/* Floating gear button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full"
                style={{
                    background: 'var(--bg-glass-strong)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid var(--border-medium)',
                    boxShadow: 'var(--shadow-lg)',
                    color: 'var(--text-secondary)',
                }}
                whileHover={{ scale: 1.1, rotate: 45 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Accessibility settings"
            >
                {/* Gear icon - outlined */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
            </motion.button>

            {/* Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className="fixed inset-0 z-50"
                            style={{ background: 'rgba(0,0,0,0.3)' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Panel */}
                        <motion.div
                            className="fixed bottom-20 right-6 z-50 w-80 overflow-hidden"
                            style={{
                                background: 'var(--bg-glass-strong)',
                                backdropFilter: 'blur(40px)',
                                border: '1px solid var(--border-medium)',
                                borderRadius: 'var(--radius-2xl)',
                                boxShadow: 'var(--shadow-xl)',
                            }}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        >
                            {/* Header */}
                            <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--border-light)' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--sims-blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 8a2 2 0 0 1 2 2c0 1.02-.38 1.53-1.12 2.12C12.25 12.68 12 13 12 13.5" />
                                    <path d="M12 17h.01" />
                                </svg>
                                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    Accessibility
                                </span>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="ml-auto flex h-8 w-8 items-center justify-center rounded-full"
                                    style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: 'none' }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-4 p-5">
                                {/* Text Size */}
                                <div>
                                    <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 7V4h16v3" /><path d="M9 20h6" /><path d="M12 4v16" />
                                        </svg>
                                        Text Size
                                    </label>
                                    <div className="flex gap-2">
                                        {(['small', 'medium', 'large'] as TextSize[]).map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => setTextSize(size)}
                                                className="flex-1 rounded-xl py-2 text-xs font-medium transition-all"
                                                style={{
                                                    background: textSize === size ? 'var(--sims-blue)' : 'var(--bg-tertiary)',
                                                    color: textSize === size ? '#fff' : 'var(--text-secondary)',
                                                    border: textSize === size ? '1.5px solid var(--sims-blue)' : '1.5px solid var(--border-light)',
                                                }}
                                            >
                                                {size === 'small' ? 'A' : size === 'medium' ? 'A' : 'A'}
                                                <span className="ml-1 text-[10px] opacity-70">{size}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* High Contrast */}
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M12 2a10 10 0 0 1 0 20z" fill="currentColor" />
                                        </svg>
                                        High Contrast
                                    </label>
                                    <button
                                        onClick={() => setHighContrast(!highContrast)}
                                        className="relative h-7 w-12 rounded-full transition-colors"
                                        style={{
                                            background: highContrast ? 'var(--sims-blue)' : 'var(--bg-tertiary)',
                                            border: '1.5px solid var(--border-light)',
                                        }}
                                        role="switch"
                                        aria-checked={highContrast}
                                    >
                                        <motion.div
                                            className="absolute top-0.5 h-5 w-5 rounded-full"
                                            style={{ background: '#fff', boxShadow: 'var(--shadow-sm)' }}
                                            animate={{ left: highContrast ? 22 : 2 }}
                                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                        />
                                    </button>
                                </div>

                                {/* Color Blind Mode */}
                                <div>
                                    <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                        Color Vision
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {cbModes.map((mode) => (
                                            <button
                                                key={mode.id}
                                                onClick={() => setColorBlindMode(mode.id)}
                                                className="flex flex-col items-start rounded-xl px-3 py-2 text-left transition-all"
                                                style={{
                                                    background: colorBlindMode === mode.id ? 'var(--sims-blue-subtle)' : 'var(--bg-tertiary)',
                                                    border: colorBlindMode === mode.id ? '1.5px solid var(--sims-blue)' : '1.5px solid var(--border-light)',
                                                }}
                                            >
                                                <span
                                                    className="text-xs font-medium"
                                                    style={{ color: colorBlindMode === mode.id ? 'var(--sims-blue)' : 'var(--text-primary)' }}
                                                >
                                                    {mode.label}
                                                </span>
                                                <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                                                    {mode.desc}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Reset button */}
                                <button
                                    onClick={() => {
                                        setTextSize('medium');
                                        setHighContrast(false);
                                        setColorBlindMode('none');
                                    }}
                                    className="w-full rounded-xl py-2 text-xs font-medium transition-all"
                                    style={{
                                        background: 'var(--bg-tertiary)',
                                        color: 'var(--text-secondary)',
                                        border: '1.5px solid var(--border-light)',
                                    }}
                                >
                                    Reset to Default
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
