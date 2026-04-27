import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, MapPin, History, AlertTriangle, 
  TrendingUp, TrendingDown, RefreshCcw, Database,
  Plus, Search, Filter, Download, ChevronRight,
  Activity, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import KpiCard from '../../../components/KpiCard';
import EnterpriseView from '../../../components/EnterpriseView';
import { inventorySchema } from '../../../schemas/inventory.schema';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const InventoryTab = ({ data, onOpenDetail, formatCurrency }) => {
  const products = data?.inventory?.products || [];
  const warehouses = data?.inventory?.warehouses || [];
  
  const stats = useMemo(() => {
    const alerts = products.filter(p => (p.stock || 0) <= (p.alerte || 0)).length;
    const valuation = products.reduce((s, p) => s + (p.stock || 0) * (p.coutUnit || 0), 0);
    return { alerts, valuation, rotation: 12.4 };
  }, [products]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" 
      style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}
    >
      {/* KPI Row */}
      <motion.div variants={item} className="nexus-card" style={{ gridColumn: 'span 3', padding: '1.5rem', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '10px', color: 'var(--nexus-primary)' }}><Database size={20} /></div>
          <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--nexus-primary)' }}>ACTIF</div>
        </div>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Valeur Stock</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>{formatCurrency(stats.valuation, true)}</div>
      </motion.div>

      <motion.div variants={item} className="nexus-card" style={{ gridColumn: 'span 3', padding: '1.5rem', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '8px', borderRadius: '10px', color: '#F59E0B' }}><AlertTriangle size={20} /></div>
          <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#F59E0B' }}>ATTENTION</div>
        </div>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Alertes Ruptures</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>{stats.alerts} SKU</div>
      </motion.div>

      <motion.div variants={item} className="nexus-card" style={{ gridColumn: 'span 3', padding: '1.5rem', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '10px', color: 'var(--nexus-primary)' }}><RefreshCcw size={20} /></div>
          <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--nexus-primary)' }}>+2.1%</div>
        </div>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Rotation (J)</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>{stats.rotation}</div>
      </motion.div>

      <motion.div variants={item} className="nexus-card" style={{ gridColumn: 'span 3', padding: '1.5rem', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.05)', padding: '8px', borderRadius: '10px', color: 'var(--nexus-secondary)' }}><Activity size={20} /></div>
          <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>98%</div>
        </div>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Fiabilité Inventaire</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>Nexus Optimal</div>
      </motion.div>
      {/* Mid Section: Warehouses + Analytics */}
      <div style={{ gridColumn: 'span 8' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem', color: 'var(--nexus-secondary)' }}>Network Topology</h3>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--nexus-text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Cartographie des zones de stockage Nexus.</p>
          </div>
          <button 
            onClick={() => onOpenDetail && onOpenDetail(null, 'inventory', 'warehouses')}
            className="nexus-card" style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900, background: 'var(--nexus-secondary)', color: 'white', border: 'none', cursor: 'pointer' }}>
            <Plus size={18} strokeWidth={3} /> Nouvel Entrepôt
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
           {warehouses.slice(0, 4).map(wh => (
             <motion.div 
               key={wh.id} 
               variants={item}
               whileHover={{ y: -5 }}
               onClick={() => onOpenDetail(wh.id, 'inventory', 'warehouses')}
               className="nexus-card"
               style={{ padding: '1.5rem', background: 'white', cursor: 'pointer' }}
             >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                   <div className="nexus-glow" style={{ background: 'var(--nexus-primary)', color: 'white', padding: '8px', borderRadius: '10px' }}>
                      <MapPin size={18} fill="white" />
                   </div>
                   <div style={{ 
                      padding: '4px 10px', borderRadius: '8px', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase',
                      background: wh.taux > 85 ? '#FEF2F2' : '#F0FDF4', 
                      color: wh.taux > 85 ? '#EF4444' : 'var(--nexus-primary)',
                      border: wh.taux > 85 ? '1px solid #FCA5A5' : '1px solid #86EFAC'
                   }}>
                      {wh.taux > 85 ? 'Saturation' : 'Optimal'}
                   </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                   <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>{wh.nom}</h4>
                   <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--nexus-text-muted)' }}>{wh.lieu}</div>
                </div>

                <div style={{ height: '6px', background: 'var(--nexus-border)', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                   <motion.div initial={{ width: 0 }} animate={{ width: `${wh.taux}%` }} transition={{ duration: 1, ease: "easeOut" }} 
                     style={{ height: '100%', background: wh.taux > 85 ? '#EF4444' : 'var(--nexus-primary)' }} 
                   />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)' }}>
                   <span>{wh.taux}% utilisé</span>
                   <span>{Math.round(wh.capacite * wh.taux / 100)} SKU</span>
                </div>
             </motion.div>
           ))}
        </div>
      </div>

      {/* Side Inventory Activity */}
      <div style={{ gridColumn: 'span 4' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem', color: 'var(--nexus-secondary)' }}>Live Analytics</h3>
            <div className="nexus-glow" style={{ padding: '8px', borderRadius: '50%', background: 'var(--nexus-primary)', animation: 'pulse 2s infinite' }}>
               <Activity size={16} color="white" />
            </div>
         </div>

         <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <motion.div variants={item} className="nexus-card" style={{ padding: '1.5rem', background: 'var(--nexus-secondary)', color: 'white' }}>
               <div style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem', opacity: 0.7 }}>Stock Prediction</div>
               <div style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>Optimal (12 Jours)</div>
               <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6, fontWeight: 500, lineHeight: 1.5 }}>
                 Les flux actuels garantissent une continuité opérationnelle sans rupture sur les SKU critiques.
               </p>
            </motion.div>

            <motion.div variants={item} className="nexus-card" style={{ padding: '1.5rem', background: 'white' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <History size={18} color="var(--nexus-primary)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>Mouvements Récents</span>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { type: 'IN', item: 'Briques G12', qty: '+500', time: '12:40' },
                    { type: 'OUT', item: 'Ciment CPJ', qty: '-120', time: '11:15' },
                    { type: 'IN', item: 'Sable Fin', qty: '+20t', time: '09:30' }
                  ].map((m, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem' }}>
                       <div style={{ 
                         padding: '4px 8px', borderRadius: '6px', fontWeight: 900, fontSize: '0.65rem',
                         background: m.type === 'IN' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                         color: m.type === 'IN' ? 'var(--nexus-primary)' : '#EF4444'
                       }}>{m.type}</div>
                       <div style={{ flex: 1, fontWeight: 800 }}>{m.item}</div>
                       <div style={{ color: 'var(--nexus-text-muted)', fontWeight: 700 }}>{m.qty}</div>
                    </div>
                  ))}
               </div>
            </motion.div>
         </div>
      </div>

      {/* Stock Management Ledger */}
      <div style={{ gridColumn: 'span 12', marginTop: '1rem' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem', color: 'var(--nexus-secondary)' }}>Inventory Ledger</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
               <button 
                 onClick={() => onOpenDetail && onOpenDetail(null, 'inventory', 'movements')}
                 className="nexus-card" style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900, background: 'var(--nexus-primary)', color: 'white', border: 'none', cursor: 'pointer' }}>
                 <ArrowUpRight size={18} strokeWidth={3} /> Nouveau Mouvement
               </button>
            </div>
         </div>
      </div>
    </motion.div>
  );
};

export default InventoryTab;
