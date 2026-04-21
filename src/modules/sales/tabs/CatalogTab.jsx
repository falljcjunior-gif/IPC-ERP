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
  const products = data?.masterdata?.products || [
    { id: '1', nom: 'Bloc Béton 15x20x40', categorie: 'Maçonnerie', prix: 450, stock: 12500, statut: 'En Stock' },
    { id: '2', nom: 'Bloc Béton 20x20x40', categorie: 'Maçonnerie', prix: 550, stock: 8200, statut: 'En Stock' },
    { id: '3', nom: 'Sable de carrière', categorie: 'Granulats', prix: 15000, stock: 450, statut: 'Stock Bas' },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Search & Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1rem', flex: 1, maxWidth: '500px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="glass" placeholder="Rechercher un produit..." 
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.8rem', borderRadius: '1rem', border: 'none', fontSize: '0.85rem' }} />
          </div>
        </div>
        <button 
          onClick={() => onOpenDetail && onOpenDetail(null, 'base', 'catalog')}
          className="btn-primary" style={{ padding: '0.8rem 1.75rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900 }}>
          <Plus size={20} /> Nouveau Produit
        </button>
      </div>

      {/* Product Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '1.5rem' }}>
        {products.map((product) => (
          <motion.div 
            key={product.id} 
            variants={item}
            whileHover={{ y: -5 }}
            className="glass" 
            style={{ padding: '2rem', borderRadius: '2rem', border: '1px solid var(--border)', position: 'relative' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
               <div style={{ background: 'var(--accent-alpha)', padding: '12px', borderRadius: '1rem', color: 'var(--accent)' }}>
                 <Package size={24} />
               </div>
               <Chip 
                 label={product.statut} 
                 color={product.statut === 'En Stock' ? '#10B981' : '#F59E0B'} 
               />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{product.categorie}</div>
              <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem', color: 'var(--text)' }}>{product.nom}</h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1.25rem', background: 'var(--bg-subtle)', borderRadius: '1.25rem', marginBottom: '1.5rem' }}>
               <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Prix Unitaire</div>
                  <div style={{ fontWeight: 900, fontSize: '1rem' }}>{formatCurrency(product.prix, true)}</div>
               </div>
               <div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Stock</div>
                  <div style={{ fontWeight: 900, fontSize: '1rem' }}>{product.stock.toLocaleString()} <span style={{fontSize: '0.7rem', opacity: 0.6}}>U</span></div>
               </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={() => onOpenDetail && onOpenDetail(product, 'sales', 'products')}
                className="glass" style={{ flex: 1, padding: '0.75rem', borderRadius: '1rem', fontWeight: 800, fontSize: '0.8rem' }}>Détails</button>
              <button 
                onClick={() => onOpenDetail && onOpenDetail(product, 'sales', 'products')}
                className="btn-primary" style={{ padding: '0.75rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Edit3 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default CatalogTab;
