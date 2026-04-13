import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, CreditCard, PieChart, Plus, Search, Download, 
  TrendingUp, TrendingDown, DollarSign, BarChart3, 
  Clock, CheckCircle2, Target, Landmark, Filter, BarChart2, Layers
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  CartesianGrid, PieChart as RechartsPie, Pie, Cell
} from 'recharts';
import { useBusiness } from '../BusinessContext';
import EnterpriseView from '../components/EnterpriseView';
import KpiCard from '../components/KpiCard';
import { financeSchema } from '../schemas/finance.schema.js';

/* ─── Helpers ─── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } }
};

/* ════════════════════════════════════
   FINANCE MODULE — Full Enterprise
   Now powered by IPC Platform Engine
   ════════════════════════════════════ */
const Finance = ({ onOpenDetail }) => {
  const { data, formatCurrency } = useBusiness();
  const [view, setView] = useState('dashboard'); // 'dashboard', 'invoices', 'vendor_bills'

  /* ─── Dashboard Renderer ─── */
  const renderDashboard = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <KpiCard title="Trésorerie" value={formatCurrency(154200000)} icon={<Landmark size={20}/>} color="#6366F1" trend={12} trendType="up" sparklineData={[30, 45, 35, 50, 40, 60]} />
        <KpiCard title="Encaissements" value={formatCurrency(24500000)} icon={<TrendingUp size={20}/>} color="#10B981" trend={5} trendType="up" sparklineData={[20, 30, 25, 40, 35, 45]} />
        <KpiCard title="Créances Clients" value={formatCurrency(12800000)} icon={<Clock size={20}/>} color="#F59E0B" trend={-2} trendType="down" sparklineData={[50, 40, 45, 30, 35, 25]} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1.5rem' }}>Flux Bancaires (Cash Burn)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={[{n:'Jan',i:40,o:24},{n:'Fév',i:30,o:13},{n:'Mar',i:20,o:98},{n:'Avr',i:27,o:39}]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="n" axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip />
              <Area type="monotone" dataKey="i" stroke="#10B981" fillOpacity={0.1} fill="#10B981" />
              <Area type="monotone" dataKey="o" stroke="#EF4444" fillOpacity={0.1} fill="#EF4444" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', alignItems: 'center' }}>
           <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Collection Rate</h3>
           <div style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--accent)' }}>94%</div>
           <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Efficacité du recouvrement</p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
       {/* Module Header Toolbar */}
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-subtle)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)' }}>
             {[
               { id: 'dashboard', label: 'Cash-Flow', icon: <BarChart2 size={16} /> },
               { id: 'invoices', label: 'Facturation Client', icon: <FileText size={16} /> },
               { id: 'vendor_bills', label: 'Factures Fournisseur', icon: <Landmark size={16} /> }
             ].map(t => (
               <button
                 key={t.id}
                 onClick={() => setView(t.id)}
                 style={{
                   padding: '6px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                   background: view === t.id ? 'var(--bg)' : 'transparent',
                   color: view === t.id ? 'var(--accent)' : 'var(--text-muted)',
                   fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px',
                   boxShadow: view === t.id ? 'var(--shadow-sm)' : 'none'
                 }}
               >
                 {t.icon} {t.label}
               </button>
             ))}
          </div>
       </div>

       <AnimatePresence mode="wait">
          {view === 'dashboard' ? (
             <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {renderDashboard()}
             </motion.div>
          ) : (
             <motion.div key="records" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <EnterpriseView 
                  moduleId="finance" 
                  modelId={view}
                  schema={financeSchema}
                  onOpenDetail={onOpenDetail}
                />
             </motion.div>
          )}
       </AnimatePresence>
    </div>
  );
};

export default Finance;
