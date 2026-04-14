import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Package, ShoppingBag, Briefcase, 
  Target, Truck, Link, Settings, Clock, 
  History, Download, Share2, ShieldCheck, Activity
} from 'lucide-react';
import { useBusiness } from '../../BusinessContext';

// Components
import TabBar from '../marketing/components/TabBar';
import RecordModal from '../../components/RecordModal';

// Tabs
import InventoryTab from './tabs/InventoryTab';
import PurchaseTab from './tabs/PurchaseTab';
import ProjectTab from './tabs/ProjectTab';

const LogisticsHub = ({ onOpenDetail }) => {
  const { data, addRecord, updateRecord, formatCurrency } = useBusiness();
  const [mainTab, setMainTab] = useState('inventory');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tabs = [
    { id: 'inventory', label: 'Stocks & Entrepôts', icon: <Package size={16} /> },
    { id: 'purchase', label: 'Achats & Fournisseurs', icon: <ShoppingBag size={16} /> },
    { id: 'project', label: 'Projets & Delivery', icon: <Briefcase size={16} /> },
  ];

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '3rem', minHeight: '1000px', background: 'linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(79, 70, 229, 0.02) 100%)' }}>
      {/* Header Supply Chain Intelligence */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#4F46E5', marginBottom: '0.75rem' }}>
            <motion.div animate={{ rotate: [0, 90, 180, 270, 360] }} transition={{ repeat: Infinity, duration: 20, ease: "linear" }} style={{ background: '#4F46E520', padding: '6px', borderRadius: '8px' }}>
              <Link size={18} />
            </motion.div>
            <span style={{ fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2.5px' }}>IPC Supply Chain & Project Hub</span>
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: 0, letterSpacing: '-1.5px', color: '#0F172A' }}>Logistics & Delivery</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.6rem 0 0 0', fontSize: '1rem', fontWeight: 500, maxWidth: '600px', lineHeight: 1.5 }}>
            Gestion intégrée des flux physiques et opérationnels. Pilotez vos stocks, fournisseurs et projets avec une précision industrielle.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
           <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.6rem 1.25rem', borderRadius: '3rem', border: '1px solid #4F46E530' }}>
              <Target size={16} color="#4F46E5" />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4F46E5' }}>Performance OTIF : 94.2%</span>
           </div>

           <button className="glass" style={{ padding: '0.8rem', borderRadius: '1rem', color: 'var(--text-muted)' }}>
             <History size={20} />
           </button>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)} style={{ padding: '0.8rem 1.8rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#0F172A', borderColor: '#0F172A' }}>
            <Plus size={20} /> <span style={{ fontWeight: 800 }}>Nouvelle Opération</span>
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
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{ position: 'relative' }}
        >
          {mainTab === 'inventory' && <InventoryTab data={data} formatCurrency={formatCurrency} onOpenDetail={onOpenDetail} />}
          {mainTab === 'purchase' && <PurchaseTab data={data} formatCurrency={formatCurrency} onOpenDetail={onOpenDetail} />}
          {mainTab === 'project' && <ProjectTab data={data} onOpenDetail={onOpenDetail} updateRecord={updateRecord} />}
        </motion.div>
      </AnimatePresence>

      <RecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouvelle Opération Logistique"
        fields={[]} 
        onSave={(f) => {
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default LogisticsHub;
