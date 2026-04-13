import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Package,
  Target, Globe, Activity, Zap, Star, AlertTriangle, CheckCircle2, 
  ArrowUpRight, Layers, BarChart2, Download
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, ComposedChart,
  XAxis, YAxis, Tooltip, CartesianGrid, Line, Legend, Cell,
  PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { useBusiness } from '../BusinessContext';
import KpiCard from '../components/KpiCard';

/* ─── Helpers ─── */
const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', background: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: '0.9rem', border: '1px solid var(--border)', gap: '0.2rem', width: 'fit-content' }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)} style={{ padding: '0.45rem 1rem', borderRadius: '0.7rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', background: active === t.id ? 'var(--bg)' : 'transparent', color: active === t.id ? 'var(--accent)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {t.icon} {t.label}
      </button>
    ))}
  </div>
);

const TT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass" style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', fontSize: '0.8rem' }}>
      <p style={{ fontWeight: 700, marginBottom: '4px' }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color, margin: '2px 0' }}>{p.name}: {p.value?.toLocaleString?.('fr-FR') ?? p.value}</p>)}
    </div>
  );
};

/* ════════════════════════════════════
   BI MODULE — Strategic Intelligence
   Now integrated into IPC Platform
   ════════════════════════════════════ */
const BI = () => {
  const { data, formatCurrency } = useBusiness();
  const [tab, setTab] = useState('executive');

  const stats = useMemo(() => {
    const totalCA = data.sales?.orders?.reduce((s, o) => s + (o.totalTTC || 0), 0) || 1250000000;
    const pipeline = data.crm?.opportunities?.reduce((s, o) => s + (o.montant || 0), 0) || 450000000;
    return { totalCA, pipeline, ebitda: totalCA * 0.18, nps: 84, churn: 2.1 };
  }, [data]);

  const pl12 = [
    { m: 'Oct25', ca: 85, couts: 65, ebitda: 20 },
    { m: 'Nov25', ca: 92, couts: 70, ebitda: 22 },
    { m: 'Déc25', ca: 110, couts: 82, ebitda: 28 },
    { m: 'Jan26', ca: 95, couts: 75, ebitda: 20 },
    { m: 'Fév26', ca: 98, couts: 74, ebitda: 24 },
    { m: 'Mar26', ca: 105, couts: 78, ebitda: 27 },
  ];

  const orgHealth = [
    { subject: 'Finance', val: 88 },
    { subject: 'RH', val: 92 },
    { subject: 'Ventes', val: 75 },
    { subject: 'Production', val: 82 },
    { subject: 'IT', val: 95 },
  ];

  /* ─── Executive View Renderer ─── */
  const renderExecutive = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <KpiCard title="CA Annualisé" value={formatCurrency(stats.totalCA, true)} trend={14.5} icon={<DollarSign size={20}/>} color="#3B82F6" />
        <KpiCard title="EBITDA Est." value={formatCurrency(stats.ebitda, true)} trend={6.2} icon={<TrendingUp size={20}/>} color="#10B981" />
        <KpiCard title="Marge Brute" value="38.4%" trend={1.2} icon={<BarChart3 size={20}/>} color="#8B5CF6" />
        <KpiCard title="Pipeline CRM" value={formatCurrency(stats.pipeline, true)} trend={8.5} icon={<Target size={20}/>} color="#F59E0B" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
          <h4 style={{ fontWeight: 800, marginBottom: '1.5rem' }}>Performance — 12 Mois Glissants (M FCFA)</h4>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={pl12}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip content={<TT />} />
              <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
              <Bar dataKey="ca" name="CA (M)" fill="#3B82F630" radius={[4,4,0,0]} barSize={20} />
              <Line dataKey="ebitda" name="EBITDA (M)" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
           <h4 style={{ fontWeight: 800 }}>Santé Organisationnelle</h4>
           <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={orgHealth}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Santé" dataKey="val" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.4} strokeWidth={2} />
                  <Tooltip content={<TT />} />
                </RadarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8B5CF6', marginBottom: '0.4rem' }}>
            <BarChart3 size={16} /><span style={{ fontWeight: 800, fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Intelligence Stratégique</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Business Intelligence</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.3rem 0 0 0' }}>Dashboards exécutifs · Santé Org · Prévisions IA</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <button className="glass btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Download size={14} /> Rapport Mensuel
           </button>
        </div>
      </div>

      <TabBar tabs={[
        { id: 'executive', label: 'Vue Exécutive', icon: <Star size={14}/> },
        { id: 'analytics', label: 'Analytique Profil', icon: <Activity size={14}/> },
        { id: 'forecasts', label: 'Prévisions IA', icon: <Zap size={14}/> },
      ]} active={tab} onChange={setTab} />

      <AnimatePresence mode="wait">
        {tab === 'executive' && renderExecutive()}
        {tab !== 'executive' && (
           <motion.div key="other" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass" style={{ padding: '4rem', borderRadius: '2rem', textAlign: 'center' }}>
              <Activity size={48} color="var(--accent)" style={{ opacity: 0.3, marginBottom: '1.5rem' }} />
              <h3 style={{ fontWeight: 800 }}>Moteur de Calcul en cours...</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Votre pôle BI compile les données de 12 modules opérationnels pour générer vos analyses.</p>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BI;
