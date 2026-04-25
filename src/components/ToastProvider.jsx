import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 5000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        pointerEvents: 'none'
      }}>
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const icons = {
    success: <CheckCircle size={18} color="#10B981" />,
    error: <AlertCircle size={18} color="#EF4444" />,
    info: <Info size={18} color="#3B82F6" />
  };

  const colors = {
    success: 'rgba(16, 185, 129, 0.1)',
    error: 'rgba(239, 68, 68, 0.1)',
    info: 'rgba(59, 130, 246, 0.1)'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, x: 20 }}
      layout
      style={{
        background: 'var(--bg)',
        border: `1px solid var(--border)`,
        padding: '0.75rem 1rem',
        borderRadius: '1rem',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.8rem',
        minWidth: '280px',
        maxWidth: '400px',
        pointerEvents: 'auto',
        backdropFilter: 'blur(10px)',
        borderLeft: `4px solid ${toast.type === 'success' ? '#10B981' : toast.type === 'error' ? '#EF4444' : '#3B82F6'}`
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px',
        borderRadius: '8px',
        background: colors[toast.type]
      }}>
        {icons[toast.type]}
      </div>
      <div style={{ flex: 1, fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>
        {toast.message}
      </div>
      <button 
        onClick={() => onRemove(toast.id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, color: 'var(--text)' }}
      >
        <X size={16} />
      </button>
    </motion.div>
  );
};
