'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type TextSize = 'small' | 'default' | 'large';
type ColorBlindMode = 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia';

/*
 * TEXT SIZE: Sets --text-scale on document.documentElement.
 * All components use calc(Xpx * var(--text-scale, 1)) for sizing.
 * This scales text, keyboard keys, buttons proportionally without breaking layout.
 */
const SCALE_VALUES: Record<TextSize, string> = {
    small: '0.85',
    default: '1',
    large: '1.2',
};

/*
 * COLOR BLIND: Overrides the REAL design system CSS variables
 * so ALL components automatically get the correct colors.
 */
const CB_OVERRIDES: Record<ColorBlindMode, Record<string, string>> = {
    none: {},
    deuteranopia: {
        '--sims-blue': '#2563EB',
        '--sims-blue-light': '#60A5FA',
        '--sims-blue-dark': '#1D4ED8',
        '--sims-blue-subtle': '#DBEAFE',
        '--accent-red': '#F59E0B',      // red → amber
        '--accent-green': '#3B82F6',    // green → blue
        '--accent-orange': '#F59E0B',
        '--accent-teal': '#6366F1',
    },
    protanopia: {
        '--sims-blue': '#2563EB',
        '--sims-blue-light': '#60A5FA',
        '--sims-blue-dark': '#1D4ED8',
        '--sims-blue-subtle': '#DBEAFE',
        '--accent-red': '#D97706',
        '--accent-green': '#0EA5E9',
        '--accent-orange': '#D97706',
        '--accent-teal': '#7C3AED',
    },
    tritanopia: {
        '--sims-blue': '#DC2626',
        '--sims-blue-light': '#F87171',
        '--sims-blue-dark': '#B91C1C',
        '--sims-blue-subtle': '#FEE2E2',
        '--accent-red': '#DC2626',
        '--accent-green': '#16A34A',
        '--accent-orange': '#EA580C',
        '--accent-teal': '#16A34A',
    },
};

const CB_LABELS: { id: ColorBlindMode; label: string; desc: string; colors: string[] }[] = [
    { id: 'none', label: 'Normal', desc: 'Default colors', colors: ['#0066CC', '#38A169', '#E53E3E'] },
    { id: 'deuteranopia', label: 'Deuteranopia', desc: 'Red-green (common)', colors: ['#2563EB', '#3B82F6', '#F59E0B'] },
    { id: 'protanopia', label: 'Protanopia', desc: 'Red weakness', colors: ['#2563EB', '#0EA5E9', '#D97706'] },
    { id: 'tritanopia', label: 'Tritanopia', desc: 'Blue-yellow', colors: ['#DC2626', '#16A34A', '#EA580C'] },
];

const ALL_CB_VARS = Object.keys(CB_OVERRIDES.deuteranopia);

interface AccessibilityPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AccessibilityPanel({ isOpen, onClose }: AccessibilityPanelProps) {
    const [textSize, setTextSize] = useState<TextSize>('default');
    const [highContrast, setHighContrast] = useState(false);
    const [colorBlind, setColorBlind] = useState<ColorBlindMode>('none');

    // Load saved prefs
    useEffect(() => {
        try {
            const sz = localStorage.getItem('a11y-text-size') as TextSize;
            if (sz && SCALE_VALUES[sz]) { setTextSize(sz); applyScale(sz); }
            const hc = localStorage.getItem('a11y-high-contrast');
            if (hc === 'true') { setHighContrast(true); document.documentElement.classList.add('high-contrast'); }
            const cb = localStorage.getItem('a11y-color-blind') as ColorBlindMode;
            if (cb && CB_OVERRIDES[cb]) { setColorBlind(cb); applyCB(cb); }
        } catch { /* SSR */ }
    }, []);

    function applyScale(sz: TextSize) {
        document.documentElement.style.setProperty('--text-scale', SCALE_VALUES[sz]);
        localStorage.setItem('a11y-text-size', sz);
    }

    function applyCB(mode: ColorBlindMode) {
        const root = document.documentElement;
        ALL_CB_VARS.forEach(v => root.style.removeProperty(v));
        if (mode !== 'none') {
            Object.entries(CB_OVERRIDES[mode]).forEach(([k, v]) => root.style.setProperty(k, v));
        }
        localStorage.setItem('a11y-color-blind', mode);
    }

    useEffect(() => { applyScale(textSize); }, [textSize]);

    useEffect(() => {
        if (highContrast) document.documentElement.classList.add('high-contrast');
        else document.documentElement.classList.remove('high-contrast');
        localStorage.setItem('a11y-high-contrast', String(highContrast));
    }, [highContrast]);

    useEffect(() => { applyCB(colorBlind); }, [colorBlind]);

    function resetAll() {
        setTextSize('default');
        setHighContrast(false);
        setColorBlind('none');
    }

    // All panel colors via CSS vars
    const panelBg = 'var(--bg-secondary)';
    const border = 'var(--border-light)';
    const textPri = 'var(--text-primary)';
    const textSec = 'var(--text-secondary)';
    const blue = 'var(--sims-blue)';
    const btnBg = 'var(--bg-tertiary)';
    const activeBg = 'var(--sims-blue-subtle)';

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose} />

                    <motion.div style={{
                        position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 320,
                        background: panelBg, border: `1px solid ${border}`, borderRadius: 16,
                        boxShadow: '0 16px 48px rgba(0,0,0,0.15)', zIndex: 50, overflow: 'hidden',
                    }}
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {/* Header */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '14px 16px', borderBottom: `1px solid ${border}`,
                        }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: blue }}>
                                <circle cx="12" cy="4" r="2" /><path d="M4.5 8.5 12 7l7.5 1.5" />
                                <path d="M12 7v7" /><path d="m8 20 4-6 4 6" />
                            </svg>
                            <span style={{ fontSize: 14, fontWeight: 600, color: textPri }}>Accessibility</span>
                            <button onClick={onClose} style={{
                                marginLeft: 'auto', width: 28, height: 28, borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: btnBg, color: textSec, border: 'none', cursor: 'pointer',
                            }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                                </svg>
                            </button>
                        </div>

                        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>

                            {/* ── TEXT SIZE ── */}
                            <div>
                                <Label icon="T" label="Text Size" />
                                <div style={{ display: 'flex', gap: 6 }}>
                                    {(['small', 'default', 'large'] as TextSize[]).map(sz => {
                                        const act = textSize === sz;
                                        const fontSizes: Record<TextSize, number> = { small: 11, default: 13, large: 16 };
                                        return (
                                            <button key={sz} onClick={() => setTextSize(sz)} style={{
                                                flex: 1, padding: '10px 0', borderRadius: 10,
                                                fontSize: fontSizes[sz], fontWeight: 600,
                                                background: act ? blue : btnBg,
                                                color: act ? 'var(--text-inverse)' : textSec,
                                                border: act ? `2px solid ${blue}` : `1.5px solid ${border}`,
                                                cursor: 'pointer', transition: 'all 0.2s',
                                            }}>
                                                A {sz.charAt(0).toUpperCase() + sz.slice(1)}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div style={{ fontSize: 10, color: textSec, marginTop: 4, opacity: 0.6 }}>
                                    Scales text, keyboard keys, buttons, and chips
                                </div>
                            </div>

                            {/* ── HIGH CONTRAST ── */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <Label icon="◑" label="High Contrast" />
                                    <button onClick={() => setHighContrast(!highContrast)} role="switch" aria-checked={highContrast} style={{
                                        width: 44, height: 24, borderRadius: 12, padding: 2,
                                        background: highContrast ? blue : btnBg,
                                        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                        transition: 'background 0.2s',
                                    }}>
                                        <motion.div style={{
                                            width: 20, height: 20, borderRadius: '50%',
                                            background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                        }} animate={{ x: highContrast ? 20 : 0 }} transition={{ duration: 0.2 }} />
                                    </button>
                                </div>
                                {highContrast && (
                                    <div style={{ fontSize: 10, color: textSec, marginTop: 4, opacity: 0.6 }}>
                                        WCAG AAA contrast • Works in light &amp; dark modes
                                    </div>
                                )}
                            </div>

                            {/* ── COLOR VISION ── */}
                            <div>
                                <Label icon="◉" label="Color Vision" />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                    {CB_LABELS.map(({ id, label, desc, colors }) => {
                                        const act = colorBlind === id;
                                        return (
                                            <button key={id} onClick={() => setColorBlind(id)} style={{
                                                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                                                padding: '8px 12px', borderRadius: 10,
                                                background: act ? activeBg : btnBg,
                                                border: act ? `2px solid ${colors[0]}` : `1.5px solid ${border}`,
                                                cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                                            }}>
                                                <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                                                    {colors.map((c, i) => (
                                                        <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                                                    ))}
                                                </div>
                                                <span style={{ fontSize: 12, fontWeight: act ? 600 : 500, color: act ? colors[0] : textPri }}>{label}</span>
                                                <span style={{ fontSize: 10, color: textSec }}>{desc}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ── RESET ── */}
                            <button onClick={resetAll} style={{
                                width: '100%', padding: '8px 0', borderRadius: 10,
                                fontSize: 12, fontWeight: 500,
                                background: btnBg, color: textSec,
                                border: `1.5px solid ${border}`,
                                cursor: 'pointer',
                            }}>
                                Reset to Default
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function Label({ icon, label }: { icon: string; label: string }) {
    return (
        <div style={{
            fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' as const,
            letterSpacing: '0.8px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
        }}>
            <span style={{ fontSize: 14 }}>{icon}</span>{label}
        </div>
    );
}
