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

const FinanceControlCenter = ({ onOpenDetail, appId }) => {
  const { data, addRecord, formatCurrency, addAccountingEntry, userRole, shellView } = useStore();
  const { hasAccess } = useRBAC();
  const [mainTab, setMainTab] = useState(appId === 'budget' ? 'budget' : 'analytics');

  const allTabs = [
    { id: 'analytics', label: 'Performance', icon: <BarChart3 size={16} /> },
    { id: 'accounting', label: 'Comptabilité', icon: <Calculator size={16} />, permission: 'MANAGE_FINANCE' },
    { id: 'invoicing', label: 'Facturation', icon: <FileText size={16} /> },
    { id: 'budget', label: 'Budgets', icon: <PiggyBank size={16} />, permission: 'MANAGE_FINANCE' },
    { id: 'banque', label: 'Banque', icon: <Wallet size={16} />, permission: 'MANAGE_FINANCE' },
  ];

  const tabs = allTabs.filter(t => !t.permission || hasAccess(PERMISSIONS[t.permission]));

  const isBudgetContext = appId === 'budget';

  return (
    <div style={{ 
      padding: shellView?.mobile ? '1rem' : '2.5rem', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: shellView?.mobile ? '1.5rem' : '3rem', 
      minHeight: '100%',
      backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(99, 102, 241, 0.05) 0%, transparent 50%)'
    }}>
      
      {/* --- NEXT GEN FINANCE HEADER --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#6366F1', marginBottom: '0.75rem' }}>
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                boxShadow: ['0 0 0px rgba(99, 102, 241, 0)', '0 0 20px rgba(99, 102, 241, 0.3)', '0 0 0px rgba(99, 102, 241, 0)']
              }} 
              transition={{ repeat: Infinity, duration: 5 }} 
              style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '8px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)' }}
            >
              <Landmark size={20} />
            </motion.div>
            <span style={{ fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '3px' }}>
              {isBudgetContext ? 'IPC Strategic Planning' : 'IPC Institutional Finance'}
            </span>
          </div>
          <h1 style={{ fontSize: shellView?.mobile ? '2.5rem' : '3.5rem', fontWeight: 900, margin: 0, letterSpacing: '-0.04em', color: 'var(--text)', lineHeight: 1 }}>
            {isBudgetContext ? 'Gestion Budgétaire' : 'Finance Excellence'}
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '1rem 0 0 0', fontSize: '1.1rem', fontWeight: 500, maxWidth: '700px', lineHeight: 1.6 }}>
            {isBudgetContext 
              ? 'Pilotage stratégique des ressources et analyse prévisionnelle de la performance.'
              : 'Cockpit financier haute fidélité : Maîtrisez vos flux de trésorerie et votre santé comptable en temps réel.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
           <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.85rem 1.5rem', borderRadius: '1.25rem', border: '1px solid #6366F140', background: 'rgba(99, 102, 241, 0.05)' }}>
              <ShieldCheck size={18} color="#6366F1" />
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#6366F1' }}>Période Active : Q2 2024</span>
           </div>

           <button className="btn-glass" style={{ width: '48px', height: '48px', padding: 0, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <History size={20} />
           </button>
           
           <button className="btn-primary" 
              onClick={() => { setMainTab('accounting'); }}
              style={{ padding: '0.85rem 2rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Sparkles size={20} /> <span style={{ fontWeight: 800 }}>Vue Ledger</span>
           </button>
        </div>
      </div>

      {/* --- PREMIUM TAB NAVIGATION --- */}
      <div style={{ display: 'flex', justifyContent: shellView?.mobile ? 'flex-start' : 'center', alignItems: 'center', overflowX: 'auto' }}>
        <TabBar tabs={tabs} active={mainTab} onChange={setMainTab} />
      </div>

      {/* --- CONTENT FRAME --- */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mainTab}
          initial={{ opacity: 0, y: 15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.98 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          style={{ position: 'relative' }}
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
