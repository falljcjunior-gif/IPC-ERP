import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Database, Zap, ShieldCheck, 
  Cpu, HardDrive, Globe, AlertTriangle,
  RefreshCw, Lock, ArrowUpCircle, Info
} from 'lucide-react';

/**
 *  INFRASTRUCTURE HEALTH MONITOR (ELITE 2.0)
 * Integrated AIOps, Self-Healing Actions, and Topology Visualization.
 */
const InfrastructureHealth = () => {
  const [metrics, setMetrics] = useState({
    cpu: 12,
    ram: 45,
    latency: 120,
    uptime: 99.98,
    reqSec: 450,
    prediction: 'No Failure Predicted'
  });

  const [isHealing, setIsHealing] = useState(null);

  // Real-time metrics simulation with "Failure Prediction" logic
  useEffect(() => {
    const timer = setInterval(() => {
      setMetrics(prev => {
        const nextCpu = Math.max(8, Math.min(98, prev.cpu + (Math.random() * 10 - 5)));
        const nextPrediction = nextCpu > 80 ? 'Failure Predicted (8h)' : 'System Nominal (48h+)';
        return {
          ...prev,
          cpu: nextCpu,
          ram: Math.max(30, Math.min(85, prev.ram + (Math.random() * 2 - 1))),
          latency: Math.max(40, Math.min(450, prev.latency + (Math.random() * 30 - 15))),
          reqSec: Math.max(100, Math.min(2000, prev.reqSec + (Math.random() * 150 - 75))),
          prediction: nextPrediction
        };
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const systems = [
    { id: 'auth', label: 'Identity Bridge', status: 'Online', load: 12, icon: <ShieldCheck size={18} />, deps: ['db'] },
    { id: 'db', label: 'Cloud Firestore', status: 'Online', load: metrics.ram, icon: <Database size={18} />, deps: [] },
    { id: 'functions', label: 'Cloud Functions', status: metrics.cpu > 85 ? 'Warning' : 'Online', load: metrics.cpu, icon: <Zap size={18} />, deps: ['db', 'storage'] },
    { id: 'storage', label: 'Document Storage', status: 'Online', load: 28, icon: <HardDrive size={18} />, deps: [] },
  ];

  const handleSelfHeal = (action) => {
    setIsHealing(action);
    setTimeout(() => setIsHealing(null), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* ── AIOPS & PREDICTIVE METRICS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <div style={{ 
          padding: '2rem', borderRadius: '2rem', background: 'white', 
          border: '1px solid var(--border)', boxShadow: 'var(--shadow-premium)',
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '1rem' }}>
            <Activity size={18} color="var(--primary)" /> AIOPS PREDICTION
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: metrics.cpu > 80 ? '#DC2626' : 'var(--primary)', marginBottom: '0.5rem' }}>
            {metrics.prediction}
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Baseline: <span style={{ color: 'var(--text)' }}>V-Cluster Optimal</span>
          </div>
          {metrics.cpu > 80 && (
            <motion.div animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ position: 'absolute', top: '1rem', right: '1.5rem', padding: '0.4rem 0.75rem', background: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 900 }}>
              CRITICAL TREND
            </motion.div>
          )}
        </div>

        <div style={{ 
          padding: '2rem', borderRadius: '2rem', background: 'white', 
          border: '1px solid var(--border)', boxShadow: 'var(--shadow-premium)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '1rem' }}>
            <Zap size={18} color="#2563EB" /> SELF-HEALING ACTIONS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[
              { id: 'cdn', label: 'Flush CDN', icon: <RefreshCw size={14} /> },
              { id: 'secrets', label: 'Rotate Secrets', icon: <Lock size={14} /> },
              { id: 'scale', label: 'Scale Up', icon: <ArrowUpCircle size={14} /> },
              { id: 'cache', label: 'Clear Cache', icon: <RefreshCw size={14} /> }
            ].map(act => (
              <button 
                key={act.id} 
                onClick={() => handleSelfHeal(act.label)}
                disabled={isHealing}
                style={{ 
                  padding: '0.6rem', borderRadius: '1rem', border: '1px solid var(--border)', 
                  background: isHealing === act.label ? 'var(--primary)' : 'var(--bg-subtle)',
                  color: isHealing === act.label ? 'white' : 'var(--text)',
                  fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  transition: 'var(--transition)'
                }}
              >
                {isHealing === act.label ? <RefreshCw size={14} className="spin" /> : act.icon}
                {act.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── TOPOLOGY VISUALIZATION (PRISTINE GRAPH) ── */}
      <div style={{ 
        padding: '2.5rem', borderRadius: '2.5rem', background: 'white', 
        border: '1px solid var(--border)', boxShadow: 'var(--shadow-premium)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Globe size={22} color="var(--primary)" /> 
            Network Topology & Dependencies
          </h4>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Info size={16} color="var(--text-muted)" />
            </div>
          </div>
        </div>

        <div style={{ 
          height: '400px', background: 'var(--bg-subtle)', borderRadius: '2rem', 
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>
          {/* Central Nexus Core */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 4 }} style={{ width: 120, height: 120, borderRadius: '50%', background: 'white', border: '4px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-premium)' }}>
              <img src="/logo-ipc.png" alt="IPC" style={{ width: 60, opacity: 0.8 }} />
            </motion.div>
          </div>

          {/* Connected Nodes */}
          {systems.map((sys, idx) => {
            const angle = (idx * (360 / systems.length)) * (Math.PI / 180);
            const radius = 150;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            return (
              <React.Fragment key={sys.id}>
                {/* Connector Line */}
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                  <motion.line 
                    x1="50%" y1="50%" x2={`calc(50% + ${x}px)`} y2={`calc(50% + ${y}px)`}
                    stroke="var(--border)" strokeWidth="2" strokeDasharray="4 4"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: idx * 0.2 }}
                  />
                </svg>
                
                {/* Node */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.3 }}
                  style={{ 
                    position: 'absolute', left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`,
                    transform: 'translate(-50%, -50%)', zIndex: 3
                  }}
                >
                  <div style={{ 
                    width: 60, height: 60, borderRadius: '16px', background: 'white', 
                    border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: sys.status === 'Warning' ? '#DC2626' : 'var(--primary)'
                  }}>
                    {sys.icon}
                  </div>
                  <div style={{ 
                    position: 'absolute', top: '70px', left: '50%', transform: 'translateX(-50%)',
                    fontSize: '0.7rem', fontWeight: 900, color: 'var(--text)', whiteSpace: 'nowrap', textAlign: 'center'
                  }}>
                    {sys.label}
                    <div style={{ color: sys.status === 'Warning' ? '#DC2626' : 'var(--accent)', fontSize: '0.6rem' }}>{sys.status}</div>
                  </div>
                </motion.div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InfrastructureHealth;
