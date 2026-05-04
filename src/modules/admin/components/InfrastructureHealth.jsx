import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, Database, Zap, ShieldCheck, 
  Cpu, HardDrive, Globe, AlertTriangle 
} from 'lucide-react';

/**
 * 🛠️ INFRASTRUCTURE HEALTH MONITOR
 * High-precision monitoring widget for IT Operations.
 */
const InfrastructureHealth = () => {
  const [metrics, setMetrics] = useState({
    cpu: 12,
    ram: 45,
    latency: 120,
    uptime: 99.98,
    reqSec: 450
  });

  // Simulation de metrics en temps réel
  useEffect(() => {
    const timer = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cpu: Math.max(8, Math.min(95, prev.cpu + (Math.random() * 10 - 5))),
        ram: Math.max(30, Math.min(85, prev.ram + (Math.random() * 2 - 1))),
        latency: Math.max(40, Math.min(450, prev.latency + (Math.random() * 40 - 20))),
        reqSec: Math.max(100, Math.min(2000, prev.reqSec + (Math.random() * 200 - 100)))
      }));
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const systems = [
    { id: 'auth', label: 'Firebase Auth', status: 'Online', load: 12, icon: <ShieldCheck size={18} /> },
    { id: 'db', label: 'Firestore DB', status: 'Online', load: metrics.ram, icon: <Database size={18} /> },
    { id: 'functions', label: 'Cloud Functions', status: metrics.cpu > 85 ? 'Warning' : 'Online', load: metrics.cpu, icon: <Zap size={18} /> },
    { id: 'storage', label: 'Cloud Storage', status: 'Online', load: 28, icon: <HardDrive size={18} /> },
    { id: 'cdn', label: 'Edge Network', status: 'Online', load: 15, icon: <Globe size={18} /> },
  ];

  const getStatusColor = (status, load) => {
    if (status === 'Critical' || load > 90) return '#EF4444';
    if (status === 'Warning' || load > 75) return '#F59E0B';
    return '#10B981'; // Cyber-Green
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ── HIGH LEVEL KPIS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Uptime Global', val: `${metrics.uptime}%`, color: '#10B981', icon: <Activity size={16} /> },
          { label: 'Latence Moyenne', val: `${Math.round(metrics.latency)}ms`, color: metrics.latency > 300 ? '#F59E0B' : '#10B981', icon: <Globe size={16} /> },
          { label: 'Requêtes / sec', val: Math.round(metrics.reqSec), color: '#3B82F6', icon: <Zap size={16} /> },
          { label: 'Utilisation CPU', val: `${Math.round(metrics.cpu)}%`, color: getStatusColor('Online', metrics.cpu), icon: <Cpu size={16} /> },
        ].map(kpi => (
          <div key={kpi.label} className="glass" style={{ padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem' }}>
              {kpi.icon} {kpi.label}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: kpi.color, fontFamily: 'monospace' }}>{kpi.val}</div>
          </div>
        ))}
      </div>

      {/* ── SYSTEM NODES ── */}
      <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.3)' }}>
        <h4 style={{ margin: '0 0 1.5rem 0', fontSize: '0.9rem', fontWeight: 900, color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Activity size={18} color="#10B981" /> System Nodes Architecture
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {systems.map(sys => {
            const color = getStatusColor(sys.status, sys.load);
            return (
              <div key={sys.id} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                  {sys.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'rgba(255,255,255,0.9)' }}>{sys.label}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color }}>{sys.status} • {Math.round(sys.load)}% Load</span>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                    <motion.div 
                      initial={false}
                      animate={{ width: `${sys.load}%`, background: color }}
                      style={{ height: '100%' }} 
                    />
                  </div>
                </div>
                {sys.load > 85 && (
                  <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                    <AlertTriangle size={18} color="#EF4444" />
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
