import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Plus } from 'lucide-react';

const RecordModal = ({ isOpen, onClose, onSave, title, fields, isLoading = false, children }) => {
  const [formData, setFormData] = useState({});

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;
    onSave(formData);
    setFormData({});
    // We don't close immediately here if we want to show a success message in children
    // The parent component should handle closing
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '2rem'
        }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(8px)'
            }}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="glass"
            style={{
              width: '100%',
              maxHeight: '100%',
              overflowY: 'auto',
              maxWidth: '600px',
              borderRadius: '2rem',
              position: 'relative',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              padding: '2.5rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{title}</h2>
              <button 
                onClick={onClose}
                disabled={isLoading}
                style={{ background: 'transparent', border: 'none', cursor: isLoading ? 'default' : 'pointer', color: 'var(--text-muted)', opacity: isLoading ? 0.5 : 1 }}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                {fields.map(field => (
                  <div key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {field.label}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        value={formData[field.name] || ''}
                        required={field.required}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: '0.75rem',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-subtle)',
                          color: 'var(--text)',
                          outline: 'none'
                        }}
                      >
                        <option value="">Sélectionner...</option>
                        {field.options.map(opt => {
                          const value = typeof opt === 'object' ? opt.value : opt;
                          const label = typeof opt === 'object' ? opt.label : opt;
                          return <option key={value} value={value}>{label}</option>;
                        })}
                      </select>
                    ) : (
                      <input
                        value={formData[field.name] || ''}
                        type={field.type || 'text'}
                        required={field.required}
                        placeholder={field.placeholder}
                        onChange={(e) => handleChange(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                        style={{
                          padding: '0.75rem 1rem',
                          borderRadius: '0.75rem',
                          border: '1px solid var(--border)',
                          background: 'var(--bg-subtle)',
                          color: 'var(--text)',
                          outline: 'none'
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
                   <button 
                  type="button" 
                  onClick={onClose}
                  disabled={isLoading}
                  style={{ 
                    flex: 1, 
                    padding: '1rem', 
                    borderRadius: '1rem', 
                    border: '1px solid var(--border)', 
                    background: 'transparent', 
                    color: 'var(--text)', 
                    fontWeight: 600, 
                    cursor: isLoading ? 'default' : 'pointer',
                    opacity: isLoading ? 0.5 : 1
                  }}
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={isLoading}
                  style={{ 
                    flex: 2, 
                    padding: '1rem', 
                    borderRadius: '1rem', 
                    border: 'none', 
                    background: 'var(--accent)', 
                    color: 'white', 
                    fontWeight: 700, 
                    cursor: isLoading ? 'default' : 'pointer',
                    opacity: isLoading ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      style={{ width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }}
                    />
                  ) : (
                    <>
                      <Save size={20} /> Enregistrer
                    </>
                  )}
                </button>
              </div>
              {children}
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RecordModal;
