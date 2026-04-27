import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, DollarSign, Landmark, 
  BarChart3, PieChart, ArrowUpRight, ArrowDownRight, 
  Activity, Scale, Wallet, Target, Clock, ShieldCheck 
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, ComposedChart, Line, Bar,
  Cell, PieChart as RechartsPie, Pie
} from 'recharts';
import KpiCard from '../../../components/KpiCard';
import SafeResponsiveChart from '../../../components/charts/SafeResponsiveChart';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const AnalyticsTab = ({ data, formatCurrency }) => {
  const finance = data?.finance || {};
  const ledgerLines = useMemo(() => finance.lines || [], [finance.lines]);
  
  const financialKPIs = useMemo(() => {
    let rev = 0;
    let exp = 0;
    let cash = 0;

    ledgerLines.forEach(line => {
      const code = String(line.accountId);
      const debit = Number(line.debit || 0);
      const credit = Number(line.credit || 0);

      if (code.startsWith('7')) rev += credit;
      if (code.startsWith('6')) exp += debit;
      if (code.startsWith('5')) cash += (debit - credit);
    });

    return {
      netResult: rev - exp,
      revenue: rev,
      expenses: exp,
      cashOnHand: cash,
      dso: 0, // Remains estimated or could be calculated if we have sales/payments link
    };
  }, [ledgerLines]);

  const cashFlowData = useMemo(() => {
    // Group entries by month
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentYear = new Date().getFullYear();
    const grouped = months.slice(0, new Date().getMonth() + 1).map(m => ({ name: m, in: 0, out: 0 }));

    ledgerLines.forEach(line => {
      const date = new Date(line.date);
      if (date.getFullYear() === currentYear) {
        const monthIdx = date.getMonth();
        if (monthIdx < grouped.length) {
          const debit = Number(line.debit || 0);
          const credit = Number(line.credit || 0);
          if (debit > 0) grouped[monthIdx].in += debit;
          if (credit > 0) grouped[monthIdx].out += credit;
        }
      }
    });
    return grouped.length > 0 ? grouped : [{ name: 'Jan', in: 0, out: 0 }];
  }, [ledgerLines]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Financial Excellence KPIs */}
      <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '1.5rem' }}>
        <KpiCard title="Résultat Net" value={formatCurrency(financialKPIs.netResult, true)} trend={0} trendType="up" icon={<Scale size={22} />} color="#0F172A" sparklineData={[]} />
        <KpiCard title="Trésorerie Totale" value={formatCurrency(financialKPIs.cashOnHand, true)} trend={0} trendType="up" icon={<Landmark size={22} />} color="#6366F1" sparklineData={[]} />
        <KpiCard title="Chiffre d'Affaires" value={formatCurrency(financialKPIs.revenue, true)} trend={0} trendType="up" icon={<TrendingUp size={22} />} color="#10B981" sparklineData={[]} />
        <KpiCard title="DSO (Paiement Client)" value={`${financialKPIs.dso} Jrs`} trend={0} trendType="down" icon={<Clock size={22} />} color="#F59E0B" sparklineData={[]} />
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '1.5rem' }}>
        {/* Cash Flow Performance Chart */}
        <motion.div variants={item} className="glass" style={{ padding: '2rem', borderRadius: '2rem', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h4 style={{ fontWeight: 900, fontSize: '1.1rem', margin: 0 }}>Analyse des Flux (Cash-In vs Cash-Out)</h4>
              <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Suivi mensuel de la liquidité opérationnelle.</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', fontWeight: 800 }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366F1' }} /> Encaissements</div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F43F5E' }} /> Décaissements</div>
            </div>
          </div>
          <SafeResponsiveChart 
            minHeight={320} 
            fallbackHeight={320}
            isDataEmpty={cashFlowData.every(d => d.in === 0 && d.out === 0)}
          >
            <ComposedChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }} />
              <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="in" name="Encaissement" stroke="#6366F1" strokeWidth={4} fillOpacity={0.1} fill="#6366F1" />
              <Line type="monotone" dataKey="out" name="Décaissement" stroke="#F43F5E" strokeWidth={3} dot={{ r: 4, fill: '#F43F5E', strokeWidth: 2, stroke: 'white' }} />
            </ComposedChart>
          </SafeResponsiveChart>
        </motion.div>

        {/* Financial Health Radar / Insights */}
        <motion.div variants={item} className="glass" style={{ padding: '2.5rem', borderRadius: '2rem', border: '1px solid var(--border)', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#6366F1', fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            <ShieldCheck size={16} /> Santé Financière IPC
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
             <div style={{ padding: '1.5rem', borderRadius: '1.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                   <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>Marge Autonome</div>
                   <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10B981' }}>0%</div>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                   <motion.div initial={{ width: 0 }} animate={{ width: '0%' }} transition={{ duration: 1 }} style={{ height: '100%', background: '#10B981' }} />
                </div>
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h5 style={{ margin: 0, fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', opacity: 0.6 }}>Top Insights Financiers</h5>
                
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
                   <div style={{ padding: '8px', borderRadius: '8px', background: '#10B98120', color: '#10B981' }}><TrendingUp size={16} /></div>
                   <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>En attente de données</div>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.7rem', opacity: 0.6 }}>Les analyses IA seront générées avec plus d'historique.</p>
                   </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'start' }}>
                   <div style={{ padding: '8px', borderRadius: '8px', background: '#F59E0B20', color: '#F59E0B' }}><Target size={16} /></div>
                   <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>Statut Budgétaire</div>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.7rem', opacity: 0.6 }}>Initialisation des budgets en cours.</p>
                   </div>
                </div>
             </div>
          </div>

          <button className="btn-primary" style={{ width: '100%', marginTop: 'auto', padding: '1rem', borderRadius: '1.25rem', fontWeight: 900, background: 'white', color: '#0F172A', border: 'none' }}>
             Générer le Rapport Mensuel
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AnalyticsTab;
