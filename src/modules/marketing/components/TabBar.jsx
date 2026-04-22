import React from 'react';

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ 
    width: '100%',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  }}>
    <div className="glass" style={{ 
      display: 'inline-flex', 
      padding: '0.4rem', 
      borderRadius: '1rem', 
      gap: '0.4rem', 
      minWidth: 'max-content',
      border: '1px solid var(--border)',
      width: '100%',
    }}>
      {tabs.map(t => (
        <button 
          key={t.id} 
          onClick={() => onChange(t.id)}
          style={{
            padding: '0.6rem 1rem', 
            borderRadius: '0.75rem', 
            border: 'none', 
            cursor: 'pointer', 
            fontWeight: 700, 
            fontSize: '0.8rem',
            whiteSpace: 'nowrap',
            background: active === t.id ? 'var(--accent)' : 'transparent',
            color: active === t.id ? 'white' : 'var(--text-muted)',
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            flex: 1,
            justifyContent: 'center',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  </div>
);

export default TabBar;
