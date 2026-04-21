import React, { useMemo } from 'react';

const TrelloCalendar = ({ tasks, onCardClick }) => {
  // Obtenir les 30 derniers jours et 30 prochains jours autour de la date actuelle
  const days = useMemo(() => {
    const list = [];
    const today = new Date();
    today.setDate(today.getDate() - 15); // Start 15 days ago for testing
    for(let i=0; i<35; i++) {
       const d = new Date(today);
       d.setDate(d.getDate() + i);
       list.push(d);
    }
    return list;
  }, []);

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '16px', background: 'white', overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#F8FAFC', borderBottom: '1px solid var(--border)', fontWeight: 700, color: '#64748B' }}>
         {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
           <div key={d} style={{ padding: '1rem', textAlign: 'center' }}>{d}</div>
         ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', minHeight: '600px' }}>
         {days.map((day, i) => {
            const dateStr = day.toISOString().split('T')[0];
            const dayTasks = tasks.filter(t => t.echeance && t.echeance.startsWith(dateStr));
            const isToday = new Date().toISOString().split('T')[0] === dateStr;

            return (
              <div key={i} style={{ padding: '0.5rem', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', minHeight: '120px', background: isToday ? '#F0FDF4' : 'transparent' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: isToday ? 800 : 500, color: isToday ? '#16A34A' : '#94A3B8', display: 'flex', justifyContent: 'flex-end', padding: '0.2rem' }}>
                  {day.getDate()} {day.toLocaleDateString('fr-FR', { month: 'short' })}
                </span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                   {dayTasks.map(t => (
                      <div 
                        key={t.id} 
                        onClick={() => onCardClick(t)}
                        style={{ background: '#8B5CF6', color: 'white', fontSize: '0.75rem', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                         {t.titre}
                      </div>
                   ))}
                </div>
              </div>
            );
         })}
      </div>
    </div>
  );
};

export default TrelloCalendar;
