import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Landmark, BarChart3, Calculator, 
  FileText, PiggyBank, ShieldCheck, Wallet, 
  Settings, Download, Share2, TrendingUp, History
} from 'lucide-react';
import { useBusiness } from '../../BusinessContext';

// Components
import TabBar from '../marketing/components/TabBar';
import RecordModal from '../../components/RecordModal';

// Tabs
import AnalyticsTab from './tabs/AnalyticsTab';
import AccountingTab from './tabs/AccountingTab';
import InvoicingTab from './tabs/InvoicingTab';
import BudgetTab from './tabs/BudgetTab';
import BankReconTab from './tabs/BankReconTab';

const FinanceControlCenter = ({ onOpenDetail, appId }) => {
  const { data, addRecord, formatCurrency, addAccountingEntry, userRole } = useBusiness();
  const [mainTab, setMainTab] = useState(appId === 'budget' ? 'budget' : 'analytics');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('invoices');

  const tabs = [
    { id: 'analytics', label: 'Performance', icon: <BarChart3 size={16} /> },
    { id: 'accounting', label: 'Comptabilité', icon: <Calculator size={16} /> },
    { id: 'invoicing', label: 'Facturation', icon: <FileText size={16} /> },
    { id: 'budget', label: 'Budgets', icon: <PiggyBank size={16} /> },
    { id: 'banque', label: 'Banque', icon: <Wallet size={16} /> },
  ];

  const isBudgetContext = appId === 'budget';

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '3rem', minHeight: '1000px', background: 'linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(99, 102, 241, 0.02) 100%)' }}>
      {/* Header Specialized Experience */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#6366F1', marginBottom: '0.75rem' }}>
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 4 }} style={{ background: '#6366F120', padding: '6px', borderRadius: '8px' }}>
              <Landmark size={18} />
            </motion.div>
            <span style={{ fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2.5px' }}>
              {isBudgetContext ? 'IPC Budgeting & FP&A' : 'IPC Financial OS'}
            </span>
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: 0, letterSpacing: '-1.5px', color: '#0F172A' }}>
            {isBudgetContext ? 'Gestion Budgétaire' : 'Finance Excellence'}
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.6rem 0 0 0', fontSize: '1rem', fontWeight: 500, maxWidth: '600px', lineHeight: 1.5 }}>
            {isBudgetContext 
              ? 'Planification stratégique et suivi de la performance financière. Optimisez vos allocations de ressources.'
              : 'Cockpit de pilotage stratégique : Maîtrisez vos flux, votre comptabilité et vos budgets avec une précision institutionnelle.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
           <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.6rem 1.25rem', borderRadius: '3rem', border: '1px solid #6366F130' }}>
              <ShieldCheck size={16} color="#6366F1" />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6366F1' }}>Clôture : Période Ouverte</span>
           </div>

           <button className="glass" style={{ padding: '0.8rem', borderRadius: '1rem', color: 'var(--text-muted)' }}>
             <History size={20} />
           </button>
          <button className="btn-primary" 
            onClick={() => { setMainTab('accounting'); }}
            style={{ padding: '0.8rem 1.8rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#0F172A', borderColor: '#0F172A' }}>
            <TrendingUp size={20} /> <span style={{ fontWeight: 800 }}>Vue Comptabilité</span>
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem' }}>
        <TabBar tabs={tabs} active={mainTab} onChange={setMainTab} />
      </div>

      {/* Dynamic Content Frame */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mainTab}
          initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          style={{ position: 'relative' }}
        >
          {mainTab === 'analytics' && <AnalyticsTab data={data} formatCurrency={formatCurrency} />}
          {mainTab === 'accounting' && <AccountingTab onOpenDetail={onOpenDetail} addAccountingEntry={addAccountingEntry} />}
          {mainTab === 'invoicing' && <InvoicingTab onOpenDetail={onOpenDetail} formatCurrency={formatCurrency} />}
          {mainTab === 'budget' && <BudgetTab data={data} formatCurrency={formatCurrency} onOpenDetail={onOpenDetail} />}
          {mainTab === 'banque' && <BankReconTab />}
        </motion.div>
      </AnimatePresence>

      <RecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Opération Financière"
        fields={[]} // Dynamic fields based on schema would go here
        onSave={(f) => {
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default FinanceControlCenter;
