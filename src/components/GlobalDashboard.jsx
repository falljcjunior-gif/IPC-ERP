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
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, 
  LineChart, Line, Legend, ReferenceLine
} from 'recharts';
import { useBusiness } from '../BusinessContext';
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

  // ─── KPI Metrics ───
  const metrics = useMemo(() => ({
    sales:   { caRealise:2540000000, caPrevu:2800000000, cac:125000,     ltv:8500000,    pipelineEvo:15.2 },
    finance: { cashFlow:850000000,   dso:42,             margeNette:18.5 },
    hr:      { masseSalariale:120000000, turnover:4.2,   absenteisme:2.1, effectif: data.hr?.employees?.length || 0 },
    supply:  { rotationStocks:8.5,   otif:94.2,          coutLogistique:15000 }
  }), [data]);

  // ─── CA Mensuel Réalisé vs Prévisions (12 mois) ───
  const caComparaisonData = [
    { mois:'Jan', realise:1900000000, prevu:2000000000 },
    { mois:'Fév', realise:2100000000, prevu:2100000000 },
    { mois:'Mar', realise:2300000000, prevu:2200000000 },
    { mois:'Avr', realise:2150000000, prevu:2250000000 },
    { mois:'Mai', realise:2400000000, prevu:2400000000 },
    { mois:'Jun', realise:2600000000, prevu:2500000000 },
    { mois:'Juil',realise:2350000000, prevu:2600000000 },
    { mois:'Aoû', realise:2250000000, prevu:2700000000 },
    { mois:'Sep', realise:2480000000, prevu:2750000000 },
    { mois:'Oct', realise:2540000000, prevu:2800000000 },
    { mois:'Nov', realise:null,       prevu:2850000000 },
    { mois:'Déc', realise:null,       prevu:2900000000 },
  ];

  // ─── Department Health Scores (RAG) ───
  const deptHealth = [
    { dept: 'Finance',      score: 82, rag: 'green', trend: +3.2, icon: <DollarSign size={18} />,  color:'#10B981', link:'accounting' },
    { dept: 'Commercial',   score: 71, rag: 'amber', trend: -5.1, icon: <Target size={18} />,       color:'#3B82F6', link:'crm' },
    { dept: 'Supply Chain', score: 64, rag: 'amber', trend: -2.8, icon: <Truck size={18} />,        color:'#F59E0B', link:'inventory' },
    { dept: 'Production',   score: 89, rag: 'green', trend: +1.1, icon: <ActivityIcon size={18} />, color:'#8B5CF6', link:'production' },
    { dept: 'RH',           score: 77, rag: 'green', trend: +0.8, icon: <Users size={18} />,        color:'#06B6D4', link:'hr' },
    { dept: 'Projets',      score: 58, rag: 'red',   trend: -8.3, icon: <Briefcase size={18} />,    color:'#EF4444', link:'projects' },
  ];

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
      <motion.div variants={itemVariants} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', color:'var(--accent)', marginBottom:'0.5rem' }}>
            <Zap size={18} fill="var(--accent)" />
            <span style={{ fontWeight:800, fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'1.5px' }}>Command Center ERP — Vue 360°</span>
          </div>
          <h1 style={{ fontSize:'2.5rem', fontWeight:800, margin:0 }}>Bonjour, {currentUser.nom} 👋</h1>
          <p style={{ color:'var(--text-muted)', fontSize:'1rem', margin:'0.4rem 0 0 0' }}>
            {new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })} — 
            {' '}<strong style={{ color:'var(--accent)' }}>Rôle: {role.replace('_', ' ')}</strong>
          </p>
        </div>
        <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
          <button onClick={() => navigateTo('bi')} className="glass" style={{ padding:'0.65rem 1.25rem', borderRadius:'0.75rem', border:'1px solid var(--border)', fontWeight:600, display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer', fontSize:'0.85rem' }}>
            <BarChart2 size={16} /> Rapports BI
          </button>
          <button onClick={() => navigateTo('analytics')} style={{ padding:'0.65rem 1.25rem', borderRadius:'0.75rem', border:'none', background:'var(--accent)', color:'white', fontWeight:600, display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer', fontSize:'0.85rem' }}>
            <Globe size={16} /> Analytics Globaux <ArrowUpRight size={16} />
          </button>
        </div>
      </motion.div>

      {/* ── AI Action Center ── */}
      <motion.div variants={itemVariants} className="glass" style={{ padding:'2rem', borderRadius:'1.5rem', border:'1px solid rgba(139,92,246,0.3)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-60px', right:'-40px', width:'300px', height:'300px', background:'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)', filter:'blur(40px)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'-40px', left:'-20px', width:'200px', height:'200px', background:'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', filter:'blur(30px)', pointerEvents:'none' }} />
        
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.5rem' }}>
            <BrainCircuit size={22} color="#8B5CF6" />
            <h2 style={{ fontSize:'1.15rem', fontWeight:800, margin:0 }}>Cockpit IA — Anticipation & Alertes Stratégiques</h2>
            <span style={{ marginLeft:'auto', fontSize:'0.72rem', color:'var(--text-muted)', padding:'3px 8px', background:'var(--bg-subtle)', borderRadius:'999px' }}>
              Mis à jour il y a 2 min
            </span>
          </div>
          
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'1rem' }}>
            {[
              {
                level:'red', icon:<AlertTriangle size={16} />, color:'#EF4444',
                title:'⚠ Risque Cash-Flow Imminent',
                body:`Le DSO de 42 jours combiné aux décaissements Q3 crée un risque de déficit de ${formatCurrency(150000000, true)} d'ici 90 jours. Recouvrement urgent sur MegaCorp & TechGlobal.`,
                action:'Voir DSO', link:'finance_dso'
              },
              {
                level:'amber', icon:<Package size={16} />, color:'#F59E0B',
                title:'📦 Rupture Stock Prévue — J+14',
                body:`Le produit "Serveur Gen3" (Europe) connaît une hausse de demande de +27%. Sans réassort ce jour, rupture prévue dans 14 jours → Perte estimée: ${formatCurrency(80000000, true)}.`,
                action:'Voir Stock', link:null
              },
              {
                level:'green', icon:<TrendingUp size={16} />, color:'#10B981',
                title:'✅ Opportunité Croissance B2B',
                body:`La baisse du CAC (-8%) sur le segment B2B génère une fenêtre d'acquisition optimale. L'IA recommande d'augmenter le budget Mktg de 20% → ROI projeté ×3.2.`,
                action:'Voir Pipeline', link:null
              },
            ].map((alert, i) => (
              <motion.div key={i} whileHover={{ scale:1.015 }} className="glass" style={{ padding:'1.25rem', borderRadius:'1rem', borderLeft:`4px solid ${alert.color}`, background:'var(--bg)', cursor:'pointer' }}
                onClick={() => alert.link && handleDrillDown(alert.link)}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', color:alert.color, fontWeight:700, marginBottom:'0.6rem', fontSize:'0.85rem' }}>
                  {alert.icon} {alert.title}
                </div>
                <p style={{ fontSize:'0.8rem', color:'var(--text-muted)', margin:'0 0 0.75rem 0', lineHeight:1.5 }}>{alert.body}</p>
                {alert.link && (
                  <span style={{ fontSize:'0.75rem', fontWeight:700, color:alert.color, display:'flex', alignItems:'center', gap:'4px' }}>
                    {alert.action} <ChevronRight size={12} />
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Department Health Scorecards ── */}
      <motion.div variants={itemVariants}>
        <h3 style={{ fontSize:'1.15rem', fontWeight:700, marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <ActivityIcon size={18} color="var(--accent)" /> Santé des Départements
        </h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'1rem' }}>
          {deptHealth.map((dept, i) => (
            <motion.div key={i} variants={itemVariants} whileHover={{ y:-4 }} onClick={() => navigateTo(dept.link)} className="glass"
              style={{ padding:'1.25rem', borderRadius:'1.25rem', cursor:'pointer', display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ color:dept.color, background:`${dept.color}15`, padding:'0.5rem', borderRadius:'0.6rem' }}>{dept.icon}</div>
                <RagBadge status={dept.rag} />
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:'0.9rem', marginBottom:'0.25rem' }}>{dept.dept}</div>
                <div style={{ fontSize:'1.75rem', fontWeight:800 }}>{dept.score}<span style={{ fontSize:'0.9rem', color:'var(--text-muted)' }}>/100</span></div>
              </div>
              {/* Score Bar */}
              <div style={{ height:'6px', background:'var(--bg-subtle)', borderRadius:'999px', overflow:'hidden' }}>
                <motion.div
                  initial={{ width:0 }} animate={{ width:`${dept.score}%` }}
                  transition={{ duration:1, delay: i * 0.1 }}
                  style={{ height:'100%', background:dept.rag === 'red' ? '#EF4444' : dept.rag === 'amber' ? '#F59E0B' : '#10B981', borderRadius:'999px' }}
                />
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'0.75rem', color: dept.trend > 0 ? '#10B981' : '#EF4444' }}>
                {dept.trend > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {dept.trend > 0 ? '+' : ''}{dept.trend}% ce mois
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── CA Réalisé vs Prévisions Chart ── */}
      {isSales && (
        <motion.div variants={itemVariants} className="glass" style={{ padding:'2rem', borderRadius:'1.5rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
            <div>
              <h3 style={{ fontSize:'1.15rem', fontWeight:700, margin:0 }}>C.A. Réalisé vs Prévisions</h3>
              <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', margin:'0.25rem 0 0 0' }}>Performance commerciale sur 12 mois glissants</p>
            </div>
            <div style={{ display:'flex', gap:'1.5rem', fontSize:'0.8rem' }}>
              <span style={{ display:'flex', alignItems:'center', gap:'6px' }}><span style={{ width:'12px', height:'3px', background:'var(--accent)', display:'inline-block', borderRadius:'2px' }} /> Réalisé</span>
              <span style={{ display:'flex', alignItems:'center', gap:'6px' }}><span style={{ width:'12px', height:'3px', background:'#8B5CF6', display:'inline-block', borderRadius:'2px', borderTop:'3px dashed #8B5CF6', height:'0' }} /> Prévisions</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={caComparaisonData} margin={{ top:5, right:20, left:0, bottom:5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{ fill:'var(--text-muted)', fontSize:12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill:'var(--text-muted)', fontSize:11 }} tickFormatter={v => `${(v/1e9).toFixed(1)}Md`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize:'0.8rem', paddingTop:'1rem' }} />
              <ReferenceLine y={2800000000} stroke="#EF444430" strokeDasharray="4 4" label={{ value:'Objectif Annuel', position:'right', fill:'#EF4444', fontSize:10 }} />
              <Line type="monotone" dataKey="prevu"   name="Prévisions" stroke="#8B5CF6" strokeWidth={2} strokeDasharray="6 3" dot={false} connectNulls />
              <Line type="monotone" dataKey="realise" name="Réalisé"    stroke="var(--accent)" strokeWidth={3} dot={{ r:4, fill:'var(--accent)', strokeWidth:0 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* ── KPI Rows by Department (Role-Based) ── */}
      <div style={{ display:'flex', flexDirection:'column', gap:'2.5rem' }}>
        
        {/* VENTES */}
        {isSales && (
          <motion.div variants={itemVariants}>
            <h3 style={{ fontSize:'1.1rem', fontWeight:700, marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <Target size={18} color="#3B82F6" /> Direction Commerciale
            </h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'1.25rem' }}>
              <KpiCard title="Chiffre d'Affaires Réalisé" value={formatCurrency(metrics.sales.caRealise, true)} trend={-9.2} trendType="down" icon={<DollarSign size={22} />} color="#3B82F6" sparklineData={[{val:10},{val:15},{val:12},{val:9},{val:8}]} onDrillDown={() => handleDrillDown('sales_ca')} />
              <KpiCard title="Évolution Pipeline"         value={`+${metrics.sales.pipelineEvo}%`}             trend={metrics.sales.pipelineEvo} trendType="up"   icon={<Briefcase size={22} />} color="#8B5CF6" sparklineData={[{val:5},{val:8},{val:10},{val:12},{val:15}]} />
              <KpiCard title="Coût d'Acquisition (CAC)"  value={formatCurrency(metrics.sales.cac)}             trend={5.4}  trendType="up"   icon={<ShoppingCart size={22} />} color="#10B981" sparklineData={[{val:140},{val:135},{val:130},{val:128},{val:125}]} />
              <KpiCard title="Valeur Vie Client (LTV)"   value={formatCurrency(metrics.sales.ltv, true)}       trend={2.1}  trendType="up"   icon={<Users size={22} />} color="#F43F5E" sparklineData={[{val:80},{val:82},{val:83},{val:84},{val:85}]}  />
            </div>
          </motion.div>
        )}

        {/* FINANCE */}
        {isCFO && (
          <motion.div variants={itemVariants}>
            <h3 style={{ fontSize:'1.1rem', fontWeight:700, marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <DollarSign size={18} color="#10B981" /> Direction Financière (CFO)
            </h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'1.25rem' }}>
              <KpiCard title="Cash-flow Opérationnel" value={formatCurrency(metrics.finance.cashFlow, true)} trend={4.5}  trendType="up"   icon={<ActivityIcon size={22} />} color="#10B981" sparklineData={[{val:700},{val:750},{val:800},{val:780},{val:850}]} onDrillDown={() => handleDrillDown('finance_cashflow')} />
              <KpiCard title="DSO (Délai Recouvrement)" value={`${metrics.finance.dso} Jours`}             trend={12.5} trendType="down" icon={<Calendar size={22} />}  color="#EF4444" sparklineData={[{val:35},{val:36},{val:38},{val:40},{val:42}]}   onDrillDown={() => handleDrillDown('finance_dso')} />
              <KpiCard title="Marge Nette Globale"     value={`${metrics.finance.margeNette}%`}             trend={1.2}  trendType="up"   icon={<ArrowUpRight size={22} />} color="#06B6D4" sparklineData={[{val:17},{val:17.5},{val:18},{val:18.2},{val:18.5}]} />
            </div>
          </motion.div>
        )}

        {/* SUPPLY CHAIN */}
        {isSupply && (
          <motion.div variants={itemVariants}>
            <h3 style={{ fontSize:'1.1rem', fontWeight:700, marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <Truck size={18} color="#F59E0B" /> Supply Chain & Logistique
            </h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'1.25rem' }}>
              <KpiCard title="Taux de Service (OTIF)"      value={`${metrics.supply.otif}%`}             trend={2.1}  trendType="down" icon={<Target size={22} />}    color="#F59E0B" sparklineData={[{val:96},{val:95.5},{val:95},{val:94.8},{val:94.2}]} onDrillDown={() => handleDrillDown('supply_otif')} />
              <KpiCard title="Rotation des Stocks"          value={`${metrics.supply.rotationStocks}x/an`} trend={0.5}  trendType="up"   icon={<Package size={22} />}   color="#8B5CF6" sparklineData={[{val:7.8},{val:8.0},{val:8.2},{val:8.4},{val:8.5}]} />
              <KpiCard title="Coût Logistique / Commande"  value={formatCurrency(metrics.supply.coutLogistique)} trend={1.5} trendType="up" icon={<ArrowDownRight size={22} />} color="#10B981" sparklineData={[{val:15500},{val:15400},{val:15200},{val:15100},{val:15000}]} />
            </div>
          </motion.div>
        )}

        {/* RESSOURCES HUMAINES */}
        {isHR && (
          <motion.div variants={itemVariants}>
            <h3 style={{ fontSize:'1.1rem', fontWeight:700, marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <HeartPulse size={18} color="#F43F5E" /> Ressources Humaines
            </h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'1.25rem' }}>
              <KpiCard title="Masse Salariale"    value={formatCurrency(metrics.hr.masseSalariale, true)} trend={2.4}  trendType="down" icon={<Users size={22} />}         color="#3B82F6" sparklineData={[{val:110},{val:112},{val:115},{val:118},{val:120}]} />
              <KpiCard title="Taux de Turnover"   value={`${metrics.hr.turnover}%`}                       trend={0.8}  trendType="up"   icon={<ActivityIcon size={22} />}   color="#10B981" sparklineData={[{val:5.2},{val:5.0},{val:4.8},{val:4.5},{val:4.2}]} />
              <KpiCard title="Taux d'Absentéisme" value={`${metrics.hr.absenteisme}%`}                    trend={0.3}  trendType="down" icon={<AlertTriangle size={22} />}  color="#F43F5E" sparklineData={[{val:1.8},{val:1.9},{val:1.9},{val:2.0},{val:2.1}]} />
              <KpiCard title="Effectif Total"     value={metrics.hr.effectif || 125}                      trend={1.1}  trendType="up"   icon={<Users size={22} />}          color="#8B5CF6" sparklineData={[{val:118},{val:120},{val:121},{val:123},{val:125}]} />
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <motion.div variants={itemVariants}>
        <h3 style={{ fontSize:'1.1rem', fontWeight:700, marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <Zap size={18} color="var(--accent)" /> Accès Rapides
        </h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:'1rem' }}>
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
