import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Filter, Megaphone, Play, Pause, CheckCircle2,
  Clock, DollarSign, Users2, Eye, MousePointerClick, TrendingUp,
  MoreHorizontal, ChevronRight, LayoutGrid, List, Target, Zap,
  Calendar, Tag, BarChart2, ArrowUpRight
} from 'lucide-react';
import { useStore } from '../../../store';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

const STATUT_CONFIG = {
  'Brouillon':  { color: '#6B7280', bg: '#6B728015', icon: <Clock size={12} /> },
  'En Attente de Validation': { color: '#F59E0B', bg: '#F59E0B20', icon: <Clock size={12} /> },
  'Approuvée':  { color: '#10B981', bg: '#10B98120', icon: <CheckCircle2 size={12} /> },
  'Planifiée':  { color: '#3B82F6', bg: '#3B82F615', icon: <Calendar size={12} /> },
  'Active':     { color: '#10B981', bg: '#10B98115', icon: <Play size={12} /> },
  'En Pause':   { color: '#F59E0B', bg: '#F59E0B15', icon: <Pause size={12} /> },
  'Clôturée':   { color: '#8B5CF6', bg: '#8B5CF615', icon: <CheckCircle2 size={12} /> },
  'Annulée':    { color: '#EF4444', bg: '#EF444415', icon: null },
};

const TYPE_COLORS = {
  'E-mailing': '#3B82F6', 'Événement': '#8B5CF6', 'Réseaux Sociaux': '#EC4899',
  'Presse / Affichage': '#F59E0B', 'Digital Ads': '#06B6D4', 'Phoning': '#10B981',
  'Partenariat': '#14B8A6', 'Autre': '#6B7280'
};

const CampaignsTab = ({ campaigns, formatCurrency, onOpenDetail, onNew }) => {
  const { userRole, currentUser, updateRecord } = useStore();
  const [view, setView] = useState('cards'); // cards | list
  const [filterStatut, setFilterStatut] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = campaigns.filter(c => {
    const matchSearch = !search || (c.nom || '').toLowerCase().includes(search.toLowerCase());
    const matchStatut = filterStatut === 'all' || c.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const statuts = ['all', 'Brouillon', 'En Attente de Validation', 'Approuvée', 'Planifiée', 'Active', 'En Pause', 'Clôturée'];

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flex: 1, maxWidth: 500 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="glass" placeholder="Rechercher une campagne..."
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.6rem', borderRadius: '1rem', border: 'none', fontSize: '0.85rem' }} />
          </div>
          <button disabled title="Filtres avancés — bientôt disponibles" className="glass" style={{ padding: '0.75rem 1.25rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'not-allowed', opacity: 0.5 }}>
            <Filter size={16} /> Filtres
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* View Toggle */}
          <div className="glass" style={{ display: 'flex', padding: '4px', borderRadius: '0.75rem', background: 'var(--bg-subtle)' }}>
            {[{ id: 'cards', icon: <LayoutGrid size={16} /> }, { id: 'list', icon: <List size={16} /> }].map(v => (
              <button key={v.id} onClick={() => setView(v.id)}
                style={{ padding: '0.4rem 0.6rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
                  background: view === v.id ? 'var(--bg)' : 'transparent',
                  color: view === v.id ? '#EC4899' : 'var(--text-muted)' }}>
                {v.icon}
              </button>
            ))}
          </div>
          <button onClick={onNew} className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 900, background: '#EC4899', borderColor: '#EC4899' }}>
            <Plus size={18} /> Nouvelle Campagne
          </button>
        </div>
      </div>

      {/* Statut Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {statuts.map(s => {
          const cfg = STATUT_CONFIG[s];
          const active = filterStatut === s;
          return (
            <button key={s} onClick={() => setFilterStatut(s)}
              style={{
                padding: '0.4rem 1rem', borderRadius: '2rem', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700,
                background: active ? (s === 'all' ? '#EC4899' : cfg?.bg || '#EC489920') : 'var(--bg-subtle)',
                color: active ? (s === 'all' ? 'white' : cfg?.color || '#EC4899') : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}>
              {s === 'all' ? 'Toutes' : <>{cfg?.icon} {s}</>}
              {s !== 'all' && <span style={{ fontWeight: 900, marginLeft: 2 }}>({campaigns.filter(c => c.statut === s).length})</span>}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
          <Megaphone size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p style={{ fontWeight: 700 }}>Aucune campagne trouvée.</p>
        </div>
      ) : view === 'cards' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))', gap: '1.25rem' }}>
          {filtered.map((c, i) => {
            const cfg = STATUT_CONFIG[c.statut] || STATUT_CONFIG['Brouillon'];
            const color = TYPE_COLORS[c.type] || '#6B7280';
            const ratio = c.budget > 0 ? Math.min((c.depense / c.budget) * 100, 100) : 0;
            const roi = c.depense > 0 ? ((c.conversions || 0) * 150000 / c.depense).toFixed(1) : '—';
            const cpc = (c.clics || 0) > 0 ? Math.round((c.depense || 0) / c.clics) : '—';
            return (
              <motion.div key={c.id || i} variants={item} whileHover={{ y: -4 }}
                onClick={() => onOpenDetail && onOpenDetail(c, 'marketing', 'campaigns')}
                className="glass" style={{ padding: '2rem', borderRadius: '2rem', border: '1px solid var(--border)', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                {/* Top accent */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: color, borderRadius: '2rem 2rem 0 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 900, color, textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Tag size={10} /> {c.type}
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900 }}>{c.nom}</h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{c.objectif} · {c.canal}</div>
                  </div>
                  <div style={{ padding: '4px 10px', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px', background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap' }}>
                    {cfg.icon} {c.statut}
                  </div>
                </div>

                {/* Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  {[
                    { label: 'Reach', value: (c.reach || 0).toLocaleString(), icon: <Eye size={12} /> },
                    { label: 'Clics', value: (c.clics || 0).toLocaleString(), icon: <MousePointerClick size={12} /> },
                    { label: 'Leads', value: c.conversions || 0, icon: <Users2 size={12} />, highlight: true },
                  ].map((m, j) => (
                    <div key={j} style={{ textAlign: 'center', padding: '0.75rem', borderRadius: '1rem', background: m.highlight ? '#EC489910' : 'var(--bg-subtle)', border: m.highlight ? '1px solid #EC489930' : '1px solid transparent' }}>
                      <div style={{ fontSize: '0.6rem', color: m.highlight ? '#EC4899' : 'var(--text-muted)', fontWeight: 800, marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                        {m.icon} {m.label}
                      </div>
                      <div style={{ fontWeight: 900, fontSize: '1rem', color: m.highlight ? '#EC4899' : 'var(--text)' }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* Budget Bar */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700, marginBottom: '5px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Budget consommé</span>
                    <span style={{ color: ratio > 90 ? '#EF4444' : 'var(--text)' }}>{ratio.toFixed(0)}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${ratio}%` }} transition={{ duration: 0.7 }}
                      style={{ height: '100%', background: ratio > 90 ? '#EF4444' : color, borderRadius: '3px' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <span>Dépensé: {(c.depense || 0).toLocaleString()} F</span>
                    <span>Alloué: {(c.budget || 0).toLocaleString()} F</span>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {c.dateDebut} → {c.dateFin || '∞'}
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {c.statut === 'En Attente de Validation' && ['SUPER_ADMIN', 'FINANCE', 'MARKETING'].includes(userRole) && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateRecord('marketing', 'campaigns', c.id, { statut: 'Approuvée', approuvePar: currentUser?.nom, dateApprobation: new Date().toISOString() }); }}
                        style={{ padding: '0.3rem 0.6rem', borderRadius: '0.5rem', border: 'none', background: '#10B981', color: 'white', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
                      >Approuver</button>
                    )}
                    {c.statut === 'Brouillon' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateRecord('marketing', 'campaigns', c.id, { statut: 'En Attente de Validation' }); }}
                        style={{ padding: '0.3rem 0.6rem', borderRadius: '0.5rem', border: 'none', background: 'var(--accent)', color: 'white', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
                      >Demander Accès</button>
                    )}
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', fontWeight: 800 }}>
                      <span style={{ color: '#10B981' }}>ROI ×{roi}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="glass" style={{ borderRadius: '2rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr 90px', padding: '1rem 2rem', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            <div>Campagne</div><div>Type</div><div>Budget</div><div>Leads</div><div>ROI</div><div>Statut</div>
          </div>
          {filtered.map((c, i) => {
            const cfg = STATUT_CONFIG[c.statut] || {};
            const roi = c.depense > 0 ? ((c.conversions || 0) * 150000 / c.depense).toFixed(1) : '—';
            return (
              <motion.div key={c.id || i} variants={item} whileHover={{ background: 'rgba(236,72,153,0.02)' }}
                onClick={() => onOpenDetail && onOpenDetail(c, 'marketing', 'campaigns')}
                style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr 90px', padding: '1.25rem 2rem', borderBottom: '1px solid var(--border)', alignItems: 'center', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{c.nom}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.objectif} · {c.canal}</div>
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: TYPE_COLORS[c.type] || '#6B7280' }}>{c.type}</div>
                <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{(c.budget || 0).toLocaleString()} F</div>
                <div style={{ fontWeight: 900, color: '#8B5CF6' }}>{c.conversions || 0}</div>
                <div style={{ fontWeight: 900, color: '#10B981' }}>×{roi}</div>
                <div style={{ padding: '4px 10px', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 900, background: cfg.bg, color: cfg.color, textAlign: 'center', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                  {cfg.icon} {c.statut}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default CampaignsTab;
