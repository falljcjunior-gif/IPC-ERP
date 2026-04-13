import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Filter, Mail, Phone, Building2, Calendar,
  DollarSign, TrendingUp, Target, BarChart3, Layout, Users, Star,
  ChevronRight, ArrowUpRight, ArrowDownRight, Zap, Award, Clock,
  Activity, RefreshCcw, UserCheck, Megaphone, Headphones, ShieldCheck,
  TrendingDown, Circle, CheckCircle2, XCircle, AlertCircle, Globe,
  MessageSquare, ThumbsUp, ThumbsDown, BarChart2, Layers
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, LineChart, Line, Legend, FunnelChart, Funnel, LabelList,
  Cell, PieChart, Pie, RadialBarChart, RadialBar, ComposedChart
} from 'recharts';
import { useBusiness } from '../BusinessContext';
import EnterpriseView from '../components/EnterpriseView';
import KpiCard from '../components/KpiCard';
import { crmSchema } from '../schemas/crm.schema.js';

/* ─── Helpers (Preserved for Dashboard) ─── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } }
};

/* ═══════════════════════════════════
   CRM MODULE — Full Enterprise
   Now powered by IPC Platform Engine
   ═══════════════════════════════════ */
const CRM = ({ onOpenDetail }) => {
  const { data, formatCurrency } = useBusiness();
  const [view, setView] = useState('dashboard'); // 'dashboard', 'leads', 'opportunities'
  
  const { leads = [], opportunities = [] } = data.crm || {};

  /* ─── Computed KPIs ─── */
  const kpis = useMemo(() => {
    const totalPipeline = opportunities.reduce((s, o) => s + (o.montant || 0), 0);
    const weightedPipeline = opportunities.reduce((s, o) => s + (o.montant || 0) * ((o.probabilite || 0) / 100), 0);
    const won  = opportunities.filter(o => o.etape === 'Gagné');
    const lost = opportunities.filter(o => o.etape === 'Perdu');
    const convRate = leads.length > 0 ? Math.round((opportunities.length / leads.length) * 100) : 0;
    const winRate  = (won.length + lost.length) > 0 ? Math.round((won.length / (won.length + lost.length)) * 100) : 0;
    return { totalPipeline, weightedPipeline, convRate, winRate };
  }, [leads, opportunities]);

  const STAGE_ORDER = ['Nouveau', 'Qualification', 'Proposition', 'Négociation', 'Gagné', 'Perdu'];
  const STAGE_COLORS = { 'Nouveau': '#64748B', 'Qualification': '#3B82F6', 'Proposition': '#8B5CF6', 'Négociation': '#F59E0B', 'Gagné': '#10B981', 'Perdu': '#EF4444' };

  const pipelineByStage = STAGE_ORDER.slice(0, -1).map(stage => ({
    name: stage,
    montant: opportunities.filter(o => o.etape === stage).reduce((s, o) => s + (o.montant || 0), 0),
    count: opportunities.filter(o => o.etape === stage).length,
    color: STAGE_COLORS[stage]
  }));

  /* ─── Dashboard Renderer ─── */
  const renderDashboard = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <KpiCard title="Valeur Pipeline" value={formatCurrency(kpis.totalPipeline, true)} icon={<DollarSign size={20} />} color="#3B82F6" onClick={() => setView('opportunities')} />
        <KpiCard title="Pipeline Pondéré" value={formatCurrency(kpis.weightedPipeline, true)} icon={<Activity size={20} />} color="#8B5CF6" />
        <KpiCard title="Taux Conversion" value={`${kpis.convRate}%`} icon={<TrendingUp size={20} />} color="#10B981" onClick={() => setView('leads')} />
        <KpiCard title="Win Rate" value={`${kpis.winRate}%`} icon={<Award size={20} />} color="#F59E0B" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem' }}>Pipeline par Étape</h4>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={pipelineByStage} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600 }} width={100} />
              <Tooltip cursor={{ fill: 'transparent' }} content={({ active, payload, label }) => (
                active && payload && (
                  <div className="glass" style={{ padding: '0.75rem', borderRadius: '0.75rem', fontSize: '0.8rem' }}>
                    <p style={{ fontWeight: 800 }}>{label}</p>
                    <p style={{ color: 'var(--accent)' }}>Total: {formatCurrency(payload[0].value)}</p>
                    <p style={{ color: 'var(--text-muted)' }}>{payload[0].payload.count} opportunités</p>
                  </div>
                )
              )} />
              <Bar dataKey="montant" radius={[0, 6, 6, 0]} barSize={24}>
                {pipelineByStage.map((entry, index) => <Cell key={index} fill={entry.color} fillOpacity={0.8} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass" style={{ padding: '1.75rem', borderRadius: '1.25rem', background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={16} color="var(--accent)" /> Flux Récent
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {opportunities.slice(0, 4).map(o => (
              <div key={o.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: STAGE_COLORS[o.etape] }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{o.titre}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.client} • {formatCurrency(o.montant, true)}</div>
                </div>
              </div>
            ))}
          </div>
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
               { id: 'leads', label: 'Prospects', icon: <Users size={16} /> },
               { id: 'opportunities', label: 'Pipeline', icon: <Layers size={16} /> }
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
                  moduleId="crm"
                  modelId={view}
                  schema={crmSchema}
                  onOpenDetail={onOpenDetail}
                />
             </motion.div>
          )}
       </AnimatePresence>
    </div>
  );
};

export default CRM;
