import React from 'react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, ResponsiveContainer, ComposedChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { 
  DollarSign, TrendingUp, CreditCard, Landmark, 
  PieChart as PieIcon, Activity, ArrowUpRight, ArrowDownRight,
  Calculator, History
} from 'lucide-react';
import KpiCard from '../../../components/KpiCard';

const FinancialTab = ({ data, formatCurrency }) => {
  const plData = [];
  const cashFlow = [];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* Financial KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
         <KpiCard 
           title="Marge EBITDA" value="0%" 
           icon={<TrendingUp size={20}/>} color="#6366F1" 
         />
         <KpiCard 
           title="Trésorerie Nette" value={formatCurrency(0)} 
           icon={<Landmark size={20}/>} color="#10B981" 
         />
         <KpiCard 
           title="DSO (Délai Client)" value="0 Jrs" 
           icon={<History size={20}/>} color="#F59E0B" 
         />
         <KpiCard 
           title="Burn Rate (OpEx)" value="0/Mois" 
           icon={<Activity size={20}/>} color="#D946EF" 
         />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
         {/* P&L Performance */}
         <div className="glass" style={{ padding: '2.5rem', borderRadius: '2.5rem', background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ padding: '8px', borderRadius: '10px', background: '#6366F115', color: '#6366F1' }}>
                     <Calculator size={20} />
                  </div>
                  <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>Analyse P&L Consolidée (M FCFA)</h4>
               </div>
               <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                     <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366F1' }} />
                     <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Produits</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                     <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }} />
                     <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Charges</span>
                  </div>
               </div>
            </div>
            <div style={{ height: '320px' }}>
               <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={plData}>
                     <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                     <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontWeight: 700 }} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontWeight: 700 }} />
                     <Tooltip contentStyle={{ background: 'var(--bg)', borderRadius: '1rem', border: '1px solid var(--border)' }} />
                     <Bar dataKey="ca" name="CA" fill="#6366F120" radius={[10, 10, 0, 0]} barSize={40} />
                     <Line dataKey="exp" name="Charges" stroke="#EF4444" strokeWidth={3} dot={{ r: 4, fill: '#EF4444' }} />
                     <Area type="monotone" dataKey="profit" name="Marge Net" fill="#10B981" fillOpacity={0.1} stroke="#10B981" strokeWidth={2} />
                  </ComposedChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Cash Flow Distribution */}
         <div className="glass" style={{ padding: '2.5rem', borderRadius: '2.5rem', background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 2rem 0', fontWeight: 900, fontSize: '1.1rem' }}>Structure de Trésorerie</h4>
            <div style={{ height: '220px' }}>
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={cashFlow}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="val"
                     >
                        {cashFlow.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                     </Pie>
                     <Tooltip />
                  </PieChart>
               </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
               {cashFlow.map((item, i) => (
                 <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: '1.25rem', background: 'var(--bg-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                       <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                       <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{item.name}</span>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 900 }}>{formatCurrency(item.val, true)}</span>
                 </div>
               ))}
            </div>
         </div>
      </div>

    </motion.div>
  );
};

export default FinancialTab;
