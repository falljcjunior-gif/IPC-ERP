import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Server, Ticket, ListFilter, Cpu, 
  Terminal, Activity, Lock, Search, Plus,
  Monitor, Smartphone, HardDrive, Settings,
  AlertCircle, CheckCircle2, History, ChevronRight
} from 'lucide-react';

import { useStore } from '../../store';
import { useCanSeeSubTab } from '../../store/selectors';
import InfrastructureHealth from './components/InfrastructureHealth';

/**
 * 🛠️ NEXUS OS: IT OPERATIONS MODULE (PRISTINE VERSION)
 * Clean, enterprise-grade control center for I.T infrastructure and assets.
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
    return allTabs.filter(t => canSee('it', t.id));
  }, [canSee]);

  return (
    <div style={{ 
      minHeight: '100vh', padding: '3rem', 
      background: 'var(--bg-subtle)',
      color: 'var(--text)'
    }}>
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ 
              padding: '10px', borderRadius: '12px', 
              background: 'var(--primary)',
              boxShadow: 'var(--shadow-accent)'
            }}>
              <Shield size={20} color="white" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
               <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '2px', color: 'var(--primary)', textTransform: 'uppercase' }}>
                Operational Technology
              </span>
              <div style={{ height: '2px', width: '24px', background: 'var(--primary)', marginTop: '2px' }} />
            </div>
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: 0, letterSpacing: '-1.5px', color: 'var(--text)' }}>
            IT Operations
          </h1>
          <p style={{ margin: '0.75rem 0 0 0', color: 'var(--text-muted)', fontWeight: 500, fontSize: '1.1rem' }}>
            Monitoring, lifecycle management & digital infrastructure.
          </p>
        </div>

        {/* Global System Status Tag (Clean Version) */}
        <div style={{ 
          padding: '0.75rem 1.5rem', borderRadius: '999px', 
          background: 'white', border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex', alignItems: 'center', gap: '0.75rem' 
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>SYSTEMS NOMINAL</span>
        </div>
      </div>

      {/* ── NAVIGATION (PRISTINE TABS) ── */}
      <div style={{ 
        display: 'flex', gap: '0.5rem', marginBottom: '3rem', 
        padding: '6px', borderRadius: '1.5rem', 
        background: 'rgba(15, 23, 42, 0.03)',
        border: '1px solid var(--border-light)',
        width: 'fit-content' 
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.8rem 1.75rem', borderRadius: '1.25rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', transition: 'var(--transition)',
              background: activeTab === tab.id ? 'white' : 'transparent',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: activeTab === tab.id ? 'var(--shadow-md)' : 'none'
            }}
          >
            {React.cloneElement(tab.icon, { size: 18, color: activeTab === tab.id ? 'var(--primary)' : 'currentColor' })} 
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {activeTab === 'dashboard' && <InfrastructureHealth />}
          
          {activeTab === 'inventory' && (
            <div style={{ 
              padding: '5rem 2rem', borderRadius: '2.5rem', textAlign: 'center', 
              background: 'white', border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-premium)'
            }}>
              <div style={{ 
                width: 80, height: 80, borderRadius: '25px', background: 'var(--bg-subtle)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto'
              }}>
                <Monitor size={32} color="var(--primary)" />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>Asset Management</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '400px', margin: '0 auto' }}>
                Synchronisation du parc matériel en cours avec les inventaires locaux...
              </p>
            </div>
          )}

          {activeTab === 'tickets' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
              {['To Do', 'In Progress', 'Resolved'].map(col => (
                <div key={col} style={{ 
                  padding: '2rem', borderRadius: '2rem', minHeight: '500px', 
                  background: 'white', border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ 
                    fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', 
                    letterSpacing: '1px', color: 'var(--primary)', marginBottom: '2rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    {col}
                    <div style={{ width: 24, height: 24, borderRadius: '6px', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>0</div>
                  </div>
                  <div style={{ 
                    border: '1.5px dashed var(--border)', padding: '3rem 1.5rem', borderRadius: '1.5rem', 
                    textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500
                  }}>
                    Aucun incident répertorié
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'audit' && (
            <div style={{ 
              padding: '2.5rem', borderRadius: '2.5rem', background: 'white', 
              border: '1px solid var(--border)', boxShadow: 'var(--shadow-premium)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    Security Pipeline
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Traçabilité complète des accès système.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                   <div style={{ 
                     background: 'var(--bg-subtle)', padding: '0.75rem 1.25rem', borderRadius: '1rem', 
                     border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem'
                   }}>
                      <Search size={16} color="var(--text-muted)" />
                      <input 
                        placeholder="Filtrer les logs..." 
                        style={{ background: 'none', border: 'none', color: 'var(--text)', outline: 'none', fontWeight: 600, width: '200px' }} 
                      />
                   </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className="hover-lift" style={{ 
                    padding: '1.25rem 2rem', background: 'white', borderRadius: '1.25rem', 
                    border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', 
                    alignItems: 'center', transition: 'var(--transition)'
                  }}>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                        <Lock size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: 800 }}>Permission Change: Module HR</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          User: <span style={{ color: 'var(--primary)' }}>falljcjunior@gmail.com</span> • Il y a 2 minutes
                        </div>
                      </div>
                    </div>
                    <button style={{ 
                      padding: '0.5rem 1rem', borderRadius: '0.75rem', background: 'var(--bg-subtle)', 
                      border: 'none', color: 'var(--primary)', fontWeight: 800, fontSize: '0.75rem', 
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                      Détails <ChevronRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'provisioning' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem' }}>
               <div style={{ 
                 padding: '2.5rem', borderRadius: '2.5rem', background: 'white', 
                 border: '1px solid var(--border)', boxShadow: 'var(--shadow-premium)'
               }}>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '2rem' }}>Software Auto-Provisioner</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {['VS Code', 'Slack', 'Docker Desktop', 'Postman'].map(app => (
                      <div key={app} style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                        padding: '1.25rem 1.5rem', background: 'var(--bg-subtle)', borderRadius: '1.25rem',
                        border: '1px solid var(--border-light)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)' }} />
                          <span style={{ fontSize: '1rem', fontWeight: 800 }}>{app}</span>
                        </div>
                        <button style={{ 
                          padding: '0.6rem 1.25rem', borderRadius: '0.75rem', background: 'var(--primary)', 
                          border: 'none', color: 'white', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer'
                        }}>
                          Déployer
                        </button>
                      </div>
                    ))}
                  </div>
               </div>
               <div style={{ 
                 padding: '2.5rem', borderRadius: '2.5rem', background: 'var(--primary)', 
                 boxShadow: 'var(--shadow-premium)', color: 'white', display: 'flex', flexDirection: 'column'
               }}>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '1.5rem' }}>Cloud Shell Console</h4>
                  <div style={{ 
                    flex: 1, background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '1.5rem', 
                    fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--accent)', 
                    lineHeight: 1.6, border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ opacity: 0.5 }}>$ nexus-cli provisioning --user=yoman</div>
                    <div>[OK] Identity verified.</div>
                    <div>[OK] Pulling I.P.C configuration...</div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span style={{ color: 'white' }}>root@nexus:~$</span>
                      <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 1 }}>_</motion.span>
                    </div>
                  </div>
                  <p style={{ margin: '1.5rem 0 0 0', fontSize: '0.8rem', opacity: 0.7, fontWeight: 500 }}>
                    Connecté au cluster principal • Region: EU-West-1
                  </p>
               </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ITModule;
