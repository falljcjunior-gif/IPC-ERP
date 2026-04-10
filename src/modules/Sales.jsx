import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, 
  Package, 
  Plus, 
  Search, 
  FileText, 
  ChevronRight, 
  MoreVertical,
  Layers,
  Tag,
  Clock,
  CheckCircle2,
  BarChart3,
  Layout,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import RecordModal from '../components/RecordModal';
import KpiCard from '../components/KpiCard';
import { AreaChartComp } from '../components/BusinessCharts';

const Sales = ({ onOpenDetail }) => {
   const { data, addRecord } = useBusiness();
   const [view, setView] = useState('dashboard'); // 'orders', 'catalog', 'dashboard'
   const [isModalOpen, setIsModalOpen] = useState(false);
   const { orders } = data?.sales || { orders: [] };
   const products = data?.base?.catalog || [];
   const clients = (data?.base?.contacts || []).filter(c => c.type === 'Client' || c.type === 'Partenaire');

  const revenueData = [
    { name: 'Jan', value: 45000 },
    { name: 'Fév', value: 52000 },
    { name: 'Mar', value: 48000 },
    { name: 'Avr', value: 61000 },
    { name: 'Mai', value: 55000 },
    { name: 'Juin', value: 67000 },
  ];

  const handleSave = (formData) => {
    if (view === 'orders') {
      addRecord('sales', 'orders', formData);
    } else {
      addRecord('base', 'catalog', formData);
    }
    setIsModalOpen(false);
  };

  const modalFields = view === 'orders' ? [
    { name: 'num', label: 'Numéro de Commande', required: true, placeholder: 'Ex: CMD-2026-X' },
    { name: 'client', label: 'Client', type: 'select', options: clients.map(c => c.nom), required: true },
    { name: 'date', label: 'Date de Commande', type: 'date', required: true },
    { name: 'taxRate', label: 'Taux de Taxe', type: 'select', options: (data?.base?.taxes || []).map(t => ({ label: t.label, value: t.rate })), required: true },
    { name: 'totalHT', label: 'Total HT (FCFA)', type: 'number', required: true },
    { name: 'statut', label: 'Statut', type: 'select', options: ['Brouillon', 'Confirmé', 'Livré', 'Facturé'], required: true },
    { name: 'devise', label: 'Devise', type: 'select', options: ['EUR', 'USD', 'GBP'], required: true },
  ] : [
    { name: 'code', label: 'Référence Produit', required: true },
    { name: 'nom', label: 'Nom du Produit', required: true },
    { name: 'type', label: 'Type', type: 'select', options: ['Bien', 'Service', 'Consommable'], required: true },
    { name: 'categorie', label: 'Catégorie', type: 'select', options: ['Software', 'Matériel', 'Prestation', 'Formation'], required: true },
    { name: 'prixMoyen', label: 'Prix de Vente (FCFA)', type: 'number', required: true },
  ];

  const renderDashboard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
        <KpiCard 
          title="CA Total (Mois)" 
          value={`${(revenueData[revenueData.length-1].value / 1000).toFixed(1)}k FCFA`}
          trend={15.4} 
          trendType="up" 
          icon={<DollarSign size={24} />} 
          color="#3B82F6"
          sparklineData={revenueData.map(d => ({ val: d.value }))}
        />
        <KpiCard 
          title="Panier Moyen" 
          value="4 250 FCFA"
          trend={2.3} 
          trendType="up" 
          icon={<ShoppingCart size={24} />} 
          color="#10B981"
          sparklineData={[{val: 4000}, {val: 4100}, {val: 4050}, {val: 4200}, {val: 4250}]}
        />
        <KpiCard 
          title="Commandes/Jour" 
          value="8.4"
          trend={1.1} 
          trendType="down" 
          icon={<Clock size={24} />} 
          color="#F59E0B"
          sparklineData={[{val: 10}, {val: 8}, {val: 9}, {val: 7}, {val: 8}]}
        />
      </div>

      <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Evolution du Chiffre d'Affaires</h3>
        <AreaChartComp data={revenueData} />
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="glass" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          <tr>
            <th style={{ padding: '1rem 1.5rem' }}>Référence</th>
            <th style={{ padding: '1rem 1.5rem' }}>Client</th>
            <th style={{ padding: '1rem 1.5rem' }}>Date</th>
            <th style={{ padding: '1rem 1.5rem' }}>Montant TTC</th>
            <th style={{ padding: '1rem 1.5rem' }}>Marge</th>
            <th style={{ padding: '1rem 1.5rem' }}>Statut</th>
            <th style={{ padding: '1rem 1.5rem' }}></th>
          </tr>
        </thead>
        <tbody style={{ fontSize: '0.9rem' }}>
          {(orders || []).map((order) => (
            <tr key={order?.id || Math.random()} onClick={() => onOpenDetail && onOpenDetail(order, 'sales', 'orders')} style={{ borderTop: '1px solid var(--border)', cursor: 'pointer' }}>
              <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{order?.num || 'N/A'}</td>
              <td style={{ padding: '1rem 1.5rem' }}>{order?.client || 'Inconnu'}</td>
              <td style={{ padding: '1rem 1.5rem' }}>{order?.date || 'N/A'}</td>
              <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{order?.totalTTC?.toLocaleString() || 0} {order?.devise || 'FCFA'}</td>
              <td style={{ padding: '1rem 1.5rem' }}>
                <span style={{ color: '#10B981', fontWeight: 700 }}>
                  {((order?.totalHT || 0) * 0.25).toLocaleString()} FCFA
                </span>
              </td>
              <td style={{ padding: '1rem 1.5rem' }}>
                <span style={{ 
                  padding: '0.2rem 0.6rem', 
                  borderRadius: '0.5rem', 
                  background: order?.statut === 'Confirmé' ? '#10B98115' : '#64748B15', 
                  color: order?.statut === 'Confirmé' ? '#10B981' : '#64748B',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  {order?.statut || 'Brouillon'}
                </span>
              </td>
              <td style={{ padding: '1rem 1.5rem' }}>
                <ChevronRight size={18} color="var(--text-muted)" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderCatalog = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
      {products.map((prod) => (
        <motion.div
           key={prod.id}
           whileHover={{ y: -5 }}
           onClick={() => onOpenDetail(prod, 'sales', 'products')}
           className="glass"
           style={{ padding: '1.5rem', borderRadius: '1.25rem', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
             <Tag size={20} color="var(--accent)" />
             <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{prod.code}</span>
          </div>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{prod.nom}</h3>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{prod.categorie} • {prod.type}</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>{prod.prixMoyen.toLocaleString()} FCFA</div>
        </motion.div>
      ))}
      <motion.div
        whileHover={{ scale: 1.02 }}
        onClick={() => setIsModalOpen(true)}
        className="glass"
        style={{ padding: '1.5rem', borderRadius: '1.25rem', border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', cursor: 'pointer', color: 'var(--text-muted)' }}
      >
        <Plus size={32} />
        <span>Nouveau Produit</span>
      </motion.div>
    </div>
  );

  return (
    <div style={{ padding: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Ventes & Catalogue</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gérez vos commandes clients et vos tarifs produits.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ display: 'flex', background: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: '0.75rem', border: '1px solid var(--border)' }}>
            <button 
              onClick={() => setView('dashboard')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.6rem',
                border: 'none',
                background: view === 'dashboard' ? 'var(--bg)' : 'transparent',
                color: view === 'dashboard' ? 'var(--accent)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}
            >
              <BarChart3 size={16} /> Dashboard
            </button>
            <button 
              onClick={() => setView('orders')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.6rem',
                border: 'none',
                background: view === 'orders' ? 'var(--bg)' : 'transparent',
                color: view === 'orders' ? 'var(--accent)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}
            >
              <Layout size={16} /> Commandes
            </button>
            <button onClick={() => setView('catalog')} style={{ padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', background: view === 'catalog' ? 'var(--bg)' : 'transparent', color: view === 'catalog' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>Catalogue</button>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
             <Plus size={18} /> Nouveau
          </button>
        </div>
      </div>

      {view === 'dashboard' && renderDashboard()}
      {view === 'orders' && renderOrders()}
      {view === 'catalog' && renderCatalog()}

      <RecordModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        title="Nouveau Document Ventes"
        fields={modalFields}
      />
    </div>
  );
};

export default Sales;
