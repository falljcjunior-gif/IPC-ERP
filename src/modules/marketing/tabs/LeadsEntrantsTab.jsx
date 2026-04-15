import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserPlus, Plus, Search, Filter, Flame, ThumbsUp, Minus,
  ArrowRight, Phone, Mail, Building2, Tag, Zap, CheckCircle2,
  AlertCircle, ChevronRight, Users2, TrendingUp, Star
} from 'lucide-react';
import { useBusiness } from '../../../BusinessContext';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

const INTERET_CFG = {
  'Très Chaud': { color: '#EF4444', bg: '#EF444415', icon: <Flame size={12} />, priority: 4 },
  'Chaud':      { color: '#F59E0B', bg: '#F59E0B15', icon: <Zap size={12} />, priority: 3 },
  'Tiède':      { color: '#3B82F6', bg: '#3B82F615', icon: <ThumbsUp size={12} />, priority: 2 },
  'Froid':      { color: '#6B7280', bg: '#6B728015', icon: <Minus size={12} />, priority: 1 },
};

const STATUT_CFG = {
  'Nouveau':              { color: '#3B82F6', bg: '#3B82F615' },
  'Qualifié':             { color: '#10B981', bg: '#10B98115' },
  'En Cours de Traitement': { color: '#F59E0B', bg: '#F59E0B15' },
  'Transféré CRM':        { color: '#8B5CF6', bg: '#8B5CF615' },
  'Non Qualifié':         { color: '#EF4444', bg: '#EF444415' },
};

const SOURCE_COLORS = {
  'Facebook': '#1877F2', 'Instagram': '#E4405F', 'LinkedIn': '#0A66C2',
  'Google Ads': '#4285F4', 'E-mailing': '#3B82F6', 'Événement': '#8B5CF6',
  'Formulaire Web': '#10B981', 'Bouche à Oreille': '#F59E0B',
  'Appel Entrant': '#EC4899', 'Autre': '#6B7280'
};

const LeadsEntrantsTab = ({ leads, onNew, onOpenDetail, navigateToCrm }) => {
  const { addRecord, updateRecord } = useBusiness();
  const [search, setSearch] = useState('');
  const [filterInteret, setFilterInteret] = useState('all');

  const filtered = leads.filter(l => {
    const matchSearch = !search || [(l.prenom || ''), (l.nom || ''), (l.entreprise || ''), (l.email || '')].some(f => f.toLowerCase().includes(search.toLowerCase()));
    const matchInteret = filterInteret === 'all' || l.interet === filterInteret;
    return matchSearch && matchInteret;
  }).sort((a, b) => (INTERET_CFG[b.interet]?.priority || 0) - (INTERET_CFG[a.interet]?.priority || 0));

  const counts = {
    total: leads.length,
    nouveau: leads.filter(l => l.statut === 'Nouveau' || !l.statut).length,
    chaud: leads.filter(l => l.interet === 'Chaud' || l.interet === 'Très Chaud').length,
    transfere: leads.filter(l => l.statut === 'Transféré CRM').length,
  };

  const transferToCrm = (lead) => {
    updateRecord('crm', 'leads', lead.id, { ...lead, statut: 'Transféré CRM', statut_crm: 'Qualifié' });
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        {[
          { label: 'Total Leads', value: counts.total, color: '#EC4899', icon: <Users2 size={22} /> },
          { label: 'Nouveaux', value: counts.nouveau, color: '#3B82F6', icon: <UserPlus size={22} /> },
          { label: 'Leads Chauds', value: counts.chaud, color: '#EF4444', icon: <Flame size={22} /> },
          { label: 'Transférés CRM', value: counts.transfere, color: '#10B981', icon: <CheckCircle2 size={22} /> },
        ].map((k, i) => (
          <motion.div key={i} variants={item} className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid var(--border)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ background: `${k.color}15`, color: k.color, padding: '12px', borderRadius: '1rem' }}>{k.icon}</div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{k.label}</div>
              <div style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--text)' }}>{k.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flex: 1, maxWidth: 500 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="glass" placeholder="Rechercher un lead..."
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.6rem', borderRadius: '1rem', border: 'none', fontSize: '0.85rem' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['all', 'Très Chaud', 'Chaud', 'Tiède', 'Froid'].map(v => {
            const cfg = INTERET_CFG[v];
            return (
              <button key={v} onClick={() => setFilterInteret(v)}
                style={{ padding: '0.4rem 1rem', borderRadius: '2rem', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px',
                  background: filterInteret === v ? (cfg?.color || '#EC4899') : 'var(--bg-subtle)',
                  color: filterInteret === v ? 'white' : 'var(--text-muted)' }}>
                {v === 'all' ? 'Tous' : <>{cfg?.icon} {v}</>}
              </button>
            );
          })}
          <button onClick={onNew} className="btn-primary" style={{ padding: '0.6rem 1.25rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 900, background: '#EC4899', borderColor: '#EC4899', fontSize: '0.85rem' }}>
            <Plus size={16} /> Nouveau Lead
          </button>
        </div>
      </div>

      {/* Leads Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
          <UserPlus size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <p style={{ fontWeight: 700 }}>Aucun lead entrant trouvé.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.25rem' }}>
          {filtered.map((lead, i) => {
            const interetCfg = INTERET_CFG[lead.interet] || INTERET_CFG['Tiède'];
            const statutCfg = STATUT_CFG[lead.statut] || STATUT_CFG['Nouveau'];
            const sourceColor = SOURCE_COLORS[lead.source] || '#6B7280';
            const isTransfered = lead.statut === 'Transféré CRM';
            return (
              <motion.div key={lead.id || i} variants={item} whileHover={{ y: -4 }}
                className="glass" style={{ padding: '1.75rem', borderRadius: '2rem', border: `1px solid ${interetCfg.color}30`, position: 'relative', overflow: 'hidden' }}>
                {/* Interet stripe */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: interetCfg.color, borderRadius: '2rem 0 0 2rem' }} />

                <div style={{ marginLeft: '0.75rem' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '1rem', background: `${interetCfg.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: interetCfg.color, fontWeight: 900, fontSize: '1.1rem' }}>
                        {(lead.prenom || lead.nom || 'L')[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 900, fontSize: '0.95rem' }}>{lead.prenom} {lead.nom}</div>
                        {lead.entreprise && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Building2 size={11} /> {lead.entreprise}</div>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '2rem', background: interetCfg.bg, color: interetCfg.color, fontSize: '0.65rem', fontWeight: 900 }}>
                        {interetCfg.icon} {lead.interet || 'Tiède'}
                      </div>
                      <div style={{ padding: '3px 8px', borderRadius: '2rem', background: statutCfg.bg, color: statutCfg.color, fontSize: '0.65rem', fontWeight: 900 }}>
                        {lead.statut || 'Nouveau'}
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                    {lead.email && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={12} /> {lead.email}</div>}
                    {lead.telephone && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={12} /> {lead.telephone}</div>}
                  </div>

                  {/* Source & Campaign */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                    {lead.source && (
                      <div style={{ padding: '3px 10px', borderRadius: '2rem', fontSize: '0.68rem', fontWeight: 800, background: `${sourceColor}15`, color: sourceColor }}>
                        📍 {lead.source}
                      </div>
                    )}
                    {lead.campagne && (
                      <div style={{ padding: '3px 10px', borderRadius: '2rem', fontSize: '0.68rem', fontWeight: 800, background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                        🎯 {lead.campagne}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => onOpenDetail && onOpenDetail(lead, 'crm', 'leads')}
                      className="glass" style={{ flex: 1, padding: '0.6rem', borderRadius: '0.75rem', fontWeight: 800, fontSize: '0.78rem' }}>
                      Détails
                    </button>
                    {!isTransfered ? (
                      <button onClick={() => transferToCrm(lead)}
                        style={{ flex: 1.5, padding: '0.6rem 1rem', borderRadius: '0.75rem', background: '#10B981', color: 'white', border: 'none', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <ArrowRight size={13} /> Envoyer CRM
                      </button>
                    ) : (
                      <div style={{ flex: 1.5, padding: '0.6rem 1rem', borderRadius: '0.75rem', background: '#10B98115', color: '#10B981', fontWeight: 800, fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <CheckCircle2 size={13} /> Transféré ✓
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default LeadsEntrantsTab;
