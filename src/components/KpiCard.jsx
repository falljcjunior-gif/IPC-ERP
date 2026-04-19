import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area } from 'recharts';
import SafeResponsiveChart from './charts/SafeResponsiveChart';

const KpiCard = ({ title, value, trend, trendType, icon, color, sparklineData, onDrillDown }) => {
  const isPositive = trendType === 'up';

  return (
    <motion.div
      onClick={onDrillDown}
      whileHover={{ y: -5, scale: onDrillDown ? 1.02 : 1, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
      className="glass"
      style={{
        padding: '1.75rem',
        borderRadius: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        minWidth: '240px',
        position: 'relative',
        overflow: 'hidden',
        cursor: onDrillDown ? 'pointer' : 'default',
        border: onDrillDown ? '1px solid transparent' : undefined,
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={(e) => {
        if(onDrillDown) e.currentTarget.style.borderColor = color;
      }}
      onMouseLeave={(e) => {
        if(onDrillDown) e.currentTarget.style.borderColor = 'transparent';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ background: `${color}15`, color: color, padding: '0.6rem', borderRadius: '0.75rem' }}>
          {icon}
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.35rem', 
          padding: '0.3rem 0.65rem', 
          borderRadius: '0.6rem', 
          background: isPositive ? '#10B98115' : '#EF444415',
          color: isPositive ? '#10B981' : '#EF4444',
          fontSize: '0.7rem',
          fontWeight: 800,
          border: `1px solid ${isPositive ? '#10B98120' : '#EF444420'}`
        }}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trend}%
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</div>
        <div style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text)' }}>{value}</div>
      </div>

      {/* Sparkline */}
      <div style={{ height: '40px', minHeight: '40px', width: '100%', marginTop: '0.5rem' }}>
        <SafeResponsiveChart minHeight={40} fallbackHeight={40}>
          <AreaChart data={sparklineData}>
            <defs>
              <linearGradient id={`grad-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="val" 
              stroke={color} 
              strokeWidth={2} 
              fillOpacity={1} 
              fill={`url(#grad-${title.replace(/\s+/g, '')})`} 
            />
          </AreaChart>
        </SafeResponsiveChart>
      </div>
    </motion.div>
  );
};

export default KpiCard;
