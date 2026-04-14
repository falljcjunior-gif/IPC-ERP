import React from 'react';
import { motion } from 'framer-motion';
import { 
  Wrench, AlertTriangle, CheckCircle2, 
  Clock, Activity, Settings, 
  Power, Calendar, Thermometer, Gauge
} from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, scale: 0.98 }, show: { opacity: 1, scale: 1 } };

const MaintenanceTab = () => {
  const machines = [
    { id: 'MC-01', name: 'Presse Hydraulique #1', status: 'Optimal', temp: '42°C', cycle: 4500, nextMaint: '2026-05-10' },
    { id: 'MC-02', name: 'Mélangeur Automatique', status: 'Optimal', temp: '38°C', cycle: 8200, nextMaint: '2026-04-25' },
    { id: 'MC-03', name: 'Robot de Palettisation', status: 'Alerte', temp: '54°C', cycle: 12000, nextMaint: '2026-04-16' },
  ];

  const getStatusColor = (s) => (s === 'Optimal' ? '#10B981' : '#F59E0B');

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Maintenance Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {machines.map((m, i) => (
          <motion.div 
            key={m.id} 
            variants={item}
            className="glass" 
            style={{ padding: '2rem', borderRadius: '2rem', border: '1px solid var(--border)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
               <div style={{ background: `${getStatusColor(m.status)}15`, color: getStatusColor(m.status), padding: '12px', borderRadius: '1rem' }}>
                 <Wrench size={24} />
               </div>
               <div style={{ textAlign: 'right' }}>
                 <div style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Statut Santé</div>
                 <div style={{ color: getStatusColor(m.status), fontWeight: 900, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getStatusColor(m.status) }} />
                    {m.status}
                 </div>
               </div>
            </div>

            <h4 style={{ margin: '0 0 1.5rem 0', fontWeight: 900, fontSize: '1.1rem' }}>{m.name} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{m.id}</span></h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
               <div className="glass" style={{ padding: '1rem', borderRadius: '1.25rem', background: 'var(--bg-subtle)' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Température</div>
                  <div style={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1rem' }}>
                    <Thermometer size={14} color="#EF4444" /> {m.temp}
                  </div>
               </div>
               <div className="glass" style={{ padding: '1rem', borderRadius: '1.25rem', background: 'var(--bg-subtle)' }}>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px' }}>Cycles Total</div>
                  <div style={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1rem' }}>
                    <Gauge size={14} /> {m.cycle.toLocaleString()}
                  </div>
               </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', background: 'var(--bg-subtle)', borderRadius: '1.25rem' }}>
               <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>Prochaine Révision</div>
               <div style={{ fontSize: '0.85rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px' }}>
                 <Calendar size={14} /> {m.nextMaint}
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Maintenance History & Actions */}
      <div className="glass" style={{ padding: '2rem', borderRadius: '2rem', border: '1px solid var(--border)' }}>
        <h4 style={{ fontWeight: 900, fontSize: '1.1rem', marginBottom: '1.5rem' }}>Journal de Maintenance Préventive</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
           {[
             { date: '10 Avril 2026', task: 'Vidange huile hydraulique (Vérifiée)', machine: 'MC-01', type: 'Préventive' },
             { date: '08 Avril 2026', task: 'Remplacement capteur laser (Fait)', machine: 'MC-03', type: 'Corrective' },
           ].map((log, i) => (
             <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                   <div style={{ padding: '8px', borderRadius: '50%', background: log.type === 'Préventive' ? '#3B82F615' : '#EF444415' }}>
                      <Wrench size={16} color={log.type === 'Préventive' ? '#3B82F6' : '#EF4444'} />
                   </div>
                   <div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{log.task}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Machine : {log.machine} • {log.date}</div>
                   </div>
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.6 }}>{log.type}</div>
             </div>
           ))}
        </div>
      </div>
    </motion.div>
  );
};

export default MaintenanceTab;
