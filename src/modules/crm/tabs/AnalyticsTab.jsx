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
  const NEXUS_COLORS = ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#059669'];

  const pipelineByStage = STAGE_ORDER.map((stage, i) => ({
    name: stage,
    montant: opportunities.filter(o => o.etape === stage).reduce((s, o) => s + (Number(o.montant) || 0), 0),
    count: opportunities.filter(o => o.etape === stage).length,
    color: NEXUS_COLORS[i] || '#10B981'
  }));

  const sparklineData = [30, 45, 35, 60, 55, 80, 75].map((val, i) => ({ val, i }));

  return (
    <motion.div variants={container} initial="hidden" animate="show" 
      style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}
    >
      {/* Row 1: Nexus KPIs */}
      <motion.div variants={item} className="nexus-card" style={{ padding: '2rem', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '12px', color: 'var(--nexus-primary)' }}>
            <DollarSign size={20} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--nexus-primary)', fontSize: '0.75rem', fontWeight: 900 }}>
            <ArrowUpRight size={14} /> +12%
          </div>
        </div>
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Volume Pipeline</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--nexus-secondary)', letterSpacing: '-1px' }}>{formatCurrency(kpis.totalPipeline, true)}</div>
        </div>
      </motion.div>

      <motion.div variants={item} className="nexus-card" style={{ padding: '2rem', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ background: 'rgba(5, 150, 105, 0.1)', padding: '10px', borderRadius: '12px', color: '#059669' }}>
            <Target size={20} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#059669', fontSize: '0.75rem', fontWeight: 900 }}>
            <ArrowUpRight size={14} /> +8%
          </div>
        </div>
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Prévu Pondéré</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--nexus-secondary)', letterSpacing: '-1px' }}>{formatCurrency(kpis.weightedPipeline, true)}</div>
        </div>
      </motion.div>

      <motion.div variants={item} className="nexus-card" style={{ padding: '2rem', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '12px', color: 'var(--nexus-primary)' }}>
            <Zap size={20} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--nexus-primary)', fontSize: '0.75rem', fontWeight: 900 }}>
            <ArrowUpRight size={14} /> +5%
          </div>
        </div>
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Taux de Conversion</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--nexus-secondary)', letterSpacing: '-1px' }}>{kpis.convRate}%</div>
        </div>
      </motion.div>

      <motion.div variants={item} className="nexus-card" style={{ padding: '2rem', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ background: 'rgba(5, 150, 105, 0.1)', padding: '10px', borderRadius: '12px', color: '#059669' }}>
            <Award size={20} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#EF4444', fontSize: '0.75rem', fontWeight: 900 }}>
            <ArrowDownRight size={14} /> -2%
          </div>
        </div>
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Win Rate Global</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--nexus-secondary)', letterSpacing: '-1px' }}>{kpis.winRate}%</div>
        </div>
      </motion.div>

      {/* Row 2: Main Pipeline Analysis */}
      <motion.div variants={item} className="nexus-card" style={{ gridColumn: 'span 3', padding: '2.5rem', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <h4 style={{ fontWeight: 900, fontSize: '1.5rem', margin: 0, color: 'var(--nexus-secondary)', letterSpacing: '-0.5px' }}>Topologie du Pipeline</h4>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--nexus-text-muted)', fontWeight: 600 }}>Répartition du volume d'affaires par étape Nexus</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
             <button className="nexus-card" style={{ padding: '0.5rem 1rem', background: 'var(--bg-subtle)', border: '1px solid var(--nexus-border)', fontSize: '0.7rem', fontWeight: 800 }}>Mensuel</button>
             <button className="nexus-card" style={{ padding: '0.5rem 1rem', background: 'white', border: '1px solid var(--nexus-primary)', color: 'var(--nexus-primary)', fontSize: '0.7rem', fontWeight: 800 }}>Hebdomadaire</button>
          </div>
        </div>
        <SafeResponsiveChart minHeight={350} fallbackHeight={350}>
          <BarChart data={pipelineByStage} margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="var(--nexus-border)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--nexus-text-muted)', fontSize: 11, fontWeight: 800 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--nexus-text-muted)', fontSize: 11, fontWeight: 800 }} />
            <Tooltip 
              cursor={{ fill: 'rgba(16, 185, 129, 0.05)', radius: 10 }} 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="nexus-card" style={{ padding: '1.5rem', background: 'white', boxShadow: '0 20px 40px rgba(15,23,42,0.1)', border: '1px solid var(--nexus-border)' }}>
                      <p style={{ margin: '0 0 0.5rem 0', fontWeight: 900, color: 'var(--nexus-secondary)', fontSize: '0.9rem' }}>{payload[0].payload.name}</p>
                      <p style={{ color: 'var(--nexus-primary)', fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>{formatCurrency(payload[0].value, true)}</p>
                      <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', fontWeight: 800, color: 'var(--nexus-text-muted)' }}>{payload[0].payload.count} Affaires Actives</div>
                    </div>
                  );
                }
                return null;
              }} 
            />
            <Bar dataKey="montant" radius={[10, 10, 0, 0]} barSize={50}>
              {pipelineByStage.map((entry, index) => <Cell key={index} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </SafeResponsiveChart>
      </motion.div>

      {/* Row 2 Right: Side Insights */}
      <motion.div variants={item} className="nexus-card" style={{ padding: '2.5rem', background: 'var(--nexus-secondary)', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
             <div className="nexus-glow" style={{ background: 'var(--nexus-primary)', padding: '8px', borderRadius: '10px' }}>
                <Sparkles size={18} color="white" />
             </div>
             <span style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' }}>Nexus Insight</span>
          </div>
          <h5 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '0 0 1rem 0' }}>Opportunités Chaudes</h5>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.6, opacity: 0.8, fontWeight: 500 }}>
            L'IA Nexus a identifié <span style={{ color: 'var(--nexus-primary)', fontWeight: 900 }}>4 affaires</span> avec un score de probabilité {'>'} 85% nécessitant une clôture immédiate.
          </p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '1.5rem', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.1)' }}>
           <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>PROCHAINE ÉTAPE RECOMMANDÉE</div>
           <div style={{ fontWeight: 900, fontSize: '0.85rem' }}>Lancement Campagne Retargeting LinkedIn</div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AnalyticsTab;
