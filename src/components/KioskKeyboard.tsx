'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Language = 'EN' | 'TA';
type KeyboardLayout = 'lower' | 'upper' | 'symbols';

interface KioskKeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onEnter?: () => void;
  visible: boolean;
}

// Color scheme
const C = {
  bg: '#000000',
  key: '#111111',
  keySpecial: '#1a1a1a',
  keyAccent: '#3B82F6',
  keyAccentPress: '#2563EB',
  keyPress: '#222222',
  spacebar: '#161616',
  text: '#ffffff',
  textMuted: '#888888',
  border: '#1a1a1a',
  indicator: '#111111',
};

const englishLower = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['⇧', 'z', 'x', 'c', 'v', 'b', 'n', 'm', '⌫'],
  ['123', '🌐', ' ', '.', '↵'],
];

const englishUpper = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['⇧', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
  ['123', '🌐', ' ', '.', '↵'],
];

const symbols = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['@', '#', '$', '%', '&', '-', '+', '(', ')'],
  ['=', '*', '"', "'", ':', ';', '!', '?', '⌫'],
  ['ABC', '🌐', ' ', '.', '↵'],
];

const tamilLower = [
  ['அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ'],
  ['க', 'ச', 'ட', 'த', 'ப', 'ற', 'ன', 'ஞ', 'ண'],
  ['⇧', 'ங', 'ம', 'ய', 'ர', 'ல', 'வ', 'ழ', '⌫'],
  ['123', '🌐', ' ', '.', '↵'],
];

const tamilUpper = [
  ['ஓ', 'ஔ', 'ா', 'ி', 'ீ', 'ு', 'ூ', 'ெ', 'ே', 'ை'],
  ['ொ', 'ோ', 'ௌ', '்', 'ஃ', 'ஸ', 'ஹ', 'ஜ', 'ஷ'],
  ['⇧', 'க்ஷ', 'ஶ', 'ள', 'ந', 'ண', 'ல', 'னா', '⌫'],
  ['123', '🌐', ' ', '.', '↵'],
];

export default function KioskKeyboard({ onKeyPress, onBackspace, onEnter, visible }: KioskKeyboardProps) {
  const [language, setLanguage] = useState<Language>('EN');
  const [layout, setLayout] = useState<KeyboardLayout>('lower');

  const getKeys = useCallback(() => {
    if (layout === 'symbols') return symbols;
    if (language === 'EN') {
      return layout === 'upper' ? englishUpper : englishLower;
    }
    return layout === 'upper' ? tamilUpper : tamilLower;
  }, [language, layout]);

  const handleKeyPress = useCallback((key: string) => {
    switch (key) {
      case '⇧':
        setLayout(prev => prev === 'upper' ? 'lower' : 'upper');
        break;
      case '⌫':
        onBackspace();
        break;
      case '↵':
        onEnter?.();
        break;
      case '123':
        setLayout('symbols');
        break;
      case 'ABC':
        setLayout('lower');
        break;
      case '🌐':
        setLanguage(prev => prev === 'EN' ? 'TA' : 'EN');
        setLayout('lower');
        break;
      case ' ':
        onKeyPress(' ');
        break;
      default:
        onKeyPress(key);
        if (layout === 'upper' && language === 'EN' && key.length === 1) {
          setLayout('lower');
        }
        break;
    }
  }, [onKeyPress, onBackspace, onEnter, layout, language]);

  const getKeyWidth = (key: string, rowIndex: number) => {
    if (key === ' ') return '40%';
    if (key === '⇧' || key === '⌫') return '12%';
    if (key === '123' || key === 'ABC') return '14%';
    if (key === '🌐') return '10%';
    if (key === '↵') return '14%';
    if (key === '.') return '8%';
    if (rowIndex === 1) return '10%';
    return undefined;
  };

  const getKeyStyle = (key: string): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '10px',
      border: 'none',
      cursor: 'pointer',
      fontSize: key.length > 1 && !['⇧', '⌫', '↵', '🌐'].includes(key) ? '13px' : '18px',
      fontWeight: 500,
      fontFamily: 'inherit',
      padding: '0',
      minHeight: '52px',
      minWidth: '0',
      transition: 'all 0.08s ease',
    };

    if (key === ' ') {
      return { ...base, backgroundColor: C.spacebar, color: C.text, flex: '1' };
    }
    if (key === '↵') {
      return { ...base, backgroundColor: C.keyAccent, color: C.text };
    }
    if (['⇧', '⌫', '123', 'ABC', '🌐'].includes(key)) {
      return { ...base, backgroundColor: C.keySpecial, color: C.textMuted };
    }
    return { ...base, backgroundColor: C.key, color: C.text };
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 300, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 300, opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          style={{
            width: '100%',
            backgroundColor: C.bg,
            borderRadius: '20px 20px 0 0',
            padding: '12px 8px 16px',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.8)',
            borderTop: `1px solid ${C.border}`,
          }}
        >
          {/* Language indicator */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '8px',
            gap: '8px',
          }}>
            <div style={{
              fontSize: '11px',
              color: C.textMuted,
              backgroundColor: C.indicator,
              padding: '4px 12px',
              borderRadius: '12px',
              fontWeight: 600,
              letterSpacing: '0.5px',
            }}>
              {language === 'EN' ? 'English' : 'தமிழ்'} • {layout === 'upper' ? 'ABC' : layout === 'symbols' ? '123' : 'abc'}
            </div>
          </div>

          {/* Keyboard rows */}
          {getKeys().map((row, rowIndex) => (
            <div
              key={rowIndex}
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '5px',
                marginBottom: rowIndex < getKeys().length - 1 ? '5px' : '0',
                padding: '0 4px',
              }}
            >
              {row.map((key, keyIndex) => {
                const width = getKeyWidth(key, rowIndex);
                return (
                  <motion.button
                    key={`${rowIndex}-${keyIndex}-${key}`}
                    onClick={() => handleKeyPress(key)}
                    style={{
                      ...getKeyStyle(key),
                      width: width || undefined,
                      flex: width ? undefined : '1',
                    }}
                    whileTap={{
                      scale: 0.92,
                      backgroundColor: key === '↵' ? C.keyAccentPress : C.keyPress,
                    }}
                    transition={{ duration: 0.05 }}
                  >
                    {key === '⌫' ? (
                      <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l7-7h11a1 1 0 011 1v12a1 1 0 01-1 1H10l-7-7z" />
                      </svg>
                    ) : key === '⇧' ? (
                      <svg width="22" height="22" fill={layout === 'upper' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    ) : key === '↵' ? (
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>Done</span>
                    ) : (
                      key
                    )}
                  </motion.button>
                );
              })}
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
