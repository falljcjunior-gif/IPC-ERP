import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Server, Ticket, ListFilter, Cpu, 
  Terminal, Activity, Lock, Search, Plus,
  Monitor, Smartphone, HardDrive, Settings,
  AlertCircle, CheckCircle2, History
} from 'lucide-react';

import { useStore } from '../../store';
import { useCanSeeSubTab } from '../../store/selectors';
import InfrastructureHealth from './components/InfrastructureHealth';

/**
 * 🛠️ NEXUS OS: IT OPERATIONS MODULE
 * "Cyber-Command" control center for I.T infrastructure and assets.
 */
const ITModule = () => {
  const { data, userRole } = useStore();
  const canSee = useCanSeeSubTab();
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = useMemo(() => {
    const allTabs = [
      { id: 'dashboard', label: 'Dashboard (NOC)', icon: <Activity size={16} /> },
      { id: 'inventory', label: 'Parc Informatique', icon: <Monitor size={16} /> },
      { id: 'tickets', label: 'Service Desk', icon: <Ticket size={16} /> },
      { id: 'audit', label: 'Security Audit', icon: <Shield size={16} /> },
      { id: 'provisioning', label: 'Provisioning', icon: <Terminal size={16} /> },
    ];
    // ID du module dans la registry : control_hub ou it ? 
    // On va utiliser 'it' pour la granularité.
    return allTabs.filter(t => canSee('it', t.id));
  }, [canSee]);

  return (
    <div style={{ 
      minHeight: '100vh', padding: '2.5rem', 
      background: '#0a0a0c', // Pure Cyber Dark
      color: '#e2e8f0'
    }}>
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
              <Shield size={18} color="white" />
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '3px', color: '#3B82F6', textTransform: 'uppercase' }}>
              Nexus Command Center
            </span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>
            IT Operations
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
            Infrastructure monitoring, asset lifecycle & technical security.
          </p>
        </div>

        {/* Global System Status Tag */}
        <div className="glass" style={{ padding: '0.75rem 1.25rem', borderRadius: '1rem', border: '1px solid rgba(16, 185, 129, 0.2)', background: 'rgba(16, 185, 129, 0.05)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#10B981' }}>SYSTEMS NOMINAL</span>
        </div>
      </div>

      {/* ── NAVIGATION ── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2.5rem', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)', width: 'fit-content' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 1.25rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', transition: 'all 0.2s',
              background: activeTab === tab.id ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: activeTab === tab.id ? '#3B82F6' : 'rgba(255,255,255,0.4)'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'dashboard' && <InfrastructureHealth />}
          
          {activeTab === 'inventory' && (
            <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
              <Monitor size={48} color="rgba(255,255,255,0.1)" style={{ marginBottom: '1rem' }} />
              <h3 style={{ margin: 0, fontWeight: 800 }}>Asset Management</h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Gestion du parc matériel en cours de synchronisation...</p>
            </div>
          )}

          {activeTab === 'tickets' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              {['To Do', 'In Progress', 'Resolved'].map(col => (
                <div key={col} className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem', minHeight: '400px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.3)', marginBottom: '1.5rem' }}>
                    {col}
                  </div>
                  <div style={{ border: '1px dashed rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '1rem', textAlign: 'center', fontSize: '0.8rem', color: 'rgba(255,255,255,0.2)' }}>
                    Aucun ticket
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ margin: 0, fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <History size={20} color="#3B82F6" /> Security Audit Pipeline
                </h3>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                   <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                      <Search size={14} color="rgba(255,255,255,0.3)" />
                      <input placeholder="Rechercher un log..." style={{ background: 'none', border: 'none', color: 'white', outline: 'none' }} />
                   </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
                        <Lock size={14} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Permission Change: Module HR</div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>User: falljcjunior@gmail.com • 2 mins ago</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#3B82F6', cursor: 'pointer' }}>Détails →</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'provisioning' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
               <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h4 style={{ margin: '0 0 1.5rem 0', fontWeight: 900 }}>Software Auto-Provisioner</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {['VS Code', 'Slack', 'Docker Desktop', 'Postman'].map(app => (
                      <div key={app} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{app}</span>
                        <button style={{ fontSize: '0.7rem', fontWeight: 800, color: '#3B82F6', background: 'none', border: 'none', cursor: 'pointer' }}>Installer</button>
                      </div>
                    ))}
                  </div>
               </div>
               <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(59, 130, 246, 0.05)' }}>
                  <h4 style={{ margin: '0 0 1rem 0', fontWeight: 900 }}>Dev Environment Shell</h4>
                  <div style={{ background: '#000', padding: '1rem', borderRadius: '0.75rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div>$ nexus-cli provisioning --user=yoman</div>
                    <div>[INFO] Authenticating user... DONE</div>
                    <div>[INFO] Pulling IT configuration... DONE</div>
                    <div>[WAIT] Installing security patches... <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity }}>_</motion.span></div>
                  </div>
               </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ITModule;
