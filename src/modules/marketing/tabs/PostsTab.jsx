import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Clock, Calendar, Square, Camera, Briefcase, Smartphone, Globe, Heart, Share2 } from 'lucide-react';

const NETWORK = {
  Facebook:  { icon: <Square size={11} color="#1877F2" fill="#1877F2" />, color: '#1877F2' },
  Instagram: { icon: <Camera size={11} color="#E4405F" />, color: '#E4405F' },
  LinkedIn:  { icon: <Briefcase size={11} color="#0A66C2" />, color: '#0A66C2' },
  TikTok:    { icon: <Smartphone size={11} color="#000" />, color: '#010101' },
  Autre:     { icon: <Globe size={11} color="#6366F1" />, color: '#6366F1' },
};

const STATUS_STYLE = {
  'Publié':    { bg: '#10B98120', color: '#10B981' },
  'Programmé': { bg: '#3B82F620', color: '#3B82F6' },
  'Brouillon': { bg: '#F59E0B20', color: '#F59E0B' },
};

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const PostsTab = ({ posts, setModalMode, setIsModalOpen }) => {
  const [view, setView] = useState('calendar'); // 'calendar' | 'list'

  const getDay = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).getDate();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['calendar', 'list'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '0.5rem 1rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem',
              background: view === v ? 'var(--accent)' : 'var(--bg-subtle)', color: view === v ? 'white' : 'var(--text-muted)', transition: 'all 0.2s'
            }}>{v === 'calendar' ? '📅 Calendrier' : '☰ Liste'}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)' }}>Avril 2026</div>
          <button onClick={() => { setModalMode('posts'); setIsModalOpen(true); }} className="btn-primary"
            style={{ padding: '0.6rem 1.25rem', borderRadius: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.82rem' }}>
            <Plus size={16} /> Post
          </button>
        </div>
      </div>

      {view === 'calendar' ? (
        <div className="glass" style={{ borderRadius: '1.5rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
          {/* Days header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
            {DAYS.map(d => (
              <div key={d} style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{d}</div>
            ))}
          </div>
          {/* Calendar grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {Array(35).fill(null).map((_, i) => {
              const dayNum = i - 1; // April 2026 starts on Wednesday (index 2), adjust as needed
              const displayDay = dayNum + 2; // shift so April 1 = Wednesday
              const isValid = displayDay >= 1 && displayDay <= 30;
              const today = displayDay === 14;
              const dayPosts = isValid ? posts.filter(p => getDay(p.date_publication) === displayDay) : [];

              return (
                <div key={i} style={{
                  minHeight: '110px', padding: '0.6rem',
                  borderRight: (i + 1) % 7 !== 0 ? '1px solid var(--border)' : 'none',
                  borderBottom: i < 28 ? '1px solid var(--border)' : 'none',
                  background: today ? 'var(--bg-subtle)' : 'transparent'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: today ? 900 : 600,
                      color: today ? 'var(--accent)' : isValid ? 'var(--text)' : 'var(--border)', opacity: isValid ? 1 : 0.3 }}>
                      {isValid ? displayDay : ''}
                    </span>
                    {today && <span style={{ fontSize: '0.55rem', background: 'var(--accent)', color: 'white', padding: '1px 5px', borderRadius: '4px', fontWeight: 900 }}>AUJ</span>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {dayPosts.map((post, pi) => {
                      const net = NETWORK[post.plateforme] || NETWORK.Autre;
                      const st = STATUS_STYLE[post.statut] || STATUS_STYLE['Brouillon'];
                      return (
                        <motion.div key={pi} whileHover={{ scale: 1.02 }}
                          style={{ padding: '4px 6px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700,
                            background: st.bg, color: st.color, borderLeft: `2px solid ${net.color}`,
                            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', cursor: 'pointer' }}
                          title={post.titre}>
                          {net.icon} {post.titre}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '1.5rem', background: 'var(--bg-subtle)' }}>
            {Object.entries(STATUS_STYLE).map(([label, s]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', fontWeight: 700 }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: s.color }} /> {label}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="glass" style={{ borderRadius: '1.5rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
          {posts.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Aucun post. Cliquez "+ Post" pour en programmer un.
            </div>
          )}
          {posts.map((post, i) => {
            const net = NETWORK[post.plateforme] || NETWORK.Autre;
            const st = STATUS_STYLE[post.statut] || STATUS_STYLE['Brouillon'];
            return (
              <div key={post.id} style={{ padding: '1.25rem 1.75rem', borderTop: i > 0 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ background: `${net.color}15`, padding: '10px', borderRadius: '10px', color: net.color }}>
                  {React.cloneElement(net.icon, { size: 18 })}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{post.titre}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={11} /> {post.date_publication?.replace('T', ' à ')}
                    {(post.likes > 0 || post.partages > 0) && (
                      <>
                        <span>·</span><Heart size={11} color="#EC4899" /> {post.likes}
                        <Share2 size={11} color="#6366F1" /> {post.partages}
                      </>
                    )}
                  </div>
                </div>
                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 800, background: st.bg, color: st.color }}>
                  {post.statut}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PostsTab;
