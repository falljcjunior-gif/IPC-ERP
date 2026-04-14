import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, Clock, MapPin, Users, Star, 
  Video, Coffee, PartyPopper, Zap, LayoutGrid
} from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

const EventsTab = ({ data }) => {
  const events = [
    {
      id: 1, title: "Town Hall : Vision 2026",
      date: "24 Avril", time: "10:00 - 11:30", type: "Remote",
      category: "Stratégie", attendees: 120, color: "#8B5CF6",
      icon: <Video size={20} />
    },
    {
      id: 2, title: "Afterwork : Équipe Industrial",
      date: "18 Avril", time: "18:30 - 20:30", type: "On-site",
      category: "Détente", attendees: 25, color: "#F59E0B",
      icon: <Coffee size={20} />
    },
    {
      id: 3, title: "Lancement Hub Supply Chain",
      date: "20 Avril", time: "09:00 - 10:00", type: "Hybrid",
      category: "Opérations", attendees: 45, color: "#10B981",
      icon: <PartyPopper size={20} />
    }
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
             <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem', color: '#0F172A' }}>IPC Life & Événements</h3>
             <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Restez synchronisés avec la vie sociale et les jalons de l'entreprise.</p>
          </div>
          <button className="btn-secondary" style={{ padding: '0.8rem 1.5rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 800 }}>
             <Calendar size={18} /> Voir le Calendrier Complet
          </button>
       </div>

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
                  {event.icon}
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
                  <button className="btn-primary" style={{ padding: '0.6rem 1.25rem', borderRadius: '1rem', background: '#8B5CF6', borderColor: '#8B5CF6', fontSize: '0.8rem', fontWeight: 900 }}>Participer</button>
               </div>
            </motion.div>
          ))}
       </div>
    </motion.div>
  );
};

export default EventsTab;
