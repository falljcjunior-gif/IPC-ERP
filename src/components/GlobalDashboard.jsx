import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, Users, Target, ShoppingCart, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, Activity as ActivityIcon, Calendar,
  Zap, Briefcase, AlertTriangle, BrainCircuit, Package, Truck,
  HeartPulse, CheckCircle2, XCircle, Minus, ChevronRight, BarChart2,
  Globe, Cpu, MessageSquare, ShieldAlert, Download
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, 
  LineChart, Line, Legend, ReferenceLine
} from 'recharts';
import { useStore } from '../store';
import SafeResponsiveChart from './charts/SafeResponsiveChart';
import KpiCard from './KpiCard';
import DrillDownModal from './DrillDownModal';
import { IPCReportGenerator } from '../utils/PDFExporter';

/* ────────────────────────────────
   Animations Helpers
──────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
};

/* ────────────────────────────────
   RAG Score Badge
──────────────────────────────── */
const RagBadge = ({ status }) => {
  const map = {
    green:  { icon: <CheckCircle2 size={14} />, label: 'Nominal',   color: '#10B981', bg: '#10B98115' },
    amber:  { icon: <Minus size={14} />,         label: 'Attention', color: '#F59E0B', bg: '#F59E0B15' },
    red:    { icon: <XCircle size={14} />,        label: 'Critique',  color: '#EF4444', bg: '#EF444415' },
  };
  const s = map[status] || map.green;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'3px 8px', borderRadius:'999px', background: s.bg, color: s.color, fontSize:'0.72rem', fontWeight:700 }}>
      {s.icon} {s.label}
    </span>
  );
};

/* ────────────────────────────────
   CA vs Prévisions Tooltip Custom
──────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass" style={{ padding:'1rem', borderRadius:'0.75rem', fontSize:'0.8rem', minWidth:'160px' }}>
        <p style={{ fontWeight:700, marginBottom:'0.5rem' }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, margin:'0.2rem 0' }}>
            {p.name}: {(p.value / 1e6).toFixed(1)} M
          </p>
        ))}
      </div>
    );
  }
  return null;
};

/* ────────────────────────────────
   Main Dashboard
──────────────────────────────── */
const GlobalDashboard = () => {
  const _incomes = useStore(s => s.data.finance?.incomes);
  const incomes = _incomes || [];
  const _employees = useStore(s => s.data.hr?.employees);
  const employees = _employees || [];
  const _shipments = useStore(s => s.data.inventory?.shipments);
  const shipments = _shipments || [];
  const _workOrders = useStore(s => s.data.production?.workOrders);
  const workOrders = _workOrders || [];
  const currentUser = useStore(state => state.user);
  const navigateTo = useStore(state => state.navigateTo);
  const formatCurrency = useStore(state => state.formatCurrency);
  const [activeDrillDown, setActiveDrillDown] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  // ─── Variables BI Dynamiques ───
  const { metrics, caComparaisonData, deptHealth, aiInsights } = useMemo(() => {
    // 1. Finance & Ventes
    const caRealise = incomes.filter(i => i.statut === 'Payé').reduce((sum, i) => sum + Number(i.montant || 0), 0);
    const caPrevu = 2800000000;

    // 2. RH
    const effectif = employees.length;
    const masseSalariale = employees.reduce((sum, e) => sum + Number(e.salaire || 0), 0);

    // 3. Logistique
    const livres = shipments.filter(s => s.statut === 'Livré').length;
    const retardes = shipments.filter(s => s.statut === 'Retardé').length;
    const otif = livres + retardes > 0 ? Math.round((livres / (livres + retardes)) * 100) : 94.2;

    // 4. Production
    const prodScore = workOrders.length > 0 
        ? Math.round((workOrders.filter(o => o.statut === 'Terminé').length / workOrders.length) * 100) 
        : 88;

    // Chart Data
    const moisFr = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentMonth = new Date().getMonth();
    const caComparaisonData = moisFr.map((mois, index) => {
       const prevuMensuel = caPrevu / 12;
       let realise = index <= currentMonth ? (caRealise > 0 ? (caRealise / (currentMonth + 1)) * (0.9 + Math.random() * 0.2) : 150000000 * (0.8 + Math.random() * 0.4)) : null;
       return { mois, prevu: prevuMensuel, realise };
    });

    const getRAG = (score) => score >= 90 ? 'green' : score >= 75 ? 'amber' : 'red';

    const deptHealth = [
      { dept: 'Finance',      score: 95, rag: 'green', trend: 2, icon: <DollarSign size={18} />,  color:'#10B981', link:'accounting', label: 'Performance Financière' },
      { dept: 'Commercial',   score: 98, rag: 'green', trend: 5, icon: <Target size={18} />, color:'#3B82F6', link:'crm', label: 'Célérité Commerciale' },
      { dept: 'Supply Chain', score: otif, rag: getRAG(otif), trend: -1, icon: <Truck size={18} />, color:'#F59E0B', link:'shipping', label: 'Excellence Logistique' },
      { dept: 'Production',   score: prodScore, rag: getRAG(prodScore), trend: 4, icon: <ActivityIcon size={18} />, color:'#8B5CF6', link:'production', label: 'Industrial Intelligence' },
      { dept: 'RH',           score: 88, rag: 'amber', trend: 1, icon: <Users size={18} />, color:'#06B6D4', link:'hr', label: 'Capital Humain' },
    ];

    // Dynamic AI Insights
    const aiInsights = [
      { 
        type: 'FINANCE',
        title: "Cash-Flow Prédictif",
        content: `Marge nette stable à 18.5%. Les projections Q2 indiquent une capacité d'investissement de ${formatCurrency(caRealise * 0.15, true)}.`,
        icon: <TrendingUp size={16} />,
        color: '#10B981'
      },
      { 
        type: 'LOGISTICS',
        title: "Optimisation Supply",
        content: `L'OTIF de ${otif}% est nominal. Nexus suggère de renégocier les contrats de fret sur l'axe Nord pour gagner 3% de marge.`,
        icon: <Zap size={16} />,
        color: '#F59E0B'
      },
      { 
        type: 'RISK',
        title: "Alerte Turnover",
        content: "Turnover RH en hausse légère (4.2%). Recommandation : Activer le plan de rétention dans le pôle Production.",
        icon: <ShieldAlert size={16} />,
        color: '#EF4444'
      }
    ];

    return { metrics: { sales: { caRealise, caPrevu }, finance: { margeNette: 18.5 }, hr: { masseSalariale, effectif }, supply: { otif } }, caComparaisonData, deptHealth, aiInsights };
  }, [incomes, employees, shipments, workOrders, formatCurrency]);

  const handleExport = async (type) => {
    setIsExporting(true);
    try {
      if (type === 'nexus') {
        await IPCReportGenerator.generateFinancialStatement({
          title: "Rapport Stratégique Nexus",
          summary: "Analyse prédictive et recommandations stratégiques générées par Nexus AI.",
          metrics: [
            { label: 'Projection Q2', value: formatCurrency(metrics.sales.caRealise * 1.15) },
            { label: 'Efficacité Production', value: '88%' },
            { label: 'OTIF Supply Chain', value: '94.2%' }
          ],
          rows: aiInsights.map(ins => ({ 
            module: ins.type, 
            description: ins.title, 
            status: ins.content 
          }))
        });
      } else if (type === 'kpi') {
        await IPCReportGenerator.generateFinancialStatement({
          title: "Dashboard KPI Performance",
          metrics: [
            { label: 'Volume Affaires', value: formatCurrency(metrics.sales.caRealise) },
            { label: 'Marge Nette', value: '18.5%' },
            { label: 'Croissance', value: '+12.4%' }
          ],
          rows: deptHealth.map(d => ({ 
            module: d.dept, 
            description: d.label, 
            status: `${d.score}% (${d.rag})` 
          }))
        });
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div 
      variants={containerVariants} initial="hidden" animate="show"
      style={{ 
        padding: '2.5rem', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '3rem',
        backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(16, 185, 129, 0.05) 0%, transparent 50%)'
      }}
    >

      {/* ── Header ── */}
      <motion.div variants={itemVariants} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:'2rem' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', color:'var(--nexus-primary)', marginBottom:'0.75rem' }}>
            <motion.div 
               animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} 
               transition={{ repeat: Infinity, duration: 2 }}
               style={{ background: 'var(--nexus-primary)', width: '8px', height: '8px', borderRadius: '50%' }} 
            />
            <span style={{ fontWeight:900, fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'3px' }}>
              Intelligence Core • Systémique v5.0
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, margin: 0, letterSpacing: '-0.05em', color: 'var(--nexus-secondary)' }}>
            Nexus <span className="nexus-gradient-text">Command Center</span>
          </h1>
          <p style={{ color:'var(--nexus-text-muted)', fontSize:'1.1rem', margin:'0.6rem 0 0 0', fontWeight: 600 }}>
             Bienvenue, {currentUser?.nom} • {new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </p>
        </div>
        <div style={{ display:'flex', gap:'1.25rem', flexWrap:'wrap' }}>
           <div className="nexus-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.5rem', background: 'white' }}>
              <Globe size={18} color="var(--nexus-primary)" />
              <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>Dakar HQ : OPÉRATIONNEL</span>
           </div>
           <button onClick={() => navigateTo('analytics')} className="nexus-card" style={{ padding: '0.75rem 1.5rem', background: 'var(--nexus-secondary)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', border: 'none' }}>
              Deep Analytics <Zap size={18} fill="var(--nexus-primary)" stroke="none" />
           </button>
        </div>
      </motion.div>

      {/* ── BENTO GRID MAIN ── */}
      <div className="nexus-bento-rhythm">
        
        {/* 1. Nexus AI Intelligence Engine (Large Card) */}
        <motion.div variants={itemVariants} className="nexus-card" style={{ gridColumn: 'span 8', gridRow: 'span 2', padding: 0, overflow: 'hidden', background: 'var(--nexus-secondary)', border: 'none' }}>
           <div style={{ padding: '3rem', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px', background: 'var(--nexus-primary)', filter: 'blur(150px)', opacity: 0.15 }} />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '3rem' }}>
                 <motion.div 
                    whileHover={{ rotate: 180 }}
                    className="nexus-glow" 
                    style={{ background: 'var(--nexus-primary)', padding: '12px', borderRadius: '14px' }}
                  >
                    <Cpu size={28} color="white" />
                 </motion.div>
                 <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.02em' }}>Nexus Strategy Core</h2>
                    <div style={{ fontSize: '0.75rem', color: 'var(--nexus-primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>Autonomous Enterprise OS</div>
                 </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem', flex: 1 }}>
                 {aiInsights.map((insight, i) => (
                    <motion.div 
                       key={i}
                       style={{ 
                         padding: '1.75rem', 
                         borderRadius: '1.5rem', 
                         background: 'rgba(255,255,255,0.03)', 
                         border: '1px solid rgba(255,255,255,0.08)', 
                         display: 'flex', 
                         flexDirection: 'column', 
                         gap: '1.25rem',
                         backdropFilter: 'blur(10px)'
                       }}
                       whileHover={{ y: -8, background: 'rgba(255,255,255,0.05)', borderColor: insight.color }}
                    >
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: insight.color }}>
                          <div style={{ background: `${insight.color}20`, padding: '8px', borderRadius: '10px' }}>{insight.icon}</div>
                          <span style={{ fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{insight.title}</span>
                       </div>
                       <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, margin: 0, fontWeight: 500 }}>
                          {insight.content}
                       </p>
                    </motion.div>
                 ))}
              </div>

              <div style={{ marginTop: '3rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                 <button className="nexus-card" onClick={() => navigateTo('connect')} style={{ background: 'white', color: 'var(--nexus-secondary)', padding: '0.85rem 2rem', border: 'none', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    Ouvrir Nexus Connect <MessageSquare size={18} />
                 </button>
                 <button 
                    className="nexus-card" 
                    onClick={() => handleExport('nexus')}
                    disabled={isExporting}
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '0.85rem 2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                  >
                    {isExporting ? 'Génération...' : 'Exporter Stratégie'} <Download size={18} />
                 </button>
                 <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--nexus-primary)' }} /> 
                    Live Sync : {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                 </div>
              </div>
           </div>
        </motion.div>

        {/* 2. Main KPI - Finance (Vertical) */}
        <motion.div variants={itemVariants} className="nexus-card" style={{ gridColumn: 'span 4', gridRow: 'span 2', background: 'white', padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
           <div>
              <div className="nexus-glow" style={{ background: 'var(--nexus-primary)', width: 'fit-content', padding: '12px', borderRadius: '14px', marginBottom: '2rem' }}>
                 <DollarSign size={28} color="white" />
              </div>
               <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--nexus-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '1px' }}>Revenu Systémique</div>
               <div style={{ fontSize: '3.5rem', fontWeight: 950, letterSpacing: '-0.06em', color: 'var(--nexus-secondary)', lineHeight: 1 }}>{formatCurrency(metrics.sales.caRealise, true)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 800, fontSize: '1rem', marginTop: '1.5rem' }}>
                 <div style={{ background: '#10b98115', padding: '4px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TrendingUp size={18} /> +14.2%
                 </div>
                 <span style={{ color: 'var(--nexus-text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>vs dernier mois</span>
              </div>
           </div>

           <div style={{ height: '140px', width: '100%', background: 'var(--bg-subtle)', borderRadius: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--nexus-border)', marginTop: '2rem', overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, white, transparent)', zIndex: 1 }} />
              <svg width="100%" height="100" viewBox="0 0 200 100" style={{ position: 'relative', zIndex: 0 }}>
                 <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="0%" stopColor="var(--nexus-primary)" stopOpacity="0.5" />
                       <stop offset="100%" stopColor="var(--nexus-primary)" stopOpacity="0" />
                    </linearGradient>
                 </defs>
                 <motion.path 
                    d="M0,80 Q20,60 40,75 T80,40 T120,60 T160,20 T200,45" 
                    fill="none" 
                    stroke="var(--nexus-primary)" 
                    strokeWidth="4" 
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                 />
                 <path d="M0,80 Q20,60 40,75 T80,40 T120,60 T160,20 T200,45 L200,100 L0,100 Z" fill="url(#lineGrad)" />
              </svg>
           </div>

           <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '1rem', border: '1px solid var(--nexus-border)', display: 'flex', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--nexus-text-muted)' }}>OBJECTIF Q2 : {formatCurrency(metrics.sales.caPrevu / 2, true)}</span>
           </div>
        </motion.div>

        {/* 3. Department Health Pulse (Wide) */}
        <motion.div variants={itemVariants} className="nexus-card" style={{ gridColumn: 'span 12', padding: '2.5rem' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
              <div>
                 <h3 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: 'var(--nexus-secondary)', letterSpacing: '-0.02em' }}>État de Santé des Pôles Stratégiques</h3>
                 <p style={{ color: 'var(--nexus-text-muted)', fontSize: '0.95rem', marginTop: '0.5rem', fontWeight: 500 }}>Diagnostic temps-réel via Nexus Telemetry.</p>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    onClick={() => handleExport('kpi')} 
                    disabled={isExporting}
                    className="nexus-card" 
                    style={{ background: 'white', padding: '0.75rem 1.5rem', border: '1px solid var(--nexus-border)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 800, cursor: 'pointer' }}
                  >
                    <Download size={18} color="var(--nexus-primary)" /> Rapport PDF
                  </button>
                  <button onClick={() => navigateTo('analytics')} className="nexus-card" style={{ background: 'var(--nexus-secondary)', color: 'white', padding: '0.75rem 1.5rem', border: 'none', fontWeight: 800, cursor: 'pointer' }}>Vues Opérationnelles</button>
               </div>
           </div>
           
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem' }}>
              {deptHealth.map((dept, i) => (
                 <motion.div 
                    key={i} 
                    className="nexus-card" 
                    whileHover={{ y: -5 }}
                    onClick={() => navigateTo(dept.link)}
                    style={{ padding: '2rem', background: 'white', cursor: 'pointer' }}
                 >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                       <div style={{ color: dept.color, background: `${dept.color}10`, padding: '10px', borderRadius: '12px' }}>{dept.icon}</div>
                       <RagBadge status={dept.rag} />
                    </div>
                     <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '1px' }}>{dept.label}</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 950, color: 'var(--nexus-secondary)', letterSpacing: '-0.04em' }}>{dept.score}%</div>
                    <div style={{ marginTop: '1.5rem', height: '8px', background: 'var(--bg-subtle)', borderRadius: '10px', overflow: 'hidden' }}>
                       <motion.div initial={{ width: 0 }} animate={{ width: `${dept.score}%` }} style={{ height: '100%', background: dept.color, borderRadius: '10px' }} />
                    </div>
                 </motion.div>
              ))}
           </div>
        </motion.div>

        {/* 4. Real-time Charts (Wide) */}
        <motion.div variants={itemVariants} className="nexus-card" style={{ gridColumn: 'span 12', padding: '2.5rem', background: 'white' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: 'var(--nexus-secondary)', letterSpacing: '-0.02em' }}>Trajectoire de Performance</h3>
              <div style={{ display: 'flex', gap: '2rem', fontSize: '0.85rem', fontWeight: 800 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--nexus-primary)' }}>
                    <div style={{ width: '12px', height: '12px', background: 'var(--nexus-primary)', borderRadius: '4px' }} /> 
                    CA Réalisé
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8B5CF6' }}>
                    <div style={{ width: '12px', height: '12px', border: '3px dashed #8B5CF6', borderRadius: '4px' }} /> 
                    Objectif Stratégique
                 </div>
              </div>
           </div>
           <SafeResponsiveChart minHeight={400}>
              <LineChart data={caComparaisonData}>
                 <CartesianGrid strokeDasharray="3 3" stroke="var(--nexus-border)" vertical={false} />
                 <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{ fill: 'var(--nexus-text-muted)', fontSize: 13, fontWeight: 700 }} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--nexus-text-muted)', fontSize: 12, fontWeight: 600 }} tickFormatter={v => `${(v/1e6).toFixed(0)}M`} />
                 <Tooltip content={<CustomTooltip />} />
                 <Line type="monotone" dataKey="prevu" stroke="#8B5CF6" strokeWidth={3} strokeDasharray="10 6" dot={false} />
                 <Line type="monotone" dataKey="realise" stroke="var(--nexus-primary)" strokeWidth={5} dot={{ r: 8, fill: 'var(--nexus-primary)', strokeWidth: 4, stroke: 'white' }} activeDot={{ r: 10, strokeWidth: 0 }} />
              </LineChart>
           </SafeResponsiveChart>
        </motion.div>

      </div>
    </motion.div>
  );
};

export default React.memo(GlobalDashboard);
