import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Clock, Send, User, Tag, Mail, Info } from 'lucide-react';
import { useStore } from '../store';

const Chatter = ({ targetId, targetType }) => {
  const { data, addNote } = useStore();
  const [note, setNote] = useState('');
  const [filter, setFilter] = useState('all');

  const activities = (data.activities || [])
    .filter(a => a.targetId === targetId || (targetType && a.appId === targetType && a.targetId === targetId))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const [isTyping, setIsTyping] = useState(false);

  const filteredActivities = activities.filter(a => {
    if (filter === 'all') return true;
    return a.type === filter;
  });

  const handleSendNote = (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    addNote(targetId, targetType, note);
    setNote('');
    setIsTyping(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header Feed */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--nexus-secondary)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
          <MessageSquare size={20} color="var(--nexus-primary)" /> FLUX D'INTELLIGENCE
        </h3>
        <div style={{ display: 'flex', gap: '4px', background: 'var(--nexus-bg)', padding: '4px', borderRadius: '10px', border: '1px solid var(--nexus-border)' }}>
          {['all', 'note', 'log'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 12px', fontSize: '0.65rem', fontWeight: 900, borderRadius: '8px', border: 'none', background: filter === f ? 'white' : 'transparent', color: filter === f ? 'var(--nexus-primary)' : 'var(--nexus-text-muted)', cursor: 'pointer', boxShadow: filter === f ? 'var(--shadow-nexus)' : 'none', textTransform: 'uppercase' }}>
              {f === 'all' ? 'Tout' : f === 'note' ? 'Notes' : 'Audit'}
            </button>
          ))}
        </div>
      </div>

      {/* Note Input */}
      <div className="nexus-card" style={{ padding: '1.5rem', background: 'white' }}>
        <form onSubmit={handleSendNote} style={{ position: 'relative' }}>
          <textarea
            value={note}
            onChange={(e) => { setNote(e.target.value); setIsTyping(e.target.value !== ''); }}
            placeholder="Contribuer au dossier Nexus..."
            style={{ width: '100%', padding: '1.25rem', paddingRight: '4rem', borderRadius: '14px', border: '2px solid var(--nexus-border)', background: 'var(--nexus-bg)', color: 'var(--nexus-text)', fontSize: '0.9rem', minHeight: '100px', resize: 'none', outline: 'none', fontWeight: 700 }}
          />
          <button type="submit" disabled={!note.trim()} style={{ position: 'absolute', right: '15px', bottom: '15px', width: '45px', height: '45px', borderRadius: '14px', background: note.trim() ? 'var(--nexus-primary)' : 'var(--nexus-border)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition-nexus)' }}>
            <Send size={20} />
          </button>
        </form>
        <AnimatePresence>
          {isTyping && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ fontSize: '0.7rem', color: 'var(--nexus-primary)', fontWeight: 900, marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--nexus-primary)' }} />
                ANALYSE EN COURS...
             </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Feed List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <AnimatePresence>
          {filteredActivities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--nexus-text-muted)', fontSize: '0.8rem', fontWeight: 800 }}>
              AUCUNE ACTIVITÉ DANS LE FLUX NEXUS
            </div>
          ) : (
            filteredActivities.map((act) => (
              <motion.div key={act.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="nexus-card" style={{ padding: '1.5rem', background: act.type === 'note' ? 'white' : 'var(--nexus-bg)', border: act.type === 'note' ? '1px solid var(--nexus-primary-glow)' : '1px solid var(--nexus-border)', boxShadow: act.type === 'note' ? 'var(--shadow-nexus)' : 'none' }}>
                <div style={{ display: 'flex', gap: '1.25rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: act.type === 'note' ? 'var(--nexus-primary)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: act.type === 'note' ? 'white' : 'var(--nexus-text-muted)', flexShrink: 0 }}>
                    {act.type === 'note' ? <Tag size={18} /> : <Clock size={18} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 900, fontSize: '0.9rem', color: 'var(--nexus-secondary)' }}>{act.user}</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--nexus-text-muted)' }}>{new Date(act.timestamp).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: '0.95rem', color: 'var(--nexus-text)', lineHeight: 1.6, fontWeight: act.type === 'note' ? 700 : 500 }}>
                      <span style={{ fontWeight: 900, color: 'var(--nexus-primary)', fontSize: '0.65rem', textTransform: 'uppercase', marginRight: '8px' }}>[{act.action}]</span>
                      {act.detail}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Chatter;
