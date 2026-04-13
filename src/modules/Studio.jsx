import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Edit3, Database, ChevronRight, Search,
  Type, Hash, Calendar, List as ListIcon, ToggleRight,
  Eye, Info, Sparkles, Box, LayoutGrid, FileText, Settings as SettingsIcon,
  RefreshCcw, Save, Trash
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import { registry } from '../services/Registry';

/* ─── Helpers ─── */
const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', background: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: '0.9rem', border: '1px solid var(--border)', gap: '0.2rem', width: 'fit-content' }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)} style={{ padding: '0.45rem 1rem', borderRadius: '0.7rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', background: active === t.id ? 'var(--bg)' : 'transparent', color: active === t.id ? 'var(--accent)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {t.icon} {t.label}
      </button>
    ))}
  </div>
);

/* ════════════════════════════════════
   IPC STUDIO — The Meta-Workbench
   ════════════════════════════════════ */
const Studio = () => {
  const { schemaOverrides, updateSchemaOverride } = useBusiness();
  const [selectedSchemaId, setSelectedSchemaId] = useState('crm');
  const [selectedModelId, setSelectedModelId] = useState('opportunities');
  const [activeTab, setActiveTab] = useState('fields'); // 'fields' | 'views' | 'kanban'

  // Get all registered schemas
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

  if (!currentSchema) return <div>No schemas registered.</div>;

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
       {/* Header */}
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>
                <Sparkles size={18} />
                <span style={{ fontWeight: 800, fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>IPC Platform — Logic Workbench</span>
             </div>
             <h1 style={{ fontSize: '2rem', fontWeight: 800, margin:0 }}>IPC Studio</h1>
             <p style={{ color: 'var(--text-muted)', margin: '0.3rem 0 0 0' }}>Configurez vos modèles de données et votre interface en temps réel.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
             <button onClick={() => window.location.reload()} className="glass" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1.25rem', borderRadius: '0.8rem', fontWeight: 600, border: '1px solid var(--border)' }}>
                <RefreshCcw size={16} /> Réinitialiser
             </button>
             <button className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', borderRadius: '0.8rem' }}>
                <Save size={16} /> Publier les Changements
             </button>
          </div>
       </div>

       <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2.5rem' }}>
          {/* Navigation Sidebar */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
             <div className="glass" style={{ padding: '1.25rem', borderRadius: '1.25rem' }}>
                <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>Modules & Schémas</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                   {allSchemas.map(s => (
                      <button key={s.id} onClick={() => { setSelectedSchemaId(s.id); setSelectedModelId(Object.keys(s.models)[0]); }}
                         style={{ 
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: '0.8rem', border: 'none', cursor: 'pointer',
                            background: selectedSchemaId === s.id ? 'var(--accent)15' : 'transparent',
                            color: selectedSchemaId === s.id ? 'var(--accent)' : 'var(--text)',
                            fontWeight: 700, fontSize: '0.86rem', textAlign: 'left'
                         }}>
                         {s.label}
                         {selectedSchemaId === s.id && <ChevronRight size={14} />}
                      </button>
                   ))}
                </div>
             </div>

             <div className="glass" style={{ padding: '1.25rem', borderRadius: '1.25rem' }}>
                <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem' }}>Modèles de {currentSchema.label}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                   {models.map(m => (
                      <button key={m.id} onClick={() => setSelectedModelId(m.id)}
                         style={{ 
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '0.65rem 0.85rem', borderRadius: '0.7rem', border: 'none', cursor: 'pointer',
                            background: selectedModelId === m.id ? 'var(--bg-subtle)' : 'transparent',
                            color: selectedModelId === m.id ? 'var(--text)' : 'var(--text-muted)',
                            fontWeight: 600, fontSize: '0.82rem', textAlign: 'left'
                         }}>
                         <Box size={14} /> {m.label}
                      </button>
                   ))}
                </div>
             </div>
          </aside>

          {/* Editor Area */}
          <main style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
             <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                   <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'var(--accent)10', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                      <Database size={22} />
                   </div>
                   <div>
                      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Modèle : {currentModelSchema.label}</h2>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Technique ID: {selectedSchemaId}.{selectedModelId}</p>
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
                         <div key={name} className="glass" style={{ padding: '1rem 1.5rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                               {f.type === 'date' ? <Calendar size={16}/> : f.type === 'number' || f.type === 'money' ? <Hash size={16}/> : <Type size={16}/>}
                            </div>
                            <div style={{ flex: 1 }}>
                               <input type="text" value={f.label} onChange={(e) => handleUpdateField(name, { label: e.target.value })}
                                  style={{ background: 'transparent', border: 'none', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', outline: 'none', width: '100%' }} />
                               <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{f.type} • ID: {name}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                               <div onClick={() => handleUpdateField(name, { required: !f.required })} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <div style={{ width: 14, height: 14, borderRadius: '4px', border: '1px solid var(--border)', background: f.required ? 'var(--accent)' : 'transparent' }} />
                                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Obligatoire</span>
                                </div>
                                <button className="glass" style={{ padding: '0.5rem', border: 'none', borderRadius: '8px', color: '#EF4444' }}><Trash2 size={16}/></button>
                            </div>
                         </div>
                      ))}
                      <button className="glass" style={{ padding: '1rem', borderRadius: '1.25rem', border: '1px dashed var(--border)', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                         <Plus size={16} /> Ajouter un champ personnalisé
                      </button>
                   </motion.div>
                )}

                {activeTab === 'views' && (
                   <motion.div key="views" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem' }}>
                      <h4 style={{ fontWeight: 800, marginBottom: '1.25rem' }}>Gestion de la vue Liste</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Sélectionnez les champs que vous souhaitez afficher dans les colonnes de votre tableau.</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                         {Object.entries(currentModelSchema.fields).map(([name, f]) => {
                            const isActive = currentModelSchema.views.list.includes(name);
                            return (
                               <div key={name} onClick={() => handleToggleColumn(name)}
                                  style={{ padding: '0.85rem 1.25rem', borderRadius: '1rem', border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`, background: isActive ? 'var(--accent)08' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div style={{ width: 18, height: 18, borderRadius: '4px', border: '1px solid var(--border)', background: isActive ? 'var(--accent)' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                     {isActive && <Eye size={12} color="white" />}
                                  </div>
                                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: isActive ? 'var(--accent)' : 'var(--text)' }}>{f.label}</span>
                               </div>
                            );
                         })}
                      </div>
                   </motion.div>
                )}

                {activeTab === 'kanban' && (
                   <motion.div key="kanban" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem' }}>
                       <h4 style={{ fontWeight: 800, marginBottom: '1.25rem' }}>Configuration Kanban</h4>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                          <div>
                             <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Champ de Groupage (Colonnes)</label>
                             <select className="glass" value={currentModelSchema.views.kanban?.groupField} onChange={(e) => updateSchemaOverride(selectedSchemaId, selectedModelId, { views: { ...currentModelSchema.views, kanban: { ...currentModelSchema.views.kanban, groupField: e.target.value } } })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.8rem', background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                                {Object.entries(currentModelSchema.fields).map(([name, f]) => <option key={name} value={name}>{f.label}</option>)}
                             </select>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                             <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Titre de Carte</label>
                                <select className="glass" value={currentModelSchema.views.kanban?.titleField} onChange={(e) => updateSchemaOverride(selectedSchemaId, selectedModelId, { views: { ...currentModelSchema.views, kanban: { ...currentModelSchema.views.kanban, titleField: e.target.value } } })}
                                   style={{ width: '100%', padding: '0.75rem', borderRadius: '0.8rem', background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                                   {Object.entries(currentModelSchema.fields).map(([name, f]) => <option key={name} value={name}>{f.label}</option>)}
                                </select>
                             </div>
                             <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Valeur / Montant</label>
                                <select className="glass" value={currentModelSchema.views.kanban?.valueField} onChange={(e) => updateSchemaOverride(selectedSchemaId, selectedModelId, { views: { ...currentModelSchema.views, kanban: { ...currentModelSchema.views.kanban, valueField: e.target.value } } })}
                                   style={{ width: '100%', padding: '0.75rem', borderRadius: '0.8rem', background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                                   {Object.entries(currentModelSchema.fields).map(([name, f]) => <option key={name} value={name}>{f.label}</option>)}
                                </select>
                             </div>
                          </div>
                       </div>
                   </motion.div>
                )}
             </AnimatePresence>

             <div className="glass" style={{ padding: '1.25rem', borderRadius: '1.25rem', background: 'var(--bg-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                   <Info size={16} />
                   <span>Les modifications sont enregistrées automatiquement en session locale. Cliquez sur "Publier" pour une activation permanente (simulation).</span>
                </div>
             </div>
          </main>
       </div>
    </div>
  );
};

export default Studio;
