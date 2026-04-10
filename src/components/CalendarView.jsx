import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Video, Calendar as CalIcon } from 'lucide-react';

const CalendarView = ({ events = [] }) => {
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const getDayEvents = (day) => {
    // Mocking logic to distribute events across the calendar
    if (day === 5) return [{ id: 1, type: 'CRM', title: 'Démo Client IPC', time: '10:00' }];
    if (day === 12) return [{ id: 2, type: 'PROD', title: 'Lancement Batch #4', time: '09:00' }];
    if (day === 15) return [
      { id: 3, type: 'RH', title: 'Entretien Annuel', time: '14:30' },
      { id: 4, type: 'MEET', title: 'Brainstorming Séquences', time: '16:00' }
    ];
    return [];
  };

  const getTagColor = (type) => {
    switch (type) {
      case 'CRM': return '#3B82F6';
      case 'PROD': return '#F59E0B';
      case 'RH': return '#10B981';
      case 'MEET': return '#8B5CF6';
      default: return 'var(--accent)';
    }
  };

  return (
    <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Avril 2026</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>12 événements ce mois-ci</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="glass" style={{ p: '0.5rem', borderRadius: '0.5rem' }}><ChevronLeft size={18} /></button>
          <button className="glass" style={{ p: '0.5rem', borderRadius: '0.5rem' }}><ChevronRight size={18} /></button>
          <button className="btn btn-primary" style={{ marginLeft: '1rem', padding: '0.6rem 1.2rem' }}>Aujourd'hui</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', background: 'var(--border)', borderRadius: '1rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
        {weekDays.map(wd => (
          <div key={wd} style={{ background: 'var(--bg-subtle)', padding: '0.75rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            {wd}
          </div>
        ))}
        {daysInMonth.map(day => (
          <div key={day} style={{ background: 'var(--bg)', minHeight: '120px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: day === 9 ? 'var(--accent)' : 'var(--text)' }}>
              {day}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {getDayEvents(day).map(ev => (
                <motion.div
                  key={ev.id}
                  whileHover={{ scale: 1.02 }}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    background: `${getTagColor(ev.type)}15`,
                    borderLeft: `3px solid ${getTagColor(ev.type)}`,
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    color: getTagColor(ev.type),
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '0.6rem', opacity: 0.8 }}>{ev.time}</div>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarView;
