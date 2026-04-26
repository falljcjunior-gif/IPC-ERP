import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Filter, BarChart3, Users, 
  Target, Briefcase, Zap, Activity, Share2, 
  Settings, Download, UserPlus
} from 'lucide-react';
import { useStore } from '../../store';
import { crmSchema } from '../../schemas/crm.schema';

// Components
import TabBar from '../marketing/components/TabBar';
import RecordModal from '../../components/RecordModal';

// Tabs
import AnalyticsTab from './tabs/AnalyticsTab';
import PipelineTab from './tabs/PipelineTab';
import LeadsTab from './tabs/LeadsTab';
import CustomerTab from './tabs/CustomerTab';

const CRM = ({ onOpenDetail, accessLevel }) => {
  const { data, addRecord, formatCurrency, userRole, shellView } = useStore();
  const [mainTab, setMainTab] = useState('analytics');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('leads');

  const { leads = [], opportunities = [] } = data.crm || {};

  const tabs = [
    { id: 'analytics', label: 'Efficacité', icon: <BarChart3 size={16} /> },
    { id: 'pipeline', label: 'Pipeline', icon: <Briefcase size={16} /> },
    { id: 'leads', label: 'Prospections', icon: <UserPlus size={16} /> },
    { id: 'customers', label: 'Clients', icon: <Users size={16} /> },
  ];

  const modalConfig = {
    leads: { title: 'Nouveau Prospect', schema: crmSchema.models.leads },
    opportunities: { title: 'Nouvelle Opportunité', schema: crmSchema.models.opportunities },
    clients: { title: 'Nouveau Client', schema: crmSchema.models.clients }
  };

  return (
    <div style={{ padding: shellView?.mobile ? '0.75rem' : '2.5rem', display: 'flex', flexDirection: 'column', gap: shellView?.mobile ? '1rem' : '3rem', minHeight: '100%', background: 'linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(16, 185, 129, 0.02) 100%)' }}>
      {/* Header : masqué sur mobile */}
      {!shellView?.mobile && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#10B981', marginBottom: '0.75rem' }}>
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2.5 }} style={{ background: '#10B98120', padding: '6px', borderRadius: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
              </motion.div>
              <span style={{ fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2.5px' }}>IPC Sales Intelligence</span>
            </div>
            <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: 0, letterSpacing: '-1.5px', color: 'var(--text)' }}>Velocity Center</h1>
            <p style={{ color: 'var(--text-muted)', margin: '0.6rem 0 0 0', fontSize: '1rem', fontWeight: 500, maxWidth: '600px', lineHeight: 1.5 }}>
              Transformez vos prospects en partenaires fidèles avec une visibilité totale sur votre tunnel de conversion.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
             <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.6rem 1.25rem', borderRadius: '3rem', border: '1px solid #10B98130' }}>
                <Zap size={16} color="#10B981" />
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10B981' }}>Pipeline: +15% ce mois</span>
             </div>
             <button onClick={() => alert('Exportation globale des données CRM...')} className="glass" style={{ padding: '0.8rem', borderRadius: '1rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
               <Download size={20} />
             </button>
             {accessLevel === 'write' && (
              <button className="btn-primary" onClick={() => { setModalMode('leads'); setIsModalOpen(true); }} style={{ padding: '0.8rem 1.8rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#10B981', borderColor: '#10B981' }}>
                <Plus size={20} /> <span style={{ fontWeight: 800 }}>Nouveau Lead</span>
              </button>
            )}
          </div>
        </div>
      )}
      {/* Header mobile minimaliste */}
      {shellView?.mobile && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.3rem', color: 'var(--text)' }}>CRM</h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#10B981', fontWeight: 700 }}>Pipeline: +15% ce mois</p>
          </div>
          {accessLevel === 'write' && (
            <button onClick={() => { setModalMode('leads'); setIsModalOpen(true); }} style={{ background: '#10B981', color: 'white', border: 'none', cursor: 'pointer', padding: '0.6rem 1rem', borderRadius: '1rem', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Plus size={16} /> Lead
            </button>
          )}
        </div>
      )}

      {/* Main Tab Navigation */}
      <div style={{ overflow: 'hidden' }}>
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
          {mainTab === 'analytics' && <AnalyticsTab leads={leads} opportunities={opportunities} formatCurrency={formatCurrency} />}
          {mainTab === 'pipeline' && <PipelineTab opportunities={opportunities} formatCurrency={formatCurrency} onOpenDetail={onOpenDetail} />}
          {mainTab === 'leads' && <LeadsTab leads={leads} onOpenDetail={onOpenDetail} />}
          {mainTab === 'customers' && <CustomerTab data={data} onOpenDetail={onOpenDetail} formatCurrency={formatCurrency} />}
        </motion.div>
      </AnimatePresence>

      <RecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalConfig[modalMode]?.title}
        fields={Object.entries(modalConfig[modalMode]?.schema?.fields || {}).map(([name, f]) => ({ ...f, name }))}
        onSave={(f) => {
          addRecord('crm', modalMode, f);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default React.memo(CRM);
