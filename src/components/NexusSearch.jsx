import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, X, ArrowRight, Zap, Database, User, Settings } from 'lucide-react';
import { useStore } from '../store';

const NexusSearch = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigateTo = useStore(state => state.navigateTo);
  const data = useStore(state => state.data);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose(!isOpen);
      }
      if (e.key === 'Escape') onClose(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const suggestions = [
    { id: '1', label: 'Créer un nouveau devis', icon: <Zap size={16} />, category: 'Actions', action: () => navigateTo('sales') },
    { id: '2', label: 'Consulter les stocks critiques', icon: <Database size={16} />, category: 'Inventaire', action: () => navigateTo('inventory') },
    { id: '3', label: 'Gestion des accès employés', icon: <User size={16} />, category: 'RH', action: () => navigateTo('hr') },
    { id: '4', label: 'Paramètres du système Nexus', icon: <Settings size={16} />, category: 'Système', action: () => navigateTo('admin') },
  ];

  const filtered = query 
    ? suggestions.filter(s => s.label.toLowerCase().includes(query.toLowerCase()))
    : suggestions;

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '10vh' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onClose(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)' }}
          />
          
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            style={{
              width: '100%',
              maxWidth: '640px',
              background: 'var(--nexus-card)',
              borderRadius: '1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              border: '1px solid var(--nexus-border)',
              overflow: 'hidden',
              position: 'relative',
              zIndex: 10000
            }}
          >
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--nexus-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Command size={20} className="nexus-gradient-text" />
              <input
                autoFocus
                placeholder="Nexus Command Center... (Tapez pour chercher)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: '1.1rem',
                  color: 'var(--nexus-text)',
                  fontWeight: 500
                }}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--nexus-text-muted)', background: 'var(--bg-subtle)', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                ESC
              </div>
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '0.5rem' }}>
              {filtered.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => { item.action(); onClose(false); }}
                  style={{
                    padding: '0.875rem 1rem',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    cursor: 'pointer',
                    transition: 'var(--transition-nexus)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-subtle)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ color: 'var(--nexus-primary)' }}>{item.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--nexus-text)' }}>{item.label}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--nexus-text-muted)' }}>{item.category}</div>
                  </div>
                  <ArrowRight size={14} style={{ opacity: 0.3 }} />
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--nexus-text-muted)' }}>
                  Aucun résultat pour "{query}"
                </div>
              )}
            </div>

            <div style={{ padding: '0.75rem 1.25rem', background: 'var(--bg-subtle)', borderTop: '1px solid var(--nexus-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--nexus-text-muted)' }}>
                <span><kbd>↑↓</kbd> Naviguer</span>
                <span><kbd>↵</kbd> Sélectionner</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: 700, opacity: 0.6 }}>
                <Zap size={12} fill="var(--nexus-primary)" stroke="none" /> NEXUS OS
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NexusSearch;
