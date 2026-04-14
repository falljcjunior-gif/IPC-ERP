import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Layers, X, ChevronDown, Check, Star, Sparkles } from 'lucide-react';
import { groupData } from '../utils/GroupingHelper';

const AdvancedSearch = ({ 
  placeholder = "Rechercher...", 
  filters = [], 
  groups = [], 
  onSearchChange, 
  onFilterChange, 
  onGroupChange,
  initialSearch = ""
}) => {
  const [searchValue, setSearchValue] = useState(initialSearch);
  const [showFilters, setShowFilters] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);

  const [isAiProcessing, setIsAiProcessing] = useState(false);

  useEffect(() => {
    onSearchChange?.(searchValue);
    
    // AI Smart Filter Detection
    if (searchValue.length > 2) {
      const detectFilters = () => {
        let found = false;
        let newSearchValue = searchValue;

        // Try to match filters
        filters.forEach(f => {
          if (f?.label && searchValue?.toLowerCase().includes(f.label.toLowerCase()) && !activeFilters.includes(f.id)) {
            toggleFilter(f);
            newSearchValue = newSearchValue.replace(new RegExp(f.label, 'gi'), '').trim();
            found = true;
          }
        });

        // Try to match groups
        groups.forEach(g => {
          if (g?.label && searchValue?.toLowerCase().includes(g.label.toLowerCase()) && activeGroup !== g.id) {
            selectGroup(g);
            newSearchValue = newSearchValue.replace(new RegExp(g.label, 'gi'), '').trim();
            found = true;
          }
        });

        if (found) {
          setSearchValue(newSearchValue);
          setIsAiProcessing(true);
          setTimeout(() => setIsAiProcessing(false), 2000);
        }
      };

      const timer = setTimeout(detectFilters, 500);
      return () => clearTimeout(timer);
    }
  }, [searchValue]);

  const toggleFilter = (f) => {
    const newFilters = activeFilters.includes(f.id)
      ? activeFilters.filter(id => id !== f.id)
      : [...activeFilters, f.id];
    setActiveFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const selectGroup = (g) => {
    const newGroup = activeGroup === g.id ? null : g.id;
    setActiveGroup(newGroup);
    onGroupChange?.(newGroup);
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '800px', zIndex: 10 }}>
      <div className="glass" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '0.4rem 0.8rem', 
        borderRadius: '1rem', 
        border: '1px solid var(--border)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(12px)'
      }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={18} color="var(--text-muted)" style={{ marginLeft: '0.5rem' }} />
          {isAiProcessing && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              style={{ position: 'absolute', top: -10, left: -10 }}
            >
              <Sparkles size={16} color="var(--accent)" />
            </motion.div>
          )}
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '0.25rem 0.75rem' }}>
          {/* Active Filter Chips */}
          {activeFilters.map(fid => {
            const f = filters.find(x => x.id === fid);
            return (
              <motion.span 
                initial={{ scale: 0.8, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                key={fid} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  background: 'var(--accent)', 
                  color: 'white', 
                  padding: '2px 8px', 
                  borderRadius: '6px', 
                  fontSize: '0.75rem', 
                  fontWeight: 600 
                }}
              >
                {f?.label}
                <X size={12} style={{ cursor: 'pointer' }} onClick={() => toggleFilter(f)} />
              </motion.span>
            );
          })}

          {/* Group Chip */}
          {activeGroup && (
            <motion.span 
              initial={{ scale: 0.8, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px', 
                background: '#8B5CF6', 
                color: 'white', 
                padding: '2px 8px', 
                borderRadius: '6px', 
                fontSize: '0.75rem', 
                fontWeight: 600 
              }}
            >
              <Layers size={10} /> {groups.find(g => g.id === activeGroup)?.label}
              <X size={12} style={{ cursor: 'pointer' }} onClick={() => selectGroup({id: activeGroup})} />
            </motion.span>
          )}

          <input 
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={activeFilters.length > 0 || activeGroup ? "" : placeholder}
            style={{ 
              flex: 1, 
              border: 'none', 
              background: 'none', 
              outline: 'none', 
              padding: '0.5rem 0', 
              fontSize: '0.9rem',
              color: 'var(--text)',
              minWidth: '150px'
            }} 
          />
        </div>

        <div style={{ display: 'flex', gap: '4px', borderLeft: '1px solid var(--border)', paddingLeft: '8px' }}>
          {/* Filter Dropdown Toggle */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => { setShowFilters(!showFilters); setShowGroups(false); }}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px', 
                padding: '0.4rem 0.75rem', 
                borderRadius: '0.6rem', 
                border: 'none', 
                background: showFilters ? 'var(--bg-subtle)' : 'transparent',
                color: activeFilters.length > 0 ? 'var(--accent)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.8rem'
              }}
            >
              <Filter size={15} /> Filtres <ChevronDown size={12} />
            </button>
            
            <AnimatePresence>
              {showFilters && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  style={{ 
                    position: 'absolute', 
                    top: '120%', 
                    right: 0, 
                    width: '200px', 
                    background: 'var(--bg)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '0.75rem', 
                    padding: '0.5rem', 
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                    zIndex: 100
                  }}
                >
                   {filters.map(f => (
                     <div 
                      key={f.id} 
                      onClick={() => toggleFilter(f)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '0.6rem 0.75rem', 
                        borderRadius: '0.5rem', 
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        transition: 'background 0.2s',
                        background: activeFilters.includes(f.id) ? 'var(--bg-subtle)' : 'transparent'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-subtle)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = activeFilters.includes(f.id) ? 'var(--bg-subtle)' : 'transparent'}
                     >
                       {f.label}
                       {activeFilters.includes(f.id) && <Check size={14} color="var(--accent)" />}
                     </div>
                   ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Group Dropdown Toggle */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => { setShowGroups(!showGroups); setShowFilters(false); }}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px', 
                padding: '0.4rem 0.75rem', 
                borderRadius: '0.6rem', 
                border: 'none', 
                background: showGroups ? 'var(--bg-subtle)' : 'transparent',
                color: activeGroup ? '#8B5CF6' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.8rem'
              }}
            >
              <Layers size={15} /> Regrouper <ChevronDown size={12} />
            </button>

            <AnimatePresence>
              {showGroups && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  style={{ 
                    position: 'absolute', 
                    top: '120%', 
                    right: 0, 
                    width: '200px', 
                    background: 'var(--bg)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '0.75rem', 
                    padding: '0.5rem', 
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                    zIndex: 100
                  }}
                >
                   {groups.map(g => (
                     <div 
                      key={g.id} 
                      onClick={() => selectGroup(g)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '0.6rem 0.75rem', 
                        borderRadius: '0.5rem', 
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        transition: 'background 0.2s',
                        background: activeGroup === g.id ? 'var(--bg-subtle)' : 'transparent'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-subtle)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = activeGroup === g.id ? 'var(--bg-subtle)' : 'transparent'}
                     >
                       {g.label}
                       {activeGroup === g.id && <Check size={14} color="#8B5CF6" />}
                     </div>
                   ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <button style={{ 
            padding: '0.4rem', 
            borderRadius: '0.6rem', 
            border: 'none', 
            background: 'transparent', 
            color: 'var(--text-muted)', 
            cursor: 'pointer' 
          }}>
            <Star size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearch;
