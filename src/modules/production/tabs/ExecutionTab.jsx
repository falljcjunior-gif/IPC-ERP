import React from 'react';
import { motion } from 'framer-motion';
import { 
  Factory, Play, Pause, CheckCircle2, 
  Clock, AlertTriangle, MoreVertical, Plus,
  Search, Filter, Layers, Zap, Settings, ArrowRight
} from 'lucide-react';
import Chip from '../../marketing/components/Chip';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, scale: 0.98 }, show: { opacity: 1, scale: 1 } };

const ExecutionTab = ({ data, onOpenDetail }) => {
  const workOrders = data?.production?.workOrders || [
    { id: 'OF-2026-042', produit: 'Bloc Béton 15x20x40', qte: 5000, progress: 65, due: '2026-04-15', status: 'En cours', priority: 'Haute' },
    { id: 'OF-2026-043', produit: 'Pavé Autobloquant Gris', qte: 1200, progress: 100, due: '2026-04-12', status: 'Terminé', priority: 'Normale' },
    { id: 'OF-2026-044', produit: 'Bordure T2', qte: 800, progress: 15, due: '2026-04-18', status: 'Planifié', priority: 'Urgente' },
  ];

  const getPriorityColor = (p) => {
    if (p === 'Urgente') return '#EF4444';
    if (p === 'Haute') return '#F59E0B';
    return '#3B82F6';
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Search & Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1rem', flex: 1, maxWidth: '600px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="glass" placeholder="Rechercher un Ordre de Fabrication..." 
              style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', borderRadius: '1rem', border: 'none', fontSize: '0.9rem' }} />
          </div>
          <button className="glass" style={{ padding: '0.8rem 1.25rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '0.85rem' }}>
            <Filter size={18} /> Filtres
          </button>
        </div>
        <button className="btn-primary" style={{ padding: '0.8rem 1.75rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900, background: '#06B6D4', borderColor: '#06B6D4' }}>
          <Plus size={20} /> Nouvel OF
        </button>
      </div>

      {/* Production List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {workOrders.map((of) => (
          <motion.div 
            key={of.id} 
            variants={item}
            whileHover={{ x: 10, background: 'rgba(6, 182, 212, 0.02)' }}
            className="glass" 
            style={{ 
              padding: '1.5rem 2.5rem', borderRadius: '1.75rem', border: '1px solid var(--border)', 
              display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 50px', alignItems: 'center', 
              gap: '2.5rem', cursor: 'pointer', transition: '0.2s'
            }}
          >
            {/* Product & OF ID */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: '1rem', color: '#06B6D4' }}>
                  <Factory size={22} />
                </div>
                <div style={{ position: 'absolute', top: -4, right: -4, width: '10px', height: '10px', borderRadius: '50%', background: getPriorityColor(of.priority), border: '2px solid var(--bg)' }} title={`Priorité: ${of.priority}`} />
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--text)' }}>{of.produit}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>OF ID: {of.id}</div>
              </div>
            </div>

            {/* Progress Bar Industrial Style */}
            <div>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 800 }}>
                 <span style={{ color: 'var(--text-muted)' }}>Avancement</span>
                 <span style={{ color: of.progress === 100 ? '#10B981' : '#06B6D4' }}>{of.progress}%</span>
               </div>
               <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                 <motion.div 
                   initial={{ width: 0 }} 
                   animate={{ width: `${of.progress}%` }} 
                   transition={{ duration: 1 }}
                   style={{ 
                     height: '100%', 
                     background: of.progress === 100 ? '#10B981' : 'linear-gradient(90deg, #06B6D4 0%, #3B82F6 100%)', 
                     borderRadius: '4px' 
                   }} 
                 />
               </div>
            </div>

            {/* Output Quantity */}
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.4rem' }}>Quantité OF</div>
              <div style={{ fontWeight: 900, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {of.qte.toLocaleString()} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Pcs</span>
              </div>
            </div>

            {/* Status & Deadline */}
            <div>
               <Chip 
                 label={of.status} 
                 color={of.status === 'Terminé' ? '#10B981' : of.status === 'En cours' ? '#06B6D4' : '#F59E0B'} 
               />
               <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                 <Clock size={12} /> {of.due}
               </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="glass" style={{ padding: '0.6rem', borderRadius: '0.8rem' }}>
                <MoreVertical size={18} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Industrial Alerts / Context */}
      <div className="glass" style={{ padding: '1.25rem 2rem', borderRadius: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem', background: '#F59E0B05', border: '1px solid #F59E0B20' }}>
         <div style={{ background: '#F59E0B15', padding: '10px', borderRadius: '12px', color: '#F59E0B' }}>
            <AlertTriangle size={20} />
         </div>
         <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#F59E0B' }}>Attention : Rupture de stock imminente (Ciment 42.5)</div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>L'OF-2026-044 nécessite 12 tonnes. Stock actuel : 4 tonnes.</p>
         </div>
         <button className="btn-secondary" style={{ padding: '0.6rem 1.2rem', borderRadius: '0.8rem', fontSize: '0.8rem', fontWeight: 800 }}>Commander</button>
      </div>
    </motion.div>
  );
};

export default ExecutionTab;
