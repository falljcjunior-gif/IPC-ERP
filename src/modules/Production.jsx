import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Factory, 
  Layers, 
  Plus, 
  Activity as ActivityIcon, 
  Database,
  CheckCircle2,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import RecordModal from '../components/RecordModal';

const Production = ({ onOpenDetail }) => {
  const { data, addRecord } = useBusiness();
  const [view, setView] = useState('orders'); // 'orders', 'boms'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { boms, orders } = data.production;

  const handleSave = (formData) => {
    const subModule = view === 'orders' ? 'orders' : 'boms';
    if (view === 'boms' && typeof formData.composants === 'string') {
      formData.composants = formData.composants.split(',').map(c => c.trim());
    }
    if (view === 'orders') {
      formData.progression = formData.progression || 0;
    }
    addRecord('production', subModule, formData);
  };

  const modalFields = view === 'orders' ? [
    { name: 'num', label: 'Numéro d\'OF', required: true, placeholder: 'Ex: OF-2026-X' },
    { name: 'produit', label: 'Produit à Fabriquer', type: 'select', options: boms.map(b => b.produit), required: true },
    { name: 'qte', label: 'Quantité', type: 'number', required: true },
    { name: 'echeance', label: 'Échéance', type: 'date', required: true },
    { name: 'statut', label: 'Statut', type: 'select', options: ['Planifié', 'En cours', 'Terminé', 'Annulé'], required: true },
    { name: 'progression', label: 'Progression Initiale (%)', type: 'number', placeholder: '0' },
  ] : [
    { name: 'produit', label: 'Produit Fini', required: true },
    { name: 'composants', label: 'Composants (séparés par des virgules)', required: true, placeholder: 'Ex: CPU, RAM, Châssis' },
    { name: 'coutEstime', label: 'Coût Estimé (FCFA)', type: 'number', required: true },
  ];

  const renderOrders = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
      {orders.map((order) => (
        <motion.div
           key={order.id}
           whileHover={{ y: -5 }}
           onClick={() => onOpenDetail(order, 'production', 'orders')}
           className="glass"
           style={{ padding: '2rem', borderRadius: '1.5rem', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase' }}>{order.num}</span>
              <h3 style={{ fontSize: '1.25rem', marginTop: '0.25rem' }}>{order.produit}</h3>
            </div>
            <div style={{ 
              padding: '0.25rem 0.75rem', 
              borderRadius: '1rem', 
              background: order.statut === 'En cours' ? '#3B82F615' : order.statut === 'Terminé' ? '#10B98115' : '#64748B15', 
              color: order.statut === 'En cours' ? '#3B82F6' : order.statut === 'Terminé' ? '#10B981' : '#64748B', 
              fontSize: '0.75rem', 
              fontWeight: 700,
              height: 'fit-content'
            }}>
              {order.statut}
            </div>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Progression</span>
              <span style={{ fontWeight: 700 }}>{order.progression}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${order.progression}%` }}
                style={{ height: '100%', background: 'var(--accent)', borderRadius: '4px' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
             <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quantité</div>
                <div style={{ fontWeight: 700 }}>{order.qte} Unités</div>
             </div>
             <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Échéance</div>
                <div style={{ fontWeight: 700 }}>{order.echeance}</div>
             </div>
          </div>
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
        <span>Lancer un Ordre de Fab.</span>
      </motion.div>
    </div>
  );

  const renderBoms = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {boms.map((bom) => (
        <motion.div
           key={bom.id}
           onClick={() => onOpenDetail(bom, 'production', 'boms')}
           className="glass"
           style={{ padding: '2rem', borderRadius: '1.5rem', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
               <div style={{ background: 'var(--accent)10', color: 'var(--accent)', padding: '1rem', borderRadius: '1.25rem' }}>
                  <Database size={32} />
               </div>
               <div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{bom.produit}</h3>
                  <p style={{ color: 'var(--text-muted)' }}>Nomenclature de fabrication standard</p>
               </div>
            </div>
            <div style={{ textAlign: 'right' }}>
               <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Coût estimé</div>
               <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{bom.coutEstime.toLocaleString()} FCFA</div>
            </div>
          </div>
        </motion.div>
      ))}
      <motion.div
        whileHover={{ scale: 1.01 }}
        onClick={() => setIsModalOpen(true)}
        className="glass"
        style={{ 
          padding: '2rem', 
          borderRadius: '1.5rem', 
          border: '2px dashed var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          cursor: 'pointer',
          color: 'var(--text-muted)'
        }}
      >
        <Plus size={24} />
        <span>Nouvelle Nomenclature</span>
      </motion.div>
    </div>
  );

  return (
    <div style={{ padding: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Production & Manufacturing</h1>
          <p style={{ color: 'var(--text-muted)' }}>Optimisez vos chaînes de production et vos nomenclatures.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ 
            display: 'flex', 
            background: 'var(--bg-subtle)', 
            padding: '0.25rem', 
            borderRadius: '0.8rem',
            border: '1px solid var(--border)' 
          }}>
            <button onClick={() => setView('orders')} style={{ padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', background: view === 'orders' ? 'var(--bg)' : 'transparent', color: view === 'orders' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>OF</button>
            <button onClick={() => setView('boms')} style={{ padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', background: view === 'boms' ? 'var(--bg)' : 'transparent', color: view === 'boms' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>Nomenclatures</button>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Nouveau
          </button>
        </div>
      </div>

       <div className="grid grid-3" style={{ marginBottom: '2.5rem' }}>
         <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ background: '#06B6D415', color: '#06B6D4', padding: '0.75rem', borderRadius: '1rem' }}><Factory /></div>
            <div>
               <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ordres Actifs</div>
               <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{orders.filter(o => o.statut === 'En cours').length} OF</div>
            </div>
         </div>
         <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ background: '#F59E0B15', color: '#F59E0B', padding: '0.75rem', borderRadius: '1rem' }}><AlertTriangle /></div>
            <div>
               <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Alertes Retard</div>
               <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>2 OF</div>
            </div>
         </div>
         <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ background: '#10B98115', color: '#10B981', padding: '0.75rem', borderRadius: '1rem' }}><CheckCircle2 /></div>
            <div>
               <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Qualité (Contrôle)</div>
               <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>99.2 %</div>
            </div>
         </div>
      </div>

      {view === 'orders' ? renderOrders() : renderBoms()}

      <RecordModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        title={view === 'orders' ? "Créer un Ordre de Fabrication" : "Nouvelle Nomenclature Produit"}
        fields={modalFields}
      />
    </div>
  );
};

export default Production;
