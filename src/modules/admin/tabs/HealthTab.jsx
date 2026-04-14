import React from 'react';
import { motion } from 'framer-motion';
import { 
  Database, RefreshCcw, HardDrive, Info, 
  Trash2, Download, Zap, ShieldCheck,
  Server, Activity, Clock
} from 'lucide-react';

const HealthTab = () => {
  const stats = [
    { label: 'État Base de Données', value: 'Optimal', icon: <Database size={20}/>, color: '#10B981' },
    { label: 'Temps de Réponse', value: '45ms', icon: <Activity size={20}/>, color: '#8B5CF6' },
    { label: 'Dernier Backup', value: 'Il y a 4h', icon: <Clock size={20}/>, color: '#3B82F6' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
       
       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {stats.map((stat, i) => (
            <div key={i} className="glass" style={{ padding: '2rem', borderRadius: '2rem', border: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
               <div style={{ padding: '12px', borderRadius: '14px', background: `${stat.color}15`, color: stat.color }}>
                  {stat.icon}
               </div>
               <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{stat.label}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>{stat.value}</div>
               </div>
            </div>
          ))}
       </div>

       <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2.5rem' }}>
          {/* Data Maintenance Hub */}
          <div className="glass" style={{ padding: '2.5rem', borderRadius: '2.5rem', border: '1px solid var(--border)', background: 'var(--bg)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--accent)10', color: 'var(--accent)' }}>
                   <HardDrive size={24} />
                </div>
                <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem' }}>Maintenance & Infrastructure</h4>
             </div>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ padding: '2rem', borderRadius: '2rem', background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <RefreshCcw size={20} color="#8B5CF6" />
                      <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>Cache Système</span>
                   </div>
                   <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Optimisez les performances en réinitialisant les métadonnées locales.</p>
                   <button className="btn-secondary" style={{ padding: '0.8rem', borderRadius: '1rem', fontWeight: 800, width: '100%' }}>Purger le Cache</button>
                </div>
                <div style={{ padding: '2rem', borderRadius: '2rem', background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Download size={20} color="#10B981" />
                      <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>Export Global</span>
                   </div>
                   <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Sauvegardez l'intégralité de la configuration au format JSON.</p>
                   <button className="btn-secondary" style={{ padding: '0.8rem', borderRadius: '1rem', fontWeight: 800, width: '100%' }}>Générer Export</button>
                </div>
             </div>
          </div>

          {/* System Versioning */}
          <div className="glass" style={{ padding: '2.5rem', borderRadius: '2.5rem', border: '1px solid var(--border)', background: 'var(--bg)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: '#3B82F615', color: '#3B82F6' }}>
                   <Server size={20} />
                </div>
                <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>Identité du Système</h4>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ padding: '1.25rem', borderRadius: '1.5rem', background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Version Plateforme</span>
                   <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#3B82F6' }}>v1.0.8-pro</span>
                </div>
                <div style={{ padding: '1.25rem', borderRadius: '1.5rem', background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Build Artifact</span>
                   <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#3B82F6' }}>#56560c89</span>
                </div>
                <div style={{ marginTop: 'auto', padding: '1.5rem', borderRadius: '1.5rem', background: '#EF444408', border: '1px dashed #EF444430', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                   <Trash2 size={24} color="#EF4444" />
                   <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#EF4444' }}>Danger Zone</div>
                      <button style={{ background: 'none', border: 'none', color: '#EF4444', fontWeight: 800, padding: 0, cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}>Réinitialisation Totale</button>
                   </div>
                </div>
             </div>
          </div>
       </div>

    </motion.div>
  );
};

export default HealthTab;
