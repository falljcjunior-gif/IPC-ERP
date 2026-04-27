import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Filter, BarChart3, ShoppingCart, 
  Tag, Activity, Share2, Settings, Download, 
  TrendingUp, Target, FileText
} from 'lucide-react';
import { useStore } from '../../store';
import { salesSchema } from '../../schemas/sales.schema';

// Components
import TabBar from '../marketing/components/TabBar';
import RecordModal from '../../components/RecordModal';

// Tabs
import AnalyticsTab from './tabs/AnalyticsTab';
import OrdersTab from './tabs/OrdersTab';
import CatalogTab from './tabs/CatalogTab';

const Sales = ({ onOpenDetail, accessLevel }) => {
  const { data, addRecord, formatCurrency, shellView } = useStore();
  const [view, setView] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('orders');

  const opportunities = useMemo(() => data?.crm?.opportunities || [], [data?.crm?.opportunities]);

  const tabs = [
    { id: 'dashboard', label: 'Performance Hub', icon: <BarChart3 size={16} /> },
    { id: 'orders', label: 'Espace Commandes', icon: <ShoppingCart size={16} /> },
    { id: 'products', label: 'Catalogue Offres', icon: <Tag size={16} /> }
  ];

  const modalConfig = {
    orders: { title: 'Nouvelle Commande Nexus', schema: salesSchema.models.orders },
    products: { title: 'Nouvelle Offre Catalogue', schema: salesSchema.models.products }
  };

  return (
    <div style={{ padding: shellView?.mobile ? '1rem' : '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', minHeight: '100%' }}>
      
      {/* Nexus Sales Header */}
      {!shellView?.mobile ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="nexus-glow" style={{ background: 'var(--nexus-primary)', padding: '6px', borderRadius: '10px' }}>
                <TrendingUp size={16} color="white" />
              </div>
              <span style={{ fontWeight: 900, fontSize: '0.7rem', color: 'var(--nexus-primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                Nexus Sales Engine Intelligence
              </span>
            </div>
            <h1 className="nexus-gradient-text" style={{ fontSize: '3.5rem', fontWeight: 900, margin: 0, letterSpacing: '-2px' }}>
              Revenue Hub
            </h1>
            <p style={{ color: 'var(--nexus-text-muted)', fontSize: '1.1rem', fontWeight: 500, maxWidth: '650px', lineHeight: 1.6 }}>
              Optimisez votre cycle de vente et pilotez vos flux de revenus avec le moteur d'exécution commerciale Nexus.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div className="nexus-card" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'white' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Objectif Q2</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--nexus-primary)' }}>85.4%</div>
              </div>
              <Target size={24} color="var(--nexus-primary)" />
            </div>

            <button 
              className="nexus-card" 
              onClick={() => alert('Génération du rapport Nexus Sales...')}
              style={{ background: 'white', padding: '1rem', border: '1px solid var(--nexus-border)', cursor: 'pointer' }}
            >
              <Download size={20} color="var(--nexus-secondary)" />
            </button>
            
            {accessLevel === 'write' && (
              <button 
                className="nexus-card" 
                onClick={() => { setModalMode('orders'); setIsModalOpen(true); }}
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
                Nouvelle Commande
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem' }} className="nexus-gradient-text">Ventes</h2>
          <button onClick={() => { setModalMode('orders'); setIsModalOpen(true); }} className="nexus-card" style={{ background: 'var(--nexus-primary)', padding: '0.75rem', borderRadius: '14px', color: 'white' }}>
            <Plus size={24} />
          </button>
        </div>
      )}

      {/* Navigation Nexus */}
      <div className="nexus-card" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', padding: '0.5rem', borderRadius: '1.5rem' }}>
        <TabBar tabs={tabs} active={view} onChange={setView} />
      </div>

      {/* Content Nexus */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, scale: 0.98, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -20 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ minHeight: '60vh' }}
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
