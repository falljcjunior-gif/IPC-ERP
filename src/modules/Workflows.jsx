import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Plus, 
  Trash2, 
  Play, 
  ToggleLeft, 
  ToggleRight, 
  Settings2, 
  Bell, 
  FileEdit,
  ArrowRight,
  Database
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import RecordModal from '../components/RecordModal';

const WORKFLOW_TRIGGERS = [
  { id: 'onRecordCreated', label: 'Lors de la création d\'un document', icon: <Plus size={16}/> },
  { id: 'onRecordUpdated', label: 'Lors de la modification d\'un document', icon: <FileEdit size={16}/> },
  { id: 'onStockLow', label: 'Lorsque le stock est critique', icon: <Zap size={16}/> }
];

const WORKFLOW_ACTIONS = [
  { id: 'notification', label: 'Envoyer une Notification', icon: <Bell size={16}/> },
  { id: 'statusUpdate', label: 'Mettre à jour un Statut', icon: <Settings2 size={16}/> },
  { id: 'chatAlert', label: 'Alerter sur le Chat Équipe', icon: <Play size={16}/> }
];

const Workflows = () => {
  const { data, addRecord, updateRecord, deleteRecord } = useBusiness();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const workflows = data.workflows || [];

  const handleSave = (formData) => {
    addRecord('workflows', '', {
      ...formData,
      active: true,
      lastRun: null,
      createdAt: new Date().toISOString()
    });
  };

  const modalFields = [
    { name: 'name', label: 'Nom de l\'automatisation', required: true, placeholder: 'Ex: Alert Lead Gagne' },
    { name: 'trigger', label: 'Événement déclencheur (Trigger)', type: 'select', options: WORKFLOW_TRIGGERS.map(t => t.id), required: true },
    { name: 'conditionField', label: 'Champ à surveiller (Optionnel)', placeholder: 'Ex: etape' },
    { name: 'conditionValue', label: 'Valeur cible', placeholder: 'Ex: Gagné' },
    { name: 'actionType', label: 'Action à effectuer', type: 'select', options: WORKFLOW_ACTIONS.map(a => a.id), required: true },
    { name: 'actionMessage', label: 'Message / Commentaire', placeholder: 'Ex: Bravo pour la vente !' },
  ];

  return (
    <div style={{ padding: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Automatisations (No-Code)</h1>
          <p style={{ color: 'var(--text-muted)' }}>Créez des règles intelligentes pour que l'ERP travaille en autonomie.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Nouveau Workflow
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {workflows.length === 0 ? (
          <div className="glass" style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', borderRadius: '2rem', border: '2px dashed var(--border)' }}>
             <Database size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
             <h3 style={{ color: 'var(--text-muted)' }}>Aucune automatisation active</h3>
             <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Cliquez sur "Nouveau Workflow" pour commencer.</p>
          </div>
        ) : (
          workflows.map((wf) => (
            <motion.div
              key={wf.id}
              whileHover={{ y: -5 }}
              className="glass"
              style={{ padding: '2rem', borderRadius: '1.5rem', border: wf.active ? '1px solid var(--accent)30' : '1px solid var(--border)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div style={{ background: wf.active ? 'var(--accent)20' : 'var(--bg-subtle)', color: wf.active ? 'var(--accent)' : 'var(--text-muted)', padding: '0.75rem', borderRadius: '1rem' }}>
                  <Zap size={24} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                   <button 
                     onClick={() => updateRecord('workflows', '', wf.id, { active: !wf.active })}
                     style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: wf.active ? 'var(--accent)' : 'var(--text-muted)' }}
                   >
                     {wf.active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                   </button>
                   <button 
                    onClick={() => deleteRecord('workflows', '', wf.id)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#EF4444' }}
                   >
                     <Trash2 size={20} />
                   </button>
                </div>
              </div>

              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{wf.name}</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                   <div style={{ color: 'var(--text-muted)' }}>DÉCLENCHEUR :</div>
                   <div style={{ fontWeight: 600 }}>{wf.trigger}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <div style={{ background: 'var(--bg-subtle)', padding: '0.5rem', borderRadius: '0.5rem', fontSize: '0.8rem' }}>Condition: {wf.conditionField || 'Aucune'}</div>
                   <ArrowRight size={14} color="var(--text-muted)" />
                   <div style={{ background: 'var(--accent)10', color: 'var(--accent)', padding: '0.5rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>Action: {wf.actionType}</div>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                 Dernière exécution : {wf.lastRun || 'Jamais'}
              </div>
            </motion.div>
          ))
        )}
      </div>

      <RecordModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        title="Configuration de l'automatisation"
        fields={modalFields}
      />
    </div>
  );
};

export default Workflows;
