/**
 * CommandCenter — Widget "Le Commandant" pour l'Espace Personnel
 *
 * Affiche :
 *   • Status IA (Rouge / Orange / Vert) avec score
 *   • Liste des urgences filtrées par l'IA
 *   • Chat de recadrage ↔ Commandant
 */
import React, {
  useState, useEffect, useRef, useCallback,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, AlertTriangle, CheckCircle2, Clock, ChevronDown,
  ChevronUp, Send, Zap, Target, TrendingDown, UserX, Loader2,
} from 'lucide-react';
import {
  collection, doc, onSnapshot, query, orderBy, limit,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../firebase/config';
import { useStore } from '../../store';

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  critical: { color: '#EF4444', bg: '#EF444418', label: 'CRITIQUE',  ring: '#EF4444' },
  warning:  { color: '#F59E0B', bg: '#F59E0B18', label: 'VIGILANCE', ring: '#F59E0B' },
  info:     { color: '#6366F1', bg: '#6366F118', label: 'INFO',       ring: '#6366F1' },
};

const LEVEL_CONFIG = {
  red:    { color: '#EF4444', label: 'Attention requise',    Icon: AlertTriangle },
  orange: { color: '#F59E0B', label: 'Vigilance active',     Icon: Clock },
  green:  { color: '#10B981', label: 'Performance nominale', Icon: CheckCircle2 },
};

const TRIGGER_ICONS = {
  overdue_card:      { Icon: AlertTriangle, label: 'Retard critique' },
  stagnant_card:     { Icon: Clock,         label: 'Stagnation' },
  score_drop:        { Icon: TrendingDown,  label: 'Chute de score' },
  urgent_unassigned: { Icon: UserX,         label: 'Urgence non assignée' },
};

function formatRelative(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60)   return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  return `il y a ${Math.floor(diff / 86400)}j`;
}

// ─────────────────────────────────────────────────────────────────────
// Status Badge
// ─────────────────────────────────────────────────────────────────────

function StatusBadge({ level, score, openAlerts }) {
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.green;
  const { Icon } = cfg;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '1rem',
      padding: '1.25rem 1.5rem',
      background: `${cfg.color}12`,
      border: `1.5px solid ${cfg.color}40`,
      borderRadius: '1.25rem',
    }}>
      {/* Pulsing dot */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: `${cfg.color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={24} color={cfg.color} />
        </div>
        {level !== 'green' && (
          <motion.div
            style={{
              position: 'absolute', inset: -4, borderRadius: '50%',
              border: `2px solid ${cfg.color}`,
            }}
            animate={{ opacity: [1, 0.2, 1], scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 2 }}>
          Statut IA — Le Commandant
        </div>
        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)' }}>
          {cfg.label}
        </div>
        {openAlerts > 0 && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {openAlerts} alerte{openAlerts > 1 ? 's' : ''} en attente de traitement
          </div>
        )}
      </div>

      {/* Score ring */}
      <div style={{ position: 'relative', width: 60, height: 60, flexShrink: 0 }}>
        <svg style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }} viewBox="0 0 60 60">
          <circle cx="30" cy="30" r="25" fill="none" stroke="var(--border)" strokeWidth="5" />
          <circle cx="30" cy="30" r="25" fill="none"
            stroke={score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444'}
            strokeWidth="5" strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 157} 157`}
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>/100</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Alert Card
// ─────────────────────────────────────────────────────────────────────

function AlertCard({ msg, onReply, isExpanded, onToggle }) {
  const cfg = SEVERITY_CONFIG[msg.severity] || SEVERITY_CONFIG.info;
  const triggerTypes = msg.triggerTypes || [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        border: `1.5px solid ${cfg.color}35`,
        borderLeft: `4px solid ${cfg.color}`,
        borderRadius: '1rem',
        overflow: 'hidden',
        background: 'var(--bg-card)',
      }}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        style={{
          width: '100%', padding: '1rem 1.25rem', display: 'flex',
          alignItems: 'center', gap: '0.75rem', background: 'transparent',
          border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{
          padding: '4px 10px', borderRadius: '6px', fontSize: '0.65rem',
          fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px',
          background: cfg.bg, color: cfg.color, flexShrink: 0,
        }}>
          {cfg.label}
        </div>
        <div style={{ flex: 1, display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {triggerTypes.slice(0, 3).map((type, i) => {
            const t = TRIGGER_ICONS[type] || {};
            const TIcon = t.Icon || Zap;
            return (
              <span key={i} style={{
                display: 'flex', alignItems: 'center', gap: '3px',
                fontSize: '0.7rem', color: 'var(--text-muted)',
              }}>
                <TIcon size={12} /> {t.label || type}
              </span>
            );
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {formatRelative(msg.createdAt)}
          </span>
          {msg.status === 'new' && (
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
          )}
          {isExpanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
        </div>
      </button>

      {/* Body */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 1.25rem 1.25rem 1.25rem' }}>
              <div style={{
                padding: '1rem 1.25rem',
                background: 'var(--bg-subtle)',
                borderRadius: '0.75rem',
                fontSize: '0.85rem',
                lineHeight: 1.7,
                color: 'var(--text)',
                whiteSpace: 'pre-wrap',
                marginBottom: '0.75rem',
              }}>
                {msg.content}
              </div>
              <button
                onClick={() => onReply(msg)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.5rem 1rem', borderRadius: '0.75rem',
                  background: cfg.bg, border: `1px solid ${cfg.color}40`,
                  color: cfg.color, fontSize: '0.8rem', fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Send size={13} /> Répondre au Commandant
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Chat Panel
// ─────────────────────────────────────────────────────────────────────

function ChatPanel({ uid, activeAlert, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [sending, setSending]   = useState(false);
  const bottomRef = useRef(null);

  const commanderChat = httpsCallable(functions, 'commanderChat');

  // Écoute le fil de messages en temps réel
  useEffect(() => {
    if (!uid || !activeAlert) return;
    const q = query(
      collection(db, 'commander_alerts', uid, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(50),
    );
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .filter(m => m.logId === activeAlert.logId || !m.logId));
    });
    return unsub;
  }, [uid, activeAlert]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);
    try {
      await commanderChat({ reply: text, logId: activeAlert.logId });
    } catch (err) {
      console.error('[Commander Chat]', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      style={{
        position: 'absolute', inset: 0,
        background: 'var(--bg-card)',
        borderRadius: '1.5rem',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 10,
      }}
    >
      {/* Header */}
      <div style={{
        padding: '1rem 1.25rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg,#1a1a2e,#16213e)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1.5px solid #6366F1',
        }}>
          <Shield size={16} color="#6366F1" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>Le Commandant</div>
          <div style={{ fontSize: '0.7rem', color: '#10B981' }}>● En ligne — Analyse en cours</div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {messages.map(m => (
          <div key={m.id} style={{
            display: 'flex',
            justifyContent: m.type === 'user' ? 'flex-end' : 'flex-start',
          }}>
            {m.type === 'commander' && (
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0, marginRight: 8,
                background: 'linear-gradient(135deg,#1a1a2e,#16213e)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1.5px solid #6366F1', alignSelf: 'flex-end',
              }}>
                <Shield size={12} color="#6366F1" />
              </div>
            )}
            <div style={{
              maxWidth: '75%',
              padding: '0.75rem 1rem',
              borderRadius: m.type === 'user' ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
              background: m.type === 'user'
                ? 'linear-gradient(135deg,#4f46e5,#6366f1)'
                : 'var(--bg-subtle)',
              color: m.type === 'user' ? '#fff' : 'var(--text)',
              fontSize: '0.82rem',
              lineHeight: 1.65,
              whiteSpace: 'pre-wrap',
            }}>
              {m.content}
              {m.escalation && m.escalation !== 'resolved' && (
                <div style={{
                  marginTop: '0.5rem', padding: '0.35rem 0.75rem',
                  background: '#10B98120', borderRadius: '0.5rem',
                  fontSize: '0.72rem', color: '#10B981', fontWeight: 700,
                }}>
                  ↗ Escalade {m.escalation} initiée
                </div>
              )}
              {m.escalation === 'resolved' && (
                <div style={{
                  marginTop: '0.5rem', padding: '0.35rem 0.75rem',
                  background: '#10B98120', borderRadius: '0.5rem',
                  fontSize: '0.72rem', color: '#10B981', fontWeight: 700,
                }}>
                  ✓ Alerte clôturée
                </div>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            Le Commandant analyse...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '0.75rem 1rem',
        borderTop: '1px solid var(--border)',
        display: 'flex', gap: '0.5rem',
        background: 'var(--bg-card)',
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Expliquer un blocage, signaler une résolution..."
          style={{
            flex: 1, padding: '0.6rem 1rem', borderRadius: '0.75rem',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border)', color: 'var(--text)',
            fontSize: '0.82rem', outline: 'none',
          }}
          disabled={sending}
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          style={{
            padding: '0.6rem 1rem', borderRadius: '0.75rem',
            background: input.trim() && !sending ? '#6366F1' : 'var(--bg-subtle)',
            border: 'none', color: input.trim() && !sending ? '#fff' : 'var(--text-muted)',
            cursor: input.trim() && !sending ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}
        >
          {sending ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
        </button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// COMMAND CENTER — Composant principal
// ─────────────────────────────────────────────────────────────────────

export default function CommandCenter() {
  const uid = useStore(s => s.user?.uid || s.user?.id);

  const [status, setStatus]       = useState(null);
  const [alerts, setAlerts]       = useState([]);
  const [expandedId, setExpanded] = useState(null);
  const [activeChat, setChat]     = useState(null); // { logId, severity }

  // Écoute du statut en temps réel
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, 'commander_status', uid), snap => {
      setStatus(snap.exists() ? snap.data() : null);
    });
    return unsub;
  }, [uid]);

  // Écoute des alertes (messages du Commandant uniquement, non résolus)
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, 'commander_alerts', uid, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(20),
    );
    const unsub = onSnapshot(q, snap => {
      setAlerts(
        snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(m => m.type === 'commander')
      );
    });
    return unsub;
  }, [uid]);

  const handleReply = useCallback((msg) => {
    setChat({ logId: msg.logId, severity: msg.severity });
  }, []);

  const level      = status?.level || 'green';
  const score      = status?.score ?? 100;
  const openAlerts = status?.openAlerts ?? 0;

  const emptyState = !status || (alerts.length === 0);

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* STATUS BADGE */}
      <StatusBadge level={level} score={score} openAlerts={openAlerts} />

      {/* SECTION : Urgences */}
      <div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '0.75rem',
        }}>
          <h4 style={{
            margin: 0, fontWeight: 800, fontSize: '0.8rem',
            textTransform: 'uppercase', letterSpacing: '1.5px',
            color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: '0.4rem',
          }}>
            <Target size={14} /> Urgences détectées
          </h4>
          {openAlerts > 0 && (
            <span style={{
              padding: '2px 8px', borderRadius: '999px', fontSize: '0.7rem',
              fontWeight: 800, background: '#EF444420', color: '#EF4444',
            }}>
              {openAlerts} active{openAlerts > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {emptyState ? (
          <div style={{
            padding: '2rem 1rem', textAlign: 'center',
            background: 'var(--bg-subtle)', borderRadius: '1rem',
            border: '1.5px dashed var(--border)',
          }}>
            <CheckCircle2 size={36} color="#10B981" style={{ margin: '0 auto 0.75rem auto', opacity: 0.7 }} />
            <div style={{ fontWeight: 700, color: '#10B981', fontSize: '0.9rem', marginBottom: 4 }}>
              Performance nominale
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Aucune alerte active. Le prochain scan IA aura lieu dans moins de 4h.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {alerts.map(msg => (
              <AlertCard
                key={msg.id}
                msg={msg}
                isExpanded={expandedId === msg.id}
                onToggle={() => setExpanded(prev => prev === msg.id ? null : msg.id)}
                onReply={handleReply}
              />
            ))}
          </div>
        )}
      </div>

      {/* CHAT OVERLAY */}
      <AnimatePresence>
        {activeChat && (
          <ChatPanel
            uid={uid}
            activeAlert={activeChat}
            onClose={() => setChat(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
