import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, Star, Truck, Plus, ChevronRight, 
  Building2, DollarSign, AlertTriangle, CheckCircle2, 
  Clock, BarChart3, Zap, TrendingUp, TrendingDown, 
  Filter, FileText, Scale, Target, Activity
} from 'lucide-react';
import KpiCard from '../../../components/KpiCard';
import EnterpriseView from '../../../components/EnterpriseView';
import { purchaseSchema } from '../../../schemas/purchase.schema';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

const PurchaseTab = ({ data, formatCurrency, onOpenDetail }) => {
  const orders = data?.purchase?.orders || [];
  const vendors = useMemo(() => (data?.base?.contacts || []).filter(c => c.type === 'Fournisseur'), [data?.base?.contacts]);

  const stats = useMemo(() => {
    const totalSpent = orders.reduce((s, o) => s + (o.total || 0), 0);
    const pendingOrders = orders.filter(o => o.statut === 'Commandé').length;
    return { totalSpent, pendingOrders, vendorScore: 88, procurementDelay: 4.2 };
  }, [orders]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" 
      style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}
    >
      {/* KPI Row */}
      <motion.div variants={item} className="nexus-card" style={{ gridColumn: 'span 3', padding: '1.5rem', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '10px', color: 'var(--nexus-primary)' }}><DollarSign size={20} /></div>
          <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--nexus-primary)' }}>ACTIF</div>
        </div>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Dépenses Totales</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>{formatCurrency(stats.totalSpent, true)}</div>
      </motion.div>

      <motion.div variants={item} className="nexus-card" style={{ gridColumn: 'span 3', padding: '1.5rem', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '8px', borderRadius: '10px', color: '#F59E0B' }}><Star size={20} /></div>
          <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#F59E0B' }}>SCORE</div>
        </div>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Qualité Fournisseurs</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>{stats.vendorScore}%</div>
      </motion.div>

      <motion.div variants={item} className="nexus-card" style={{ gridColumn: 'span 3', padding: '1.5rem', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '10px', color: 'var(--nexus-primary)' }}><ShoppingBag size={20} /></div>
          <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--nexus-primary)' }}>FLUX</div>
        </div>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Commandes en cours</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>{stats.pendingOrders} PO</div>
      </motion.div>

      <motion.div variants={item} className="nexus-card" style={{ gridColumn: 'span 3', padding: '1.5rem', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.05)', padding: '8px', borderRadius: '10px', color: 'var(--nexus-secondary)' }}><Zap size={20} /></div>
          <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>OPTIMAL</div>
        </div>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Lead Time (Moyen)</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>{stats.procurementDelay} Jours</div>
      </motion.div>

      {/* Vendors & Scorecards */}
      <motion.div variants={item} className="nexus-card" style={{ gridColumn: 'span 7', padding: '2.5rem', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem', color: 'var(--nexus-secondary)' }}>Strategic Partners</h4>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--nexus-text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>Top 3 fournisseurs par fiabilité Nexus.</p>
          </div>
          <TrendingUp size={24} color="var(--nexus-primary)" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {vendors.slice(0, 3).map((v, i) => (
            <div key={i} className="nexus-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: 'var(--nexus-bg)' }}>
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                <div className="nexus-glow" style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'var(--nexus-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem' }}>
                  {v.nom?.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--nexus-secondary)' }}>{v.nom}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--nexus-text-muted)', fontWeight: 600 }}>{v.ville} • {v.pays}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 900, fontSize: '1.1rem', color: i === 0 ? 'var(--nexus-primary)' : '#F59E0B' }}>{98 - i * 4}%</div>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>SLA Compliance</div>
              </div>
            </div>
          ))}
        </div>
        <button className="nexus-card" style={{ width: '100%', marginTop: '2rem', padding: '1rem', background: 'var(--nexus-bg)', color: 'var(--nexus-secondary)', fontWeight: 900, border: '1px solid var(--nexus-border)', cursor: 'pointer' }}>
          Voir l'Annuaire Fournisseurs
        </button>
      </motion.div>

      <motion.div variants={item} className="nexus-card" style={{ gridColumn: 'span 5', padding: '2.5rem', background: 'var(--nexus-secondary)', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: 0.8, fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '2.5rem', letterSpacing: '2px' }}>
          <Target size={18} strokeWidth={3} /> Roadmap Procurement 2026
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <div>
            <div style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '-2px' }}>-15%</div>
            <div style={{ fontSize: '1rem', opacity: 0.9, fontWeight: 600, lineHeight: 1.4 }}>Réduction ciblée des coûts d'approvisionnement via Nexus Engine</div>
          </div>
          <div style={{ padding: '1.5rem', borderRadius: '1.5rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)' }}><CheckCircle2 size={24} color="#10B981" /></div>
              <div style={{ fontSize: '0.9rem', fontWeight: 900 }}>Automatisation PO : 92.4%</div>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7, fontWeight: 500, lineHeight: 1.7 }}>
            "L'intelligence centralisée Nexus permet d'anticiper les ruptures et de négocier des volumes consolidés sur l'ensemble du groupe."
          </p>
        </div>
      </motion.div>

      {/* Orders Ledger */}
      <div style={{ gridColumn: 'span 12', marginTop: '2rem' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem', color: 'var(--nexus-secondary)' }}>Procurement Ledger</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
               <button className="nexus-card" style={{ background: 'white', padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer' }}>
                 <Scale size={18} /> Offres
               </button>
               <button 
                 onClick={() => onOpenDetail && onOpenDetail(null, 'purchase', 'orders')}
                 className="nexus-card" style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900, background: 'var(--nexus-primary)', color: 'white', border: 'none', cursor: 'pointer' }}>
                 <Plus size={18} strokeWidth={3} /> Nouvelle Demande
               </button>
            </div>
         </div>
         <motion.div variants={item} className="nexus-card" style={{ background: 'white', padding: '1rem' }}>
            <EnterpriseView 
               moduleId="purchase" 
               modelId="orders"
               schema={purchaseSchema}
               onOpenDetail={onOpenDetail}
            />
         </motion.div>
      </div>
    </motion.div>
  );
};

export default PurchaseTab;
