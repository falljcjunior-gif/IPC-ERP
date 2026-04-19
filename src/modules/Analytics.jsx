import React from 'react';
import { motion } from 'framer-motion';
import { Activity, BarChart2, PieChart as PieIcon, LineChart as LineIcon, Zap, Target, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { useBusiness } from '../BusinessContext';
import KpiCard from '../components/KpiCard';
import SafeResponsiveChart from '../components/charts/SafeResponsiveChart';

const Analytics = () => {
  const { data } = useBusiness();

  const mockTrend = [];

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#EC4899', marginBottom: '0.4rem' }}>
                <Activity size={16} /><span style={{ fontWeight: 800, fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Data Analytics — Org Health Radar</span>
             </div>
             <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Analyses Avancées</h1>
             <p style={{ color: 'var(--text-muted)', margin: '0.3rem 0 0 0', fontSize: '0.92rem' }}>Exploration granulaire · Tendances inter-modules · Santé Data</p>
          </div>
       </div>

       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <KpiCard title="Utilisation Plateforme" value="0%" icon={<Zap size={20}/>} color="#EC4899" />
          <KpiCard title="Intégrité Données" value="0%" icon={<Target size={20}/>} color="#10B981" />
          <KpiCard title="Requêtes / sec" value="0" icon={<TrendingUp size={20}/>} color="#3B82F6" />
       </div>

       <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
          <h3 style={{ fontWeight: 800, marginBottom: '1.5rem' }}>Trafic & Activité Globale</h3>
          <SafeResponsiveChart minHeight={300} fallbackHeight={300}>
             <AreaChart data={mockTrend}>
                <defs>
                   <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EC4899" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#EC4899" stopOpacity={0}/>
                   </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
                <Tooltip />
                <Area type="monotone" dataKey="val" stroke="#EC4899" fillOpacity={1} fill="url(#colorVal)" strokeWidth={3} />
             </AreaChart>
          </SafeResponsiveChart>
       </div>

       <div className="grid grid-2" style={{ gap: '1.5rem' }}>
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
             <h4 style={{ fontWeight: 800 }}>Répartition par Pole</h4>
             <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Distribution de la charge de travail entre les différents départements opérationnels.</p>
          </div>
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
             <h4 style={{ fontWeight: 800 }}>Vitesse de Traitement</h4>
             <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Temps moyen de résolution des tickets et des ordres de fabrication.</p>
          </div>
       </div>
    </div>
  );
};

export default Analytics;
