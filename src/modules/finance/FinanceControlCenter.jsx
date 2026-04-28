import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Landmark, BarChart3, Calculator, 
  FileText, PiggyBank, Wallet, 
  ShieldCheck, Download, Sparkles, TrendingUp
} from 'lucide-react';
import { useStore } from '../../store';
import RecordModal from '../../components/RecordModal';
import AnalyticsTab from './tabs/AnalyticsTab';
import AccountingTab from './tabs/AccountingTab';
import InvoicingTab from './tabs/InvoicingTab';
import BudgetTab from './tabs/BudgetTab';
import BankReconTab from './tabs/BankReconTab';
import { RBACGuard, useRBAC, PERMISSIONS } from '../../utils/RBACGuard';
import { IPCReportGenerator } from '../../utils/PDFExporter';
import AnimatedCounter from '../../components/Dashboard/AnimatedCounter';
import '../../components/GlobalDashboard.css';

const ALL_TABS = [
  { id: 'analytics',  label: 'Analyse Stratégique',    icon: <BarChart3 size={16} /> },
  { id: 'accounting', label: 'Comptabilité',            icon: <Calculator size={16} />, permission: 'MANAGE_FINANCE' },
  { id: 'invoicing',  label: 'Facturation',             icon: <FileText size={16} /> },
  { id: 'budget',     label: 'Budgets',                 icon: <PiggyBank size={16} />, permission: 'MANAGE_FINANCE' },
  { id: 'banque',     label: 'Trésorerie & Banque',     icon: <Wallet size={16} />,    permission: 'MANAGE_FINANCE' },
];

const FinanceControlCenter = ({ onOpenDetail, appId }) => {
  const { data, addRecord, formatCurrency, addAccountingEntry, userRole, shellView } = useStore();
  const { hasAccess } = useRBAC();
  const [mainTab, setMainTab] = useState(appId === 'budget' ? 'budget' : 'analytics');
  const [isExporting, setIsExporting] = useState(false);

  const isBudgetContext = appId === 'budget';
  const tabs = ALL_TABS.filter(t => !t.permission || hasAccess(PERMISSIONS[t.permission]));

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await IPCReportGenerator.generateFinancialStatement({
        title: "IPC Financial Intelligence Statement",
        summary: "Analyse institutionnelle consolidée des flux de trésorerie.",
        metrics: [{ label: 'Période', value: 'Q2 2024' }, { label: 'Liquidité', value: 'Optimal' }],
        rows: [
          { module: 'Trésorerie', description: 'Flux de trésorerie Core', status: 'Stable' },
          { module: 'Facturation', description: 'Performance du recouvrement', status: 'Optimal' },
          { module: 'Budget', description: 'Efficacité de l\'allocation', status: '82%' }
        ]
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="luxury-dashboard-container" style={{ padding: '3rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── HEADER ── */}
      <div className="luxury-header" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div className="luxury-subtitle">
            {isBudgetContext ? 'Nexus Budgetary Planning' : 'Nexus Financial Intelligence'}
          </div>
          <h1 className="luxury-title">
            {isBudgetContext ? <>Budget <strong>Engine</strong></> : <>Financial <strong>Core</strong></>}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          {/* Santé Badge */}
          <div className="luxury-widget" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 2rem' }}>
            <ShieldCheck size={24} color="#10B981" />
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>Indice Santé</div>
              <div style={{ fontWeight: 800, fontSize: '1.5rem', color: '#111827' }}>AAA</div>
            </div>
          </div>

          {/* Export */}
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="luxury-widget"
            style={{ width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.8)' }}
          >
            <Download size={22} color="#111827" />
          </button>

          {/* Accès Ledger CTA */}
          <button 
            onClick={() => setMainTab('accounting')}
            className="luxury-widget"
            style={{ padding: '1rem 2rem', background: '#111827', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem', border: 'none', cursor: 'pointer', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)', borderRadius: '1.5rem' }}
          >
            <Sparkles size={20} /> <span style={{ fontWeight: 600, letterSpacing: '0.05em' }}>Accès Ledger</span>
          </button>
        </div>
      </div>

      {/* ── FROSTED-GLASS TABS ── */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.5)', padding: '0.5rem', borderRadius: '1.5rem', backdropFilter: 'blur(10px)', marginBottom: '3rem', flexWrap: 'wrap', gap: '0.25rem', width: 'fit-content' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setMainTab(t.id)}
            style={{
              padding: '0.8rem 1.75rem', borderRadius: '1rem', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s',
              background: mainTab === t.id ? 'white' : 'transparent',
              color: mainTab === t.id ? '#111827' : '#64748B',
              boxShadow: mainTab === t.id ? '0 10px 20px -10px rgba(0,0,0,0.1)' : 'none',
              display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap'
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div style={{ flex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={mainTab}
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -20 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            {mainTab === 'analytics'  && <AnalyticsTab data={data} formatCurrency={formatCurrency} />}
            {mainTab === 'accounting' && <AccountingTab onOpenDetail={onOpenDetail} addAccountingEntry={addAccountingEntry} />}
            {mainTab === 'invoicing'  && <InvoicingTab onOpenDetail={onOpenDetail} formatCurrency={formatCurrency} />}
            {mainTab === 'budget'     && <BudgetTab data={data} formatCurrency={formatCurrency} onOpenDetail={onOpenDetail} />}
            {mainTab === 'banque'     && <BankReconTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default React.memo(FinanceControlCenter);
