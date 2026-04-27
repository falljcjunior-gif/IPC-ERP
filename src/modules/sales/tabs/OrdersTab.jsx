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
      {/* Nexus Search & Actions Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem' }}>
        <div className="nexus-card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1.5rem', background: 'white' }}>
          <Search size={20} color="var(--nexus-text-muted)" />
          <input 
            placeholder="Rechercher une commande, un client..." 
            style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: '1rem', fontWeight: 600, color: 'var(--nexus-secondary)' }} 
          />
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
           <button onClick={() => alert('Génération du rapport PDF...')} className="nexus-card" style={{ padding: '0.75rem 1.5rem', background: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', border: 'none' }}>
             <Download size={18} color="var(--nexus-primary)" /> Export
           </button>
           <button 
             onClick={() => onOpenDetail && onOpenDetail(null, 'sales', 'orders')}
             className="nexus-card" style={{ background: 'var(--nexus-primary)', padding: '0.75rem 1.75rem', color: 'white', fontWeight: 900, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
             <ShoppingCart size={20} /> Nouvelle Commande
           </button>
        </div>
      </div>

      {/* Orders Grid - Nexus List Style */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {orders.map((order) => (
          <motion.div 
            key={order.id} 
            variants={item}
            whileHover={{ x: 10, background: 'var(--nexus-bg)' }}
            onClick={() => onOpenDetail && onOpenDetail(order, 'sales', 'orders')}
            className="nexus-card" 
            style={{ 
              padding: '1.25rem 2rem', background: 'white', 
              display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1fr 1fr 50px', alignItems: 'center', 
              gap: '2rem', cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '12px', color: 'var(--nexus-primary)' }}>
                <FileText size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--nexus-secondary)' }}>{order.id}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--nexus-text-muted)', fontWeight: 800 }}>{order.date}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
               <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--nexus-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 900, color: 'var(--nexus-primary)', border: '1px solid var(--nexus-border)' }}>{order.client[0]}</div>
               <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--nexus-secondary)' }}>{order.client}</div>
            </div>

            <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--nexus-secondary)' }}>
              {formatCurrency(order.montant, true)}
            </div>

            <div>
              <div style={{ 
                display: 'inline-block', padding: '6px 14px', borderRadius: '10px', 
                background: order.statut === 'Livré' ? 'rgba(16, 185, 129, 0.1)' : order.statut === 'En cours' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                color: order.statut === 'Livré' ? 'var(--nexus-primary)' : order.statut === 'En cours' ? '#3B82F6' : '#F59E0B',
                fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px'
              }}>
                {order.statut}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--nexus-text-muted)' }}>
               {order.statut === 'Livré' ? (
                 <><CheckCircle2 size={16} color="var(--nexus-primary)" /> Confirmé</>
               ) : (
                 <><Truck size={16} color="var(--nexus-primary)" /> En transit</>
               )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
               <ArrowRight size={20} color="var(--nexus-text-muted)" opacity={0.3} />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default OrdersTab;
