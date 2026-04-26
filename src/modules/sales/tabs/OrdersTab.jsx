import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, Search, Filter, MoreVertical, 
  Calendar, User, DollarSign, Clock, CheckCircle2, 
  Truck, ArrowRight, Download, FileText
} from 'lucide-react';
import Chip from '../../marketing/components/Chip';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, scale: 0.98 }, show: { opacity: 1, scale: 1 } };

const OrdersTab = ({ data, formatCurrency, onOpenDetail }) => {
  const orders = data?.sales?.orders || [];

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Search & Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1rem', flex: 1, maxWidth: '600px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="glass" placeholder="Rechercher une commande..." 
              style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', borderRadius: '1rem', border: 'none', fontSize: '0.9rem' }} />
          </div>
          <button onClick={() => alert('Filtrage des commandes en cours...')} className="glass" style={{ padding: '0.8rem 1.25rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
            <Filter size={18} /> Filtres
          </button>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <button onClick={() => alert('Génération du rapport PDF...')} className="glass" style={{ padding: '0.8rem 1.25rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
             <Download size={18} /> Export PDF
           </button>
           <button 
             onClick={() => onOpenDetail && onOpenDetail(null, 'sales', 'orders')}
             className="btn-primary" style={{ padding: '0.8rem 1.75rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900 }}>
             <ShoppingCart size={20} /> Nouvelle Commande
           </button>
        </div>
      </div>

      {/* Orders Grid - High Density Professional Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {orders.map((order) => (
          <motion.div 
            key={order.id} 
            variants={item}
            whileHover={{ x: 10, background: 'var(--bg-subtle)' }}
            onClick={() => onOpenDetail && onOpenDetail(order, 'sales', 'orders')}
            className="glass" 
            style={{ 
              padding: '1.5rem 2.5rem', borderRadius: '1.5rem', border: '1px solid var(--border)', 
              display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1fr 120px 50px', alignItems: 'center', 
              gap: '2.5rem', cursor: 'pointer', transition: '0.2s'
            }}
          >
            {/* Order ID */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ background: 'var(--accent-alpha)', padding: '12px', borderRadius: '1rem', color: 'var(--accent)' }}>
                <FileText size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: '0.95rem' }}>{order.id}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>{order.date}</div>
              </div>
            </div>

            {/* Client */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
               <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 900, border: '1px solid var(--border)' }}>{order.client[0]}</div>
               <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{order.client}</div>
            </div>

            {/* Amount */}
            <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--text)' }}>
              {formatCurrency(order.montant, true)}
            </div>

            {/* Status */}
            <div>
              <Chip 
                label={order.statut} 
                color={order.statut === 'Livré' ? '#10B981' : order.statut === 'En cours' ? '#3B82F6' : '#F59E0B'} 
              />
            </div>

            {/* Logistics Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
               {order.statut === 'Livré' ? (
                 <><CheckCircle2 size={14} color="#10B981" /> Confirmé</>
               ) : (
                 <><Truck size={14} /> Préparation</>
               )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={(e) => { e.stopPropagation(); onOpenDetail && onOpenDetail(order, 'sales', 'orders'); }}
                className="glass" style={{ padding: '0.6rem', borderRadius: '0.8rem' }}>
                <MoreVertical size={18} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default OrdersTab;
