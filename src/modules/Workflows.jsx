import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Plus, Trash2, ToggleLeft, ToggleRight, 
  ArrowRight, Settings2, Bell, FileText, Activity, Save, X
} from 'lucide-react';
import { useStore } from '../store';
// [AUDIT] Correction: Utilisation du Registry pour un couplage lâche
import { registry } from '../services/Registry';

const Workflows = () => {
  const workflows = useStore(state => state.data?.workflows || []);
  const addRecord = useStore(state => state.addRecord);
  const updateRecord = useStore(state => state.updateRecord);
  const deleteRecord = useStore(state => state.deleteRecord);
  const shellView = useStore(state => state.shellView || {});

  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  
  const MODULES_MAP = useMemo(() => {
    const map = {};
    registry.getIds().forEach(id => {
      const config = registry.getConfig(id);
      map[id] = config.label || id;
    });
    return map;
  }, []);

  // Builder State
  const [wfName, setWfName] = useState('');
  const [targetModule, setTargetModule] = useState(Object.keys(MODULES_MAP)[0] || 'sales');
  const [triggerEvent, setTriggerEvent] = useState('onUpdate');
  const [conditionField, setConditionField] = useState('statut');
  const [operator, setOperator] = useState('==');
  const [conditionValue, setConditionValue] = useState('');
  const [actionType, setActionType] = useState('SEND_NOTIFICATION');
  const [actionTargetRole, setActionTargetRole] = useState('MANAGER');
  const [actionPayload, setActionPayload] = useState('');

  const handleSaveWorkflow = (e) => {
    e.preventDefault();
    if (wfName.length < 3) return;
    
    const payload = {
      name: wfName.trim(),
      targetModule,
      triggerEvent,
      conditionField: conditionField.trim().replace(/[^a-zA-Z._]/g, ''),
      operator,
      value: conditionValue.trim(),
      actionType,
      actionTargetRole: actionTargetRole.trim().toUpperCase(),
      actionPayload: actionPayload.trim(),
      active: true,
      _createdBy: 'user_flow',
      createdAt: new Date().toISOString()
    };

    addRecord('workflows', '', payload);
    setIsBuilderOpen(false);
    resetBuilder();
  };

  const resetBuilder = () => {
    setWfName('');
    setTargetModule('sales');
    setTriggerEvent('onUpdate');
    setConditionField('statut');
    setOperator('==');
    setConditionValue('');
    setActionType('SEND_NOTIFICATION');
    setActionTargetRole('MANAGER');
    setActionPayload('');
  };

  return (
    <div style={{ padding: shellView?.mobile ? '1rem' : '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', minHeight: '100%' }}>
      
      {/* Nexus Header */}
      {!shellView?.mobile && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="nexus-glow" style={{ background: 'var(--nexus-primary)', padding: '6px', borderRadius: '10px' }}>
                <Zap size={16} color="white" />
              </div>
              <span style={{ fontWeight: 900, fontSize: '0.7rem', color: 'var(--nexus-primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                Nexus Automator — Intelligent BPM
              </span>
            </div>
            <h1 className="nexus-gradient-text" style={{ fontSize: '3.5rem', fontWeight: 900, margin: 0, letterSpacing: '-2px' }}>
              Process & Automates
            </h1>
            <p style={{ color: 'var(--nexus-text-muted)', fontSize: '1.1rem', fontWeight: 500, maxWidth: '650px', lineHeight: 1.6 }}>
              Concevez des règles métier intelligentes pour automatiser vos opérations et garantir une réactivité instantanée à chaque événement.
            </p>
          </div>

          <button onClick={() => setIsBuilderOpen(true)} className="nexus-card" style={{ background: 'var(--nexus-secondary)', padding: '1rem 2rem', color: 'white', fontWeight: 900, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Plus size={20} /> Créer un Scénario
          </button>
        </div>
      )}

      {/* Workflows Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
        {workflows.length === 0 ? (
          <div className="nexus-card" style={{ gridColumn: 'span 12', padding: '5rem', textAlign: 'center', background: 'white' }}>
             <Activity size={64} color="var(--nexus-primary)" style={{ marginBottom: '1.5rem', opacity: 0.3 }} />
             <h3 style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--nexus-secondary)' }}>Nexus Automator est prêt</h3>
             <p style={{ color: 'var(--nexus-text-muted)', maxWidth: '400px', margin: '1rem auto' }}>Commencez par créer votre première règle d'automatisation intelligente.</p>
             <button onClick={() => setIsBuilderOpen(true)} style={{ background: 'var(--nexus-primary)', color: 'white', border: 'none', padding: '0.75rem 2rem', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', marginTop: '1rem' }}>
                Concevoir une règle
             </button>
          </div>
        ) : (
          workflows.map((wf) => (
            <motion.div key={wf.id} whileHover={{ y: -5 }} className="nexus-card" style={{ gridColumn: 'span 4', padding: '2rem', background: 'white', borderTop: `4px solid ${wf.active ? 'var(--nexus-primary)' : 'var(--nexus-text-muted)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <h3 style={{ fontWeight: 900, fontSize: '1.25rem', color: 'var(--nexus-secondary)', margin: 0 }}>{wf.name}</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                   <button onClick={() => updateRecord('workflows', '', wf.id, { active: !wf.active })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: wf.active ? 'var(--nexus-primary)' : 'var(--nexus-text-muted)' }}>
                     {wf.active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                   </button>
                   <button onClick={() => deleteRecord('workflows', '', wf.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', opacity: 0.5 }}>
                     <Trash2 size={20} />
                   </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: 'var(--nexus-bg)', padding: '1rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.7rem', color: 'var(--nexus-primary)' }}>SI</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--nexus-secondary)' }}>
                    {MODULES_MAP[wf.targetModule]} est {wf.triggerEvent === 'onUpdate' ? 'Modifié' : 'Créé'}
                  </div>
                </div>

                <div style={{ background: 'var(--nexus-bg)', padding: '1rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.7rem', color: '#F59E0B' }}>ET</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--nexus-secondary)' }}>
                    [{wf.conditionField}] {wf.operator} "{wf.value}"
                  </div>
                </div>

                <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'var(--nexus-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.7rem', color: 'white' }}>DO</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--nexus-primary)' }}>
                    {wf.actionType === 'SEND_NOTIFICATION' ? `Notifier ${wf.actionTargetRole}` : `Changer Statut`}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isBuilderOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="nexus-card" style={{ width: '100%', maxWidth: '900px', background: 'white', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
              
              <div style={{ padding: '2rem', background: 'var(--nexus-bg)', borderBottom: '1px solid var(--nexus-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem', color: 'var(--nexus-secondary)' }}>Nouvelle Automatisation</h3>
                  <p style={{ margin: '0.25rem 0 0 0', color: 'var(--nexus-text-muted)', fontWeight: 600 }}>Nexus Automator Intelligence Core</p>
                </div>
                <button onClick={() => setIsBuilderOpen(false)} style={{ background: 'white', border: 'none', width: 40, height: 40, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <X size={20} color="var(--nexus-secondary)" />
                </button>
              </div>

              <div style={{ padding: '2.5rem', overflowY: 'auto' }}>
                <form id="wf-form" onSubmit={handleSaveWorkflow} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 900, color: 'var(--nexus-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Identifiant du Scénario</label>
                    <input required type="text" value={wfName} onChange={e => setWfName(e.target.value)} placeholder="Ex: Alerte Stock Critique" style={{ width: '100%', padding: '1.25rem', borderRadius: '16px', background: 'var(--nexus-bg)', border: '2px solid var(--nexus-border)', fontWeight: 700, fontSize: '1rem', outline: 'none' }} />
                  </div>

                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', background: 'var(--nexus-bg)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--nexus-border)' }}>
                    <div style={{ background: 'var(--nexus-primary)', color: 'white', padding: '10px 20px', borderRadius: '12px', fontWeight: 900, fontSize: '0.8rem' }}>QUAND</div>
                    <select value={targetModule} onChange={e => setTargetModule(e.target.value)} style={{ flex: 1, padding: '1rem', borderRadius: '12px', border: '1px solid var(--nexus-border)', fontWeight: 800 }}>
                       {Object.entries(MODULES_MAP).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <span style={{ fontWeight: 800, color: 'var(--nexus-text-muted)' }}>est</span>
                    <select value={triggerEvent} onChange={e => setTriggerEvent(e.target.value)} style={{ width: '200px', padding: '1rem', borderRadius: '12px', border: '1px solid var(--nexus-border)', fontWeight: 800 }}>
                       <option value="onUpdate">Modifié</option>
                       <option value="onCreate">Créé</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', background: 'var(--nexus-bg)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--nexus-border)' }}>
                    <div style={{ background: '#F59E0B', color: 'white', padding: '10px 20px', borderRadius: '12px', fontWeight: 900, fontSize: '0.8rem' }}>SI</div>
                    <input required type="text" value={conditionField} onChange={e => setConditionField(e.target.value)} placeholder="Champ" style={{ width: '150px', padding: '1rem', borderRadius: '12px', border: '1px solid var(--nexus-border)', fontWeight: 800 }} />
                    <select value={operator} onChange={e => setOperator(e.target.value)} style={{ width: '180px', padding: '1rem', borderRadius: '12px', border: '1px solid var(--nexus-border)', fontWeight: 800 }}>
                       <option value="==">Est égal à</option>
                       <option value="!=">Est différent de</option>
                       <option value=">">Est supérieur à</option>
                       <option value="<">Est inférieur à</option>
                    </select>
                    <input required type="text" value={conditionValue} onChange={e => setConditionValue(e.target.value)} placeholder="Valeur" style={{ flex: 1, padding: '1rem', borderRadius: '12px', border: '1px solid var(--nexus-border)', fontWeight: 800 }} />
                  </div>

                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', background: 'rgba(16, 185, 129, 0.05)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                    <div style={{ background: 'var(--nexus-primary)', color: 'white', padding: '10px 20px', borderRadius: '12px', fontWeight: 900, fontSize: '0.8rem' }}>ALORS</div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <select value={actionType} onChange={e => setActionType(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid var(--nexus-border)', fontWeight: 800 }}>
                         <option value="SEND_NOTIFICATION">Envoyer une Notification Interne</option>
                         <option value="UPDATE_STATUS">Forcer un changement de Statut</option>
                      </select>
                      
                      <div style={{ display: 'flex', gap: '1rem' }}>
                         <input required type="text" value={actionTargetRole} onChange={e => setActionTargetRole(e.target.value)} placeholder="Cible (MANAGER, ALL...)" style={{ flex: 1, padding: '1rem', borderRadius: '12px', border: '1px solid var(--nexus-border)', fontWeight: 800 }} />
                         <input required type="text" value={actionPayload} onChange={e => setActionPayload(e.target.value)} placeholder="Message ou Valeur" style={{ flex: 2, padding: '1rem', borderRadius: '12px', border: '1px solid var(--nexus-border)', fontWeight: 800 }} />
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <div style={{ padding: '2rem', borderTop: '1px solid var(--nexus-border)', display: 'flex', justifyContent: 'flex-end', gap: '1.5rem' }}>
                <button onClick={() => setIsBuilderOpen(false)} style={{ background: 'none', border: 'none', fontWeight: 800, color: 'var(--nexus-text-muted)', cursor: 'pointer' }}>Annuler</button>
                <button type="submit" form="wf-form" style={{ background: 'var(--nexus-primary)', color: 'white', border: 'none', padding: '1rem 3rem', borderRadius: '16px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)' }}>
                  Activer le Scénario
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Workflows;
