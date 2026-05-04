import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useToastStore } from '../store/useToastStore';

const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div style={{
      position: 'fixed',
      top: '2rem',
      right: '2rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      pointerEvents: 'none'
    }}>
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            style={{
              pointerEvents: 'auto',
              minWidth: '300px',
              padding: '1rem 1.25rem',
              borderRadius: '1.25rem',
              background: 'white',
              border: `1px solid ${toast.type === 'error' ? '#FEE2E2' : (toast.type === 'success' ? '#D1FAE5' : '#E0F2FE')}`,
              boxShadow: 'var(--shadow-premium)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: 'var(--text)'
            }}
          >
            <div style={{ 
              color: toast.type === 'error' ? '#EF4444' : (toast.type === 'success' ? '#10B981' : '#0EA5E9') 
            }}>
              {toast.type === 'error' ? <AlertCircle size={20} /> : (toast.type === 'success' ? <CheckCircle size={20} /> : <Info size={20} />)}
            </div>
            <div style={{ flex: 1, fontSize: '0.875rem', fontWeight: 600 }}>
              {toast.message}
            </div>
            <button 
              onClick={() => removeToast(toast.id)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}
            >
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
