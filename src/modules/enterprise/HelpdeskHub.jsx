import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Headphones, Plus, Search, AlertCircle, CheckCircle2,
  Clock, MessageSquare, User, Tag, X, ChevronRight,
  BarChart3, Zap, TrendingUp, AlertTriangle, Filter
} from 'lucide-react';
import { useStore } from '../../store';

const PRIORITY_COLORS = {
  'Urgent':  { bg: '#EF444415', color: '#EF4444', dot: '#EF4444' },
  'Haute':   { bg: '#F59E0B15', color: '#F59E0B', dot: '#F59E0B' },
  'Normale': { bg: '#3B82F615', color: '#3B82F6', dot: '#3B82F6' },
  'Basse':   { bg: '#10B98115', color: '#10B981', dot: '#10B981' },
};

const STATUS_COLORS = {
  'Ouvert':      { bg: '#3B82F615', color: '#3B82F6' },
  'En cours':    { bg: '#8B5CF615', color: '#8B5CF6' },
  'En attente':  { bg: '#F59E0B15', color: '#F59E0B' },
  'Résolu':      { bg: '#10B98115', color: '#10B981' },
  'Fermé':       { bg: '#6B728015', color: '#6B7280' },
};

const TABS = [
  { id: 'kanban',    label: 'Vue Kanban',   icon: <BarChart3 size={16} /> },
  { id: 'liste',     label: 'Tous les Tickets', icon: <Tag size={16} /> },
  { id: 'sla',       label: 'SLA & Alertes', icon: <Zap size={16} /> },
];

const KANBAN_COLS = ['Ouvert', 'En cours', 'En attente', 'Résolu'];

const TicketCard = ({ ticket, onClick }) => {
  const { bg, color } = PRIORITY_COLORS[ticket.priorite] || PRIORITY_COLORS['Normale'];
  const sColor = STATUS_COLORS[ticket.statut] || STATUS_COLORS['Ouvert'];
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      onClick={() => onClick?.(ticket)}
      className="glass"
      style={{ padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>#{ticket.num || ticket.id?.slice(-4)}</span>
        <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 700, background: bg, color }}>{ticket.priorite}</span>
      </div>
      <div style={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.4 }}>{ticket.titre}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
        <span>👤 {ticket.demandeur || 'N/A'}</span>
        <span>{ticket.createdAt?.slice(0, 10)}</span>
      </div>
    </motion.div>
  );
};

const HelpdeskHub = ({ onOpenDetail, accessLevel }) => {
  const helpdeskData = useStore(state => state.data.helpdesk);
  const data = useStore(state => state.data); // Keep as fallback for now
  const addRecord = useStore(state => state.addRecord);
  const updateRecord = useStore(state => state.updateRecord);

  const [activeTab, setActiveTab] = useState('kanban');
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [newTicket, setNewTicket] = useState({
    titre: '',
    description: '',
    demandeur: '',
    categorie: 'IT',
    priorite: 'Normale',
    statut: 'Ouvert',
    slaHeures: 24,
  });

  const tickets = useMemo(() => data?.helpdesk?.tickets || [], [data?.helpdesk?.tickets]);

  const stats = useMemo(() => ({
    open: tickets.filter(t => t.statut === 'Ouvert').length,
    inProgress: tickets.filter(t => t.statut === 'En cours').length,
    resolved: tickets.filter(t => t.statut === 'Résolu' || t.statut === 'Fermé').length,
    urgent: tickets.filter(t => t.priorite === 'Urgent').length,
  }), [tickets]);

  const filtered = useMemo(() => {
    let list = [...tickets];
    if (search) list = list.filter(t => `${t.titre} ${t.demandeur}`.toLowerCase().includes(search.toLowerCase()));
    if (filterPriority !== 'ALL') list = list.filter(t => t.priorite === filterPriority);
    return list;
  }, [tickets, search, filterPriority]);

  const handleCreate = () => {
    addRecord('helpdesk', 'tickets', { ...newTicket, num: `HD-${Date.now().toString().slice(-5)}`, createdAt: new Date().toISOString() });
    setShowModal(false);
    setNewTicket({ titre: '', description: '', demandeur: '', categorie: 'IT', priorite: 'Normale', statut: 'Ouvert', slaHeures: 24 });
  };

  const inputStyle = { padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text)', width: '100%' };
  const labelStyle = { fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem', display: 'block' };

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: '#8B5CF6', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Headphones size={14} /> Service Helpdesk
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>Support & Tickets</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem', fontSize: '0.95rem' }}>
            Gérez les demandes internes et clients avec un suivi SLA rigoureux.
          </p>
        </div>
        {accessLevel !== 'read' && (
          <button onClick={() => setShowModal(true)} className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Nouveau Ticket
          </button>
        )}
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Ouverts', value: stats.open, color: '#3B82F6', icon: <AlertCircle size={18} /> },
          { label: 'En Cours', value: stats.inProgress, color: '#8B5CF6', icon: <Clock size={18} /> },
          { label: 'Résolus', value: stats.resolved, color: '#10B981', icon: <CheckCircle2 size={18} /> },
          { label: 'Urgents', value: stats.urgent, color: '#EF4444', icon: <AlertTriangle size={18} /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="glass" style={{ padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid var(--border)' }}>
            <div style={{ color, marginBottom: '0.5rem' }}>{icon}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un ticket..." style={{ ...inputStyle, paddingLeft: '2.5rem' }} />
        </div>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ ...inputStyle, width: 'auto' }}>
          <option value="ALL">Toutes priorités</option>
          {Object.keys(PRIORITY_COLORS).map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '0.75rem 1.25rem', border: 'none', background: 'transparent', borderBottom: activeTab === tab.id ? '2px solid #8B5CF6' : '2px solid transparent', color: activeTab === tab.id ? '#8B5CF6' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: '0.2s' }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Kanban Tab */}
      {activeTab === 'kanban' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'grid', gridTemplateColumns: `repeat(${KANBAN_COLS.length}, 1fr)`, gap: '1.5rem', minHeight: '400px' }}>
          {KANBAN_COLS.map(col => {
            const colTickets = filtered.filter(t => t.statut === col);
            const sColor = STATUS_COLORS[col] || STATUS_COLORS['Ouvert'];
            return (
              <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', color: sColor.color }}>{col}</span>
                  <span style={{ background: sColor.bg, color: sColor.color, borderRadius: '999px', padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 }}>{colTickets.length}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '200px' }}>
                  {colTickets.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', border: '2px dashed var(--border)', borderRadius: '1rem' }}>Aucun ticket</div>}
                  {colTickets.map(t => <TicketCard key={t.id} ticket={t} onClick={(t) => onOpenDetail?.(t, 'helpdesk', 'tickets')} />)}
                </div>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* List Tab */}
      {activeTab === 'liste' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="glass" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                  {['#', 'Titre', 'Demandeur', 'Catégorie', 'Priorité', 'Statut', 'Date', ''].map(h => (
                    <th key={h} style={{ padding: '1rem', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Aucun ticket trouvé.</td></tr>}
                {filtered.map(ticket => {
                  const pc = PRIORITY_COLORS[ticket.priorite] || PRIORITY_COLORS['Normale'];
                  const sc = STATUS_COLORS[ticket.statut] || STATUS_COLORS['Ouvert'];
                  return (
                    <tr key={ticket.id} onClick={() => onOpenDetail?.(ticket, 'helpdesk', 'tickets')} className="glass-hover" style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                      <td style={{ padding: '1rem', fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-muted)' }}>#{ticket.num || ticket.id?.slice(-4)}</td>
                      <td style={{ padding: '1rem', fontWeight: 700 }}>{ticket.titre}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{ticket.demandeur}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{ticket.categorie}</td>
                      <td style={{ padding: '1rem' }}><span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, background: pc.bg, color: pc.color }}>{ticket.priorite}</span></td>
                      <td style={{ padding: '1rem' }}><span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, background: sc.bg, color: sc.color }}>{ticket.statut}</span></td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{ticket.createdAt?.slice(0, 10)}</td>
                      <td style={{ padding: '1rem' }}><ChevronRight size={16} color="var(--text-muted)" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* SLA Tab */}
      {activeTab === 'sla' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass" style={{ padding: '2rem', borderRadius: '1.25rem', border: '1px solid #EF444430' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <AlertTriangle size={20} color="#EF4444" />
              <h3 style={{ fontWeight: 800, margin: 0 }}>Tickets Urgents en SLA Risk</h3>
            </div>
            {tickets.filter(t => t.priorite === 'Urgent' && (t.statut === 'Ouvert' || t.statut === 'En cours')).length === 0
              ? <p style={{ color: 'var(--text-muted)', margin: 0 }}>✅ Aucun ticket urgent en risque SLA.</p>
              : tickets.filter(t => t.priorite === 'Urgent' && (t.statut === 'Ouvert' || t.statut === 'En cours')).map(t => (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#EF444408', borderRadius: '0.75rem', border: '1px solid #EF444430', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{t.titre}</div>
                    <div style={{ fontSize: '0.8rem', color: '#EF4444' }}>⚠️ Ticket urgent — SLA: {t.slaHeures || 4}h</div>
                  </div>
                  <button onClick={() => updateRecord('helpdesk', 'tickets', t.id, { statut: 'En cours' })} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: '0.5rem' }}>Prendre en charge</button>
                </div>
              ))
            }
          </div>

          <div className="glass" style={{ padding: '2rem', borderRadius: '1.25rem', border: '1px solid var(--border)' }}>
            <h3 style={{ fontWeight: 800, marginBottom: '1rem' }}>Politique SLA par Priorité</h3>
            {[
              { priorite: 'Urgent', sla: '4 heures', color: '#EF4444' },
              { priorite: 'Haute', sla: '8 heures', color: '#F59E0B' },
              { priorite: 'Normale', sla: '24 heures', color: '#3B82F6' },
              { priorite: 'Basse', sla: '72 heures', color: '#10B981' },
            ].map(({ priorite, sla, color }) => (
              <div key={priorite} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
                  <span style={{ fontWeight: 700 }}>{priorite}</span>
                </div>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{sla}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Create Ticket Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 1000 }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1001, padding: '2rem', borderRadius: '1.5rem', border: '1px solid var(--border)', width: '560px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Nouveau Ticket Support</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Titre du Problème *</label>
                  <input value={newTicket.titre} onChange={e => setNewTicket(p => ({ ...p, titre: e.target.value }))} placeholder="Ex: Imprimante réseau HS au RDC" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea value={newTicket.description} onChange={e => setNewTicket(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Décrivez le problème en détail..." style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Demandeur</label>
                    <input value={newTicket.demandeur} onChange={e => setNewTicket(p => ({ ...p, demandeur: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Catégorie</label>
                    <select value={newTicket.categorie} onChange={e => setNewTicket(p => ({ ...p, categorie: e.target.value }))} style={inputStyle}>
                      {['IT', 'RH', 'Logistique', 'Finance', 'Production', 'Autre'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Priorité</label>
                    <select value={newTicket.priorite} onChange={e => setNewTicket(p => ({ ...p, priorite: e.target.value }))} style={inputStyle}>
                      {Object.keys(PRIORITY_COLORS).map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>SLA (heures)</label>
                    <input type="number" value={newTicket.slaHeures} onChange={e => setNewTicket(p => ({ ...p, slaHeures: Number(e.target.value) }))} style={inputStyle} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowModal(false)} style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontWeight: 600 }}>Annuler</button>
                <button onClick={handleCreate} disabled={!newTicket.titre} className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: 700, opacity: newTicket.titre ? 1 : 0.5 }}>Créer le Ticket</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HelpdeskHub;
