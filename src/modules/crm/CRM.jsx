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
    { id: 'analytics', label: 'Performance Stratégique', icon: <BarChart3 size={16} /> },
    { id: 'pipeline', label: 'Pipeline Commercial', icon: <Briefcase size={16} /> },
    { id: 'leads', label: 'Centre de Prospects', icon: <UserPlus size={16} /> },
    { id: 'customers', label: 'Écosystème Clients', icon: <Users size={16} /> },
  ];

  const modalConfig = {
    leads: { title: 'Initialiser une Piste Nexus', schema: crmSchema.models.leads },
    opportunities: { title: 'Déployer une Nouvelle Affaire', schema: crmSchema.models.opportunities },
    clients: { title: 'Enregistrer un Partenaire Stratégique', schema: crmSchema.models.clients }
  };

  return (
    <div style={{ padding: shellView?.mobile ? '1rem' : '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', minHeight: '100%' }}>
      {/* Nexus Header */}
      {!shellView?.mobile ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="nexus-glow" style={{ background: 'var(--nexus-primary)', padding: '6px', borderRadius: '10px' }}>
                <Zap size={16} color="white" fill="white" />
              </div>
              <span style={{ fontWeight: 900, fontSize: '0.7rem', color: 'var(--nexus-primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                Nexus Sales Intelligence
              </span>
            </div>
            <h1 className="nexus-gradient-text" style={{ fontSize: '3.5rem', fontWeight: 900, margin: 0, letterSpacing: '-2px' }}>
              Velocity Engine
            </h1>
            <p style={{ color: 'var(--nexus-text-muted)', fontSize: '1.1rem', fontWeight: 500, maxWidth: '650px', lineHeight: 1.6 }}>
              Optimisez votre tunnel de conversion avec l'intelligence contextuelle Nexus. Transformez vos prospects en partenaires stratégiques.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="nexus-card" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'white' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Pipeline Mensuel</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--nexus-primary)' }}>+18.4%</div>
              </div>
              <Activity size={24} color="var(--nexus-primary)" />
            </div>
            
            {accessLevel === 'write' && (
              <button 
                className="nexus-card" 
                onClick={() => { setModalMode('leads'); setIsModalOpen(true); }}
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
                <Plus size={20} strokeWidth={3} />
                Nouvelle Opportunité
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem' }} className="nexus-gradient-text">Sales Hub</h2>
          <button 
            onClick={() => { setModalMode('leads'); setIsModalOpen(true); }} 
            className="nexus-card"
            style={{ background: 'var(--nexus-secondary)', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '14px' }}
          >
            <Plus size={24} />
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
