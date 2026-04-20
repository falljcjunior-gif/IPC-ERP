import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Package, Plus, Trash2, Save, Box, Search
} from 'lucide-react';
import { useBusiness } from '../../../BusinessContext';

const BomBuilderModal = ({ isOpen, onClose, onSave }) => {
  const { data, formatCurrency } = useBusiness();
  const products = data.inventory?.products || [];

  const [targetProduct, setTargetProduct] = useState('');
  const [version, setVersion] = useState('1.0');
  const [components, setComponents] = useState([]);

  // Search for component addition
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddComponent = (prod) => {
     if (components.find(c => c.productId === prod.id)) return;
     setComponents([...components, {
        productId: prod.id,
        nom: prod.nom,
        qte: 1,
        coutUnit: parseFloat(prod.coutUnit || 0)
     }]);
     setSearchQuery('');
  };

  const updateComponentQte = (id, newQte) => {
     setComponents(components.map(c => c.productId === id ? { ...c, qte: parseFloat(newQte || 0) } : c));
  };

  const removeComponent = (id) => {
     setComponents(components.filter(c => c.productId !== id));
  };

  const filteredProducts = products.filter(p => p.nom?.toLowerCase().includes(searchQuery.toLowerCase()) || p.code?.toLowerCase().includes(searchQuery.toLowerCase()));

  const totalCost = useMemo(() => {
     return components.reduce((acc, c) => acc + (c.coutUnit * c.qte), 0);
  }, [components]);

  const handleSave = (e) => {
     e.preventDefault();
     if (!targetProduct) return alert('Sélectionnez un produit fini.');
     if (components.length === 0) return alert('Ajoutez au moins un composant à la recette.');
     
     // Find product name
     const targetP = products.find(p => p.id === targetProduct);
     
     const bomData = {
        produit: targetP ? targetP.nom : targetProduct, // Backward compat with simple text Schema
        productId: targetProduct,
        version,
        status: 'Actif',
        coutEstime: totalCost,
        components: JSON.stringify(components) // Stringified for schema safety
     };

     onSave(bomData);
     // Reset
     setTargetProduct('');
     setComponents([]);
     setVersion('1.0');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      >
         <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="glass"
            style={{ width: '100%', maxWidth: '800px', background: 'var(--bg-color)', borderRadius: '1.5rem', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}
         >
            {/* Modal Header */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
                  <Package size={22} color="#8B5CF6" /> Constructeur de Nomenclature (BOM)
               </h3>
               <button className="btn" style={{ padding: '0.5rem' }} onClick={onClose}><X size={18} /></button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }}>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div>
                     <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>Produit Fini Cible *</label>
                     <select required className="form-control" value={targetProduct} onChange={e => setTargetProduct(e.target.value)}>
                        <option value="">-- Sélectionner un produit à fabriquer --</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.code ? `[${p.code}]` : ''} {p.nom}</option>)}
                     </select>
                  </div>
                  <div>
                     <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>Version / Révision</label>
                     <input type="text" className="form-control" value={version} onChange={e => setVersion(e.target.value)} />
                  </div>
               </div>

               <hr style={{ borderColor: 'var(--border-color)', marginBottom: '2rem' }} />

               {/* Composants Section */}
               <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                     <h4 style={{ fontWeight: 800, margin: 0 }}>Recette / Composants</h4>
                     <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Matières premières ou sous-ensembles nécessaires pour produire 1 unité.</p>
                  </div>
                  <div style={{ position: 'relative', width: '300px' }}>
                     <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                     <input 
                        type="text" className="form-control" 
                        placeholder="Chercher dans l'inventaire..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ paddingLeft: '2rem' }}
                     />
                     {/* Quick Search Dropdown */}
                     {searchQuery.length > 1 && (
                        <div className="glass" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, maxHeight: '200px', overflowY: 'auto', borderRadius: '0.5rem', marginTop: '0.25rem', padding: '0.5rem' }}>
                           {filteredProducts.slice(0, 10).map(p => (
                              <div 
                                 key={p.id} 
                                 onClick={() => handleAddComponent(p)}
                                 style={{ padding: '0.5rem', cursor: 'pointer', borderRadius: '0.25rem', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}
                                 onMouseOver={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                                 onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                              >
                                 <span>{p.nom}</span>
                                 <span style={{ color: 'var(--text-muted)' }}>{formatCurrency(p.coutUnit || 0)}</span>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               </div>

               <div className="glass" style={{ borderRadius: '1rem', padding: '1rem', background: 'var(--bg-subtle)' }}>
                  {components.length === 0 ? (
                     <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        <Box size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                        <p>Aucun composant ajouté. Recherchez-en un ci-dessus.</p>
                     </div>
                  ) : (
                     <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                           <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                              <th style={{ padding: '0.5rem', fontWeight: 600 }}>Composant</th>
                              <th style={{ padding: '0.5rem', fontWeight: 600, width: '150px' }}>Quantité</th>
                              <th style={{ padding: '0.5rem', fontWeight: 600, width: '150px' }}>Coût Unitaire</th>
                              <th style={{ padding: '0.5rem', fontWeight: 600, width: '150px' }}>Sous-total</th>
                              <th style={{ padding: '0.5rem', width: '50px' }}></th>
                           </tr>
                        </thead>
                        <tbody>
                           {components.map(c => (
                              <tr key={c.productId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                 <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{c.nom}</td>
                                 <td style={{ padding: '0.75rem 0.5rem' }}>
                                    <input 
                                       type="number" className="form-control" min="0.01" step="0.01"
                                       value={c.qte} onChange={e => updateComponentQte(c.productId, e.target.value)}
                                       style={{ padding: '0.4rem' }}
                                    />
                                 </td>
                                 <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>{formatCurrency(c.coutUnit)}</td>
                                 <td style={{ padding: '0.75rem 0.5rem', fontWeight: 800 }}>{formatCurrency(c.coutUnit * c.qte)}</td>
                                 <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                                    <button onClick={() => removeComponent(c.productId)} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '0.25rem' }}>
                                       <Trash2 size={16} />
                                    </button>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  )}
               </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-subtle)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>Coût Estimé Total :</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#8B5CF6' }}>{formatCurrency(totalCost)}</span>
               </div>
               <div style={{ display: 'flex', gap: '1rem' }}>
                  <button className="btn" onClick={onClose}>Annuler</button>
                  <button onClick={handleSave} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     <Save size={16} /> Enregistrer Nomenclature
                  </button>
               </div>
            </div>
         </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BomBuilderModal;
