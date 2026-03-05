'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface KioskKeypadProps {
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
  text: '#ffffff',
  textMuted: '#888888',
  border: '#1a1a1a',
};

export default function KioskKeypad({ onKeyPress, onBackspace, onEnter, visible }: KioskKeypadProps) {
  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['⌫', '0', '✓'],
  ];

  const handleKeyPress = (key: string) => {
    switch (key) {
      case '⌫':
        onBackspace();
        break;
      case '✓':
        onEnter?.();
        break;
      default:
        onKeyPress(key);
        break;
    }
  };

  const getKeyStyle = (key: string): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '16px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '28px',
      fontWeight: 600,
      fontFamily: 'inherit',
      minHeight: '72px',
      minWidth: '0',
      flex: 1,
      transition: 'all 0.08s ease',
    };

    if (key === '✓') {
      return { ...base, backgroundColor: C.keyAccent, color: C.text };
    }
    if (key === '⌫') {
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
            maxWidth: '400px',
            margin: '0 auto',
            backgroundColor: C.bg,
            borderRadius: '20px',
            padding: '16px',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.8)',
            border: `1px solid ${C.border}`,
          }}
        >
          {keys.map((row, rowIndex) => (
            <div
              key={rowIndex}
              style={{
                display: 'flex',
                gap: '10px',
                marginBottom: rowIndex < keys.length - 1 ? '10px' : '0',
              }}
            >
              {row.map((key) => (
                <motion.button
                  key={key}
                  onClick={() => handleKeyPress(key)}
                  style={getKeyStyle(key)}
                  whileTap={{
                    scale: 0.92,
                    backgroundColor: key === '✓' ? C.keyAccentPress : key === '⌫' ? C.keyPress : C.keyPress,
                  }}
                  transition={{ duration: 0.05 }}
                >
                  {key === '⌫' ? (
                    <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l7-7h11a1 1 0 011 1v12a1 1 0 01-1 1H10l-7-7z" />
                    </svg>
                  ) : key === '✓' ? (
                    <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    key
                  )}
                </motion.button>
              ))}
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
