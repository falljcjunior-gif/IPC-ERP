import React from 'react';
import { LayoutList, LayoutGrid, Calendar as CalIcon, Filter, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const ViewSwitcher = ({ currentView, onViewChange, availableViews = ['list', 'kanban'] }) => {
  const viewIcons = {
    list: <LayoutList size={16} />,
    kanban: <LayoutGrid size={16} />,
    calendar: <CalIcon size={16} />
  };

  const viewLabels = {
    list: 'Liste',
    kanban: 'Vue Kanban',
    calendar: 'Calendrier'
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.5rem', 
      background: 'var(--bg-subtle)', 
      padding: '0.35rem', 
      borderRadius: '0.9rem',
      border: '1px solid var(--border)',
      width: 'fit-content'
    }}>
      {availableViews.map(view => (
        <button
          key={view}
          onClick={() => onViewChange(view)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0.45rem 0.9rem',
            borderRadius: '0.65rem',
            border: 'none',
            background: currentView === view ? 'var(--bg)' : 'transparent',
            color: currentView === view ? 'var(--accent)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 700,
            transition: 'all 0.2s',
            boxShadow: currentView === view ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
          }}
        >
          {viewIcons[view]}
          <span style={{ display: 'none', sm: 'inline' }}>{viewLabels[view]}</span>
        </button>
      ))}
    </div>
  );
};

export default ViewSwitcher;
