import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Globe, 
  Building2,
  Tag,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import RecordModal from '../components/RecordModal';

const MasterData = ({ onOpenDetail }) => {
  const { data, addRecord } = useBusiness();
  const [activeTab, setActiveTab] = useState('contacts');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { contacts, catalog } = data.base;

  const handleSave = (formData) => {
    addRecord('base', activeTab, formData);
    setIsModalOpen(false);
  };

  const contactFields = [
    { name: 'nom', label: 'Nom / Raison Sociale', required: true },
    { name: 'type', label: 'Type', type: 'select', options: ['Client', 'Fournisseur', 'Prospect', 'Partenaire'], required: true },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'tel', label: 'Téléphone' },
    { name: 'ref', label: 'Référence Interne', placeholder: 'PART-XXXX' },
  ];

  const productFields = [
    { name: 'code', label: 'Code Article', required: true },
    { name: 'nom', label: 'Désignation', required: true },
    { name: 'type', label: 'Type', type: 'select', options: ['Bien', 'Service'], required: true },
    { name: 'categorie', label: 'Catégorie', type: 'select', options: ['Matériel', 'Software', 'Prestation', 'Formation'], required: true },
    { name: 'prixMoyen', label: 'Prix de Vente (FCFA)', type: 'number', required: true },
    { name: 'unit', label: 'Unité', type: 'select', options: ['Unité', 'Heure', 'Jour', 'Licence', 'Forfait'], required: true },
  ];

  const filteredContacts = contacts.filter(c => 
    c.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredProducts = catalog.filter(p => 
    p.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Données Maîtres</h1>
          <p style={{ color: 'var(--text-muted)' }}>Référentiel global des entités de l'organisation.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ 
            display: 'flex', 
            background: 'var(--bg-subtle)', 
            padding: '0.25rem', 
            borderRadius: '0.8rem',
            border: '1px solid var(--border)' 
          }}>
            <button onClick={() => setActiveTab('contacts')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', background: activeTab === 'contacts' ? 'var(--bg)' : 'transparent', color: activeTab === 'contacts' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>
              <Users size={16} /> Contacts
            </button>
            <button onClick={() => setActiveTab('catalog')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', background: activeTab === 'catalog' ? 'var(--bg)' : 'transparent', color: activeTab === 'catalog' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>
              <Package size={16} /> Catalogue
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Ajouter {(activeTab === 'contacts' ? 'un contact' : 'un produit')}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
         <div style={{ 
           flex: 1, 
           display: 'flex', 
           alignItems: 'center', 
           gap: '0.75rem', 
           background: 'var(--bg)', 
           padding: '0.75rem 1.25rem', 
           borderRadius: '1rem', 
           border: '1px solid var(--border)' 
         }}>
           <Search size={20} color="var(--text-muted)" />
           <input 
             type="text" 
             placeholder={`Rechercher dans ${activeTab === 'contacts' ? 'les contacts' : 'le catalogue'}...`}
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', width: '100%' }}
           />
         </div>
         <button className="glass" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '1rem', border: '1px solid var(--border)', cursor: 'pointer' }}>
            <Filter size={18} /> Filtres
         </button>
      </div>

      {activeTab === 'contacts' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {filteredContacts.map(c => (
            <motion.div
              key={c.id}
              whileHover={{ y: -5 }}
              onClick={() => onOpenDetail(c, 'base', 'contacts')}
              className="glass"
              style={{ padding: '1.5rem', borderRadius: '1.5rem', cursor: 'pointer', border: '1px solid var(--border)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '12px', background: 'var(--accent)10', color: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {c.type === 'Client' ? <Globe size={20} /> : <Building2 size={20} />}
                </div>
                <span style={{ 
                  fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '4px',
                  background: c.type === 'Client' ? '#10B98115' : c.type === 'Fournisseur' ? '#3B82F615' : '#F59E0B15',
                  color: c.type === 'Client' ? '#10B981' : c.type === 'Fournisseur' ? '#3B82F6' : '#F59E0B'
                }}>
                  {c.type}
                </span>
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{c.nom}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{c.email || 'Pas d\'email'}</p>
              
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {c.tags && c.tags.map(tag => (
                   <span key={tag} style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '10px', background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                      #{tag}
                   </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass" style={{ borderRadius: '1.5rem', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <tr>
                <th style={{ padding: '1.25rem' }}>Code</th>
                <th style={{ padding: '1.25rem' }}>Désignation</th>
                <th style={{ padding: '1.25rem' }}>Catégorie</th>
                <th style={{ padding: '1.25rem' }}>Type</th>
                <th style={{ padding: '1.25rem' }}>Prix Moyen</th>
                <th style={{ padding: '1.25rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => (
                <tr key={p.id} onClick={() => onOpenDetail(p, 'base', 'catalog')} style={{ borderTop: '1px solid var(--border)', cursor: 'pointer' }}>
                  <td style={{ padding: '1.25rem', fontWeight: 700, color: 'var(--accent)' }}>{p.code}</td>
                  <td style={{ padding: '1.25rem', fontWeight: 600 }}>{p.nom}</td>
                  <td style={{ padding: '1.25rem' }}>
                     <span style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: '6px', background: 'var(--bg-subtle)' }}>{p.categorie}</span>
                  </td>
                  <td style={{ padding: '1.25rem' }}>{p.type}</td>
                  <td style={{ padding: '1.25rem', fontWeight: 700 }}>{p.prixMoyen.toLocaleString()} FCFA</td>
                  <td style={{ padding: '1.25rem' }}>
                     <ExternalLink size={16} color="var(--text-muted)" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RecordModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        title={activeTab === 'contacts' ? "Nouveau Contact Partenaire" : "Nouveau Produit au Catalogue"}
        fields={activeTab === 'contacts' ? contactFields : productFields}
      />
    </div>
  );
};

export default MasterData;
