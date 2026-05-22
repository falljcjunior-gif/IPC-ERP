import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

function useAnimatedCounter(target, duration = 1200, enabled = true) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const start = performance.now();
    const from = 0;
    const to = typeof target === 'number' ? target : parseFloat(String(target).replace(/[^0-9.]/g, '')) || 0;

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4); // ease-out quart
      setValue(from + (to - from) * ease);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration, enabled]);

  return value;
}

function formatValue(raw, animated) {
  const str = String(raw);
  // Detect prefix (€, $, etc.)
  const prefix = str.match(/^[^0-9]*/)?.[0] || '';
  // Detect suffix (%, K, M, etc.)
  const suffix = str.match(/[^0-9.]+$/)?.[0] || '';
  const num = parseFloat(str.replace(/[^0-9.]/g, '')) || 0;
  const scale = animated / (num || 1);
  const display = num * Math.min(scale, 1);

  if (str.includes('M')) return `${prefix}${(display / 1e6).toFixed(1)}M`;
  if (str.includes('K') || str.includes('k')) return `${prefix}${(display / 1e3).toFixed(1)}K`;
  if (suffix === '%') return `${prefix}${display.toFixed(1)}%`;
  if (display >= 1000) return `${prefix}${Math.round(display).toLocaleString('fr-FR')}${suffix}`;
  return `${prefix}${display % 1 !== 0 ? display.toFixed(1) : Math.round(display)}${suffix}`;
}

export default function StatCard({
  label,
  value,
  trend,         // '+12%' | '-3%' | '0' | null
  trendLabel,    // 'vs mois précédent'
  icon: Icon,
  iconColor,
  accentColor,
  animate = true,
  style = {},
  className = '',
  onClick,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const numericValue = parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;
  const animated = useAnimatedCounter(numericValue, 1400, isInView && animate);

  const trendDir = trend
    ? trend.startsWith('-') ? 'down' : trend === '0' ? 'neutral' : 'up'
    : null;

  const TrendIcon = trendDir === 'up' ? TrendingUp : trendDir === 'down' ? TrendingDown : Minus;

  return (
    <motion.div
      ref={ref}
      className={`erp-stat-card${className ? ` ${className}` : ''}`}
      style={{
        '--stat-accent': accentColor || '#10B981',
        ...style
      }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Icon */}
      {Icon && (
        <div style={{
          width: 36, height: 36, borderRadius: '0.625rem',
          background: `${accentColor || '#10B981'}14`,
          border: `1px solid ${accentColor || '#10B981'}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '1rem',
        }}>
          <Icon size={18} color={accentColor || '#10B981'} />
        </div>
      )}

      <div className="erp-stat-card-label">{label}</div>

      <motion.div
        className="erp-stat-card-value"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {animate && isInView ? formatValue(value, animated) : value}
      </motion.div>

      {trendDir && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          <span className={`erp-stat-card-trend ${trendDir}`}>
            <TrendIcon size={11} />
            {trend}
          </span>
          {trendLabel && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748B)', fontWeight: 500 }}>
              {trendLabel}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
