'use client';

import { motion } from 'framer-motion';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  isLoading?: boolean;
}

// Parse markdown content supporting bold (**text**) and bullet points (- text)
function parseContent(text: string) {
  // Split content by lines to handle bullet points
  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => {
    // Check if line is a bullet point (starts with "- " or "* ")
    const isBullet = line.trim().match(/^[-*]\s+(.+)/);
    
    // Process bold text within the line
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, partIndex) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        return (
          <strong key={`${lineIndex}-${partIndex}`} style={{ fontWeight: 700 }}>
            {boldText}
          </strong>
        );
      }
      return part;
    });

    // If it's a bullet point, render as a list item style
    if (isBullet) {
      // Remove the bullet marker for rendering
       const contentWithoutBullet = isBullet[1];
       // Re-parse the content inside bullet for bold text
       const bulletParts = contentWithoutBullet.split(/(\*\*[^*]+\*\*)/g).map((part, partIndex) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const boldText = part.slice(2, -2);
          return (
            <strong key={`bullet-${lineIndex}-${partIndex}`} style={{ fontWeight: 700 }}>
              {boldText}
            </strong>
          );
        }
        return part;
      });

      return (
        <div key={lineIndex} style={{ display: 'flex', alignItems: 'flex-start', marginLeft: '12px', marginBottom: '4px' }}>
          <span style={{ marginRight: '8px', fontSize: '18px', lineHeight: '1.2' }}>•</span>
          <span style={{ flex: 1 }}>{bulletParts}</span>
        </div>
      );
    }

    // Regular line, render properly with line breaks if needed
    // If it's empty, render a break
    if (line.trim() === '') {
      return <div key={lineIndex} style={{ height: '8px' }} />;
    }

    return (
      <div key={lineIndex} style={{ marginBottom: '4px' }}>
        {parts}
      </div>
    );
  });
}

export default function MessageBubble({ role, content, isLoading }: MessageBubbleProps) {
  const isUser = role === 'user';

  // Inline styles for reliable rendering
  const styles = {
    container: {
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '16px',
    },
    bubble: {
      maxWidth: '80%',
      padding: '16px 20px',
      borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
      background: isUser 
        ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' 
        : '#212121',
      color: 'white',
    },
    text: {
      fontSize: '16px',
      lineHeight: '1.6',
      margin: 0,
      whiteSpace: 'pre-wrap' as const,
    },
    loadingContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 4px',
    },
    loadingDot: {
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: '#6B7280',
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={styles.container}
    >
      <div style={styles.bubble}>
        {isLoading ? (
          // iMessage-style typing indicator
          <div style={styles.loadingContainer}>
            <motion.span
              style={styles.loadingDot}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
            />
            <motion.span
              style={styles.loadingDot}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
            />
            <motion.span
              style={styles.loadingDot}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
            />
          </div>
        ) : (
          <div style={styles.text}>{parseContent(content)}</div>
        )}
      </div>
    </motion.div>
  );
}
