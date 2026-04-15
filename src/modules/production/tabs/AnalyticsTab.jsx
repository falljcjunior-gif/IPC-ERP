import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, Zap, CheckCircle2, AlertTriangle, 
  BarChart3, Factory, Clock, Settings, ShieldCheck, 
  ArrowUpRight, ArrowDownRight, TrendingUp 
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, PieChart, Pie, Cell, 
  RadialBarChart, RadialBar, Legend
} from 'recharts';
import KpiCard from '../../../components/KpiCard';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const AnalyticsTab = ({ data, formatCurrency }) => {
  const orders = data?.production?.workOrders || [];
  
  const industrialKPIs = {
    oee: 0,
    trs: 0,
    quality: 0,
    downTime: '0h 0m'
  };

  const performanceData = [];

  const qualityColors = ['#10B981', '#F59E0B', '#EF4444'];

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Industrial Excellence KPIs */}
      <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
        <KpiCard title="OEE (Rendement Global)" value={`${industrialKPIs.oee}%`} icon={<Activity size={22} />} color="#06B6D4" />
        <KpiCard title="TRS (Efficacité OF)" value={`${industrialKPIs.trs}%`} icon={<Zap size={22} />} color="#3B82F6" />
        <KpiCard title="Qualité (Conformité)" value={`${industrialKPIs.quality}%`} icon={<ShieldCheck size={22} />} color="#10B981" />
        <KpiCard title="Arrêts Machines" value={industrialKPIs.downTime} icon={<AlertTriangle size={22} />} color="#F59E0B" />
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '1.5rem' }}>
        {/* Weekly Production Volume Chart */}
        <motion.div variants={item} className="glass" style={{ padding: '2rem', borderRadius: '2rem', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h4 style={{ fontWeight: 900, fontSize: '1.1rem', margin: 0 }}>Volume de Production Hebdomadaire</h4>
              <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Unités produites par jour.</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="colorQty" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }} />
              <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="qty" stroke="#06B6D4" strokeWidth={4} fillOpacity={1} fill="url(#colorQty)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Machine Status & Utilization */}
        <motion.div variants={item} className="glass" style={{ padding: '2.5rem', borderRadius: '2rem', border: '1px solid var(--border)', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#06B6D4', fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            <Activity size={16} /> Capacités Machines
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
             {[
               { name: 'Ligne Presse A', status: 'Inactif', util: 0, color: '#10B981' },
               { name: 'Ligne Presse B', status: 'Inactif', util: 0, color: '#06B6D4' },
               { name: 'Robot Palettiseur', status: 'Inactif', util: 0, color: '#F59E0B' },
             ].map((m, i) => (
                <div key={i}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{m.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{m.status}</div>
                      </div>
                      <div style={{ fontWeight: 900, fontSize: '1rem', color: m.color }}>{m.util}%</div>
                   </div>
                   <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${m.util}%` }} 
                        transition={{ duration: 1, delay: 0.5 + i*0.2 }}
                        style={{ height: '100%', background: m.color, borderRadius: '4px' }} 
                      />
                   </div>
                </div>
             ))}
          </div>

          <div style={{ marginTop: '2.5rem', padding: '1.25rem', borderRadius: '1.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
             <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.7, lineHeight: 1.5 }}>
                <AlertTriangle size={14} style={{ marginRight: '6px', color: '#F59E0B', display: 'inline' }} />
                **Alerte Maintenance** : La Ligne Presse B approche des 500h de cycle. Planifiez une révision préventive.
             </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AnalyticsTab;
