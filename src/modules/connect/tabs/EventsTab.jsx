import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, MapPin, Users, Star, 
  Video, Coffee, PartyPopper, Zap, LayoutGrid, X, Trash2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useBusiness } from '../../../BusinessContext';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

const EventsTab = ({ data }) => {
  const { participateInEvent, addHint, deleteRecord } = useBusiness();
  const [showCalendar, setShowCalendar] = useState(false);
  const [calDate, setCalDate] = useState(new Date());

  const events = data?.connect?.events || [];

  const handleParticipate = (id) => {
    participateInEvent(id);
  };

  const handleDelete = (id) => {
    deleteRecord('connect', 'events', id);
    addHint({ title: "Événement supprimé", message: "L'événement a été retiré de votre agenda.", type: 'info' });
  };

  // Calendar helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay: firstDay === 0 ? 6 : firstDay - 1, daysInMonth };
  };
  const { firstDay, daysInMonth } = getDaysInMonth(calDate);
  const monthName = calDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
             <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem', color: '#0F172A' }}>IPC Life & Événements</h3>
             <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Restez synchronisés avec la vie sociale et les jalons de l'entreprise.</p>
          </div>
          <button onClick={() => setShowCalendar(true)} className="btn-secondary" style={{ padding: '0.8rem 1.5rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 800, border: '1px solid var(--border)', background: 'white', cursor: 'pointer' }}>
             <Calendar size={18} /> Voir le Calendrier Complet
          </button>
       </div>

       {/* Full Calendar Modal */}
       <AnimatePresence>
         {showCalendar && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
             onClick={e => e.target === e.currentTarget && setShowCalendar(false)}>
             <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
               style={{ background: 'var(--bg)', borderRadius: '2rem', padding: '2.5rem', width: '560px', maxWidth: '95vw', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                 <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.3rem' }}>Calendrier IPC Life</h3>
                 <button onClick={() => setShowCalendar(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
               </div>
               {/* Month Nav */}
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                 <button onClick={() => setCalDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '0.5rem 0.75rem', cursor: 'pointer' }}><ChevronLeft size={16} /></button>
                 <span style={{ fontWeight: 900, fontSize: '1rem', textTransform: 'capitalize' }}>{monthName}</span>
                 <button onClick={() => setCalDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '0.5rem 0.75rem', cursor: 'pointer' }}><ChevronRight size={16} /></button>
               </div>
               {/* Day Labels */}
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
                 {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
                   <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', padding: '0.5rem 0' }}>{d}</div>
                 ))}
               </div>
               {/* Day Grid */}
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                 {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                 {Array.from({ length: daysInMonth }).map((_, i) => {
                   const day = i + 1;
                   const isToday = new Date().getDate() === day && new Date().getMonth() === calDate.getMonth() && new Date().getFullYear() === calDate.getFullYear();
                   return (
                     <div key={day} style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: isToday ? '#8B5CF6' : 'transparent', color: isToday ? 'white' : 'var(--text)', fontWeight: isToday ? 900 : 600, fontSize: '0.85rem', cursor: 'default' }}>
                       {day}
                     </div>
                   );
                 })}
               </div>
               {/* Events list */}
               <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                 <h4 style={{ margin: '0 0 1rem 0', fontWeight: 900, fontSize: '0.9rem' }}>Événements ce mois</h4>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                   {events.map(ev => (
                     <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderRadius: '1rem', background: 'var(--bg-subtle)' }}>
                       <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: ev.color, flexShrink: 0 }} />
                       <div style={{ flex: 1 }}>
                         <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{ev.title}</div>
                         <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ev.date} • {ev.time}</div>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             </motion.div>
           </motion.div>
         )}
       </AnimatePresence>

       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {events.map(event => (
            <motion.div 
              key={event.id}
              variants={item}
              whileHover={{ y: -5 }}
              className="glass"
              style={{ padding: '2.5rem', borderRadius: '2.5rem', border: '1px solid var(--border)', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}
            >
               <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: `${event.color}08`, borderRadius: '0 0 0 100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: event.color }}>
                  {event.category === 'Stratégie' ? <Video size={20} /> : event.category === 'Détente' ? <Coffee size={20} /> : event.category === 'Opérations' ? <PartyPopper size={20} /> : <Star size={20} />}
               </div>

               <div style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: event.color, fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>
                     <Zap size={14} /> {event.category}
                  </div>
                  <h4 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#0F172A', lineHeight: 1.2 }}>{event.title}</h4>
               </div>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                     <Calendar size={18} color="#8B5CF6" /> {event.date}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                     <Clock size={18} color="#8B5CF6" /> {event.time}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
                     <MapPin size={18} color="#8B5CF6" /> {event.type}
                  </div>
               </div>

               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     <div style={{ display: 'flex', marginLeft: '0.5rem' }}>
                        {[1,2,3].map(i => (
                          <div key={i} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--bg-subtle)', border: '2px solid white', marginLeft: '-10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 900 }}>{i}</div>
                        ))}
                     </div>
                     <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>+{event.attendees} participants</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => handleDelete(event.id)}
                      style={{ padding: '0.6rem', borderRadius: '0.8rem', background: '#FEE2E2', color: '#EF4444', border: 'none', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Supprimer l'événement">
                      <Trash2 size={16} />
                    </button>
                    <button 
                      onClick={() => !event.participated && handleParticipate(event.id)}
                      className="btn-primary" 
                      style={{ padding: '0.6rem 1.25rem', borderRadius: '1rem', background: event.participated ? '#10B981' : '#8B5CF6', borderColor: event.participated ? '#10B981' : '#8B5CF6', fontSize: '0.8rem', fontWeight: 900, cursor: event.participated ? 'default' : 'pointer' }}>
                      {event.participated ? "Inscrit" : "Participer"}
                    </button>
                  </div>
               </div>
            </motion.div>
          ))}
       </div>
    </motion.div>
  );
};

export default EventsTab;
