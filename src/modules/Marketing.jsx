import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Megaphone, BarChart3, Plus, Eye, MousePointer2, TrendingUp, TrendingDown,
  ChevronRight, MoreVertical, Zap, Users, DollarSign, Target, Share2,
  Mail, Globe, Smartphone, Monitor, Activity, ArrowUpRight, Star,
  CheckCircle2, AlertTriangle, RefreshCcw, BarChart2, CreditCard
} from 'lucide-react';

import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, LineChart, Line, Legend, Cell, ComposedChart,
  PieChart, Pie, FunnelChart, Funnel, LabelList
} from 'recharts';
import { useBusiness } from '../BusinessContext';
import RecordModal from '../components/RecordModal';
import KpiCard from '../components/KpiCard';

/* ─── Shared helpers ─── */
const fadeIn = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } } };
const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const Chip = ({ label, color = '#64748B' }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: '999px', background: `${color}18`, color, fontSize: '0.72rem', fontWeight: 700 }}>{label}</span>
);

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', background: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: '0.9rem', border: '1px solid var(--border)', gap: '0.2rem', width: 'fit-content', flexWrap: 'wrap' }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)}
        style={{ padding: '0.5rem 1.1rem', borderRadius: '0.7rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.84rem',
          background: active === t.id ? 'var(--bg)' : 'transparent',
          color: active === t.id ? 'var(--accent)' : 'var(--text-muted)',
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          boxShadow: active === t.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>
        {t.icon} {t.label}
      </button>
    ))}
  </div>
);

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass" style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.8rem' }}>
      <p style={{ fontWeight: 700, marginBottom: '4px' }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color, margin: '2px 0' }}>{p.name}: {p.value?.toLocaleString?.('fr-FR') ?? p.value}</p>)}
    </div>
  );
};

/* ════════════════════════════════
   MARKETING MODULE
════════════════════════════════ */
const Marketing = ({ onOpenDetail }) => {
  const { data, addRecord, formatCurrency } = useBusiness();
  const [mainTab, setMainTab] = useState('leadgen');
  const [campaignModal, setCampaignModal] = useState(false);

  const campaigns = data?.marketing?.campaigns || [];
  const leads = data?.crm?.leads || [];

  /* ─── Computed ─── */
  const mktStats = useMemo(() => {
    const mql = leads.filter(l => l.statut === 'En cours').length + 48;
    const sql = leads.filter(l => l.statut === 'Assigné').length + 29;
    const clients = Math.round(sql * 0.52);
    const convVisiteur = 2.8;   // % simulation
    const cac         = 125000;
    const totalBudget = campaigns.reduce((s, c) => s + (c.budget || 0), 0) + 12500000;
    const budgetAlloc = 15000000;
    const budgetPct   = Math.round((totalBudget / budgetAlloc) * 100);
    const roiGlobal   = 3.4;
    return { mql, sql, clients, convVisiteur, cac, totalBudget, budgetAlloc, budgetPct, roiGlobal };
  }, [leads, campaigns]);

  /* ─── Channel ROI Data ─── */
  const channelROI = [
    { canal: 'Google Ads',    depense: 3500000, revenus: 14200000, roi: 306, leads: 145, color: '#3B82F6' },
    { canal: 'LinkedIn Ads',  depense: 2800000, revenus: 9800000,  roi: 250, leads: 98,  color: '#0077B5' },
    { canal: 'Emailing',      depense: 800000,  revenus: 6400000,  roi: 700, leads: 210, color: '#8B5CF6' },
    { canal: 'Salons/Events', depense: 4200000, revenus: 11500000, roi: 174, leads: 62,  color: '#F59E0B' },
    { canal: 'SEO/Content',   depense: 1200000, revenus: 8800000,  roi: 633, leads: 180, color: '#10B981' },
    { canal: 'Social Organic',depense: 500000,  revenus: 1800000,  roi: 260, leads: 95,  color: '#EC4899' },
  ];

  /* ─── Lead Funnel Monthly ─── */
  const leadFunnel = [
    { mois: 'Oct', visiteurs: 48000, mql: 890,  sql: 310, clients: 58  },
    { mois: 'Nov', visiteurs: 52000, mql: 1020, sql: 370, clients: 72  },
    { mois: 'Déc', visiteurs: 41000, mql: 780,  sql: 290, clients: 52  },
    { mois: 'Jan', visiteurs: 61000, mql: 1250, sql: 480, clients: 91  },
    { mois: 'Fév', visiteurs: 68000, mql: 1420, sql: 540, clients: 104 },
    { mois: 'Mar', visiteurs: 74000, mql: 1680, sql: 620, clients: 120 },
    { mois: 'Avr', visiteurs: 82000, mql: mktStats.mql + 1580, sql: mktStats.sql + 590, clients: 132 },
  ];

  /* ─── Digital Engagement ─── */
  const webTrend = [
    { sem: 'S1', sessions: 14500, pageVues: 38000, tauxRebond: 42 },
    { sem: 'S2', sessions: 16800, pageVues: 44200, tauxRebond: 39 },
    { sem: 'S3', sessions: 15200, pageVues: 40100, tauxRebond: 41 },
    { sem: 'S4', sessions: 18400, pageVues: 52000, tauxRebond: 36 },
  ];

  const emailStats = [
    { campagne: 'Newsletter Mai',    envoye: 12500, ouverture: 28.4, clic: 4.2, desinscrit: 0.3 },
    { campagne: 'Promo Flash Q2',    envoye: 8200,  ouverture: 34.1, clic: 8.7, desinscrit: 0.6 },
    { campagne: 'Onboarding Séq.1',  envoye: 3100,  ouverture: 52.8, clic: 14.1,desinscrit: 0.1 },
    { campagne: 'Reactivation B2C',  envoye: 5400,  ouverture: 18.2, clic: 2.8, desinscrit: 1.1 },
    { campagne: 'Webinar Invitation',envoye: 9800,  ouverture: 41.3, clic: 11.6,desinscrit: 0.2 },
  ];

  const socialData = [
    { reseau: 'LinkedIn',   followers: 28400, engagement: 4.8, reach: 142000, posts: 24, icon: '💼', color: '#0077B5' },
    { reseau: 'Twitter/X',  followers: 15200, engagement: 2.1, reach: 62000,  posts: 48, icon: '𝕏',  color: '#1DA1F2' },
    { reseau: 'Instagram',  followers: 22800, engagement: 6.2, reach: 98000,  posts: 36, icon: '📷', color: '#EC4899' },
    { reseau: 'YouTube',    followers: 8400,  engagement: 8.4, reach: 218000, posts: 8,  icon: '📹', color: '#EF4444' },
  ];

  /* ─── Modal Fields ─── */
  const modalFields = [
    { name: 'nom',    label: 'Nom de la Campagne', required: true, placeholder: 'Ex: Lancement Été 2026' },
    { name: 'type',   label: 'Type', type: 'select', options: ['E-mailing', 'LinkedIn Ads', 'Google Ads', 'Webinaire', 'SEO', 'Événement', 'Social Organic'], required: true },
    { name: 'budget', label: 'Budget Alloué (FCFA)', type: 'number', required: true },
    { name: 'statut', label: 'Statut', type: 'select', options: ['Planifié', 'En cours', 'Terminé', 'En pause'], required: true },
    { name: 'objectifMql', label: 'Objectif MQL', type: 'number' },
    { name: 'vues',   label: 'Objectif Vues', type: 'number' },
  ];

  /* ════════════════════════════
     SUB-VIEW: LEAD GEN
  ════════════════════════════ */
  const renderLeadGen = () => (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* KPIs */}
      <motion.div variants={fadeIn} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <KpiCard title="Visiteurs Mensuels"    value={(82000).toLocaleString('fr-FR')}          trend={10.6} trendType="up"   icon={<Globe size={20} />}    color="#3B82F6" sparklineData={leadFunnel.map(d => ({ val: d.visiteurs / 1000 }))} />
        <KpiCard title="MQL (Leads Marketing)" value={mktStats.mql}                             trend={18.4} trendType="up"   icon={<Users size={20} />}    color="#8B5CF6" sparklineData={leadFunnel.map(d => ({ val: d.mql / 10 }))} />
        <KpiCard title="SQL (Acceptés Ventes)" value={mktStats.sql}                             trend={14.8} trendType="up"   icon={<Target size={20} />}   color="#10B981" sparklineData={leadFunnel.map(d => ({ val: d.sql / 5 }))} />
        <KpiCard title="Taux Conv. Visiteur→MQL" value={`${mktStats.convVisiteur}%`}            trend={0.4}  trendType="up"   icon={<Activity size={20} />} color="#F59E0B" sparklineData={[{val:2.2},{val:2.4},{val:2.5},{val:2.7},{val:2.8}]} />
        <KpiCard title="Clients Signés"          value={mktStats.clients}                       trend={9.2}  trendType="up"   icon={<CheckCircle2 size={20}/>}color="#EC4899" sparklineData={leadFunnel.map(d => ({ val: d.clients }))} />
      </motion.div>

      {/* Funnel Chart */}
      <motion.div variants={fadeIn} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Évolution MQL → SQL → Clients (7 Mois)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={leadFunnel}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <YAxis yAxisId="left"  axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
              <Bar     yAxisId="left"  dataKey="mql"     name="MQL"     fill="#8B5CF630" radius={[4,4,0,0]} barSize={20} />
              <Bar     yAxisId="left"  dataKey="sql"     name="SQL"     fill="#3B82F6"   radius={[4,4,0,0]} barSize={20} />
              <Line    yAxisId="right" dataKey="clients" name="Clients" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4, fill: '#10B981' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Conversion Funnel */}
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Entonnoir de Conversion</h4>
          {[
            { label: 'Visiteurs', val: 82000, pct: 100, color: '#3B82F6' },
            { label: 'MQL',       val: mktStats.mql, pct: Math.round((mktStats.mql / 82000) * 100 * 10) / 10, color: '#8B5CF6' },
            { label: 'SQL',       val: mktStats.sql, pct: Math.round((mktStats.sql / mktStats.mql) * 100), color: '#F59E0B' },
            { label: 'Clients',   val: mktStats.clients, pct: Math.round((mktStats.clients / mktStats.sql) * 100), color: '#10B981' },
          ].map((step, i, arr) => (
            <div key={i} style={{ marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600 }}>{step.label}</span>
                <span style={{ color: step.color, fontWeight: 700 }}>{step.val.toLocaleString('fr-FR')}</span>
              </div>
              <div style={{ height: '10px', background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${step.pct}%` }} transition={{ duration: 1, delay: i * 0.15 }}
                  style={{ height: '100%', background: step.color, borderRadius: '999px' }} />
              </div>
              {i < arr.length - 1 && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '2px' }}>
                  → {step.pct}% conv.
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Campaigns Table */}
      <motion.div variants={fadeIn}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Campagnes Actives</h4>
          <button onClick={() => setCampaignModal(true)} className="glass" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.4rem 0.9rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
            <Plus size={14} /> Nouvelle Campagne
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1rem' }}>
          {[...campaigns, ...Array(Math.max(0, 3 - campaigns.length)).fill(null)].filter(Boolean).map((camp, i) => (
            <motion.div key={i} variants={fadeIn} whileHover={{ y: -3 }} onClick={() => onOpenDetail?.(camp, 'marketing', 'campaigns')} className="glass"
              style={{ padding: '1.25rem', borderRadius: '1.25rem', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <Chip label={camp.type} color="#8B5CF6" />
                <Chip label={camp.statut} color={camp.statut === 'En cours' ? '#10B981' : camp.statut === 'Terminé' ? '#64748B' : '#F59E0B'} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.75rem' }}>{camp.nom}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Budget: </span><strong>{formatCurrency(camp.budget, true)}</strong></div>
                <div style={{ color: '#10B981', fontWeight: 700 }}>ROI: {camp.roi || '—'}x</div>
              </div>
            </motion.div>
          ))}
          <motion.div whileHover={{ scale: 1.02 }} onClick={() => setCampaignModal(true)} className="glass"
            style={{ padding: '1.25rem', borderRadius: '1.25rem', border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-muted)', minHeight: '120px' }}>
            <Plus size={24} /><span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Nouvelle Campagne</span>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );

  /* ════════════════════════════
     SUB-VIEW: ROI & CAMPAGNES
  ════════════════════════════ */
  const renderROI = () => (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Budget Overview */}
      <motion.div variants={fadeIn} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <KpiCard title="Budget Total Consommé" value={formatCurrency(mktStats.totalBudget, true)} trend={-8.4} trendType="up" icon={<CreditCard size={20} />} color="#F43F5E" sparklineData={[{val:10},{val:11},{val:11.5},{val:12},{val:12.5}]} />
        <KpiCard title="ROI Global Marketing" value={`${mktStats.roiGlobal}x`} trend={12.5} trendType="up" icon={<TrendingUp size={20} />} color="#10B981" sparklineData={[{val:2.8},{val:3.0},{val:3.1},{val:3.3},{val:3.4}]} />
        <KpiCard title="CAC Moyen"             value={formatCurrency(mktStats.cac)} trend={5.4} trendType="up" icon={<DollarSign size={20} />} color="#F59E0B" sparklineData={[{val:140},{val:138},{val:135},{val:130},{val:125}]} />
        <KpiCard title="Budget Restant"       value={formatCurrency(mktStats.budgetAlloc - mktStats.totalBudget, true)} trend={0} trendType="up" icon={<Activity size={20} />} color="#8B5CF6" sparklineData={[{val:6},{val:5},{val:4},{val:3},{val:2.5}]} />
      </motion.div>

      {/* Budget Bar */}
      <motion.div variants={fadeIn} className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
          <span style={{ fontWeight: 700 }}>Consommation Budget Trimestriel</span>
          <span style={{ fontWeight: 700, color: mktStats.budgetPct > 90 ? '#EF4444' : '#10B981' }}>{mktStats.budgetPct}%</span>
        </div>
        <div style={{ height: '14px', background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${mktStats.budgetPct}%` }} transition={{ duration: 1.2 }}
            style={{ height: '100%', background: `linear-gradient(90deg, #10B981, ${mktStats.budgetPct > 90 ? '#EF4444' : '#3B82F6'})`, borderRadius: '999px' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          <span>0</span>
          <span>{formatCurrency(mktStats.totalBudget, true)} dépensés</span>
          <span>{formatCurrency(mktStats.budgetAlloc, true)} alloués</span>
        </div>
      </motion.div>

      {/* ROI par Canal */}
      <motion.div variants={fadeIn} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>ROI par Canal Marketing</h4>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={channelROI} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis type="category" dataKey="canal" axisLine={false} tickLine={false} tick={{ fill: 'var(--text)', fontSize: 11 }} width={100} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="roi" name="ROI (%)" radius={[0, 6, 6, 0]} barSize={16}>
                {channelROI.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Revenus vs Dépenses / Canal</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {channelROI.map((c, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px' }}>
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, display: 'inline-block' }} />
                    {c.canal}
                  </span>
                  <span style={{ color: '#10B981', fontWeight: 700 }}>+{c.roi}%</span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((c.roi / 700) * 100, 100)}%` }} transition={{ duration: 1, delay: i * 0.1 }}
                    style={{ height: '100%', background: c.color, borderRadius: '999px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  /* ════════════════════════════
     SUB-VIEW: ENGAGEMENT & TRAFIC
  ════════════════════════════ */
  const renderEngagement = () => (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Web KPIs */}
      <motion.div variants={fadeIn}>
        <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Globe size={16} color="#3B82F6" /> Trafic Web — 4 Dernières Semaines
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <KpiCard title="Sessions Mensuelles"  value={(65000).toLocaleString('fr-FR')} trend={10.2} trendType="up"   icon={<Monitor size={20} />}       color="#3B82F6" sparklineData={webTrend.map(d => ({ val: d.sessions / 1000 }))} />
          <KpiCard title="Pages Vues"            value={(174000).toLocaleString('fr-FR')}trend={8.4}  trendType="up"   icon={<Eye size={20} />}           color="#8B5CF6" sparklineData={webTrend.map(d => ({ val: d.pageVues / 1000 }))} />
          <KpiCard title="Taux de Rebond"        value="39.2%"                          trend={2.8}  trendType="up"   icon={<RefreshCcw size={20} />}    color="#10B981" sparklineData={[{val:44},{val:42},{val:41},{val:40},{val:39}]} />
          <KpiCard title="Durée Moy. Session"   value="3m 42s"                         trend={5.1}  trendType="up"   icon={<Activity size={20} />}      color="#F59E0B" sparklineData={[{val:2.8},{val:3.1},{val:3.3},{val:3.5},{val:3.7}]} />
        </div>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={webTrend}>
              <defs>
                <linearGradient id="sessGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="sem" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
              <Area type="monotone" dataKey="sessions"  name="Sessions"   stroke="#3B82F6" strokeWidth={2.5} fill="url(#sessGrad)" />
              <Area type="monotone" dataKey="pageVues"  name="Pages Vues" stroke="#8B5CF6" strokeWidth={2}   fill={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Email Performance */}
      <motion.div variants={fadeIn}>
        <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Mail size={16} color="#8B5CF6" /> Performance Email Marketing
        </h4>
        <div className="glass" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', textAlign: 'left' }}>
            <thead style={{ background: 'var(--bg-subtle)' }}>
              <tr>
                {['Campagne Email', 'Envoyés', 'Taux Ouverture', 'Taux Clic', 'Désinscrits'].map((h, i) => (
                  <th key={i} style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.73rem', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {emailStats.map((e, i) => (
                <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.9rem 1.25rem', fontWeight: 700 }}>{e.campagne}</td>
                  <td style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)' }}>{e.envoye.toLocaleString('fr-FR')}</td>
                  <td style={{ padding: '0.9rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 700, color: e.ouverture > 35 ? '#10B981' : e.ouverture > 25 ? '#F59E0B' : '#EF4444' }}>{e.ouverture}%</span>
                      <div style={{ width: '50px', height: '5px', background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ width: `${e.ouverture}%`, height: '100%', background: e.ouverture > 35 ? '#10B981' : '#F59E0B', borderRadius: '999px' }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.9rem 1.25rem' }}>
                    <span style={{ fontWeight: 700, color: e.clic > 8 ? '#10B981' : '#F59E0B' }}>{e.clic}%</span>
                  </td>
                  <td style={{ padding: '0.9rem 1.25rem' }}>
                    <span style={{ color: e.desinscrit > 0.5 ? '#EF4444' : 'var(--text-muted)' }}>{e.desinscrit}%</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Social Media */}
      <motion.div variants={fadeIn}>
        <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Share2 size={16} color="#EC4899" /> Réseaux Sociaux & Engagement
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
          {socialData.map((s, i) => (
            <motion.div key={i} variants={fadeIn} whileHover={{ y: -3 }} className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ fontSize: '1.8rem' }}>{s.icon}</div>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: s.color }}>
                  {s.engagement}% <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>eng.</span>
                </span>
              </div>
              <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{s.reseau}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.75rem' }}>
                <div style={{ background: 'var(--bg-subtle)', borderRadius: '0.6rem', padding: '0.5rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Abonnés</div>
                  <div style={{ fontWeight: 700 }}>{(s.followers / 1000).toFixed(1)}K</div>
                </div>
                <div style={{ background: 'var(--bg-subtle)', borderRadius: '0.6rem', padding: '0.5rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Reach</div>
                  <div style={{ fontWeight: 700 }}>{(s.reach / 1000).toFixed(0)}K</div>
                </div>
              </div>
              <div style={{ height: '4px', background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden', marginTop: '0.75rem' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((s.engagement / 10) * 100, 100)}%` }} transition={{ duration: 1, delay: i * 0.1 }}
                  style={{ height: '100%', background: s.color, borderRadius: '999px' }} />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );

  /* ─── MAIN TABS ─── */
  const tabs = [
    { id: 'leadgen',    label: 'Génération de Leads', icon: <Target size={15} /> },
    { id: 'roi',        label: 'ROI & Campagnes',      icon: <BarChart3 size={15} /> },
    { id: 'engagement', label: 'Engagement & Trafic',  icon: <Share2 size={15} /> },
  ];

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#EC4899', marginBottom: '0.4rem' }}>
            <Megaphone size={16} />
            <span style={{ fontWeight: 800, fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Marketing — Growth Intelligence</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Marketing & Croissance</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.3rem 0 0 0', fontSize: '0.92rem' }}>
            Lead Gen · ROI Campagnes · Engagement Digital
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setCampaignModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={17} /> Nouvelle Campagne
        </button>
      </div>

      <TabBar tabs={tabs} active={mainTab} onChange={setMainTab} />

      {mainTab === 'leadgen'    && renderLeadGen()}
      {mainTab === 'roi'        && renderROI()}
      {mainTab === 'engagement' && renderEngagement()}

      <RecordModal isOpen={campaignModal} onClose={() => setCampaignModal(false)}
        onSave={f => { addRecord('marketing', 'campaigns', f); setCampaignModal(false); }}
        title="Paramètres de Campagne Marketing" fields={modalFields} />
    </div>
  );
};

export default Marketing;
