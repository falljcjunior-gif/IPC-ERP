import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Search, MoreHorizontal, 
  CheckCheck, Zap, UserPlus, MessageSquare
} from 'lucide-react';
import Chip from '../components/Chip';
import { useBusiness } from '../../../BusinessContext';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } };

const CANAL_COLORS = {
  WhatsApp: '#25D366',
  Facebook: '#1877F2',
  Instagram: '#E4405F',
  LinkedIn: '#0A66C2',
};

const InboxTab = () => {
  const { data, addRecord, addHint } = useBusiness();
  const messages = data?.marketing?.messages || [];
  const [activeId, setActiveId] = useState(messages[0]?.id || null);
  const [reply, setReply] = useState('');

  const activeMsg = messages.find(m => m.id === activeId);

  const handleCreateLead = () => {
    if (!activeMsg) return;
    const lead = {
      id: `LEAD-MSG-${Date.now()}`,
      nom: activeMsg.sender,
      entreprise: 'À qualifier',
      source: activeMsg.source,
      etape: 'Nouveau',
      email: '',
      montant: 0,
      note: activeMsg.content
    };
    addRecord('crm', 'leads', lead);
    addHint({ title: '✅ Lead Créé', message: `${activeMsg.sender} a été ajouté au CRM depuis l'Inbox Marketing.`, type: 'success', appId: 'crm' });
  };

  const newCount = messages.filter(m => m.statut === 'Nouveau').length;

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '1.5rem', height: '700px' }}>
      {/* Threads List */}
      <div className="glass" style={{ borderRadius: '2rem', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)' }}>
        <div style={{ padding: '1.75rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>Social Inbox</h4>
            {newCount > 0 && (
              <div style={{ background: '#EC4899', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 900 }}>
                {newCount} Nouveau{newCount > 1 ? 'x' : ''}
              </div>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="glass" placeholder="Rechercher une conversation..." 
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '1rem', border: 'none', fontSize: '0.85rem' }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          {messages.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <MessageSquare size={32} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <div>Aucun message entrant</div>
            </div>
          )}
          {messages.map(m => (
            <motion.div key={m.id} variants={item} whileHover={{ x: 5 }}
              onClick={() => setActiveId(m.id)}
              style={{ 
                padding: '1.5rem', borderRadius: '1.25rem', marginBottom: '0.5rem', cursor: 'pointer',
                background: m.id === activeId ? `${CANAL_COLORS[m.source]}10` : 'transparent',
                border: `1px solid ${m.id === activeId ? CANAL_COLORS[m.source] + '40' : 'transparent'}`,
                transition: '0.2s'
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{m.sender}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{m.time}</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.content}</div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <Chip label={m.source} color={CANAL_COLORS[m.source] || '#6366F1'} />
                {m.statut === 'Nouveau' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EC4899' }} />}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Active Conversation */}
      <div className="glass" style={{ borderRadius: '2rem', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)' }}>
        {activeMsg ? (
          <>
            <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-subtle)', borderRadius: '2rem 2rem 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '1rem', background: CANAL_COLORS[activeMsg.source] || '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '1.2rem' }}>
                    {activeMsg.sender.substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '12px', height: '12px', borderRadius: '50%', background: '#10B981', border: '2px solid white' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '1rem' }}>{activeMsg.sender}</div>
                  <div style={{ fontSize: '0.75rem', color: CANAL_COLORS[activeMsg.source], fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Zap size={10} fill={CANAL_COLORS[activeMsg.source]} /> Via {activeMsg.source}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={handleCreateLead} className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <UserPlus size={16} /> Convertir en Lead CRM
                </button>
                <button className="glass" style={{ padding: '0.75rem', borderRadius: '0.75rem' }}>
                  <MoreHorizontal size={18} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', background: 'linear-gradient(180deg, var(--bg) 0%, var(--bg-subtle) 100%)' }}>
              <div style={{ alignSelf: 'center', background: 'var(--bg-subtle)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Aujourd'hui</div>

              <div style={{ alignSelf: 'flex-start', maxWidth: '70%' }}>
                <div style={{ background: 'var(--bg)', padding: '1.25rem', borderRadius: '1.5rem 1.5rem 1.5rem 0.25rem', fontSize: '0.9rem', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                  {activeMsg.content}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: 600 }}>{activeMsg.time}</div>
              </div>

              {activeMsg.statut === 'Répondu' && (
                <div style={{ alignSelf: 'flex-end', maxWidth: '70%' }}>
                  <div style={{ background: 'var(--accent)', color: 'white', padding: '1.25rem', borderRadius: '1.5rem 1.5rem 0.25rem 1.5rem', fontSize: '0.9rem', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
                    Bonjour, merci pour votre contact ! Nous vous revenons rapidement.
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'right', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    Lu <CheckCheck size={12} color="var(--accent)" />
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: '1.5rem 2.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '1.25rem', background: 'var(--bg)', borderRadius: '0 0 2rem 2rem' }}>
              <input 
                className="glass" 
                placeholder="Écrire votre réponse..." 
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setReply('')}
                style={{ flex: 1, border: 'none', padding: '1rem 1.5rem', borderRadius: '1.25rem', fontSize: '0.9rem' }} 
              />
              <button 
                onClick={() => setReply('')}
                className="btn btn-primary" 
                style={{ padding: '0.8rem 2rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
              >
                <span style={{ fontWeight: 800 }}>Envoyer</span> <Send size={18} />
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Sélectionnez une conversation
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default InboxTab;
