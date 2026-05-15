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
import BarcodeScanner from '../../components/BarcodeScanner';
import { IPCReportGenerator } from '../../utils/PDFExporter';

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
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleScan = (code) => {
    setIsScannerOpen(false);
    alert(`Ordre de Fabrication Détecté : ${code}. Synchronisation avec l'atelier...`);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // [GO-LIVE] Métriques calculées depuis les workOrders réels — affichent "N/A"
      // tant qu'aucune donnée de production n'a été enregistrée.
      const workOrders = data?.production?.workOrders || [];
      const completed  = workOrders.filter(w => w.status === 'completed' || w.status === 'Terminé');
      const totalRuns  = workOrders.length;
      const okRuns     = completed.length;
      const availability = totalRuns > 0 ? `${((okRuns / totalRuns) * 100).toFixed(1)}%` : 'N/A';
      const performance  = totalRuns > 0
        ? `${(completed.reduce((s, w) => s + (w.efficiency || 0), 0) / Math.max(1, okRuns)).toFixed(1)}%`
        : 'N/A';
      const quality      = totalRuns > 0
        ? `${(completed.reduce((s, w) => s + (w.qualityRate || 0), 0) / Math.max(1, okRuns)).toFixed(1)}%`
        : 'N/A';

      await IPCReportGenerator.generateFinancialStatement({
        title: "Rapport de Rendement Industriel (OEE)",
        metrics: [
          { label: 'Disponibilité', value: availability },
          { label: 'Performance',   value: performance  },
          { label: 'Qualité',       value: quality      },
        ],
        rows: workOrders.slice(0, 20).map(wo => ({
          module:      wo.lineId || wo.line || '—',
          description: wo.product || wo.description || '—',
          status:      wo.status || 'En cours',
        })),
      });
    } finally {
      setIsExporting(false);
    }
  };

  const tabs = [
    { id: 'analytics', label: 'EFFICACITÉ (OEE)', icon: <BarChart3 size={16} /> },
    { id: 'execution', label: 'ORDRES DE FAB.', icon: <Factory size={16} /> },
    { id: 'design', label: 'INGÉNIERIE', icon: <Layers size={16} /> },
    { id: 'maintenance', label: 'MAINTENANCE', icon: <Wrench size={16} /> },
  ];

  const modalConfig = {
    workOrders: { title: 'Lancement d\'Ordre de Fabrication', schema: productionSchema.models.workOrders },
    boms: { title: 'Configuration de Nomenclature', schema: productionSchema.models.boms }
  };

  return (
    <div style={{ padding: shellView?.mobile ? '1rem' : '3rem', display: 'flex', flexDirection: 'column', gap: '3rem', minHeight: '100%' }}>
      
      <AnimatePresence>
        {isScannerOpen && (
          <BarcodeScanner onScan={handleScan} onClose={() => setIsScannerOpen(false)} />
        )}
      </AnimatePresence>

      {/* Nexus Production Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="nexus-glow" style={{ background: 'var(--nexus-primary)', padding: '8px', borderRadius: '12px' }}>
              <Factory size={20} color="white" />
            </div>
            <span style={{ fontWeight: 900, fontSize: '0.75rem', color: 'var(--nexus-primary)', textTransform: 'uppercase', letterSpacing: '3px' }}>
              Nexus Industrial Core
            </span>
          </div>
          <h1 className="nexus-gradient-text" style={{ fontSize: shellView?.mobile ? '2.5rem' : '4rem', fontWeight: 900, margin: 0, letterSpacing: '-3px', lineHeight: 0.9 }}>
            Production
          </h1>
          <p style={{ color: 'var(--nexus-text-muted)', fontSize: '1.2rem', fontWeight: 500, maxWidth: '750px', lineHeight: 1.6, margin: '1rem 0 0 0' }}>
            Centre de commandement industriel Nexus : Pilotage des flux de fabrication, maintenance prédictive et optimisation OEE.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
           <div className="nexus-card" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '1rem 2rem', background: 'white' }}>
              <Activity size={24} color="var(--nexus-primary)" />
              <div style={{ textAlign: 'right' }}>
                 <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Rendement Usine</div>
                 <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>98.2% OEE</div>
              </div>
           </div>

           <button onClick={handleExport} disabled={isExporting} className="nexus-card" style={{ width: '56px', height: '56px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'white' }}>
             <Download size={22} color="var(--nexus-secondary)" />
           </button>

           <button onClick={() => setIsScannerOpen(true)} className="nexus-card" style={{ width: '56px', height: '56px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'white' }}>
             <Zap size={22} color="var(--nexus-secondary)" />
           </button>
           
           <PermissionGuard module="production" level="write">
              <button className="nexus-card" 
                 onClick={() => { setModalMode('workOrders'); setIsModalOpen(true); }}
                 style={{ padding: '1rem 2.5rem', background: 'var(--nexus-secondary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                 <Plus size={22} strokeWidth={3} /> LANCER PRODUCTION
              </button>
           </PermissionGuard>
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
