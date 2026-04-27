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
    // Find product by ref or EAN
    const product = data?.inventory?.products?.find(p => p.ref === code || p.ean === code);
    if (product) {
      onOpenDetail(product.id, 'inventory', 'products');
    } else {
      alert(`Produit non trouvé pour le code : ${code}. Création d'une nouvelle fiche...`);
      setModalMode('movement');
      setIsModalOpen(true);
    }
  };

  const tabs = [
    { id: 'inventory', label: 'Disponibilité & Entrepôts', icon: <Package size={16} /> },
    { id: 'purchase', label: 'Approvisionnements & Achats', icon: <ShoppingBag size={16} /> },
    { id: 'project', label: 'Suivi des Livrables & Projets', icon: <Briefcase size={16} /> },
  ];

  const isPurchaseContext = appId === 'purchase';

  return (
    <div style={{ 
      padding: shellView?.mobile ? '1rem' : '2.5rem', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: shellView?.mobile ? '1.5rem' : '3rem', 
      minHeight: '100%',
      backgroundImage: 'radial-gradient(circle at 100% 0%, var(--accent-glow) 0%, transparent 50%)'
    }}>
      
      {/* --- SCANNER OVERLAY --- */}
      <AnimatePresence>
        {isScannerOpen && (
          <BarcodeScanner 
            onScan={handleScan} 
            onClose={() => setIsScannerOpen(false)} 
          />
        )}
      </AnimatePresence>
      
      {/* --- NEXT GEN LOGISTICS HEADER --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--accent)', marginBottom: '0.75rem' }}>
            <motion.div 
              animate={{ 
                rotate: [0, 90, 180, 270, 360],
                boxShadow: ['0 0 0px var(--accent-glow)', '0 0 20px var(--accent-glow)', '0 0 0px var(--accent-glow)']
              }} 
              transition={{ repeat: Infinity, duration: 10, ease: "linear" }} 
              style={{ background: 'var(--accent-glow)', padding: '8px', borderRadius: '12px', border: '1px solid var(--accent)' }}
            >
              <Link size={20} />
            </motion.div>
            <span style={{ fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '3px', color: 'var(--accent)' }}>
              {isPurchaseContext ? 'IPC Procurement Core' : 'IPC Unified Logistics'}
            </span>
          </div>
          <h1 style={{ fontSize: shellView?.mobile ? '2.5rem' : '3.5rem', fontWeight: 900, margin: 0, letterSpacing: '-0.04em', color: 'var(--text)', lineHeight: 1 }}>
            {isPurchaseContext ? 'Approvisionnements' : 'Flux Logistiques'}
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '1rem 0 0 0', fontSize: '1.1rem', fontWeight: 500, maxWidth: '750px', lineHeight: 1.6 }}>
            {isPurchaseContext 
              ? 'Pilotage stratégique des approvisionnements et optimisation de la chaîne fournisseur.'
              : 'Maîtrisez vos flux physiques, la traçabilité des stocks et la livraison de vos projets en temps réel.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
           <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.85rem 1.5rem', borderRadius: '1.25rem', border: '1px solid var(--accent)', background: 'var(--accent-glow)' }}>
              <Target size={18} color="var(--accent)" />
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent)' }}>OTIF Rate : 94.2%</span>
           </div>

           <button onClick={() => setIsScannerOpen(true)} className="btn-glass" style={{ width: '48px', height: '48px', padding: 0, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
             <Package size={20} />
           </button>

           <button onClick={() => alert('Consultation de l\'historique des flux logistiques...')} className="btn-glass" style={{ width: '48px', height: '48px', padding: 0, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
             <History size={20} />
           </button>
           
           {accessLevel === 'write' && (
            <button className="btn-primary" onClick={() => { 
                setModalMode(mainTab === 'purchase' ? 'purchase' : mainTab === 'project' ? 'project' : 'movement');
                setIsModalOpen(true); 
              }} 
              style={{ padding: '0.85rem 2rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--primary)' }}>
              <Plus size={20} /> <span style={{ fontWeight: 800 }}>{
                mainTab === 'purchase' ? 'Nouvelle Commande' : 
                mainTab === 'project' ? 'Nouveau Jalon' : 
                'Flux Logistique'
              }</span>
            </button>
           )}
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
          {mainTab === 'inventory' && <InventoryTab data={data} formatCurrency={formatCurrency} onOpenDetail={onOpenDetail} />}
          {mainTab === 'purchase' && <PurchaseTab data={data} formatCurrency={formatCurrency} onOpenDetail={onOpenDetail} />}
          {mainTab === 'project' && <ProjectTab data={data} onOpenDetail={onOpenDetail} updateRecord={updateRecord} />}
        </motion.div>
      </AnimatePresence>

      <RecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          modalMode === 'purchase' ? 'Demande d\'Achat & Commande' :
          modalMode === 'project' ? 'Action & Jalon Opérationnel' :
          'Enregistrement de Flux Physique'
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
