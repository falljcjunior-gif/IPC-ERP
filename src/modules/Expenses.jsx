import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, Plus, Search, CheckCircle2, XCircle, ChevronRight,
  CreditCard, FileText, Clock, User, Truck, Plane, Coffee,
  Home, BarChart3, TrendingUp, Target, AlertCircle, Download,
  Filter, Activity, DollarSign, BarChart2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  Cell, ComposedChart, Line, Legend, PieChart, Pie
} from 'recharts';
import SafeResponsiveChart from '../components/charts/SafeResponsiveChart';
import { useBusiness } from '../BusinessContext';
import EnterpriseView from '../components/EnterpriseView';
import KpiCard from '../components/KpiCard';
import { financeSchema } from '../schemas/finance.schema.js';

/* ─── Helpers ─── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } }
};

/* ════════════════════════════════════
   EXPENSES MODULE — Full Enterprise
   Now powered by IPC Platform Engine
   ════════════════════════════════════ */
const Expenses = ({ onOpenDetail }) => {
  const { data, formatCurrency } = useBusiness();
  const [view, setView] = useState('dashboard'); // 'dashboard', 'expenses'

  const allExpenses = useMemo(() => data?.hr?.expenses || [], [data?.hr?.expenses]);

  /* ─── KPIs (Dashboard only) ─── */
  const kpis = useMemo(() => {
    const total       = allExpenses.reduce((s, e) => s + (e.amount || 0), 0);
    const enAttente   = allExpenses.filter(e => e.status === 'En attente').length;
    const txValidation= allExpenses.length > 0 ? Math.round((allExpenses.filter(e => e.status === 'Approuvé').length / allExpenses.length) * 100) : 0;
    return { total, enAttente, txValidation };
  }, [allExpenses]);

  /* ─── Dashboard Renderer ─── */
  const renderDashboard = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '1.5rem' }}>
        <KpiCard title="Total Frais Déclarés" value={formatCurrency(kpis.total, true)} icon={<Wallet size={20}/>} color="#3B82F6" />
        <KpiCard title="En Attente" value={`${kpis.enAttente} dossiers`} icon={<Clock size={20}/>} color="#F59E0B" />
        <KpiCard title="Taux de Validation" value={`${kpis.txValidation}%`} icon={<Target size={20}/>} color="#8B5CF6" />
        <KpiCard title="Dépôt de Reçus" value="100%" icon={<FileText size={20}/>} color="#10B981" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
           <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem' }}>Analyse des Coûts par Catégorie</h3>
           <SafeResponsiveChart minHeight={240} fallbackHeight={240}>
              <BarChart data={[{n:'Transport',v:450},{n:'Repas',v:320},{n:'Logement',v:890},{n:'Autres',v:120}]}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                 <XAxis dataKey="n" axisLine={false} tickLine={false} />
                 <YAxis hide />
                 <Tooltip />
                 <Bar dataKey="v" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
           </SafeResponsiveChart>
        </div>
        <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
           <Activity size={48} color="var(--accent)" />
           <h3 style={{ fontWeight: 800, margin: 0 }}>Compliance & Audit</h3>
           <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Toutes les notes de frais sont auditées et rattachées à des justificatifs numériques.</p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
       {/* Module Header Toolbar */}
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-subtle)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)' }}>
             {[
               { id: 'dashboard', label: 'Analytics', icon: <BarChart2 size={16} /> },
               { id: 'expenses', label: 'Toutes les Notes', icon: <Wallet size={16} /> }
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
                  modelId="expenses"
                  schema={financeSchema}
                  onOpenDetail={onOpenDetail}
                />
             </motion.div>
          )}
       </AnimatePresence>
    </div>
  );
};

export default Expenses;
