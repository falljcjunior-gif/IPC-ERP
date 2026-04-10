import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Search, 
  AlertTriangle, 
  History,
  ChevronRight,
  Database
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import RecordModal from '../components/RecordModal';

const Inventory = ({ onOpenDetail }) => {
  const { data, addRecord } = useBusiness();
  const [view, setView] = useState('products'); // 'products', 'movements', 'warehouses'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { movements } = data.inventory;
  const products = data.base.catalog;

  const handleSave = (formData) => {
    if (view === 'products') {
      addRecord('base', 'catalog', formData);
    } else {
      addRecord('inventory', 'movements', formData);
    }
    setIsModalOpen(false);
  };

  const modalFields = view === 'products' ? [
    { name: 'code', label: 'Référence Produit', required: true, placeholder: 'Ex: PROD-102' },
    { name: 'nom', label: 'Nom du Produit', required: true },
    { name: 'stock', label: 'Quantité Initiale', type: 'number', required: true },
    { name: 'alerte', label: 'Seuil d\'alerte', type: 'number', required: true },
    { name: 'emplacement', label: 'Emplacement', required: true, placeholder: 'Ex: Entrepôt A, Rayon 4' },
  ] : view === 'movements' ? [
    { name: 'produit', label: 'Produit', type: 'select', options: products.map(p => p.nom), required: true },
    { name: 'type', label: 'Type de mouvement', type: 'select', options: ['Réception', 'Expédition', 'Inventaire', 'Transfert'], required: true },
    { name: 'qte', label: 'Quantité', type: 'number', required: true },
    { name: 'source', label: 'Entrepôt Source', type: 'select', options: ['Entrepôt Central', 'Dépôt Nord', 'Dépôt Sud'] },
    { name: 'dest', label: 'Entrepôt Dest.', type: 'select', options: ['Entrepôt Central', 'Dépôt Nord', 'Dépôt Sud'] },
    { name: 'date', label: 'Date', type: 'date', required: true },
    { name: 'ref', label: 'Référence Document', required: true, placeholder: 'Ex: BL-2026-X' },
  ] : [
    { name: 'nom', label: 'Nom de l\'entrepôt', required: true },
    { name: 'code', label: 'Code', required: true },
    { name: 'adresse', label: 'Adresse complète', required: true },
  ];

  const renderProducts = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
      {products.map((prod) => (
        <motion.div
           key={prod.id}
           whileHover={{ y: -5 }}
           onClick={() => onOpenDetail(prod, 'inventory', 'products')}
           className="glass"
           style={{ padding: '1.5rem', borderRadius: '1.25rem', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
             <div style={{ background: 'var(--accent)10', color: 'var(--accent)', padding: '0.5rem', borderRadius: '0.75rem' }}>
                <Package size={20} />
             </div>
             <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>{prod.emplacement}</span>
          </div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{prod.nom}</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Réf: {prod.code}</p>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
             <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Stock Actuel</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: prod.stock <= prod.alerte ? '#EF4444' : 'var(--text)' }}>
                  {prod.stock}
                </div>
             </div>
             {prod.stock <= prod.alerte && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#EF4444', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                   <AlertTriangle size={14} /> Réappro.
                </div>
             )}
          </div>
        </motion.div>
      ))}
      <motion.div
        whileHover={{ scale: 1.02 }}
        onClick={() => setIsModalOpen(true)}
        className="glass"
        style={{ padding: '1.5rem', borderRadius: '1.25rem', border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', cursor: 'pointer', color: 'var(--text-muted)' }}
      >
        <Plus size={32} />
        <span>Nouveau Référencement</span>
      </motion.div>
    </div>
  );

  const renderMovements = () => (
    <div className="glass" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          <tr>
            <th style={{ padding: '1rem 1.5rem' }}>Date</th>
            <th style={{ padding: '1rem 1.5rem' }}>Produit</th>
            <th style={{ padding: '1rem 1.5rem' }}>Type</th>
            <th style={{ padding: '1rem 1.5rem' }}>Quantité</th>
            <th style={{ padding: '1rem 1.5rem' }}>Référence</th>
            <th style={{ padding: '1rem 1.5rem' }}></th>
          </tr>
        </thead>
        <tbody>
          {(movements || []).map((mov) => (
            <tr key={mov?.id || Math.random()} onClick={() => onOpenDetail && onOpenDetail(mov, 'inventory', 'movements')} style={{ borderTop: '1px solid var(--border)', cursor: 'pointer' }}>
              <td style={{ padding: '1rem 1.5rem' }}>{mov?.date || 'N/A'}</td>
              <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{mov?.produit || 'Produit inconnu'}</td>
              <td style={{ padding: '1rem 1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {(mov?.type || '').includes('Réception') ? <ArrowDownLeft size={16} color="#10B981" /> : <ArrowUpRight size={16} color="#EF4444" />}
                  {mov?.type || 'Inconnu'}
                </div>
              </td>
              <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: (mov?.qte || 0) > 0 ? '#10B981' : '#EF4444' }}>
                {(mov?.qte || 0) > 0 ? '+' : ''}{mov?.qte || 0}
              </td>
              <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>{mov?.ref || 'Sans réf.'}</td>
              <td style={{ padding: '1rem 1.5rem' }}><ChevronRight size={16} color="var(--text-muted)" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{ padding: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Gestion des Stocks</h1>
          <p style={{ color: 'var(--text-muted)' }}>Suivez vos inventaires et mouvements de marchandises en temps réel.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <div style={{ display: 'flex', background: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: '0.8rem', border: '1px solid var(--border)' }}>
            <button onClick={() => setView('products')} style={{ padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', background: view === 'products' ? 'var(--bg)' : 'transparent', color: view === 'products' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>Articles</button>
            <button onClick={() => setView('movements')} style={{ padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', background: view === 'movements' ? 'var(--bg)' : 'transparent', color: view === 'movements' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>Mouvements</button>
            <button onClick={() => setView('warehouses')} style={{ padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', background: view === 'warehouses' ? 'var(--bg)' : 'transparent', color: view === 'warehouses' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>Entrepôts</button>
          </div>
          <button className="glass" onClick={() => { setView('movements'); setIsModalOpen(true); }} style={{ padding: '0.6rem 1.2rem', borderRadius: '0.8rem', fontWeight: 600, border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={18} /> Inventaire Physique
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Nouveau
          </button>
        </div>
      </div>

       <div className="grid grid-3" style={{ marginBottom: '2.5rem' }}>
         <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ background: '#F59E0B15', color: '#F59E0B', padding: '0.75rem', borderRadius: '1rem' }}><AlertTriangle /></div>
            <div>
               <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Seuils Critiques</div>
               <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{products.filter(p => p.stock <= p.alerte).length} Articles</div>
            </div>
         </div>
      </div>

      {view === 'products' && renderProducts()}
      {view === 'movements' && renderMovements()}
      {view === 'warehouses' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {[
            { id: '1', nom: 'Entrepôt Central', code: 'WH-CENT', items: 1540, location: 'Paris, France' },
            { id: '2', nom: 'Dépôt Nord', code: 'WH-NORTH', items: 420, location: 'Lille, France' },
            { id: '3', nom: 'Dépôt Sud', code: 'WH-SOUTH', items: 890, location: 'Marseille, France' },
          ].map(wh => (
            <div key={wh.id} className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
               <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{wh.nom}</h3>
               <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Code: {wh.code} • {wh.location}</p>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{wh.items}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Articles stockés</span>
               </div>
            </div>
          ))}
        </div>
      )}

      <RecordModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        title="Ajouter au Stock"
        fields={modalFields}
      />
    </div>
  );
};

export default Inventory;
