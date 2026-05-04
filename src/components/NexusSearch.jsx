import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, X, ArrowRight, Zap, Database, User, Settings, FileText, Banknote, ShieldCheck, MailPlus } from 'lucide-react';
import { useStore } from '../store';
import './NexusSearch.css';

// Move static data outside to prevent re-creation on every render (Fixes re-renders)
const GLOBAL_ACTIONS = [
  { id: 'sales-new', label: 'Créer un nouveau devis', icon: <FileText size={18} strokeWidth={1.5} />, category: 'CRM & Ventes', actionPath: 'sales', tags: ['devis', 'facture', 'nouveau'] },
  { id: 'inv-crit', label: 'Consulter les stocks critiques', icon: <Database size={18} strokeWidth={1.5} />, category: 'Opérations', actionPath: 'inventory', tags: ['stock', 'alerte', 'inventaire'] },
  { id: 'hr-leave', label: 'Valider les congés en attente', icon: <User size={18} strokeWidth={1.5} />, category: 'RH & Collaboration', actionPath: 'hr', tags: ['rh', 'congés', 'validation'] },
  { id: 'fin-dash', label: 'Vue d\'ensemble Trésorerie', icon: <Banknote size={18} strokeWidth={1.5} />, category: 'Finance & Stratégie', actionPath: 'finance', tags: ['finance', 'argent', 'banque'] },
  { id: 'sec-audit', label: 'Matrice des habilitations', icon: <ShieldCheck size={18} strokeWidth={1.5} />, category: 'Configuration', actionPath: 'admin', tags: ['sécurité', 'droits', 'admin'] },
  { id: 'com-msg', label: 'Envoyer un message', icon: <MailPlus size={18} strokeWidth={1.5} />, category: 'Cockpit', actionPath: 'connect', tags: ['chat', 'message', 'collègue'] },
];

const NexusSearch = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  
  const navigateTo = useStore(state => state.navigateTo);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      // Small delay to allow animation before focus
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    if (!query) return GLOBAL_ACTIONS;
    const lowerQuery = query.toLowerCase();
    return GLOBAL_ACTIONS.filter(s => 
      s.label.toLowerCase().includes(lowerQuery) || 
      s.category.toLowerCase().includes(lowerQuery) ||
      s.tags.some(t => t.includes(lowerQuery))
    );
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose(!isOpen);
        return;
      }
      
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < filtered.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          navigateTo(filtered[selectedIndex].actionPath);
          onClose(false);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, filtered, selectedIndex, navigateTo]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="luxe-search-overlay" onClick={() => onClose(false)}>
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, scale: 0.98, filter: 'blur(4px)' }}
            transition={{ type: 'spring', damping: 30, stiffness: 400, mass: 0.8 }}
            className="luxe-search-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="luxe-search-header">
              <Command size={20} className="luxe-search-icon" />
              <input
                ref={inputRef}
                className="luxe-search-input"
                placeholder="What would you like to do?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                spellCheck={false}
              />
              <div className="luxe-kbd">ESC</div>
            </div>

            <div className="luxe-search-results">
              {filtered.map((item, idx) => (
                <div
                  key={item.id}
                  className={`luxe-search-item ${idx === selectedIndex ? 'active' : ''}`}
                  onClick={() => { navigateTo(item.actionPath); onClose(false); }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="luxe-item-icon">{item.icon}</div>
                  <div className="luxe-item-content">
                    <div className="luxe-item-title">{item.label}</div>
                    <div className="luxe-item-subtitle">{item.category}</div>
                  </div>
                  <ArrowRight size={16} className="luxe-item-arrow" />
                  {idx === selectedIndex && (
                    <motion.div layoutId="active-indicator" className="luxe-item-indicator" />
                  )}
                </div>
              ))}
              
              {filtered.length === 0 && (
                <div className="luxe-search-empty">
                  <Search size={24} strokeWidth={1} />
                  <div>Aucune commande trouvée pour "{query}"</div>
                </div>
              )}
            </div>

            <div className="luxe-search-footer">
              <div className="luxe-footer-nav">
                <span><kbd>↑↓</kbd> Naviguer</span>
                <span><kbd>↵</kbd> Ouvrir</span>
              </div>
              <div className="luxe-footer-brand">
                NEXUS OS
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NexusSearch;
