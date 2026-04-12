import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const KpiCard = ({ title, value, trend, trendType, icon, color, sparklineData, onDrillDown }) => {
  const isPositive = trendType === 'up';

  return (
    <motion.div
      onClick={onDrillDown}
      whileHover={{ y: -5, scale: onDrillDown ? 1.02 : 1, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
      className="glass"
      style={{
        padding: '1.5rem',
        borderRadius: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
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
          gap: '0.25rem', 
          padding: '0.25rem 0.5rem', 
          borderRadius: '0.5rem', 
          background: isPositive ? '#10B98115' : '#EF444415',
          color: isPositive ? '#10B981' : '#EF4444',
          fontSize: '0.75rem',
          fontWeight: 700
        }}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trend}%
        </div>
      </div>

      <div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{value}</div>
      </div>

      {/* Sparkline */}
      <div style={{ height: '40px', width: '100%', marginTop: '0.5rem' }}>
        <ResponsiveContainer width="100%" height="100%">
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
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default KpiCard;
