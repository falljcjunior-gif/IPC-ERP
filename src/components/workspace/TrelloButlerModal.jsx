import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Save, Trash2, Plus, Zap } from 'lucide-react';

const TrelloButlerModal = ({ project, updateProject, onClose }) => {
  const [activeTab, setActiveTab] = useState('rules'); // 'rules' | 'fields'

  const [rules, setRules] = useState(project.rules || []);
  const [isCreating, setIsCreating] = useState(false);

  // Rules state
  const [triggerType, setTriggerType] = useState('move');
  const [triggerColId, setTriggerColId] = useState(project.colonnes?.[0]?.id || '');
  const [effectType, setEffectType] = useState('mark_done');

  // Fields state
  const [fields, setFields] = useState(project.customFields || []);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');

  // Helpers to get neat text
  const colName = (id) => project.colonnes?.find(c => c.id === id)?.title || 'Inconnue';

  const saveRule = () => {
    const newRule = {
      id: 'rule_' + Date.now(),
      trigger: { type: triggerType, targetColId: triggerColId },
      effect: { type: effectType }
    };
    const newRules = [...rules, newRule];
    setRules(newRules);
    updateProject(project.id, { rules: newRules });
    setIsCreating(false);
  };

  const deleteRule = (ruleId) => {
    const newRules = rules.filter(r => r.id !== ruleId);
    setRules(newRules);
    updateProject(project.id, { rules: newRules });
  };

  const addField = () => {
    if (!newFieldName.trim()) return;
    const newField = { id: 'cf_' + Date.now(), name: newFieldName, type: newFieldType };
    const newFields = [...fields, newField];
    setFields(newFields);
    updateProject(project.id, { customFields: newFields });
    setNewFieldName('');
  };

  const deleteField = (fieldId) => {
    const newFields = fields.filter(f => f.id !== fieldId);
    setFields(newFields);
    updateProject(project.id, { customFields: newFields });
  };

  const getRuleText = (rule) => {
    let t = '';
    if (rule.trigger.type === 'move') t += `Si on déplace une carte dans "${colName(rule.trigger.targetColId)}"`;
    t += ' ➔ ';
    if (rule.effect.type === 'mark_done') t += 'Marquer la tâche comme terminée et cocher les cases';
    if (rule.effect.type === 'add_green_label') t += 'Ajouter une étiquette verte "Validé"';
    if (rule.effect.type === 'assign_me') t += "M'assigner automatiquement";
    return t;
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto' }}>
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        style={{ background: 'var(--bg)', width: '100%', maxWidth: '600px', margin: '4rem auto', borderRadius: '16px', padding: '2rem', position: 'relative' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: '#F59E0B20', color: '#F59E0B', padding: '0.5rem', borderRadius: '12px' }}><Bot size={28} /></div>
            <div>
               <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>I.P.C Butler & Power-Ups</h2>
               <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Configuration avancée du tableau</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-subtle)', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Fermer</button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
           <button 
             onClick={() => setActiveTab('rules')} 
             style={{ background: 'transparent', border: 'none', borderBottom: activeTab === 'rules' ? '3px solid #F59E0B' : '3px solid transparent', padding: '0.5rem 1rem', color: activeTab === 'rules' ? '#F59E0B' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer' }}
           >Règles (Automates)</button>
           <button 
             onClick={() => setActiveTab('fields')} 
             style={{ background: 'transparent', border: 'none', borderBottom: activeTab === 'fields' ? '3px solid #F59E0B' : '3px solid transparent', padding: '0.5rem 1rem', color: activeTab === 'fields' ? '#F59E0B' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer' }}
           >Champs Personnalisés</button>
        </div>

        {activeTab === 'rules' && (
          <>
            {/* Existing Rules */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
               <h3 style={{ fontSize: '1rem', margin: 0 }}>Règles Actives ({rules.length})</h3>
               {rules.map(rule => (
                  <div key={rule.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-subtle)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', fontWeight: 600 }}>
                        <Zap size={16} color="#F59E0B" /> {getRuleText(rule)}
                     </div>
                     <button onClick={() => deleteRule(rule.id)} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </div>
               ))}
               {rules.length === 0 && (
                 <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', background: 'var(--bg-subtle)', borderRadius: '8px', fontSize: '0.9rem' }}>
                   Aucune automatisation Butler définie.
                 </div>
               )}
            </div>

            {/* Create Form */}
            {isCreating ? (
              <div style={{ background: 'var(--bg-subtle)', border: '1px solid #CBD5E1', padding: '1.5rem', borderRadius: '12px' }}>
                <h4 style={{ margin: '0 0 1rem 0' }}>Nouvelle règle</h4>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>Déclencheur (Si...)</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select value={triggerType} onChange={e => setTriggerType(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                      <option value="move">Une carte est déplacée vers</option>
                    </select>
                    <select value={triggerColId} onChange={e => setTriggerColId(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', flex: 1 }}>
                      {project.colonnes?.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>Action (Alors...)</label>
                  <select value={effectType} onChange={e => setEffectType(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', width: '100%' }}>
                    <option value="mark_done">Marquer la tâche comme terminée</option>
                    <option value="add_green_label">Ajouter une étiquette verte "Validé"</option>
                    <option value="assign_me">M'assigner automatiquement</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                   <button onClick={() => setIsCreating(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Annuler</button>
                   <button onClick={saveRule} className="btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Save size={16} /> Enregistrer la règle</button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsCreating(true)}
                style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '2px dashed var(--border)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Plus size={18} /> Créer une règle personnalisée
              </button>
            )}
          </>
        )}

        {activeTab === 'fields' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', margin: 0 }}>Champs Personnalisés ({fields.length})</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Ces champs apparaîtront sur chaque carte de ce projet pour stocker des données spécifiques.</p>
            
            {fields.map(f => (
              <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-subtle)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                 <div>
                   <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{f.name}</span>
                   <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', background: '#E2E8F0', padding: '1px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>{f.type}</span>
                 </div>
                 <button onClick={() => deleteField(f.id)} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
              </div>
            ))}

            <div style={{ marginTop: '1.5rem', background: 'var(--bg-subtle)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem' }}>Ajouter un nouveau champ</h4>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  placeholder="Nom du champ (ex: Facture #)"
                  value={newFieldName}
                  onChange={e => setNewFieldName(e.target.value)}
                  style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)' }}
                />
                <select value={newFieldType} onChange={e => setNewFieldType(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <option value="text">Texte</option>
                  <option value="number">Nombre</option>
                  <option value="date">Date</option>
                </select>
                <button onClick={addField} className="btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: '6px' }}><Plus size={16} /></button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TrelloButlerModal;
