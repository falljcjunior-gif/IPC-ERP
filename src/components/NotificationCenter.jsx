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

const NotificationCenter = ({ isOpen, onClose }) => {
  // Real notifications would come from a Firestore collection
  // Mocking based on current state + system triggers
  const notifications = [
    { 
      id: 1, 
      type: 'stock', 
      title: 'Stock Bas', 
      message: 'Le stock de "Serveur Pro GenX" est inférieur à 10 unités.', 
      time: 'Il y a 5 min',
      icon: <Package size={18} />,
      color: '#EF4444'
    },
    { 
      id: 2, 
      type: 'sale', 
      title: 'Nouvelle Commande', 
      message: 'TechnoFrance a validé le devis DEV-001.', 
      time: 'Il y a 20 min',
      icon: <ShoppingCart size={18} />,
      color: '#10B981'
    },
    { 
      id: 3, 
      type: 'user', 
      title: 'Nouvel Utilisateur', 
      message: 'Elena Petrova a rejoint l\'équipe Marketing.', 
      time: 'Il y a 2h',
      icon: <Users size={18} />,
      color: '#3B82F6'
    }
  ];

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
              {notifications.map(n => (
                <div key={n.id} style={{ display: 'flex', gap: '1rem', padding: '1rem', borderRadius: '1rem', background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                  <div style={{ 
                    width: '36px', height: '36px', borderRadius: '10px', background: n.color + '15', 
                    color: n.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {n.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{n.title}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{n.time}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{n.message}</p>
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
