import React from 'react';

const TabBar = ({ tabs, active, onChange }) => (
  <div className="glass" style={{ 
    display: 'flex', 
    padding: '0.4rem', 
    borderRadius: '1rem', 
    gap: '0.4rem', 
    width: 'fit-content', 
    border: '1px solid var(--border)' 
  }}>
    {tabs.map(t => (
      <button 
        key={t.id} 
        onClick={() => onChange(t.id)}
        style={{
          padding: '0.6rem 1.25rem', 
          borderRadius: '0.75rem', 
          border: 'none', 
          cursor: 'pointer', 
          fontWeight: 700, 
          fontSize: '0.85rem',
          background: active === t.id ? 'var(--accent)' : 'transparent',
          color: active === t.id ? 'white' : 'var(--text-muted)',
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.6rem',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {t.icon} {t.label}
      </button>
    ))}
  </div>
);

export default TabBar;
