import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, 
  Truck, 
  Plus, 
  ChevronRight,
  Building2,
  DollarSign,
  Tag
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import RecordModal from '../components/RecordModal';

const Purchase = ({ onOpenDetail }) => {
   const { data, addRecord } = useBusiness();
   const [view, setView] = useState('orders'); // 'orders', 'vendors'
   const [isModalOpen, setIsModalOpen] = useState(false);
   const { orders } = data.purchase;
   const vendors = data.base.contacts.filter(c => c.type === 'Fournisseur');

  const handleSave = (formData) => {
    if (view === 'orders') {
      addRecord('purchase', 'orders', formData);
    } else {
      addRecord('base', 'contacts', { ...formData, type: 'Fournisseur' });
    }
    setIsModalOpen(false);
  };

  const modalFields = view === 'orders' ? [
    { name: 'num', label: 'Numéro de Bon d\'Achat', required: true, placeholder: 'Ex: ACH-2026-X' },
    { name: 'fournisseur', label: 'Fournisseur', type: 'select', options: vendors.map(v => v.nom), required: true },
    { name: 'date', label: 'Date', type: 'date', required: true },
    { name: 'total', label: 'Montant Total HT (FCFA)', type: 'number', required: true },
    { name: 'statut', label: 'Statut', type: 'select', options: ['Brouillon', 'Commandé', 'Réceptionné', 'Facturé'], required: true },
  ] : [
    { name: 'nom', label: 'Nom du Fournisseur', required: true },
    { name: 'contact', label: 'Nom du Contact', required: true },
    { name: 'email', label: 'Email Pro', type: 'email', required: true },
    { name: 'tel', label: 'Téléphone', required: true },
    { name: 'categories', label: 'Catégorie de Produits', type: 'select', options: ['Matériel', 'Cloud', 'Services', 'Licences'], required: true },
  ];

  const renderOrders = () => (
    <div className="glass" style={{ borderRadius: '1.5rem', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          <tr>
            <th style={{ padding: '1.25rem' }}>Référence</th>
            <th style={{ padding: '1.25rem' }}>Fournisseur</th>
            <th style={{ padding: '1.25rem' }}>Date</th>
            <th style={{ padding: '1.25rem' }}>Montant Total</th>
            <th style={{ padding: '1.25rem' }}>Statut</th>
            <th style={{ padding: '1.25rem' }}></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} onClick={() => onOpenDetail(order, 'purchase', 'orders')} style={{ borderTop: '1px solid var(--border)', cursor: 'pointer' }}>
              <td style={{ padding: '1.25rem', fontWeight: 600 }}>{order.num}</td>
              <td style={{ padding: '1.25rem' }}>{order.fournisseur}</td>
              <td style={{ padding: '1.25rem' }}>{order.date}</td>
              <td style={{ padding: '1.25rem', fontWeight: 700 }}>{order.total.toLocaleString()} FCFA</td>
              <td style={{ padding: '1.25rem' }}>
                <span style={{ 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '1rem', 
                  background: order.statut === 'Réceptionné' ? '#10B98115' : '#3B82F615', 
                  color: order.statut === 'Réceptionné' ? '#10B981' : '#3B82F6', 
                  fontSize: '0.75rem', 
                  fontWeight: 600
                }}>
                  {order.statut}
                </span>
              </td>
              <td style={{ padding: '1.25rem' }}>
                <ChevronRight size={18} color="var(--text-muted)" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderVendors = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
      {vendors.map((v) => (
        <motion.div
           key={v.id}
           whileHover={{ y: -5 }}
           onClick={() => onOpenDetail(v, 'purchase', 'vendors')}
           className="glass"
           style={{ padding: '1.75rem', borderRadius: '1.5rem', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
             <div style={{ background: 'var(--accent)10', color: 'var(--accent)', padding: '0.75rem', borderRadius: '1rem' }}>
                <Building2 size={24} />
             </div>
             <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '0.2rem 0.6rem', borderRadius: '0.5rem', height: 'fit-content' }}>
                {v.categories}
             </span>
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{v.nom}</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Contact : {v.contact}</p>
          <button style={{ width: '100%', padding: '0.75rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontWeight: 600, cursor: 'pointer' }}>
             Profil Fournisseur
          </button>
        </motion.div>
      ))}
      <motion.div
        whileHover={{ scale: 1.02 }}
        onClick={() => setIsModalOpen(true)}
        className="glass"
        style={{ 
          padding: '2rem', 
          borderRadius: '1.5rem', 
          border: '2px dashed var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          cursor: 'pointer',
          color: 'var(--text-muted)'
        }}
      >
        <Plus size={32} />
        <span>Nouveau Fournisseur</span>
      </motion.div>
    </div>
  );

  return (
    <div style={{ padding: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Achats & Fournisseurs</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gérez vos approvisionnements et vos relations fournisseurs.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ 
            display: 'flex', 
            background: 'var(--bg-subtle)', 
            padding: '0.25rem', 
            borderRadius: '0.8rem',
            border: '1px solid var(--border)' 
          }}>
            <button onClick={() => setView('orders')} style={{ padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', background: view === 'orders' ? 'var(--bg)' : 'transparent', color: view === 'orders' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>Commandes</button>
            <button onClick={() => setView('vendors')} style={{ padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', background: view === 'vendors' ? 'var(--bg)' : 'transparent', color: view === 'vendors' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>Fournisseurs</button>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
             <Plus size={18} /> Nouveau
          </button>
        </div>
      </div>

       <div className="grid grid-3" style={{ marginBottom: '2.5rem' }}>
         <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ background: '#64748B15', color: '#64748B', padding: '0.75rem', borderRadius: '1rem' }}><ShoppingBag /></div>
            <div>
               <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Achats Réceptionnés</div>
               <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{orders.filter(o => o.statut === 'Réceptionné').length} Commandes</div>
            </div>
         </div>
         <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ background: '#3B82F615', color: '#3B82F6', padding: '0.75rem', borderRadius: '1rem' }}><Truck size={24} /></div>
            <div>
               <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fournisseurs</div>
               <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{vendors.length} Partenaires</div>
            </div>
         </div>
         <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ background: '#10B98115', color: '#10B981', padding: '0.75rem', borderRadius: '1rem' }}><DollarSign size={24} /></div>
            <div>
               <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dépenses (Mois)</div>
               <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{(orders.reduce((sum, o) => sum + o.total, 0)).toLocaleString()} FCFA</div>
            </div>
         </div>
      </div>

      {view === 'orders' ? renderOrders() : renderVendors()}

      <RecordModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        title={view === 'orders' ? "Créer un Bon d'Achat" : "Nouveau Fournisseur"}
        fields={modalFields}
      />
    </div>
  );
};

export default Purchase;
