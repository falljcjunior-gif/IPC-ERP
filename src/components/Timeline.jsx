import React from 'react';
import { motion } from 'framer-motion';
import { Clock, User, ArrowRight, MessageSquare, Tag, AlertCircle } from 'lucide-react';

const Timeline = ({ events }) => {
  if (!events || events.length === 0) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
      Aucun événement enregistré.
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
      {/* Vertical line mapping */}
      <div style={{ 
        position: 'absolute', 
        top: '0', 
        bottom: '0', 
        left: '11px', 
        width: '2px', 
        background: 'var(--border)', 
        opacity: 0.5 
      }} />

      {events.map((event, idx) => (
        <motion.div 
          key={idx}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1 }}
          style={{ display: 'flex', gap: '1.25rem', position: 'relative', zIndex: 1 }}
        >
          {/* Icon node */}
          <div style={{ 
            minWidth: '24px', 
            height: '24px', 
            borderRadius: '50%', 
            background: 'var(--bg)', 
            border: `2px solid ${event.color || 'var(--accent)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: event.color || 'var(--accent)' }} />
          </div>

          <div style={{ flex: 1, paddingTop: '0.1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{event.title}</span>
                <span style={{ 
                  fontSize: '0.7rem', 
                  padding: '1px 6px', 
                  borderRadius: '4px', 
                  background: 'var(--bg-subtle)', 
                  color: 'var(--text-muted)',
                  fontWeight: 600
                }}>
                  {event.tag}
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={12} /> {event.time}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
               {event.description}
            </p>
            {event.user && (
              <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>
                 <User size={12} /> {event.user}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default Timeline;
