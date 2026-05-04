import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, X, CheckCheck, Trash2, AlertCircle, 
  Info, AlertTriangle, Shield, Clock, ChevronRight,
  Package, FileText, Users, RefreshCw, Calendar
} from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNotificationStore } from '../store/useNotificationStore';
import { useStore } from '../store';

/**
 * 🔔 NEXUS OS: CENTRALIZED NOTIFICATION SIDEBAR (ELITE 2.0)
 * Sophisticated sidebar with cross-module event capture and priority-based alerting.
 */
const NotificationCenter = () => {
  const { 
    notifications, unreadCount, isSidebarOpen, 
    toggleSidebar, markAsRead, markAllAsRead, clearAll, addNotification 
  } = useNotificationStore();
  
  const currentUser = useStore(s => s.currentUser);

  // Sync Firebase Notifications with Zustand Store
  useEffect(() => {
    if (!currentUser?.uid) return;
    const q = query(collection(db, 'notifications_queue'), orderBy('createdAt', 'desc'), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          // Avoid adding existing ones if they are already in store (id check)
          const exists = notifications.some(n => n.remoteId === change.doc.id);
          if (!exists) {
            addNotification({
              remoteId: change.doc.id,
              title: data.type || "Système",
              message: data.message,
              priority: data.priority?.toLowerCase() || 'info',
              module: data.module || 'Cloud',
              metadata: data.metadata
            });
          }
        }
      });
    }, (err) => console.warn('[NotificationSync]', err));
    return () => unsub();
  }, [currentUser?.uid, addNotification]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return '#DC2626';
      case 'warning': return '#D97706';
      default: return 'var(--primary)';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical': return <AlertCircle size={18} />;
      case 'warning': return <AlertTriangle size={18} />;
      default: return <Info size={18} />;
    }
  };

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => toggleSidebar(false)}
            style={{ 
              position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', 
              backdropFilter: 'blur(8px)', zIndex: 10000 
            }}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{ 
              position: 'fixed', right: 0, top: 0, bottom: 0, width: '450px',
              background: 'white', boxShadow: '-30px 0 60px rgba(0,0,0,0.15)',
              zIndex: 10001, display: 'flex', flexDirection: 'column'
            }}
          >
            {/* Header */}
            <div style={{ padding: '2.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.75rem', color: 'var(--text)', letterSpacing: '-0.5px' }}>
                  Commander Events
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                   <div style={{ padding: '0.25rem 0.75rem', borderRadius: '999px', background: 'var(--bg-subtle)', color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 900 }}>
                      {unreadCount} NEW
                   </div>
                   <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border)' }} />
                   <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>System Monitoring Active</span>
                </div>
              </div>
              <button 
                onClick={() => toggleSidebar(false)}
                style={{ width: 44, height: 44, borderRadius: '14px', border: 'none', background: 'var(--bg-subtle)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition)' }}
              >
                <X size={20} color="var(--text)" />
              </button>
            </div>

            {/* Actions Bar */}
            <div style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', background: 'var(--bg-subtle)' }}>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <button 
                  onClick={markAllAsRead}
                  style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <CheckCheck size={14} /> Mark all read
                </button>
                <button 
                  onClick={clearAll}
                  style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Trash2 size={14} /> Clear all
                </button>
              </div>
            </div>

            {/* Notifications Feed */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '6rem 3rem', textAlign: 'center' }}>
                   <div style={{ width: 80, height: 80, borderRadius: '24px', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem auto', border: '1px solid var(--border-light)' }}>
                      <Bell size={32} color="var(--text-muted)" strokeWidth={1.5} />
                   </div>
                   <h4 style={{ fontWeight: 900, color: 'var(--text)', fontSize: '1.2rem', margin: 0 }}>No alerts to display</h4>
                   <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.75rem', lineHeight: 1.5 }}>
                      Your ecosystem is running smoothly. We'll notify you if anything requires your attention.
                   </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {notifications.map((n) => (
                    <motion.div
                      layout
                      key={n.id}
                      onClick={() => !n.isRead && markAsRead(n.id)}
                      style={{ 
                        padding: '1.5rem', borderRadius: '2rem', 
                        background: n.isRead ? 'white' : 'var(--bg-subtle)',
                        border: '1px solid', 
                        borderColor: n.isRead ? 'var(--border)' : `${getPriorityColor(n.priority)}40`,
                        cursor: 'pointer', transition: 'var(--transition)',
                        boxShadow: n.isRead ? 'none' : '0 10px 30px -10px rgba(0,0,0,0.05)',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '1.25rem' }}>
                        <div style={{ 
                          width: 48, height: 48, borderRadius: '16px', background: 'white', 
                          border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: getPriorityColor(n.priority), boxShadow: 'var(--shadow-sm)', flexShrink: 0
                        }}>
                          {getPriorityIcon(n.priority)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {n.title}
                            </span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, lineHeight: 1.5 }}>
                            {n.message}
                          </p>
                          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                             <div style={{ padding: '0.2rem 0.6rem', borderRadius: '6px', background: 'white', border: '1px solid var(--border)', fontSize: '0.65rem', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase' }}>
                                {n.module}
                             </div>
                             {!n.isRead && (
                               <div style={{ width: 8, height: 8, borderRadius: '50%', background: getPriorityColor(n.priority), boxShadow: `0 0 10px ${getPriorityColor(n.priority)}` }} />
                             )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '2rem', borderTop: '1px solid var(--border)', background: 'var(--bg-subtle)', textAlign: 'center' }}>
              <button style={{ width: '100%', padding: '1rem', borderRadius: '1rem', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', boxShadow: 'var(--shadow-accent)' }}>
                View All System Logs
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default React.memo(NotificationCenter);
