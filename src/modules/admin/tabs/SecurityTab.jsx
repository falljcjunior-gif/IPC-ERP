import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, ShieldAlert, Shield, Lock, 
  Key, Eye, History, Bell, Smartphone,
  Database, AlertTriangle, CheckCircle2,
  Users, LogIn, Activity
} from 'lucide-react';
import { useBusiness } from '../../../BusinessContext';

const SecurityTab = () => {
  const { config, updateConfig } = useBusiness();

  const auditLogs = [
    { id: 1, user: 'admin@ipc.ci', action: 'Accès Module Finance', time: '10:45', status: 'success' },
    { id: 2, user: 'admin@ipc.ci', action: 'Modification Schéma Sales', time: '10:12', status: 'success' },
    { id: 3, user: '192.168.1.104', action: 'Échec Connexion (BRUTEFORCE?)', time: '09:30', status: 'alert' },
  ];

  const handleUpdate = (section, key, value) => {
    updateConfig({
      [section]: { ...config[section], [key]: value }
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
       
       {/* Security Health Radar */}
       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
          <div className="glass" style={{ padding: '2.5rem', borderRadius: '2.5rem', border: '1px solid var(--border)', background: 'linear-gradient(135deg, #0F172A 0%, #172554 100%)', color: 'white' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
                <div>
                   <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', color: '#3B82F6', marginBottom: '6px' }}>Sécurité Hardening</h4>
                   <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>Elite A+</div>
                </div>
                <div style={{ padding: '12px', borderRadius: '14px', background: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6' }}>
                   <ShieldCheck size={32} />
                </div>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 600 }}>
                   <span style={{ opacity: 0.7 }}>Score de Conformité</span>
                   <span>98%</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                   <motion.div initial={{ width: 0 }} animate={{ width: '98%' }} transition={{ duration: 1.5 }} style={{ height: '100%', background: '#3B82F6' }} />
                </div>
                <p style={{ fontSize: '0.75rem', opacity: 0.6, margin: '0.5rem 0 0 0', fontWeight: 500 }}>Toutes les couches de sécurité sont actives et surveillées.</p>
             </div>
          </div>

          <div className="glass" style={{ padding: '2.5rem', borderRadius: '2.5rem', border: '1px solid var(--border)', background: 'var(--bg)' }}>
             <h4 style={{ margin: '0 0 2rem 0', fontWeight: 900, fontSize: '1.1rem' }}>Contrôles de Protection</h4>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '1.25rem' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <Smartphone size={20} color="#3B82F6" />
                      <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Double Authentification (2FA)</div>
                   </div>
                   <div onClick={() => handleUpdate('security', 'tfaEnabled', !config.security?.tfaEnabled)} style={{ width: '44px', height: '22px', borderRadius: '11px', background: config.security?.tfaEnabled ? '#10B981' : 'var(--border)', cursor: 'pointer', position: 'relative', transition: '0.2s' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: config.security?.tfaEnabled ? '25px' : '3px', transition: '0.2s' }} />
                   </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '1.25rem' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <History size={20} color="#F59E0B" />
                      <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Expiration Session (Min)</div>
                   </div>
                   <input type="number" value={config.security?.sessionTimeout} onChange={(e) => handleUpdate('security', 'sessionTimeout', parseInt(e.target.value))} style={{ width: '60px', background: 'transparent', border: 'none', fontWeight: 900, color: 'var(--text)', textAlign: 'right', outline: 'none' }} />
                </div>
             </div>
          </div>
       </div>

       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Audit Logs */}
          <div className="glass" style={{ padding: '2.5rem', borderRadius: '2.5rem', border: '1px solid var(--border)', background: 'var(--bg)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                   <div style={{ padding: '8px', borderRadius: '10px', background: '#3B82F615', color: '#3B82F6' }}>
                      <Eye size={20} />
                   </div>
                   <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>Logs d'Audit Temps Réel</h4>
                </div>
                <button className="btn-secondary" style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: 900 }}>Exporter Logs</button>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {auditLogs.map(log => (
                  <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderRadius: '1.25rem', background: 'var(--bg-subtle)' }}>
                     <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: log.status === 'success' ? '#10B981' : '#EF4444' }} />
                        <div>
                           <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{log.action}</div>
                           <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{log.user} • {log.time}</div>
                        </div>
                     </div>
                     <ChevronRight size={16} color="var(--text-muted)" />
                  </div>
                ))}
             </div>
          </div>

          {/* Firewall & Access Control */}
          <div className="glass" style={{ padding: '2.5rem', borderRadius: '2.5rem', border: '1px solid var(--border)', background: 'var(--bg)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: '#EF444415', color: '#EF4444' }}>
                   <Shield size={20} />
                </div>
                <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>Pare-feu & Accès IP</h4>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ padding: '1.5rem', borderRadius: '1.5rem', background: '#F59E0B08', border: '1px dashed #F59E0B40', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                   <AlertTriangle size={24} color="#F59E0B" />
                   <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#F59E0B' }}>Mode Restriction Actif</div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#F59E0B' }}>Seules les adresses IP autorisées peuvent accéder à l'administration.</div>
                   </div>
                </div>
                <button className="btn-primary" style={{ padding: '1rem', borderRadius: '1.25rem', background: '#0F172A', borderColor: '#0F172A', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                   <Lock size={18} /> Gérer la Whitelist IP
                </button>
             </div>
          </div>
       </div>

    </motion.div>
  );
};

export default SecurityTab;
