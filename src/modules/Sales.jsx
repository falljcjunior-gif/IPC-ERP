import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingCart, Package, Plus, FileText, ChevronRight, MoreVertical,
  Tag, Clock, CheckCircle2, BarChart3, Layout, TrendingUp, TrendingDown,
  DollarSign, Target, Users, Award, Zap, Star, Crown, AlertTriangle,
  ArrowUpRight, Briefcase, Activity, Globe, RefreshCcw, Filter
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, LineChart, Line, Legend, Cell, ComposedChart,
  ReferenceLine, PieChart, Pie, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { useBusiness } from '../BusinessContext';
import RecordModal from '../components/RecordModal';
import KpiCard from '../components/KpiCard';

/* ─── Animation Variants ─── */
const fadeIn = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } } };
const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

/* ─── Shared Components ─── */
const Chip = ({ label, color = '#64748B' }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: '999px', background: `${color}18`, color, fontSize: '0.72rem', fontWeight: 700 }}>{label}</span>
);

const SectionTitle = ({ icon, label, color }) => (
  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '6px', color }}>
    {icon} {label}
  </h3>
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

const Tooltip2 = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass" style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.8rem', minWidth: '130px' }}>
      <p style={{ fontWeight: 700, marginBottom: '4px' }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color, margin: '2px 0' }}>{p.name}: {typeof p.value === 'number' ? p.value.toLocaleString('fr-FR') : p.value}</p>)}
    </div>
  );
};

/* ─── STATUS badge color map ─── */
const COLOR_STATUS = {
  'Confirmé': '#10B981', 'Livré': '#3B82F6', 'Facturé': '#8B5CF6',
  'Brouillon': '#64748B', 'Annulé': '#EF4444'
};

/* ══════════════════════════════════════
   SALES MODULE
══════════════════════════════════════ */
const Sales = ({ onOpenDetail }) => {
  const { data, addRecord, formatCurrency } = useBusiness();
  const [mainTab, setMainTab] = useState('pipeline');
  const [orderModal, setOrderModal] = useState(false);

  const { orders = [] } = data?.sales || {};
  const products = useMemo(() => data?.base?.catalog || [], [data?.base?.catalog]);
  const contacts = useMemo(() => (data?.base?.contacts || []).filter(c => c.type === 'Client' || c.type === 'Partenaire'), [data?.base?.contacts]);
  const opportunities = useMemo(() => data?.crm?.opportunities || [], [data?.crm?.opportunities]);

  /* ─── Aggregated Pipeline KPIs ─── */
  const pipeline = useMemo(() => {
    const stages = ['Prospection', 'Qualification', 'Proposition', 'Négociation', 'Contrat envoyé'];
    const byPhase = stages.map(s => ({
      phase: s,
      montant: opportunities.filter(o => o.etape === s || (s === 'Prospection' && o.etape === 'Nouveau')).reduce((acc, o) => acc + (o.montant || 0), 0),
      count: opportunities.filter(o => o.etape === s || (s === 'Prospection' && o.etape === 'Nouveau')).length,
    }));
    const total = opportunities.reduce((s, o) => s + (o.montant || 0), 0);
    const weighted = opportunities.reduce((s, o) => s + (o.montant || 0) * ((o.probabilite || 0) / 100), 0);
    const won = opportunities.filter(o => o.etape === 'Gagné');
    const lost = opportunities.filter(o => o.etape === 'Perdu');
    const winRate = (won.length + lost.length) > 0 ? Math.round((won.length / (won.length + lost.length)) * 100) : 0;
    return { byPhase, total, weighted, winRate, won, lost };
  }, [opportunities]);

  /* ─── Forecasting Chart (monthly projected) ─── */
  const forecastData = useMemo(() => [], []);

  /* ─── Team Performance Data ─── */
  const teamData = useMemo(() => [], []);

  /* ─── Key Accounts ─── */
  const keyAccounts = useMemo(() => [], []);

  const radarData = teamData.map(t => ({
    rep: t.rep.split(' ')[1], quota: Math.round((t.realise / t.quota) * 100), rdv: Math.round((t.rdv / 35) * 100), winRate: t.winRate
  }));

  /* ─── Modal Fields ─── */
  const modalFields = [
    { name: 'num',    label: 'N° Commande', required: true, placeholder: 'CMD-2026-X' },
    { name: 'client', label: 'Client', type: 'select', options: contacts.map(c => c.nom), required: true },
    { name: 'date',   label: 'Date', type: 'date', required: true },
    { name: 'totalHT',label: 'Total HT (FCFA)', type: 'number', required: true },
    { name: 'statut', label: 'Statut', type: 'select', options: ['Brouillon', 'Confirmé', 'Livré', 'Facturé'], required: true },
    { name: 'devise', label: 'Devise', type: 'select', options: ['FCFA', 'EUR', 'USD'], required: true },
  ];

  /* ═══════════════════════
     SUB-VIEW: PIPELINE & FORECAST
  ═══════════════════════ */
  const renderPipeline = () => (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* KPIs */}
      <motion.div variants={fadeIn} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <KpiCard title="Pipeline Brut Total"  value={formatCurrency(pipeline.total, true)}    trend={0}  trendType="up"   icon={<DollarSign size={20} />}  color="#3B82F6" sparklineData={[]} />
        <KpiCard title="Pipeline Pondéré"     value={formatCurrency(pipeline.weighted, true)} trend={0}  trendType="up"   icon={<Target size={20} />}      color="#8B5CF6" sparklineData={[]} />
        <KpiCard title="Win Rate Global"      value={`${pipeline.winRate}%`}                  trend={0}  trendType="up"   icon={<Award size={20} />}       color="#10B981" sparklineData={[]} />
        <KpiCard title="Opportunités Actives" value={opportunities.filter(o => !['Gagné','Perdu'].includes(o.etape)).length} trend={0} trendType="up" icon={<Briefcase size={20} />} color="#F59E0B" sparklineData={[]} />
      </motion.div>

      {/* Pipeline Funnel + Forecast */}
      <motion.div variants={fadeIn} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Répartition par Phase</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {['Prospection','Qualification','Proposition','Négociation','Contrat envoyé'].map((phase, i) => {
              const cnt = pipeline.byPhase[i]?.count || 0;
              const mt  = pipeline.byPhase[i]?.montant || 0;
              const pct = pipeline.total > 0 ? Math.round((mt / pipeline.total) * 100) : 0;
              const colors = ['#64748B','#3B82F6','#8B5CF6','#F59E0B','#10B981'];
              return (
                <div key={phase}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>{phase} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({cnt})</span></span>
                    <span style={{ color: colors[i], fontWeight: 700 }}>{pct}%</span>
                  </div>
                  <div style={{ height: '7px', background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: i * 0.1 }}
                      style={{ height: '100%', background: colors[i], borderRadius: '999px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Prévisions de Revenus — 5 Prochains Mois</h4>
          <ResponsiveContainer width="100%" height={230}>
            <ComposedChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `${(v/1e9).toFixed(1)}Md`} />
              <Tooltip content={<Tooltip2 />} />
              <Legend wrapperStyle={{ fontSize: '0.78rem', paddingTop: '0.5rem' }} />
              <Bar     dataKey="pipeline" name="Pipeline Brut" fill="#3B82F630" radius={[4,4,0,0]} barSize={22} />
              <Line    dataKey="pondéré"  name="Pondéré"       stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 4, fill: '#8B5CF6' }} />
              <Line    dataKey="objectif" name="Objectif"      stroke="#10B981" strokeWidth={2} strokeDasharray="5 3" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Commandes récentes */}
      <motion.div variants={fadeIn}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Commandes Récentes</h4>
          <button className="glass" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.9rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
            onClick={() => setOrderModal(true)}><Plus size={14} /> Nouvelle Commande</button>
        </div>
        <div className="glass" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'left' }}>
            <thead style={{ background: 'var(--bg-subtle)' }}>
              <tr>{['Réf.', 'Client', 'Date', 'Total TTC', 'Statut', ''].map((h, i) => <th key={i} style={{ padding: '0.85rem 1.25rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {orders.slice(0, 8).map((o, i) => (
                <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                  onClick={() => onOpenDetail?.(o, 'sales', 'orders')}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                  <td style={{ padding: '0.9rem 1.25rem', fontWeight: 700 }}>{o.num}</td>
                  <td style={{ padding: '0.9rem 1.25rem' }}>{o.client}</td>
                  <td style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)' }}>{o.date}</td>
                  <td style={{ padding: '0.9rem 1.25rem', fontWeight: 700 }}>{formatCurrency(o.totalTTC || o.totalHT)}</td>
                  <td style={{ padding: '0.9rem 1.25rem' }}><Chip label={o.statut} color={COLOR_STATUS[o.statut] || '#64748B'} /></td>
                  <td style={{ padding: '0.9rem 1.25rem' }}><ChevronRight size={16} color="var(--text-muted)" /></td>
                </motion.tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Aucune commande enregistrée.</td></tr>}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );

  /* ═══════════════════════
     SUB-VIEW: PERFORMANCE ÉQUIPES
  ═══════════════════════ */
  const renderTeam = () => (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Leaderboard */}
      <motion.div variants={fadeIn}>
        <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Crown size={16} color="#F59E0B" /> Classement Commerciaux
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {teamData.sort((a, b) => (b.realise / b.quota) - (a.realise / a.quota)).map((rep, i) => {
            const pct = Math.round((rep.realise / rep.quota) * 100);
            const overachiever = pct >= 100;
            return (
              <motion.div key={i} variants={fadeIn} className="glass" style={{ padding: '1.25rem 1.5rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '1.25rem', borderLeft: `4px solid ${overachiever ? '#10B981' : pct > 75 ? '#F59E0B' : '#EF4444'}` }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', background: i === 0 ? '#F59E0B' : i === 1 ? '#CBD5E1' : i === 2 ? '#B45309' : 'var(--bg-subtle)', color: i < 3 ? 'white' : 'var(--text-muted)' }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{rep.rep}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rep.region}</div>
                </div>
                {/* Quota bar */}
                <div style={{ flex: 2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                    <span>{formatCurrency(rep.realise, true)}</span>
                    <span style={{ color: 'var(--text-muted)' }}>/{formatCurrency(rep.quota, true)}</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ duration: 1, delay: i * 0.1 }}
                      style={{ height: '100%', background: overachiever ? '#10B981' : pct > 75 ? '#F59E0B' : '#EF4444', borderRadius: '999px' }} />
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: '60px' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: overachiever ? '#10B981' : pct > 75 ? '#F59E0B' : '#EF4444' }}>{pct}%</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>quota</div>
                </div>
                <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <div><span style={{ fontWeight: 700, color: 'var(--text)' }}>{rep.rdv}</span> RDV</div>
                  <div><span style={{ fontWeight: 700, color: 'var(--text)' }}>{rep.winRate}%</span> Win</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Activity Volume + Radar */}
      <motion.div variants={fadeIn} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Volume d'Activité Commerciale</h4>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={teamData} margin={{ left: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="rep" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => v.split(' ')[1]} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip content={<Tooltip2 />} />
              <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
              <Bar dataKey="appels" name="Appels" fill="#3B82F6" radius={[4,4,0,0]} barSize={14} />
              <Bar dataKey="emails" name="Emails" fill="#8B5CF6" radius={[4,4,0,0]} barSize={14} />
              <Bar dataKey="rdv"    name="RDV"    fill="#10B981" radius={[4,4,0,0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Profil Radar — Top 5</h4>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="rep" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="% Quota"  dataKey="quota"   stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} />
              <Radar name="Win Rate" dataKey="winRate" stroke="#10B981" fill="#10B981" fillOpacity={0.15} />
              <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </motion.div>
  );

  /* ═══════════════════════
     SUB-VIEW: KEY ACCOUNTS
  ═══════════════════════ */
  const renderKeyAccounts = () => (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <motion.div variants={fadeIn} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '0.5rem' }}>
        <KpiCard title="CA Comptes Clés"   value={formatCurrency(keyAccounts.reduce((s,k)=>s+k.ca,0), true)} trend={0} trendType="up" icon={<Crown size={20}/>}    color="#F59E0B" sparklineData={[]} />
        <KpiCard title="Santé Moy. Clients" value={`${Math.round(keyAccounts.reduce((s,k)=>s+k.health,0)/keyAccounts.length)}/100`} trend={0} trendType="up" icon={<Activity size={20}/>} color="#10B981" sparklineData={[]} />
        <KpiCard title="Opportunités Cross-sell" value={keyAccounts.length} trend={0} trendType="up" icon={<ArrowUpRight size={20}/>} color="#8B5CF6" sparklineData={[]} />
      </motion.div>

      {keyAccounts.map((acc, i) => {
        const healthColor = acc.health >= 80 ? '#10B981' : acc.health >= 60 ? '#F59E0B' : '#EF4444';
        const churnColor  = acc.churnRisk === 'Faible' ? '#10B981' : acc.churnRisk === 'Moyen' ? '#F59E0B' : '#EF4444';
        return (
          <motion.div key={i} variants={fadeIn} className="glass"
            style={{ padding: '1.5rem', borderRadius: '1.25rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Rank */}
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `${healthColor}15`, color: healthColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', flexShrink: 0 }}>
              {i + 1}
            </div>
            {/* Name & Region */}
            <div style={{ flex: '1 1 160px' }}>
              <div style={{ fontWeight: 800, fontSize: '1rem' }}>{acc.name}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{acc.region}</div>
            </div>
            {/* CA */}
            <div style={{ flex: '0 1 140px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '2px' }}>CA Annuel</div>
              <div style={{ fontWeight: 800, fontSize: '1rem' }}>{formatCurrency(acc.ca, true)}</div>
            </div>
            {/* Health Score */}
            <div style={{ flex: '0 1 140px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Score de Santé</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ flex: 1, height: '8px', background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${acc.health}%`, height: '100%', background: healthColor, borderRadius: '999px' }} />
                </div>
                <span style={{ fontWeight: 700, color: healthColor, fontSize: '0.85rem' }}>{acc.health}</span>
              </div>
            </div>
            {/* Churn Risk */}
            <div style={{ flex: '0 1 120px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Risque Churn</div>
              <Chip label={acc.churnRisk} color={churnColor} />
            </div>
            {/* Cross-sell */}
            <div style={{ flex: '1 1 220px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>💡 Opportunité Cross/Up-sell</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#8B5CF6' }}>{acc.upsell}</div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );

  /* ─── MAIN TABS ─── */
  const tabs = [
    { id: 'pipeline', label: 'Pipeline & Prévisions', icon: <TrendingUp size={15} /> },
    { id: 'team',     label: 'Performance Équipes',   icon: <Users size={15} /> },
    { id: 'accounts', label: 'Comptes Clés',           icon: <Crown size={15} /> },
    { id: 'catalog',  label: 'Catalogue Produits',     icon: <Package size={15} /> },
  ];

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', marginBottom: '0.4rem' }}>
            <Zap size={16} fill="var(--accent)" />
            <span style={{ fontWeight: 800, fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Ventes — Sales Intelligence</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Ventes & Commerce</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.3rem 0 0 0', fontSize: '0.92rem' }}>Pipeline · Prévisions · Performance Équipes · Comptes Clés</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOrderModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={17} /> Nouvelle Commande
        </button>
      </div>

      <TabBar tabs={tabs} active={mainTab} onChange={setMainTab} />

      {mainTab === 'pipeline'  && renderPipeline()}
      {mainTab === 'team'      && renderTeam()}
      {mainTab === 'accounts'  && renderKeyAccounts()}
      {mainTab === 'catalog'   && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {products.map(prod => (
            <motion.div key={prod.id} whileHover={{ y: -4 }} onClick={() => onOpenDetail?.(prod, 'sales', 'products')} className="glass"
              style={{ padding: '1.5rem', borderRadius: '1.25rem', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <Tag size={18} color="var(--accent)" />
                <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{prod.code}</span>
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem' }}>{prod.nom}</h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{prod.categorie} · {prod.type}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{formatCurrency(prod.prixMoyen)}</div>
            </motion.div>
          ))}
          <motion.div whileHover={{ scale: 1.02 }} onClick={() => setOrderModal(true)} className="glass"
            style={{ padding: '1.5rem', borderRadius: '1.25rem', border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', cursor: 'pointer', color: 'var(--text-muted)', minHeight: '140px' }}>
            <Plus size={26} /><span style={{ fontWeight: 600 }}>Nouveau Produit</span>
          </motion.div>
        </div>
      )}

      <RecordModal isOpen={orderModal} onClose={() => setOrderModal(false)} onSave={f => { addRecord('sales', 'orders', f); setOrderModal(false); }} title="Nouvelle Commande" fields={modalFields} />
    </div>
  );
};

export default Sales;
