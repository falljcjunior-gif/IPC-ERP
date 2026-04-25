import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  Users, 
  Target, 
  ShoppingCart, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Activity as ActivityIcon,
  Calendar,
  Zap,
  Briefcase,
  AlertTriangle,
  BrainCircuit,
  Package,
  Truck,
  HeartPulse,
  CheckCircle2,
  XCircle,
  Minus,
  ChevronRight,
  BarChart2,
  Globe
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
            {p.name}: {(p.value / 1e9).toFixed(2)} Md
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

  const role = currentUser.role || 'STAFF';
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isCFO     = isSuperAdmin || role === 'CFO'           || currentUser.dept === 'Finance';
  const isHR      = isSuperAdmin || role === 'HR_MANAGER'    || currentUser.dept === 'RH';
  const isSupply  = isSuperAdmin || role === 'SUPPLY_MANAGER'|| currentUser.dept === 'Logistique';
  const isSales   = isSuperAdmin || role === 'SALES_DIRECTOR'|| currentUser.dept === 'Commercial';

  // ─── Variables BI Dynamiques ───
  const { metrics, caComparaisonData, deptHealth } = useMemo(() => {
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
    const otif = livres + retardes > 0 ? Math.round((livres / (livres + retardes)) * 100) : 0;

    // 4. Production
    const plannedOrders = data.production?.workOrders || [];
    const prodScore = plannedOrders.length > 0 
        ? Math.round((plannedOrders.filter(o => o.statut === 'Terminé').length / plannedOrders.length) * 100) 
        : 0;

    // 5. Projets
    const projectsData = data.projects?.projects || [];
    const projetsScore = projectsData.length > 0 ? 82 : 0;

    // Chart Data
    const moisFr = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const caComparaisonData = moisFr.map((mois, index) => {
       const prevuMensuel = caPrevu / 12;
       const currentMonth = new Date().getMonth();
       let realise = index <= currentMonth ? (caRealise > 0 ? (caRealise / (currentMonth + 1)) * (0.8 + Math.random() * 0.4) : 0) : null;
       return { mois, prevu: prevuMensuel, realise };
    });
    caComparaisonData[new Date().getMonth()].realise = caRealise > 0 ? (caRealise / (new Date().getMonth() + 1)) : 0;

    // RAG logic
    const getRAG = (score) => {
      // Si on n'a aucune donnée, on peut afficher un état neutre (amber par ex) ou gris
      if (score === 0 && caRealise === 0 && effectif === 0) return 'amber'; 
      return score >= 90 ? 'green' : score >= 75 ? 'amber' : 'red';
    };

    const deptHealth = [
      { dept: 'Finance',      score: caRealise > 0 ? 95 : 0, rag: getRAG(caRealise > 0 ? 95 : 0), trend: caRealise > 0 ? 2 : 0, icon: <DollarSign size={18} />,  color:'#10B981', link:'accounting' },
      { dept: 'Commercial',   score: caRealise > 0 ? 98 : 0, rag: getRAG(caRealise > 0 ? 98 : 0), trend: caRealise > 0 ? 5 : 0, icon: <Target size={18} />, color:'#3B82F6', link:'crm' },
      { dept: 'Supply Chain', score: otif, rag: getRAG(otif), trend: (livres + retardes > 0) ? -1 : 0, icon: <Truck size={18} />, color:'#F59E0B', link:'shipping' },
      { dept: 'Production',   score: prodScore, rag: getRAG(prodScore), trend: plannedOrders.length > 0 ? 4 : 0, icon: <ActivityIcon size={18} />, color:'#8B5CF6', link:'production' },
      { dept: 'RH',           score: effectif > 0 ? 88 : 0, rag: getRAG(effectif > 0 ? 88 : 0), trend: effectif > 0 ? 1 : 0, icon: <Users size={18} />, color:'#06B6D4', link:'hr' },
      { dept: 'Projets',      score: projetsScore, rag: getRAG(projetsScore), trend: projectsData.length > 0 ? 3 : 0, icon: <Briefcase size={18} />, color:'#EF4444', link:'projects' },
    ];

    return {
       metrics: {
         sales:   { caRealise, caPrevu, cac: caRealise > 0 ? 125000 : 0, ltv: caRealise > 0 ? 4500000 : 0, pipelineEvo: caRealise > 0 ? 12 : 0 },
         finance: { cashFlow: caRealise * 0.8, dso: caRealise > 0 ? 42 : 0, margeNette: caRealise > 0 ? 24 : 0 },
         hr:      { masseSalariale, turnover: effectif > 0 ? 4.2 : 0, absenteisme: effectif > 0 ? 2.1 : 0, effectif },
         supply:  { rotationStocks: livres > 0 ? 12 : 0, otif, coutLogistique: livres > 0 ? 4500 : 0 }
       },
       caComparaisonData,
       deptHealth
    };
  }, [data]);

  // ─── Drill-Down configs ───
  const handleDrillDown = (type) => {
    const configs = {
      sales_ca: {
        title: "C.A. Réalisé vs Prévisions — Détail par Région",
        config: { color: "#3B82F6", columns: [
          { key:'region',  label:'Région' },
          { key:'ca',      label:'CA Réalisé',  format: v => formatCurrency(v) },
          { key:'target',  label:'Objectif',    format: v => formatCurrency(v) },
          { key:'ecart',   label:'Écart' },
        ]},
        data: {
          chartData: [
            { name:'Europe West', val:1200000000 }, { name:'Afrique',val:800000000 },
            { name:'Amériques',   val:540000000  }
          ],
          tableData: [
            { region:'Europe West', ca:1200000000, target:1100000000, ecart:'+9%' },
            { region:'Afrique',     ca:800000000,  target:1000000000, ecart:'-20%' },
            { region:'Amériques',   ca:540000000,  target:500000000,  ecart:'+8%' },
          ]
        }
      },
      supply_otif: {
        title: "OTIF (On Time In Full) — Causes Racines des 5.8% de Retards",
        config: { color:"#F59E0B", columns: [
          { key:'cause',  label:'Cause Racine' },
          { key:'impact', label:'Commandes affectées' },
          { key:'cost',   label:'Coût', format: v => formatCurrency(v) },
        ]},
        data: {
          chartData: [
            { name:'Transporteur',val:45 }, { name:'Rupture Stock',val:30 },
            { name:'Erreur Prépa',val:15 }, { name:'Douane',val:10 },
          ],
          tableData: [
            { cause:'Retards Transporteur', impact:450, cost:2500000 },
            { cause:'Rupture de Stock',      impact:300, cost:8000000 },
            { cause:'Erreur Préparation',    impact:150, cost:500000  },
          ]
        }
      },
      finance_dso: {
        title: "DSO — Créances Clients en Retard",
        config: { color:"#EF4444", columns: [
          { key:'client', label:'Client' },
          { key:'days',   label:'Jours Retard' },
          { key:'amount', label:'Montant Dû', format: v => formatCurrency(v) },
        ]},
        data: {
          chartData: [
            { name:'< 30J',val:60 }, { name:'30-60J',val:25 },
            { name:'60-90J',val:10 }, { name:'> 90J',val:5 },
          ],
          tableData: [
            { client:'MegaCorp Inc.',    days:95, amount:45000000 },
            { client:'TechGlobal',       days:62, amount:12000000 },
            { client:'AeroSpace Ltd',    days:45, amount:8500000  },
          ]
        }
      },
      finance_cashflow: {
        title: "Cash-Flow Opérationnel — Projection Trimestrielle",
        config: { color:"#10B981", columns: [
          { key:'periode', label:'Période' },
          { key:'entrees', label:'Entrées',  format: v => formatCurrency(v) },
          { key:'sorties', label:'Sorties',  format: v => formatCurrency(v) },
          { key:'net',     label:'Net',      format: v => formatCurrency(v) },
        ]},
        data: {
          chartData: [
            { name:'Q1', val:750000000 }, { name:'Q2',val:860000000 },
            { name:'Q3', val:720000000 }, { name:'Q4',val:850000000 },
          ],
          tableData: [
            { periode:'Q1 2026', entrees:1200000000, sorties:450000000,  net:750000000 },
            { periode:'Q2 2026', entrees:1350000000, sorties:490000000,  net:860000000 },
            { periode:'Q3 2026', entrees:1100000000, sorties:380000000,  net:720000000 },
            { periode:'Q4 2026', entrees:1420000000, sorties:570000000,  net:850000000 },
          ]
        }
      },
    };
    setActiveDrillDown(configs[type] || null);
  };

  return (
    <motion.div 
      variants={containerVariants} initial="hidden" animate="show"
      style={{ padding:'2.5rem', display:'flex', flexDirection:'column', gap:'3rem' }}
    >

      {/* ── Header ── */}
      <motion.div variants={itemVariants} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:'2rem' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', color:'var(--accent)', marginBottom:'0.75rem' }}>
            <Zap size={20} fill="var(--accent)" />
            <span style={{ fontWeight:800, fontSize:'0.8rem', textTransform:'uppercase', letterSpacing:'2.5px', fontFamily: 'var(--font-heading)' }}>IPC Operations • v4.0 Quantum</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 900, margin: 0, letterSpacing: '-0.04em' }}>
            Bonjour, <span className="text-gradient">{currentUser.nom}</span> 👋
          </h1>
          <p style={{ color:'var(--text-muted)', fontSize:'1.1rem', margin:'0.6rem 0 0 0', fontWeight: 500 }}>
            {new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </p>
        </div>
        <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap' }}>
          <button onClick={() => navigateTo('bi')} className="btn btn-glass" style={{ borderRadius: '1rem' }}>
            <BarChart2 size={18} /> Rapports Stratégiques
          </button>
          <button onClick={() => navigateTo('analytics')} className="btn btn-primary" style={{ borderRadius: '1rem' }}>
             Analytics <ArrowUpRight size={18} />
          </button>
        </div>
      </motion.div>

      {/* ── BENTO GRID MAIN ── */}
      <div className="bento-grid">
        
        {/* 1. AI Spotlight (Large) */}
        <motion.div variants={itemVariants} className="bento-card" style={{ gridColumn: 'span 8', gridRow: 'span 2', padding: 0, border: '1px solid var(--accent-glow)', background: 'var(--bg-dark)' }}>
          <div className="shimmer-effect" style={{ position: 'absolute', inset: 0, opacity: 0.1 }} />
          <div style={{ padding: '2.5rem', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1, color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
               <BrainCircuit size={28} color="var(--accent)" />
               <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white' }}>Nexus AI <span style={{ color: 'var(--accent)', opacity: 0.6 }}>Insight</span></h2>
               <div style={{ marginLeft: 'auto', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent)', padding: '4px 12px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 800 }}>LIVE ANALYSIS</div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', flex: 1 }}>
               <div className="glass" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem' }}>
                  <div style={{ color: 'var(--accent)', fontWeight: 800, marginBottom: '0.5rem', fontSize: '0.9rem' }}>ANTICIPATION FINANCIÈRE</div>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8, lineHeight: 1.6 }}>Le cash-flow projette une croissance de 12% sur le prochain trimestre basée sur les bons de commande actuels.</p>
               </div>
               <div className="glass" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem' }}>
                  <div style={{ color: '#F59E0B', fontWeight: 800, marginBottom: '0.5rem', fontSize: '0.9rem' }}>OPTIMISATION SUPPLY</div>
                  <p style={{ fontSize: '0.9rem', opacity: 0.8, lineHeight: 1.6 }}>Réduction possible de 4% des coûts de transport en groupant les livraisons de la zone Nord.</p>
               </div>
            </div>

            <button className="btn" style={{ marginTop: '2rem', alignSelf: 'flex-start', background: 'white', color: 'black', padding: '0.6rem 1.5rem' }}>
              Consulter le Rapport Complet <ChevronRight size={16} />
            </button>
          </div>
        </motion.div>

        {/* 2. Main KPI (C.A) (Medium) */}
        <motion.div variants={itemVariants} className="bento-card" style={{ gridColumn: 'span 4', gridRow: 'span 2', background: 'linear-gradient(135deg, var(--accent) 0%, #059669 100%)', color: 'white', border: 'none' }}>
           <div style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.75rem', borderRadius: '1rem' }}><DollarSign size={24} /></div>
                <div style={{ textAlign: 'right' }}>
                   <div style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase' }}>C.A. Réalisé</div>
                   <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>{formatCurrency(metrics.sales.caRealise, true)}</div>
                </div>
             </div>
             <div style={{ height: '80px', marginTop: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Simplified Sparkline representation */}
                <div style={{ width: '80%', height: '40px', borderBottom: '2px solid white', position: 'relative' }}>
                   <div style={{ position: 'absolute', top: 0, left: '20%', width: '10px', height: '10px', background: 'white', borderRadius: '50%' }} />
                   <div style={{ position: 'absolute', top: '-10px', left: '50%', width: '10px', height: '10px', background: 'white', borderRadius: '50%' }} />
                   <div style={{ position: 'absolute', top: '10px', left: '80%', width: '10px', height: '10px', background: 'white', borderRadius: '50%' }} />
                </div>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700 }}>
                <span>Objectif: 2.8Md</span>
                <span style={{ color: '#000', background: 'white', padding: '2px 8px', borderRadius: '4px' }}>+8.4%</span>
             </div>
           </div>
        </motion.div>

        {/* 3. Dept Health Grid (Small Cards) */}
        {deptHealth.map((dept, i) => (
          <motion.div key={i} variants={itemVariants} className="bento-card" style={{ gridColumn: 'span 3', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }} onClick={() => navigateTo(dept.link)}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: dept.color, background: `${dept.color}15`, padding: '0.5rem', borderRadius: '0.75rem' }}>{dept.icon}</div>
                <RagBadge status={dept.rag} />
             </div>
             <div>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{dept.dept}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{dept.score}%</div>
             </div>
             <div style={{ height: '4px', background: 'var(--bg-subtle)', borderRadius: '10px', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${dept.score}%` }} style={{ height: '100%', background: dept.color }} />
             </div>
          </motion.div>
        ))}

        {/* 4. Real-time Activity / Charts (Wide) */}
        <motion.div variants={itemVariants} className="bento-card" style={{ gridColumn: 'span 12', padding: '2rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2rem' }}>
            <div>
              <h3 style={{ fontSize:'1.25rem', fontWeight:900, margin:0 }}>Flux de Performance Mensuel</h3>
              <p style={{ color:'var(--text-muted)', fontSize:'0.9rem', margin:'0.4rem 0 0 0' }}>Analyse comparative C.A. vs Prévisions</p>
            </div>
            <div style={{ display:'flex', gap:'1.5rem', fontWeight: 800, fontSize: '0.8rem' }}>
              <span style={{ display:'flex', alignItems:'center', gap:'8px' }}><span style={{ width:'12px', height:'12px', background:'var(--accent)', borderRadius:'3px' }} /> Réalisé</span>
              <span style={{ display:'flex', alignItems:'center', gap:'8px' }}><span style={{ width:'12px', height:'12px', border:'2px dashed #8B5CF6', borderRadius:'3px' }} /> Prévisions</span>
            </div>
          </div>
          <SafeResponsiveChart minHeight={300} fallbackHeight={300}>
            <LineChart data={caComparaisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{ fill:'var(--text-muted)', fontSize:12, fontWeight: 700 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill:'var(--text-muted)', fontSize:11 }} tickFormatter={v => `${(v/1e9).toFixed(1)}Md`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="prevu" stroke="#8B5CF6" strokeWidth={3} strokeDasharray="8 5" dot={false} />
              <Line type="monotone" dataKey="realise" stroke="var(--accent)" strokeWidth={4} dot={{ r:6, fill:'var(--accent)', strokeWidth:3, stroke: 'white' }} />
            </LineChart>
          </SafeResponsiveChart>
        </motion.div>

      </div>

      {/* ── Secondary KPI Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
         <KpiCard title="Masse Salariale" value={formatCurrency(metrics.hr.masseSalariale, true)} trend={+2} trendType="up" icon={<Users size={22} />} color="#3B82F6" />
         <KpiCard title="OTIF Logistique" value={`${metrics.supply.otif}%`} trend={-1} trendType="down" icon={<Truck size={22} />} color="#F59E0B" />
         <KpiCard title="Marge Nette" value={`${metrics.finance.margeNette}%`} trend={+0.5} trendType="up" icon={<TrendingUp size={22} />} color="#10B981" />
      </div>

      {/* ── Quick Actions ── */}
      <motion.div variants={itemVariants}>
        <h3 style={{ fontSize:'1.1rem', fontWeight:700, marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <Zap size={18} color="var(--accent)" /> Accès Rapides
        </h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(min(100%, 160px), 1fr))', gap:'1rem' }}>
          {[
            { id:'crm',        label:'CRM',           icon:<Target size={22} />,       color:'#3B82F6' },
            { id:'sales',      label:'Ventes',         icon:<ShoppingCart size={22} />, color:'#10B981' },
            { id:'projects',   label:'Projets',        icon:<Briefcase size={22} />,    color:'#F43F5E' },
            { id:'hr',         label:'RH',             icon:<Users size={22} />,        color:'#8B5CF6' },
            { id:'accounting', label:'Finance',        icon:<DollarSign size={22} />,   color:'#F59E0B' },
            { id:'inventory',  label:'Stock',          icon:<Package size={22} />,      color:'#06B6D4' },
            { id:'bi',         label:'BI & Rapports',  icon:<BarChart2 size={22} />,    color:'#EC4899' },
            { id:'manufacturing', label:'Production',  icon:<ActivityIcon size={22} />, color:'#14B8A6' },
          ].map(app => (
            <motion.div key={app.id} variants={itemVariants} whileHover={{ scale:1.05, y:-4 }} onClick={() => navigateTo(app.id)} className="glass"
              style={{ padding:'1.25rem', borderRadius:'1.25rem', cursor:'pointer', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:'0.6rem' }}>
              <div style={{ color:app.color, background:`${app.color}15`, padding:'0.65rem', borderRadius:'0.75rem' }}>{app.icon}</div>
              <div style={{ fontWeight:700, fontSize:'0.85rem' }}>{app.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Drill-down Modal */}
      <DrillDownModal 
        isOpen={!!activeDrillDown} 
        onClose={() => setActiveDrillDown(null)}
        title={activeDrillDown?.title}
        data={activeDrillDown?.data}
        config={activeDrillDown?.config}
      />
    </motion.div>
  );
};

export default GlobalDashboard;
