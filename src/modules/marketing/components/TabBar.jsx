import React from 'react';
import { motion } from 'framer-motion';

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ 
    width: '100%',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    padding: '4px'
  }}>
    <div className="glass" style={{ 
      display: 'inline-flex', 
      padding: '0.4rem', 
      borderRadius: '1.25rem', 
      gap: '0.25rem', 
      minWidth: 'max-content',
      border: '1px solid var(--border)',
      width: '100%',
      position: 'relative',
      background: 'var(--glass-bg)'
    }}>
      {tabs.map(t => (
        <button 
          key={t.id} 
          onClick={() => onChange(t.id)}
          style={{
            padding: '0.75rem 1.25rem', 
            borderRadius: '1rem', 
            border: 'none', 
            cursor: 'pointer', 
            fontWeight: 800, 
            fontSize: '0.85rem',
            whiteSpace: 'nowrap',
            background: 'transparent',
            color: active === t.id ? 'white' : 'var(--text-muted)',
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.6rem',
            flex: 1,
            justifyContent: 'center',
            transition: 'color 0.3s ease',
            position: 'relative',
            zIndex: 1
          }}
        >
          {active === t.id && (
            <motion.div
              layoutId="activeTab"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'var(--accent)',
                borderRadius: '0.9rem',
                zIndex: -1,
                boxShadow: '0 4px 15px var(--accent-glow)'
              }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {t.icon}
            {t.label}
          </span>
        </button>
      ))}
    </div>
  </div>
);

export default TabBar;
