import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Settings, Factory, BarChart3, Activity, 
  Layers, Wrench, Database, Zap, ShieldCheck, 
  Download, Play, ClipboardList
} from 'lucide-react';
import { useBusiness } from '../../BusinessContext';
import { productionSchema } from '../../schemas/production.schema';

// Components
import TabBar from '../marketing/components/TabBar';
import RecordModal from '../../components/RecordModal';
import BomBuilderModal from './components/BomBuilderModal';

// Tabs
import AnalyticsTab from './tabs/AnalyticsTab';
import ExecutionTab from './tabs/ExecutionTab';
import DesignTab from './tabs/DesignTab';
import MaintenanceTab from './tabs/MaintenanceTab';

const Production = ({ onOpenDetail, appId }) => {
  const { data, addRecord, formatCurrency, userRole } = useBusiness();
  const [mainTab, setMainTab] = useState(appId === 'manufacturing' ? 'execution' : 'analytics');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('workOrders');
  const [isBomModalOpen, setIsBomModalOpen] = useState(false);

  const tabs = [
    { id: 'analytics', label: 'Performance', icon: <BarChart3 size={16} /> },
    { id: 'execution', label: 'Exécution (OF)', icon: <Factory size={16} /> },
    { id: 'design', label: 'Nomenclatures', icon: <Layers size={16} /> },
    { id: 'maintenance', label: 'Maintenance', icon: <Wrench size={16} /> },
  ];

  const modalConfig = {
    workOrders: { title: 'Nouvel Ordre de Fab.', schema: productionSchema.models.workOrders },
    boms: { title: 'Nouvelle Nomenclature', schema: productionSchema.models.boms }
  };

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '3rem', minHeight: '1000px', background: 'linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(6, 182, 212, 0.02) 100%)' }}>
      {/* Header Industrial Experience */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#06B6D4', marginBottom: '0.75rem' }}>
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} style={{ background: '#06B6D420', padding: '6px', borderRadius: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#06B6D4' }} />
            </motion.div>
            <span style={{ fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2.5px' }}>IPC Industrial OS</span>
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: 0, letterSpacing: '-1.5px', color: 'var(--text)' }}>Command Center</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.6rem 0 0 0', fontSize: '1rem', fontWeight: 500, maxWidth: '600px', lineHeight: 1.5 }}>
            Maîtrisez votre chaîne de production en temps réel, de la gestion des nomenclatures à la maintenance prédictive.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
           <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.6rem 1.25rem', borderRadius: '3rem', border: '1px solid #06B6D430' }}>
              <Activity size={16} color="#06B6D4" />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#06B6D4' }}>Usine : Opérationnelle</span>
           </div>

           <button className="glass" style={{ padding: '0.8rem', borderRadius: '1rem', color: 'var(--text-muted)' }}>
             <Download size={20} />
           </button>
          <button className="btn-primary" onClick={() => { setModalMode('workOrders'); setIsModalOpen(true); }} style={{ padding: '0.8rem 1.8rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#06B6D4', borderColor: '#06B6D4' }}>
            <Plus size={20} /> <span style={{ fontWeight: 800 }}>Lancer Production</span>
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
          {mainTab === 'execution' && <ExecutionTab data={data} onOpenDetail={onOpenDetail} onNewWorkOrder={() => { setModalMode('workOrders'); setIsModalOpen(true); }} />}
          {mainTab === 'design' && <DesignTab data={data} onOpenDetail={(rec, app, sub) => {
            if (!rec) { setIsBomModalOpen(true); }
            else if (onOpenDetail) onOpenDetail(rec, app, sub);
          }} />}
          {mainTab === 'maintenance' && <MaintenanceTab />}
        </motion.div>
      </AnimatePresence>

      <RecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalConfig[modalMode]?.title}
        fields={Object.entries(modalConfig[modalMode]?.schema?.fields || {}).map(([name, f]) => ({ ...f, name }))}
        onSave={(f) => {
          addRecord('production', modalMode, f);
          setIsModalOpen(false);
        }}
      />

      <BomBuilderModal 
        isOpen={isBomModalOpen}
        onClose={() => setIsBomModalOpen(false)}
        onSave={(data) => {
           addRecord('production', 'boms', data);
           setIsBomModalOpen(false);
        }}
      />
    </div>
  );
};

export default Production;
