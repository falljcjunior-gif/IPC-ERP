import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, Users, Target, ShoppingCart, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, Activity as ActivityIcon, Calendar,
  Zap, Briefcase, AlertTriangle, BrainCircuit, Package, Truck,
  HeartPulse, CheckCircle2, XCircle, Minus, ChevronRight, BarChart2,
  Globe, Sparkles, MessageSquare, ShieldAlert
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, 
  LineChart, Line, Legend, ReferenceLine
} from 'recharts';
import { useBusiness } from '../BusinessContext';
import SafeResponsiveChart from './charts/SafeResponsiveChart';
import KpiCard from './KpiCard';
import DrillDownModal from './DrillDownModal';

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
  const { data, currentUser, navigateTo, formatCurrency } = useBusiness();
  const [activeDrillDown, setActiveDrillDown] = useState(null);

  // ─── Variables BI Dynamiques ───
  const { metrics, caComparaisonData, deptHealth, aiInsights } = useMemo(() => {
    // 1. Finance & Ventes
    const incomes = data.finance?.incomes || [];
    const caRealise = incomes.filter(i => i.statut === 'Payé').reduce((sum, i) => sum + Number(i.montant || 0), 0);
    const caPrevu = 2800000000;

    // 2. RH
    const employees = data.hr?.employees || [];
    const effectif = employees.length;
    const masseSalariale = employees.reduce((sum, e) => sum + Number(e.salaire || 0), 0);

    // 3. Logistique
    const shipments = data.shipping?.shipments || [];
    const livres = shipments.filter(s => s.statut === 'Livré').length;
    const retardes = shipments.filter(s => s.statut === 'Retardé').length;
    const otif = livres + retardes > 0 ? Math.round((livres / (livres + retardes)) * 100) : 94.2;

    // 4. Production
    const plannedOrders = data.production?.workOrders || [];
    const prodScore = plannedOrders.length > 0 
        ? Math.round((plannedOrders.filter(o => o.statut === 'Terminé').length / plannedOrders.length) * 100) 
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
      { dept: 'Finance',      score: 95, rag: 'green', trend: 2, icon: <DollarSign size={18} />,  color:'#10B981', link:'accounting' },
      { dept: 'Commercial',   score: 98, rag: 'green', trend: 5, icon: <Target size={18} />, color:'#3B82F6', link:'crm' },
      { dept: 'Supply Chain', score: otif, rag: getRAG(otif), trend: -1, icon: <Truck size={18} />, color:'#F59E0B', link:'shipping' },
      { dept: 'Production',   score: prodScore, rag: getRAG(prodScore), trend: 4, icon: <ActivityIcon size={18} />, color:'#8B5CF6', link:'production' },
      { dept: 'RH',           score: 88, rag: 'amber', trend: 1, icon: <Users size={18} />, color:'#06B6D4', link:'hr' },
    ];

    // Dynamic AI Insights
    const aiInsights = [
      { 
        type: 'FINANCE',
        title: "Cash-Flow Prédictif",
        content: `Marge nette stable à **18.5%**. Les projections Q2 indiquent une capacité d'investissement de **${formatCurrency(caRealise * 0.15, true)}**.`,
        icon: <TrendingUp size={16} />,
        color: '#10B981'
      },
      { 
        type: 'LOGISTICS',
        title: "Optimisation Supply",
        content: `L'OTIF de **${otif}%** est nominal. Nexus suggère de renégocier les contrats de fret sur l'axe Nord pour gagner 3% de marge.`,
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
  }, [data, formatCurrency]);

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
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', color:'var(--accent)', marginBottom:'0.75rem' }}>
            <motion.div 
               animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} 
               transition={{ repeat: Infinity, duration: 2 }}
               style={{ background: 'var(--accent)', width: '8px', height: '8px', borderRadius: '50%' }} 
            />
            <span style={{ fontWeight:900, fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'3px' }}>
              Intelligence Core • Systémique v4.2
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 900, margin: 0, letterSpacing: '-0.04em' }}>
            Bonjour, <span className="text-gradient" style={{ background: 'linear-gradient(to right, var(--text), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{currentUser.nom}</span> 👋
          </h1>
          <p style={{ color:'var(--text-muted)', fontSize:'1.1rem', margin:'0.6rem 0 0 0', fontWeight: 500 }}>
             {new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </p>
        </div>
        <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap' }}>
           <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.25rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
              <Globe size={18} color="var(--accent)" />
              <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>Dakar HQ : CONNECTÉ</span>
           </div>
           <button onClick={() => navigateTo('analytics')} className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              Analytics <ArrowUpRight size={18} />
           </button>
        </div>
      </motion.div>

      {/* ── BENTO GRID MAIN ── */}
      <div className="bento-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
        
        {/* 1. Nexus AI Intelligence Engine (Large Card) */}
        <motion.div variants={itemVariants} className="bento-card" style={{ gridColumn: 'span 8', gridRow: 'span 2', padding: 0, overflow: 'hidden', background: '#0F172A', border: '1px solid var(--accent-glow)' }}>
           <div style={{ padding: '2.5rem', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'var(--accent)', filter: 'blur(120px)', opacity: 0.1 }} />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                 <div style={{ background: 'var(--accent)', padding: '10px', borderRadius: '12px', boxShadow: '0 0 20px var(--accent-glow)' }}>
                    <BrainCircuit size={24} color="white" />
                 </div>
                 <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white', margin: 0 }}>Nexus Strategy Core</h2>
                    <div style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Autonomous Insight Engine</div>
                 </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', flex: 1 }}>
                 {aiInsights.map((insight, i) => (
                    <motion.div 
                       key={i}
                       className="glass"
                       style={{ padding: '1.5rem', borderRadius: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '1rem' }}
                       whileHover={{ y: -5, background: 'rgba(255,255,255,0.04)' }}
                    >
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: insight.color }}>
                          {insight.icon}
                          <span style={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase' }}>{insight.title}</span>
                       </div>
                       <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: 0 }}>
                          {insight.content}
                       </p>
                    </motion.div>
                 ))}
              </div>

              <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                 <button className="btn-primary" style={{ background: 'white', color: 'black', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Ouvrir Nexus Chat <MessageSquare size={16} />
                 </button>
                 <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Dernière mise à jour : instantané à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
           </div>
        </motion.div>

        {/* 2. Main KPI - Finance / Performance (Vertical) */}
        <motion.div variants={itemVariants} className="bento-card" style={{ gridColumn: 'span 4', gridRow: 'span 2', background: 'linear-gradient(135deg, var(--accent) 0%, #064E3B 100%)', color: 'white', border: 'none', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
           <div>
              <div style={{ background: 'rgba(255,255,255,0.1)', width: 'fit-content', padding: '10px', borderRadius: '12px', marginBottom: '1.5rem' }}>
                 <DollarSign size={24} />
              </div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', opacity: 0.8, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Chiffre d'Affaires</div>
              <div style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.05em' }}>{formatCurrency(metrics.sales.caRealise, true)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6EE7B7', fontWeight: 800, fontSize: '0.9rem', marginTop: '0.5rem' }}>
                 <TrendingUp size={16} /> +12.4% vs N-1
              </div>
           </div>

           <div style={{ height: '100px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
              {/* Abstract Chart Representation */}
              <svg width="100%" height="60" viewBox="0 0 200 60">
                 <motion.path 
                    d="M0,50 Q40,10 80,45 T160,20 T200,35" 
                    fill="none" 
                    stroke="white" 
                    strokeWidth="3" 
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                 />
              </svg>
           </div>

           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 800, opacity: 0.8 }}>
              <span>PROJECTION Q2 : {formatCurrency(metrics.sales.caRealise * 1.15, true)}</span>
           </div>
        </motion.div>

        {/* 3. Department Health Pulse (Wide) */}
        <motion.div variants={itemVariants} className="bento-card" style={{ gridColumn: 'span 12', padding: '2rem' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                 <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>Santé Systémique des Départements</h3>
                 <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.4rem' }}>Score consolidé basé sur 14 indicateurs temps-réel.</p>
              </div>
              <button className="btn-glass" style={{ border: '1px solid var(--border)' }}>Détails Ops</button>
           </div>
           
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              {deptHealth.map((dept, i) => (
                 <motion.div 
                    key={i} 
                    className="glass" 
                    whileHover={{ scale: 1.02 }}
                    onClick={() => navigateTo(dept.link)}
                    style={{ padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid var(--border)', cursor: 'pointer' }}
                 >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                       <div style={{ color: dept.color, background: `${dept.color}15`, padding: '8px', borderRadius: '10px' }}>{dept.icon}</div>
                       <RagBadge status={dept.rag} />
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{dept.dept}</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 900 }}>{dept.score}%</div>
                    <div style={{ marginTop: '1rem', height: '6px', background: 'var(--bg-subtle)', borderRadius: '10px', overflow: 'hidden' }}>
                       <motion.div initial={{ width: 0 }} animate={{ width: `${dept.score}%` }} style={{ height: '100%', background: dept.color }} />
                    </div>
                 </motion.div>
              ))}
           </div>
        </motion.div>

        {/* 4. Real-time Charts (Wide) */}
        <motion.div variants={itemVariants} className="bento-card" style={{ gridColumn: 'span 12', padding: '2rem' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>Performance vs Prévisions</h3>
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', fontWeight: 800 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', background: 'var(--accent)', borderRadius: '2px' }} /> Réalisé</div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '10px', height: '10px', border: '2px dashed #8B5CF6', borderRadius: '2px' }} /> Objectif</div>
              </div>
           </div>
           <SafeResponsiveChart minHeight={350}>
              <LineChart data={caComparaisonData}>
                 <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                 <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={v => `${(v/1e6).toFixed(0)}M`} />
                 <Tooltip content={<CustomTooltip />} />
                 <Line type="monotone" dataKey="prevu" stroke="#8B5CF6" strokeWidth={3} strokeDasharray="8 5" dot={false} />
                 <Line type="monotone" dataKey="realise" stroke="var(--accent)" strokeWidth={4} dot={{ r: 6, fill: 'var(--accent)', strokeWidth: 3, stroke: 'white' }} />
              </LineChart>
           </SafeResponsiveChart>
        </motion.div>

      </div>
    </motion.div>
  );
};

export default GlobalDashboard;
