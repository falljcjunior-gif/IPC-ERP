import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LifeBuoy, MessageSquare, Plus, Search, Filter, 
  ChevronRight, AlertCircle, Clock, CheckCircle2, 
  User, ExternalLink, MoreVertical, Layout, List,
  ShieldCheck, Zap, Activity, MessageCircle
} from 'lucide-react';
import KanbanBoard from '../../../components/KanbanBoard';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

const SupportTab = ({ data, onOpenDetail, updateRecord }) => {
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban', 'list'
  const tickets = data?.helpdesk?.tickets || [];
  const stages = ['Nouveau', 'En cours', 'En attente', 'Résolu'];

  const handleMoveTicket = (item, nextCol) => {
    if (updateRecord) updateRecord('helpdesk', 'tickets', item.id, { statut: nextCol });
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Support Excellence KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.5rem' }}>
         <motion.div variants={item} className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid var(--border)', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ background: '#0D948815', color: '#0D9488', padding: '12px', borderRadius: '1rem' }}><Zap size={24} /></div>
            <div>
               <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>18 min</div>
               <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>Temps de réponse moyen</div>
            </div>
         </motion.div>
         <motion.div variants={item} className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid var(--border)', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ background: '#6366F115', color: '#6366F1', padding: '12px', borderRadius: '1rem' }}><CheckCircle2 size={24} /></div>
            <div>
               <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>96%</div>
               <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>Résolutions First-Contact</div>
            </div>
         </motion.div>
         <motion.div variants={item} className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid var(--border)', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ background: '#F59E0B15', color: '#F59E0B', padding: '12px', borderRadius: '1rem' }}><Activity size={24} /></div>
            <div>
               <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>4.8/5</div>
               <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>Satisfaction Support</div>
            </div>
         </motion.div>
      </div>

      {/* Toolbar & View Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div className="glass" style={{ display: 'flex', padding: '0.4rem', borderRadius: '1rem', background: 'var(--bg-subtle)' }}>
              {[
                { id: 'kanban', label: 'Tableau Kanban', icon: <Layout size={14} /> },
                { id: 'list', label: 'Vue Liste', icon: <List size={14} /> },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setViewMode(t.id)}
                  style={{
                    padding: '0.6rem 1.5rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer',
                    background: viewMode === t.id ? 'var(--bg)' : 'transparent',
                    color: viewMode === t.id ? '#0D9488' : 'var(--text-muted)',
                    fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.8rem',
                    boxShadow: viewMode === t.id ? 'var(--shadow-sm)' : 'none', transition: '0.2s'
                  }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            <div style={{ position: 'relative' }}>
               <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
               <input type="text" placeholder="Rechercher un ticket..." className="input-field glass" style={{ paddingLeft: '2.5rem', width: '280px', borderRadius: '1rem' }} />
            </div>
         </div>

         <button className="btn-primary" style={{ padding: '0.7rem 1.75rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900, background: '#0D9488', borderColor: '#0D9488' }}>
            <Plus size={20} /> Nouveau Ticket
         </button>
      </div>

      {/* Dynamic View Content */}
      <div style={{ minHeight: '600px' }}>
         {viewMode === 'kanban' ? (
           <KanbanBoard 
              columns={stages}
              items={tickets}
              columnMapping="statut"
              onMove={handleMoveTicket}
              onItemClick={(t) => onOpenDetail(t, 'helpdesk', 'tickets')}
              renderCardContent={(t) => (
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>{t.num}</span>
                    <div style={{ 
                      width: '8px', height: '8px', borderRadius: '50%', 
                      background: t.priorite === 'Critique' ? '#F43F5E' : t.priorite === 'Haute' ? '#EF4444' : '#10B981' 
                    }} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text)' }}>{t.titre}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>{t.client}</div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: 700, opacity: 0.7 }}>
                      <User size={12} /> {t.assigne}
                    </div>
                    {t.hasTask && (
                       <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.6rem', color: '#10B981', fontWeight: 900 }}>
                          <ShieldCheck size={12} /> LIÉ PROJET
                       </div>
                    )}
                  </div>
                </div>
              )}
           />
         ) : (
           <div className="glass" style={{ borderRadius: '2rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
             <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
               <thead style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                 <tr>
                   <th style={{ padding: '1.25rem 1.5rem' }}>Référence</th>
                   <th style={{ padding: '1.25rem 1.5rem' }}>Problématique</th>
                   <th style={{ padding: '1.25rem 1.5rem' }}>Client / Équipe</th>
                   <th style={{ padding: '1.25rem 1.5rem' }}>Priorité</th>
                   <th style={{ padding: '1.25rem 1.5rem' }}>Assigné</th>
                   <th style={{ padding: '1.25rem 1.5rem' }}>Statut</th>
                   <th style={{ padding: '1.25rem 1.5rem' }}></th>
                 </tr>
               </thead>
               <tbody>
                 {tickets.map(t => (
                   <tr key={t.id} style={{ borderTop: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => onOpenDetail(t, 'helpdesk', 'tickets')}>
                     <td style={{ padding: '1.25rem 1.5rem', fontWeight: 800 }}>{t.num}</td>
                     <td style={{ padding: '1.25rem 1.5rem', fontWeight: 700 }}>{t.titre}</td>
                     <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.85rem' }}>{t.client}</td>
                     <td style={{ padding: '1.25rem 1.5rem' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, color: t.priorite === 'Critique' ? '#F43F5E' : 'inherit' }}>
                          <AlertCircle size={14} /> {t.priorite}
                       </div>
                     </td>
                     <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.85rem' }}>{t.assigne}</td>
                     <td style={{ padding: '1.25rem 1.5rem' }}>
                        <div style={{ padding: '4px 10px', borderRadius: '6px', background: 'var(--bg-subtle)', fontSize: '0.7rem', fontWeight: 900, display: 'inline-block' }}>{t.statut}</div>
                     </td>
                     <td style={{ padding: '1.25rem 1.5rem' }}><ChevronRight size={18} /></td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         )}
      </div>
    </motion.div>
  );
};

export default SupportTab;
