import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, X, Info } from 'lucide-react';
import { useStore } from '../store';

const WorkflowAssistant = () => {
  const { hints, dismissHint, navigateTo } = useStore();

  if (hints.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      maxWidth: '380px',
      width: '100%'
    }}>
      <AnimatePresence>
        {hints.map((hint) => (
          <motion.div
            key={hint.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className="glass"
            style={{
              padding: '1.25rem',
              borderRadius: '1.25rem',
              border: '1px solid var(--border)',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Background sparkle effect */}
            <div style={{ 
              position: 'absolute', 
              top: '-10px', 
              left: '-10px', 
              opacity: 0.05, 
              color: 'var(--accent)' 
            }}>
              <Sparkles size={100} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ 
                  background: hint.type === 'info' ? 'var(--primary)15' : 'var(--accent)15', 
                  color: hint.type === 'info' ? 'var(--primary)' : 'var(--accent)', 
                  padding: '0.5rem', 
                  borderRadius: '0.75rem' 
                }}>
                  {hint.type === 'info' ? <Info size={18} /> : <Sparkles size={18} />}
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>{hint.title}</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', fontWeight: 600 }}>
                    Module {hint.appId}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => dismissHint(hint.id)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
              {hint.message}
            </div>

            {hint.actionLabel && (
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button 
                  onClick={() => {
                    hint.onAction();
                    if (hint.redirectTo) navigateTo(hint.redirectTo);
                    dismissHint(hint.id);
                  }}
                  className="btn btn-primary"
                  style={{ 
                    flex: 1, 
                    padding: '0.6rem', 
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {hint.actionLabel} <ArrowRight size={14} />
                </button>
                <button 
                   onClick={() => dismissHint(hint.id)}
                   style={{ 
                     background: 'var(--bg-subtle)', 
                     border: '1px solid var(--border)', 
                     borderRadius: '0.75rem',
                     padding: '0.6rem 1rem',
                     fontSize: '0.85rem',
                     fontWeight: 600,
                     cursor: 'pointer'
                   }}
                >
                  Plus tard
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default WorkflowAssistant;
