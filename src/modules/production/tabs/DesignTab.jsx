import React from 'react';
import { motion } from 'framer-motion';
import { 
  Layers, Database, Plus, Search, Filter,
  MoreVertical, ChevronRight, Edit3, Trash2,
  Package, Box, Share2, ClipboardList
} from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, scale: 0.98 }, show: { opacity: 1, scale: 1 } };

const DesignTab = ({ data, onOpenDetail }) => {
  const boms = data?.production?.boms || [];

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Search & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1rem', flex: 1, maxWidth: '500px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="glass" placeholder="Rechercher une nomenclature (BOM)..." 
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.8rem', borderRadius: '1rem', border: 'none', fontSize: '0.85rem' }} />
          </div>
        </div>
        <button 
          onClick={() => onOpenDetail && onOpenDetail(null, 'production', 'boms')}
          className="btn-primary" style={{ padding: '0.8rem 1.75rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900, background: '#8B5CF6', borderColor: '#8B5CF6' }}>
          <Plus size={20} /> Nouvelle BOM
        </button>
      </div>

      {/* BOM Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {boms.map((bom) => (
          <motion.div 
            key={bom.id} 
            variants={item}
            whileHover={{ y: -5 }}
            className="glass" 
            style={{ padding: '2rem', borderRadius: '2rem', border: '1px solid var(--border)', position: 'relative' }}
          >
            {/* Top Badge */}
            <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
              <div style={{ background: bom.status === 'Actif' ? '#10B98115' : '#F59E0B15', color: bom.status === 'Actif' ? '#10B981' : '#F59E0B', padding: '4px 10px', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase' }}>
                {bom.status}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '2rem' }}>
               <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: '1rem', color: '#8B5CF6' }}>
                  <Layers size={24} />
               </div>
               <div>
                  <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text)' }}>{bom.product}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>Version {bom.version}</div>
               </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1.25rem', background: 'var(--bg-subtle)', borderRadius: '1.25rem', marginBottom: '1.5rem' }}>
               <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Composants</div>
                  <div style={{ fontWeight: 900, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Box size={14} /> {bom.components}
                  </div>
               </div>
               <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Type Flux</div>
                  <div style={{ fontWeight: 900, fontSize: '1rem' }}>{bom.type}</div>
               </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={() => onOpenDetail && onOpenDetail(bom, 'production', 'boms')}
                className="glass" style={{ flex: 1, padding: '0.75rem', borderRadius: '1rem', fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
                <ClipboardList size={14} /> Voir Recette
              </button>
              <button 
                onClick={() => onOpenDetail && onOpenDetail(bom, 'production', 'boms')}
                className="glass" style={{ padding: '0.75rem', borderRadius: '1rem' }}>
                <Edit3 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default DesignTab;
