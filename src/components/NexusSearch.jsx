import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, X, ArrowRight, Zap, Database, User, Settings, FileText, Banknote, ShieldCheck, MailPlus } from 'lucide-react';
import { useStore } from '../store';
import './NexusSearch.css';

const NexusSearch = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  
  const navigateTo = useStore(state => state.navigateTo);
  const user = useStore(state => state.user);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const globalActions = [
    { id: 'sales-new', label: 'Créer un nouveau devis', icon: <FileText size={18} />, category: 'CRM & Ventes', action: () => navigateTo('sales'), tags: ['devis', 'facture', 'nouveau'] },
    { id: 'inv-crit', label: 'Consulter les stocks critiques', icon: <Database size={18} />, category: 'Opérations', action: () => navigateTo('inventory'), tags: ['stock', 'alerte', 'inventaire'] },
    { id: 'hr-leave', label: 'Valider les congés en attente', icon: <User size={18} />, category: 'RH & Collaboration', action: () => navigateTo('hr'), tags: ['rh', 'congés', 'validation'] },
    { id: 'fin-dash', label: 'Vue d\'ensemble Trésorerie', icon: <Banknote size={18} />, category: 'Finance & Stratégie', action: () => navigateTo('finance'), tags: ['finance', 'argent', 'banque'] },
    { id: 'sec-audit', label: 'Matrice des habilitations', icon: <ShieldCheck size={18} />, category: 'Configuration', action: () => navigateTo('admin'), tags: ['sécurité', 'droits', 'admin'] },
    { id: 'com-msg', label: 'Envoyer un message', icon: <MailPlus size={18} />, category: 'Cockpit', action: () => navigateTo('connect'), tags: ['chat', 'message', 'collègue'] },
  ];

  const filtered = query 
    ? globalActions.filter(s => 
        s.label.toLowerCase().includes(query.toLowerCase()) || 
        s.category.toLowerCase().includes(query.toLowerCase()) ||
        s.tags.some(t => t.includes(query.toLowerCase()))
      )
    : globalActions;

  // Keydown handler for navigation
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
          filtered[selectedIndex].action();
          onClose(false);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, filtered, selectedIndex]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="nexus-overlay">
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="nexus-container"
          >
            <div className="nexus-header">
              <Command size={22} color="#38bdf8" />
              <input
                ref={inputRef}
                className="nexus-input"
                placeholder="Nexus Command Center... (Demandez ce que vous voulez)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="nexus-kbd">ESC</div>
            </div>

            <div className="nexus-results">
              {/* Future Integration: Si l'utilisateur tape "CA", afficher un widget financier */}
              {query.toLowerCase() === 'ca' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  className="nexus-widget-container"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Chiffre d'Affaires Mensuel</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#38bdf8' }}>45 250 000 FCFA</div>
                    </div>
                    <div style={{ padding: '0.5rem 1rem', background: 'rgba(34, 197, 94, 0.1)', color: '#4ade80', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: 600 }}>
                      +12.5% vs M-1
                    </div>
                  </div>
                </motion.div>
              )}

              {filtered.map((item, idx) => (
                <div
                  key={item.id}
                  className={`nexus-item ${idx === selectedIndex ? 'active' : ''}`}
                  onClick={() => { item.action(); onClose(false); }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="nexus-item-icon">{item.icon}</div>
                  <div className="nexus-item-content">
                    <div className="nexus-item-title">{item.label}</div>
                    <div className="nexus-item-subtitle">{item.category}</div>
                  </div>
                  <ArrowRight size={16} className="nexus-item-arrow" />
                </div>
              ))}
              
              {filtered.length === 0 && query.toLowerCase() !== 'ca' && (
                <div style={{ padding: '3rem 2rem', textAlign: 'center', color: '#64748b' }}>
                  <Search size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <div>Aucune commande trouvée pour "{query}"</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.7 }}>Essayez des mots-clés comme "devis", "rh", ou "stock".</div>
                </div>
              )}
            </div>

            <div className="nexus-footer">
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#64748b' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><kbd className="nexus-kbd" style={{ padding: '0.1rem 0.3rem' }}>↑↓</kbd> Naviguer</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><kbd className="nexus-kbd" style={{ padding: '0.1rem 0.3rem' }}>↵</kbd> Ouvrir</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', letterSpacing: '1px' }}>
                <Zap size={14} fill="#38bdf8" /> NEXUS OS
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NexusSearch;
