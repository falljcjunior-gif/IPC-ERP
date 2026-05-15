/**
 * StrategyLab — Bac à Sable Stratégique (Nexus OS)
 *
 * Layout :
 *  ┌──────────────┬──────────────────────────────────────────────┐
 *  │  Sliders     │  Projection 12 mois (3 scénarios)           │
 *  │  (Marché /   ├───────────────────────┬──────────────────────┤
 *  │   Opérations │  Jauge de risque +    │  Analyse de          │
 *  │   Ventes)    │  KPI résumé           │  sensibilité tornade │
 *  └──────────────┴───────────────────────┴──────────────────────┘
 */
import React, {
  useState, useMemo, useCallback, useTransition, useRef,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import {
  FlaskConical, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle2, Zap, RefreshCw, Info, ChevronRight,
  DollarSign, Package, Users, Megaphone,
} from 'lucide-react';

import { useStore } from '../../store';
import {
  buildProjection, runMonteCarlo, sensitivityAnalysis,
  computeRiskScore, computeMonth, fmtFCFA,
} from './engine/MonteCarloEngine';

// ─────────────────────────────────────────────────────────────────
// DEFAULTS (tirés du store quand possible)
// ─────────────────────────────────────────────────────────────────

const BASE_DEFAULTS = {
  // Marché
  cimentCostPerTon:   105000,   // FCFA/tonne (2 sacs 50kg ≈ 5500 FCFA ×20)
  aggregatCostPerTon: 12000,    // FCFA/tonne
  exchangeRate:       620,      // FCFA/USD (info display only)
  inflationRate:      4,        // %/an

  // Opérations
  productionCapacity: 80,       // %
  payroll:            8500000,  // FCFA/mois
  marketingBudget:    1200000,  // FCFA/mois

  // Ventes
  unitPrice:          2800,     // FCFA/bloc
  orderVolume:        6000,     // blocs/mois à 100%
};

const VARIABLE_META = {
  // Marché
  cimentCostPerTon:   { min:60000,  max:180000, step:1000, unit:'FCFA/t',   label:'Coût ciment',        icon:Package,   color:'#F59E0B' },
  aggregatCostPerTon: { min:5000,   max:30000,  step:500,  unit:'FCFA/t',   label:'Coût agrégats',      icon:Package,   color:'#F97316' },
  exchangeRate:       { min:500,    max:750,    step:5,    unit:'FCFA/USD', label:'Taux de change',     icon:DollarSign,color:'#6366F1' },
  inflationRate:      { min:0,      max:20,     step:0.5,  unit:'%',        label:'Inflation annuelle', icon:TrendingUp, color:'#EF4444' },

  // Opérations
  productionCapacity: { min:20,     max:100,    step:5,    unit:'%',        label:'Capacité production',icon:Package,   color:'#10B981' },
  payroll:            { min:3000000,max:20000000,step:250000,unit:'FCFA',   label:'Masse salariale',    icon:Users,     color:'#8B5CF6' },
  marketingBudget:    { min:0,      max:5000000,step:100000,unit:'FCFA',    label:'Budget marketing',   icon:Megaphone, color:'#EC4899' },

  // Ventes
  unitPrice:          { min:1500,   max:5000,   step:50,   unit:'FCFA',     label:'Prix unitaire',      icon:DollarSign,color:'#3B82F6' },
  orderVolume:        { min:1000,   max:20000,  step:500,  unit:'blocs/mois',label:'Volume commandes',  icon:Package,   color:'#06B6D4' },
};

const VAR_GROUPS = {
  marche:      ['cimentCostPerTon','aggregatCostPerTon','exchangeRate','inflationRate'],
  operations:  ['productionCapacity','payroll','marketingBudget'],
  ventes:      ['unitPrice','orderVolume'],
};

// ─────────────────────────────────────────────────────────────────
// COMPOSANTS ATOMIQUES
// ─────────────────────────────────────────────────────────────────

function Slider({ varKey, value, onChange }) {
  const m = VARIABLE_META[varKey];
  const Icon = m.icon;
  const pct = ((value - m.min) / (m.max - m.min)) * 100;

  const fmt = (v) => {
    if (m.unit === 'FCFA' || m.unit === 'FCFA/t') return fmtFCFA(v, 0);
    if (m.unit === '%')    return `${v}%`;
    if (m.unit === 'FCFA/USD') return `${v}`;
    return `${(v / 1000).toFixed(1)}k`;
  };

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.4rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
          <Icon size={13} color={m.color} />
          <span style={{ fontSize:'0.78rem', fontWeight:600, color:'var(--text)' }}>{m.label}</span>
        </div>
        <span style={{
          fontSize:'0.78rem', fontWeight:800, color:m.color,
          background:`${m.color}15`, padding:'2px 8px', borderRadius:'999px',
        }}>
          {fmt(value)} <span style={{ fontSize:'0.65rem', fontWeight:500, color:'var(--text-muted)', marginLeft:2 }}>{m.unit}</span>
        </span>
      </div>
      <div style={{ position:'relative', height:20, display:'flex', alignItems:'center' }}>
        <div style={{
          position:'absolute', left:0, top:'50%', transform:'translateY(-50%)',
          width:`${pct}%`, height:4, borderRadius:2,
          background:`linear-gradient(90deg, ${m.color}80, ${m.color})`,
          transition:'width 0.1s',
        }} />
        <div style={{
          position:'absolute', left:0, right:0, top:'50%', transform:'translateY(-50%)',
          height:4, borderRadius:2, background:'var(--border)',
          zIndex:0,
        }} />
        <input
          type="range" min={m.min} max={m.max} step={m.step} value={value}
          onChange={e => onChange(varKey, Number(e.target.value))}
          style={{
            position:'relative', zIndex:1, width:'100%',
            WebkitAppearance:'none', appearance:'none',
            background:'transparent', cursor:'pointer', height:20,
          }}
        />
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.6rem', color:'var(--text-muted)', marginTop:2 }}>
        <span>{fmt(m.min)}</span>
        <span>{fmt(m.max)}</span>
      </div>
    </div>
  );
}

// ── Jauge de risque SVG ───────────────────────────────────────────

function RiskGauge({ score }) {
  const R = 80, CX = 100, CY = 100;
  const ARC_START = Math.PI;
  const ARC_END   = 0;
  const angle = ARC_START - (score / 100) * Math.PI;
  const ZONES = [
    { pct: 0.30, color:'#EF4444', label:'Danger' },
    { pct: 0.25, color:'#F59E0B', label:'Vigilance' },
    { pct: 0.25, color:'#EAB308', label:'Acceptable' },
    { pct: 0.20, color:'#10B981', label:'Optimal' },
  ];

  // Build arc segments
  let cumPct = 0;
  const arcs = ZONES.map(z => {
    const startAngle = Math.PI - cumPct * Math.PI;
    const endAngle   = Math.PI - (cumPct + z.pct) * Math.PI;
    cumPct += z.pct;
    const x1 = CX + R * Math.cos(startAngle);
    const y1 = CY - R * Math.sin(startAngle);
    const x2 = CX + R * Math.cos(endAngle);
    const y2 = CY - R * Math.sin(endAngle);
    const largeArc = z.pct > 0.5 ? 1 : 0;
    return { d: `M${x1},${y1} A${R},${R} 0 ${largeArc},0 ${x2},${y2}`, color: z.color };
  });

  // Needle
  const needleX = CX + (R - 8) * Math.cos(angle);
  const needleY = CY - (R - 8) * Math.sin(angle);

  const gaugeColor = score >= 80 ? '#10B981'
    : score >= 55 ? '#EAB308'
    : score >= 30 ? '#F59E0B' : '#EF4444';

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
      <svg viewBox="0 0 200 110" style={{ width:'100%', maxWidth:260 }}>
        {/* Background arc */}
        <path d={`M${CX - R},${CY} A${R},${R} 0 0,1 ${CX + R},${CY}`} fill="none" stroke="var(--border)" strokeWidth="18" />
        {/* Color zones */}
        {arcs.map((a, i) => (
          <path key={i} d={a.d} fill="none" stroke={a.color} strokeWidth="18" />
        ))}
        {/* Needle */}
        <motion.line
          x1={CX} y1={CY}
          x2={needleX} y2={needleY}
          stroke={gaugeColor} strokeWidth="3" strokeLinecap="round"
          animate={{ x2: needleX, y2: needleY }}
          transition={{ type:'spring', stiffness:120, damping:20 }}
        />
        <circle cx={CX} cy={CY} r="6" fill={gaugeColor} />
        <circle cx={CX} cy={CY} r="3" fill="var(--bg-card)" />
        {/* Score */}
        <text x={CX} y={CY + 24} textAnchor="middle" fontSize="22" fontWeight="800" fill={gaugeColor}>
          {score}
        </text>
        <text x={CX} y={CY + 36} textAnchor="middle" fontSize="9" fill="var(--text-muted)">/100</text>
        {/* Labels */}
        <text x="18" y={CY + 4} fontSize="8" fill="#EF4444">Danger</text>
        <text x="155" y={CY + 4} fontSize="8" fill="#10B981">Optimal</text>
      </svg>
      <div style={{
        fontSize:'0.9rem', fontWeight:800, color:gaugeColor,
        marginTop:'-0.5rem', letterSpacing:'0.5px',
      }}>
        {score >= 80 ? 'Scénario viable — Exécution recommandée'
         : score >= 55 ? 'Scénario acceptable — Surveillance requise'
         : score >= 30 ? 'Vigilance — Révisez les variables critiques'
         : 'Danger — Risque de crise de trésorerie'}
      </div>
    </div>
  );
}

// ── Tooltip personnalisé ──────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:'var(--bg-card)', border:'1px solid var(--border)',
      borderRadius:'0.75rem', padding:'0.75rem 1rem', fontSize:'0.78rem',
    }}>
      <div style={{ fontWeight:800, marginBottom:'0.4rem', color:'var(--text)' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display:'flex', justifyContent:'space-between', gap:'1.5rem', color:p.color }}>
          <span>{p.name}</span>
          <span style={{ fontWeight:700 }}>{fmtFCFA(p.value * 1e6)} FCFA</span>
        </div>
      ))}
    </div>
  );
}

// ── KPI résumé card ───────────────────────────────────────────────

function KpiChip({ label, value, sub, color }) {
  return (
    <div style={{
      padding:'0.75rem 1rem', borderRadius:'0.875rem',
      background:`${color}10`, border:`1px solid ${color}25`,
      display:'flex', flexDirection:'column', gap:'0.2rem',
    }}>
      <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'1px', fontWeight:700 }}>{label}</div>
      <div style={{ fontSize:'1.05rem', fontWeight:800, color }}>{value}</div>
      {sub && <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────

export default function StrategyLab() {
  const invoices   = useStore(s => s.data.finance?.invoices   || []);
  const workOrders = useStore(s => s.data.production?.workOrders || []);

  // Calcule les defaults depuis le store (si données disponibles)
  const storeDefaults = useMemo(() => {
    const paidRevenue = invoices
      .filter(i => i.statut === 'Payé')
      .reduce((sum, i) => sum + Number(i.montant || 0), 0);
    const months = new Set(invoices.map(i => new Date(i.date || i.createdAt).getMonth())).size || 1;
    const avgMonthlyRevenue = paidRevenue / months;
    const inferredVolume    = avgMonthlyRevenue > 0
      ? Math.round(avgMonthlyRevenue / BASE_DEFAULTS.unitPrice / 0.8)
      : BASE_DEFAULTS.orderVolume;
    return {
      ...BASE_DEFAULTS,
      orderVolume: Math.min(20000, Math.max(1000, inferredVolume)) || BASE_DEFAULTS.orderVolume,
    };
  }, [invoices]);

  const [vars, setVars]       = useState(storeDefaults);
  const [activeGroup, setGroup] = useState('marche');
  const [mcN]                 = useState(1500);
  const [, startTransition]   = useTransition();

  const handleSlider = useCallback((key, val) => {
    startTransition(() => setVars(prev => ({ ...prev, [key]: val })));
  }, []);

  const resetVars = () => setVars(storeDefaults);

  const presetScenario = (type) => {
    const PRESETS = {
      pessimistic: {
        cimentCostPerTon: 145000, aggregatCostPerTon: 22000,
        inflationRate: 12, productionCapacity: 55,
        payroll: 10000000, marketingBudget: 600000,
        unitPrice: 2400, orderVolume: 3500,
      },
      realistic: storeDefaults,
      optimistic: {
        cimentCostPerTon: 88000, aggregatCostPerTon: 9000,
        inflationRate: 2, productionCapacity: 95,
        payroll: 8500000, marketingBudget: 2000000,
        unitPrice: 3200, orderVolume: 10000,
      },
    };
    setVars({ ...vars, ...PRESETS[type] });
  };

  // ── Calculs (memoïsés) ─────────────────────────────────────────

  const projection    = useMemo(() => buildProjection(vars), [vars]);
  const mc            = useMemo(() => runMonteCarlo(vars, mcN), [vars, mcN]);
  const sensitivity   = useMemo(() => sensitivityAnalysis(vars), [vars]);
  const riskScore     = useMemo(() => computeRiskScore(mc, vars), [mc, vars]);
  const baseMonth     = useMemo(() => computeMonth(vars, 5), [vars]);

  const annualProfit  = mc.p50;
  const annualRevenue = projection.reduce((s, m) => s + m.revenueRealiste * 1e6, 0);

  const tornadoData = sensitivity.slice(0, 7).map(s => ({
    label: s.label.length > 22 ? s.label.slice(0, 22) + '…' : s.label,
    hausse: s.upImpact,
    baisse: s.dnImpact,
    range:  s.absRange,
  }));

  const AREA_COLORS = {
    pessimiste: '#EF4444',
    realiste:   '#6366F1',
    optimiste:  '#10B981',
  };

  const groups = [
    { key:'marche',     label:'Marché' },
    { key:'operations', label:'Opérations' },
    { key:'ventes',     label:'Ventes' },
  ];

  return (
    <div style={{ padding:'2rem', display:'flex', flexDirection:'column', gap:'1.5rem', height:'100%' }}>

      {/* HEADER */}
      <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
        style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.25rem' }}>
            <div style={{
              width:38, height:38, borderRadius:'0.875rem',
              background:'linear-gradient(135deg,#4f46e5,#7c3aed)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <FlaskConical size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ margin:0, fontWeight:900, fontSize:'1.4rem' }}>Strategy Lab</h2>
              <p style={{ margin:0, fontSize:'0.75rem', color:'var(--text-muted)' }}>
                Bac à Sable — Monte Carlo · {mcN.toLocaleString()} simulations · Modèle IPC Green Blocks
              </p>
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
          {['pessimistic','realistic','optimistic'].map(type => (
            <button key={type} onClick={() => presetScenario(type)} style={{
              padding:'0.4rem 0.9rem', borderRadius:'999px', border:'1px solid var(--border)',
              background:'var(--bg-subtle)', fontSize:'0.75rem', fontWeight:700,
              cursor:'pointer', color:'var(--text)',
              ':hover': { background:'var(--border)' },
            }}>
              {type === 'pessimistic' ? 'Pessimiste' : type === 'realistic' ? 'Réaliste' : 'Optimiste'}
            </button>
          ))}
          <button onClick={resetVars} style={{
            padding:'0.4rem 0.9rem', borderRadius:'999px', border:'1px solid var(--border)',
            background:'transparent', fontSize:'0.75rem', fontWeight:700, cursor:'pointer',
            display:'flex', alignItems:'center', gap:'0.3rem', color:'var(--text-muted)',
          }}>
            <RefreshCw size={12} /> Reset
          </button>
        </div>
      </motion.div>

      {/* MAIN GRID */}
      <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:'1.5rem', flex:1, minHeight:0 }}>

        {/* ── LEFT : SLIDERS ───────────────────────────────────── */}
        <motion.div initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}
          className="glass"
          style={{ borderRadius:'1.5rem', padding:'1.25rem', display:'flex', flexDirection:'column', gap:'1rem', overflowY:'auto' }}>

          {/* Group tabs */}
          <div style={{ display:'flex', gap:'0.4rem' }}>
            {groups.map(g => (
              <button key={g.key} onClick={() => setGroup(g.key)} style={{
                flex:1, padding:'0.45rem 0.25rem', borderRadius:'0.75rem',
                border:'none', cursor:'pointer', fontSize:'0.7rem', fontWeight:700,
                background: activeGroup === g.key ? '#6366F1' : 'var(--bg-subtle)',
                color: activeGroup === g.key ? '#fff' : 'var(--text-muted)',
                transition:'all 0.15s',
              }}>
                {g.label}
              </button>
            ))}
          </div>

          {/* Sliders for active group */}
          <AnimatePresence mode="wait">
            <motion.div key={activeGroup}
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              transition={{ duration:0.15 }}
            >
              {VAR_GROUPS[activeGroup].map(key => (
                <Slider key={key} varKey={key} value={vars[key]} onChange={handleSlider} />
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Résumé mensuel rapide */}
          <div style={{ borderTop:'1px solid var(--border)', paddingTop:'1rem', display:'flex', flexDirection:'column', gap:'0.5rem' }}>
            <div style={{ fontSize:'0.7rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'1px' }}>
              Mois de Juin (simulation)
            </div>
            {[
              { l:'Revenus', v:baseMonth.revenue, c:'#6366F1' },
              { l:'Matières', v:-baseMonth.materialCost, c:'#EF4444' },
              { l:'Marge brute', v:baseMonth.grossMargin, c:'#10B981' },
              { l:'OPEX', v:-baseMonth.opex, c:'#F59E0B' },
              { l:'Résultat net', v:baseMonth.netProfit, c: baseMonth.netProfit >= 0 ? '#10B981' : '#EF4444' },
            ].map(row => (
              <div key={row.l} style={{ display:'flex', justifyContent:'space-between', fontSize:'0.78rem' }}>
                <span style={{ color:'var(--text-muted)' }}>{row.l}</span>
                <span style={{ fontWeight:800, color:row.c }}>{fmtFCFA(row.v)} FCFA</span>
              </div>
            ))}
            <div style={{ borderTop:'1px dashed var(--border)', paddingTop:'0.4rem', display:'flex', justifyContent:'space-between', fontSize:'0.78rem' }}>
              <span style={{ color:'var(--text-muted)' }}>Marge nette</span>
              <span style={{ fontWeight:800, color: baseMonth.netMargin >= 0 ? '#10B981' : '#EF4444' }}>
                {baseMonth.netMargin.toFixed(1)}%
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── RIGHT : CHARTS ───────────────────────────────────── */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem', minWidth:0 }}>

          {/* ── Chart 1 : Projection revenue 12 mois ─────────── */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            className="glass"
            style={{ borderRadius:'1.5rem', padding:'1.25rem 1.5rem', flex:'0 0 auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
              <div>
                <h4 style={{ margin:0, fontWeight:800, fontSize:'0.9rem' }}>Projection Chiffre d'Affaires — 12 mois</h4>
                <p style={{ margin:'0.2rem 0 0 0', fontSize:'0.72rem', color:'var(--text-muted)' }}>
                  Scénarios P/R/O · Valeurs en millions FCFA · Saisonnalité IPC intégrée
                </p>
              </div>
              <div style={{ display:'flex', gap:'1rem', fontSize:'0.7rem' }}>
                {[
                  ['Pessimiste','#EF4444'],
                  ['Réaliste','#6366F1'],
                  ['Optimiste','#10B981'],
                ].map(([l,c]) => (
                  <div key={l} style={{ display:'flex', alignItems:'center', gap:'0.3rem' }}>
                    <div style={{ width:12, height:3, borderRadius:2, background:c }} />
                    <span style={{ color:'var(--text-muted)' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={projection} margin={{ top:5, right:10, left:0, bottom:0 }}>
                <defs>
                  {[['opt','#10B981'],['real','#6366F1'],['pess','#EF4444']].map(([id,c]) => (
                    <linearGradient key={id} id={`grad_${id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"   stopColor={c} stopOpacity={0.25} />
                      <stop offset="95%"  stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="mois" tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${v}M`} width={42} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenueOptimiste"  name="Optimiste"  stroke="#10B981" strokeWidth={2} fill="url(#grad_opt)"  strokeDasharray="5 3" />
                <Area type="monotone" dataKey="revenueRealiste"   name="Réaliste"   stroke="#6366F1" strokeWidth={2.5} fill="url(#grad_real)" />
                <Area type="monotone" dataKey="revenuePessimiste" name="Pessimiste" stroke="#EF4444" strokeWidth={2} fill="url(#grad_pess)" strokeDasharray="5 3" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* ── Bottom row : Gauge + Sensitivity ─────────────── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', flex:1 }}>

            {/* Jauge + KPI */}
            <motion.div initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.1 }}
              className="glass"
              style={{ borderRadius:'1.5rem', padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div>
                <h4 style={{ margin:0, fontWeight:800, fontSize:'0.9rem' }}>Viabilité du Scénario</h4>
                <p style={{ margin:'0.2rem 0 0 0', fontSize:'0.72rem', color:'var(--text-muted)' }}>
                  Indice composite — Marge · Volatilité · Prob. profit
                </p>
              </div>
              <RiskGauge score={riskScore} />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem' }}>
                <KpiChip label="P50 annuel" value={fmtFCFA(annualProfit) + ' FCFA'} sub="Profit net médian" color={annualProfit >= 0 ? '#10B981' : '#EF4444'} />
                <KpiChip label="P10 (Bear)" value={fmtFCFA(mc.p10) + ' FCFA'} sub="Scénario pessimiste 10%" color="#EF4444" />
                <KpiChip label="P90 (Bull)" value={fmtFCFA(mc.p90) + ' FCFA'} sub="Scénario optimiste 90%" color="#10B981" />
                <KpiChip label="CA annuel" value={fmtFCFA(annualRevenue) + ' FCFA'} sub="Réaliste sans variations" color="#6366F1" />
              </div>
            </motion.div>

            {/* Analyse de sensibilité (Tornade) */}
            <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.15 }}
              className="glass"
              style={{ borderRadius:'1.5rem', padding:'1.5rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div>
                <h4 style={{ margin:0, fontWeight:800, fontSize:'0.9rem' }}>Analyse de Sensibilité ±5%</h4>
                <p style={{ margin:'0.2rem 0 0 0', fontSize:'0.72rem', color:'var(--text-muted)' }}>
                  Impact d'une variation de 5% de chaque variable sur le résultat annuel
                </p>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={tornadoData}
                  layout="vertical"
                  margin={{ top:0, right:20, left:10, bottom:0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize:10, fill:'var(--text-muted)' }} axisLine={false} tickLine={false}
                    tickFormatter={v => `${v > 0 ? '+' : ''}${v}%`} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize:10, fill:'var(--text)' }} axisLine={false} tickLine={false} width={130} />
                  <Tooltip formatter={(v) => [`${v > 0 ? '+' : ''}${v}%`, '']} contentStyle={{ borderRadius:'0.75rem', border:'1px solid var(--border)', background:'var(--bg-card)', fontSize:'0.78rem' }} />
                  <ReferenceLine x={0} stroke="var(--border)" strokeWidth={1.5} />
                  <Bar dataKey="hausse" name="+5%" fill="#10B981" radius={[0,4,4,0]} barSize={10} />
                  <Bar dataKey="baisse" name="-5%" fill="#EF4444" radius={[4,0,0,4]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
              {/* Insight automatique sur la variable la plus sensible */}
              {sensitivity[0] && (
                <div style={{
                  padding:'0.6rem 0.875rem', borderRadius:'0.75rem',
                  background:'#6366F115', border:'1px solid #6366F130',
                  fontSize:'0.73rem', color:'var(--text)',
                }}>
                  <span style={{ fontWeight:800, color:'#6366F1' }}> Levier N°1 : </span>
                  Une variation de 5% de <b>{sensitivity[0].label}</b> fait varier le résultat de{' '}
                  <span style={{ color:'#10B981', fontWeight:700 }}>+{sensitivity[0].upImpact}%</span>
                  {' '}/<span style={{ color:'#EF4444', fontWeight:700 }}> {sensitivity[0].dnImpact}%</span> sur l'année.
                </div>
              )}
            </motion.div>
          </div>

          {/* ── Chart 2 : Profit net 12 mois ─────────────────── */}
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
            className="glass"
            style={{ borderRadius:'1.5rem', padding:'1.25rem 1.5rem' }}>
            <div style={{ marginBottom:'0.875rem' }}>
              <h4 style={{ margin:0, fontWeight:800, fontSize:'0.9rem' }}>Résultat Net Mensuel — 3 Scénarios</h4>
              <p style={{ margin:'0.2rem 0 0 0', fontSize:'0.72rem', color:'var(--text-muted)' }}>
                Zone rouge = perte · Monte Carlo P10-P90 · IS 25% inclus
              </p>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <ComposedChart data={projection} margin={{ top:5, right:10, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="mois" tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${v}M`} width={42} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#EF4444" strokeWidth={1.5} strokeDasharray="4 4" label={{ value:'Seuil zéro', fill:'#EF4444', fontSize:10 }} />
                <Area type="monotone" dataKey="profitOptimiste"  name="Profit Optimiste"  stroke="#10B981" strokeWidth={1.5} fill="#10B98115" />
                <Area type="monotone" dataKey="profitPessimiste" name="Profit Pessimiste" stroke="#EF4444" strokeWidth={1.5} fill="#EF444415" />
                <Bar dataKey="profitRealiste" name="Profit Réaliste" radius={[4,4,0,0]} barSize={14}>
                  {projection.map((entry, i) => (
                    <Cell key={i} fill={entry.profitRealiste >= 0 ? '#6366F1' : '#EF4444'} />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>

        </div>
      </div>

      {/* RANGE SLIDER GLOBAL CSS */}
      <style>{`
        input[type=range] { margin:0; }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 18px; height: 18px; border-radius: 50%;
          background: #6366F1; cursor: pointer;
          border: 2px solid var(--bg-card);
          box-shadow: 0 0 0 3px #6366F120;
          transition: box-shadow 0.15s;
        }
        input[type=range]::-webkit-slider-thumb:hover {
          box-shadow: 0 0 0 5px #6366F130;
        }
        input[type=range]::-moz-range-thumb {
          width: 18px; height: 18px; border-radius: 50%;
          background: #6366F1; cursor: pointer; border: 2px solid var(--bg-card);
          box-shadow: 0 0 0 3px #6366F120;
        }
      `}</style>
    </div>
  );
}
