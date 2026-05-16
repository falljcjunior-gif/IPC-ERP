import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Package, ShoppingBag, Briefcase, 
  Truck, Activity
} from 'lucide-react';
import { useStore } from '../../store';
import { useCanSeeSubTab } from '../../store/selectors';
import { registry } from '../../services/Registry';

import RecordModal from '../../components/RecordModal';
import BarcodeScanner from '../../components/BarcodeScanner';
import InventoryTab from './tabs/InventoryTab';
import PurchaseTab from './tabs/PurchaseTab';
import ProjectTab from './tabs/ProjectTab';
import AnimatedCounter from '../../components/Dashboard/AnimatedCounter';
import '../../components/GlobalDashboard.css';

const ALL_TABS = [
  { id: 'inventory', label: 'Entrepôts',  icon: <Package size={16} /> },
  { id: 'purchase',  label: 'Achats',     icon: <ShoppingBag size={16} /> },
  { id: 'project',   label: 'Projets',    icon: <Briefcase size={16} /> },
];

const LogisticsHub = ({ onOpenDetail, accessLevel, appId }) => {
  const { data, addRecord, updateRecord, formatCurrency, shellView } = useStore();
  const canSee = useCanSeeSubTab();
  const moduleId = appId === 'purchase' ? 'purchase' : 'inventory';
  const TABS = ALL_TABS.filter(t => canSee(moduleId, t.id));
  const [mainTab, setMainTab] = useState(() => {
    const initial = appId === 'purchase' ? 'purchase' : 'inventory';
    return TABS.some(t => t.id === initial) ? initial : (TABS[0]?.id || initial);
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [modalMode, setModalMode] = useState(appId === 'purchase' ? 'purchase' : 'movement'); 

  const isPurchaseContext = appId === 'purchase';

  const handleScan = (code) => {
    setIsScannerOpen(false);
    const product = data?.inventory?.products?.find(p => p.ref === code || p.ean === code);
    if (product) onOpenDetail(product.id, 'inventory', 'products');
    else { setModalMode('movement'); setIsModalOpen(true); }
  };

  const totalProducts = data?.inventory?.products?.length || 0;
  const totalOrders   = data?.purchase?.orders?.length || 0;

  // Real OTIF: On-Time In-Full from shipments
  const otifPct = React.useMemo(() => {
    const shipments = data?.inventory?.movements?.filter(m => m.type === 'Sortie' || m.type === 'Expédition') || [];
    if (shipments.length === 0) return null;
    const delivered = shipments.filter(s => s.statut === 'Livré' || s.statut === 'Confirmé').length;
    return Math.round((delivered / shipments.length) * 100);
  }, [data?.inventory?.movements]);

  return (
    <div className="luxury-dashboard-container" style={{ padding: '3rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      <AnimatePresence>
        {isScannerOpen && <BarcodeScanner onScan={handleScan} onClose={() => setIsScannerOpen(false)} />}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <div className="luxury-header" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div className="luxury-subtitle">
            {isPurchaseContext ? 'Nexus Procurement Core' : 'Nexus Supply Chain & Logistics'}
          </div>
          <h1 className="luxury-title">
            {isPurchaseContext ? <>Procurement <strong>Hub</strong></> : <>Logistics <strong>Control</strong></>}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-end' }}>
          {/* Stat rapide */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {isPurchaseContext ? 'Commandes actives' : 'Références stock'}
            </div>
            <div className="luxury-value-massive" style={{ fontSize: '3rem', color: '#111827' }}>
              <AnimatedCounter from={0} to={isPurchaseContext ? totalOrders : totalProducts} duration={1.5} formatter={v => `${v}`} />
            </div>
          </div>

          {/* OTIF Badge */}
          <div className="luxury-widget" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 2rem' }}>
            <Activity size={24} color="#10B981" />
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>Performance OTIF</div>
              <div style={{ fontWeight: 800, fontSize: '1.5rem', color: '#111827' }}>{otifPct !== null ? `${otifPct}%` : '—'}</div>
            </div>
          </div>

          {/* Scanner */}
          <button onClick={() => setIsScannerOpen(true)} className="luxury-widget" style={{ width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', background: 'rgba(255,255,255,0.8)' }}>
            <Package size={24} color="#111827" />
          </button>

          {/* CTA */}
          {accessLevel === 'write' && (
            <button 
              onClick={() => { 
                setModalMode(mainTab === 'purchase' ? 'purchase' : mainTab === 'project' ? 'project' : 'movement');
                setIsModalOpen(true); 
              }}
              className="luxury-widget"
              style={{ padding: '1rem 2rem', background: '#111827', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem', border: 'none', cursor: 'pointer', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)', borderRadius: '1.5rem' }}
            >
              <Plus size={20} />
              <span style={{ fontWeight: 600, letterSpacing: '0.05em' }}>
                {mainTab === 'purchase' ? 'Nouvel Achat' : mainTab === 'project' ? 'Nouvel Actif' : 'Nouveau Flux'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ── FROSTED-GLASS TABS ── */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.5)', padding: '0.5rem', borderRadius: '1.5rem', backdropFilter: 'blur(10px)', marginBottom: '3rem', width: 'fit-content' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setMainTab(t.id)}
            style={{
              padding: '0.8rem 2rem', borderRadius: '1rem', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s',
              background: mainTab === t.id ? 'white' : 'transparent',
              color: mainTab === t.id ? '#111827' : '#64748B',
              boxShadow: mainTab === t.id ? '0 10px 20px -10px rgba(0,0,0,0.1)' : 'none',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div style={{ flex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={mainTab}
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {mainTab === 'inventory' && <InventoryTab data={data} formatCurrency={formatCurrency} onOpenDetail={onOpenDetail} />}
            {mainTab === 'purchase'  && <PurchaseTab  data={data} formatCurrency={formatCurrency} onOpenDetail={onOpenDetail} />}
            {mainTab === 'project'   && <ProjectTab   data={data} onOpenDetail={onOpenDetail} updateRecord={updateRecord} />}
          </motion.div>
        </AnimatePresence>
      </div>

      <RecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          modalMode === 'purchase' ? "Demande d'Achat Stratégique" :
          modalMode === 'project'  ? 'Action Opérationnelle Nexus'  :
          'Enregistrement de Flux Nexus'
        }
        fields={
          modalMode === 'purchase' ? Object.entries(registry.getSchema('purchase')?.models?.orders?.fields || {}).map(([name, f]) => ({ ...f, name })) :
          modalMode === 'project'  ? Object.entries(registry.getSchema('projects')?.models?.tasks?.fields || {}).map(([name, f]) => ({ ...f, name })) :
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

export default React.memo(LogisticsHub);
