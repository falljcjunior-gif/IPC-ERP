import React from 'react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, ResponsiveContainer, ComposedChart, Line
} from 'recharts';
import { 
  Factory, Truck, Package, Activity, 
  AlertTriangle, CheckCircle2, Zap
} from 'lucide-react';
import KpiCard from '../../../components/KpiCard';

const IndustrialTab = ({ data }) => {
  const perfData = [];
  const inventoryHealth = [];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* Specialized Industrial KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
         <KpiCard 
           title="OTIF Global" value="0%" 
           icon={<Truck size={20}/>} color="#10B981" 
         />
         <KpiCard 
           title="Efficience Industrielle" value="0%" 
           icon={<Activity size={20}/>} color="#6366F1" 
         />
         <KpiCard 
           title="Indice de Rebuts" value="0%" 
           icon={<AlertTriangle size={20}/>} color="#F59E0B" 
         />
         <KpiCard 
           title="Rotation Stocks" value="0 Jrs" 
           icon={<Package size={20}/>} color="#8B5CF6" 
         />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
         {/* Production Pulse Line */}
         <div className="glass" style={{ padding: '2.5rem', borderRadius: '2.5rem', background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ padding: '8px', borderRadius: '10px', background: '#10B98115', color: '#10B981' }}>
                     <Factory size={20} />
                  </div>
                  <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>Flux Opérationnel & Qualité (Performance OTIF)</h4>
               </div>
               <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10B981', background: '#10B98115', padding: '4px 10px', borderRadius: '20px' }}>Temps Réel</span>
               </div>
            </div>
            <div style={{ height: '320px' }}>
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={perfData}>
                     <defs>
                        <linearGradient id="colorOtif" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontWeight: 700 }} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontWeight: 700 }} />
                     <Tooltip contentStyle={{ background: 'var(--bg)', borderRadius: '1rem', border: '1px solid var(--border)' }} />
                     <Area type="monotone" dataKey="otif" stroke="#10B981" strokeWidth={4} fillOpacity={1} fill="url(#colorOtif)" />
                     <Area type="monotone" dataKey="efficiency" stroke="#6366F1" strokeWidth={2} fillOpacity={0} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Inventory Health Bar */}
         <div className="glass" style={{ padding: '2.5rem', borderRadius: '2.5rem', background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 2rem 0', fontWeight: 900, fontSize: '1.1rem' }}>Santé de l'Inventaire</h4>
            <div style={{ height: '320px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
               {inventoryHealth.map((item, i) => (
                 <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 800 }}>
                       <span>{item.category}</span>
                       <span style={{ color: '#8B5CF6' }}>{item.rotation} Jrs Rot.</span>
                    </div>
                    <div style={{ height: '12px', background: 'var(--bg-subtle)', borderRadius: '6px', overflow: 'hidden' }}>
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${(item.stock / 1000000) * 100}%` }}
                         transition={{ duration: 1, delay: i * 0.2 }}
                         style={{ height: '100%', background: i === 0 ? '#10B981' : i === 1 ? '#6366F1' : '#8B5CF6' }} 
                       />
                    </div>
                 </div>
               ))}
               <div style={{ marginTop: 'auto', padding: '1.25rem', borderRadius: '1.5rem', background: '#F59E0B15', border: '1px solid #F59E0B30', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <AlertTriangle size={24} color="#F59E0B" />
                  <div>
                     <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#F59E0B' }}>Alerte Rupture Immimente</div>
                     <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#F59E0B' }}>Composant C-702 : Moins de 48h de production.</div>
                  </div>
               </div>
            </div>
         </div>
      </div>

    </motion.div>
  );
};

export default IndustrialTab;
