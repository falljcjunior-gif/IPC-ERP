import React from 'react';
import { motion } from 'framer-motion';

const RadialHealthIndicator = ({ 
  score = 0, 
  color = "#10b981", 
  size = 120, 
  strokeWidth = 12,
  icon: Icon
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Background Circle */}
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`${color}20`}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Animated Progress Circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          style={{
            filter: `drop-shadow(0 0 8px ${color}60)`
          }}
        />
      </svg>
      
      {/* Center Content */}
      <div style={{ 
        position: 'absolute', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.9)',
        width: size - strokeWidth * 2 - 10,
        height: size - strokeWidth * 2 - 10,
        borderRadius: '50%',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05), 0 2px 10px rgba(0,0,0,0.05)'
      }}>
        {Icon && <Icon size={20} color={color} style={{ marginBottom: '-2px' }} />}
        <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.05em' }}>
          {score}
        </span>
      </div>
    </div>
  );
};

export default RadialHealthIndicator;
