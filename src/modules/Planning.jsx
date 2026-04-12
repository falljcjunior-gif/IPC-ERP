import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar as CalIcon, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Plus, 
  Clock, 
  Briefcase, 
  Users, 
  Truck, 
  Factory,
  CheckCircle2
} from 'lucide-react';

const Planning = () => {
  const [currentMonth] = useState('Avril 2026');
  
  const events = [
    { id: 1, title: 'Lancement Projet X', date: '2026-04-12', type: 'projet', color: '#3B82F6' },
    { id: 2, title: 'Maintenance Van #02', date: '2026-04-15', type: 'flotte', color: '#F59E0B' },
    { id: 3, title: 'Congés Marie L.', date: '2026-04-18', type: 'rh', color: '#8B5CF6' },
    { id: 4, title: 'Prod OF-2026-001', date: '2026-04-12', type: 'prod', color: '#10B981' },
    { id: 5, title: 'Revue Trimestrielle', date: '2026-04-20', type: 'management', color: '#EC4899' },
  ];

  // Simplified calendar grid generation for demo
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div style={{ padding: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Planning Global</h1>
          <p style={{ color: 'var(--text-muted)' }}>Coordination unifiée des ressources et activités IPC.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 1rem', borderRadius: '0.8rem' }}>
             <button className="btn" style={{ padding: '0.25rem' }}><ChevronLeft size={18} /></button>
             <span style={{ fontWeight: 800 }}>{currentMonth}</span>
             <button className="btn" style={{ padding: '0.25rem' }}><ChevronRight size={18} /></button>
          </div>
          <button className="glass" style={{ padding: '0.75rem 1.25rem', borderRadius: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={18} /> Filtrer
          </button>
          <button className="btn btn-primary">
            <Plus size={18} /> Nouvel Événement
          </button>
        </div>
      </div>

      <div className="grid grid-4" style={{ gap: '1.25rem', marginBottom: '2.5rem' }}>
         {[
           { icon: <Briefcase size={16} />, label: 'Projets', color: '#3B82F6' },
           { icon: <Truck size={16} />, label: 'Flotte', color: '#F59E0B' },
           { icon: <Users size={16} />, label: 'RH', color: '#8B5CF6' },
           { icon: <Factory size={16} />, label: 'Production', color: '#10B981' },
         ].map(legend => (
           <div key={legend.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: legend.color }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>{legend.icon} {legend.label}</div>
           </div>
         ))}
      </div>

      <div className="glass" style={{ borderRadius: '1.5rem', padding: '1rem', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border)' }}>
           {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
             <div key={d} style={{ background: 'var(--bg-subtle)', padding: '1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>{d}</div>
           ))}
           {days.map(day => {
             const dateStr = `2026-04-${day.toString().padStart(2, '0')}`;
             const dayEvents = events.filter(e => e.date === dateStr);
             
             return (
               <div key={day} style={{ background: 'var(--bg)', minHeight: '120px', padding: '0.75rem', border: '0.5px solid var(--border)' }}>
                 <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', opacity: 0.6 }}>{day}</div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {dayEvents.map(event => (
                      <motion.div
                        key={event.id}
                        whileHover={{ scale: 1.02 }}
                        style={{ 
                          fontSize: '0.65rem', 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          background: `${event.color}15`, 
                          color: event.color,
                          borderLeft: `3px solid ${event.color}`,
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {event.title}
                      </motion.div>
                    ))}
                 </div>
               </div>
             );
           })}
        </div>
      </div>
    </div>
  );
};

export default Planning;
