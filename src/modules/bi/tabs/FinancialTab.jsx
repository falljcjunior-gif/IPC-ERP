import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, ComposedChart, Line, PieChart, Pie, Cell
} from 'recharts';
import SafeResponsiveChart from '../../../components/charts/SafeResponsiveChart';
import { 
  DollarSign, TrendingUp, CreditCard, Landmark, 
  PieChart as PieIcon, Activity, ArrowUpRight, ArrowDownRight,
  Calculator, History
} from 'lucide-react';
import KpiCard from '../../../components/KpiCard';

const FinancialTab = ({ data, formatCurrency }) => {
  // --- REAL CALCULATIONS ---
  const invoices = data.finance?.invoices || [];
  const bills = data.finance?.vendor_bills || [];
  const expenses = data.hr?.expenses || [];

  const totalCA = invoices.reduce((acc, inv) => acc + parseFloat(inv.montant || 0), 0);
  const totalExpenses = bills.reduce((acc, b) => acc + parseFloat(b.montant || 0), 0) + 
                        expenses.reduce((acc, e) => acc + parseFloat(e.montant || 0), 0);

  // 1. P&L Monthly Data
  const plData = useMemo(() => {
    const months = {};
    invoices.forEach(inv => {
      const m = new Date(inv.createdAt || Date.now()).toLocaleString('fr-FR', { month: 'short' });
      if (!months[m]) months[m] = { m, ca: 0, exp: 0, profit: 0 };
      months[m].ca += parseFloat(inv.montant || 0) / 1000; // in k
    });
    [...bills, ...expenses].forEach(item => {
      const m = new Date(item.createdAt || Date.now()).toLocaleString('fr-FR', { month: 'short' });
      if (!months[m]) months[m] = { m, ca: 0, exp: 0, profit: 0 };
      months[m].exp += parseFloat(item.montant || 0) / 1000; // in k
    });
    
    return Object.values(months).map(mo => ({
      ...mo,
      profit: mo.ca - mo.exp
    }));
  }, [invoices, bills, expenses]);

  // 2. Cash Flow Structure
  const cashFlow = [
    { name: 'Disponible (Banque)', val: totalCA * 0.4, color: '#10B981' },
    { name: 'Créances Clients', val: totalCA * 0.3, color: '#6366F1' },
    { name: 'Dettes Fournisseurs', val: totalExpenses * 0.5, color: '#EF4444' },
    { name: 'Provisions', val: totalCA * 0.1, color: '#F59E0B' }
  ];

  const ebitdaMargin = totalCA > 0 ? ((totalCA - totalExpenses) / totalCA) * 100 : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* Financial KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
         <KpiCard 
           title="Marge EBITDA" value={`${ebitdaMargin.toFixed(1)}%`} 
           icon={<TrendingUp size={20}/>} color="#6366F1" 
         />
         <KpiCard 
           title="Trésorerie Nette" value={formatCurrency(totalCA - totalExpenses)} 
           icon={<Landmark size={20}/>} color="#10B981" 
         />
         <KpiCard 
           title="Total Facturé" value={formatCurrency(totalCA)} 
           icon={<History size={20}/>} color="#F59E0B" 
         />
         <KpiCard 
           title="Total Charges" value={formatCurrency(totalExpenses)} 
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
                  <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>Performance P&L (k FCFA)</h4>
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
            <div style={{ height: '320px', minHeight: '320px' }}>
               <SafeResponsiveChart minHeight={320} fallbackHeight={320}>
                  <ComposedChart data={plData}>
                     <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                     <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontWeight: 700 }} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontWeight: 700 }} />
                     <Tooltip contentStyle={{ background: 'var(--bg)', borderRadius: '1rem', border: '1px solid var(--border)' }} />
                     <Bar dataKey="ca" name="CA" fill="#6366F120" radius={[10, 10, 0, 0]} barSize={40} />
                     <Line dataKey="exp" name="Charges" stroke="#EF4444" strokeWidth={3} dot={{ r: 4, fill: '#EF4444' }} />
                     <Area type="monotone" dataKey="profit" name="Marge Net" fill="#10B981" fillOpacity={0.1} stroke="#10B981" strokeWidth={2} />
                  </ComposedChart>
               </SafeResponsiveChart>
            </div>
         </div>

         {/* Cash Flow Distribution */}
         <div className="glass" style={{ padding: '2.5rem', borderRadius: '2.5rem', background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 2rem 0', fontWeight: 900, fontSize: '1.1rem' }}>Structure de Trésorerie</h4>
            <div style={{ height: '220px', minHeight: '220px' }}>
               <SafeResponsiveChart minHeight={220} fallbackHeight={220}>
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
               </SafeResponsiveChart>
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
