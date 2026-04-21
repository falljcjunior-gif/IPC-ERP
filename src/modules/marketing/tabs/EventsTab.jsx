import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays, Plus, MapPin, Users, CheckCircle2, Clock,
  Star, AlertTriangle, ChevronRight, Play, Video, Mic,
  Building2, Trophy, ExternalLink, UserCheck, TrendingUp
} from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

const TYPE_ICONS = {
  'Salon / Foire': <Building2 size={20} />, 'Webinaire': <Video size={20} />,
  'Conférence': <Mic size={20} />, 'Lancement Produit': <Star size={20} />,
  'Formation Client': <UserCheck size={20} />, 'Portes Ouvertes': <ExternalLink size={20} />,
  'Networking': <Users size={20} />, 'Autre': <CalendarDays size={20} />
};

const TYPE_COLORS = {
  'Salon / Foire': '#8B5CF6', 'Webinaire': '#3B82F6', 'Conférence': '#EC4899',
  'Lancement Produit': '#F59E0B', 'Formation Client': '#10B981',
  'Portes Ouvertes': '#06B6D4', 'Networking': '#14B8A6', 'Autre': '#6B7280'
};

const STATUT_CFG = {
  'Planifié':  { color: '#3B82F6', bg: '#3B82F615' },
  'Confirmé':  { color: '#10B981', bg: '#10B98115' },
  'En cours':  { color: '#EC4899', bg: '#EC489915' },
  'Terminé':   { color: '#6B7280', bg: '#6B728015' },
  'Annulé':    { color: '#EF4444', bg: '#EF444415' },
};

const EventsTab = ({ events, onNew, onOpenDetail }) => {
  const [view, setView] = useState('upcoming'); // upcoming | past | all
  const now = new Date().toISOString().split('T')[0];

  const filtered = events.filter(e => {
    if (view === 'upcoming') return ['Planifié', 'Confirmé', 'En cours'].includes(e.statut);
    if (view === 'past') return ['Terminé', 'Annulé'].includes(e.statut);
    return true;
  });

  const totalInscrits = events.reduce((s, e) => s + (e.nbInscrits || 0), 0);
  const totalLeads = events.reduce((s, e) => s + (e.nbLeads || 0), 0);
  const taux = totalInscrits > 0 ? ((events.reduce((s, e) => s + (e.nbPresents || 0), 0) / totalInscrits) * 100).toFixed(0) : 0;
  const upcomingCount = events.filter(e => ['Planifié', 'Confirmé'].includes(e.statut)).length;

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1.25rem' }}>
        {[
          { label: 'Événements à venir', value: upcomingCount, color: '#3B82F6', icon: <CalendarDays size={22} /> },
          { label: 'Total Inscrits', value: totalInscrits.toLocaleString(), color: '#8B5CF6', icon: <Users size={22} /> },
          { label: 'Taux de Présence', value: `${taux}%`, color: '#10B981', icon: <UserCheck size={22} /> },
          { label: 'Leads Événementiels', value: totalLeads, color: '#EC4899', icon: <TrendingUp size={22} /> },
        ].map((k, i) => (
          <motion.div key={i} variants={item} className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid var(--border)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ background: `${k.color}15`, color: k.color, padding: '12px', borderRadius: '1rem' }}>{k.icon}</div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k.label}</div>
              <div style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--text)' }}>{k.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { id: 'upcoming', label: 'À venir' },
            { id: 'past', label: 'Passés' },
            { id: 'all', label: 'Tous' },
          ].map(v => (
            <button key={v.id} onClick={() => setView(v.id)}
              style={{ padding: '0.5rem 1.25rem', borderRadius: '2rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem',
                background: view === v.id ? '#8B5CF6' : 'var(--bg-subtle)', color: view === v.id ? 'white' : 'var(--text-muted)' }}>
              {v.label}
            </button>
          ))}
        </div>
        <button onClick={onNew} className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 900, background: '#8B5CF6', borderColor: '#8B5CF6' }}>
          <Plus size={18} /> Nouvel Événement
        </button>
      </div>

      {/* Events */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
          <CalendarDays size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <p style={{ fontWeight: 700 }}>Aucun événement {view === 'upcoming' ? 'à venir' : 'passé'}.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.sort((a,b) => (a.dateDebut || '').localeCompare(b.dateDebut || '')).map((ev, i) => {
            const color = TYPE_COLORS[ev.type] || '#6B7280';
            const cfg = STATUT_CFG[ev.statut] || {};
            const tauxPresence = ev.nbInscrits > 0 ? ((ev.nbPresents || 0) / ev.nbInscrits * 100).toFixed(0) : 0;
            const icon = TYPE_ICONS[ev.type] || TYPE_ICONS['Autre'];
            return (
              <motion.div key={ev.id || i} variants={item} whileHover={{ x: 5 }}
                onClick={() => onOpenDetail && onOpenDetail(ev, 'marketing', 'events')}
                className="glass" style={{ padding: '1.75rem 2rem', borderRadius: '2rem', border: '1px solid var(--border)', cursor: 'pointer',
                  display: 'grid', gridTemplateColumns: '60px 2.5fr 1.5fr 1fr 1fr 1fr 100px', alignItems: 'center', gap: '1.5rem' }}>
                {/* Icon */}
                <div style={{ width: 50, height: 50, borderRadius: '1.25rem', background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {icon}
                </div>
                {/* Info */}
                <div>
                  <div style={{ fontWeight: 900, fontSize: '1rem' }}>{ev.nom}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color, fontWeight: 700 }}>{ev.type}</span>
                    {ev.lieu && <><MapPin size={11} /> {ev.lieu}</>}
                  </div>
                </div>
                {/* Date */}
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '2px' }}>Date</div>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{ev.dateDebut || '—'}</div>
                  {ev.dateFin && ev.dateFin !== ev.dateDebut && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>→ {ev.dateFin}</div>}
                </div>
                {/* Inscrits */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '2px' }}>Inscrits</div>
                  <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>{ev.nbInscrits || '—'}</div>
                </div>
                {/* Présence */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '2px' }}>Présence</div>
                  <div style={{ fontWeight: 900, color: parseInt(tauxPresence) > 70 ? '#10B981' : 'var(--text)' }}>{ev.nbPresents > 0 ? `${tauxPresence}%` : '—'}</div>
                </div>
                {/* Leads */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '2px' }}>Leads</div>
                  <div style={{ fontWeight: 900, color: '#EC4899', fontSize: '1.1rem' }}>{ev.nbLeads || '—'}</div>
                </div>
                {/* Statut */}
                <div style={{ padding: '5px 10px', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 900, background: cfg.bg, color: cfg.color, textAlign: 'center' }}>
                  {ev.statut}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default EventsTab;
