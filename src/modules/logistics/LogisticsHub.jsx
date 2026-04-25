import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Package, ShoppingBag, Briefcase, 
  Target, Truck, Link, Settings, Clock, 
  History, Download, Share2, ShieldCheck, Activity, Sparkles
} from 'lucide-react';
import { useBusiness } from '../../BusinessContext';

// Components
import TabBar from '../marketing/components/TabBar';
import RecordModal from '../../components/RecordModal';

// Tabs
import InventoryTab from './tabs/InventoryTab';
import PurchaseTab from './tabs/PurchaseTab';
import ProjectTab from './tabs/ProjectTab';

const LogisticsHub = ({ onOpenDetail, accessLevel, appId }) => {
  const { data, addRecord, updateRecord, formatCurrency, shellView } = useBusiness();
  const [mainTab, setMainTab] = useState(appId === 'purchase' ? 'purchase' : 'inventory');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState(appId === 'purchase' ? 'purchase' : 'movement'); 

  const tabs = [
    { id: 'inventory', label: 'Stocks & Entrepôts', icon: <Package size={16} /> },
    { id: 'purchase', label: 'Achats & Fournisseurs', icon: <ShoppingBag size={16} /> },
    { id: 'project', label: 'Projets & Delivery', icon: <Briefcase size={16} /> },
  ];

  const isPurchaseContext = appId === 'purchase';

  return (
    <div style={{ 
      padding: shellView?.mobile ? '1rem' : '2.5rem', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: shellView?.mobile ? '1.5rem' : '3rem', 
      minHeight: '100%',
      backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(79, 70, 229, 0.05) 0%, transparent 50%)'
    }}>
      
      {/* --- NEXT GEN LOGISTICS HEADER --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#4F46E5', marginBottom: '0.75rem' }}>
            <motion.div 
              animate={{ 
                rotate: [0, 90, 180, 270, 360],
                boxShadow: ['0 0 0px rgba(79, 70, 229, 0)', '0 0 20px rgba(79, 70, 229, 0.3)', '0 0 0px rgba(79, 70, 229, 0)']
              }} 
              transition={{ repeat: Infinity, duration: 10, ease: "linear" }} 
              style={{ background: 'rgba(79, 70, 229, 0.1)', padding: '8px', borderRadius: '12px', border: '1px solid rgba(79, 70, 229, 0.2)' }}
            >
              <Link size={20} />
            </motion.div>
            <span style={{ fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '3px' }}>
              {isPurchaseContext ? 'IPC Procurement Core' : 'IPC Unified Logistics'}
            </span>
          </div>
          <h1 style={{ fontSize: shellView?.mobile ? '2.5rem' : '3.5rem', fontWeight: 900, margin: 0, letterSpacing: '-0.04em', color: 'var(--text)', lineHeight: 1 }}>
            {isPurchaseContext ? 'Gestion des Achats' : 'Supply Chain Hub'}
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '1rem 0 0 0', fontSize: '1.1rem', fontWeight: 500, maxWidth: '750px', lineHeight: 1.6 }}>
            {isPurchaseContext 
              ? 'Pilotage stratégique des approvisionnements et optimisation de la chaîne fournisseur.'
              : 'Maîtrisez vos flux physiques, la traçabilité des stocks et la livraison de vos projets en temps réel.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
           <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.85rem 1.5rem', borderRadius: '1.25rem', border: '1px solid #4F46E540', background: 'rgba(79, 70, 229, 0.05)' }}>
              <Target size={18} color="#4F46E5" />
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#4F46E5' }}>OTIF Rate : 94.2%</span>
           </div>

           <button className="btn-glass" style={{ width: '48px', height: '48px', padding: 0, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <History size={20} />
           </button>
           
           {accessLevel === 'write' && (
            <button className="btn-primary" onClick={() => { 
                setModalMode(mainTab === 'purchase' ? 'purchase' : mainTab === 'project' ? 'project' : 'movement');
                setIsModalOpen(true); 
              }} 
              style={{ padding: '0.85rem 2rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#4F46E5' }}>
              <Plus size={20} /> <span style={{ fontWeight: 800 }}>{
                mainTab === 'purchase' ? 'Nouveau PO' : 
                mainTab === 'project' ? 'Nouvelle Tâche' : 
                'Action Stock'
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
          modalMode === 'purchase' ? 'Nouvelle Commande Achat' :
          modalMode === 'project' ? 'Nouvelle Tâche Projet' :
          'Mouvement de Stock'
        }
        fields={
          modalMode === 'purchase' ? [
            { name: 'fournisseur', label: 'Fournisseur', type: 'text', required: true },
            { name: 'ref', label: 'Référence PO', type: 'text', required: true },
            { name: 'date', label: 'Date Commande', type: 'date', required: true },
            { name: 'total', label: 'Montant Total (FCFA)', type: 'money', currency: 'FCFA' },
            { name: 'statut', label: 'Statut', type: 'selection', options: ['Brouillon', 'Commandé', 'En Transit', 'Réceptionné', 'Annulé'], default: 'Brouillon' },
            { name: 'notes', label: 'Notes', type: 'textarea' }
          ] : modalMode === 'project' ? [
            { name: 'titre', label: 'Titre de la Tâche', type: 'text', required: true },
            { name: 'projet', label: 'Projet Parent', type: 'text', required: true },
            { name: 'assigne', label: 'Assigné à', type: 'text' },
            { name: 'priorite', label: 'Priorité', type: 'selection', options: ['Basse', 'Moyenne', 'Haute'], default: 'Moyenne' },
            { name: 'dateEcheance', label: 'Échéance', type: 'date' },
            { name: 'statut', label: 'Statut', type: 'selection', options: ['À faire', 'En cours', 'Terminé'], default: 'À faire' }
          ] : [
            { name: 'produit', label: 'Article', type: 'text', required: true },
            { name: 'type', label: 'Type de Mouvement', type: 'selection', options: ['Réception', 'Expédition', 'Consommation', 'Ajustement Entrée', 'Ajustement Sortie'], required: true },
            { name: 'qte', label: 'Quantité', type: 'number', required: true },
            { name: 'ref', label: 'Document Source (ex: BL-001)', type: 'text' },
            { name: 'date', label: 'Date', type: 'date' }
          ]
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
