import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Save, 
  Trash2, 
  History, 
  FileText, 
  Settings, 
  Star, 
  CheckCircle2,
  ArrowRight,
  Plus,
  Send,
  Download,
  User,
  Activity as ActivityIcon,
  Target,
  Lock
} from 'lucide-react';
import { 
  RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import SafeResponsiveChart from '../components/charts/SafeResponsiveChart';
import { generatePDF } from '../utils/PDFExporter';
import Timeline from './Timeline';
import { useBusiness } from '../BusinessContext';
import { registry } from '../services/Registry';

const DetailOverlay = ({ isOpen, onClose, record, appId, subModule, onUpdate }) => {
  const { config, navigateTo, deleteRecord, data, logAction } = useBusiness();
  const [activeTab, setActiveTab] = useState('infos');
  const [formData, setFormData] = useState({});
  const [prevRecord, setPrevRecord] = useState(null);

  const customFields = config?.customFields?.[appId] || [];

  // Règle d'or SSOT : Verrouillage total si le document est signé/gagné.
  const isLocked = (appId === 'sales' || appId === 'crm') && (formData.statut === 'Signé' || formData.etape === 'Gagné' || formData.statut === 'Gagné');

  // Synchronize formData with record prop safely
  React.useEffect(() => {
    if (record) {
      setFormData(record);
    } else {
      setFormData({});
    }
  }, [record]);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    const schema = registry.getSchema(appId);
    const model = schema?.models?.[subModule];
    const targetAppId = model?.dataPath ? model.dataPath.split('.')[0] : appId;
    const targetSubModule = model?.dataPath ? model.dataPath.split('.')[1] : subModule;
    
    onUpdate(targetAppId, targetSubModule, record.id, formData);
    onClose();
  };

  const toggleSubtask = (id) => {
    const newChecklist = (formData.checklists || []).map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    handleChange('checklists', newChecklist);
  };

  const addSubtask = (text) => {
    if (!text.trim()) return;
    const newItem = { id: Date.now(), label: text, completed: false };
    handleChange('checklists', [...(formData.checklists || []), newItem]);
  };

  const deleteSubtask = (id) => {
    const newChecklist = (formData.checklists || []).map(item => 
      item.id === id ? { ...item, deleted: true } : item
    ).filter(item => !item.deleted);
    handleChange('checklists', newChecklist);
  };

  if (!record) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.3)',
              backdropFilter: 'blur(4px)',
              zIndex: 1000
            }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="glass"
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              maxWidth: '500px',
              height: '100vh',
              background: 'var(--bg)',
              borderLeft: '1px solid var(--border)',
              boxShadow: '-10px 0 30px rgba(0,0,0,0.1)',
              zIndex: 1001,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  {appId} / {subModule}
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{record.titre || record.nom || record.num || "Détails"}</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* Contextual Logic Transitions */}
                {appId === 'hr' && subModule === 'employees' && (
                  <button 
                    onClick={() => { navigateTo('user_management'); onClose(); }}
                    className="glass"
                    style={{ padding: '0.4rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--accent)40', color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Settings size={14} /> Accès Système
                  </button>
                )}
                {appId === 'crm' && subModule === 'opportunities' && record.etape === 'Gagné' && (
                  <button 
                    onClick={() => { navigateTo('sales'); onClose(); }}
                    className="glass"
                    style={{ padding: '0.4rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #10B98140', color: '#10B981', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <ArrowRight size={14} /> Créer Devis
                  </button>
                )}

                <button 
                  onClick={onClose}
                  style={{ background: 'var(--bg-subtle)', border: 'none', padding: '0.5rem', borderRadius: 'var(--radius)', cursor: 'pointer', color: 'var(--text)' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', padding: '0 1rem', borderBottom: '1px solid var(--border)' }}>
              {[
                { id: 'infos', label: 'Infos', icon: <FileText size={16} /> },
                { id: 'documents', label: 'Documents', icon: <Download size={16} /> },
                { id: 'timeline', label: 'Suivi & Tâches', icon: <ActivityIcon size={16} /> },
                { id: 'actions', label: 'Actions', icon: <Settings size={16} /> },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '1rem',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
                    color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'var(--transition)'
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
              {activeTab === 'infos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Task / Progress logic moved to Suivi tab */}

                  {Object.entries(formData).map(([key, value]) => {
                    if (key === 'id' || key === 'avatar' || key === 'createdAt' || key === 'checklists' || key === 'skills') return null;
                    
                    return (
                      <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                          {key.replace(/([A-Z])/g, ' $1')}
                        </label>
                        
                        {(key === 'statut' || key === 'etape' || key === 'type' || (registry.getSchema(appId)?.models?.[subModule]?.fields?.[key]?.type === 'selection')) ? (
                          <select 
                            value={value}
                            onChange={(e) => handleChange(key, e.target.value)}
                            disabled={isLocked}
                            className="glass"
                            style={{ padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: isLocked ? 'rgba(0,0,0,0.05)' : 'var(--bg-subtle)', color: 'var(--text)', opacity: isLocked ? 0.7 : 1, cursor: isLocked ? 'not-allowed' : 'pointer' }}
                          >
                            <option value={value}>{value}</option>
                            {(registry.getSchema(appId)?.models?.[subModule]?.fields?.[key]?.options || 
                              ['Qualifié', 'Validé', 'Terminé', 'Gagné', 'Perdu']
                            ).map(opt => {
                                let optDisabled = false;
                                let optLabel = opt;
                                if (appId === 'sales' && subModule === 'orders' && key === 'statut' && (opt === 'Confirmé' || opt === 'Expédié')) {
                                    const prod = data?.inventory?.products?.find(p => p.nom === formData.produit || p.id === formData.produitId);
                                    if (!prod || prod.qte < (formData.qte || 0)) {
                                        optDisabled = true;
                                        optLabel = `${opt} ⚠️ Bloqué (Stock Physique Insuffisant: ${prod ? prod.qte : 0})`;
                                    }
                                }
                                return (
                                  <option key={opt} value={opt} disabled={optDisabled}>{optLabel}</option>
                                );
                            })}
                          </select>
                        ) : typeof value === 'number' && key === 'progression' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={value}
                              disabled={isLocked}
                              onChange={(e) => handleChange(key, parseInt(e.target.value))}
                              style={{ flex: 1, accentColor: 'var(--accent)', cursor: isLocked ? 'not-allowed' : 'pointer', opacity: isLocked ? 0.6 : 1 }}
                            />
                            <span style={{ fontWeight: 700, width: '40px' }}>{value}%</span>
                          </div>
                        ) : (
                          <input 
                            type={typeof value === 'number' ? 'number' : 'text'}
                            value={value}
                            disabled={isLocked}
                            onChange={(e) => handleChange(key, typeof value === 'number' ? parseFloat(e.target.value) : e.target.value)}
                            style={{
                              padding: '0.75rem',
                              borderRadius: 'var(--radius)',
                              border: '1px solid var(--border)',
                              background: isLocked ? 'rgba(0,0,0,0.05)' : 'var(--bg-subtle)',
                              color: 'var(--text)',
                              outline: 'none',
                              opacity: isLocked ? 0.8 : 1,
                              cursor: isLocked ? 'not-allowed' : 'text'
                            }}
                          />
                        )}
                      </div>
                    );
                  })}

                  {/* HR Skills Radar Chart */}
                  {appId === 'hr' && subModule === 'employees' && record.skills && (
                    <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', marginTop: '1rem' }}>
                       <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Target size={16} color="var(--accent)" /> MATRICE DES COMPÉTENCES
                       </h3>
                       <SafeResponsiveChart minHeight={240} fallbackHeight={240}>
                         <RadarChart cx="50%" cy="50%" outerRadius="75%" data={Object.entries(record.skills).map(([subject, value]) => ({ subject, value }))}>
                            <PolarGrid stroke="var(--border)" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar name={record.nom} dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.5} />
                         </RadarChart>
                       </SafeResponsiveChart>
                    </div>
                  )}
                  {customFields.map(field => (
                    <div key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{field.label}</label>
                      <input 
                        type={field.type}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        style={{ padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text)', outline: 'none' }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'documents' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius)', padding: '2rem', textAlign: 'center', cursor: 'pointer', background: 'var(--bg-subtle)' }}>
                     <Download size={32} color="var(--accent)" style={{ marginBottom: '1rem' }} />
                     <p style={{ fontWeight: 600 }}>Glissez un fichier ou cliquez pour uploader</p>
                     <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PDF, JPG, PNG, DOCX (Max 10MB)</p>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)' }}>DOCUMENTS ATTACHÉS</h4>
                    {[
                      { name: 'Contrat_Signe.pdf', size: '1.2 MB', type: 'PDF' },
                      { name: 'Plan_Technique.jpg', size: '4.5 MB', type: 'IMAGE' },
                    ].map((doc, i) => (
                      <div key={i} className="glass" style={{ padding: '1rem', borderRadius: 'var(--radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                           <FileText size={20} color="var(--accent)" />
                           <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{doc.name}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{doc.size} • Le 09 Avril 2026</div>
                           </div>
                         </div>
                         <Download size={18} style={{ cursor: 'pointer', opacity: 0.6 }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 'timeline' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Checklist (Universal Progress Tracker) */}
                  <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <CheckCircle2 size={16} color="var(--accent)" /> AVANCEMENT DES TÂCHES
                        </h3>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          {(formData.checklists || []).filter(c => c.completed).length} / {(formData.checklists || []).length}
                        </span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      {(formData.checklists || []).length === 0 && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Aucune tâche sous-jacente ajoutée.</div>
                      )}
                      {(formData.checklists || []).map(item => (
                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <input 
                              type="checkbox" 
                              checked={item.completed}
                              onChange={() => toggleSubtask(item.id)}
                              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent)' }}
                            />
                            <span style={{ 
                              fontSize: '0.85rem', 
                              flex: 1, 
                              textDecoration: item.completed ? 'line-through' : 'none',
                              color: item.completed ? 'var(--text-muted)' : 'var(--text)',
                              opacity: item.completed ? 0.6 : 1
                            }}>
                              {item.label}
                            </span>
                            <button 
                              onClick={() => deleteSubtask(item.id)}
                              style={{ background: 'transparent', border: 'none', color: '#EF4444', fontSize: '0.7rem', cursor: 'pointer', opacity: 0.5 }}
                            >
                              Suppr.
                            </button>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input 
                          type="text" 
                          placeholder="Ajouter une action à faire..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.target.value.trim() !== '') {
                              addSubtask(e.target.value);
                              e.target.value = '';
                            }
                          }}
                          style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--bg)', fontSize: '0.8rem', color: 'var(--text)' }}
                        />
                        <button 
                          onClick={(e) => {
                            const input = e.currentTarget.previousSibling;
                            if (input.value.trim() !== '') {
                              addSubtask(input.value);
                              input.value = '';
                            }
                          }}
                          className="btn btn-primary" 
                          style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem' }}
                        >
                          <Plus size={16} />
                        </button>
                    </div>
                  </div>

                  {/* Traces / Chatter Streams */}
                  <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                     <h3 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
                        <ActivityIcon size={16} color="var(--accent)" /> Traces des travaux
                     </h3>
                     
                     <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                        <input 
                          type="text" 
                          placeholder="Laisser une trace (appel, note, rapport d'avancement)..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.target.value.trim() !== '') {
                              logAction('Note Manuelle', e.target.value, appId, record.id);
                              e.target.value = '';
                            }
                          }}
                          style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '0.85rem' }}
                        />
                        <button 
                          onClick={(e) => {
                            const input = e.currentTarget.previousSibling;
                            if (input.value.trim() !== '') {
                               logAction('Note Manuelle', input.value, appId, record.id);
                               input.value = '';
                            }
                          }}
                          className="btn btn-primary" 
                          style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem' }}
                        >
                          <Send size={16} />
                        </button>
                     </div>

                     <Timeline events={[
                       ...((data?.activities || [])
                         .filter(a => String(a.targetId) === String(record.id))
                         .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                         .map(a => ({
                           title: a.action,
                           tag: a.action.includes('Note') ? 'Note Utilisateur' : 'Système',
                           time: new Date(a.timestamp).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
                           description: a.detail,
                           user: a.user,
                           color: a.action.includes('Note') ? 'var(--accent)' : 'var(--text-muted)'
                         }))),
                       { 
                         title: "Création initiale", 
                         tag: "Base", 
                         time: record.createdAt ? new Date(record.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : "Système", 
                         description: `Enregistrement généré dans l'écosystème.`, 
                         user: "Créateur" 
                       }
                     ]} />
                  </div>
                </div>
              )}

              {activeTab === 'actions' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {!isLocked && (
                    <button 
                      onClick={() => {
                        if (appId === 'crm') handleChange('etape', 'Gagné');
                        if (appId === 'purchase') handleChange('statut', 'Réceptionné');
                        if (appId === 'hr') handleChange('statut', 'Validé');
                      }}
                      className="btn"
                      style={{ background: 'var(--accent)', color: 'white' }}
                    >
                      <CheckCircle2 size={20} /> Appliquer le Workflow
                    </button>
                  )}
                  <button 
                    onClick={() => generatePDF(record, appId, subModule)}
                    className="btn"
                    style={{ border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text)' }}
                  >
                     Générer le PDF <Download size={16} />
                  </button>
                  {!isLocked && (
                    <button 
                      className="btn" 
                      onClick={() => {
                        if (window.confirm(`Confirmer la suppression de "${record.titre || record.nom || record.num}" ? Cette action est irréversible.`)) {
                          if (deleteRecord) deleteRecord(appId, subModule, record.id);
                          onClose();
                        }
                      }}
                      style={{ border: '1px solid #EF4444', background: 'transparent', color: '#EF4444', marginTop: '2rem' }}>
                       <Trash2 size={18} /> Supprimer l'enregistrement
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '1rem', flexDirection: 'column' }}>
              {isLocked ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '1rem', borderRadius: '1rem', fontWeight: 700, fontSize: '0.85rem' }}>
                  <Lock size={20} />
                  Document verrouillé (SSOT Axelor). Les modifications nécessitent un Avenant officiel.
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                  <button 
                    onClick={onClose}
                    className="btn"
                    style={{ flex: 1, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)' }}
                  >
                    Annuler
                  </button>
                  <button 
                    onClick={handleSave}
                    className="btn"
                    style={{ flex: 2, background: 'var(--primary)', color: 'white' }}
                  >
                    <Save size={20} /> Enregistrer les modifications
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DetailOverlay;
