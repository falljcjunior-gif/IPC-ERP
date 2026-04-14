import React from 'react';
import { motion } from 'framer-motion';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, Legend
} from 'recharts';
import { 
  TrendingUp, Activity, Star, Target, 
  ShieldCheck, Zap, Globe, Users2, DollarSign
} from 'lucide-react';
import KpiCard from '../../../components/KpiCard';

const ExecutiveTab = ({ data, formatCurrency }) => {
  const orgHealth = [
    { subject: 'Finance', val: 92, fullMark: 100 },
    { subject: 'Industrie', val: 85, fullMark: 100 },
    { subject: 'Ventes', val: 78, fullMark: 100 },
    { subject: 'People', val: 94, fullMark: 100 },
    { subject: 'Social', val: 88, fullMark: 100 },
  ];

  const trends = [
    { name: 'Jan', ca: 850, margin: 32 },
    { name: 'Fév', ca: 920, margin: 34 },
    { name: 'Mar', ca: 1100, margin: 38 },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* Top Level Board KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
         <KpiCard 
           title="Index de Santé Global" value="92.4/100" trend={3.2} trendType="up" 
           icon={<ShieldCheck size={20}/>} color="#8B5CF6" 
           sparklineData={[{val: 88}, {val: 90}, {val: 92}]}
         />
         <KpiCard 
           title="Croissance Mensuelle" value="+18.5%" trend={5.1} trendType="up" 
           icon={<TrendingUp size={20}/>} color="#D946EF" 
           sparklineData={[{val: 12}, {val: 15}, {val: 18}]}
         />
         <KpiCard 
           title="EBITDA Consolidé" value="22.1%" trend={1.4} trendType="up" 
           icon={<DollarSign size={20}/>} color="#6366F1" 
           sparklineData={[{val: 20}, {val: 21}, {val: 22}]}
         />
         <KpiCard 
           title="NPS Client" value="86" trend={2.0} trendType="up" 
           icon={<Star size={20}/>} color="#F59E0B" 
           sparklineData={[{val: 82}, {val: 84}, {val: 86}]}
         />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
         {/* Organizational Health Radar */}
         <div className="glass" style={{ padding: '2.5rem', borderRadius: '2.5rem', background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
               <div style={{ padding: '8px', borderRadius: '10px', background: '#8B5CF615', color: '#8B5CF6' }}>
                  <Globe size={20} />
               </div>
               <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>Santé Organisationnelle</h4>
            </div>
            <div style={{ height: '300px' }}>
               <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={orgHealth}>
                     <PolarGrid stroke="var(--border)" />
                     <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }} />
                     <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                     <Radar
                        name="IPC Global"
                        dataKey="val"
                        stroke="#8B5CF6"
                        fill="#8B5CF6"
                        fillOpacity={0.5}
                        strokeWidth={3}
                     />
                  </RadarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Profitability Benchmarks */}
         <div className="glass" style={{ padding: '2.5rem', borderRadius: '2.5rem', background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ padding: '8px', borderRadius: '10px', background: '#D946EF15', color: '#D946EF' }}>
                     <Zap size={20} />
                  </div>
                  <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>Vitesse de Croissance & Marges</h4>
               </div>
               <button className="btn-secondary" style={{ padding: '0.6rem 1.25rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 900 }}>Audit Trimestriel</button>
            </div>
            <div style={{ height: '300px' }}>
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends}>
                     <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontWeight: 700 }} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontWeight: 700 }} />
                     <Tooltip 
                        contentStyle={{ background: 'var(--bg)', borderRadius: '1rem', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
                        itemStyle={{ fontWeight: 800 }}
                     />
                     <Legend iconType="circle" />
                     <Bar dataKey="ca" name="CA (M FCFA)" fill="#6366F1" radius={[8, 8, 0, 0]} barSize={40} />
                     <Bar dataKey="margin" name="Marge Brute (%)" fill="#D946EF" radius={[8, 8, 0, 0]} barSize={20} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

    </motion.div>
  );
};

export default ExecutiveTab;
