import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Settings, Factory, BarChart3, Activity, 
  Layers, Wrench, Database, Zap, ShieldCheck, 
  Download, Play, ClipboardList, Sparkles, TrendingUp
} from 'lucide-react';
import { useStore } from '../../store';
import { useTranslation } from 'react-i18next';
import { productionSchema } from '../../schemas/production.schema';
import PermissionGuard from '../../components/PermissionGuard';

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
  const { t } = useTranslation();
  const { 
    data, setData, formatCurrency, userRole, shellView 
  } = useStore();
  const { addRecord } = useStore();
  const [mainTab, setMainTab] = useState(appId === 'manufacturing' ? 'execution' : 'analytics');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('workOrders');
  const [isBomModalOpen, setIsBomModalOpen] = useState(false);

  const tabs = [
    { id: 'analytics', label: t('nav.bi', { defaultValue: 'Efficacité OEE' }), icon: <BarChart3 size={16} /> },
    { id: 'execution', label: t('nav.production', { defaultValue: 'Exécution (OF)' }), icon: <Factory size={16} /> },
    { id: 'design', label: t('inventory.products', { defaultValue: 'Nomenclatures' }), icon: <Layers size={16} /> },
    { id: 'maintenance', label: t('nav.maintenance', { defaultValue: 'Maintenance' }), icon: <Wrench size={16} /> },
  ];

  const modalConfig = {
    workOrders: { title: 'Nouvel Ordre de Fab.', schema: productionSchema.models.workOrders },
    boms: { title: 'Nouvelle Nomenclature', schema: productionSchema.models.boms }
  };

  return (
    <div style={{ 
      padding: shellView?.mobile ? '1rem' : '2.5rem', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: shellView?.mobile ? '1.5rem' : '3rem', 
      minHeight: '100%',
      backgroundImage: 'radial-gradient(circle at 100% 100%, rgba(6, 182, 212, 0.05) 0%, transparent 50%)'
    }}>
      
      {/* --- NEXT GEN INDUSTRIAL HEADER --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#06B6D4', marginBottom: '0.75rem' }}>
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                boxShadow: ['0 0 0px rgba(6, 182, 212, 0)', '0 0 20px rgba(6, 182, 212, 0.3)', '0 0 0px rgba(6, 182, 212, 0)']
              }} 
              transition={{ repeat: Infinity, duration: 3 }} 
              style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '8px', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.2)' }}
            >
              <Factory size={20} />
            </motion.div>
            <span style={{ fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '3px' }}>
              IPC Manufacturing Suite
            </span>
          </div>
          <h1 style={{ fontSize: shellView?.mobile ? '2.5rem' : '3.5rem', fontWeight: 900, margin: 0, letterSpacing: '-0.04em', color: 'var(--text)', lineHeight: 1 }}>
            Industrial Engine
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '1rem 0 0 0', fontSize: '1.1rem', fontWeight: 500, maxWidth: '750px', lineHeight: 1.6 }}>
            Centre de commandement industriel : Optimisation des flux de production, maintenance prédictive et gestion intelligente des ordres.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
           <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.85rem 1.5rem', borderRadius: '1.25rem', border: '1px solid #06B6D440', background: 'rgba(6, 182, 212, 0.05)' }}>
              <Activity size={18} color="#06B6D4" />
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#06B6D4' }}>Usine : 98% OEE</span>
           </div>

           <button className="btn-glass" style={{ width: '48px', height: '48px', padding: 0, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Download size={20} />
           </button>
           
            <PermissionGuard module="production" level="write">
               <button className="btn-primary" 
                  onClick={() => { setModalMode('workOrders'); setIsModalOpen(true); }}
                  style={{ padding: '0.85rem 2rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#06B6D4' }}>
                  <Plus size={20} /> <span style={{ fontWeight: 800 }}>{t('production.launch_order', { defaultValue: 'Lancer Ordre' })}</span>
               </button>
            </PermissionGuard>
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
