import React from 'react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, ResponsiveContainer, Radar, RadarChart, 
  PolarGrid, PolarAngleAxis, Funnel, FunnelChart, LabelList, Cell
} from 'recharts';
import { 
  Target, TrendingUp, Users, Zap, 
  Star, MousePointer2, Briefcase, Rocket,
  ArrowRight
} from 'lucide-react';
import KpiCard from '../../../components/KpiCard';

const GrowthTab = ({ data, formatCurrency }) => {
  const funnelData = [];
  const channelROI = [];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* Growth & Velocity KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
         <KpiCard 
           title="Vitesse de Vente" value="0 Jrs" 
           icon={<Rocket size={20}/>} color="#D946EF" 
         />
         <KpiCard 
           title="CAC Global" value="0 FCFA" 
           icon={<Target size={20}/>} color="#F59E0B" 
         />
         <KpiCard 
           title="Taux de Conversion" value="0%" 
           icon={<MousePointer2 size={20}/>} color="#10B981" 
         />
         <KpiCard 
           title="LTV (Valeur Client)" value={formatCurrency(0)} 
           icon={<Star size={20}/>} color="#8B5CF6" 
         />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
         {/* Sales Funnel */}
         <div className="glass" style={{ padding: '2.5rem', borderRadius: '2.5rem', background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
               <div style={{ padding: '8px', borderRadius: '10px', background: '#D946EF15', color: '#D946EF' }}>
                  <TrendingUp size={20} />
               </div>
               <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>Tunnel de Conversion Dynamique</h4>
            </div>
            <div style={{ height: '350px' }}>
               <ResponsiveContainer width="100%" height="100%">
                  <FunnelChart>
                     <Tooltip />
                     <Funnel
                        dataKey="value"
                        data={funnelData}
                        isAnimationActive
                     >
                        <LabelList position="right" fill="var(--text-muted)" stroke="none" dataKey="name" style={{ fontWeight: 800, fontSize: '0.8rem' }} />
                        {funnelData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                     </Funnel>
                  </FunnelChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Channel ROI Intelligence */}
         <div className="glass" style={{ padding: '2.5rem', borderRadius: '2.5rem', background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ padding: '8px', borderRadius: '10px', background: '#8B5CF615', color: '#8B5CF6' }}>
                     <Zap size={20} />
                  </div>
                  <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>Efficience Marketing par Canal</h4>
               </div>
            </div>
            <div style={{ height: '350px' }}>
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={channelROI} layout="vertical">
                     <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontWeight: 800, fontSize: 13 }} />
                     <Tooltip contentStyle={{ background: 'var(--bg)', borderRadius: '1rem', border: '1px solid var(--border)' }} />
                     <Bar dataKey="roi" name="ROI (Multiplier)" fill="#8B5CF6" radius={[0, 8, 8, 0]} barSize={20}>
                        {channelROI.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#8B5CF6' : '#6366F1'} fillOpacity={0.8} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
            <div style={{ marginTop: '1.5rem', padding: '1rem 1.5rem', borderRadius: '1.5rem', background: '#10B98115', border: '1px solid #10B98130', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Rocket size={18} color="#10B981" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#10B981' }}>Prévision de Vitesse</span>
               </div>
               <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#10B981' }}>+12% Target</span>
            </div>
         </div>
      </div>

    </motion.div>
  );
};

export default GrowthTab;
