import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  PiggyBank, Plus, TrendingUp, TrendingDown, Target, AlertCircle,
  BarChart3, Calendar, DollarSign, Activity, AlertTriangle,
  CheckCircle2, ChevronRight, Zap, Layers, RefreshCcw
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  Cell, ComposedChart, Line, Legend, RadialBarChart, RadialBar, PieChart, Pie
} from 'recharts';
import { useBusiness } from '../BusinessContext';
import RecordModal from '../components/RecordModal';
import KpiCard from '../components/KpiCard';

const fadeIn = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const Chip = ({ label, color = '#64748B' }) => (
  <span style={{ padding: '2px 9px', borderRadius: '999px', background: `${color}18`, color, fontSize: '0.71rem', fontWeight: 700 }}>{label}</span>
);
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
   BUDGET MODULE — Full Enterprise
════════════════════════════════════ */
const Budget = () => {
  const { data, formatCurrency } = useBusiness();
  const [tab, setTab] = useState('overview');
  const [year, setYear] = useState('2026');
  const [modal, setModal] = useState(false);

  /* ─── Data ─── */
  const departments = useMemo(() => data.finance?.budgets || [], [data.finance?.budgets]);

  const kpis = useMemo(() => {
    const totalPrev  = departments.reduce((s, d) => s + d.prevision, 0);
    const totalReal  = departments.reduce((s, d) => s + d.realise, 0);
    const totalEngage= departments.reduce((s, d) => s + d.engage, 0);
    const burnRate   = Math.round((totalReal / totalPrev) * 100);
    const ecart      = totalPrev - totalReal - totalEngage;
    const depass     = departments.filter(d => d.realise > d.prevision).length;
    return { totalPrev, totalReal, totalEngage, burnRate, ecart, depass };
  }, [departments]);

  const mensuel = [];

  const modalFields = [
    { name: 'dept',     label: 'Département', required: true },
    { name: 'prevision',label: 'Budget Prévisionnel (FCFA)', type: 'number', required: true },
    { name: 'annee',    label: 'Année', type: 'select', options: ['2026', '2027', '2028'] },
    { name: 'type',     label: 'Type', type: 'select', options: ['OPEX', 'CAPEX', 'Mixte'] },
    { name: 'note',     label: 'Commentaire / Justification' },
  ];

  /* ═══════════ OVERVIEW ═══════════ */
  const renderOverview = () => (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* KPIs */}
      <motion.div variants={fadeIn} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))', gap: '1rem' }}>
        <KpiCard title="Budget Total"      value={formatCurrency(kpis.totalPrev, true)}  trend={5.0}  trendType="up"   icon={<PiggyBank size={20}/>}      color="#3B82F6" sparklineData={[{val:16},{val:16},{val:16},{val:16},{val:17.1}]} />
        <KpiCard title="Consommé"          value={formatCurrency(kpis.totalReal, true)}  trend={0}    trendType="up"   icon={<Activity size={20}/>}       color="#F59E0B" sparklineData={[{val:12},{val:13},{val:14},{val:15},{val:17.1}]} />
        <KpiCard title="Engagé (Non Payé)" value={formatCurrency(kpis.totalEngage, true)}trend={0}    trendType="up"   icon={<Target size={20}/>}         color="#8B5CF6" sparklineData={[{val:2},{val:3},{val:4},{val:5},{val:5.5}]} />
        <KpiCard title="Disponible"        value={formatCurrency(kpis.ecart, true)}      trend={0}    trendType="down" icon={<CheckCircle2 size={20}/>}    color="#10B981" sparklineData={[{val:6},{val:5},{val:4},{val:3},{val:kpis.ecart/1e8}]} />
        <KpiCard title="Burn Rate"         value={`${kpis.burnRate}%`}                  trend={0}    trendType="up"   icon={<Zap size={20}/>}             color={kpis.burnRate > 100 ? '#EF4444' : '#F59E0B'} sparklineData={[{val:88},{val:92},{val:98},{val:kpis.burnRate}]} />
        <KpiCard title="Dépassements"      value={`${kpis.depass} pôles`}               trend={0}    trendType="down" icon={<AlertTriangle size={20}/>}   color="#EF4444" sparklineData={[{val:1},{val:2},{val:2},{val:kpis.depass}]} />
      </motion.div>

      {/* Burn Rate Bar */}
      <motion.div variants={fadeIn} className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Consommation Budget Annuel 2026</span>
          <span style={{ fontWeight: 800, color: kpis.burnRate > 100 ? '#EF4444' : '#10B981' }}>{kpis.burnRate}%</span>
        </div>
        <div style={{ height: '14px', background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden', marginBottom: '0.5rem', position: 'relative' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(kpis.burnRate, 100)}%` }} transition={{ duration: 1.2 }}
            style={{ height: '100%', background: `linear-gradient(90deg, #10B981, ${kpis.burnRate > 100 ? '#EF4444' : '#3B82F6'})`, borderRadius: '999px' }} />
          {/* Engage */}
          <div style={{ position: 'absolute', top: 0, left: `${Math.min(kpis.burnRate, 100)}%`, height: '100%', width: `${Math.min((kpis.totalEngage / kpis.totalPrev) * 100, 100 - Math.min(kpis.burnRate, 100))}%`, background: '#8B5CF6', borderRadius: '0 999px 999px 0' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>🔵 Consommé: {formatCurrency(kpis.totalReal, true)}</span>
          <span>🟣 Engagé: {formatCurrency(kpis.totalEngage, true)}</span>
          <span>Budget: {formatCurrency(kpis.totalPrev, true)}</span>
        </div>
      </motion.div>

      {/* Par département + Mensuel */}
      <motion.div variants={fadeIn} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Enveloppes par Département</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {departments.map((d, i) => {
              const pct = Math.round((d.realise / d.prevision) * 100);
              const engPct = Math.round((d.engage / d.prevision) * 100);
              const over = pct > 100;
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>{d.dept}</span>
                    <span style={{ color: over ? '#EF4444' : 'var(--text)', fontWeight: 700 }}>
                      {formatCurrency(d.realise, true)} / {formatCurrency(d.prevision, true)} <span style={{ color: over ? '#EF4444' : '#10B981', fontSize: '0.7rem' }}>({pct}%)</span>
                    </span>
                  </div>
                  <div style={{ height: '7px', background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: over ? '#EF4444' : d.color, borderRadius: '999px', position: 'absolute', left: 0, top: 0 }} />
                    {!over && <div style={{ width: `${Math.min(engPct, 100 - pct)}%`, height: '100%', background: `${d.color}60`, borderRadius: '0 999px 999px 0', position: 'absolute', left: `${pct}%`, top: 0 }} />}
                  </div>
                  {over && <div style={{ fontSize: '0.68rem', color: '#EF4444', fontWeight: 700, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}><AlertCircle size={10} /> Dépassement +{formatCurrency(d.realise - d.prevision, true)}</div>}
                </div>
              );
            })}
          </div>
        </div>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Dépenses Mensuelles vs Budget</h4>
          <ResponsiveContainer width="100%" height={270}>
            <ComposedChart data={mensuel}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={v => `${(v/1e6).toFixed(0)}M`} />
              <Tooltip content={<TT />} />
              <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
              <Bar dataKey="real" name="Réalisé" fill="#3B82F6" radius={[4,4,0,0]} barSize={14} />
              <Line dataKey="prev" name="Prévu" stroke="#EF4444" strokeWidth={2} strokeDasharray="5 3" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </motion.div>
  );

  /* ═══════════ DÉTAIL OPEX / CAPEX ═══════════ */
  const renderDetail = () => (
    <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <motion.div variants={fadeIn} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {[
          { type: 'OPEX Total',     val: 0, sub: 'Charges d\'exploitation récurrentes', c: '#3B82F6', icon: <RefreshCcw size={18}/> },
          { type: 'CAPEX Total',    val: 0,  sub: 'Investissements & Immobilisations',   c: '#8B5CF6', icon: <Layers size={18}/> },
          { type: 'Provisions',     val: 0,   sub: 'Risques & litiges provisionnés',     c: '#F59E0B', icon: <AlertTriangle size={18}/> },
          { type: 'Économies YTD',  val: 0,   sub: 'Vs budget cible optimisé',           c: '#10B981', icon: <TrendingDown size={18}/> },
        ].map((s, i) => (
          <div key={i} className="glass" style={{ padding: '1.4rem', borderRadius: '1.25rem', borderLeft: `4px solid ${s.c}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ color: s.c }}>{s.icon}</div>
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', color: s.c }}>{formatCurrency(s.val, true)}</div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginTop: '4px' }}>{s.type}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{s.sub}</div>
          </div>
        ))}
      </motion.div>
      <motion.div variants={fadeIn} className="glass" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', textAlign: 'left' }}>
          <thead style={{ background: 'var(--bg-subtle)' }}>
            <tr>{['Département', 'Type', 'Prévision', 'Réalisé', 'Engagé', 'Disponible', 'Statut'].map((h, i) => (
              <th key={i} style={{ padding: '0.85rem 1.1rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.73rem', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {departments.map((d, i) => {
              const dispo = d.prevision - d.realise - d.engage;
              const over  = d.realise > d.prevision;
              return (
                <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.9rem 1.1rem', fontWeight: 700 }}>{d.dept}</td>
                  <td style={{ padding: '0.9rem 1.1rem' }}><Chip label="OPEX" color="#3B82F6" /></td>
                  <td style={{ padding: '0.9rem 1.1rem' }}>{formatCurrency(d.prevision, true)}</td>
                  <td style={{ padding: '0.9rem 1.1rem', fontWeight: 700, color: over ? '#EF4444' : 'var(--text)' }}>{formatCurrency(d.realise, true)}</td>
                  <td style={{ padding: '0.9rem 1.1rem', color: '#8B5CF6' }}>{formatCurrency(d.engage, true)}</td>
                  <td style={{ padding: '0.9rem 1.1rem', fontWeight: 700, color: dispo < 0 ? '#EF4444' : '#10B981' }}>{formatCurrency(dispo, true)}</td>
                  <td style={{ padding: '0.9rem 1.1rem' }}><Chip label={over ? 'Dépassé' : dispo < d.prevision * 0.1 ? 'Attention' : 'Nominal'} color={over ? '#EF4444' : dispo < d.prevision * 0.1 ? '#F59E0B' : '#10B981'} /></td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>
    </motion.div>
  );

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#F59E0B', marginBottom: '0.4rem' }}>
            <PiggyBank size={16} /><span style={{ fontWeight: 800, fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Finance — Pilotage Budgétaire</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Contrôle Budgétaire</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.3rem 0 0 0', fontSize: '0.92rem' }}>OPEX · CAPEX · Burn Rate · Dépassements · Prévisionnel vs Réalisé</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select value={year} onChange={e => setYear(e.target.value)} className="glass" style={{ padding: '0.5rem 0.9rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontWeight: 600, fontSize: '0.84rem' }}>
            <option>2026</option><option>2025</option><option>2027</option>
          </select>
          <button onClick={() => setModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.55rem 1rem', borderRadius: '0.75rem', border: 'none', background: 'var(--accent)', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.84rem' }}>
            <Plus size={15} /> Nouveau Budget
          </button>
        </div>
      </div>

      <TabBar tabs={[
        { id: 'overview', label: 'Vue Consolidée', icon: <BarChart3 size={14}/> },
        { id: 'detail',   label: 'OPEX / CAPEX',   icon: <Layers size={14}/> },
      ]} active={tab} onChange={setTab} />

      {tab === 'overview' && renderOverview()}
      {tab === 'detail'   && renderDetail()}

      <RecordModal isOpen={modal} onClose={() => setModal(false)} title="Nouveau Budget Département"
        fields={modalFields} onSave={() => setModal(false)} />
    </div>
  );
};

export default Budget;
