'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeProvider';
import { WORD_LIST } from '@/lib/dictionary';

// ═══════════════════════════════════════════════
// Language Layouts
// ═══════════════════════════════════════════════
type LayoutId = 'en' | 'hi' | 'ta' | 'ml' | 'bn';

interface KeyboardLayout {
    id: LayoutId;
    label: string;
    nativeLabel: string;
    rows: string[][];
    shiftRows?: string[][];
}

const LAYOUTS: KeyboardLayout[] = [
    {
        id: 'en', label: 'English', nativeLabel: 'EN',
        rows: [
            ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
            ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
            ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
        ],
        shiftRows: [
            ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
            ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
            ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
        ],
    },
    {
        id: 'hi', label: 'हिन्दी', nativeLabel: 'हिं',
        rows: [
            ['क', 'ख', 'ग', 'घ', 'ङ', 'च', 'छ', 'ज', 'झ', 'ञ'],
            ['ट', 'ठ', 'ड', 'ढ', 'ण', 'त', 'थ', 'द', 'ध'],
            ['न', 'प', 'फ', 'ब', 'भ', 'म', 'य'],
        ],
        shiftRows: [
            ['अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ए', 'ऐ', 'ओ', 'औ'],
            ['र', 'ल', 'व', 'श', 'ष', 'स', 'ह', 'ा', 'ि'],
            ['ी', 'ु', 'ू', 'े', 'ै', 'ो', 'ौ'],
        ],
    },
    {
        id: 'ta', label: 'தமிழ்', nativeLabel: 'தமி',
        rows: [
            ['க', 'ங', 'ச', 'ஞ', 'ட', 'ண', 'த', 'ந', 'ப', 'ம'],
            ['ய', 'ர', 'ல', 'வ', 'ழ', 'ள', 'ற', 'ன', 'ஜ'],
            ['அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ'],
        ],
        shiftRows: [
            ['ஏ', 'ஐ', 'ஒ', 'ஓ', 'ஔ', 'ா', 'ி', 'ீ', 'ு', 'ூ'],
            ['ெ', 'ே', 'ை', 'ொ', 'ோ', 'ௌ', '்', 'ஸ', 'ஹ'],
            ['ஷ', 'க்ஷ', 'ஶ', 'ஃ', '।', '॥', 'ௐ'],
        ],
    },
    {
        id: 'ml', label: 'മലയാളം', nativeLabel: 'മല',
        rows: [
            ['ക', 'ഖ', 'ഗ', 'ഘ', 'ങ', 'ച', 'ഛ', 'ജ', 'ഝ', 'ഞ'],
            ['ട', 'ഠ', 'ഡ', 'ഢ', 'ണ', 'ത', 'ഥ', 'ദ', 'ധ'],
            ['ന', 'പ', 'ഫ', 'ബ', 'ഭ', 'മ', 'യ'],
        ],
        shiftRows: [
            ['അ', 'ആ', 'ഇ', 'ഈ', 'ഉ', 'ഊ', 'എ', 'ഏ', 'ഐ', 'ഒ'],
            ['ര', 'ല', 'വ', 'ശ', 'ഷ', 'സ', 'ഹ', 'ാ', 'ി'],
            ['ീ', 'ു', 'ൂ', 'െ', 'േ', 'ൈ', '്'],
        ],
    },
    {
        id: 'bn', label: 'বাংলা', nativeLabel: 'বাং',
        rows: [
            ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ'],
            ['ট', 'ঠ', 'ড', 'ঢ', 'ণ', 'ত', 'থ', 'দ', 'ধ'],
            ['ন', 'প', 'ফ', 'ব', 'ভ', 'ম', 'য'],
        ],
        shiftRows: [
            ['অ', 'আ', 'ই', 'ঈ', 'উ', 'ঊ', 'এ', 'ঐ', 'ও', 'ঔ'],
            ['র', 'ল', 'শ', 'ষ', 'স', 'হ', 'া', 'ি', 'ী'],
            ['ু', 'ূ', 'ে', 'ৈ', 'ো', 'ৌ', '্'],
        ],
    },
];

// ═══════════════════════════════════════════════
// QWERTY key positions for glide distance
// ═══════════════════════════════════════════════
const KEY_POS: Record<string, [number, number]> = {};
[['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
['z', 'x', 'c', 'v', 'b', 'n', 'm']].forEach((row, r) =>
    row.forEach((k, c) => { KEY_POS[k] = [r, c + (r === 1 ? 0.5 : r === 2 ? 1.5 : 0)]; })
);

function keyDist(a: string, b: string): number {
    const pa = KEY_POS[a], pb = KEY_POS[b];
    if (!pa || !pb) return 99;
    return Math.sqrt((pa[0] - pb[0]) ** 2 + (pa[1] - pb[1]) ** 2);
}

// ═══════════════════════════════════════════════
// Levenshtein
// ═══════════════════════════════════════════════
function editDist(a: string, b: string): number {
    const m = a.length, n = b.length;
    if (!m) return n; if (!n) return m;
    const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
        Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0));
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    return dp[m][n];
}

// ═══════════════════════════════════════════════
// Gboard-exact autocorrect
// Returns the correction if one exists (1-edit distance, word not in dictionary)
// ═══════════════════════════════════════════════
function findCorrection(input: string): string | null {
    if (!input || input.length < 3) return null;
    const lower = input.toLowerCase();
    if (WORD_LIST.includes(lower)) return null; // already correct

    let best: string | null = null;
    let bestDist = Infinity;
    for (const word of WORD_LIST) {
        if (Math.abs(word.length - lower.length) > 2) continue;
        const d = editDist(lower, word);
        if (d > 0 && d < bestDist && d <= (lower.length <= 4 ? 1 : 2)) {
            bestDist = d;
            best = word;
        }
    }
    return bestDist === 1 ? best : null; // only auto-correct on 1-edit
}

// ═══════════════════════════════════════════════
// Glide matching — waypoint extraction
// ═══════════════════════════════════════════════
interface GlidePoint { key: string; x: number; y: number; t: number; }

function extractWaypoints(path: GlidePoint[]): string[] {
    if (path.length < 2) return path.map(p => p.key);
    const wp: string[] = [path[0].key];
    for (let i = 1; i < path.length - 1; i++) {
        const prev = path[i - 1], curr = path[i], next = path[i + 1];
        const dx1 = curr.x - prev.x, dy1 = curr.y - prev.y;
        const dx2 = next.x - curr.x, dy2 = next.y - curr.y;
        const cross = Math.abs(dx1 * dy2 - dy1 * dx2);
        const dot = dx1 * dx2 + dy1 * dy2;
        const paused = curr.t - prev.t > 80;
        if (cross > 400 || dot < 0 || paused) {
            if (curr.key !== wp[wp.length - 1]) wp.push(curr.key);
        }
    }
    const last = path[path.length - 1].key;
    if (last !== wp[wp.length - 1]) wp.push(last);
    return wp;
}

function matchGlide(path: GlidePoint[]): string[] {
    if (path.length < 3) return [];
    const wp = extractWaypoints(path);
    if (wp.length < 2) return [];
    const first = wp[0].toLowerCase(), last = wp[wp.length - 1].toLowerCase();

    const candidates = WORD_LIST.filter(w =>
        w.length >= 3 && w[0] === first && w[w.length - 1] === last
    );
    if (!candidates.length) return [];

    const scored: { word: string; score: number }[] = [];
    for (const word of candidates) {
        let wpi = 1, matched = 0;
        for (let ci = 1; ci < word.length - 1; ci++) {
            while (wpi < wp.length - 1) {
                if (wp[wpi] === word[ci]) { matched++; wpi++; break; }
                if (keyDist(wp[wpi], word[ci]) <= 1.5) { matched += 0.5; wpi++; break; }
                wpi++;
            }
        }
        const score = matched / Math.max(word.length - 2, 1) - Math.abs(word.length - wp.length) * 0.12;
        if (score > 0.2) scored.push({ word, score });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 3).map(s => s.word);
}

// ═══════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════
interface VirtualKeyboardProps {
    inputValue: string;
    onInputChange: (value: string) => void;
    onSubmit: () => void;
    onClose: () => void;
}

export default function VirtualKeyboard({ inputValue, onInputChange, onSubmit, onClose }: VirtualKeyboardProps) {
    const { isDark } = useTheme();
    const [layoutIdx, setLayoutIdx] = useState(0);
    const [isShift, setIsShift] = useState(false);
    const [showSymbols, setShowSymbols] = useState(false);
    const [activeKey, setActiveKey] = useState<string | null>(null);
    const [showLangDropdown, setShowLangDropdown] = useState(false);

    // Gboard state
    const [currentWord, setCurrentWord] = useState('');
    const [lastCorrection, setLastCorrection] = useState<{ original: string; corrected: string } | null>(null);

    // Glide state
    const [isGliding, setIsGliding] = useState(false);
    const [glidePath, setGlidePath] = useState<GlidePoint[]>([]);
    const [glideSuggestions, setGlideSuggestions] = useState<string[]>([]);

    const layout = LAYOUTS[layoutIdx];
    const rows = isShift && layout.shiftRows ? layout.shiftRows : layout.rows;

    // CSS variable-based colors (reads from globals.css, works with high contrast + color blind)
    const kbBg = 'var(--kb-bg)';
    const keyBg = 'var(--kb-key)';
    const keyActiveBg = 'var(--kb-key-active)';
    const keySpecialBg = 'var(--kb-key-special)';
    const keyText = 'var(--kb-key-text)';
    const border = 'var(--kb-border)';
    const shadowKey = 'var(--kb-shadow)';
    const blue = 'var(--sims-blue)';

    // Track the word being typed (extract from inputValue)
    useEffect(() => {
        const words = inputValue.split(' ');
        const lastWord = words[words.length - 1] || '';
        setCurrentWord(lastWord);
    }, [inputValue]);

    // ─── Key press handler ────────────────────
    const handleKey = useCallback((key: string) => {
        setActiveKey(key);
        setTimeout(() => setActiveKey(null), 80);

        if (key === 'ENTER') {
            onSubmit();
            setLastCorrection(null);
            return;
        }

        if (key === 'BACKSPACE') {
            // Gboard undo: if we just auto-corrected, revert
            if (lastCorrection) {
                const val = inputValue;
                const correctedWithSpace = lastCorrection.corrected + ' ';
                if (val.endsWith(correctedWithSpace)) {
                    // Remove corrected word + space, put back original
                    const base = val.slice(0, val.length - correctedWithSpace.length);
                    onInputChange(base + lastCorrection.original);
                    setLastCorrection(null);
                    return;
                }
                setLastCorrection(null);
            }
            onInputChange(inputValue.slice(0, -1));
            return;
        }

        if (key === 'SPACE') {
            // Gboard: silently auto-correct on space
            if (layout.id === 'en' && currentWord.length >= 3) {
                const correction = findCorrection(currentWord);
                if (correction) {
                    // Replace the current word with correction
                    const base = inputValue.slice(0, inputValue.length - currentWord.length);
                    onInputChange(base + correction + ' ');
                    setLastCorrection({ original: currentWord, corrected: correction });
                    return;
                }
            }
            onInputChange(inputValue + ' ');
            setLastCorrection(null);
            return;
        }

        // Regular key
        setLastCorrection(null);
        onInputChange(inputValue + key);
        if (isShift) setIsShift(false);
    }, [inputValue, onInputChange, onSubmit, isShift, currentWord, lastCorrection, layout.id]);

    // ─── Glide handlers ────────────────────
    const handleTouchStart = (key: string, e: React.TouchEvent) => {
        setIsGliding(true);
        const t = e.touches[0];
        setGlidePath([{ key: key.toLowerCase(), x: t.clientX, y: t.clientY, t: Date.now() }]);
        setGlideSuggestions([]);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isGliding) return;
        const t = e.touches[0];
        const elem = document.elementFromPoint(t.clientX, t.clientY);
        const k = elem?.getAttribute('data-key')?.toLowerCase();
        if (k && k.length === 1) {
            setGlidePath(prev => {
                if (!prev.length || prev[prev.length - 1].key !== k)
                    return [...prev, { key: k, x: t.clientX, y: t.clientY, t: Date.now() }];
                return prev;
            });
            setActiveKey(k);
        }
    };

    const handleTouchEnd = () => {
        if (isGliding && glidePath.length > 3) {
            const matches = matchGlide(glidePath);
            if (matches.length > 0) {
                setGlideSuggestions(matches);
                // Auto-insert best match
                onInputChange(inputValue + matches[0] + ' ');
            }
        } else if (isGliding && glidePath.length === 1) {
            handleKey(glidePath[0].key);
        }
        setIsGliding(false);
        setGlidePath([]);
        setActiveKey(null);
    };

    const handleGlideSuggestion = (word: string) => {
        // Replace last inserted word
        const trimmed = inputValue.trimEnd();
        const lastSpace = trimmed.lastIndexOf(' ');
        const base = lastSpace >= 0 ? trimmed.slice(0, lastSpace + 1) : '';
        onInputChange(base + word + ' ');
        setGlideSuggestions([]);
    };

    // ─── Number + Symbol rows ────────────────
    const NUMBERS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
    const SYMBOL_ROWS = [
        ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'],
        ['-', '=', '[', ']', '\\', ';', "'", ',', '.'],
        ['/', '?', '<', '>', ':', '"', '+', '~', '`'],
    ];

    // ─── Key style ────────────────────
    const KEY_H = 'calc(52px * var(--text-scale, 1))';
    const NUM_H = 'calc(40px * var(--text-scale, 1))';

    // Prevent focus steal: every button uses this
    const noFocus = (e: React.MouseEvent | React.TouchEvent) => { e.preventDefault(); };

    const ks = (key: string, special?: boolean): React.CSSProperties => ({
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 8,
        fontSize: special ? 'calc(12px * var(--text-scale, 1))' : 'clamp(14px, 1.6vw, 18px)',
        fontWeight: 500,
        background: activeKey === key.toLowerCase() ? keyActiveBg : (special ? keySpecialBg : keyBg),
        color: keyText, border: 'none',
        height: KEY_H,
        minWidth: special ? 44 : 28,
        flex: special ? '0 0 auto' : '1 1 0',
        maxWidth: special ? undefined : 52,
        boxShadow: shadowKey,
        cursor: 'pointer',
        transition: 'background 0.08s',
        fontFamily: 'inherit',
        padding: special ? '0 12px' : '0',
    });

    return (
        <motion.div
            style={{
                width: '100%', background: kbBg,
                borderTop: `1px solid ${border}`,
                paddingBottom: 'env(safe-area-inset-bottom, 6px)',
            }}
            initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* ── Glide suggestion bar (only visible during/after glide) ── */}
            <AnimatePresence>
                {glideSuggestions.length > 0 && (
                    <motion.div
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '4px 8px', minHeight: 38,
                            borderBottom: `1px solid ${border}`,
                            background: 'var(--sims-blue-subtle)',
                        }}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                    >
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginRight: 4 }}>Glide:</span>
                        {glideSuggestions.map((word, i) => (
                            <button key={word} onClick={() => handleGlideSuggestion(word)} style={{
                                padding: '5px 14px', borderRadius: 8,
                                fontSize: 13, fontWeight: i === 0 ? 700 : 500,
                                background: i === 0 ? 'var(--sims-blue)' : keyBg,
                                color: i === 0 ? '#fff' : 'var(--sims-blue)',
                                border: `1px solid ${i === 0 ? 'var(--sims-blue)' : border}`,
                                cursor: 'pointer',
                            }}>
                                {word}
                            </button>
                        ))}
                        <button onClick={() => setGlideSuggestions([])} onMouseDown={noFocus} style={{
                            marginLeft: 'auto', width: 24, height: 24, borderRadius: 6,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'transparent', color: 'var(--text-tertiary)',
                            border: 'none', cursor: 'pointer', fontSize: 14,
                        }}>✕</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Toolbar: close + optional correction indicator ── */}
            <div style={{
                display: 'flex', alignItems: 'center',
                padding: '2px 8px', minHeight: 28,
            }}>
                {lastCorrection ? (
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        corrected &quot;{lastCorrection.original}&quot; → &quot;{lastCorrection.corrected}&quot; (⌫ to undo)
                    </span>
                ) : isGliding ? (
                    <span style={{ fontSize: 11, color: 'var(--sims-blue)', fontWeight: 600 }}>
                        {extractWaypoints(glidePath).join(' → ')}
                    </span>
                ) : (
                    <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>
                        Slide to glide · Corrections auto-applied
                    </span>
                )}
                <button onClick={onClose} onMouseDown={noFocus} style={{
                    marginLeft: 'auto', width: 26, height: 26, borderRadius: 6,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'transparent', color: 'var(--text-tertiary)',
                    border: 'none', cursor: 'pointer',
                }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="m7 10 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 4px 4px' }}>

                {/* ── Numbers row (always visible) ── */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
                    {NUMBERS.map(n => (
                        <button key={n} data-key={n} onClick={() => handleKey(n)} onMouseDown={noFocus}
                            style={{
                                ...ks(n), height: NUM_H, fontSize: 'clamp(12px, 1.4vw, 15px)',
                                fontWeight: 400, opacity: 0.85,
                            }}>
                            {n}
                        </button>
                    ))}
                </div>

                {/* ── Letter / symbol rows ── */}
                {(showSymbols ? SYMBOL_ROWS : rows).map((row, ri) => (
                    <div key={ri} style={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
                        {/* Shift on last row */}
                        {ri === (showSymbols ? SYMBOL_ROWS : rows).length - 1 && !showSymbols && (
                            <button onClick={() => setIsShift(!isShift)} onMouseDown={noFocus}
                                style={{
                                    ...ks('SHIFT', true),
                                    background: isShift ? 'var(--sims-blue)' : keySpecialBg,
                                    color: isShift ? 'var(--text-inverse)' : keyText,
                                }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m18 15-6-6-6 6" />
                                </svg>
                            </button>
                        )}

                        {row.map(key => (
                            <button key={`${ri}-${key}`} data-key={key}
                                onClick={() => handleKey(key)}
                                onMouseDown={noFocus}
                                onTouchStart={layout.id === 'en' ? (e) => handleTouchStart(key, e) : undefined}
                                style={ks(key)}>
                                {key}
                            </button>
                        ))}

                        {/* Backspace on last row */}
                        {ri === (showSymbols ? SYMBOL_ROWS : rows).length - 1 && (
                            <button onClick={() => handleKey('BACKSPACE')} onMouseDown={noFocus} style={ks('BACKSPACE', true)}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M10 5H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h5" />
                                    <path d="m17 9-5 5" /><path d="m12 9 5 5" /><path d="M22 12H10" />
                                </svg>
                            </button>
                        )}
                    </div>
                ))}

                {/* ── Bottom row ── */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 3, position: 'relative' }}>

                    {/* Language selector */}
                    <div style={{ position: 'relative' }}>
                        <button onClick={() => setShowLangDropdown(!showLangDropdown)} onMouseDown={noFocus}
                            style={{ ...ks('LANG', true), fontSize: 11, fontWeight: 700, color: 'var(--sims-blue)', gap: 2 }}>
                            {layout.nativeLabel}
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d={showLangDropdown ? "m18 15-6-6-6 6" : "m6 9 6 6 6-6"} strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        <AnimatePresence>
                            {showLangDropdown && (
                                <motion.div style={{
                                    position: 'absolute', bottom: '100%', left: 0,
                                    marginBottom: 6, width: 170,
                                    background: isDark ? '#1f2937' : '#ffffff',
                                    border: `1px solid ${border}`, borderRadius: 12,
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                    overflow: 'hidden', zIndex: 20,
                                }}
                                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                >
                                    {LAYOUTS.map((lang, idx) => (
                                        <button key={lang.id}
                                            onClick={() => { setLayoutIdx(idx); setIsShift(false); setShowSymbols(false); setShowLangDropdown(false); }}
                                            style={{
                                                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                                padding: '10px 14px', fontSize: 13,
                                                fontWeight: layoutIdx === idx ? 600 : 400,
                                                background: layoutIdx === idx ? 'var(--sims-blue-subtle)' : 'transparent',
                                                color: layoutIdx === idx ? 'var(--sims-blue)' : keyText,
                                                border: 'none',
                                                borderBottom: idx < LAYOUTS.length - 1 ? `1px solid ${border}` : 'none',
                                                cursor: 'pointer', textAlign: 'left',
                                            }}>
                                            <span style={{ width: 28, fontSize: 12, fontWeight: 700, color: 'var(--sims-blue)' }}>{lang.nativeLabel}</span>
                                            <span>{lang.label}</span>
                                            {layoutIdx === idx && (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sims-blue)" strokeWidth="2.5" style={{ marginLeft: 'auto' }}>
                                                    <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Sym / abc */}
                    <button onClick={() => setShowSymbols(!showSymbols)} onMouseDown={noFocus}
                        style={{
                            ...ks('SYM', true), fontSize: 12,
                            background: showSymbols ? 'var(--sims-blue)' : keySpecialBg,
                            color: showSymbols ? 'var(--text-inverse)' : keyText,
                        }}>
                        {showSymbols ? 'abc' : '!#1'}
                    </button>

                    <button onClick={() => handleKey(',')} onMouseDown={noFocus} style={{ ...ks(','), maxWidth: 36 }}>,</button>

                    {/* Spacebar — shows language name */}
                    <button onClick={() => handleKey('SPACE')} onMouseDown={noFocus} style={{
                        ...ks('SPACE'), flex: 1, maxWidth: 'none',
                        fontSize: 'clamp(11px, 1.2vw, 14px)', fontWeight: 500,
                        color: 'var(--text-tertiary)',
                    }}>
                        {layout.label}
                    </button>

                    <button onClick={() => handleKey('.')} onMouseDown={noFocus} style={{ ...ks('.'), maxWidth: 36 }}>.</button>

                    {/* Enter */}
                    <button onClick={() => handleKey('ENTER')} onMouseDown={noFocus}
                        style={{
                            ...ks('ENTER', true),
                            background: 'var(--sims-blue)', color: 'var(--text-inverse)',
                            boxShadow: '0 4px 12px var(--sims-blue-glow)',
                        }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m5 12 14 0" /><path d="m12 5 7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
