import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Package,
  Download, Filter, Zap, Target, Globe, Activity, RefreshCcw,
  Star, AlertTriangle, CheckCircle2, ArrowUpRight, Layers, PieChart as PieIcon
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, ComposedChart,
  XAxis, YAxis, Tooltip, CartesianGrid, Line, Legend, Cell,
  PieChart, Pie, ScatterChart, Scatter, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Treemap
} from 'recharts';
import { useBusiness } from '../BusinessContext';
import KpiCard from '../components/KpiCard';

const fadeIn = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', background: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: '0.9rem', border: '1px solid var(--border)', gap: '0.2rem', width: 'fit-content', flexWrap: 'wrap' }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)} style={{ padding: '0.48rem 1.05rem', borderRadius: '0.7rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.83rem', background: active === t.id ? 'var(--bg)' : 'transparent', color: active === t.id ? 'var(--accent)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.2s' }}>
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
   BI MODULE — Enterprise Intelligence
════════════════════════════════════ */
const BI = () => {
  const { data, formatCurrency } = useBusiness();
  const [tab, setTab] = useState('executive');
  const [period, setPeriod] = useState('30d');

  /* ─── Cross-departmental Aggregation ─── */
  const stats = useMemo(() => {
    const totalCA      = data.sales.orders.reduce((s, o) => s + (o.totalTTC || 0), 0);
    const pipeline     = data.crm.opportunities.reduce((s, o) => s + (o.montant || 0), 0);
    const masse        = data.hr.employees.length * 0;
    const cac          = 0;
    const ltv          = 0;
    const ebitda       = 0;
    const margeBrute   = 0;
    const margeNette   = 0;
    const churn        = 0;
    const nps          = 0;
    return { totalCA, pipeline, masse, cac, ltv, ebitda, margeBrute, margeNette, churn, nps };
  }, [data]);

  /* ─── Monthly P&L 12 mois ─── */
  const pl12 = [];

  /* ─── CA par activité ─── */
  const caBySegment = [];

  /* ─── Scorecard KPIs par département ─── */
  const deptScores = [];

  /* ─── RegionPerf ─── */
  const regionPerf = [];

  /* ─── Radar Santé Org ─── */
  const orgHealth = [];

  /* ─── Prévisions IA ─── */
  const forecasts = [];

  /* ═══════════ EXECUTIVE DASHBOARD ═══════════ */
  const renderExecutive = () => (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* C-Suite KPIs */}
      <motion.div variants={fadeIn} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <KpiCard title="CA Annualisé"     value={formatCurrency(stats.totalCA, true)}     trend={14.5} trendType="up"   icon={<DollarSign size={20}/>}  color="#3B82F6" sparklineData={pl12.slice(-5).map(d=>({val:d.ca}))} />
        <KpiCard title="EBITDA Est."      value={formatCurrency(stats.ebitda, true)}       trend={6.2}  trendType="up"   icon={<TrendingUp size={20}/>}  color="#10B981" sparklineData={pl12.slice(-5).map(d=>({val:d.ebitda}))} />
        <KpiCard title="Marge Brute"      value={`${stats.margeBrute}%`}                trend={1.2}  trendType="up"   icon={<BarChart3 size={20}/>}   color="#8B5CF6" sparklineData={[{val:36},{val:37},{val:37.5},{val:38},{val:38.4}]} />
        <KpiCard title="Pipeline CRM"     value={formatCurrency(stats.pipeline, true)}    trend={8.5}  trendType="up"   icon={<Target size={20}/>}      color="#F59E0B" sparklineData={[{val:200},{val:220},{val:240},{val:260},{val:275}]} />
        <KpiCard title="CAC Moyen"        value={formatCurrency(stats.cac)}               trend={-5.4} trendType="up"   icon={<Zap size={20}/>}         color="#EC4899" sparklineData={[{val:140},{val:135},{val:130},{val:128},{val:125}]} />
        <KpiCard title="LTV Clients"      value={formatCurrency(stats.ltv)}               trend={7.8}  trendType="up"   icon={<Star size={20}/>}        color="#14B8A6" sparklineData={[{val:780},{val:810},{val:840},{val:860},{val:880}]} />
        <KpiCard title="NPS"              value={stats.nps}                                trend={4.0}  trendType="up"   icon={<CheckCircle2 size={20}/>}color="#10B981" sparklineData={[{val:44},{val:46},{val:49},{val:51},{val:52}]} />
        <KpiCard title="Churn Rate"       value={`${stats.churn}%`}                      trend={-0.4} trendType="down" icon={<AlertTriangle size={20}/>}color="#EF4444" sparklineData={[{val:4.2},{val:4.1},{val:3.9},{val:3.8},{val:3.8}]} />
      </motion.div>

      {/* P&L 12 mois + CA par segment */}
      <motion.div variants={fadeIn} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>P&L — 12 Mois Glissants (M FCFA)</h4>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={pl12}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <Tooltip content={<TT />} />
              <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
              <Bar dataKey="ca"     name="CA (M)"    fill="#3B82F630" radius={[4,4,0,0]} barSize={16} />
              <Bar dataKey="couts"  name="Coûts (M)" fill="#EF444430" radius={[4,4,0,0]} barSize={16} />
              <Line dataKey="ebitda" name="EBITDA (M)" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3, fill: '#10B981' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Répartition CA par Segment</h4>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={caBySegment} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={4} dataKey="value">
                {caBySegment.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Pie>
              <Tooltip content={<TT />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.5rem' }}>
            {caBySegment.map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.fill, display: 'inline-block' }} />
                  {s.name}
                </div>
                <span style={{ fontWeight: 700 }}>{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Performance Régionale */}
      <motion.div variants={fadeIn}>
        <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>🌍 Performance par Région</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {regionPerf.map((r, i) => (
            <div key={i} className="glass" style={{ padding: '1.1rem 1.5rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', borderLeft: `4px solid ${r.color}` }}>
              <div style={{ flex: '1 1 140px', fontWeight: 700 }}>{r.region}</div>
              <div style={{ flex: '0 1 160px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CA</div>
                <div style={{ fontWeight: 800 }}>{formatCurrency(r.ca, true)}</div>
              </div>
              <div style={{ flex: '0 1 100px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Marge</div>
                <div style={{ fontWeight: 700, color: r.color }}>{r.marge}%</div>
              </div>
              <div style={{ flex: '0 1 120px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Croissance YoY</div>
                <div style={{ fontWeight: 800, color: r.growth > 20 ? '#10B981' : '#F59E0B', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <ArrowUpRight size={13} /> {r.growth}%
                </div>
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <div style={{ height: '6px', background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((r.ca / 520000000) * 100, 100)}%` }} transition={{ duration: 1, delay: i * 0.1 }}
                    style={{ height: '100%', background: r.color, borderRadius: '999px' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );

  /* ═══════════ SANTÉ ORGANISATION ═══════════ */
  const renderOrgHealth = () => (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <motion.div variants={fadeIn} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Radar Santé Organisationnelle</h4>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={orgHealth}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Score" dataKey="val" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.2} strokeWidth={2} />
              <Tooltip content={<TT />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Scorecard KPIs par Département</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {deptScores.map((dept, i) => (
              <div key={i}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {['💰','📈','👥','⚙️'][i]} {dept.dept}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {Object.entries(dept.scores).map(([k, v], j) => (
                    <div key={j} style={{ background: `${v >= 85 ? '#10B981' : v >= 70 ? '#F59E0B' : '#EF4444'}12`, border: `1px solid ${v >= 85 ? '#10B981' : v >= 70 ? '#F59E0B' : '#EF4444'}30`, borderRadius: '0.6rem', padding: '0.4rem 0.75rem', minWidth: '80px' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{k}</div>
                      <div style={{ fontWeight: 800, color: v >= 85 ? '#10B981' : v >= 70 ? '#F59E0B' : '#EF4444' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  /* ═══════════ PRÉVISIONS IA ═══════════ */
  const renderForecasts = () => (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <motion.div variants={fadeIn} className="glass" style={{ padding: '1.25rem 1.5rem', borderRadius: '1.25rem', background: 'linear-gradient(135deg, #1E1B4B10, #3B82F615)', border: '1px solid #3B82F630' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', borderRadius: '0.75rem', padding: '0.5rem', display: 'flex', alignItems: 'center' }}>
            <Zap size={18} color="white" fill="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>IPC Intelligence — Prévisions IA</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Modèle prédictif basé sur les données ERP croisées · Actualisé le 12/04/2026</div>
          </div>
        </div>
      </motion.div>

      {forecasts.map((f, i) => (
        <motion.div key={i} variants={fadeIn} className="glass" style={{ padding: '1.4rem 1.75rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{f.indicateur}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{f.note}</div>
          </div>
          <div style={{ flex: '0 1 160px' }}>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {f.tendance === 'up' ? <ArrowUpRight size={18} color="#10B981" /> : <TrendingDown size={18} color="#EF4444" />}
              {f.valeur}
            </div>
          </div>
          <div style={{ flex: '0 1 160px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Confiance IA</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ flex: 1, height: '6px', background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${f.confianceIA}%` }} transition={{ duration: 1, delay: i * 0.1 }}
                  style={{ height: '100%', background: f.confianceIA >= 85 ? '#10B981' : f.confianceIA >= 70 ? '#F59E0B' : '#EF4444', borderRadius: '999px' }} />
              </div>
              <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>{f.confianceIA}%</span>
            </div>
          </div>
        </motion.div>
      ))}

      {/* LTV/CAC scatter concept */}
      <motion.div variants={fadeIn} className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
        <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Ratio LTV / CAC — Efficacité d'Acquisition</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          {[
            { canal: 'Google Ads',    ltv: 820000, cac: 95000,  ratio: 8.6 },
            { canal: 'LinkedIn',      ltv: 1200000, cac: 180000, ratio: 6.7 },
            { canal: 'Emailing',      ltv: 680000, cac: 35000,  ratio: 19.4},
            { canal: 'Salons',        ltv: 950000, cac: 220000, ratio: 4.3 },
            { canal: 'SEO/Organic',   ltv: 740000, cac: 28000,  ratio: 26.4},
          ].map((c, i) => {
            const good = c.ratio >= 6;
            return (
              <div key={i} style={{ padding: '1rem', background: `${good ? '#10B981' : '#EF4444'}08`, borderRadius: '0.85rem', border: `1px solid ${good ? '#10B98130' : '#EF444430'}` }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>{c.canal}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: good ? '#10B981' : '#EF4444' }}>{c.ratio}x</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  LTV: {(c.ltv/1000).toFixed(0)}K · CAC: {(c.cac/1000).toFixed(0)}K FCFA
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: good ? '#10B981' : '#EF4444', marginTop: '4px' }}>
                  {good ? '✅ Rentable' : '⚠️ Sous objectif'}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8B5CF6', marginBottom: '0.4rem' }}>
            <BarChart3 size={16} /><span style={{ fontWeight: 800, fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Stratégie — Business Intelligence</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Intelligence Stratégique</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.3rem 0 0 0', fontSize: '0.92rem' }}>
            Executive Dashboard · P&L · Régions · Santé Org · Prévisions IA
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--bg-subtle)', padding: '0.2rem', borderRadius: '0.7rem', border: '1px solid var(--border)', gap: '0.15rem' }}>
            {['7d', '30d', '90d', 'YTD'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{ padding: '0.4rem 0.75rem', borderRadius: '0.55rem', border: 'none', background: period === p ? 'var(--bg)' : 'transparent', color: period === p ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>
                {p}
              </button>
            ))}
          </div>
          <button className="glass" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.55rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 600, fontSize: '0.84rem' }}>
            <Download size={15} /> Export PDF
          </button>
        </div>
      </div>

      <TabBar tabs={[
        { id: 'executive',  label: 'Executive View',      icon: <Star size={14}/> },
        { id: 'orghealth',  label: 'Santé Organisation',  icon: <Activity size={14}/> },
        { id: 'forecasts',  label: 'Prévisions IA',       icon: <Zap size={14}/> },
      ]} active={tab} onChange={setTab} />

      {tab === 'executive'  && renderExecutive()}
      {tab === 'orghealth'  && renderOrgHealth()}
      {tab === 'forecasts'  && renderForecasts()}
    </div>
  );
};

export default BI;
