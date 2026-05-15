import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, ArrowRight, X, Info, GitPullRequest, 
  Check, Clock, Zap, AlertCircle 
} from 'lucide-react';
import { useStore } from '../store';
import SmartButton from './SmartButton';
import { useToastStore } from '../store/useToastStore';
import { debugInteraction } from '../utils/InteractionAuditor';

/**
 *  NEXUS OS: WORKFLOW & BPM ASSISTANT
 * Handles system hints, AI insights, and critical business process approvals.
 */
const WorkflowAssistant = () => {
  const { hints = [], dismissHint, navigateTo } = useStore();
  const { addToast } = useToastStore();

  // Local state for simulated BPM Approvals to make them "active"
  const [bpmItems, setBpmItems] = useState([]);

  const handleBpmAction = async (id, action) => {
    await debugInteraction(`BPM ${action}: ${id}`, async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setBpmItems(prev => prev.filter(item => item.id !== id));
      addToast(
        action === 'approve' 
          ? 'Workflow approuvé avec succès' 
          : 'Workflow refusé et archivé', 
        action === 'approve' ? 'success' : 'error'
      );
    });
  };

  const allItems = [...bpmItems, ...hints];

  if (allItems.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000,
      display: 'flex', flexDirection: 'column', gap: '1rem',
      maxWidth: '400px', width: '100%'
    }}>
      <AnimatePresence mode="popLayout">
        {allItems.map((item) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className="glass"
            style={{
              padding: '1.5rem', borderRadius: '2rem', background: 'white',
              border: item.type === 'BPM' ? '2px solid var(--primary)' : '1px solid var(--border)',
              boxShadow: 'var(--shadow-premium)', display: 'flex', flexDirection: 'column',
              gap: '1rem', position: 'relative', overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ 
                  background: item.type === 'BPM' ? 'var(--primary)' : (item.type === 'info' ? 'var(--primary)15' : 'rgba(16, 185, 129, 0.1)'), 
                  color: item.type === 'BPM' ? 'white' : 'var(--primary)', 
                  padding: '0.6rem', borderRadius: '14px', boxShadow: item.type === 'BPM' ? '0 4px 12px rgba(15, 23, 42, 0.2)' : 'none'
                }}>
                  {item.type === 'BPM' ? <GitPullRequest size={20} /> : (item.type === 'info' ? <Info size={18} /> : <Sparkles size={18} />)}
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 900, margin: 0, color: 'var(--text)' }}>{item.title}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
                       Module {item.appId}
                    </span>
                    {item.deadline && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', color: '#EF4444', fontWeight: 900 }}>
                        <Clock size={12} /> {item.deadline}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => item.type === 'BPM' ? setBpmItems(prev => prev.filter(i => i.id !== item.id)) : dismissHint(item.id)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Message */}
            <div style={{ fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.5, fontWeight: 500 }}>
              {item.message}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              {item.type === 'BPM' ? (
                <>
                  <SmartButton 
                    onClick={() => handleBpmAction(item.id, 'approve')}
                    variant="primary"
                    style={{ flex: 1, borderRadius: '1rem' }}
                    successMessage="Approuvé"
                  >
                    <Check size={16} /> Approuver
                  </SmartButton>
                  <SmartButton 
                    onClick={() => handleBpmAction(item.id, 'deny')}
                    variant="secondary"
                    style={{ flex: 1, borderRadius: '1rem', border: '1px solid #EF4444', color: '#EF4444' }}
                    successMessage="Refusé"
                  >
                    Refuser
                  </SmartButton>
                </>
              ) : (
                item.actionLabel && (
                  <button 
                    onClick={() => {
                      item.onAction?.();
                      if (item.redirectTo) navigateTo(item.redirectTo);
                      dismissHint(item.id);
                    }}
                    className="btn btn-primary"
                    style={{ 
                      flex: 1, padding: '0.75rem', borderRadius: '1rem', fontWeight: 800, fontSize: '0.85rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                    }}
                  >
                    {item.actionLabel} <ArrowRight size={16} />
                  </button>
                )
              )}
            </div>

            {/* SLA Badge */}
            {item.type === 'BPM' && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'var(--border-light)' }}>
                 <motion.div 
                    initial={{ width: '100%' }} animate={{ width: '0%' }} transition={{ duration: 7200, ease: 'linear' }}
                    style={{ height: '100%', background: '#EF4444' }} 
                 />
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default WorkflowAssistant;
