'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

// ─── Language Layouts ──────────────────────────
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
        id: 'en',
        label: 'English',
        nativeLabel: 'EN',
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
        id: 'hi',
        label: 'Hindi',
        nativeLabel: 'हिं',
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
        id: 'ta',
        label: 'Tamil',
        nativeLabel: 'தமிழ்',
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
        id: 'ml',
        label: 'Malayalam',
        nativeLabel: 'മല',
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
        id: 'bn',
        label: 'Bengali',
        nativeLabel: 'বাং',
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

const NUMBER_ROW = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
const SYMBOL_ROW_1 = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'];
const SYMBOL_ROW_2 = ['-', '=', '[', ']', '\\', ';', "'", ',', '.'];
const SYMBOL_ROW_3 = ['/', '?', '<', '>', ':', '"', '+'];

// ─── Simple Autocorrect (EN only) ──────────────
const COMMON_WORDS = [
    'appointment', 'doctor', 'hospital', 'department', 'cardiology', 'neurology',
    'orthopedics', 'patient', 'emergency', 'ambulance', 'visiting', 'hours',
    'medicine', 'general', 'pediatrics', 'gynecology', 'dermatology',
    'ophthalmology', 'gastroenterology', 'surgery', 'pharmacy', 'reception',
    'thank', 'thanks', 'please', 'hello', 'name', 'phone', 'number', 'book',
    'find', 'help', 'today', 'tomorrow', 'morning', 'afternoon', 'evening',
    'available', 'schedule', 'cancel', 'check', 'room', 'floor', 'blood',
];

function getSuggestions(input: string): string[] {
    if (!input || input.length < 2) return [];
    const lower = input.toLowerCase();
    const matches = COMMON_WORDS
        .filter(w => w.startsWith(lower) && w !== lower)
        .slice(0, 3);
    return matches;
}

// ─── Glide Typing State ────────────────────────
interface GlidePoint {
    key: string;
    x: number;
    y: number;
    timestamp: number;
}

// ─── Component ────────────────────────────────
interface VirtualKeyboardProps {
    onKeyPress: (key: string) => void;
    onClose: () => void;
}

export default function VirtualKeyboard({ onKeyPress, onClose }: VirtualKeyboardProps) {
    const [layoutIndex, setLayoutIndex] = useState(0);
    const [isShift, setIsShift] = useState(false);
    const [showNumbers, setShowNumbers] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [currentWord, setCurrentWord] = useState('');
    const [isGliding, setIsGliding] = useState(false);
    const [glidePath, setGlidePath] = useState<GlidePoint[]>([]);
    const [activeKey, setActiveKey] = useState<string | null>(null);
    const keyboardRef = useRef<HTMLDivElement>(null);

    const layout = LAYOUTS[layoutIndex];
    const rows = isShift && layout.shiftRows ? layout.shiftRows : layout.rows;

    // Track current word for autocorrect
    useEffect(() => {
        setSuggestions(getSuggestions(currentWord));
    }, [currentWord]);

    const handleKey = useCallback((key: string) => {
        setActiveKey(key);
        setTimeout(() => setActiveKey(null), 100);

        onKeyPress(key);

        // Track word for suggestions
        if (key === 'SPACE' || key === 'ENTER') {
            setCurrentWord('');
        } else if (key === 'BACKSPACE') {
            setCurrentWord((prev: string) => prev.slice(0, -1));
        } else if (key.length === 1) {
            setCurrentWord((prev: string) => prev + key);
        }

        // Auto-disable shift after one character
        if (isShift && key.length === 1) {
            setIsShift(false);
        }
    }, [onKeyPress, isShift]);

    const handleSuggestion = useCallback((word: string) => {
        // Replace current word with suggestion
        for (let i = 0; i < currentWord.length; i++) {
            onKeyPress('BACKSPACE');
        }
        for (const char of word) {
            onKeyPress(char);
        }
        onKeyPress('SPACE');
        setCurrentWord('');
    }, [currentWord, onKeyPress]);

    const cycleLayout = () => {
        setLayoutIndex((layoutIndex + 1) % LAYOUTS.length);
        setIsShift(false);
        setShowNumbers(false);
    };

    // Glide typing handlers
    const handleTouchStart = (key: string, e: React.TouchEvent) => {
        setIsGliding(true);
        const touch = e.touches[0];
        setGlidePath([{ key, x: touch.clientX, y: touch.clientY, timestamp: Date.now() }]);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isGliding) return;
        const touch = e.touches[0];
        // Find which key the touch is over
        const elem = document.elementFromPoint(touch.clientX, touch.clientY);
        const keyChar = elem?.getAttribute('data-key');
        if (keyChar && keyChar.length === 1) {
            setGlidePath((prev: GlidePoint[]) => {
                const last = prev[prev.length - 1];
                if (last?.key !== keyChar) {
                    return [...prev, { key: keyChar, x: touch.clientX, y: touch.clientY, timestamp: Date.now() }];
                }
                return prev;
            });
        }
    };

    const handleTouchEnd = () => {
        if (isGliding && glidePath.length > 2) {
            // Construct word from glide path
            const word = glidePath.map((p: GlidePoint) => p.key).join('');
            // Find closest matching word
            const lower = word.toLowerCase();
            const match = COMMON_WORDS.find((w: string) => {
                if (w.length < 2) return false;
                // Check if path starts and ends with right letters
                return w[0] === lower[0] && w[w.length - 1] === lower[lower.length - 1];
            });
            if (match) {
                for (const char of match) {
                    onKeyPress(char);
                }
                onKeyPress('SPACE');
            }
        }
        setIsGliding(false);
        setGlidePath([]);
    };

    const displayRows = showNumbers
        ? [NUMBER_ROW, SYMBOL_ROW_1, SYMBOL_ROW_2, SYMBOL_ROW_3]
        : rows;

    return (
        <motion.div
            ref={keyboardRef}
            className="w-full"
            style={{
                background: 'var(--kb-bg)',
                borderTop: '1px solid var(--kb-border)',
                paddingBottom: 'env(safe-area-inset-bottom, 8px)',
            }}
            initial={{ y: 280 }}
            animate={{ y: 0 }}
            exit={{ y: 280 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Autocorrect suggestion bar */}
            <div className="flex items-center gap-1 px-2 py-1.5" style={{ minHeight: '36px' }}>
                {suggestions.length > 0 ? (
                    suggestions.map((word: string) => (
                        <motion.button
                            key={word}
                            onClick={() => handleSuggestion(word)}
                            className="rounded-lg px-3 py-1 text-xs font-medium"
                            style={{
                                background: 'var(--kb-key)',
                                color: 'var(--kb-key-text)',
                                border: '1px solid var(--kb-border)',
                                minHeight: '28px',
                                minWidth: 'auto',
                            }}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {word}
                        </motion.button>
                    ))
                ) : (
                    <span className="text-[10px] font-normal" style={{ color: 'var(--text-tertiary)' }}>
                        {isGliding ? `Gliding: ${glidePath.map((p: GlidePoint) => p.key).join('')}` : ''}
                    </span>
                )}

                {/* Close keyboard button */}
                <motion.button
                    onClick={onClose}
                    className="ml-auto flex h-7 w-7 items-center justify-center rounded-md"
                    style={{ background: 'transparent', color: 'var(--text-tertiary)', border: 'none', minHeight: 'auto', minWidth: 'auto' }}
                    whileTap={{ scale: 0.9 }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m7 10 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </motion.button>
            </div>

            {/* Key rows */}
            <div className="flex flex-col gap-[5px] px-[3px] pb-1">
                {displayRows.map((row, rowIdx) => (
                    <div key={rowIdx} className="flex justify-center gap-[4px]">
                        {/* Shift on last letter row */}
                        {rowIdx === (displayRows.length - 1) && !showNumbers && (
                            <motion.button
                                onClick={() => setIsShift(!isShift)}
                                className="flex items-center justify-center rounded-lg text-xs font-medium"
                                style={{
                                    background: isShift ? 'var(--sims-blue)' : 'var(--kb-key-special)',
                                    color: isShift ? '#fff' : 'var(--kb-key-text)',
                                    border: 'none',
                                    width: '42px',
                                    height: '42px',
                                    boxShadow: 'var(--kb-shadow)',
                                    minHeight: 'auto',
                                    minWidth: 'auto',
                                }}
                                whileTap={{ scale: 0.92 }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m18 15-6-6-6 6" />
                                </svg>
                            </motion.button>
                        )}

                        {row.map((key: string) => (
                            <motion.button
                                key={`${rowIdx}-${key}`}
                                data-key={key}
                                onClick={() => handleKey(key)}
                                onTouchStart={(e: any) => handleTouchStart(key, e)}
                                className="flex items-center justify-center rounded-lg text-sm font-medium"
                                style={{
                                    background: activeKey === key ? 'var(--kb-key-active)' : 'var(--kb-key)',
                                    color: 'var(--kb-key-text)',
                                    border: 'none',
                                    minWidth: '32px',
                                    height: '42px',
                                    flex: '1 1 0',
                                    maxWidth: '42px',
                                    boxShadow: 'var(--kb-shadow)',
                                    minHeight: 'auto',
                                }}
                                whileTap={{ scale: 0.9, backgroundColor: 'var(--sims-blue)' }}
                            >
                                {key}
                            </motion.button>
                        ))}

                        {/* Backspace on last letter row */}
                        {rowIdx === (displayRows.length - 1) && (
                            <motion.button
                                onClick={() => handleKey('BACKSPACE')}
                                className="flex items-center justify-center rounded-lg"
                                style={{
                                    background: 'var(--kb-key-special)',
                                    color: 'var(--kb-key-text)',
                                    border: 'none',
                                    width: '42px',
                                    height: '42px',
                                    boxShadow: 'var(--kb-shadow)',
                                    minHeight: 'auto',
                                    minWidth: 'auto',
                                }}
                                whileTap={{ scale: 0.92 }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M10 5H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h5" /><path d="m17 9-5 5" /><path d="m12 9 5 5" /><path d="M22 12H10" />
                                </svg>
                            </motion.button>
                        )}
                    </div>
                ))}

                {/* Bottom row: Language, Numbers, Space, Enter */}
                <div className="flex justify-center gap-[4px]">
                    {/* Language cycle */}
                    <motion.button
                        onClick={cycleLayout}
                        className="flex items-center justify-center rounded-lg text-[10px] font-bold"
                        style={{
                            background: 'var(--kb-key-special)',
                            color: 'var(--sims-blue)',
                            border: 'none',
                            width: '52px',
                            height: '42px',
                            boxShadow: 'var(--kb-shadow)',
                            minHeight: 'auto',
                            minWidth: 'auto',
                        }}
                        whileTap={{ scale: 0.92 }}
                    >
                        {LAYOUTS[(layoutIndex + 1) % LAYOUTS.length].nativeLabel}
                    </motion.button>

                    {/* Number/Symbol toggle */}
                    <motion.button
                        onClick={() => setShowNumbers(!showNumbers)}
                        className="flex items-center justify-center rounded-lg text-xs font-medium"
                        style={{
                            background: showNumbers ? 'var(--sims-blue)' : 'var(--kb-key-special)',
                            color: showNumbers ? '#fff' : 'var(--kb-key-text)',
                            border: 'none',
                            width: '42px',
                            height: '42px',
                            boxShadow: 'var(--kb-shadow)',
                            minHeight: 'auto',
                            minWidth: 'auto',
                        }}
                        whileTap={{ scale: 0.92 }}
                    >
                        {showNumbers ? 'abc' : '123'}
                    </motion.button>

                    {/* Comma */}
                    <motion.button
                        onClick={() => handleKey(',')}
                        className="flex items-center justify-center rounded-lg text-sm"
                        style={{ background: 'var(--kb-key)', color: 'var(--kb-key-text)', border: 'none', width: '32px', height: '42px', boxShadow: 'var(--kb-shadow)', minHeight: 'auto', minWidth: 'auto' }}
                        whileTap={{ scale: 0.92 }}
                    >
                        ,
                    </motion.button>

                    {/* Space */}
                    <motion.button
                        onClick={() => handleKey('SPACE')}
                        className="flex items-center justify-center rounded-lg text-xs font-medium"
                        style={{
                            background: 'var(--kb-key)',
                            color: 'var(--kb-key-text)',
                            border: 'none',
                            flex: '1',
                            height: '42px',
                            boxShadow: 'var(--kb-shadow)',
                            minHeight: 'auto',
                            minWidth: 'auto',
                        }}
                        whileTap={{ scale: 0.97 }}
                    >
                        {layout.label}
                    </motion.button>

                    {/* Period */}
                    <motion.button
                        onClick={() => handleKey('.')}
                        className="flex items-center justify-center rounded-lg text-sm"
                        style={{ background: 'var(--kb-key)', color: 'var(--kb-key-text)', border: 'none', width: '32px', height: '42px', boxShadow: 'var(--kb-shadow)', minHeight: 'auto', minWidth: 'auto' }}
                        whileTap={{ scale: 0.92 }}
                    >
                        .
                    </motion.button>

                    {/* Enter */}
                    <motion.button
                        onClick={() => handleKey('ENTER')}
                        className="flex items-center justify-center rounded-lg"
                        style={{
                            background: 'var(--sims-blue)',
                            color: '#fff',
                            border: 'none',
                            width: '60px',
                            height: '42px',
                            boxShadow: 'var(--shadow-glow-blue)',
                            minHeight: 'auto',
                            minWidth: 'auto',
                        }}
                        whileTap={{ scale: 0.92 }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m5 12 14 0" /><path d="m12 5 7 7-7 7" />
                        </svg>
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
}
