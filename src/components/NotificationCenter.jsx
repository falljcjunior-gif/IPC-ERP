import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Package, 
  ShoppingCart, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  X,
  Clock
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';

const NotificationCenter = ({ isOpen, onClose }) => {
  const { notifications, currentUser, navigateTo } = useBusiness();
  
  // Filter notifications by role
  const filteredNotifications = notifications.filter(n => 
    n.targetRole === 'ALL' || 
    n.targetRole === currentUser.role ||
    (currentUser.role === 'SUPER_ADMIN' && (n.targetRole === 'ADMIN' || n.targetRole === 'RH'))
  ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const getIcon = (type) => {
    switch (type) {
      case 'user': return <Users size={18} />;
      case 'stock': return <Package size={18} />;
      case 'sale': return <ShoppingCart size={18} />;
      case 'alert': return <AlertCircle size={18} />;
      default: return <Bell size={18} />;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'user': return '#3B82F6';
      case 'stock': return '#EF4444';
      case 'sale': return '#10B981';
      case 'alert': return '#F59E0B';
      default: return 'var(--accent)';
    }
  };

  const handleAction = (notif) => {
    if (notif.actionApp) {
      navigateTo(notif.actionApp);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000 }} />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="glass"
            style={{ 
              position: 'absolute', top: '70px', right: '100px', width: '350px', 
              maxHeight: '500px', overflowY: 'auto', borderRadius: '1.25rem', padding: '1.5rem', 
              zIndex: 1001, boxShadow: 'var(--shadow-xl)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Notifications</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700, cursor: 'pointer' }}>Tout marquer comme lu</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredNotifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>Aucune notification</div>
              ) : filteredNotifications.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => handleAction(n)}
                  style={{ 
                    display: 'flex', gap: '1rem', padding: '1rem', borderRadius: '1rem', 
                    background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                    cursor: n.actionApp ? 'pointer' : 'default',
                    transition: '0.2s'
                  }}
                >
                  <div style={{ 
                    width: '36px', height: '36px', borderRadius: '10px', background: getColor(n.type) + '15', 
                    color: getColor(n.type), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {getIcon(n.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{n.title}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{n.message}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {n.actionApp && <div style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 700 }}>Agir maintenant →</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer' }}>Voir toutes les notifications</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationCenter;
