import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

const SmartButtons = ({ buttons = [] }) => {
  if (!buttons || buttons.length === 0) return null;

  return (
    <div style={{ 
      display: 'flex', 
      gap: '1px', 
      background: 'var(--border)', 
      border: '1px solid var(--border)',
      borderRadius: '0.75rem', 
      overflow: 'hidden',
      marginBottom: '1.5rem',
      width: 'fit-content'
    }}>
      {buttons.map((btn, i) => (
        <motion.button
          key={i}
          whileHover={{ background: 'var(--bg-subtle)' }}
          whileTap={{ scale: 0.98 }}
          onClick={btn.onClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.6rem 1.25rem',
            background: 'var(--bg)',
            border: 'none',
            cursor: 'pointer',
            minWidth: '120px',
            textAlign: 'left',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ 
            color: 'var(--accent)', 
            background: 'var(--bg-subtle)', 
            padding: '8px', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {btn.icon}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>
              {btn.count || 0}
            </span>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {btn.label}
            </span>
          </div>
          <ChevronRight size={14} color="var(--border)" style={{ marginLeft: 'auto' }} />
        </motion.button>
      ))}
    </div>
  );
};

export default SmartButtons;
