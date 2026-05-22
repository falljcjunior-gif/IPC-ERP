import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './CommandPalette.css';
import { Search, ArrowRight, LayoutDashboard, Settings, LogOut, ChevronRight } from 'lucide-react';

const EASE = [0.16, 1, 0.3, 1];

const QUICK_ACTIONS = [
  { id: '_logout', label: 'Se déconnecter', hint: 'Fermer la session', icon: LogOut, type: 'action' },
  { id: '_settings', label: 'Paramètres', hint: 'Préférences utilisateur', icon: Settings, type: 'action' },
];

export default function CommandPalette({ isOpen, onClose, appsPool, onNavigate, onAction }) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Flatten all navigation items from the registry pool
  const allModules = useMemo(() => {
    if (!appsPool) return [];
    return appsPool.flatMap(cat =>
      (cat.items || [])
        .filter(item => !item.hidden)
        .map(item => ({ ...item, category: cat.label, type: 'navigate' }))
    );
  }, [appsPool]);

  const allItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = allModules.filter(m =>
      !q ||
      m.label?.toLowerCase().includes(q) ||
      m.id?.toLowerCase().includes(q) ||
      m.category?.toLowerCase().includes(q)
    );
    const actions = QUICK_ACTIONS.filter(a =>
      !q || a.label.toLowerCase().includes(q) || a.hint.toLowerCase().includes(q)
    );
    return [...filtered, ...actions];
  }, [query, allModules]);

  // Group items for display
  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const navItems = allItems.filter(i => i.type === 'navigate');
    const actionItems = allItems.filter(i => i.type === 'action');
    const sections = [];
    if (navItems.length) sections.push({ label: q ? 'Modules' : 'Navigation', items: navItems });
    if (actionItems.length) sections.push({ label: 'Actions', items: actionItems });
    return sections;
  }, [allItems, query]);

  // Flat list for keyboard navigation
  const flatItems = useMemo(() => allItems, [allItems]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleSelect = useCallback((item) => {
    if (item.type === 'navigate') {
      onNavigate?.(item.id);
    } else if (item.type === 'action') {
      onAction?.(item.id);
    }
    onClose();
  }, [onNavigate, onAction, onClose]);

  useEffect(() => {
    const handleKey = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(i => Math.min(i + 1, flatItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatItems[activeIndex]) handleSelect(flatItems[activeIndex]);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, flatItems, activeIndex, handleSelect, onClose]);

  // Scroll active item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.querySelector('.erp-cmd-item.active');
    if (active) active.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  let flatIndex = 0;

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="erp-cmd-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          className="erp-cmd-panel"
          initial={{ opacity: 0, scale: 0.96, y: -12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -8 }}
          transition={{ duration: 0.2, ease: EASE }}
        >
          {/* Input */}
          <div className="erp-cmd-input-wrap">
            <Search size={17} color="#64748B" style={{ flexShrink: 0 }} />
            <input
              ref={inputRef}
              className="erp-cmd-input"
              placeholder="Rechercher un module, une action..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <ChevronRight size={14} style={{ transform: 'rotate(45deg)' }} />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="erp-cmd-results" ref={listRef}>
            {flatItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#475569', fontSize: '0.875rem' }}>
                Aucun résultat pour &ldquo;{query}&rdquo;
              </div>
            ) : (
              grouped.map((section) => (
                <div key={section.label}>
                  <div className="erp-cmd-section-label">{section.label}</div>
                  {section.items.map((item) => {
                    const myIndex = flatIndex++;
                    const isActive = myIndex === activeIndex;
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id}
                        className={`erp-cmd-item${isActive ? ' active' : ''}`}
                        onMouseEnter={() => setActiveIndex(myIndex)}
                        onMouseDown={() => handleSelect(item)}
                      >
                        <div className="erp-cmd-item-icon">
                          {Icon
                            ? <Icon size={15} />
                            : item.icon && React.cloneElement(item.icon, { size: 15 })}
                        </div>
                        <span className="erp-cmd-item-label">{item.label}</span>
                        {item.category && item.type === 'navigate' && (
                          <span className="erp-cmd-item-hint">{item.category}</span>
                        )}
                        {item.hint && (
                          <span className="erp-cmd-item-hint">{item.hint}</span>
                        )}
                        {isActive && <ArrowRight size={13} style={{ color: '#10B981', flexShrink: 0 }} />}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer hints */}
          <div className="erp-cmd-footer">
            <span className="erp-cmd-kbd"><kbd>↑</kbd><kbd>↓</kbd> Naviguer</span>
            <span className="erp-cmd-kbd"><kbd>↵</kbd> Ouvrir</span>
            <span className="erp-cmd-kbd"><kbd>Esc</kbd> Fermer</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
