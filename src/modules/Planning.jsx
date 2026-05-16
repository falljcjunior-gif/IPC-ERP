import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar as CalIcon, ChevronLeft, ChevronRight,
  Filter, Plus, Briefcase, Users, Truck, Factory
} from 'lucide-react';
import { useStore } from '../store';
import RecordModal from '../components/RecordModal';
import '../components/GlobalDashboard.css';

const EVENT_COLORS = { project: '#3B82F6', fleet: '#F59E0B', hr: '#8B5CF6', production: '#10B981' };

const LEGENDS = [
  { icon: <Briefcase size={14} />, label: 'Projets',    color: '#3B82F6' },
  { icon: <Truck size={14} />,     label: 'Flotte',     color: '#F59E0B' },
  { icon: <Users size={14} />,     label: 'RH',         color: '#8B5CF6' },
  { icon: <Factory size={14} />,   label: 'Production', color: '#10B981' },
];

const Planning = () => {
  const { data, addRecord } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentMonth = currentDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase());
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === currentDate.getFullYear() && today.getMonth() === currentDate.getMonth();

  const goToPrevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  // Aggregate events from all modules
  const events = useMemo(() => {
    const result = [];
    const yr = currentDate.getFullYear();
    const mo = String(currentDate.getMonth() + 1).padStart(2, '0');
    const prefix = `${yr}-${mo}`;
    // Planning-specific events
    (data?.planning?.events || []).forEach(e => { if (e.date?.startsWith(prefix)) result.push({ ...e, color: EVENT_COLORS[e.type] || '#6366F1' }); });
    // Projects
    (data?.projects?.projects || []).forEach(p => { if (p.dateDebut?.startsWith(prefix)) result.push({ id: `p-${p.id}`, date: p.dateDebut, title: p.nom || p.title, color: EVENT_COLORS.project }); });
    // HR leaves
    (data?.hr?.leaves || []).forEach(l => { if (l.dateDebut?.startsWith(prefix)) result.push({ id: `l-${l.id}`, date: l.dateDebut, title: `Congé — ${l.employeNom || ''}`, color: EVENT_COLORS.hr }); });
    return result;
  }, [data, currentDate]);

  return (
    <div className="luxury-dashboard-container" style={{ padding: '3rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '3rem' }}>

      {/* ── HEADER ── */}
      <div className="luxury-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div className="luxury-subtitle">Coordination Unifiée des Ressources</div>
          <h1 className="luxury-title">Planning <strong>Global</strong></h1>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {/* Month Navigator */}
          <div className="luxury-widget" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '0.75rem 1.5rem' }}>
            <button onClick={goToPrevMonth} style={{ padding: '0.4rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer', background: '#f1f5f9', display: 'flex' }}><ChevronLeft size={18} /></button>
            <span style={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b', minWidth: '130px', textAlign: 'center' }}>{currentMonth}</span>
            <button onClick={goToNextMonth} style={{ padding: '0.4rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer', background: '#f1f5f9', display: 'flex' }}><ChevronRight size={18} /></button>
          </div>

          <button className="luxury-widget" style={{ padding: '0.9rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', border: 'none', cursor: 'pointer', fontWeight: 700, color: '#475569', borderRadius: '1.25rem', background: 'rgba(255,255,255,0.9)' }}>
            <Filter size={18} /> Filtrer
          </button>
          <button onClick={() => setIsModalOpen(true)} className="luxury-widget" style={{ padding: '0.9rem 1.75rem', background: '#111827', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem', border: 'none', cursor: 'pointer', fontWeight: 700, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)', borderRadius: '1.5rem' }}>
            <Plus size={18} /> Nouvel Événement
          </button>
        </div>
      </div>

      {/* ── LEGEND ── */}
      <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap' }}>
        {LEGENDS.map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', fontWeight: 700, color: '#64748b' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: l.color }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: l.color }}>{l.icon}</div>
            {l.label}
          </div>
        ))}
      </div>

      {/* ── CALENDAR GRID ── */}
      <div className="luxury-widget" style={{ borderRadius: '2rem', overflow: 'hidden', padding: 0 }}>
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
            <div key={d} style={{ background: '#fafafa', padding: '1.25rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9' }}>{d}</div>
          ))}
        </div>

        {/* Days */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {days.map(day => {
            const yr = currentDate.getFullYear();
            const mo = String(currentDate.getMonth() + 1).padStart(2, '0');
            const dateStr = `${yr}-${mo}-${day.toString().padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.date === dateStr || e.date?.startsWith(dateStr));
            const isToday = isCurrentMonth && day === today.getDate();

            return (
              <div key={day} style={{ minHeight: '120px', padding: '1rem', borderRight: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', background: isToday ? 'rgba(16,185,129,0.02)' : 'white' }}>
                <div style={{
                  fontSize: '0.9rem', fontWeight: isToday ? 900 : 600, marginBottom: '0.5rem',
                  color: isToday ? 'white' : '#94a3b8',
                  width: isToday ? '28px' : 'auto', height: isToday ? '28px' : 'auto',
                  background: isToday ? '#10B981' : 'transparent',
                  borderRadius: isToday ? '50%' : 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {day}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {dayEvents.map(event => (
                    <motion.div
                      key={event.id}
                      whileHover={{ scale: 1.02, x: 2 }}
                      style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '6px', background: `${event.color}15`, color: event.color, borderLeft: `3px solid ${event.color}`, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
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

      <RecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouvel Événement Planning"
        fields={[
          { name: 'title', label: 'Titre', type: 'text', required: true },
          { name: 'date', label: 'Date', type: 'date', required: true },
          { name: 'type', label: 'Type', type: 'select', options: [
            { value: 'project', label: 'Projet' },
            { value: 'hr', label: 'RH' },
            { value: 'fleet', label: 'Flotte' },
            { value: 'production', label: 'Production' },
          ]},
          { name: 'description', label: 'Description', type: 'textarea' },
        ]}
        onSave={(formData) => {
          addRecord('planning', 'events', formData);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default React.memo(Planning);
