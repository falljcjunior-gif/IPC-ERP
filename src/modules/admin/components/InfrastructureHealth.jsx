import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, Database, Zap, ShieldCheck, 
  Cpu, HardDrive, Globe, AlertTriangle 
} from 'lucide-react';

/**
 * 🛠️ INFRASTRUCTURE HEALTH MONITOR (PRISTINE VERSION)
 * High-precision monitoring widget with clean enterprise aesthetics.
 */
const InfrastructureHealth = () => {
  const [metrics, setMetrics] = useState({
    cpu: 12,
    ram: 45,
    latency: 120,
    uptime: 99.98,
    reqSec: 450
  });

  // Real-time metrics simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cpu: Math.max(8, Math.min(95, prev.cpu + (Math.random() * 8 - 4))),
        ram: Math.max(30, Math.min(85, prev.ram + (Math.random() * 2 - 1))),
        latency: Math.max(40, Math.min(450, prev.latency + (Math.random() * 30 - 15))),
        reqSec: Math.max(100, Math.min(2000, prev.reqSec + (Math.random() * 150 - 75)))
      }));
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const systems = [
    { id: 'auth', label: 'Identity Bridge (Auth)', status: 'Online', load: 12, icon: <ShieldCheck size={18} /> },
    { id: 'db', label: 'Cloud Firestore', status: 'Online', load: metrics.ram, icon: <Database size={18} /> },
    { id: 'functions', label: 'Backend Logic (Functions)', status: metrics.cpu > 85 ? 'Warning' : 'Online', load: metrics.cpu, icon: <Zap size={18} /> },
    { id: 'storage', label: 'Document Storage', status: 'Online', load: 28, icon: <HardDrive size={18} /> },
    { id: 'cdn', label: 'Global Edge Network', status: 'Online', load: 15, icon: <Globe size={18} /> },
  ];

  const getStatusColor = (status, load) => {
    if (status === 'Critical' || load > 90) return '#DC2626'; // Red 600
    if (status === 'Warning' || load > 75) return '#D97706'; // Amber 600
    return '#059669'; // Emerald 600 (Matching IPC Primary)
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* ── HIGH LEVEL KPIS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        {[
          { label: 'Uptime Annuel', val: `${metrics.uptime}%`, color: 'var(--primary)', icon: <Activity size={18} /> },
          { label: 'Latence API', val: `${Math.round(metrics.latency)}ms`, color: metrics.latency > 300 ? '#D97706' : 'var(--primary)', icon: <Globe size={18} /> },
          { label: 'Charge Système', val: `${Math.round(metrics.reqSec)} req/s`, color: '#2563EB', icon: <Zap size={18} /> },
          { label: 'Processeur (CPU)', val: `${Math.round(metrics.cpu)}%`, color: getStatusColor('Online', metrics.cpu), icon: <Cpu size={18} /> },
        ].map(kpi => (
          <div key={kpi.label} style={{ 
            padding: '2rem', borderRadius: '2rem', background: 'white', 
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
            display: 'flex', flexDirection: 'column', gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)' }}>
              {kpi.icon} {kpi.label}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: kpi.color, fontFamily: 'var(--font-heading)' }}>{kpi.val}</div>
          </div>
        ))}
      </div>

      {/* ── SYSTEM NODES ── */}
      <div style={{ 
        padding: '2.5rem', borderRadius: '2.5rem', background: 'white', 
        border: '1px solid var(--border)', boxShadow: 'var(--shadow-premium)' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Activity size={22} color="var(--primary)" /> 
            Infrastructure Nodes Reliability
          </h4>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>Live Update: Every 2.5s</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {systems.map(sys => {
            const color = getStatusColor(sys.status, sys.load);
            return (
              <div key={sys.id} style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div style={{ 
                  width: '52px', height: '52px', borderRadius: '16px', 
                  background: 'var(--bg-subtle)', border: '1px solid var(--border)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color 
                }}>
                  {sys.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text)' }}>{sys.label}</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '2px' }}>Status: {sys.status}</div>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 900, color }}>{Math.round(sys.load)}% Usage</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                    <motion.div 
                      initial={false}
                      animate={{ width: `${sys.load}%`, background: color }}
                      style={{ height: '100%', borderRadius: '999px' }} 
                    />
                  </div>
                </div>
                {sys.load > 85 && (
                  <motion.div animate={{ scale: [1, 1.2, 1], opacity: [1, 0.6, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>
                    <AlertTriangle size={20} color="#DC2626" />
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InfrastructureHealth;
