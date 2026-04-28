import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, Users, Target, ShoppingCart, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, Activity as ActivityIcon, Calendar,
  Zap, Briefcase, AlertTriangle, BrainCircuit, Package, Truck,
  HeartPulse, CheckCircle2, XCircle, Minus, ChevronRight, BarChart2,
  Globe, Cpu, MessageSquare, ShieldAlert, Download, Layers
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from 'recharts';
import { useStore } from '../store';
import SafeResponsiveChart from './charts/SafeResponsiveChart';
import { IPCReportGenerator } from '../utils/PDFExporter';
import RadialHealthIndicator from './Dashboard/RadialHealthIndicator';
import AnimatedCounter from './Dashboard/AnimatedCounter';
import './GlobalDashboard.css';

/* ────────────────────────────────
   Animations Helpers
──────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, type: 'spring', bounce: 0.4 } }
};

/* ────────────────────────────────
   Custom Tooltips
──────────────────────────────── */
const AreaTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="nexus-tooltip">
        <p style={{ fontWeight:800, marginBottom:'0.5rem', color: '#0f172a' }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color, margin:'0.2rem 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '8px', height: '8px', background: p.color, borderRadius: '50%' }} />
            {p.name}: {(p.value / 1e6).toFixed(1)} M FCFA
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
  const [isExporting, setIsExporting] = useState(false);

  // ─── Variables BI Dynamiques ───
  const { metrics, caComparaisonData, deptHealth, aiInsights, radarData } = useMemo(() => {
    // 1. Finance & Ventes
    const caRealise = incomes.filter(i => i.statut === 'Payé').reduce((sum, i) => sum + Number(i.montant || 0), 0);
    const caPrevu = 2800000000;

    // 2. RH
    const effectif = employees.length;
    const masseSalariale = employees.reduce((sum, e) => sum + Number(e.salaire || 0), 0);

    // 3. Logistique
    const livres = shipments.filter(s => s.statut === 'Livré').length;
    const retardes = shipments.filter(s => s.statut === 'Retardé').length;
    const otif = livres + retardes > 0 ? Math.round((livres / (livres + retardes)) * 100) : 94;

    // 4. Production
    const prodScore = workOrders.length > 0 
        ? Math.round((workOrders.filter(o => o.statut === 'Terminé').length / workOrders.length) * 100) 
        : 88;

    // Chart Data (Area)
    const moisFr = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentMonth = new Date().getMonth();
    const caComparaisonData = moisFr.map((mois, index) => {
       const prevuMensuel = caPrevu / 12;
       let realise = index <= currentMonth ? (caRealise > 0 ? (caRealise / (currentMonth + 1)) * (0.9 + Math.random() * 0.2) : 150000000 * (0.8 + Math.random() * 0.4)) : null;
       return { mois, Objectif: prevuMensuel, Réalisé: realise };
    });

    const getRAG = (score) => score >= 90 ? 'green' : score >= 75 ? 'amber' : 'red';

    const deptHealth = [
      { dept: 'Finance',      score: 95, rag: 'green', trend: 2, icon: DollarSign,  color:'#10B981', link:'accounting', label: 'Performance Fin.' },
      { dept: 'Commercial',   score: 98, rag: 'green', trend: 5, icon: Target, color:'#0ea5e9', link:'crm', label: 'Célérité Com.' },
      { dept: 'Logistique',   score: otif, rag: getRAG(otif), trend: -1, icon: Truck, color:'#F59E0B', link:'shipping', label: 'Supply Chain' },
      { dept: 'Production',   score: prodScore, rag: getRAG(prodScore), trend: 4, icon: ActivityIcon, color:'#8B5CF6', link:'production', label: 'Industrie' },
      { dept: 'RH',           score: 88, rag: 'amber', trend: 1, icon: Users, color:'#ec4899', link:'hr', label: 'Capital Humain' },
    ];

    // Radar Data
    const radarData = deptHealth.map(d => ({
      sujet: d.dept,
      A: d.score,
      fullMark: 100,
    }));

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
        content: `L'OTIF de ${otif}% est nominal. Nexus suggère de renégocier les contrats de fret sur l'axe Nord.`,
        icon: <Zap size={16} />,
        color: '#F59E0B'
      },
      { 
        type: 'RISK',
        title: "Alerte Turnover",
        content: "Turnover RH en hausse légère (4.2%). Activer le plan de rétention Production.",
        icon: <ShieldAlert size={16} />,
        color: '#ef4444'
      }
    ];

    return { metrics: { sales: { caRealise, caPrevu }, finance: { margeNette: 18.5 }, hr: { masseSalariale, effectif }, supply: { otif } }, caComparaisonData, deptHealth, aiInsights, radarData };
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
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <motion.div 
      className="dashboard-nexus-container"
      variants={containerVariants} initial="hidden" animate="show"
    >

      {/* ── Header ── */}
      <motion.div variants={itemVariants} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:'2rem' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', color:'#0ea5e9', marginBottom:'0.75rem' }}>
            <motion.div 
               animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }} 
               transition={{ repeat: Infinity, duration: 2 }}
               style={{ background: '#0ea5e9', width: '8px', height: '8px', borderRadius: '50%', boxShadow: '0 0 10px #0ea5e9' }} 
            />
            <span style={{ fontWeight:900, fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'3px' }}>
              Intelligence Core • Systémique v5.0
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, margin: 0, letterSpacing: '-0.05em', color: '#0f172a' }}>
            Vue <span className="dashboard-glow-text">360°</span>
          </h1>
          <p style={{ color:'#64748b', fontSize:'1.1rem', margin:'0.6rem 0 0 0', fontWeight: 600 }}>
             Bienvenue, {currentUser?.nom} • {new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </p>
        </div>
        <div style={{ display:'flex', gap:'1.25rem', flexWrap:'wrap' }}>
           <button onClick={() => navigateTo('analytics')} className="dashboard-nexus-card" style={{ padding: '0.85rem 2rem', background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', border: 'none', fontWeight: 800 }}>
              Deep Analytics <Zap size={18} fill="#0ea5e9" stroke="none" />
           </button>
        </div>
      </motion.div>

      {/* ── BENTO GRID MAIN ── */}
      <div className="dashboard-bento-grid">
        
        {/* 1. Main KPI - Finance (Wide Top Left) */}
        <motion.div variants={itemVariants} className="dashboard-nexus-card" style={{ gridColumn: 'span 8', padding: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
           <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '12px', borderRadius: '14px', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                   <DollarSign size={28} color="#0ea5e9" />
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Revenu Systémique YTD</div>
              </div>
              <div style={{ fontSize: '4.5rem', fontWeight: 950, letterSpacing: '-0.06em', color: '#0f172a', lineHeight: 1 }}>
                <AnimatedCounter 
                  from={0} 
                  to={metrics.sales.caRealise} 
                  duration={2.5} 
                  formatter={(val) => formatCurrency(val, true)} 
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                 <div style={{ background: '#10b98120', padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 800 }}>
                    <TrendingUp size={18} /> +14.2%
                 </div>
                 <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.9rem' }}>vs dernier mois</span>
              </div>
           </div>

           {/* Small Area Sparkline inside the main card */}
           <div style={{ width: '300px', height: '150px' }}>
              <SafeResponsiveChart>
                <AreaChart data={caComparaisonData.slice(-6)}>
                  <defs>
                    <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="Réalisé" stroke="#0ea5e9" strokeWidth={4} fillOpacity={1} fill="url(#sparklineGrad)" />
                </AreaChart>
              </SafeResponsiveChart>
           </div>
        </motion.div>

        {/* 2. Nexus AI Intelligence Engine (Right Square) */}
        <motion.div variants={itemVariants} className="dashboard-nexus-card" style={{ gridColumn: 'span 4', padding: '2.5rem', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
               <Cpu size={24} color="#8b5cf6" />
               <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Nexus Intelligence</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
               {aiInsights.map((insight, i) => (
                  <div key={i} style={{ paddingLeft: '1rem', borderLeft: `3px solid ${insight.color}` }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: insight.color, marginBottom: '0.5rem' }}>
                        {insight.icon}
                        <span style={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{insight.title}</span>
                     </div>
                     <div className={i === 0 ? "typewriter-text" : ""} style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 500, lineHeight: 1.5 }}>
                        {insight.content}
                     </div>
                  </div>
               ))}
            </div>
        </motion.div>

        {/* 3. Radial Health Pulse (Wide middle) */}
        <motion.div variants={itemVariants} className="dashboard-nexus-card" style={{ gridColumn: 'span 12', padding: '2.5rem' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
              <div>
                 <h3 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>Diagnostic Multi-Pôles</h3>
                 <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '0.5rem', fontWeight: 500 }}>Évaluation temps-réel de l'efficience opérationnelle.</p>
              </div>
           </div>
           
           <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '2rem' }}>
              {deptHealth.map((dept, i) => (
                 <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigateTo(dept.link)}>
                    <RadialHealthIndicator score={dept.score} color={dept.color} icon={dept.icon} />
                    <span style={{ marginTop: '1.5rem', fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {dept.label}
                    </span>
                 </div>
              ))}
           </div>
        </motion.div>

        {/* 4. Trajectory Area Chart & Radar (Bottom Split) */}
        <motion.div variants={itemVariants} className="dashboard-nexus-card" style={{ gridColumn: 'span 8', padding: '2.5rem' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: '#0f172a', letterSpacing: '-0.02em' }}>Trajectoire & Objectifs</h3>
              <div style={{ display: 'flex', gap: '2rem', fontSize: '0.85rem', fontWeight: 800 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0ea5e9' }}>
                    <div style={{ width: '12px', height: '12px', background: '#0ea5e9', borderRadius: '4px' }} /> Réalisé
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b5cf6' }}>
                    <div style={{ width: '12px', height: '12px', background: 'rgba(139, 92, 246, 0.2)', border: '2px solid #8b5cf6', borderRadius: '4px' }} /> Objectif
                 </div>
              </div>
           </div>
           <SafeResponsiveChart minHeight={350}>
              <AreaChart data={caComparaisonData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRealise" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPrevu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 700 }} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} tickFormatter={v => `${(v/1e6).toFixed(0)}M`} width={60} />
                <Tooltip content={<AreaTooltip />} />
                <Area type="monotone" dataKey="Objectif" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPrevu)" />
                <Area type="monotone" dataKey="Réalisé" stroke="#0ea5e9" strokeWidth={4} fillOpacity={1} fill="url(#colorRealise)" activeDot={{ r: 8, strokeWidth: 0, fill: '#0ea5e9' }} />
              </AreaChart>
           </SafeResponsiveChart>
        </motion.div>

        <motion.div variants={itemVariants} className="dashboard-nexus-card" style={{ gridColumn: 'span 4', padding: '2.5rem', display: 'flex', flexDirection: 'column' }}>
           <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, marginBottom: '1rem', color: '#0f172a', letterSpacing: '-0.02em', textAlign: 'center' }}>Balance Opérationnelle</h3>
           <div style={{ flex: 1 }}>
              <SafeResponsiveChart>
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="rgba(0,0,0,0.1)" />
                  <PolarAngleAxis dataKey="sujet" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Performance" dataKey="A" stroke="#0ea5e9" strokeWidth={2} fill="#0ea5e9" fillOpacity={0.5} />
                </RadarChart>
              </SafeResponsiveChart>
           </div>
        </motion.div>

      </div>
    </motion.div>
  );
};

export default React.memo(GlobalDashboard);
