import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Factory, CheckCircle2, 
  Clock, AlertTriangle, MoreVertical, Plus,
  Search, Filter, Play, ChevronRight, ShoppingCart
} from 'lucide-react';
import Chip from '../../marketing/components/Chip';
import { useStore } from '../../../store';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, scale: 0.98 }, show: { opacity: 1, scale: 1 } };

const ExecutionTab = ({ data, onOpenDetail, onNewWorkOrder }) => {
  const { launchProductionOrder, updateRecord } = useStore();
  const workOrders = data?.production?.workOrders || [];
  const products = data?.inventory?.products || [];
  const [expandedId, setExpandedId] = useState(null);

  // Compute real stock alerts — articles below threshold
  const stockAlerts = products.filter(p => (p.qteStock || 0) < (p.seuilAlerte || 0));

  const getPriorityColor = (p) => {
    if (p === 'Urgente') return '#EF4444';
    if (p === 'Haute') return '#F59E0B';
    return '#3B82F6';
  };

  const handleProgressChange = (order, newVal) => {
    const updatedStatut = newVal >= 100 ? 'Terminé' : order.statut === 'Planifié' ? 'Planifié' : 'En cours';
    updateRecord('production', 'workOrders', order.id, { ...order, progression: newVal, statut: updatedStatut });
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
        <button 
          onClick={() => onNewWorkOrder && onNewWorkOrder()}
          className="btn-primary" style={{ padding: '0.8rem 1.75rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900, background: '#06B6D4', borderColor: '#06B6D4' }}>
          <Plus size={20} /> Nouvel OF
        </button>
      </div>

      {/* Production List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {workOrders.map((of) => (
          <motion.div 
            key={of.id} 
            variants={item}
          >
            {/* Main OF Row */}
            <motion.div
              whileHover={{ x: 4 }}
              onClick={() => setExpandedId(expandedId === of.id ? null : of.id)}
              className="glass" 
              style={{ 
                padding: '1.5rem 2rem', borderRadius: '1.75rem', border: `1px solid ${expandedId === of.id ? '#06B6D450' : 'var(--border)'}`,
                display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr auto', alignItems: 'center', 
                gap: '2rem', cursor: 'pointer', transition: 'all 0.2s'
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
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>OF: {of.num} • {of.qte?.toLocaleString()} pcs</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 800 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Avancement</span>
                  <span style={{ color: (of.progression || 0) >= 100 ? '#10B981' : '#06B6D4' }}>{of.progression || 0}%</span>
                </div>
                <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${of.progression || 0}%` }} 
                    transition={{ duration: 1 }}
                    style={{ 
                      height: '100%', 
                      background: (of.progression || 0) >= 100 ? '#10B981' : 'linear-gradient(90deg, #06B6D4 0%, #3B82F6 100%)', 
                      borderRadius: '4px' 
                    }} 
                  />
                </div>
              </div>

              {/* Deadline */}
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.4rem' }}>Échéance</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} color="var(--text-muted)" /> {of.echeance}
                </div>
              </div>

              {/* Status */}
              <div>
                <Chip 
                  label={of.statut} 
                  color={of.statut === 'Terminé' ? '#10B981' : of.statut === 'En cours' ? '#06B6D4' : '#F59E0B'} 
                />
              </div>

              {/* Expand Toggle */}
              <motion.div animate={{ rotate: expandedId === of.id ? 90 : 0 }}>
                <ChevronRight size={20} color="var(--text-muted)" />
              </motion.div>
            </motion.div>

            {/* Expanded Panel — Slider & Launch */}
            {expandedId === of.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ background: 'var(--bg-subtle)', borderRadius: '0 0 1.75rem 1.75rem', padding: '1.5rem 2rem', border: '1px solid #06B6D430', borderTop: 'none', marginTop: '-0.5rem' }}
              >
                {/* Progress Slider */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '0.75rem' }}>
                    Mettre à jour la progression : <span style={{ color: '#06B6D4', fontWeight: 900 }}>{of.progression || 0}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={of.progression || 0}
                    onChange={(e) => handleProgressChange(of, parseInt(e.target.value))}
                    style={{ 
                      width: '100%', 
                      accentColor: '#06B6D4',
                      height: '6px',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    <span>0%</span><span>50%</span><span>100%</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {of.statut === 'Planifié' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); launchProductionOrder(of); }}
                      style={{ padding: '0.7rem 1.5rem', borderRadius: '1rem', background: '#06B6D4', color: 'white', border: 'none', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                    >
                      <Play size={16} /> Lancer cet OF
                    </button>
                  )}
                  {of.statut === 'En cours' && (of.progression || 0) >= 100 && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); updateRecord('production', 'workOrders', of.id, { ...of, statut: 'Terminé' }); }}
                      style={{ padding: '0.7rem 1.5rem', borderRadius: '1rem', background: '#10B981', color: 'white', border: 'none', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                    >
                      <CheckCircle2 size={16} /> Marquer Terminé
                    </button>
                  )}
                  <button 
                    onClick={(e) => { e.stopPropagation(); onOpenDetail && onOpenDetail('production', 'workOrders', of); }}
                    style={{ padding: '0.7rem 1.25rem', borderRadius: '1rem', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                  >
                    <MoreVertical size={16} /> Détails
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Real Stock Alerts */}
      {stockAlerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h4 style={{ margin: 0, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={16} /> Alertes de Stock Réelles ({stockAlerts.length})
          </h4>
          {stockAlerts.map(p => (
            <div key={p.id} className="glass" style={{ padding: '1.25rem 2rem', borderRadius: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem', background: '#F59E0B05', border: '1px solid #F59E0B30' }}>
              <div style={{ background: '#F59E0B15', padding: '10px', borderRadius: '12px', color: '#F59E0B' }}>
                <AlertTriangle size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#F59E0B' }}>Rupture imminente : {p.designation}</div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Stock actuel : <strong>{p.qteStock} {p.unite}</strong> — Seuil d'alerte : {p.seuilAlerte} {p.unite}
                </p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onNewWorkOrder && onNewWorkOrder(p.id); }}
                className="btn" style={{ background: '#F59E0B', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingCart size={14} /> Commander
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ExecutionTab;
