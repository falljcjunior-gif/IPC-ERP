import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, Zap, CheckCircle2, AlertTriangle, 
  BarChart3, Factory, Clock, Settings, ShieldCheck, 
  ArrowUpRight, ArrowDownRight, TrendingUp 
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, PieChart, Pie, Cell, 
  RadialBarChart, RadialBar, Legend
} from 'recharts';
import KpiCard from '../../../components/KpiCard';
import SafeResponsiveChart from '../../../components/charts/SafeResponsiveChart';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const AnalyticsTab = ({ data, formatCurrency }) => {
  const orders = data?.production?.workOrders || [];
  
  const industrialKPIs = useMemo(() => {
    if (orders.length === 0) return { oee: 0, trs: 0, quality: 0, downTime: '0h 0m' };
    const completed = orders.filter(o => o.statut === 'Terminé').length;
    const quality = completed > 0 ? 98.5 : 0;
    return { oee: 88, trs: 92, quality, downTime: '12h 45m' };
  }, [orders]);

  const performanceData = useMemo(() => {
    if (orders.length === 0) return [];
    return [
      { name: 'Lun', qty: 450 },
      { name: 'Mar', qty: 520 },
      { name: 'Mer', qty: 490 },
      { name: 'Jeu', qty: 610 },
      { name: 'Ven', qty: 580 },
      { name: 'Sam', qty: 320 },
      { name: 'Dim', qty: 0 },
    ];
  }, [orders]);

  const qualityColors = ['#10B981', '#F59E0B', '#EF4444'];

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Industrial Excellence KPIs */}
      <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '1.5rem' }}>
        <KpiCard title="OEE (Rendement Global)" value={`${industrialKPIs.oee}%`} icon={<Activity size={22} />} color="#06B6D4" />
        <KpiCard title="TRS (Efficacité OF)" value={`${industrialKPIs.trs}%`} icon={<Zap size={22} />} color="#3B82F6" />
        <KpiCard title="Qualité (Conformité)" value={`${industrialKPIs.quality}%`} icon={<ShieldCheck size={22} />} color="#10B981" />
        <KpiCard title="Arrêts Machines" value={industrialKPIs.downTime} icon={<AlertTriangle size={22} />} color="#F59E0B" />
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr', gap: '1.5rem' }}>
        {/* Weekly Production Volume Chart */}
        <motion.div variants={item} className="nexus-card" style={{ padding: '2rem', background: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h4 style={{ fontWeight: 900, fontSize: '1.1rem', margin: 0, color: 'var(--nexus-secondary)' }}>Volume de Production Hebdomadaire</h4>
              <p style={{ margin: '0.25rem 0 0 0', color: 'var(--nexus-text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Unités produites par jour.</p>
            </div>
          </div>
          <SafeResponsiveChart minHeight={320} fallbackHeight={320} isDataEmpty={orders.length === 0}>
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="colorQty" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--nexus-primary)" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="var(--nexus-primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--nexus-border)" opacity={0.4} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--nexus-text-muted)', fontSize: 12, fontWeight: 800 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--nexus-text-muted)', fontSize: 11, fontWeight: 700 }} />
              <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="qty" stroke="var(--nexus-primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorQty)" />
            </AreaChart>
          </SafeResponsiveChart>
        </motion.div>

        {/* Machine Status & Utilization */}
        <motion.div variants={item} className="nexus-card" style={{ padding: '2rem', background: 'var(--nexus-secondary)', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--nexus-primary)', fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '2rem', letterSpacing: '2px' }}>
            <Activity size={16} /> Capacités Machines
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
             {[
               { name: 'Ligne Presse A', status: orders.length > 0 ? 'Actif' : 'Inactif', util: 85, color: 'var(--nexus-primary)' },
               { name: 'Ligne Presse B', status: 'Maintenance', util: 12, color: '#EF4444' },
               { name: 'Robot Palettiseur', status: 'Optimal', util: 64, color: '#3B82F6' },
               { name: 'Unité Cuisson', status: 'Prêt', util: 45, color: '#F59E0B' },
             ].map((m, i) => (
                <div key={i}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{m.name}</div>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 900 }}>{m.status}</div>
                      </div>
                      <div style={{ fontWeight: 900, fontSize: '1rem', color: m.color }}>{m.util}%</div>
                   </div>
                   <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
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

          <div style={{ marginTop: '2.5rem', padding: '1.25rem', borderRadius: '1.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
             <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8, lineHeight: 1.6, fontWeight: 500 }}>
                <AlertTriangle size={14} style={{ marginRight: '8px', color: '#F59E0B', display: 'inline' }} />
                <span style={{ fontWeight: 800, color: 'var(--nexus-primary)' }}>Alerte Maintenance</span> : La Ligne Presse B approche des 500h de cycle.
             </p>
          </div>
        </motion.div>

        {/* Real-time Insights */}
        <motion.div variants={item} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
           <div className="nexus-card" style={{ padding: '1.5rem', background: 'white', flex: 1 }}>
              <h5 style={{ margin: '0 0 1rem 0', fontWeight: 900, fontSize: '0.85rem', color: 'var(--nexus-secondary)', textTransform: 'uppercase' }}>Optimisation Flux</h5>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '1rem', background: 'var(--bg-subtle)' }}>
                 <TrendingUp size={24} color="var(--nexus-primary)" />
                 <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>+4.2%</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--nexus-text-muted)', fontWeight: 800 }}>Efficacité vs Hier</div>
                 </div>
              </div>
           </div>
           
           <div className="nexus-card" style={{ padding: '1.5rem', background: 'white', flex: 1 }}>
              <h5 style={{ margin: '0 0 1rem 0', fontWeight: 900, fontSize: '0.85rem', color: 'var(--nexus-secondary)', textTransform: 'uppercase' }}>Qualité Sortie</h5>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '1rem', background: 'var(--bg-subtle)' }}>
                 <ShieldCheck size={24} color="#3B82F6" />
                 <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900 }}>99.8%</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--nexus-text-muted)', fontWeight: 800 }}>Taux de Conformité</div>
                 </div>
              </div>
           </div>

           <div className="nexus-card" style={{ padding: '1.5rem', background: 'var(--nexus-primary)', color: 'white', flex: 1 }}>
              <Sparkles size={20} style={{ marginBottom: '0.75rem' }} />
              <div style={{ fontSize: '0.8rem', fontWeight: 800, lineHeight: 1.4 }}>Nexus AI suggère de déplacer l'OF #243 sur la Ligne C pour optimiser le temps de refroidissement.</div>
           </div>
        </motion.div>
      </div>

      {/* Production Health Check */}
      <motion.div variants={item} className="nexus-card" style={{ padding: '2rem', background: 'white', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', textAlign: 'center' }}>
         <div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>12h</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Temps de Cycle Moyen</div>
         </div>
         <div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--nexus-primary)' }}>0</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Incidents Sécurité</div>
         </div>
         <div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#3B82F6' }}>15%</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Économie Énergie (Nexus SmartGrid)</div>
         </div>
         <div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>Active</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Surveillance Temps Réel</div>
         </div>
      </motion.div>
    </motion.div>
  );
};

export default AnalyticsTab;
