import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, CreditCard, PieChart, Plus, Search, Download, 
  TrendingUp, TrendingDown, DollarSign, BarChart3, 
  Clock, CheckCircle2, Target, Landmark, Filter
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  CartesianGrid, PieChart as RechartsPie, Pie, Cell
} from 'recharts';
import { useBusiness } from '../BusinessContext';
import KpiCard from '../components/KpiCard';

const fadeIn = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };

const Chip = ({ label, color = '#64748B' }) => (
  <span style={{ padding: '2px 9px', borderRadius: '999px', background: `${color}10`, border: `1px solid ${color}30`, color, fontSize: '0.68rem', fontWeight: 700 }}>{label}</span>
);

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', background: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: '1rem', border: '1px solid var(--border)', gap: '0.2rem', width: 'fit-content', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)} style={{ padding: '0.5rem 1.1rem', borderRadius: '0.8rem', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', background: active === t.id ? 'var(--bg)' : 'transparent', color: active === t.id ? 'var(--accent)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}>
        {t.icon} {t.label}
      </button>
    ))}
  </div>
);

const SectionHeader = ({ icon, title, subtitle, actions }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', marginBottom: '0.25rem' }}>
        {icon} <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>{subtitle}</span>
      </div>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{title}</h2>
    </div>
    <div style={{ display: 'flex', gap: '0.75rem' }}>{actions}</div>
  </div>
);

const Finance = ({ onOpenDetail }) => {
  const { data, updateRecord, formatCurrency } = useBusiness();
  const [tab, setTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  const { finance = {} } = data;
  const { invoices = [], lines = [] } = finance;

  const kpis = useMemo(() => {
    const totalVentes = invoices.reduce((s, i) => s + i.montant, 0);
    const paidInvoices = invoices.filter(i => i.statut === 'Payé').reduce((s, i) => s + i.montant, 0);
    const dueInvoices = totalVentes - paidInvoices;
    // Simple treasury via cash/bank accounts (Class 5)
    const treasury = lines.filter(l => l.accountId.startsWith('5')).reduce((s, l) => s + (l.debit - l.credit), 0);
    return { treasury, dueInvoices, paidInvoices, collectionRate: (paidInvoices / totalVentes * 100) || 0 };
  }, [invoices, lines]);

  return (
    <div style={{ padding: '2.5rem', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-1px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <DollarSign size={32} color="var(--accent)"/> Finance Opérationnelle
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 500 }}>Gestion des flux, facturation et trésorerie</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <button className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}><Plus size={18}/> Nouvelle Facture</button>
        </div>
      </div>

      <TabBar tabs={[
        { id: 'dashboard', label: 'Cash-Flow', icon: <TrendingUp size={16}/> },
        { id: 'invoices', label: 'Factures Clients', icon: <FileText size={16}/> },
        { id: 'vendors', label: 'Factures Fournisseurs', icon: <Landmark size={16}/> },
        { id: 'taxes', label: 'Taxes & TVA', icon: <PieChart size={16}/> },
      ]} active={tab} onChange={setTab} />

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
          {tab === 'dashboard' && (
            <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                <KpiCard title="Trésorerie" value={formatCurrency(kpis.treasury)} icon={<Landmark size={20}/>} color="#6366F1" trend={12} trendType="up" sparklineData={[30, 45, 35, 50, 40, 60]} />
                <KpiCard title="Encaissements" value={formatCurrency(kpis.paidInvoices)} icon={<TrendingUp size={20}/>} color="#10B981" trend={5} trendType="up" sparklineData={[20, 30, 25, 40, 35, 45]} />
                <KpiCard title="En Attente" value={formatCurrency(kpis.dueInvoices)} icon={<Clock size={20}/>} color="#F59E0B" trend={-2} trendType="down" sparklineData={[50, 40, 45, 30, 35, 25]} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
                <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem' }}>Radar Flux Bancaires (Cash Burn)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={[
                      { name: 'Jan', in: 4000, out: 2400 },
                      { name: 'Feb', in: 3000, out: 1398 },
                      { name: 'Mar', in: 2000, out: 9800 },
                      { name: 'Apr', in: 2780, out: 3908 },
                      { name: 'May', in: 1890, out: 4800 },
                      { name: 'Jun', in: 2390, out: 3800 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="in" stroke="#10B981" fillOpacity={0.1} fill="#10B981" />
                      <Area type="monotone" dataKey="out" stroke="#EF4444" fillOpacity={0.1} fill="#EF4444" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Taux de Recouvrement</h3>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                     <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--accent)' }}>{kpis.collectionRate.toFixed(1)}%</div>
                     <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Moyenne sur les 30 derniers jours</p>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                     <div style={{ width: `${kpis.collectionRate}%`, height: '100%', background: 'var(--accent)' }} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {tab === 'invoices' && (
            <motion.div variants={fadeIn} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <SectionHeader icon={<FileText size={16}/>} title="Facturation Client" subtitle="Suivi des créances" actions={[
                 <button className="btn glass" style={{ border: '1px solid var(--border)' }}><Download size={14}/> Export CSV</button>
              ]} />
              <div className="glass" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead style={{ background: 'var(--bg-subtle)' }}>
                    <tr style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 800 }}>
                      <th style={{ padding: '1rem' }}>Numéro</th>
                      <th style={{ padding: '1rem' }}>Client</th>
                      <th style={{ padding: '1rem' }}>Montant TTC</th>
                      <th style={{ padding: '1rem' }}>Statut</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1rem', fontWeight: 800 }}>{inv.num}</td>
                        <td style={{ padding: '1rem' }}>{inv.client}</td>
                        <td style={{ padding: '1rem', fontWeight: 700 }}>{formatCurrency(inv.montant)}</td>
                        <td style={{ padding: '1rem' }}><Chip label={inv.statut} color={inv.statut === 'Payé' ? '#10B981' : '#F59E0B'} /></td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <button onClick={() => updateRecord('finance', 'invoices', inv.id, { statut: 'Payé' })} className="btn" disabled={inv.statut === 'Payé'} style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem', border: '1px solid var(--accent)', color: inv.statut === 'Payé' ? 'var(--text-muted)' : 'var(--accent)', cursor: inv.statut === 'Payé' ? 'default' : 'pointer' }}>
                            {inv.statut === 'Payé' ? 'Réglé' : 'Marquer Payé'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {(tab === 'vendors' || tab === 'taxes') && (
             <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
                <BarChart3 size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <h3>Extension de module</h3>
                <p>La gestion avancée des {tab === 'vendors' ? 'factures fournisseurs' : 'taxes'} arrive bientôt.</p>
             </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Finance;
