import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Factory, Layers, Plus, Activity as ActivityIcon, 
  Database, CheckCircle2, AlertTriangle, ChevronRight, BarChart2
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import EnterpriseView from '../components/EnterpriseView';
import KpiCard from '../components/KpiCard';
import { productionSchema } from '../schemas/production.schema.js';

/* ─── Helpers ─── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } }
};

/* ════════════════════════════════════
   PRODUCTION MODULE — Full Enterprise
   Now powered by IPC Platform Engine
   ════════════════════════════════════ */
const Production = ({ onOpenDetail }) => {
  const { data } = useBusiness();
  const [view, setView] = useState('dashboard'); // 'dashboard', 'orders', 'boms'
  const { orders = [] } = data?.production || {};

  /* ─── Dashboard Renderer ─── */
  const renderDashboard = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        <KpiCard title="Ordres Actifs" value={`${orders.filter(o => o.statut === 'En cours').length} OF`} icon={<Factory size={20}/>} color="#06B6D4" />
        <KpiCard title="Alertes Retard" value="0 OF" icon={<AlertTriangle size={20}/>} color="#F59E0B" />
        <KpiCard title="Efficacité Qualité" value="98.5%" icon={<CheckCircle2 size={20}/>} color="#10B981" />
        <KpiCard title="Rendement (OEE)" value="84%" icon={<ActivityIcon size={20}/>} color="#8B5CF6" />
      </div>

      <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
         <div>
            <h3 style={{ fontWeight: 800, marginBottom: '1rem' }}>Planification Capacitaire</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>Optimisez le taux d'utilisation de vos postes de charge en temps réel. Le moteur IPC synchronise vos nomenclatures avec vos stocks.</p>
         </div>
         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: '8px solid var(--accent)', borderRightColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.5rem' }}>
               75%
            </div>
         </div>
      </div>
    </motion.div>
  );

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
       {/* Module Header Toolbar */}
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-subtle)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)' }}>
             {[
               { id: 'dashboard', label: 'Dashboard', icon: <BarChart2 size={16} /> },
               { id: 'orders', label: 'Ordres de Fab.', icon: <Factory size={16} /> },
               { id: 'boms', label: 'Nomenclatures', icon: <Database size={16} /> }
             ].map(t => (
               <button
                 key={t.id}
                 onClick={() => setView(t.id)}
                 style={{
                   padding: '6px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                   background: view === t.id ? 'var(--bg)' : 'transparent',
                   color: view === t.id ? 'var(--accent)' : 'var(--text-muted)',
                   fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px',
                   boxShadow: view === t.id ? 'var(--shadow-sm)' : 'none'
                 }}
               >
                 {t.icon} {t.label}
               </button>
             ))}
          </div>
       </div>

       <AnimatePresence mode="wait">
          {view === 'dashboard' ? (
             <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {renderDashboard()}
             </motion.div>
          ) : (
             <motion.div key="records" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <EnterpriseView 
                  moduleId="production" 
                  modelId={view}
                  schema={productionSchema}
                  onOpenDetail={onOpenDetail}
                />
             </motion.div>
          )}
       </AnimatePresence>
    </div>
  );
};

export default Production;
