import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Package, Plus, Globe, Building2, Database,
  Search, Filter, ChevronRight, LayoutGrid, List
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import EnterpriseView from '../components/EnterpriseView';
import { baseSchema } from '../schemas/base.schema.js';

/* ─── Helpers ─── */
const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', background: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: '0.9rem', border: '1px solid var(--border)', gap: '0.2rem', width: 'fit-content' }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)} style={{ padding: '0.45rem 1rem', borderRadius: '0.7rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', background: active === t.id ? 'var(--bg)' : 'transparent', color: active === t.id ? 'var(--accent)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {t.icon} {t.label}
      </button>
    ))}
  </div>
);

/* ════════════════════════════════════
   MASTER DATA MODULE — Central Registry
   Now powered by IPC Platform Engine
   ════════════════════════════════════ */
const MasterData = ({ onOpenDetail }) => {
  const [view, setView] = useState('contacts'); // 'contacts' | 'catalog'

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
       {/* Module Header Toolbar */}
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', marginBottom: '0.4rem' }}>
                <Database size={16} /><span style={{ fontWeight: 800, fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Data Core — Central Repository</span>
             </div>
             <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Données Maîtres</h1>
             <p style={{ color: 'var(--text-muted)', margin: '0.3rem 0 0 0', fontSize: '0.92rem' }}>Référentiel global · Partenaires · Catalogue Articles</p>
          </div>
          <TabBar tabs={[
             { id: 'contacts', label: 'Contacts', icon: <Users size={16} /> },
             { id: 'catalog', label: 'Catalogue', icon: <Package size={16} /> }
          ]} active={view} onChange={setView} />
       </div>

       <div className="glass" style={{ borderRadius: '1.5rem', flex: 1, minHeight: '600px' }}>
          <AnimatePresence mode="wait">
             <motion.div key={view} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
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
