import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, ToggleLeft, ToggleRight, 
  Activity, X
} from 'lucide-react';
import { useStore } from '../store';
// [AUDIT] Correction: Utilisation du Registry pour un couplage lâche
import { registry } from '../services/Registry';
import AnimatedCounter from '../components/Dashboard/AnimatedCounter';
import '../components/GlobalDashboard.css';

const Workflows = () => {
  const workflows = useStore(state => state.data?.workflows || []);
  const addRecord = useStore(state => state.addRecord);
  const updateRecord = useStore(state => state.updateRecord);
  const deleteRecord = useStore(state => state.deleteRecord);

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

  const activeCount = workflows.filter(w => w.active).length;

  return (
    <div className="luxury-dashboard-container" style={{ padding: '3rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      
      {/* ── HEADER ── */}
      <div className="luxury-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div className="luxury-subtitle">Nexus Automator — BPM Intelligent</div>
          <h1 className="luxury-title">Process & <strong>Automates</strong></h1>
        </div>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-end' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Règles actives</div>
            <div className="luxury-value-massive" style={{ fontSize: '3rem', color: '#10B981' }}>
              <AnimatedCounter from={0} to={activeCount} duration={1.5} formatter={v => `${Math.round(v)}`} />
            </div>
          </div>
          <button onClick={() => setIsBuilderOpen(true)} className="luxury-widget" style={{ padding: '1rem 2rem', background: '#111827', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem', border: 'none', cursor: 'pointer', fontWeight: 700, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)', borderRadius: '1.5rem' }}>
            <Plus size={20} /> Créer un Scénario
          </button>
        </div>
      </div>

      {/* ── WORKFLOWS GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }}>
        {workflows.length === 0 ? (
          <div className="luxury-widget" style={{ gridColumn: 'span 12', padding: '5rem', textAlign: 'center', background: 'rgba(255,255,255,0.9)' }}>
            <Activity size={64} color="#10B981" style={{ marginBottom: '1.5rem', opacity: 0.2, display: 'block', margin: '0 auto 1.5rem' }} />
            <h3 style={{ fontWeight: 800, fontSize: '1.5rem', color: '#1e293b', marginBottom: '0.75rem' }}>Nexus Automator est prêt</h3>
            <p style={{ color: '#64748b', maxWidth: '400px', margin: '0 auto 2rem', lineHeight: 1.6 }}>Commencez par créer votre première règle d&apos;automatisation intelligente.</p>
            <button onClick={() => setIsBuilderOpen(true)} style={{ background: '#10B981', color: 'white', border: 'none', padding: '1rem 2.5rem', borderRadius: '1rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 25px rgba(16,185,129,0.25)' }}>
              Concevoir une règle
            </button>
          </div>
        ) : (
          workflows.map((wf) => (
            <motion.div key={wf.id} whileHover={{ y: -6, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}
              className="luxury-widget"
              style={{ gridColumn: 'span 4', padding: '2.5rem', borderTop: `4px solid ${wf.active ? '#10B981' : '#e2e8f0'}`, background: 'rgba(255,255,255,0.95)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <h3 style={{ fontWeight: 800, fontSize: '1.25rem', color: '#1e293b', margin: 0 }}>{wf.name}</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => updateRecord('workflows', '', wf.id, { active: !wf.active })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: wf.active ? '#10B981' : '#94a3b8' }}>
                    {wf.active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                  </button>
                  <button onClick={() => deleteRecord('workflows', '', wf.id)} style={{ background: 'rgba(239,68,68,0.08)', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '8px', borderRadius: '0.75rem', display: 'flex' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {[
                  { label: 'SI',   bg: '#f8fafc',              color: '#3B82F6', text: `${MODULES_MAP[wf.targetModule] || wf.targetModule} est ${wf.triggerEvent === 'onUpdate' ? 'Modifié' : 'Créé'}` },
                  { label: 'ET',   bg: '#fffbeb',              color: '#F59E0B', text: `[${wf.conditionField}] ${wf.operator} "${wf.value}"` },
                  { label: 'ALORS', bg: 'rgba(16,185,129,0.05)', color: '#10B981', text: wf.actionType === 'SEND_NOTIFICATION' ? `Notifier ${wf.actionTargetRole}` : 'Changer Statut' },
                ].map(step => (
                  <div key={step.label} style={{ background: step.bg, padding: '1rem 1.25rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', border: `1px solid ${step.color}18` }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '0.75rem', background: step.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.7rem', color: 'white', flexShrink: 0 }}>{step.label}</div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e293b' }}>{step.text}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {isBuilderOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} style={{ width: '100%', maxWidth: '900px', background: 'white', borderRadius: '2rem', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.4)' }}>
              
              <div style={{ padding: '2.5rem 3rem', background: '#fafafa', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.75rem', color: '#1e293b' }}>Nouvelle Automatisation</h3>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontWeight: 600 }}>IPC Automator — BPM Intelligence Core</p>
                </div>
                <button onClick={() => setIsBuilderOpen(false)} style={{ background: 'white', border: '1px solid #e2e8f0', width: 44, height: 44, borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                  <X size={20} color="#64748b" />
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

              <div style={{ padding: '2rem 3rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '1.5rem', background: '#fafafa' }}>
                <button onClick={() => setIsBuilderOpen(false)} style={{ background: 'none', border: 'none', fontWeight: 700, color: '#64748b', cursor: 'pointer', fontSize: '0.95rem' }}>Annuler</button>
                <button type="submit" form="wf-form" style={{ background: '#10B981', color: 'white', border: 'none', padding: '1rem 3rem', borderRadius: '1rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 10px 25px rgba(16,185,129,0.25)', fontSize: '0.95rem' }}>
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
