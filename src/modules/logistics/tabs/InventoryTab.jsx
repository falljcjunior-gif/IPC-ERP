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
    const rotation = 0; // Case index
    return { alerts, valuation, rotation };
  }, [products]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Stock Excellence KPIs */}
      <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
        <KpiCard title="Valeur du Stock" value={formatCurrency(stats.valuation, true)} icon={<Database size={22} />} color="#4F46E5" />
        <KpiCard title="Alerte Ruptures" value={stats.alerts} icon={<AlertTriangle size={22} />} color="#F59E0B" />
        <KpiCard title="Rotation Stock" value={stats.rotation} icon={<RefreshCcw size={22} />} color="#0D9488" />
        <KpiCard title="OTIF (Logistique)" value="0%" icon={<Activity size={22} />} color="#6366F1" />
      </motion.div>

      {/* Warehouses Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div>
              <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem' }}>Cartographie des Entrepôts</h3>
              <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Visualisez la capacité et l'occupation de vos zones de stockage.</p>
           </div>
           <button 
              onClick={() => onOpenDetail && onOpenDetail(null, 'inventory', 'warehouses')}
              className="btn-primary" style={{ padding: '0.7rem 1.75rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900, background: '#4F46E5', borderColor: '#4F46E5' }}>
              <Plus size={20} /> Nouvel Entrepôt
           </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
           {warehouses.map(wh => (
             <motion.div 
               key={wh.id} 
               variants={item}
               whileHover={{ y: -5 }}
               className="glass"
               style={{ padding: '1.75rem', borderRadius: '2rem', border: '1px solid var(--border)', cursor: 'pointer' }}
             >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                   <div style={{ background: '#4F46E510', color: '#4F46E5', padding: '10px', borderRadius: '1rem' }}>
                      <MapPin size={22} />
                   </div>
                   <div style={{ 
                      padding: '4px 10px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase',
                      background: wh.taux > 85 ? '#F59E0B15' : '#10B98115', 
                      color: wh.taux > 85 ? '#F59E0B' : '#10B981'
                   }}>
                      {wh.taux > 85 ? 'Saturation' : 'Optimal'}
                   </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                   <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 900 }}>{wh.nom}</h4>
                   <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>{wh.lieu}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Occupation</span>
                      <span>{wh.taux}%</span>
                   </div>
                   <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${wh.taux}%` }} transition={{ duration: 1 }} style={{ height: '100%', background: wh.taux > 85 ? '#F59E0B' : '#4F46E5', borderRadius: '4px' }} />
                   </div>
                   <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'right' }}>
                      Capacité : {wh.capacite.toLocaleString()} m³
                   </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Package size={14} /> {Math.round(wh.capacite * wh.taux / 100)} SKU en stock
                   </div>
                   <ChevronRight size={18} color="#4F46E5" />
                </div>
             </motion.div>
           ))}
        </div>
      </div>

      {/* Stock List with High-Density UI */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem' }}>Gestion Avancée des Stocks</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
               <button className="glass" style={{ padding: '0.7rem 1.25rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '0.85rem' }}>
                 <History size={18} /> Journal des Mouvements
               </button>
               <button 
                 onClick={() => onOpenDetail && onOpenDetail(null, 'inventory', 'movements')}
                 className="btn-primary" style={{ padding: '0.7rem 1.75rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900, background: '#4F46E5', borderColor: '#4F46E5' }}>
                 <ArrowUpRight size={20} /> Entrée de Stock
               </button>
            </div>
         </div>
         <motion.div variants={item}>
            <EnterpriseView 
               moduleId="inventory"
               modelId="products"
               schema={inventorySchema}
               onOpenDetail={onOpenDetail}
            />
         </motion.div>
      </div>
    </motion.div>
  );
};

export default InventoryTab;
