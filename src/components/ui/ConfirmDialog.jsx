/**
 * ConfirmDialog — Modal de confirmation avant actions destructives
 *
 * Usage :
 *   <ConfirmDialog
 *     isOpen={showConfirm}
 *     title="Supprimer cet employé ?"
 *     message="Cette action est irréversible."
 *     confirmLabel="Supprimer"
 *     onConfirm={handleDelete}
 *     onCancel={() => setShowConfirm(false)}
 *     danger
 *   />
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  title = 'Confirmer cette action ?',
  message = 'Cette action est irréversible.',
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel,
  danger = false,
  loading = false,
}) {
  if (!isOpen) return null;

  const accentColor = danger ? '#EF4444' : 'var(--accent)';
  const Icon = danger ? Trash2 : AlertTriangle;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(8px)',
        }}
        onClick={e => e.target === e.currentTarget && onCancel()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 16 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '1.25rem',
            padding: '2rem',
            width: '100%',
            maxWidth: 420,
            boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
          }}
        >
          {/* Icon + Title */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: '0.75rem',
              background: accentColor + '18',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon size={20} style={{ color: accentColor }} />
            </div>
            <div style={{ flex: 1 }}>
              <div
                id="confirm-dialog-title"
                style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)', marginBottom: '0.35rem' }}
              >
                {title}
              </div>
              <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {message}
              </div>
            </div>
            <button
              aria-label="Fermer"
              onClick={onCancel}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: 4,
                borderRadius: '0.4rem',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button
              onClick={onCancel}
              disabled={loading}
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: '0.6rem',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              style={{
                padding: '0.55rem 1.5rem',
                borderRadius: '0.6rem',
                border: 'none',
                background: accentColor,
                color: 'white',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              {loading && (
                <span style={{
                  width: 14, height: 14, border: '2px solid white', borderTopColor: 'transparent',
                  borderRadius: '50%', display: 'inline-block',
                  animation: 'spin 0.7s linear infinite',
                }} />
              )}
              {confirmLabel}
            </button>
          </div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
