'use client';

import { motion } from 'framer-motion';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  isLoading?: boolean;
}

function parseContent(text: string) {
  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => {
    const isBullet = line.trim().match(/^[-*]\s+(.+)/);
    
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

    if (isBullet) {
      const contentWithoutBullet = isBullet[1];
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
        <div key={lineIndex} style={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          marginLeft: '8px', 
          marginBottom: '6px',
          fontSize: '15px',
          lineHeight: '1.6',
        }}>
          <span style={{ marginRight: '10px', fontSize: '16px', lineHeight: '1.2', flexShrink: 0, marginTop: '2px' }}>•</span>
          <span style={{ flex: 1 }}>{bulletParts}</span>
        </div>
      );
    }

    if (line.trim() === '') {
      return <div key={lineIndex} style={{ height: '10px' }} />;
    }

    return (
      <div key={lineIndex} style={{ 
        marginBottom: '4px',
        fontSize: '15px',
        lineHeight: '1.6',
        fontWeight: 500,
      }}>
        {parts}
      </div>
    );
  });
}

export default function MessageBubble({ role, content, isLoading }: MessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '16px',
      }}
    >
      <div
        style={{
          maxWidth: '70%',
          padding: isUser ? '10px 16px' : '12px 16px',
          borderRadius: isUser ? '18px 18px 6px 18px' : '18px 18px 18px 6px',
          background: isUser 
            ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' 
            : '#212121',
          color: isUser ? 'white' : 'white',
          wordBreak: 'break-word',
          boxShadow: isUser 
            ? '0 4px 12px rgba(59, 130, 246, 0.25)' 
            : '0 2px 8px rgba(0, 0, 0, 0.2)',
          border: isUser ? 'none' : '1px solid #3a3a3a',
          transition: 'all 0.2s',
        }}
      >
        {isLoading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 4px',
          }}>
            <motion.span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#9ca3af',
              }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
            />
            <motion.span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#9ca3af',
              }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
            />
            <motion.span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#9ca3af',
              }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
            />
          </div>
        ) : (
          <div style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {parseContent(content)}
          </div>
        )}
      </div>
    </motion.div>
  );
}