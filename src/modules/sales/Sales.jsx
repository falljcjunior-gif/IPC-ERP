import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Filter, BarChart3, ShoppingCart, 
  Tag, Activity, Share2, Settings, Download, 
  TrendingUp, Target, FileText
} from 'lucide-react';
import { useBusiness } from '../../BusinessContext';
import { salesSchema } from '../../schemas/sales.schema';

// Components
import TabBar from '../marketing/components/TabBar';
import RecordModal from '../../components/RecordModal';

// Tabs
import AnalyticsTab from './tabs/AnalyticsTab';
import OrdersTab from './tabs/OrdersTab';
import CatalogTab from './tabs/CatalogTab';

const Sales = ({ onOpenDetail, accessLevel }) => {
  const { data, addRecord, formatCurrency, userRole } = useBusiness();
  const [view, setView] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('orders');

  const opportunities = useMemo(() => data?.crm?.opportunities || [], [data?.crm?.opportunities]);

  const tabs = [
    { id: 'dashboard', label: 'Revenue Hub', icon: <BarChart3 size={16} /> },
    { id: 'orders', label: 'Commandes', icon: <ShoppingCart size={16} /> },
    { id: 'products', label: 'Catalogue', icon: <Tag size={16} /> }
  ];

  const modalConfig = {
    orders: { title: 'Nouvelle Commande', schema: salesSchema.models.orders },
    products: { title: 'Nouveau Produit', schema: salesSchema.models.products }
  };

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '3rem', minHeight: '1000px', background: 'linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(59, 130, 246, 0.02) 100%)' }}>
      {/* Header Premium Experience */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#3B82F6', marginBottom: '0.75rem' }}>
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 3 }} style={{ background: '#3B82F620', padding: '6px', borderRadius: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6' }} />
            </motion.div>
            <span style={{ fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2.5px' }}>IPC Revenue Hub</span>
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: 0, letterSpacing: '-1.5px', color: 'var(--text)' }}>Ventes & Revenus</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.6rem 0 0 0', fontSize: '1rem', fontWeight: 500, maxWidth: '600px', lineHeight: 1.5 }}>
            Pilotez votre performance commerciale avec une visibilité totale sur vos commandes, votre catalogue et vos prévisions de croissance.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
           <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.6rem 1.25rem', borderRadius: '3rem', border: '1px solid #3B82F630' }}>
              <Target size={16} color="#3B82F6" />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3B82F6' }}>Objectif Q2: 85% Atteint</span>
           </div>

           <button className="glass" style={{ padding: '0.8rem', borderRadius: '1rem', color: 'var(--text-muted)' }}>
             <Download size={20} />
           </button>
           {accessLevel === 'write' && (
            <button className="btn-primary" onClick={() => { setModalMode('orders'); setIsModalOpen(true); }} style={{ padding: '0.8rem 1.8rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Plus size={20} /> <span style={{ fontWeight: 800 }}>Nouvelle Commande</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem' }}>
        <TabBar tabs={tabs} active={view} onChange={setView} />
      </div>

      {/* Dynamic Content Frame */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          style={{ position: 'relative' }}
        >
          {view === 'dashboard' && <AnalyticsTab opportunities={opportunities} formatCurrency={formatCurrency} />}
          {view === 'orders' && <OrdersTab data={data} formatCurrency={formatCurrency} onOpenDetail={onOpenDetail} />}
          {view === 'products' && <CatalogTab data={data} formatCurrency={formatCurrency} onOpenDetail={onOpenDetail} />}
        </motion.div>
      </AnimatePresence>

      <RecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalConfig[modalMode]?.title}
        fields={Object.entries(modalConfig[modalMode]?.schema?.fields || {}).map(([name, f]) => ({ ...f, name }))}
        onSave={(f) => {
          addRecord('sales', modalMode, f);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default Sales;
