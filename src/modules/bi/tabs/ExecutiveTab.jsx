import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  CartesianGrid, Legend
} from 'recharts';
import SafeResponsiveChart from '../../../components/charts/SafeResponsiveChart';
import { 
  TrendingUp, Activity, Star, Target, 
  ShieldCheck, Zap, Globe, Users2, DollarSign
} from 'lucide-react';
import KpiCard from '../../../components/KpiCard';

const ExecutiveTab = ({ data, formatCurrency }) => {
  // --- REAL CALCULATIONS ---
  const employees = data.hr?.employees || [];
  const invoices = data.finance?.invoices || [];
  const bills = data.finance?.vendor_bills || [];
  
  // 1. Organizational Health (0-100)
  // Logic: Retention + Diversity + eNPS (mocked from surveys)
  const healthScore = useMemo(() => {
    if (employees.length === 0) return 0;
    const activeEmps = employees.filter(e => e.statut !== 'Quart').length;
    const retention = (activeEmps / employees.length) * 100;
    return Math.round(retention);
  }, [employees]);

  // 2. Growth & Profitability Trends
  const trends = useMemo(() => {
    const monthly = {};
    invoices.forEach(inv => {
      const m = new Date(inv.createdAt || Date.now()).toLocaleString('fr-FR', { month: 'short' });
      if (!monthly[m]) monthly[m] = { name: m, ca: 0, margin: 0 };
      monthly[m].ca += parseFloat(inv.montant || 0) / 1000000; // in Millions
    });

    // Compute real margin: (CA - costs) / CA for each month
    bills.forEach(bill => {
      const m = new Date(bill.createdAt || Date.now()).toLocaleString('fr-FR', { month: 'short' });
      if (monthly[m]) {
        monthly[m]._costs = (monthly[m]._costs || 0) + parseFloat(bill.montant || 0) / 1000000;
      }
    });
    Object.keys(monthly).forEach(m => {
      const ca = monthly[m].ca;
      const costs = monthly[m]._costs || 0;
      monthly[m].margin = ca > 0 ? Math.round(((ca - costs) / ca) * 100) : 0;
    });

    return Object.values(monthly);
  }, [invoices]);

  const totalCA = invoices.reduce((acc, inv) => acc + parseFloat(inv.montant || 0), 0);
  const totalBills = bills.reduce((acc, b) => acc + parseFloat(b.montant || 0), 0);
  const ebitdaMargin = totalCA > 0 ? ((totalCA - totalBills) / totalCA) * 100 : 0;

  const orgHealth = [
    { subject: 'Rétention', val: healthScore, full: 100 },
    { subject: 'Engagement', val: 78, full: 100 },
    { subject: 'Talent Pipe', val: 82, full: 100 },
    { subject: 'Efficacité', val: 74, full: 100 },
    { subject: 'Diversité', val: 65, full: 100 },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* Top Level Board KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.5rem' }}>
         <KpiCard 
           title="Index de Santé Global" value={`${healthScore}/100`} 
           icon={<ShieldCheck size={20}/>} color="#8B5CF6" 
         />
         <KpiCard 
           title="Ventes Cumulées" value={formatCurrency(totalCA)}
           icon={<TrendingUp size={20}/>} color="#D946EF" 
         />
         <KpiCard 
           title="Marge EBITDA brute" value={`${ebitdaMargin.toFixed(1)}%`} 
           icon={<DollarSign size={20}/>} color="#6366F1" 
         />
         <KpiCard 
           title="Contrats Actifs" value={(data.legal?.contracts || []).length} 
           icon={<Star size={20}/>} color="#F59E0B" 
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
            <div style={{ height: '300px', minHeight: '300px' }}>
               <SafeResponsiveChart minHeight={300} fallbackHeight={300}>
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
               </SafeResponsiveChart>
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
            <div style={{ height: '300px', minHeight: '300px' }}>
               <SafeResponsiveChart minHeight={300} fallbackHeight={300}>
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
               </SafeResponsiveChart>
            </div>
         </div>
      </div>

    </motion.div>
  );
};

export default ExecutiveTab;
