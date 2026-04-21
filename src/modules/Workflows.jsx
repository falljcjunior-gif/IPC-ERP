import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Plus, Trash2, ToggleLeft, ToggleRight, 
  ArrowRight, Settings2, Bell, FileText, Activity, Save, X
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';

const MODULES_MAP = {
  'sales.orders': 'Ventes (Devis / Commandes)',
  'finance.invoices': 'Finance (Factures)',
  'hr.leaves': 'RH (Congés)',
  'purchase.orders': 'Achats (Commandes)',
  'legal.contracts': 'Juridique (Contrats)',
  'signature.requests': 'Signature (Demandes)'
};

const Workflows = () => {
  const { data, addRecord, updateRecord, deleteRecord } = useBusiness();
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  
  const workflows = Array.isArray(data.workflows) ? data.workflows : (data.workflows?.[''] || data.workflows?.workflows || []);

  // Builder State
  const [wfName, setWfName] = useState('');
  const [targetModule, setTargetModule] = useState('sales.orders');
  const [triggerEvent, setTriggerEvent] = useState('onUpdate');
  const [conditionField, setConditionField] = useState('statut');
  const [operator, setOperator] = useState('==');
  const [conditionValue, setConditionValue] = useState('');
  const [actionType, setActionType] = useState('SEND_NOTIFICATION');
  const [actionTargetRole, setActionTargetRole] = useState('MANAGER');
  const [actionPayload, setActionPayload] = useState('');

  const handleSaveWorkflow = (e) => {
    e.preventDefault();
    addRecord('workflows', '', {
      name: wfName,
      targetModule,
      triggerEvent,
      conditionField,
      operator,
      value: conditionValue,
      actionType,
      actionTargetRole,
      actionPayload,
      active: true,
      createdAt: new Date().toISOString()
    });
    setIsBuilderOpen(false);
    resetBuilder();
  };

  const resetBuilder = () => {
    setWfName('');
    setTargetModule('sales.orders');
    setTriggerEvent('onUpdate');
    setConditionField('statut');
    setOperator('==');
    setConditionValue('');
    setActionType('SEND_NOTIFICATION');
    setActionTargetRole('MANAGER');
    setActionPayload('');
  };

  return (
    <div style={{ padding: '2.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
             <Zap color="var(--accent)" /> I.P.C. Automator
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Concevez des règles métier automatisées (Business Process Management).</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsBuilderOpen(true)}>
          <Plus size={18} /> Créer un Scénario
        </button>
      </div>

      {/* Liste des Workflows */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))', gap: '1.5rem' }}>
        {workflows.length === 0 ? (
          <div className="glass" style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', borderRadius: '2rem', border: '2px dashed var(--border)' }}>
             <Activity size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', margin: '0 auto' }} />
             <h3 style={{ color: 'var(--text-muted)' }}>Aucune automatisation en place</h3>
             <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Automatisez vos statuts et vos notifications via des règles SI/ALORS.</p>
          </div>
        ) : (
          workflows.map((wf) => (
            <motion.div
              key={wf.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass"
              style={{ padding: '1.5rem', borderRadius: '1.5rem', border: wf.active ? '2px solid var(--accent)50' : '2px solid transparent', opacity: wf.active ? 1 : 0.6 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', margin: 0, wordBreak: 'break-word', paddingRight: '1rem' }}>{wf.name}</h3>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                   <button 
                     onClick={() => updateRecord('workflows', '', wf.id, { active: !wf.active })}
                     style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: wf.active ? 'var(--accent)' : 'var(--text-muted)', padding: 0 }}
                   >
                     {wf.active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                   </button>
                   <button 
                    onClick={() => deleteRecord('workflows', '', wf.id)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 0, marginLeft: '0.5rem' }}
                   >
                     <Trash2 size={20} />
                   </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-subtle)', padding: '1rem', borderRadius: '1rem', fontSize: '0.85rem' }}>
                 <div style={{ display: 'flex', gap: '0.5rem' }}>
                   <strong style={{ color: 'var(--accent)' }}>QUAND</strong>
                   <span>{MODULES_MAP[wf.targetModule] || wf.targetModule} est {wf.triggerEvent === 'onUpdate' ? 'Modifié' : 'Créé'}</span>
                 </div>
                 <div style={{ display: 'flex', gap: '0.5rem' }}>
                   <strong style={{ color: '#F59E0B' }}>SI</strong>
                   <span>[{wf.conditionField}] {wf.operator} "{wf.value}"</span>
                 </div>
                 <div style={{ display: 'flex', gap: '0.5rem' }}>
                   <strong style={{ color: '#10B981' }}>ALORS</strong>
                   <span style={{ wordBreak: 'break-word' }}>
                     {wf.actionType === 'SEND_NOTIFICATION' ? `Notifier ${wf.actionTargetRole} : ${wf.actionPayload}` : `Changer statut -> ${wf.actionPayload}`}
                   </span>
                 </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal Constructeur de Workflow */}
      <AnimatePresence>
        {isBuilderOpen && (
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
               <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Settings2 size={20} /> Créateur d'Automatisation BI</h3>
                 <button className="btn" style={{ padding: '0.5rem' }} onClick={() => setIsBuilderOpen(false)}>
                   <X size={18} />
                 </button>
               </div>

               <div style={{ padding: '2rem', overflowY: 'auto' }}>
                 <form id="wf-form" onSubmit={handleSaveWorkflow}>
                   <div style={{ marginBottom: '2rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Nom de la Règle *</label>
                      <input required type="text" className="form-control" value={wfName} onChange={e => setWfName(e.target.value)} placeholder="Ex: Alerte Gros Devis Validé" />
                   </div>

                   {/* STEP 1: TRIGGER */}
                   <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem', background: 'var(--bg-subtle)', padding: '1.5rem', borderRadius: '1rem' }}>
                      <div style={{ background: 'var(--accent)', color: '#fff', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 800 }}>QUAND</div>
                      <select className="form-control" style={{ flex: 1 }} value={targetModule} onChange={e => setTargetModule(e.target.value)}>
                         {Object.entries(MODULES_MAP).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                      <span>est</span>
                      <select className="form-control" style={{ width: '150px' }} value={triggerEvent} onChange={e => setTriggerEvent(e.target.value)}>
                         <option value="onUpdate">Modifié</option>
                         <option value="onCreate">Créé</option>
                      </select>
                   </div>

                   {/* STEP 2: CONDITION */}
                   <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem', background: 'var(--bg-subtle)', padding: '1.5rem', borderRadius: '1rem' }}>
                      <div style={{ background: '#F59E0B', color: '#fff', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 800 }}>SI</div>
                      <span style={{ fontSize: '0.9rem' }}>Le champ</span>
                      <input required type="text" className="form-control" style={{ flex: 1 }} value={conditionField} onChange={e => setConditionField(e.target.value)} placeholder="Ex: statut ou montant" />
                      <select className="form-control" style={{ width: '150px' }} value={operator} onChange={e => setOperator(e.target.value)}>
                         <option value="==">Est égal à</option>
                         <option value="!=">Est différent de</option>
                         <option value=">">Est supérieur à</option>
                         <option value="<">Est inférieur à</option>
                         <option value="contains">Contient</option>
                      </select>
                      <input required type="text" className="form-control" style={{ flex: 1 }} value={conditionValue} onChange={e => setConditionValue(e.target.value)} placeholder="Ex: Validé" />
                   </div>

                   {/* STEP 3: ACTION */}
                   <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', background: 'var(--bg-subtle)', padding: '1.5rem', borderRadius: '1rem' }}>
                      <div style={{ background: '#10B981', color: '#fff', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 800 }}>ALORS</div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <select className="form-control" value={actionType} onChange={e => setActionType(e.target.value)}>
                           <option value="SEND_NOTIFICATION">Envoyer une Notification Interne</option>
                           <option value="UPDATE_STATUS">Forcer un changement de Statut</option>
                           <option value="LOG_ACTION">Générer un Log Traçable</option>
                        </select>
                        
                        {actionType === 'SEND_NOTIFICATION' && (
                          <div style={{ display: 'flex', gap: '1rem' }}>
                             <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Destinataire (Rôle ou ALL)</label>
                                <input required type="text" className="form-control" value={actionTargetRole} onChange={e => setActionTargetRole(e.target.value)} placeholder="MANAGER, ADMIN, ALL" />
                             </div>
                             <div style={{ flex: 2 }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Message (Variables: {`{id}`, `{nom}`, `{statut}`})</label>
                                <input required type="text" className="form-control" value={actionPayload} onChange={e => setActionPayload(e.target.value)} placeholder="Le statut est passé à {statut}" />
                             </div>
                          </div>
                        )}

                        {actionType === 'UPDATE_STATUS' && (
                           <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Nouveau Statut à appliquer</label>
                              <input required type="text" className="form-control" value={actionPayload} onChange={e => setActionPayload(e.target.value)} placeholder="Ex: Bloqué, Validation Requise..." />
                           </div>
                        )}

                        {actionType === 'LOG_ACTION' && (
                           <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Message du Log</label>
                              <input required type="text" className="form-control" value={actionPayload} onChange={e => setActionPayload(e.target.value)} placeholder="Log auto : Modification sensible" />
                           </div>
                        )}
                      </div>
                   </div>
                 </form>
               </div>

               <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button className="btn" onClick={() => setIsBuilderOpen(false)}>Annuler</button>
                  <button type="submit" form="wf-form" className="btn btn-primary"><Save size={16} /> Activer la Règle</button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Workflows;
