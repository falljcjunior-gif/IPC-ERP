import React from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Search, Filter, Tag, Package, 
  Layers, DollarSign, TrendingUp, AlertTriangle,
  MoreHorizontal, ChevronRight, ShoppingCart, Edit3
} from 'lucide-react';
import Chip from '../../marketing/components/Chip';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const CatalogTab = ({ data, formatCurrency, onOpenDetail }) => {
  const products = data?.masterdata?.products || [];

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Nexus Search & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem' }}>
        <div className="nexus-card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1.5rem', background: 'white' }}>
          <Search size={20} color="var(--nexus-text-muted)" />
          <input 
            placeholder="Rechercher un produit dans le catalogue..." 
            style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: '1rem', fontWeight: 600, color: 'var(--nexus-secondary)' }} 
          />
        </div>
        <button 
          onClick={() => onOpenDetail && onOpenDetail(null, 'base', 'catalog')}
          className="nexus-card" style={{ background: 'var(--nexus-primary)', padding: '0.75rem 1.75rem', color: 'white', fontWeight: 900, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Plus size={20} /> Nouveau Produit
        </button>
      </div>

      {/* Product Grid - Nexus Style */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))', gap: '1.5rem' }}>
        {products.map((product) => (
          <motion.div 
            key={product.id} 
            variants={item}
            whileHover={{ y: -5 }}
            className="nexus-card" 
            style={{ padding: '2rem', background: 'white', position: 'relative' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
               <div className="nexus-glow" style={{ background: 'var(--nexus-primary)', padding: '12px', borderRadius: '12px', color: 'white' }}>
                 <Package size={24} />
               </div>
               <div style={{ 
                  padding: '6px 12px', borderRadius: '8px', 
                  background: product.statut === 'En Stock' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  color: product.statut === 'En Stock' ? 'var(--nexus-primary)' : '#F59E0B',
                  fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase'
               }}>
                 {product.statut}
               </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--nexus-primary)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '6px' }}>{product.categorie}</div>
              <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem', color: 'var(--nexus-secondary)', lineHeight: 1.2 }}>{product.nom}</h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1.25rem', background: 'var(--nexus-bg)', borderRadius: '16px', marginBottom: '1.5rem' }}>
               <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--nexus-text-muted)', fontWeight: 900, textTransform: 'uppercase' }}>Prix Unitaire</div>
                  <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--nexus-secondary)' }}>{formatCurrency(product.prix, true)}</div>
               </div>
               <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--nexus-text-muted)', fontWeight: 900, textTransform: 'uppercase' }}>Stock</div>
                  <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--nexus-secondary)' }}>{product.stock?.toLocaleString()} <span style={{fontSize: '0.7rem', opacity: 0.5}}>U</span></div>
               </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={() => onOpenDetail && onOpenDetail(product, 'sales', 'products')}
                className="nexus-card" style={{ flex: 1, padding: '0.75rem', background: 'white', fontWeight: 900, fontSize: '0.8rem', cursor: 'pointer', border: '1px solid var(--nexus-border)' }}>Détails</button>
              <button 
                onClick={() => onOpenDetail && onOpenDetail(product, 'sales', 'products')}
                className="nexus-card" style={{ padding: '0.75rem', background: 'var(--nexus-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                <Edit3 size={18} color="var(--nexus-primary)" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default CatalogTab;
