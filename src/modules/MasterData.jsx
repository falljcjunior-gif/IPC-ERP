import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Package, Plus, Globe, Building2, Database,
  Search, Filter, ChevronRight, LayoutGrid, List
} from 'lucide-react';
import { useStore } from '../store';
import EnterpriseView from '../components/EnterpriseView';
import { baseSchema } from '../schemas/base.schema.js';

/* ─── Helpers ─── */
const TabBar = ({ tabs, active, onChange }) => (
  <div className="nexus-card" style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.03)', padding: '0.4rem', borderRadius: '1rem', gap: '0.4rem', border: '1px solid var(--nexus-border)' }}>
    {tabs.map(t => {
      const isActive = active === t.id;
      return (
        <button 
          key={t.id} 
          onClick={() => onChange(t.id)} 
          style={{ 
            padding: '0.6rem 1.25rem', 
            borderRadius: '0.75rem', 
            border: 'none', 
            cursor: 'pointer', 
            fontWeight: 800, 
            fontSize: '0.8rem', 
            background: isActive ? 'white' : 'transparent', 
            color: isActive ? 'var(--nexus-primary)' : 'var(--nexus-text-muted)', 
            boxShadow: isActive ? 'var(--shadow-nexus)' : 'none',
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            transition: 'var(--transition-nexus)'
          }}
        >
          {React.cloneElement(t.icon, { size: 16, strokeWidth: isActive ? 3 : 2 })} 
          {t.label}
        </button>
      );
    })}
  </div>
);

/* ════════════════════════════════════
   MASTER DATA MODULE — Central Registry
   Now powered by IPC Platform Engine
   ════════════════════════════════════ */
const MasterData = ({ onOpenDetail }) => {
  const { shellView } = useStore();
  const [view, setView] = useState('contacts');

  return (
    <div style={{ padding: shellView?.mobile ? '1rem' : '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', minHeight: '100%' }}>
      
      {/* Nexus Header */}
      {!shellView?.mobile && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="nexus-glow" style={{ background: 'var(--nexus-primary)', padding: '6px', borderRadius: '10px' }}>
                <Database size={16} color="white" />
              </div>
              <span style={{ fontWeight: 900, fontSize: '0.7rem', color: 'var(--nexus-primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                Nexus Data Core — Central Registry
              </span>
            </div>
            <h1 className="nexus-gradient-text" style={{ fontSize: '3.5rem', fontWeight: 900, margin: 0, letterSpacing: '-2px' }}>
              Données Maîtres
            </h1>
            <p style={{ color: 'var(--nexus-text-muted)', fontSize: '1.1rem', fontWeight: 500, maxWidth: '650px', lineHeight: 1.6 }}>
              Gérez votre référentiel global de partenaires et votre catalogue d'articles avec une intégrité de données garantie.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
            <TabBar tabs={[
              { id: 'contacts', label: 'Contacts', icon: <Users size={16} /> },
              { id: 'catalog', label: 'Catalogue', icon: <Package size={16} /> }
            ]} active={view} onChange={setView} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="nexus-card" style={{ background: 'white', flex: 1, minHeight: '700px', padding: '1.5rem' }}>
        <AnimatePresence mode="wait">
          <motion.div 
            key={view} 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }} 
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <EnterpriseView 
              moduleId="base" 
              modelId={view}
              schema={baseSchema}
              onOpenDetail={onOpenDetail}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MasterData;
