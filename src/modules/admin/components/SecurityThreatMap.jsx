import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, ShieldAlert, ShieldCheck } from 'lucide-react';

/**
 *  SECURITY THREAT MAP (ELITE VISUALIZATION)
 * Futuristic map visualization showing global access attempts and security events.
 */
const SecurityThreatMap = () => {
  // Simulated threat data
  const threats = useMemo(() => [
    { id: 1, x: 150, y: 80, city: 'San Francisco', status: 'Success', risk: 'Low', time: '2m ago' },
    { id: 2, x: 420, y: 95, city: 'Paris', status: 'Success', risk: 'Low', time: '5m ago' },
    { id: 3, x: 650, y: 150, city: 'Tokyo', status: 'Blocked', risk: 'High', time: '12m ago' },
    { id: 4, x: 380, y: 220, city: 'Lagos', status: 'Success', risk: 'Low', time: '30m ago' },
    { id: 5, x: 550, y: 100, city: 'Moscow', status: 'Blocked', risk: 'Critical', time: '1h ago' },
  ], []);

  return (
    <div style={{ 
      padding: '2.5rem', borderRadius: '2.5rem', background: 'white', 
      border: '1px solid var(--border)', boxShadow: 'var(--shadow-premium)',
      overflow: 'hidden', position: 'relative'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem', color: 'var(--text)' }}>Global Access Vector</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Real-time authentication geolocation & risk analysis.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 800 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} /> SUCCESS
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 800 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#DC2626' }} /> BLOCKED
           </div>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', height: '400px', background: 'var(--bg-subtle)', borderRadius: '1.5rem', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
        {/* Simplified World Map SVG (Stylized) */}
        <svg viewBox="0 0 800 400" style={{ width: '100%', height: '100%', opacity: 0.15 }}>
          <path d="M150,80 L200,100 L180,150 L120,130 Z M400,100 L450,120 L430,180 L380,160 Z M600,120 L650,140 L630,200 L580,180 Z" fill="var(--primary)" />
          {/* Add more abstract shapes to simulate a world map */}
          <circle cx="200" cy="150" r="40" fill="var(--primary)" />
          <circle cx="450" cy="120" r="60" fill="var(--primary)" />
          <circle cx="650" cy="180" r="50" fill="var(--primary)" />
          <circle cx="300" cy="250" r="70" fill="var(--primary)" />
        </svg>

        {/* Dynamic Threat Points */}
        {threats.map((t) => (
          <motion.div
            key={t.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: t.id * 0.2 }}
            style={{ 
              position: 'absolute', left: `${(t.x / 800) * 100}%`, top: `${(t.y / 400) * 100}%`,
              transform: 'translate(-50%, -50%)', pointerEvents: 'auto'
            }}
          >
            <div style={{ position: 'relative' }}>
              <motion.div 
                animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                style={{ 
                  position: 'absolute', top: -12, left: -12, width: 24, height: 24, borderRadius: '50%',
                  background: t.status === 'Success' ? 'var(--accent)' : '#DC2626'
                }} 
              />
              <div style={{ 
                width: 12, height: 12, borderRadius: '50%', background: t.status === 'Success' ? 'var(--accent)' : '#DC2626',
                border: '2px solid white', boxShadow: '0 0 10px rgba(0,0,0,0.1)', cursor: 'pointer'
              }} title={`${t.city}: ${t.status}`} />
              
              {/* Tooltip-like Info */}
              <div style={{ 
                position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
                background: 'white', padding: '0.5rem 0.75rem', borderRadius: '0.75rem',
                border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)',
                whiteSpace: 'nowrap', zIndex: 10, fontSize: '0.7rem', fontWeight: 800
              }}>
                <div style={{ color: 'var(--text)' }}>{t.city}</div>
                <div style={{ color: t.status === 'Success' ? 'var(--accent)' : '#DC2626' }}>{t.status} • {t.time}</div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Grid Overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize: '30px 30px', opacity: 0.3, pointerEvents: 'none' }} />
      </div>

      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        <div style={{ padding: '1.25rem', borderRadius: '1.25rem', background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>RISK INDEX</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary)' }}>Stable (Low)</div>
        </div>
        <div style={{ padding: '1.25rem', borderRadius: '1.25rem', background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>BLOCKED ATTEMPTS</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#DC2626' }}>12 (24h)</div>
        </div>
        <div style={{ padding: '1.25rem', borderRadius: '1.25rem', background: 'var(--bg-subtle)', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>ANOMALY DETECTION</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--accent)' }}>0 Active</div>
        </div>
      </div>
    </div>
  );
};

export default SecurityThreatMap;
