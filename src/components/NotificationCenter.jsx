import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCheck, Package, FileText, Users, AlertTriangle, RefreshCw, Calendar } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useStore } from '../store';

// ── Type Icons par catégorie ──
const NOTIF_ICONS = {
  DEVIS_RELANCE:     { icon: FileText,     color: '#3B82F6', bg: '#EFF6FF' },
  STOCK_REORDER:     { icon: Package,      color: '#F59E0B', bg: '#FFFBEB' },
  CLIENT_ANNIVERSARY:{ icon: Calendar,     color: '#8B5CF6', bg: '#F5F3FF' },
  CLIENT_INACTIF_VIP:{ icon: Users,        color: '#EF4444', bg: '#FEF2F2' },
  SYSTEM:            { icon: RefreshCw,    color: '#10B981', bg: '#ECFDF5' },
  DEFAULT:           { icon: AlertTriangle, color: '#6B7280', bg: '#F9FAFB' },
};

function timeAgo(timestamp) {
  if (!timestamp) return '…';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60)    return `Il y a ${Math.round(diff)}s`;
  if (diff < 3600)  return `Il y a ${Math.round(diff / 60)}min`;
  if (diff < 86400) return `Il y a ${Math.round(diff / 3600)}h`;
  return `Il y a ${Math.round(diff / 86400)}j`;
}

const NotificationItem = React.memo(({ notif, onMarkRead }) => {
  const type = NOTIF_ICONS[notif.type] || NOTIF_ICONS.DEFAULT;
  const IconCmp = type.icon;
  const isUnread = notif.status === 'pending';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      style={{
        display: 'flex', gap: '0.75rem', padding: '1rem', borderRadius: '12px',
        background: isUnread ? type.bg : '#FAFAFA',
        border: `1px solid ${isUnread ? type.color + '30' : '#F1F5F9'}`,
        cursor: 'pointer',
      }}
      onClick={() => isUnread && onMarkRead(notif.id)}
    >
      <div style={{
        width: '36px', height: '36px', borderRadius: '10px', background: type.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        border: `1px solid ${type.color}20`,
      }}>
        <IconCmp size={18} color={type.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.8rem', fontWeight: isUnread ? 700 : 500, color: '#1E293B', lineHeight: 1.4, marginBottom: '4px' }}>
          {notif.message}
        </div>
        <div style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600 }}>
          {timeAgo(notif.createdAt)}
          {notif.priority === 'Critique' && (
            <span style={{ marginLeft: '6px', color: '#EF4444', fontWeight: 800 }}>● CRITIQUE</span>
          )}
        </div>
      </div>
      {isUnread && (
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: type.color, flexShrink: 0, marginTop: '4px' }} />
      )}
    </motion.div>
  );
});
NotificationItem.displayName = 'NotificationItem';

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const panelRef = useRef(null);
  const currentUser = useStore(s => s.currentUser);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const q = query(collection(db, 'notifications_queue'), orderBy('createdAt', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn('[NotificationCenter]', err));
    return () => unsub();
  }, [currentUser?.uid]);

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifications.filter(n => n.status === 'pending').length;
  const displayed = filter === 'unread' ? notifications.filter(n => n.status === 'pending') : notifications;

  const markRead = useCallback(async (id) => {
    try { await updateDoc(doc(db, 'notifications_queue', id), { status: 'read' }); }
    catch (e) { console.warn('[NotificationCenter] markRead error:', e); }
  }, []);

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter(n => n.status === 'pending');
    if (!unread.length) return;
    const batch = writeBatch(db);
    unread.forEach(n => batch.update(doc(db, 'notifications_queue', n.id), { status: 'read' }));
    await batch.commit();
  }, [notifications]);

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        id="notification-center-btn"
        onClick={() => setIsOpen(v => !v)}
        aria-label={`Notifications — ${unreadCount} non lues`}
        aria-expanded={isOpen}
        style={{
          position: 'relative', background: isOpen ? '#F1F5F9' : 'transparent',
          border: `1px solid ${isOpen ? '#E2E8F0' : 'transparent'}`, borderRadius: '12px',
          padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center',
          color: '#475569', transition: 'all 0.2s ease',
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <motion.span key={unreadCount} initial={{ scale: 0 }} animate={{ scale: 1 }}
            style={{
              position: 'absolute', top: '4px', right: '4px',
              minWidth: '18px', height: '18px', background: '#EF4444', color: 'white',
              fontSize: '0.65rem', fontWeight: 900, borderRadius: '999px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 4px', border: '2px solid white',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="notification-panel"
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            role="dialog"
            aria-label="Centre de notifications"
            style={{
              position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: '380px',
              maxHeight: '520px', background: '#FFFFFF', border: '1px solid #E2E8F0',
              borderRadius: '20px', boxShadow: '0 20px 60px -10px rgba(0,0,0,0.12)',
              zIndex: 9999, display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1E293B' }}>Notifications</div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>
                  {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est lu ✓'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: '#64748B', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCheck size={14} /> Tout lire
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '4px' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div style={{ padding: '0.75rem 1.5rem', display: 'flex', gap: '0.5rem', borderBottom: '1px solid #F8FAFC' }}>
              {[['all', 'Toutes'], ['unread', 'Non lues']].map(([val, label]) => (
                <button key={val} onClick={() => setFilter(val)} style={{
                  padding: '4px 12px', borderRadius: '999px', border: 'none', cursor: 'pointer',
                  fontSize: '0.75rem', fontWeight: 700,
                  background: filter === val ? '#1E293B' : '#F1F5F9',
                  color: filter === val ? '#FFFFFF' : '#64748B',
                  transition: 'all 0.15s ease',
                }}>
                  {label}
                  {val === 'unread' && unreadCount > 0 && (
                    <span style={{ marginLeft: '4px', background: '#EF4444', color: 'white', borderRadius: '999px', padding: '1px 5px', fontSize: '0.65rem' }}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <AnimatePresence mode="popLayout">
                {displayed.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>
                    <Bell size={32} strokeWidth={1} style={{ margin: '0 auto 0.75rem', display: 'block', opacity: 0.3 }} />
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
                    </div>
                  </motion.div>
                ) : (
                  displayed.map(n => <NotificationItem key={n.id} notif={n} onMarkRead={markRead} />)
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(NotificationCenter);
