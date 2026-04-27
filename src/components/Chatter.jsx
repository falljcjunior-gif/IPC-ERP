import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Clock, Send, User, Tag, Mail, Info } from 'lucide-react';
import { useStore } from '../store';

const Chatter = ({ targetId, targetType }) => {
  const { data, addNote } = useStore();
  const [note, setNote] = useState('');
  const [filter, setFilter] = useState('all'); // all, notes, logs

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: 'var(--bg-subtle)', borderRadius: '1.5rem', padding: '1.5rem', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={18} color="var(--accent)" /> Intelligence Feed 
          <span style={{ fontSize: '0.65rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px', background: '#10B98115', padding: '2px 8px', borderRadius: '4px' }}>
             <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} /> LIVE
          </span>
        </h3>
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg)', padding: '2px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          {['all', 'note', 'log'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '4px 8px',
                fontSize: '0.7rem',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                background: filter === f ? 'var(--accent)' : 'transparent',
                color: filter === f ? 'white' : 'var(--text-muted)',
                cursor: 'pointer',
                textTransform: 'uppercase'
              }}
            >
              {f === 'all' ? 'Tout' : f === 'note' ? 'Annotations' : 'Audit'}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSendNote} style={{ position: 'relative' }}>
        <textarea
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            if (!isTyping) setIsTyping(true);
            if (e.target.value === '') setIsTyping(false);
          }}
          onBlur={() => setIsTyping(false)}
          placeholder="Contribuer à l'intelligence collective..."
          style={{
            width: '100%',
            padding: '1rem',
            paddingRight: '3.5rem',
            borderRadius: '1rem',
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--text)',
            fontSize: '0.88rem',
            minHeight: '80px',
            resize: 'none',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
        />
        <button
          type="submit"
          disabled={!note.trim()}
          style={{
            position: 'absolute',
            right: '10px',
            bottom: '10px',
            padding: '8px',
            borderRadius: '50%',
            background: note.trim() ? 'var(--accent)' : 'var(--bg-subtle)',
            color: 'white',
            border: 'none',
            cursor: note.trim() ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Send size={16} />
        </button>
      </form>

      <AnimatePresence>
        {isTyping && (
           <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '-0.5rem' }}>
              <div style={{ display: 'flex', gap: '2px' }}>
                 {[1, 2, 3].map(i => <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }} style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent)' }} />)}
              </div>
              Vous êtes en train d'écrire...
           </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <AnimatePresence>
          {filteredActivities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Aucune activité enregistrée.
            </div>
          ) : (
            filteredActivities.map((act) => (
              <motion.div
                key={act.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                layout
                style={{ 
                  display: 'flex', 
                  gap: '1rem', 
                  padding: '1rem', 
                  background: act.type === 'note' ? 'var(--bg)' : 'transparent', 
                  borderRadius: '1rem',
                  border: act.type === 'note' ? '1px solid var(--accent)30' : 'none'
                }}
              >
                <div style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  background: act.type === 'note' ? 'var(--accent)20' : 'var(--bg)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: act.type === 'note' ? 'var(--accent)' : 'var(--text-muted)',
                  flexShrink: 0
                }}>
                  {act.type === 'note' ? <Tag size={14} /> : <Clock size={14} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{act.user}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {new Date(act.timestamp).toLocaleDateString()} {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.88rem', color: act.type === 'note' ? 'var(--text)' : 'var(--text-muted)', lineHeight: 1.4 }}>
                    <span style={{ fontWeight: 700, marginRight: '6px', color: 'var(--accent)', textTransform: 'uppercase', fontSize: '0.65rem' }}>
                      {act.action}:
                    </span>
                    {act.detail}
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
