import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Landmark, BarChart3, Calculator, 
  FileText, PiggyBank, ShieldCheck, Wallet, 
  Settings, Download, Share2, TrendingUp, History, Sparkles
} from 'lucide-react';
import { useStore } from '../../store';
import TabBar from '../marketing/components/TabBar';
import RecordModal from '../../components/RecordModal';
import AnalyticsTab from './tabs/AnalyticsTab';
import AccountingTab from './tabs/AccountingTab';
import InvoicingTab from './tabs/InvoicingTab';
import BudgetTab from './tabs/BudgetTab';
import BankReconTab from './tabs/BankReconTab';
import { RBACGuard, useRBAC, PERMISSIONS } from '../../utils/RBACGuard';
import { IPCReportGenerator } from '../../utils/PDFExporter';

const FinanceControlCenter = ({ onOpenDetail, appId }) => {
  const { data, addRecord, formatCurrency, addAccountingEntry, userRole, shellView } = useStore();
  const { hasAccess } = useRBAC();
  const [mainTab, setMainTab] = useState(appId === 'budget' ? 'budget' : 'analytics');

  const allTabs = [
    { id: 'analytics', label: 'Analyse Stratégique', icon: <BarChart3 size={16} /> },
    { id: 'accounting', label: 'Comptabilité Générale', icon: <Calculator size={16} />, permission: 'MANAGE_FINANCE' },
    { id: 'invoicing', label: 'Cycle de Facturation', icon: <FileText size={16} /> },
    { id: 'budget', label: 'Arbitrages Budgétaires', icon: <PiggyBank size={16} />, permission: 'MANAGE_FINANCE' },
    { id: 'banque', label: 'Trésorerie & Banque', icon: <Wallet size={16} />, permission: 'MANAGE_FINANCE' },
  ];

  const tabs = allTabs.filter(t => !t.permission || hasAccess(PERMISSIONS[t.permission]));
  const isBudgetContext = appId === 'budget';

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await IPCReportGenerator.generateFinancialStatement({
        title: "Nexus Financial Intelligence Statement",
        summary: "Analyse institutionnelle consolidée des flux de trésorerie et de la performance stratégique.",
        metrics: [
          { label: 'Période Nexus', value: 'Q2 2024' },
          { label: 'Indice de Liquidité', value: 'Optimal' }
        ],
        rows: [
          { module: 'Trésorerie', description: 'Flux de trésorerie Nexus Core', status: 'Stable' },
          { module: 'Facturation', description: 'Performance du recouvrement', status: 'Optimal' },
          { module: 'Budget', description: 'Efficacité de l\'allocation', status: '82%' }
        ]
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ padding: shellView?.mobile ? '1rem' : '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', minHeight: '100%' }}>
      
      {/* Nexus Finance Header */}
      {!shellView?.mobile ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="nexus-glow" style={{ background: 'var(--nexus-primary)', padding: '6px', borderRadius: '10px' }}>
                <Landmark size={16} color="white" fill="white" />
              </div>
              <span style={{ fontWeight: 900, fontSize: '0.7rem', color: 'var(--nexus-primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                {isBudgetContext ? 'Nexus Budgetary Planning' : 'Nexus Financial Intelligence'}
              </span>
            </div>
            <h1 className="nexus-gradient-text" style={{ fontSize: '3.5rem', fontWeight: 900, margin: 0, letterSpacing: '-2px' }}>
              {isBudgetContext ? 'Budget Engine' : 'Financial Core'}
            </h1>
            <p style={{ color: 'var(--nexus-text-muted)', fontSize: '1.1rem', fontWeight: 500, maxWidth: '650px', lineHeight: 1.6 }}>
              {isBudgetContext 
                ? 'Arbitrage et optimisation des ressources stratégiques via le moteur prévisionnel Nexus.'
                : 'Pilotage haute fidélité de la santé financière. Maîtrisez vos flux et votre liquidité en temps réel.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="nexus-card" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'white' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Indice de Santé</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--nexus-primary)' }}>AAA</div>
              </div>
              <ShieldCheck size={24} color="var(--nexus-primary)" />
            </div>

            <button 
              className="nexus-card" 
              onClick={handleExport}
              disabled={isExporting}
              style={{ background: 'white', padding: '1rem', border: '1px solid var(--nexus-border)', cursor: 'pointer' }}
            >
              <Download size={20} color="var(--nexus-secondary)" />
            </button>
            
            <button 
              className="nexus-card" 
              onClick={() => { setMainTab('accounting'); }}
              style={{ 
                background: 'var(--nexus-secondary)', 
                color: 'white', 
                padding: '1rem 2rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 900
              }}
            >
              <Sparkles size={20} strokeWidth={3} />
              Accès Ledger
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem' }} className="nexus-gradient-text">Finance</h2>
          <button onClick={handleExport} className="nexus-card" style={{ background: 'white', padding: '0.75rem', borderRadius: '14px' }}>
            <Download size={24} />
          </button>
        </div>
      )}

      {/* Navigation Onglets Nexus */}
      <div className="nexus-card" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', padding: '0.5rem', borderRadius: '1.5rem' }}>
        <TabBar tabs={tabs} active={mainTab} onChange={setMainTab} />
      </div>

      {/* Zone de Contenu Nexus */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mainTab}
          initial={{ opacity: 0, scale: 0.98, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -20 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ minHeight: '60vh' }}
        >
          {mainTab === 'analytics' && <AnalyticsTab data={data} formatCurrency={formatCurrency} />}
          {mainTab === 'accounting' && <AccountingTab onOpenDetail={onOpenDetail} addAccountingEntry={addAccountingEntry} />}
          {mainTab === 'invoicing' && <InvoicingTab onOpenDetail={onOpenDetail} formatCurrency={formatCurrency} />}
          {mainTab === 'budget' && <BudgetTab data={data} formatCurrency={formatCurrency} onOpenDetail={onOpenDetail} />}
          {mainTab === 'banque' && <BankReconTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default FinanceControlCenter;
