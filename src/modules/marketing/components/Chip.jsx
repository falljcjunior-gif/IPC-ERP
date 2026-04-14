import React from 'react';

const Chip = ({ label, color = '#64748B' }) => (
  <span style={{ 
    display: 'inline-flex', 
    alignItems: 'center', 
    padding: '2px 10px', 
    borderRadius: '999px', 
    background: `${color}18`, 
    color, 
    fontSize: '0.72rem', 
    fontWeight: 700 
  }}>
    {label}
  </span>
);

export default Chip;
