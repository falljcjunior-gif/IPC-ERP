import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, DollarSign, Target, Award, 
  BarChart3, ArrowUpRight, ArrowDownRight, Zap, Crown, Activity
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Cell, LineChart, Line, ComposedChart
} from 'recharts';
import KpiCard from '../../../components/KpiCard';
import SafeResponsiveChart from '../../../components/charts/SafeResponsiveChart';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const AnalyticsTab = ({ opportunities, formatCurrency }) => {
  const pipeline = useMemo(() => {
    const total = opportunities.reduce((s, o) => s + (Number(o.montant) || 0), 0);
    const weighted = opportunities.reduce((s, o) => s + (Number(o.montant) || 0) * ((Number(o.probabilite) || 0) / 100), 0);
    const won = opportunities.filter(o => o.etape === 'Gagné');
    const lost = opportunities.filter(o => o.etape === 'Perdu');
    const winRate = (won.length + lost.length) > 0 ? Math.round((won.length / (won.length + lost.length)) * 100) : 0;
    return { total, weighted, winRate };
  }, [opportunities]);

  const forecastData = [
    { name: 'Jan', real: 40000000, target: 35000000 },
    { name: 'Fév', real: 32000000, target: 40000000 },
    { name: 'Mar', real: 55000000, target: 45000000 },
    { name: 'Avr', real: 48000000, target: 50000000 },
    { name: 'Mai (Prévu)', real: 52000000, target: 55000000 },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Revenue Excellence KPIs */}
      <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '1.5rem' }}>
        <KpiCard title="Revenu Projeté" value={formatCurrency(pipeline.weighted, true)} trend={0} trendType="up" icon={<TrendingUp size={22} />} color="#3B82F6" sparklineData={[]} />
        <KpiCard title="Pipeline Brut" value={formatCurrency(pipeline.total, true)} trend={0} trendType="up" icon={<DollarSign size={22} />} color="#8B5CF6" sparklineData={[]} />
        <KpiCard title="Win Rate" value={`${pipeline.winRate}%`} trend={0} trendType="down" icon={<Award size={22} />} color="#10B981" sparklineData={[]} />
        <KpiCard title="Nombre de Deals" value={opportunities.length} trend={0} trendType="up" icon={<Target size={22} />} color="#F59E0B" sparklineData={[]} />
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Revenue Forecast Chart */}
        <motion.div variants={item} className="glass" style={{ padding: '2rem', borderRadius: '2rem', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h4 style={{ fontWeight: 900, fontSize: '1.1rem', margin: 0 }}>Prévisions vs Objectifs</h4>
              <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Analyse mensuelle de la performance commerciale.</p>
            </div>
          </div>
          <SafeResponsiveChart minHeight={320} fallbackHeight={320}>
            <ComposedChart data={forecastData}>
              <defs>
                <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }} />
              <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="real" name="Chiffre d'Affaires" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#colorReal)" />
              <Bar dataKey="target" name="Objectif" fill="#8B5CF630" radius={[4, 4, 0, 0]} barSize={20} />
            </ComposedChart>
          </SafeResponsiveChart>
        </motion.div>

        {/* AI Sales Insights */}
        <motion.div variants={item} className="glass" style={{ padding: '2.5rem', borderRadius: '2rem', border: '1px solid var(--border)', background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#10B981', fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            <Activity size={16} /> Sales Pulse IA
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '-0.5px' }}>Performance de Mai</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
             <div style={{ padding: '1.25rem', borderRadius: '1.25rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: '#10B981', fontWeight: 800, fontSize: '0.85rem' }}>
                   <Crown size={14} /> Prévision de Clôture
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>+8% vs Avril</div>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', opacity: 0.6 }}>À ce rythme, vous dépasserez votre objectif de 12M FCFA.</p>
             </div>

             <div style={{ padding: '1.25rem', borderRadius: '1.25rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: '#F59E0B', fontWeight: 800, fontSize: '0.85rem' }}>
                   <Zap size={14} /> Goulot d'Étranglement
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>Étape Négociation</div>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', opacity: 0.6 }}>5 deals stagnent depuis plus de 10 jours. Action requise.</p>
             </div>
          </div>

          <button className="btn-primary" style={{ width: '100%', marginTop: '2rem', padding: '1rem', borderRadius: '1.25rem', fontWeight: 900, background: 'white', color: '#0F172A', border: 'none' }}>
             Lancer l'Analyse Détaillée
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AnalyticsTab;
