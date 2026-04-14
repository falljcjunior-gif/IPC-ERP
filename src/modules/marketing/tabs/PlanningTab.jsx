import React from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Clock, Calendar as CalendarIcon, Filter, 
  ChevronLeft, ChevronRight, Square, Camera, Briefcase, Smartphone
} from 'lucide-react';
import TabBar from '../components/TabBar';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } };

const PlanningTab = ({ posts, setModalMode, setIsModalOpen }) => {
  const getNetworkIcon = (plateforme) => {
    switch(plateforme) {
      case 'Facebook': return <Square size={10} color="#1877F2" fill="#1877F2" />;
      case 'Instagram': return <Camera size={10} color="#E4405F" />;
      case 'LinkedIn': return <Briefcase size={10} color="#0A66C2" fill="#0A66C2" />;
      case 'TikTok': return <Smartphone size={10} color="#000000" />;
      default: return null;
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Calendar Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <h4 style={{ fontWeight: 900, fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarIcon size={22} color="var(--accent)" /> Calendrier de Publication
          </h4>
          <div className="glass" style={{ display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '12px' }}>
            <button className="glass" style={{ padding: '6px', borderRadius: '8px', border: 'none' }}><ChevronLeft size={16} /></button>
            <span style={{ padding: '0 1rem', fontSize: '0.85rem', fontWeight: 800 }}>Avril 2026</span>
            <button className="glass" style={{ padding: '6px', borderRadius: '8px', border: 'none' }}><ChevronRight size={16} /></button>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="glass" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '0.9rem', fontSize: '0.8rem', fontWeight: 700 }}>
            <Filter size={16} /> Filtres
          </button>
          <button className="btn-primary" onClick={() => { setModalMode('posts'); setIsModalOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1.5rem', borderRadius: '1rem', fontWeight: 800 }}>
            <Plus size={20} /> Programmer un Post
          </button>
        </div>
      </div>

      <motion.div variants={item} className="glass" style={{ padding: '2rem', borderRadius: '2rem', minHeight: '600px', border: '1px solid var(--border)' }}>
        {/* Professional Calendar Grid */}
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', 
          background: 'var(--border)', borderRadius: '1.5rem', overflow: 'hidden', 
          border: '1px solid var(--border)', boxShadow: '0 15px 35px -10px rgba(0,0,0,0.05)' 
        }}>
          {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
            <div key={d} style={{ 
              background: 'var(--bg-subtle)', padding: '1rem', textAlign: 'center', 
              fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', 
              letterSpacing: '1px', color: 'var(--text-muted)' 
            }}>{d}</div>
          ))}
          {Array(35).fill(null).map((_, i) => {
            const dayNum = i - 2 + 3; // Starts near April 14
            const isToday = dayNum === 14; 
            return (
              <div key={i} style={{ 
                background: isToday ? 'var(--bg-subtle)' : 'var(--bg)', 
                minHeight: '140px', padding: '0.75rem', 
                borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', 
                position: 'relative', transition: '0.2s', cursor: 'pointer'
              }}>
                <div style={{ 
                  fontSize: '0.85rem', fontWeight: 900, 
                  color: isToday ? 'var(--accent)' : dayNum > 0 && dayNum <= 31 ? 'var(--text)' : 'var(--text-muted)', 
                  opacity: dayNum > 0 && dayNum <= 31 ? 1 : 0.2,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span>{dayNum > 0 && dayNum <= 31 ? dayNum : ''}</span>
                  {isToday && <div style={{ fontSize: '0.6rem', background: 'var(--accent)', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>AUJOURD'HUI</div>}
                </div>

                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {dayNum > 0 && dayNum <= 31 && posts.filter(p => new Date(p.date_publication).getDate() === dayNum).map((post, pi) => (
                    <motion.div key={pi} whileHover={{ y: -2 }}
                      style={{ 
                        background: 'white', padding: '0.6rem', borderRadius: '0.75rem', 
                        fontSize: '0.75rem', borderLeft: `3px solid var(--accent)`,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.02)', border: '1px solid var(--border)'
                      }}>
                      <div style={{ fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }}>{post.titre}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.6 }}>
                          <Clock size={10} /> {new Date(post.date_publication).getHours()}h00
                        </div>
                        {getNetworkIcon(post.plateforme)}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Calendar Legend */}
        <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem', padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '1rem', width: 'fit-content', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--accent)' }} /> Programmé
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#10B981' }} /> Publié
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 700 }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#F59E0B' }} /> Brouillon
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PlanningTab;
