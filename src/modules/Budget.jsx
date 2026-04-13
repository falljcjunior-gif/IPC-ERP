import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PiggyBank, Plus, TrendingUp, TrendingDown, Target, AlertCircle,
  BarChart3, Calendar, DollarSign, Activity, AlertTriangle,
  CheckCircle2, ChevronRight, Zap, Layers, RefreshCcw, BarChart2
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  Cell, ComposedChart, Line, Legend, RadialBarChart, RadialBar, PieChart, Pie
} from 'recharts';
import { useBusiness } from '../BusinessContext';
import EnterpriseView from '../components/EnterpriseView';
import KpiCard from '../components/KpiCard';
import { budgetSchema } from '../schemas/budget.schema.js';

/* ─── Helpers ─── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } }
};

/* ════════════════════════════════════
   BUDGET MODULE — Full Enterprise
   Now powered by IPC Platform Engine
   ════════════════════════════════════ */
const Budget = ({ onOpenDetail }) => {
  const { data, formatCurrency } = useBusiness();
  const [view, setView] = useState('dashboard'); // 'dashboard', 'envelopes'
  
  const budgets = useMemo(() => data.finance?.budgets || [], [data.finance?.budgets]);

  /* ─── KPIs (Dashboard) ─── */
  const kpis = useMemo(() => {
    const totalPrev  = budgets.reduce((s, d) => s + d.prevision, 0);
    const totalReal  = budgets.reduce((s, d) => s + d.realise, 0);
    const burnRate   = totalPrev > 0 ? Math.round((totalReal / totalPrev) * 100) : 0;
    return { totalPrev, totalReal, burnRate };
  }, [budgets]);

  /* ─── Dashboard Renderer ─── */
  const renderDashboard = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <KpiCard title="Budget Alloué" value={formatCurrency(kpis.totalPrev, true)} icon={<PiggyBank size={20}/>} color="#3B82F6" />
        <KpiCard title="Consommé YTD" value={formatCurrency(kpis.totalReal, true)} icon={<Activity size={20}/>} color="#F59E0B" />
        <KpiCard title="Burn Rate" value={`${kpis.burnRate}%`} icon={<Zap size={20}/>} color={kpis.burnRate > 100 ? '#EF4444' : '#10B981'} />
        <KpiCard title="Économies" value={formatCurrency(Math.max(0, kpis.totalPrev - kpis.totalReal), true)} icon={<CheckCircle2 size={20}/>} color="#10B981" />
      </div>

      <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <span style={{ fontWeight: 800 }}>Vitesse de Consommation Budgétaire</span>
          <span style={{ fontWeight: 900, color: 'var(--accent)' }}>{kpis.burnRate}%</span>
        </div>
        <div style={{ height: '16px', background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
           <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(kpis.burnRate, 100)}%` }} style={{ height: '100%', background: 'var(--accent)' }} />
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>Indicateur de santé basé sur le prévisionnel annuel consolidé.</p>
      </div>
    </motion.div>
  );

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
       {/* Module Header Toolbar */}
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-subtle)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)' }}>
             {[
               { id: 'dashboard', label: 'Dashboard', icon: <BarChart2 size={16} /> },
               { id: 'envelopes', label: 'Enveloppes OPEX/CAPEX', icon: <Layers size={16} /> }
             ].map(t => (
               <button
                 key={t.id}
                 onClick={() => setView(t.id)}
                 style={{
                   padding: '6px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                   background: view === t.id ? 'var(--bg)' : 'transparent',
                   color: view === t.id ? 'var(--accent)' : 'var(--text-muted)',
                   fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px',
                   boxShadow: view === t.id ? 'var(--shadow-sm)' : 'none'
                 }}
               >
                 {t.icon} {t.label}
               </button>
             ))}
          </div>
       </div>

       <AnimatePresence mode="wait">
          {view === 'dashboard' ? (
             <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {renderDashboard()}
             </motion.div>
          ) : (
             <motion.div key="records" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <EnterpriseView 
                  moduleId="finance" 
                  modelId="budgets" // Adjusted to match BusinessContext data key
                  schema={budgetSchema}
                  onOpenDetail={onOpenDetail}
                />
             </motion.div>
          )}
       </AnimatePresence>
    </div>
  );
};

export default Budget;
