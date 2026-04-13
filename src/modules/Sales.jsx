import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Package, Plus, FileText, ChevronRight, MoreVertical,
  Tag, Clock, CheckCircle2, BarChart3, Layout, TrendingUp, TrendingDown,
  DollarSign, Target, Users, Award, Zap, Star, Crown, AlertTriangle,
  ArrowUpRight, Briefcase, Activity, Globe, RefreshCcw, Filter, BarChart2, Layers
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, LineChart, Line, Legend, Cell, ComposedChart,
  ReferenceLine, PieChart, Pie, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { useBusiness } from '../BusinessContext';
import EnterpriseView from '../components/EnterpriseView';
import KpiCard from '../components/KpiCard';
import { salesSchema } from '../schemas/sales.schema.js';

/* ─── Helpers ─── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } }
};

/* ══════════════════════════════════════
   SALES MODULE — Full Enterprise
   Now powered by IPC Platform Engine
   ══════════════════════════════════════ */
const Sales = ({ onOpenDetail }) => {
  const { data, formatCurrency } = useBusiness();
  const [view, setView] = useState('dashboard'); // 'dashboard', 'orders', 'products'
  
  const opportunities = useMemo(() => data?.crm?.opportunities || [], [data?.crm?.opportunities]);

  /* ─── Aggregated Pipeline KPIs (Dashboard only) ─── */
  const pipeline = useMemo(() => {
    const total = opportunities.reduce((s, o) => s + (o.montant || 0), 0);
    const weighted = opportunities.reduce((s, o) => s + (o.montant || 0) * ((o.probabilite || 0) / 100), 0);
    const won = opportunities.filter(o => o.etape === 'Gagné');
    const lost = opportunities.filter(o => o.etape === 'Perdu');
    const winRate = (won.length + lost.length) > 0 ? Math.round((won.length / (won.length + lost.length)) * 100) : 0;
    return { total, weighted, winRate };
  }, [opportunities]);

  /* ─── Dashboard Renderer ─── */
  const renderDashboard = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <KpiCard title="Pipeline Brut" value={formatCurrency(pipeline.total, true)} icon={<DollarSign size={20} />} color="#3B82F6" onClick={() => setView('orders')} />
        <KpiCard title="Pipeline Pondéré" value={formatCurrency(pipeline.weighted, true)} icon={<Target size={20} />} color="#8B5CF6" />
        <KpiCard title="Win Rate Global" value={`${pipeline.winRate}%`} icon={<Award size={20} />} color="#10B981" />
        <KpiCard title="Opportunités" value={opportunities.length} icon={<Briefcase size={20} />} color="#F59E0B" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Prévisions de Revenus</h4>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={[{m:'Jan',v:4000},{m:'Fév',v:3000},{m:'Mar',v:5000},{m:'Avr',v:4500}]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="m" axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip />
              <Area type="monotone" dataKey="v" stroke="#3B82F6" fill="#3B82F610" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
           <Crown size={48} color="#F59E0B" />
           <h3 style={{ fontWeight: 800, margin: 0 }}>Sales Intelligence</h3>
           <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Utilisez les vues de données pour explorer vos commandes et votre catalogue produit.</p>
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
               { id: 'dashboard', label: 'Dashboard', icon: <BarChart2 size={16} /> },
               { id: 'orders', label: 'Commandes', icon: <ShoppingCart size={16} /> },
               { id: 'products', label: 'Catalogue', icon: <Tag size={16} /> }
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
                  moduleId="sales"
                  modelId={view}
                  schema={salesSchema}
                  onOpenDetail={onOpenDetail}
                />
             </motion.div>
          )}
       </AnimatePresence>
    </div>
  );
};

export default Sales;
