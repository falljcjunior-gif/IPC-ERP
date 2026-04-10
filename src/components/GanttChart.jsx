import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const GanttChart = ({ tasks }) => {
  // Simple logic to determine a date range from tasks
  // For demo, we use a fixed 30-day window
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const currentMonth = "Avril 2026";

  const getStatusColor = (status) => {
    switch (status) {
      case 'Terminé': return '#10B981';
      case 'En cours': return '#3B82F6';
      case 'A faire': return '#64748B';
      case 'Urgent': return '#F43F5E';
      default: return 'var(--accent)';
    }
  };

  return (
    <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', overflowX: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h3 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
           <Clock size={20} color="var(--accent)" /> Timeline du Projet - {currentMonth}
        </h3>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: 8, height: 8, background: '#10B981', borderRadius: '50%' }}></div> Terminé</div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: 8, height: 8, background: '#3B82F6', borderRadius: '50%' }}></div> En cours</div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><div style={{ width: 8, height: 8, background: '#F43F5E', borderRadius: '50%' }}></div> Bloqué</div>
        </div>
      </div>

      <div style={{ minWidth: '800px' }}>
        {/* Header Days */}
        <div style={{ display: 'flex', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
          <div style={{ width: '200px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.8rem' }}>Tâches</div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
            {days.filter(d => d % 2 === 1).map(d => (
              <div key={d} style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', flex: 1 }}>{d}</div>
            ))}
          </div>
        </div>

        {/* Task Rows */}
        {(tasks || []).map((task, idx) => {
          // Mocking start/length for visual demo
          const start = (idx * 3) % 15;
          const length = 5 + (idx % 7);
          const progress = (task.statut === 'Terminé' ? 100 : (task.statut === 'En cours' ? 60 : 10));

          return (
            <div key={task.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ width: '200px', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.titre}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{String(task.id).slice(0, 8)}</span>
              </div>
              <div style={{ flex: 1, position: 'relative', height: '32px', background: 'var(--bg-subtle)', borderRadius: '16px', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0, x: `${(start / 30) * 100}%` }}
                  animate={{ width: `${(length / 30) * 100}%`, x: `${(start / 30) * 100}%` }}
                  transition={{ duration: 1, delay: idx * 0.1 }}
                  style={{
                    position: 'absolute',
                    top: '4px',
                    height: '24px',
                    background: getStatusColor(task.statut),
                    borderRadius: '12px',
                    boxShadow: `0 4px 12px ${getStatusColor(task.statut)}33`,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 8px',
                    overflow: 'hidden'
                  }}
                >
                   <div style={{ height: '100%', width: `${progress}%`, background: 'rgba(255,255,255,0.2)', position: 'absolute', top: 0, left: 0 }}></div>
                   <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'white', zIndex: 1, position: 'relative', whiteSpace: 'nowrap' }}>
                      {progress}%
                   </span>
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
         <button className="glass" style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', fontSize: '0.8rem', cursor: 'pointer', border: '1px solid var(--border)' }}>
            Précédent
         </button>
         <button className="glass" style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', fontSize: '0.8rem', cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--accent)10', color: 'var(--accent)' }}>
            Aujourd'hui
         </button>
         <button className="glass" style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', fontSize: '0.8rem', cursor: 'pointer', border: '1px solid var(--border)' }}>
            Suivant
         </button>
      </div>
    </div>
  );
};

export default GanttChart;
