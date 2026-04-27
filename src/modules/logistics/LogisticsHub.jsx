import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Package, ShoppingBag, Briefcase, 
  Target, Truck, Link, Settings, Clock, 
  History, Download, Share2, ShieldCheck, Activity, Sparkles
} from 'lucide-react';
import { useStore } from '../../store';
import { registry } from '../../services/Registry';

// Components
import TabBar from '../marketing/components/TabBar';
import RecordModal from '../../components/RecordModal';

import BarcodeScanner from '../../components/BarcodeScanner';
import InventoryTab from './tabs/InventoryTab';
import PurchaseTab from './tabs/PurchaseTab';
import ProjectTab from './tabs/ProjectTab';

const LogisticsHub = ({ onOpenDetail, accessLevel, appId }) => {
  const { data, addRecord, updateRecord, formatCurrency, shellView } = useStore();
  const [mainTab, setMainTab] = useState(appId === 'purchase' ? 'purchase' : 'inventory');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [modalMode, setModalMode] = useState(appId === 'purchase' ? 'purchase' : 'movement'); 

  const handleScan = (code) => {
    setIsScannerOpen(false);
    const product = data?.inventory?.products?.find(p => p.ref === code || p.ean === code);
    if (product) {
      onOpenDetail(product.id, 'inventory', 'products');
    } else {
      setModalMode('movement');
      setIsModalOpen(true);
    }
  };

  const tabs = [
    { id: 'inventory', label: 'ENTREPÔTS', icon: <Package size={16} /> },
    { id: 'purchase', label: 'ACHATS', icon: <ShoppingBag size={16} /> },
    { id: 'project', label: 'PROJETS', icon: <Briefcase size={16} /> },
  ];

  const isPurchaseContext = appId === 'purchase';

  return (
    <div style={{ padding: shellView?.mobile ? '1rem' : '3rem', display: 'flex', flexDirection: 'column', gap: '3rem', minHeight: '100%' }}>
      
      <AnimatePresence>
        {isScannerOpen && (
          <BarcodeScanner onScan={handleScan} onClose={() => setIsScannerOpen(false)} />
        )}
      </AnimatePresence>

      {/* Nexus Logistics Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="nexus-glow" style={{ background: 'var(--nexus-primary)', padding: '8px', borderRadius: '12px' }}>
              <Truck size={20} color="white" />
            </div>
            <span style={{ fontWeight: 900, fontSize: '0.75rem', color: 'var(--nexus-primary)', textTransform: 'uppercase', letterSpacing: '3px' }}>
              {isPurchaseContext ? 'Nexus Procurement Core' : 'Nexus Supply Chain'}
            </span>
          </div>
          <h1 className="nexus-gradient-text" style={{ fontSize: shellView?.mobile ? '2.5rem' : '4rem', fontWeight: 900, margin: 0, letterSpacing: '-3px', lineHeight: 0.9 }}>
            {isPurchaseContext ? 'Procurement' : 'Logistics'}
          </h1>
          <p style={{ color: 'var(--nexus-text-muted)', fontSize: '1.2rem', fontWeight: 500, maxWidth: '650px', lineHeight: 1.6, margin: '1rem 0 0 0' }}>
            {isPurchaseContext 
              ? 'Optimisation stratégique de la chaîne fournisseur et pilotage des approvisionnements.'
              : 'Traçabilité totale et orchestration des flux physiques via le moteur logistique Nexus.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="nexus-card" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '1rem 2rem', background: 'white' }}>
            <Activity size={24} color="var(--nexus-primary)" />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Performance OTIF</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>94.2%</div>
            </div>
          </div>

          <button className="nexus-card" onClick={() => setIsScannerOpen(true)} style={{ width: '56px', height: '56px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'white' }}>
            <Package size={22} color="var(--nexus-secondary)" />
          </button>
          
          {accessLevel === 'write' && (
            <button 
              className="nexus-card" 
              onClick={() => { 
                setModalMode(mainTab === 'purchase' ? 'purchase' : mainTab === 'project' ? 'project' : 'movement');
                setIsModalOpen(true); 
              }}
              style={{ padding: '1rem 2.5rem', background: 'var(--nexus-secondary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '1rem' }}
            >
              <Plus size={22} strokeWidth={3} /> {mainTab === 'purchase' ? 'NOUVEL ACHAT' : mainTab === 'project' ? 'NOUVEL ACTIF' : 'NOUVEAU FLUX'}
            </button>
          )}
        </div>
      </div>

      {/* Nexus Navigation */}
      <div className="nexus-card" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', padding: '0.5rem', borderRadius: '1.5rem', alignSelf: 'center' }}>
        <TabBar tabs={tabs} active={mainTab} onChange={setMainTab} />
      </div>

      {/* Nexus Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mainTab}
          initial={{ opacity: 0, scale: 0.98, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -20 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ minHeight: '60vh' }}
        >
          {mainTab === 'inventory' && <InventoryTab data={data} formatCurrency={formatCurrency} onOpenDetail={onOpenDetail} />}
          {mainTab === 'purchase' && <PurchaseTab data={data} formatCurrency={formatCurrency} onOpenDetail={onOpenDetail} />}
          {mainTab === 'project' && <ProjectTab data={data} onOpenDetail={onOpenDetail} updateRecord={updateRecord} />}
        </motion.div>
      </AnimatePresence>

      <RecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          modalMode === 'purchase' ? 'Demande d\'Achat Stratégique' :
          modalMode === 'project' ? 'Action Opérationnelle Nexus' :
          'Enregistrement de Flux Nexus'
        }
        fields={
          modalMode === 'purchase' ? Object.entries(registry.getSchema('purchase')?.models?.orders?.fields || {}).map(([name, f]) => ({ ...f, name })) :
          modalMode === 'project' ? Object.entries(registry.getSchema('projects')?.models?.tasks?.fields || {}).map(([name, f]) => ({ ...f, name })) :
          Object.entries(registry.getSchema('inventory')?.models?.movements?.fields || {}).map(([name, f]) => ({ ...f, name }))
        }
        onSave={(f) => {
          if (modalMode === 'purchase') addRecord('purchase', 'orders', f);
          else if (modalMode === 'project') addRecord('projects', 'tasks', f);
          else addRecord('inventory', 'movements', f);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default LogisticsHub;
