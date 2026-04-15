import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, UserPlus, CheckCheck, MessageSquare } from 'lucide-react';
import { useBusiness } from '../../../BusinessContext';

const CANAL_COLORS = { WhatsApp: '#25D366', Facebook: '#1877F2', Instagram: '#E4405F', LinkedIn: '#0A66C2' };

const MessagesTab = ({ messages }) => {
  const { addRecord, addHint } = useBusiness();
  const [activeId, setActiveId] = useState(messages[0]?.id || null);
  const [reply, setReply] = useState('');

  const active = messages.find(m => m.id === activeId);

  const handleCreateLead = () => {
    if (!active) return;
    addRecord('crm', 'leads', {
      id: `LEAD-${Date.now()}`,
      nom: active.sender,
      entreprise: 'À qualifier',
      source: active.source,
      etape: 'Nouveau',
      note: active.content,
      montant: 0
    });
    addHint({ title: '✅ Lead créé', message: `${active.sender} ajouté au CRM depuis l'Inbox.`, type: 'success', appId: 'crm' });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', height: '680px' }}>
      {/* Thread list */}
      <div className="glass" style={{ borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, fontWeight: 900 }}>Inbox</h4>
          <span style={{ background: '#EC4899', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 900 }}>
            {messages.filter(m => m.statut === 'Nouveau').length} nouveau{messages.filter(m => m.statut === 'Nouveau').length > 1 ? 'x' : ''}
          </span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
          {messages.length === 0 && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <MessageSquare size={28} style={{ opacity: 0.3, display: 'block', margin: '0 auto 0.75rem' }} />
              Aucun message
            </div>
          )}
          {messages.map(m => {
            const color = CANAL_COLORS[m.source] || '#6366F1';
            return (
              <motion.div key={m.id} whileHover={{ x: 3 }} onClick={() => setActiveId(m.id)}
                style={{ padding: '1rem', borderRadius: '1rem', marginBottom: '0.5rem', cursor: 'pointer', transition: 'all 0.2s',
                  background: m.id === activeId ? `${color}10` : 'transparent',
                  border: `1px solid ${m.id === activeId ? color + '40' : 'transparent'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.88rem' }}>{m.sender}</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{m.time}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '0.5rem' }}>
                  {m.content}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color, padding: '2px 8px', borderRadius: '10px', background: `${color}15` }}>{m.source}</span>
                  {m.statut === 'Nouveau' && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#EC4899' }} />}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Conversation */}
      <div className="glass" style={{ borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', overflow: 'hidden' }}>
        {active ? (
          <>
            {/* Header */}
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '0.75rem', background: CANAL_COLORS[active.source] || '#6366F1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '1rem' }}>
                  {active.sender.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 900 }}>{active.sender}</div>
                  <div style={{ fontSize: '0.72rem', color: CANAL_COLORS[active.source], fontWeight: 700 }}>Via {active.source}</div>
                </div>
              </div>
              <button onClick={handleCreateLead} className="btn btn-primary"
                style={{ padding: '0.6rem 1.25rem', borderRadius: '0.9rem', fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={15} /> Ajouter au CRM
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', background: 'var(--bg)' }}>
              <div style={{ alignSelf: 'center', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', padding: '3px 10px', background: 'var(--bg-subtle)', borderRadius: '10px' }}>
                Aujourd'hui · {active.time}
              </div>

              {/* Incoming message */}
              <div style={{ alignSelf: 'flex-start', maxWidth: '70%' }}>
                <div style={{ background: 'var(--bg-subtle)', padding: '1rem 1.25rem', borderRadius: '1.25rem 1.25rem 1.25rem 0.25rem', fontSize: '0.88rem', border: '1px solid var(--border)' }}>
                  {active.content}
                </div>
              </div>

              {/* Reply if already answered */}
              {active.statut === 'Répondu' && (
                <div style={{ alignSelf: 'flex-end', maxWidth: '70%' }}>
                  <div style={{ background: 'var(--accent)', color: 'white', padding: '1rem 1.25rem', borderRadius: '1.25rem 1.25rem 0.25rem 1.25rem', fontSize: '0.88rem' }}>
                    Bonjour, merci pour votre contact ! Nous revenons vers vous rapidement.
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.3rem', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    Lu <CheckCheck size={11} color="var(--accent)" />
                  </div>
                </div>
              )}
            </div>

            {/* Reply box */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem', background: 'var(--bg-subtle)' }}>
              <input className="glass" placeholder="Écrire une réponse…" value={reply} onChange={e => setReply(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setReply('')}
                style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '0.9rem', border: 'none', fontSize: '0.88rem' }} />
              <button onClick={() => setReply('')} className="btn btn-primary"
                style={{ padding: '0.75rem 1.25rem', borderRadius: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
                <Send size={16} /> Envoyer
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Sélectionnez une conversation
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesTab;
