import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Phone, Video, Search, Filter, MoreHorizontal, 
  CheckCheck, Clock, ShieldCheck, Zap, UserPlus 
} from 'lucide-react';
import Chip from '../components/Chip';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } };

const InboxTab = ({ messages }) => {
  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem', height: '700px' }}>
      {/* Threads List - Enhanced UX */}
      <div className="glass" style={{ borderRadius: '2rem', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)' }}>
        <div style={{ padding: '1.75rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>Social Inbox</h4>
            <div style={{ background: 'var(--accent)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 900 }}>3 Nouveaux</div>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="glass" placeholder="Rechercher une conversation..." 
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '1rem', border: 'none', fontSize: '0.85rem' }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          {messages.map(m => (
            <motion.div key={m.id} variants={item} whileHover={{ x: 5 }}
              style={{ 
                padding: '1.5rem', borderRadius: '1.25rem', marginBottom: '0.5rem', cursor: 'pointer',
                background: m.id === 'm1' ? 'var(--bg-subtle)' : 'transparent',
                border: m.id === 'm1' ? '1px solid var(--border)' : '1px solid transparent',
                transition: '0.2s'
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{m.sender}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{m.time}</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.content}</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Chip label={m.source} color={m.source === 'WhatsApp' ? '#25D366' : m.source === 'Facebook' ? '#1877F2' : '#0A66C2'} />
                {m.status === 'Nouveau' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B', alignSelf: 'center' }} />}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* active Conversation - Professional Chat Look */}
      <div className="glass" style={{ borderRadius: '2rem', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)' }}>
        <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '1rem', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '1.2rem' }}>MD</div>
              <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '12px', height: '12px', borderRadius: '50%', background: '#10B981', border: '2px solid white' }} />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1rem' }}>Moussa Diakité</div>
              <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Zap size={10} fill="#10B981" /> En ligne via WhatsApp
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="glass" style={{ padding: '0.75rem', borderRadius: '0.75rem' }}><Phone size={18} /></button>
            <button className="glass" style={{ padding: '0.75rem', borderRadius: '0.75rem' }}><Video size={18} /></button>
            <button className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <UserPlus size={16} /> Créer Opportunité
            </button>
          </div>
        </div>

        <div style={{ flex: 1, padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', background: 'linear-gradient(180deg, var(--bg) 0%, var(--bg-subtle) 100%)' }}>
          <div style={{ alignSelf: 'center', background: 'var(--bg-subtle)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Aujourd'hui</div>
          
          <div style={{ alignSelf: 'flex-start', maxWidth: '70%' }}>
            <div style={{ background: 'white', padding: '1.25rem', borderRadius: '1.5rem 1.5rem 1.5rem 0.25rem', fontSize: '0.9rem', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
              {messages[0]?.content}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: 600 }}>10:15</div>
          </div>

          <div style={{ alignSelf: 'flex-end', maxWidth: '70%' }}>
            <div style={{ background: 'var(--accent)', color: 'white', padding: '1.25rem', borderRadius: '1.5rem 1.5rem 0.25rem 1.5rem', fontSize: '0.9rem', boxShadow: '0 8px 16px var(--accent-alpha)' }}>
              Bonjour M. Diakité, merci pour votre intérêt ! Je vous prépare le devis pour les 50 blocs de construction immédiatement. On vous l'envoie sur WhatsApp d'ici 5 minutes.
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'right', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
              10:20 <CheckCheck size={12} color="var(--accent)" />
            </div>
          </div>
        </div>

        <div style={{ padding: '1.5rem 2.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '1.25rem', background: 'var(--bg)' }}>
          <button className="glass" style={{ padding: '0.8rem', borderRadius: '1rem' }}><MoreHorizontal size={20} /></button>
          <div style={{ flex: 1, position: 'relative' }}>
            <input className="glass" placeholder="Écrire votre réponse..." 
              style={{ width: '100%', border: 'none', padding: '1rem 1.5rem', borderRadius: '1.25rem', fontSize: '0.9rem' }} />
          </div>
          <button className="btn-primary" style={{ padding: '0.8rem 2rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontWeight: 800 }}>Envoyer</span> <Send size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default InboxTab;
