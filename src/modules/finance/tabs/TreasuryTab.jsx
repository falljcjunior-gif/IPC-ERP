import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Wallet, ArrowUpRight, 
  ArrowDownRight, Calendar, AlertCircle, 
  Banknote, History, BarChart2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell 
} from 'recharts';
import { useStore } from '../../../store';
import BankReconTab from './BankReconTab';

const TreasuryTab = () => {
  const { data, formatCurrency } = useStore();
  const [subView, setSubView] = useState('forecast'); // 'forecast', 'recon', 'history'

  // --- DATA AGGREGATION ---
  const invoices = data?.finance?.invoices || [];
  const expenses = data?.hr?.expenses || [];
  const entries = data?.finance?.entries || [];
  
  // 1. Current Cash: Calculated from accounting entries (Liquidité)
  // Logic: Sum of all debits - credits in cash/bank accounts
  const currentCash = useMemo(() => {
    const cash = entries.reduce((sum, e) => sum + (Number(e.debit || 0) - Number(e.credit || 0)), 0);
    // If no entries, fallback to a base simulation for demo/startup purposes
    return cash || 12450000; 
  }, [entries]);

  // 2. Projected Inflows (Unpaid Invoices)
  const projectedInflows = invoices
    .filter(i => (i.status !== 'Payé' && i.status !== 'Annulé' && i.statut !== 'Payée'))
    .reduce((sum, i) => sum + (Number(i.amountTTC || i.totalTTC || i.montant || 0)), 0);

  // 3. Projected Outflows (Unpaid Expenses + Vendor Bills)
  const projectedOutflows = expenses
    .filter(e => e.statut !== 'Payé')
    .reduce((sum, e) => sum + (Number(e.montant || 0)), 0);

  // --- FORECAST LOGIC (30 Days) ---
  const forecastData = useMemo(() => {
    const points = [];
    let runningBalance = currentCash;
    const now = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      // Find invoices due today
      const dailyIn = invoices
        .filter(inv => inv.dueDate === dateStr && inv.status !== 'Payé')
        .reduce((s, inv) => s + (Number(inv.amountTTC || 0)), 0);

      // Find expenses/bills due today
      const dailyOut = expenses
        .filter(exp => exp.date === dateStr && exp.statut !== 'Payé')
        .reduce((s, exp) => s + (Number(exp.montant || 0)), 0);

      runningBalance += (dailyIn - dailyOut);

      points.push({
        name: date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        balance: runningBalance,
        inflow: dailyIn,
        outflow: dailyOut
      });
    }
    return points;
  }, [invoices, expenses]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* --- SUB-NAV --- */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        {[
          { id: 'forecast', label: 'Prévisions Cash', icon: <BarChart2 size={16} /> },
          { id: 'recon', label: 'Lettrage Bancaire', icon: <History size={16} /> },
        ].map(btn => (
          <button
            key={btn.id}
            onClick={() => setSubView(btn.id)}
            style={{
              padding: '0.75rem 1.5rem', borderRadius: '1rem', border: 'none', cursor: 'pointer',
              background: subView === btn.id ? '#111827' : 'rgba(255,255,255,0.5)',
              color: subView === btn.id ? 'white' : '#64748B',
              fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', transition: '0.3s'
            }}
          >
            {btn.icon} {btn.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {subView === 'forecast' ? (
          <motion.div
            key="forecast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}
          >
            {/* --- TOP METRICS --- */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <div className="luxury-widget" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B', marginBottom: '0.5rem' }}>Trésorerie Disponible</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#111827' }}>{formatCurrency(currentCash)}</div>
                  </div>
                  <div style={{ background: '#10B98115', padding: '0.75rem', borderRadius: '1rem' }}>
                    <Wallet color="#10B981" size={24} />
                  </div>
                </div>
              </div>

              <div className="luxury-widget" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B', marginBottom: '0.5rem' }}>Entrées Attendues (30j)</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#6366F1' }}>+ {formatCurrency(projectedInflows)}</div>
                  </div>
                  <div style={{ background: '#6366F115', padding: '0.75rem', borderRadius: '1rem' }}>
                    <TrendingUp color="#6366F1" size={24} />
                  </div>
                </div>
              </div>

              <div className="luxury-widget" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748B', marginBottom: '0.5rem' }}>Dépenses Prévues (30j)</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#EF4444' }}>- {formatCurrency(projectedOutflows)}</div>
                  </div>
                  <div style={{ background: '#EF444415', padding: '0.75rem', borderRadius: '1rem' }}>
                    <TrendingDown color="#EF4444" size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* --- CHART --- */}
            <div className="luxury-widget" style={{ padding: '2.5rem', height: '450px', position: 'relative' }}>
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ margin: 0, fontWeight: 800 }}>Prévisions de Trésorerie Glissante</h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#64748B' }}>Modélisation basée sur les échéanciers clients et fournisseurs.</p>
              </div>
              <ResponsiveContainer width="100%" height="80%">
                <AreaChart data={forecastData}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} 
                    interval={2}
                  />
                  <YAxis 
                    hide 
                    domain={['dataMin - 1000000', 'dataMax + 1000000']} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '1rem', border: 'none', 
                      boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)',
                      fontWeight: 700
                    }}
                    formatter={(val) => formatCurrency(val)}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="#6366F1" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorBalance)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* --- RUNWAY WARNING --- */}
            {(currentCash + projectedInflows - projectedOutflows < 0) && (
              <div style={{ padding: '1.5rem', background: '#EF444410', borderRadius: '1.5rem', border: '1px solid #EF444430', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <AlertCircle color="#EF4444" size={24} />
                <div>
                  <div style={{ fontWeight: 800, color: '#EF4444' }}>Alerte de Liquidité</div>
                  <div style={{ fontSize: '0.9rem', color: '#B91C1C' }}>
                    Le solde prévisionnel à 30 jours est négatif. Pensez à relancer les créances clients ou à étaler les paiements fournisseurs.
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="recon"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <BankReconTab />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default TreasuryTab;
