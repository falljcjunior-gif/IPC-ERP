import React from 'react';
import { IPCStatButton } from './IPCButton';

/**
 * SmartButtons — Barre de stats avec filtres rapides
 * Utilise IPCStatButton du design system IPC unifié
 */
const SmartButtons = ({ buttons = [], activeFilter, onFilterChange }) => {
  if (!buttons || buttons.length === 0) return null;

  return (
    <div style={{ 
      display: 'flex', 
      gap: '0.75rem', 
      flexWrap: 'wrap',
      marginBottom: '1.5rem',
    }}>
      {buttons.map((btn, i) => (
        <IPCStatButton
          key={i}
          icon={btn.icon}
          count={btn.count}
          label={btn.label}
          color={btn.color}
          active={activeFilter === btn.id}
          onClick={() => {
            btn.onClick?.();
            onFilterChange?.(activeFilter === btn.id ? null : btn.id);
          }}
        />
      ))}
    </div>
  );
};

export default SmartButtons;
