import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
// import { Haptics, ImpactStyle } from '@capacitor/haptics'; // Optional: for mobile

/**
 *  NEXUS OS: SMART BUTTON COMPONENT
 * Features:
 * - Double-click protection (Loading state)
 * - Built-in Error & Success visual feedback
 * - Micro-animations via Framer Motion
 * - Haptic feedback support (Capacitor)
 * - Accessible Touch Targets (44x44px min)
 */
const SmartButton = ({ 
  children, 
  onClick, 
  variant = 'primary', // primary, secondary, danger, success, ghost
  type = 'button',
  disabled = false,
  isLoading = false,
  icon: Icon,
  style = {},
  className = '',
  successMessage,
  errorMessage,
  haptic = true,
  ...props 
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  const handleClick = async (e) => {
    if (disabled || isLoading || internalLoading || status !== 'idle') return;
    
    // Trigger Haptics for mobile
    /* try {
      if (haptic && typeof Haptics !== 'undefined') {
        await Haptics.impact({ style: ImpactStyle.Light });
      }
    } catch (e) {} */

    setInternalLoading(true);
    setStatus('loading');

    try {
      await onClick(e);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      console.error('SmartButton Error:', err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    } finally {
      setInternalLoading(false);
    }
  };

  // Variant Styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary': return { background: 'var(--primary)', color: 'white' };
      case 'secondary': return { background: 'var(--bg-subtle)', color: 'var(--text)', border: '1px solid var(--border)' };
      case 'danger': return { background: '#EF4444', color: 'white' };
      case 'success': return { background: '#10B981', color: 'white' };
      case 'ghost': return { background: 'transparent', color: 'var(--text-muted)' };
      default: return {};
    }
  };

  const isActuallyLoading = isLoading || internalLoading;

  return (
    <motion.button
      type={type}
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: (disabled || isActuallyLoading) ? 1 : 1.02 }}
      onClick={handleClick}
      disabled={disabled || isActuallyLoading}
      className={`smart-button ${className}`}
      style={{
        minWidth: '44px',
        minHeight: '44px',
        padding: '0.75rem 1.5rem',
        borderRadius: '1rem',
        fontWeight: 800,
        fontSize: '0.9rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        cursor: (disabled || isActuallyLoading) ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        opacity: (disabled || isActuallyLoading) ? 0.6 : 1,
        ...getVariantStyles(),
        ...style
      }}
      {...props}
    >
      <AnimatePresence mode="wait">
        {status === 'loading' ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <Loader2 className="spinner" size={20} />
          </motion.div>
        ) : status === 'success' ? (
          <motion.div
            key="success"
            initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <CheckCircle2 size={20} /> {successMessage || 'Terminé'}
          </motion.div>
        ) : status === 'error' ? (
          <motion.div
            key="error"
            initial={{ x: 10 }} animate={{ x: 0 }} exit={{ x: -10 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <AlertCircle size={20} /> {errorMessage || 'Erreur'}
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
          >
            {Icon && <Icon size={20} />}
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default SmartButton;
