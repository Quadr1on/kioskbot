'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mic, MessageSquare, Clock, Filter, ChevronDown, ChevronUp, RefreshCw, Wrench } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LogEntry {
  id: string;
  session_id: string;
  mode: 'voice' | 'chat';
  language: string;
  role: string;
  content: string;
  metadata: any;
  created_at: string;
}

interface Session {
  session_id: string;
  mode: string;
  language: string;
  started_at: string;
  messages: LogEntry[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [modeFilter, setModeFilter] = useState<'all' | 'voice' | 'chat'>('all');
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [totalLogs, setTotalLogs] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (modeFilter !== 'all') params.set('mode', modeFilter);
      params.set('limit', '500');

      const res = await fetch(`/api/admin/logs?${params}`);
      const data = await res.json();
      setSessions(data.sessions || []);
      setTotalLogs(data.total_logs || 0);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  }, [modeFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const voiceCount = sessions.filter(s => s.mode === 'voice').length;
  const chatCount = sessions.filter(s => s.mode === 'chat').length;
  const todayCount = sessions.filter(s => {
    const d = new Date(s.started_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      user: { bg: 'rgba(59, 130, 246, 0.2)', text: '#93c5fd', label: 'User' },
      assistant: { bg: 'rgba(34, 197, 94, 0.2)', text: '#86efac', label: 'Assistant' },
      tool_call: { bg: 'rgba(249, 115, 22, 0.2)', text: '#fdba74', label: 'Tool Call' },
      tool_result: { bg: 'rgba(168, 85, 247, 0.2)', text: '#c4b5fd', label: 'Tool Result' },
    };
    return badges[role] || { bg: 'rgba(107,114,128,0.2)', text: '#9ca3af', label: role };
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      color: '#e5e7eb',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid #1f1f1f',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backdropFilter: 'blur(12px)',
        background: 'rgba(0,0,0,0.8)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => router.push('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid #2a2a2a',
              borderRadius: '10px', padding: '8px 16px',
              color: '#9ca3af', cursor: 'pointer', fontSize: '14px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#4a4a4a'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#9ca3af'; }}
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', margin: 0 }}>Admin Dashboard</h1>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0 0' }}>SIMS Hospital Kiosk — Conversation Logs</p>
          </div>
        </div>
        <button
          onClick={fetchLogs}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid #2a2a2a',
            borderRadius: '10px', padding: '8px 16px',
            color: '#9ca3af', cursor: 'pointer', fontSize: '13px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#4a4a4a'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#9ca3af'; }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 32px' }}>
        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}>
          {[
            { label: 'Total Sessions', value: sessions.length, icon: <Clock size={20} />, color: '#6366f1' },
            { label: 'Voice Sessions', value: voiceCount, icon: <Mic size={20} />, color: '#8b5cf6' },
            { label: 'Chat Sessions', value: chatCount, icon: <MessageSquare size={20} />, color: '#3b82f6' },
            { label: 'Today', value: todayCount, icon: <Clock size={20} />, color: '#22c55e' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              style={{
                background: '#0a0a0a',
                border: '1px solid #1f1f1f',
                borderRadius: '16px',
                padding: '20px 24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ color: '#6b7280', fontSize: '13px', fontWeight: 500 }}>{stat.label}</span>
                <div style={{ color: stat.color, opacity: 0.7 }}>{stat.icon}</div>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 700, color: '#fff' }}>{stat.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Filter Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          padding: '12px 16px',
          background: '#0a0a0a',
          border: '1px solid #1f1f1f',
          borderRadius: '12px',
        }}>
          <Filter size={16} style={{ color: '#6b7280' }} />
          <span style={{ color: '#6b7280', fontSize: '13px', fontWeight: 500 }}>Filter:</span>
          {(['all', 'voice', 'chat'] as const).map(m => (
            <button
              key={m}
              onClick={() => setModeFilter(m)}
              style={{
                padding: '6px 16px',
                borderRadius: '8px',
                border: modeFilter === m ? '1px solid #4a4a4a' : '1px solid transparent',
                background: modeFilter === m ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: modeFilter === m ? '#fff' : '#6b7280',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                textTransform: 'capitalize',
                transition: 'all 0.2s',
              }}
            >
              {m === 'all' ? 'All' : m === 'voice' ? '🎤 Voice' : '💬 Chat'}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', color: '#4b5563', fontSize: '12px' }}>
            {totalLogs} total log entries
          </span>
        </div>

        {/* Sessions List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px', display: 'block' }} />
            Loading logs...
          </div>
        ) : sessions.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 40px',
            background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: '16px',
          }}>
            <MessageSquare size={40} style={{ color: '#2a2a2a', margin: '0 auto 16px', display: 'block' }} />
            <p style={{ color: '#6b7280', fontSize: '16px', margin: 0 }}>No conversation logs yet</p>
            <p style={{ color: '#4b5563', fontSize: '13px', marginTop: '8px' }}>Start a voice or chat session to see logs here</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sessions.map((session, idx) => {
              const isExpanded = expandedSession === session.session_id;
              const msgCount = session.messages.length;
              const modeIcon = session.mode === 'voice' ? <Mic size={14} /> : <MessageSquare size={14} />;
              const modeColor = session.mode === 'voice' ? '#8b5cf6' : '#3b82f6';

              return (
                <motion.div
                  key={session.session_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.2 }}
                  style={{
                    background: '#0a0a0a',
                    border: `1px solid ${isExpanded ? '#2a2a2a' : '#1a1a1a'}`,
                    borderRadius: '14px',
                    overflow: 'hidden',
                    transition: 'border-color 0.2s',
                  }}
                >
                  {/* Session Header (clickable) */}
                  <button
                    onClick={() => setExpandedSession(isExpanded ? null : session.session_id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '16px 20px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#e5e7eb',
                      textAlign: 'left',
                    }}
                  >
                    {/* Mode badge */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '4px 10px', borderRadius: '6px',
                      background: `${modeColor}22`, color: modeColor,
                      fontSize: '12px', fontWeight: 600, textTransform: 'uppercase',
                      minWidth: '70px', justifyContent: 'center',
                    }}>
                      {modeIcon}
                      {session.mode}
                    </div>

                    {/* Session info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#d1d5db' }}>
                        {session.session_id.slice(0, 24)}...
                      </div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                        {formatTime(session.started_at)} · {session.language} · {msgCount} messages
                      </div>
                    </div>

                    {/* Preview of first user message */}
                    <div style={{
                      maxWidth: '300px', fontSize: '12px', color: '#6b7280',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {session.messages.find(m => m.role === 'assistant')?.content?.slice(0, 60) || '—'}
                    </div>

                    {/* Expand icon */}
                    {isExpanded ? <ChevronUp size={16} style={{ color: '#6b7280' }} /> : <ChevronDown size={16} style={{ color: '#6b7280' }} />}
                  </button>

                  {/* Expanded Messages */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{
                          borderTop: '1px solid #1a1a1a',
                          padding: '16px 20px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          maxHeight: '500px',
                          overflowY: 'auto',
                        }}>
                          {session.messages.map((msg, mi) => {
                            const badge = getRoleBadge(msg.role);
                            return (
                              <div key={msg.id || mi} style={{
                                display: 'flex', gap: '12px', alignItems: 'flex-start',
                              }}>
                                {/* Role badge */}
                                <div style={{
                                  padding: '3px 10px', borderRadius: '6px',
                                  background: badge.bg, color: badge.text,
                                  fontSize: '11px', fontWeight: 600,
                                  minWidth: '80px', textAlign: 'center',
                                  flexShrink: 0, marginTop: '2px',
                                }}>
                                  {badge.label}
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{
                                    fontSize: '13px', color: '#d1d5db', lineHeight: 1.5,
                                    wordBreak: 'break-word',
                                  }}>
                                    {msg.content}
                                  </div>
                                  {/* Metadata for tool calls */}
                                  {msg.metadata && Object.keys(msg.metadata).length > 0 && (
                                    <div style={{
                                      marginTop: '6px', padding: '8px 12px',
                                      background: '#111', borderRadius: '8px',
                                      fontSize: '11px', color: '#6b7280',
                                      fontFamily: "'JetBrains Mono', monospace",
                                      whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                                      maxHeight: '150px', overflowY: 'auto',
                                    }}>
                                      {JSON.stringify(msg.metadata, null, 2)}
                                    </div>
                                  )}
                                </div>

                                {/* Timestamp */}
                                <div style={{
                                  fontSize: '10px', color: '#4b5563',
                                  whiteSpace: 'nowrap', flexShrink: 0,
                                }}>
                                  {new Date(msg.created_at).toLocaleTimeString('en-IN', {
                                    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Global styles for animations */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @media (max-width: 768px) {
          main > div:first-child { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
