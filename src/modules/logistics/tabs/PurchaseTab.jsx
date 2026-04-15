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
    const vendorScore = 88; // Mock average scorecard
    const procurementDelay = 4.2; // Days
    return { totalSpent, pendingOrders, vendorScore, procurementDelay };
  }, [orders]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Procurement Excellence KPIs */}
      <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
        <KpiCard title="Dépenses Totales" value={formatCurrency(stats.totalSpent, true)} trend={5.2} trendType="up" icon={<DollarSign size={22} />} color="#4F46E5" sparklineData={[2.5e7, 2.8e7, 3.1e7, 3.5e7]} />
        <KpiCard title="Performance Fourn." value={`${stats.vendorScore}%`} trend={2.1} trendType="up" icon={<Star size={22} />} color="#F59E0B" sparklineData={[82, 85, 86, 88]} />
        <KpiCard title="Commandes en cours" value={stats.pendingOrders} trend={-2} trendType="down" icon={<ShoppingBag size={22} />} color="#6366F1" sparklineData={[15, 12, 11, 10]} />
        <KpiCard title="Délai Procurement" value={`${stats.procurementDelay} Jrs`} trend={-15} trendType="down" icon={<Zap size={22} />} color="#EF4444" sparklineData={[5.5, 5, 4.8, 4.2]} />
      </motion.div>

      {/* Vendors & Scorecards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
         <motion.div variants={item} className="glass" style={{ padding: '2.5rem', borderRadius: '2.5rem', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
               <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>Top Partenaires Stratégiques</h4>
               <TrendingUp size={20} color="#10B981" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
               {vendors.slice(0, 3).map((v, i) => (
                 <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', borderRadius: '1.5rem', background: 'var(--bg-subtle)' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                       <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#4F46E520', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                          {v.nom?.charAt(0)}
                       </div>
                       <div>
                          <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{v.nom}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{v.ville} • {v.pays}</div>
                       </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                       <div style={{ fontWeight: 900, fontSize: '0.9rem', color: '#F59E0B' }}>94%</div>
                       <div style={{ fontSize: '0.65rem', fontWeight: 700, opacity: 0.6, textTransform: 'uppercase' }}>Fiabilité</div>
                    </div>
                 </div>
               ))}
            </div>
            <button className="glass" style={{ width: '100%', marginTop: '2rem', padding: '1rem', borderRadius: '1.25rem', fontWeight: 800, fontSize: '0.85rem' }}>
               Consulter l'Annuaire Fournisseur
            </button>
         </motion.div>

         <motion.div variants={item} className="glass" style={{ padding: '2.5rem', borderRadius: '2.5rem', border: '1px solid var(--border)', background: 'linear-gradient(135deg, #4F46E5 0%, #312E81 100%)', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#A5B4FC', fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '2rem', letterSpacing: '1px' }}>
               <Target size={16} /> Objectif Procurement 2026
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
               <div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>-15%</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.7, fontWeight: 600 }}>Réduction des coûts d'approvisionnement</div>
               </div>
               <div style={{ padding: '1.5rem', borderRadius: '1.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                     <div style={{ padding: '10px', borderRadius: '10px', background: '#10B98120' }}><CheckCircle2 size={24} color="#10B981" /></div>
                     <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>Digitalisation PO : 92%</div>
                  </div>
               </div>
               <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.6, lineHeight: 1.6 }}>
                  "La centralisation des achats permet une meilleure force de négociation et une réduction drastique des délais de livraison."
               </p>
            </div>
         </motion.div>
      </div>

      {/* Orders List & Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem' }}>Bons de Commande & Achats</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
               <button className="glass" style={{ padding: '0.7rem 1.25rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '0.85rem' }}>
                 <Scale size={18} /> Comparatif Offres
               </button>
               <button 
                 onClick={() => onOpenDetail && onOpenDetail(null, 'purchase', 'orders')}
                 className="btn-primary" style={{ padding: '0.7rem 1.75rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900, background: '#4F46E5', borderColor: '#4F46E5' }}>
                 <Plus size={20} /> Nouvelle Demande
               </button>
            </div>
         </div>
         <motion.div variants={item}>
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
