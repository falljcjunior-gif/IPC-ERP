import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Database, 
  ChevronRight, 
  Search,
  Type,
  Hash,
  Calendar,
  List as ListIcon,
  ToggleRight,
  Eye,
  Info,
  Sparkles
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';

const Studio = () => {
  const { config, addCustomField } = useBusiness();
  const [selectedModule, setSelectedModule] = useState('crm');
  const [isAdding, setIsAdding] = useState(false);
  const [newField, setNewField] = useState({ label: '', type: 'text', required: false });

  const modules = [
    { id: 'crm', label: 'CRM', icon: 'Users' },
    { id: 'sales', label: 'Ventes', icon: 'ShoppingCart' },
    { id: 'inventory', label: 'Stocks', icon: 'Package' },
    { id: 'accounting', label: 'Comptabilité', icon: 'FileText' },
    { id: 'hr', label: 'RH', icon: 'Users2' },
    { id: 'contracts', label: 'Contrats', icon: 'FileSignature' },
  ];

  const handleAddField = () => {
    if (!newField.label) return;
    const fieldId = newField.label.toLowerCase().replace(/\s+/g, '_');
    addCustomField(selectedModule, { ...newField, name: fieldId });
    setNewField({ label: '', type: 'text', required: false });
    setIsAdding(false);
  };

  const getFieldIcon = (type) => {
    switch (type) {
      case 'text': return <Type size={16} />;
      case 'number': return <Hash size={16} />;
      case 'date': return <Calendar size={16} />;
      case 'select': return <ListIcon size={16} />;
      default: return <Database size={16} />;
    }
  };

  const currentFields = config.customFields[selectedModule] || [];

  return (
    <div style={{ padding: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
             <h1 style={{ fontSize: '2rem', margin: 0 }}>IPC Studio</h1>
             <span className="badge" style={{ background: 'var(--accent)15', color: 'var(--accent)', fontWeight: 800 }}>BETA NO-CODE</span>
          </div>
          <p style={{ color: 'var(--text-muted)' }}>Étendez votre ERP en ajoutant des champs personnalisés dynamiques sans code.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <button className="glass" style={{ padding: '0.75rem 1.25rem', borderRadius: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Eye size={18} /> Prévisualiser
           </button>
           <button onClick={() => setIsAdding(true)} className="btn btn-primary">
              <Plus size={18} /> Ajouter un champ
           </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2.5rem' }}>
        {/* Module Sidebar */}
        <aside>
           <div className="glass" style={{ padding: '1rem', borderRadius: '1.25rem' }}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', paddingLeft: '0.5rem' }}>SÉLECTIONNER UN MODULE</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                 {modules.map(mod => (
                   <div 
                     key={mod.id}
                     onClick={() => setSelectedModule(mod.id)}
                     className="glass"
                     style={{ 
                       padding: '0.85rem 1rem', borderRadius: '1rem', cursor: 'pointer',
                       background: selectedModule === mod.id ? 'var(--accent)10' : 'transparent',
                       color: selectedModule === mod.id ? 'var(--accent)' : 'var(--text)',
                       border: selectedModule === mod.id ? '1px solid var(--accent)' : '1px solid transparent',
                       fontWeight: 600, fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                     }}
                   >
                     <span>{mod.label}</span>
                     {selectedModule === mod.id && <ChevronRight size={16} />}
                   </div>
                 ))}
              </div>
           </div>
           
           <div className="glass" style={{ marginTop: '1.5rem', padding: '1.5rem', borderRadius: '1.25rem', background: 'var(--primary)', color: 'white' }}>
              <Sparkles size={24} style={{ marginBottom: '1rem', opacity: 0.8 }} />
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>Conseil Studio</div>
              <p style={{ fontSize: '0.75rem', lineHeight: 1.5, opacity: 0.8 }}>Utilisez des noms de champs explicites. Les nouveaux champs seront visibles dans le formulaire de création et la vue détaillée du module {selectedModule.toUpperCase()}.</p>
           </div>
        </aside>

        {/* Studio Content */}
        <main>
           <div className="glass" style={{ borderRadius: '1.5rem', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                 <h2 style={{ fontSize: '1.25rem' }}>Champs personnalisés : {modules.find(m => m.id === selectedModule)?.label}</h2>
                 <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{currentFields.length} champs actifs</span>
              </div>

              {isAdding && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass" 
                  style={{ padding: '1.5rem', borderRadius: '1.25rem', marginBottom: '2rem', background: 'var(--bg-subtle)' }}
                >
                   <div className="grid grid-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
                      <div>
                         <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>Libellé du champ</label>
                         <input 
                           type="text" 
                           className="glass"
                           value={newField.label}
                           onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                           placeholder="Ex: Température de stockage"
                           style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', outline: 'none' }}
                         />
                      </div>
                      <div>
                         <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>Type de données</label>
                         <select 
                           className="glass"
                           value={newField.type}
                           onChange={(e) => setNewField({ ...newField, type: e.target.value })}
                           style={{ width: '100%', padding: '0.75rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', outline: 'none' }}
                         >
                            <option value="text">Texte court</option>
                            <option value="number">Nombre / Devise</option>
                            <option value="date">Date</option>
                            <option value="select">Liste de choix</option>
                            <option value="boolean">Oui/Non</option>
                         </select>
                      </div>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div 
                        onClick={() => setNewField({ ...newField, required: !newField.required })}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                      >
                         <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '1px solid var(--border)', background: newField.required ? 'var(--accent)' : 'white' }} />
                         <span style={{ fontSize: '0.85rem' }}>Champ obligatoire</span>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                         <button onClick={() => setIsAdding(false)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>Annuler</button>
                         <button onClick={handleAddField} className="btn btn-primary" style={{ padding: '0.5rem 1.5rem' }}>Enregistrer</button>
                      </div>
                   </div>
                </motion.div>
              )}

              {currentFields.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
                   <Database size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                   <p>Aucun champ personnalisé pour ce module.</p>
                   <button onClick={() => setIsAdding(true)} className="btn" style={{ color: 'var(--accent)', marginTop: '1rem' }}>Commencer à construire</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                   {currentFields.map((field, idx) => (
                     <div 
                       key={idx}
                       className="glass" 
                       style={{ padding: '1rem 1.5rem', borderRadius: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                     >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                           <div style={{ padding: '0.5rem', borderRadius: '0.75rem', background: 'var(--bg-subtle)', color: 'var(--accent)' }}>
                              {getFieldIcon(field.type)}
                           </div>
                           <div>
                              <div style={{ fontWeight: 700 }}>{field.label}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{field.type} • {field.name}</div>
                           </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                           {field.required && <span style={{ fontSize: '0.65rem', background: '#EF444415', color: '#EF4444', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>REQUIS</span>}
                           <button className="glass" style={{ padding: '0.4rem', borderRadius: '0.5rem', border: 'none' }}><Edit3 size={16} /></button>
                           <button className="glass" style={{ padding: '0.4rem', borderRadius: '0.5rem', border: 'none', color: '#EF4444' }}><Trash2 size={16} /></button>
                        </div>
                     </div>
                   ))}
                </div>
              )}
           </div>
           
           <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <Info size={16} />
              <span>Les modifications du Studio sont appliquées via la couche d'abstraction IPC Metadata.</span>
           </div>
        </main>
      </div>
    </div>
  );
};

export default Studio;
