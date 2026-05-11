/**
 * ActivityLog — Journal d'audit temps réel de la carte
 * Combine les événements systèmes (card_moved, label_added…) et les commentaires.
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, ArrowRight, Tag, Calendar, CheckSquare,
  Paperclip, Zap, User, Link2, Clock, Send,
} from 'lucide-react';
import { MissionsFS } from '../services/missions.firestore';

// ── Icône + couleur par type d'événement ─────────────────────────

const EVENT_META = {
  card_created:            { icon: <Zap size={13} />,         color: '#8B5CF6', label: 'a créé cette carte' },
  card_moved:              { icon: <ArrowRight size={13} />,   color: '#3B82F6', label: 'a déplacé la carte' },
  card_renamed:            { icon: <Zap size={13} />,          color: '#64748B', label: 'a renommé la carte' },
  member_added:            { icon: <User size={13} />,         color: '#10B981', label: 'a ajouté un membre' },
  member_removed:          { icon: <User size={13} />,         color: '#EF4444', label: 'a retiré un membre' },
  label_added:             { icon: <Tag size={13} />,          color: '#F59E0B', label: 'a ajouté une étiquette' },
  label_removed:           { icon: <Tag size={13} />,          color: '#F59E0B', label: 'a retiré une étiquette' },
  due_date_set:            { icon: <Calendar size={13} />,     color: '#3B82F6', label: 'a défini une échéance' },
  due_date_completed:      { icon: <Calendar size={13} />,     color: '#10B981', label: 'a marqué l\'échéance complète' },
  description_updated:     { icon: <Zap size={13} />,          color: '#64748B', label: 'a modifié la description' },
  checklist_created:       { icon: <CheckSquare size={13} />,  color: '#8B5CF6', label: 'a créé une checklist' },
  checklist_item_checked:  { icon: <CheckSquare size={13} />,  color: '#10B981', label: 'a coché un élément' },
  checklist_item_unchecked:{ icon: <CheckSquare size={13} />,  color: '#F59E0B', label: 'a décoché un élément' },
  attachment_added:        { icon: <Paperclip size={13} />,    color: '#6366F1', label: 'a joint un fichier' },
  erp_link_added:          { icon: <Link2 size={13} />,        color: '#0D9488', label: 'a lié une entité ERP' },
  erp_link_removed:        { icon: <Link2 size={13} />,        color: '#EF4444', label: 'a retiré un lien ERP' },
  comment_added:           { icon: <MessageSquare size={13} />,color: '#8B5CF6', label: null }, // texte libre
  butler_action_fired:     { icon: <Zap size={13} />,          color: '#F59E0B', label: 'Butler a déclenché une règle' },
};

const formatDate = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)  return 'À l\'instant';
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return `Il y a ${diffH}h`;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
};

// ── Item d'activité ────────────────────────────────────────────────

const ActivityItem = ({ event }) => {
  const meta = EVENT_META[event.type] || { icon: <Zap size={13} />, color: '#64748B', label: 'a effectué une action' };
  const isComment = event.type === 'comment_added';

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}
    >
      {/* Avatar */}
      <div style={{
        width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
        background: `hsl(${(event.actorUid || 'x').charCodeAt(0) * 37 % 360}, 60%, 65%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.65rem', fontWeight: 800, color: 'white',
      }}>
        {(event.actorName || '?').slice(0, 2).toUpperCase()}
      </div>

      <div style={{ flex: 1 }}>
        {isComment ? (
          /* Commentaire : bulle dédiée */
          <div>
            <div style={{ marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1E293B' }}>
                {event.actorName}
              </span>
              <span style={{ fontSize: '0.7rem', color: '#94A3B8', marginLeft: '0.5rem' }}>
                {formatDate(event.createdAt)}
              </span>
            </div>
            <div style={{
              background: '#F8FAFC', border: '1px solid #E2E8F0',
              borderRadius: '0 0.75rem 0.75rem 0.75rem',
              padding: '0.6rem 0.875rem', fontSize: '0.875rem',
              color: '#1E293B', lineHeight: 1.5,
              borderLeft: `3px solid ${meta.color}`,
            }}>
              {event.meta?.text || ''}
            </div>
          </div>
        ) : (
          /* Événement système : ligne compacte */
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <div style={{
              width: '20px', height: '20px', borderRadius: '50%',
              background: `${meta.color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: meta.color, flexShrink: 0,
            }}>
              {meta.icon}
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E293B' }}>
              {event.actorName}
            </span>
            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
              {meta.label}
              {event.meta?.toListName && (
                <span style={{ color: '#8B5CF6', fontWeight: 700 }}> → {event.meta.toListName}</span>
              )}
              {event.meta?.fieldName && (
                <span style={{ color: '#64748B' }}> « {event.meta.fieldName} »</span>
              )}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#CBD5E1', marginLeft: 'auto' }}>
              {formatDate(event.createdAt)}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ── Composant principal ────────────────────────────────────────────

const ActivityLog = ({ cardId, uid, userName }) => {
  const [events, setEvents]       = useState([]);
  const [comment, setComment]     = useState('');
  const [sending, setSending]     = useState(false);
  const textareaRef               = useRef(null);

  useEffect(() => {
    if (!cardId) return;
    const unsub = MissionsFS.subscribeActivity(cardId, setEvents);
    return unsub;
  }, [cardId]);

  const sendComment = async () => {
    if (!comment.trim() || sending) return;
    setSending(true);
    try {
      await MissionsFS.addComment(cardId, comment.trim(), uid, userName);
      setComment('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      {/* Zone de commentaire */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
          background: `hsl(${uid.charCodeAt(0) * 37 % 360}, 60%, 65%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.65rem', fontWeight: 800, color: 'white',
        }}>
          {userName.slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <textarea
            ref={textareaRef}
            value={comment}
            onChange={e => setComment(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) sendComment(); }}
            placeholder="Écrire un commentaire… (Ctrl+Entrée pour envoyer)"
            rows={2}
            style={{
              width: '100%', padding: '0.6rem 0.75rem',
              borderRadius: '0.75rem', border: '1.5px solid #E2E8F0',
              fontSize: '0.875rem', resize: 'vertical', outline: 'none',
              fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box',
              transition: 'border 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = '#8B5CF6'}
            onBlur={e  => e.target.style.borderColor = '#E2E8F0'}
          />
          <AnimatePresence>
            {comment.trim() && (
              <motion.button
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                onClick={sendComment}
                disabled={sending}
                style={{
                  marginTop: '0.4rem', padding: '0.4rem 0.875rem',
                  borderRadius: '0.5rem', background: '#8B5CF6',
                  color: 'white', border: 'none', cursor: 'pointer',
                  fontSize: '0.8rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  opacity: sending ? 0.6 : 1,
                }}
              >
                <Send size={12} /> Envoyer
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Flux d'événements */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        <AnimatePresence initial={false}>
          {events.map(ev => (
            <ActivityItem key={ev.id} event={ev} />
          ))}
        </AnimatePresence>
        {events.length === 0 && (
          <div style={{ textAlign: 'center', color: '#CBD5E1', fontSize: '0.8rem', padding: '1.5rem 0' }}>
            <Clock size={24} style={{ display: 'block', margin: '0 auto 0.5rem', opacity: 0.3 }} />
            Aucune activité pour le moment
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
