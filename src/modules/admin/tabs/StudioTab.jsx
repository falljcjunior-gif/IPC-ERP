import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Database, ChevronRight,
  Type, Hash, Calendar,
  Info, Sparkles, Box, LayoutGrid,
  Save, MousePointer2, BadgeCheck
} from 'lucide-react';
import { useStore } from '../../../store';
import { registry } from '../../../services/Registry';

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', background: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: '1rem', border: '1px solid var(--border)', gap: '0.2rem', width: 'fit-content' }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)} style={{ padding: '0.5rem 1.25rem', borderRadius: '0.8rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', background: active === t.id ? 'var(--bg)' : 'transparent', color: active === t.id ? '#8B5CF6' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: '0.2s' }}>
        {t.icon} {t.label}
      </button>
    ))}
  </div>
);

const StudioTab = () => {
  const { schemaOverrides, updateSchemaOverride } = useStore();
  const [selectedSchemaId, setSelectedSchemaId] = useState('crm');
  const [selectedModelId, setSelectedModelId] = useState('opportunities');
  const [activeTab, setActiveTab] = useState('fields');

  const allSchemas = useMemo(() => Array.from(registry.schemas.values()), []);
  const currentSchema = useMemo(() => registry.getSchema(selectedSchemaId), [selectedSchemaId]);
  
  const models = useMemo(() => {
     if (!currentSchema) return [];
     return Object.keys(currentSchema.models).map(id => ({ id, ...currentSchema.models[id] }));
  }, [currentSchema]);

  const currentModelSchema = useMemo(() => {
     if (!currentSchema || !selectedModelId) return null;
     const base = currentSchema.models[selectedModelId];
     const overrides = schemaOverrides[`${selectedSchemaId}.${selectedModelId}`];
     return { ...base, ...overrides };
  }, [currentSchema, selectedModelId, selectedSchemaId, schemaOverrides]);

  const handleUpdateField = (fieldName, updates) => {
     const currentFields = { ...currentModelSchema.fields };
     currentFields[fieldName] = { ...currentFields[fieldName], ...updates };
     updateSchemaOverride(selectedSchemaId, selectedModelId, { fields: currentFields });
  };

  const handleToggleColumn = (colName) => {
     let newCols = [...(currentModelSchema.views.list || [])];
     if (newCols.includes(colName)) {
        newCols = newCols.filter(c => c !== colName);
     } else {
        newCols.push(colName);
     }
     updateSchemaOverride(selectedSchemaId, selectedModelId, { 
        views: { ...currentModelSchema.views, list: newCols } 
     });
  };

  if (!currentSchema) return <div style={{ padding: '4rem', textAlign: 'center' }}>Initialisation du registre...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2.5rem' }}>
       {/* Sidebar : Registry Explorer */}
       <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid var(--border)', background: 'var(--bg)' }}>
             <h3 style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1.25rem', letterSpacing: '1px' }}>Modules & Schémas</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {allSchemas.map(s => (
                   <button key={s.id} onClick={() => { setSelectedSchemaId(s.id); setSelectedModelId(Object.keys(s.models)[0]); }}
                      style={{ 
                         display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', borderRadius: '1rem', border: 'none', cursor: 'pointer',
                         background: selectedSchemaId === s.id ? '#8B5CF615' : 'transparent',
                         color: selectedSchemaId === s.id ? '#8B5CF6' : 'var(--text)',
                         fontWeight: 700, fontSize: '0.85rem', textAlign: 'left', transition: '0.2s'
                      }}>
                      {s.label}
                      {selectedSchemaId === s.id && <ChevronRight size={14} />}
                   </button>
                ))}
             </div>
          </div>

          <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid var(--border)', background: 'var(--bg)' }}>
             <h3 style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1.25rem', letterSpacing: '1px' }}>Modèles de {currentSchema.label}</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {models.map(m => (
                   <button key={m.id} onClick={() => setSelectedModelId(m.id)}
                      style={{ 
                         display: 'flex', alignItems: 'center', gap: '10px', padding: '0.8rem 1rem', borderRadius: '1rem', border: 'none', cursor: 'pointer',
                         background: selectedModelId === m.id ? 'var(--bg-subtle)' : 'transparent',
                         color: selectedModelId === m.id ? 'var(--text)' : 'var(--text-muted)',
                         fontWeight: 700, fontSize: '0.8rem', textAlign: 'left', transition: '0.2s'
                      }}>
                      <Box size={14} /> {m.label}
                   </button>
                ))}
             </div>
          </div>
       </aside>

       {/* Main Editor : Meta-Workbench */}
       <main style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass" style={{ padding: '1.5rem 2rem', borderRadius: '2rem', border: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: '14px', background: '#8B5CF615', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8B5CF6' }}>
                   <Database size={22} />
                </div>
                <div>
                   <h2 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0 }}>Modèle : {currentModelSchema.label}</h2>
                   <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, fontWeight: 600 }}>ID Technique : {selectedSchemaId}.{selectedModelId}</p>
                </div>
             </div>
             <TabBar tabs={[
                { id: 'fields', label: 'Champs', icon: <Type size={14}/> },
                { id: 'views', label: 'Colonnes Liste', icon: <LayoutGrid size={14}/> },
                { id: 'kanban', label: 'Kanban', icon: <Box size={14}/> },
             ]} active={activeTab} onChange={setActiveTab} />
          </div>

          <AnimatePresence mode="wait">
             {activeTab === 'fields' && (
                <motion.div key="fields" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} 
                   style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                   {Object.entries(currentModelSchema.fields).map(([name, f]) => (
                      <div key={name} className="glass" style={{ padding: '1.25rem 1.5rem', borderRadius: '1.5rem', border: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                         <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            {f.type === 'date' ? <Calendar size={18}/> : f.type === 'number' || f.type === 'money' ? <Hash size={18}/> : <Type size={18}/>}
                         </div>
                         <div style={{ flex: 1 }}>
                            <input type="text" value={f.label} onChange={(e) => handleUpdateField(name, { label: e.target.value })}
                               style={{ background: 'transparent', border: 'none', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text)', outline: 'none', width: '100%' }} />
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>{f.type} • ID: {name}</div>
                         </div>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div onClick={() => handleUpdateField(name, { required: !f.required })} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                               <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--border)', background: f.required ? '#8B5CF6' : 'transparent', transition: '0.2s' }} />
                               <span style={{ fontSize: '0.75rem', fontWeight: 700, color: f.required ? '#8B5CF6' : 'var(--text-muted)' }}>Obligatoire</span>
                             </div>
                             <button className="glass" style={{ padding: '0.6rem', border: 'none', borderRadius: '10px', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={18}/></button>
                         </div>
                      </div>
                   ))}
                   <button className="glass" style={{ padding: '1.25rem', borderRadius: '1.75rem', border: '1px dashed #8B5CF650', color: '#8B5CF6', background: '#8B5CF605', fontWeight: 900, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer' }}>
                      <Plus size={18} /> Ajouter un champ personnalisé
                   </button>
                </motion.div>
             )}

             {activeTab === 'views' && (
                <motion.div key="views" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass" style={{ padding: '2.5rem', borderRadius: '2.5rem', border: '1px solid var(--border)', background: 'var(--bg)' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <MousePointer2 size={18} color="#8B5CF6" />
                      <h4 style={{ fontWeight: 900, margin: 0 }}>Gestion des Colonnes de Liste</h4>
                   </div>
                   <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2.5rem', fontWeight: 500 }}>Séquencez et activez les champs visibles dans les tableaux de ce module.</p>
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: '1rem' }}>
                      {Object.entries(currentModelSchema.fields).map(([name, f]) => {
                         const isActive = currentModelSchema.views.list.includes(name);
                         return (
                            <motion.div key={name} whileHover={{ scale: 1.02 }} onClick={() => handleToggleColumn(name)}
                               style={{ padding: '1rem 1.25rem', borderRadius: '1.25rem', border: `1px solid ${isActive ? '#8B5CF6' : 'var(--border)'}`, background: isActive ? '#8B5CF608' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: '0.2s' }}>
                               <div style={{ width: 22, height: 22, borderRadius: '6px', border: '2px solid var(--border)', background: isActive ? '#8B5CF6' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                  {isActive && <BadgeCheck size={14} color="white" />}
                               </div>
                               <span style={{ fontSize: '0.9rem', fontWeight: 800, color: isActive ? '#8B5CF6' : 'var(--text)' }}>{f.label}</span>
                            </motion.div>
                         );
                      })}
                   </div>
                </motion.div>
             )}

             {activeTab === 'kanban' && (
                <motion.div key="kanban" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass" style={{ padding: '2.5rem', borderRadius: '2.5rem', border: '1px solid var(--border)', background: 'var(--bg)' }}>
                    <h4 style={{ fontWeight: 900, marginBottom: '2rem' }}>Configuration Kanban & Pipelines</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                          <div>
                             <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, marginBottom: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Champ de Groupage (Colonnes)</label>
                             <select className="glass" value={currentModelSchema.views.kanban?.groupField} onChange={(e) => updateSchemaOverride(selectedSchemaId, selectedModelId, { views: { ...currentModelSchema.views, kanban: { ...currentModelSchema.views.kanban, groupField: e.target.value } } })}
                                style={{ width: '100%', padding: '1.2rem', borderRadius: '1.25rem', background: 'var(--bg-subtle)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 700 }}>
                                {Object.entries(currentModelSchema.fields).map(([name, f]) => <option key={name} value={name}>{f.label}</option>)}
                             </select>
                          </div>
                          <div>
                             <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, marginBottom: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Titre de Carte</label>
                             <select className="glass" value={currentModelSchema.views.kanban?.titleField} onChange={(e) => updateSchemaOverride(selectedSchemaId, selectedModelId, { views: { ...currentModelSchema.views, kanban: { ...currentModelSchema.views.kanban, titleField: e.target.value } } })}
                                style={{ width: '100%', padding: '1.2rem', borderRadius: '1.25rem', background: 'var(--bg-subtle)', color: 'var(--text)', border: '1px solid var(--border)', fontWeight: 700 }}>
                                {Object.entries(currentModelSchema.fields).map(([name, f]) => <option key={name} value={name}>{f.label}</option>)}
                             </select>
                          </div>
                       </div>
                       <div style={{ padding: '1.5rem', borderRadius: '1.5rem', background: '#F59E0B08', border: '1px dashed #F59E0B30', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <Info size={20} color="#F59E0B" />
                          <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#F59E0B' }}>
                             Les changements apportés ici impactent instantanément l&apos;affichage du module pour tous les utilisateurs habilités.
                          </p>
                       </div>
                    </div>
                </motion.div>
             )}
          </AnimatePresence>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '1.5rem', borderRadius: '1.75rem', background: '#0F172A', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.2)', color: '#8B5CF6' }}>
                   <Sparkles size={20} />
                </div>
                <div>
                   <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>Enregistrement Permanent</div>
                   <div style={{ fontSize: '0.7rem', opacity: 0.7, fontWeight: 500 }}>Cliquez pour synchroniser avec l&apos;infrastructure persistante.</div>
                </div>
             </div>
             <button className="btn-primary" style={{ padding: '0.8rem 1.75rem', borderRadius: '1.25rem', background: '#8B5CF6', borderColor: '#8B5CF6', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Save size={18} /> Publier le Schéma
             </button>
          </motion.div>
       </main>

       <style>{`
          select { outline: none; appearance: none; cursor: pointer; }
       `}</style>
    </div>
  );
};

export default StudioTab;
