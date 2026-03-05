'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeProvider';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  isLoading?: boolean;
}

/* ── Outlined feedback icons ── */
function ThumbUpIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 10v12" />
      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
    </svg>
  );
}

function ThumbDownIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 14V2" />
      <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />
    </svg>
  );
}

export default function MessageBubble({ role, content, isLoading }: MessageBubbleProps) {
  const isUser = role === 'user';
  const { isDark } = useTheme();
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Auto-show feedback buttons after 1s (kiosk = touch, no hover)
  useEffect(() => {
    if (!isUser && content && !isLoading) {
      const timer = setTimeout(() => setShowFeedback(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [isUser, content, isLoading]);

  /* ── Theme-aware colors via CSS vars ── */
  const userBg = 'var(--sims-blue)';
  const assistantBg = 'var(--bg-secondary)';
  const assistantBorder = 'var(--border-light)';
  const textColor = isUser ? 'var(--text-inverse)' : 'var(--text-primary)';
  const feedbackColor = 'var(--text-tertiary)';
  const feedbackActiveUp = 'var(--accent-green)';
  const feedbackActiveDown = 'var(--accent-red)';

  if (isLoading) {
    return (
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-start' }}>
        <motion.div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '16px 24px',
            background: assistantBg,
            border: `1px solid ${assistantBorder}`,
            borderRadius: '20px 20px 20px 4px',
            backdropFilter: 'blur(12px)',
          }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--sims-blue)',
              }}
              animate={{
                y: [0, -8, 0],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </motion.div>
      </div>
    );
  }

  if (!content) return null;

  return (
    <motion.div
      style={{
        marginBottom: 16,
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
      }}
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => !isUser && setShowFeedback(true)}
      onMouseLeave={() => !isUser && setShowFeedback(false)}
    >
      {/* Message bubble */}
      <div
        style={{
          maxWidth: '80%',
          whiteSpace: 'pre-wrap',
          padding: '14px 20px',
          fontSize: 'calc(17px * var(--text-scale, 1))',
          lineHeight: 1.65,
          fontWeight: 400,
          letterSpacing: '-0.1px',
          color: textColor,
          borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
          ...(isUser
            ? {
              background: userBg,
              boxShadow: '0 4px 20px rgba(0,102,204,0.25)',
            }
            : {
              background: assistantBg,
              border: `1px solid ${assistantBorder}`,
              backdropFilter: 'blur(12px)',
              boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.04)',
            }),
        }}
      >
        {content}
      </div>

      {/* Thumbs up / down feedback — only on assistant messages */}
      {!isUser && (
        <AnimatePresence>
          {(showFeedback || feedback) && (
            <motion.div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 6,
                marginLeft: 8,
              }}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <motion.button
                onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: feedback === 'up' ? 'rgba(34,197,94,0.12)' : 'transparent',
                  color: feedback === 'up' ? feedbackActiveUp : feedbackColor,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.85 }}
                aria-label="Good response"
              >
                <ThumbUpIcon filled={feedback === 'up'} />
              </motion.button>

              <motion.button
                onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: feedback === 'down' ? 'rgba(239,68,68,0.12)' : 'transparent',
                  color: feedback === 'down' ? feedbackActiveDown : feedbackColor,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.85 }}
                aria-label="Bad response"
              >
                <ThumbDownIcon filled={feedback === 'down'} />
              </motion.button>

              {/* Thank you feedback */}
              <AnimatePresence>
                {feedback && (
                  <motion.span
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: feedback === 'up' ? feedbackActiveUp : feedbackActiveDown,
                      marginLeft: 4,
                    }}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    {feedback === 'up' ? 'Thanks!' : 'We\'ll improve'}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
}