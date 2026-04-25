import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, Activity, TrendingUp, Award, BarChart3, 
  Target, Users, ArrowUpRight, ArrowDownRight, Zap, Sparkles
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Cell, PieChart, Pie
} from 'recharts';
import KpiCard from '../../../components/KpiCard';
import SafeResponsiveChart from '../../../components/charts/SafeResponsiveChart';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const AnalyticsTab = ({ leads, opportunities, formatCurrency }) => {
  const kpis = useMemo(() => {
    const totalPipeline = opportunities.reduce((s, o) => s + (Number(o.montant) || 0), 0);
    const weightedPipeline = opportunities.reduce((s, o) => s + (Number(o.montant) || 0) * ((Number(o.probabilite) || 0) / 100), 0);
    const won = opportunities.filter(o => o.etape === 'Gagné');
    const lost = opportunities.filter(o => o.etape === 'Perdu');
    const convRate = leads.length > 0 ? Math.round((opportunities.length / leads.length) * 100) : 0;
    const winRate = (won.length + lost.length) > 0 ? Math.round((won.length / (won.length + lost.length)) * 100) : 0;
    return { totalPipeline, weightedPipeline, convRate, winRate };
  }, [leads, opportunities]);

  const STAGE_ORDER = ['Nouveau', 'Qualification', 'Proposition', 'Négociation', 'Gagné'];
  const STAGE_COLORS = { 'Nouveau': '#64748B', 'Qualification': '#3B82F6', 'Proposition': '#8B5CF6', 'Négociation': '#F59E0B', 'Gagné': '#10B981' };

  const pipelineByStage = STAGE_ORDER.map(stage => ({
    name: stage,
    montant: opportunities.filter(o => o.etape === stage).reduce((s, o) => s + (Number(o.montant) || 0), 0),
    count: opportunities.filter(o => o.etape === stage).length,
    color: STAGE_COLORS[stage]
  }));

  const sparklineData = [10, 25, 45, 30, 55, 78, 65].map((val, i) => ({ val, i }));

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="bento-grid">
      {/* KPI Cards (Row 1) */}
      <KpiCard title="Valeur Pipeline" value={formatCurrency(kpis.totalPipeline, true)} trend={12} trendType="up" icon={<DollarSign size={22} />} color="#3B82F6" sparklineData={sparklineData} />
      <KpiCard title="Prévu (Pondéré)" value={formatCurrency(kpis.weightedPipeline, true)} trend={8} trendType="up" icon={<Target size={22} />} color="#8B5CF6" sparklineData={sparklineData} />
      <KpiCard title="Conversion Leads" value={`${kpis.convRate}%`} trend={5} trendType="up" icon={<Zap size={22} />} color="#F59E0B" sparklineData={sparklineData} />
      <KpiCard title="Win Rate Global" value={`${kpis.winRate}%`} trend={2} trendType="down" icon={<Award size={22} />} color="#10B981" sparklineData={sparklineData} />

      {/* Main Chart (Bento Span 2x2) */}
      <motion.div variants={item} className="bento-card bento-span-2" style={{ gridRow: 'span 2' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h4 style={{ fontWeight: 900, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Activity size={20} color="var(--accent)" /> Répartition du Pipeline
          </h4>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Volume par Étape</span>
        </div>
        <SafeResponsiveChart minHeight={400} fallbackHeight={400}>
          <BarChart data={pipelineByStage} layout="vertical" margin={{ left: 20, right: 40 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" opacity={0.3} />
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }} width={110} />
            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="glass" style={{ padding: '1rem', borderRadius: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid var(--border)' }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>{label}</p>
                    <p style={{ color: 'var(--accent)', fontSize: '1rem', fontWeight: 900 }}>{formatCurrency(payload[0].value, true)}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{payload[0].payload.count} Opportunités</p>
                  </div>
                );
              }
              return null;
            }} />
            <Bar dataKey="montant" radius={[0, 8, 8, 0]} barSize={32}>
              {pipelineByStage.map((entry, index) => <Cell key={index} fill={entry.color} fillOpacity={0.9} />)}
            </Bar>
          </BarChart>
        </SafeResponsiveChart>
      </motion.div>

      {/* AI Context Card (Bento Span 2) */}
      <motion.div variants={item} className="bento-card bento-span-2" style={{ background: 'var(--glass-bg)', border: '1px solid var(--accent-glow)' }}>
         <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px var(--accent-glow)' }}>
               <Sparkles size={24} color="white" />
            </div>
            <div>
               <h5 style={{ margin: 0, fontWeight: 800, fontSize: '1rem' }}>Nexus AI : Insight Ventes</h5>
               <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                 La vélocité de vos leads a augmenté de <span style={{ color: 'var(--accent)', fontWeight: 800 }}>14.2%</span> cette semaine. 
                 Nous recommandons d'allouer plus de ressources sur l'étape <span style={{ fontWeight: 800, color: 'var(--text)' }}>Proposition</span> pour maximiser le Win Rate mensuel.
               </p>
            </div>
         </div>
      </motion.div>

      {/* Source Pie Chart */}
      <motion.div variants={item} className="bento-card">
        <h4 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={18} color="var(--accent)" /> Origine Prospects
        </h4>
        <SafeResponsiveChart minHeight={200} fallbackHeight={200}>
          <PieChart>
            <Pie
              data={[
                { name: 'FB Ads', value: 45, color: '#1877F2' },
                { name: 'Google', value: 25, color: '#34A853' },
                { name: 'Direct', value: 20, color: '#3B82F6' },
                { name: 'Referral', value: 10, color: '#8B5CF6' }
              ]}
              cx="50%" cy="50%"
              innerRadius={50} outerRadius={70}
              paddingAngle={8}
              dataKey="value"
            >
              {[
                { color: '#1877F2' },
                { color: '#34A853' },
                { color: '#3B82F6' },
                { color: '#8B5CF6' }
              ].map((s, i) => <Cell key={i} fill={s.color} stroke="none" />)}
            </Pie>
            <Tooltip contentStyle={{ background: 'var(--bg)', border: 'none', borderRadius: '12px' }} />
          </PieChart>
        </SafeResponsiveChart>
        <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {[
            { label: 'FB Ads', value: '45%', color: '#1877F2' },
            { label: 'Google', value: '25%', color: '#34A853' },
            { label: 'Direct', value: '20%', color: '#3B82F6' },
            { label: 'Autres', value: '10%', color: '#8B5CF6' }
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', fontWeight: 700 }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.color }} />
              <span style={{ color: 'var(--text-muted)' }}>{s.label}</span>
              <span style={{ marginLeft: 'auto' }}>{s.value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AnalyticsTab;
