import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Edit3, Trash2, Printer, MoreHorizontal, MessageSquare, History, FileText, Upload, Plus, CheckCircle2, Lock } from 'lucide-react';
import Chatter from './Chatter';
import SmartButtons from './SmartButtons';
import { useStore } from '../store';
import { useTranslation } from 'react-i18next';
import { useToast } from './ToastProvider';

const RecordModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete, 
  title, 
  fields, 
  initialData = {}, 
  recordId, 
  recordType,
  appId,
  smartButtons = [],
  isLoading = false 
}) => {
  const getModuleAccess = useStore(s => s.getModuleAccess);
  const currentUser = useStore(s => s.user);
  const _dmsFiles = useStore(s => s.data.dms?.files);
  const dmsFiles = _dmsFiles || [];
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [formData, setFormData] = useState(initialData || {});
  
  const accessLevel = getModuleAccess(currentUser?.id, appId);
  const isReadOnly = accessLevel === 'read';

  const [isEditMode, setIsEditMode] = useState(!recordId && !isReadOnly); 
  const [activeTab, setActiveTab] = useState('data'); 
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;
    
    const missingFields = fields.filter(f => f.required && !formData[f.name]);
    if (missingFields.length > 0) {
        addToast("Veuillez remplir les champs obligatoires : " + missingFields.map(f => f.label).join(', '), 'error');
        return;
    }

    setShowSuccessAnim(true);
    setTimeout(() => {
       setShowSuccessAnim(false);
       onSave(formData);
       if (recordId) setIsEditMode(false);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          
          {/* Nexus Backdrop */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(10px)', zIndex: 1000 }} />

          {/* Success Overlay */}
          <AnimatePresence>
            {showSuccessAnim && (
               <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} style={{ position: 'absolute', inset: 0, background: 'var(--nexus-primary)', zIndex: 3000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-nexus)' }}>
                 <div className="nexus-glow" style={{ background: 'white', padding: '20px', borderRadius: '50%', marginBottom: '1.5rem' }}>
                   <CheckCircle2 size={64} color="var(--nexus-primary)" />
                 </div>
                 <h2 style={{ color: 'white', fontSize: '2.5rem', fontWeight: 900, textAlign: 'center' }}>Opération Réussie</h2>
                 <p style={{ color: 'white', opacity: 0.8, fontWeight: 700 }}>Synchronisation Nexus en cours...</p>
               </motion.div>
            )}
          </AnimatePresence>

          {/* Nexus Modal Content */}
          <motion.div initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }} className="nexus-card" style={{ width: '100%', maxWidth: '1280px', height: '85vh', position: 'relative', zIndex: 1001, background: 'white', border: 'none', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2.5rem', borderBottom: '1px solid var(--nexus-border)', background: 'var(--nexus-bg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div className="nexus-glow" style={{ background: 'var(--nexus-primary)', padding: '10px', borderRadius: '12px', color: 'white' }}>
                   <FileText size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--nexus-secondary)', margin: 0 }}>{title}</h2>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '4px' }}>
                    {isReadOnly ? (
                      <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--nexus-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Lecture Seule</span>
                    ) : (
                      <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--nexus-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Mode Edition Nexus</span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {!isReadOnly && (
                  isEditMode ? (
                    <button onClick={handleSubmit} className="nexus-card" style={{ background: 'var(--nexus-primary)', padding: '0.6rem 1.5rem', color: 'white', fontWeight: 900, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Save size={18}/> Enregistrer
                    </button>
                  ) : (
                    <button onClick={() => setIsEditMode(true)} className="nexus-card" style={{ background: 'white', padding: '0.6rem 1.5rem', color: 'var(--nexus-secondary)', fontWeight: 800, cursor: 'pointer', border: '1px solid var(--nexus-border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Edit3 size={18}/> Modifier
                    </button>
                  )
                )}
                <button onClick={onClose} style={{ background: 'none', border: 'none', width: 40, height: 40, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--nexus-text-muted)' }}>
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
               {/* Left: Form */}
               <div style={{ flex: 2, overflowY: 'auto', padding: '3rem', background: 'white' }}>
                  <SmartButtons buttons={smartButtons} />
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2.5rem', marginTop: '2rem' }}>
                    {fields.map(field => (
                      <div key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--nexus-text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                          {t(field.label)}
                        </label>
                        
                        {!isEditMode ? (
                          <div style={{ padding: '1rem 0', fontWeight: 800, fontSize: '1.1rem', color: 'var(--nexus-secondary)', borderBottom: '2px solid var(--nexus-bg)' }}>
                            {formData[field.name]?.toString() || '—'}
                          </div>
                        ) : (
                          (field.type === 'selection' || field.type === 'select') ? (
                            <select value={formData[field.name] || ''} onChange={(e) => handleChange(field.name, e.target.value)} style={{ padding: '1rem', borderRadius: '14px', border: '2px solid var(--nexus-border)', background: 'var(--nexus-bg)', fontWeight: 700, outline: 'none' }}>
                               <option value="">Sélectionner...</option>
                               {field.options?.map(opt => <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>)}
                            </select>
                          ) : field.type === 'textarea' ? (
                            <textarea value={formData[field.name] || ''} onChange={(e) => handleChange(field.name, e.target.value)} style={{ padding: '1rem', borderRadius: '14px', border: '2px solid var(--nexus-border)', background: 'var(--nexus-bg)', fontWeight: 700, outline: 'none', minHeight: '120px' }} />
                          ) : (
                            <input value={formData[field.name] || ''} type={field.type} onChange={(e) => handleChange(field.name, e.target.value)} style={{ padding: '1rem', borderRadius: '14px', border: '2px solid var(--nexus-border)', background: 'var(--nexus-bg)', fontWeight: 700, outline: 'none' }} />
                          )
                        )}
                      </div>
                    ))}
                  </div>
               </div>

               {/* Right: Chatter */}
               {recordId && (
                 <div style={{ flex: 1, background: 'var(--nexus-bg)', borderLeft: '1px solid var(--nexus-border)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--nexus-border)', background: 'white' }}>
                       <button onClick={() => setActiveTab('data')} style={{ flex: 1, padding: '1.25rem', border: 'none', background: 'transparent', borderBottom: activeTab === 'data' ? '3px solid var(--nexus-primary)' : 'none', color: activeTab === 'data' ? 'var(--nexus-primary)' : 'var(--nexus-text-muted)', fontWeight: 900, fontSize: '0.75rem' }}>INFOS</button>
                       <button onClick={() => setActiveTab('chatter')} style={{ flex: 1, padding: '1.25rem', border: 'none', background: 'transparent', borderBottom: activeTab === 'chatter' ? '3px solid var(--nexus-primary)' : 'none', color: activeTab === 'chatter' ? 'var(--nexus-primary)' : 'var(--nexus-text-muted)', fontWeight: 900, fontSize: '0.75rem' }}>CHATTER</button>
                       <button onClick={() => setActiveTab('documents')} style={{ flex: 1, padding: '1.25rem', border: 'none', background: 'transparent', borderBottom: activeTab === 'documents' ? '3px solid var(--nexus-primary)' : 'none', color: activeTab === 'documents' ? 'var(--nexus-primary)' : 'var(--nexus-text-muted)', fontWeight: 900, fontSize: '0.75rem' }}>DOCS</button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                       {activeTab === 'chatter' ? (
                          <Chatter targetId={recordId} targetType={recordType} />
                       ) : activeTab === 'documents' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h4 style={{ margin: 0, fontWeight: 900, fontSize: '0.8rem', color: 'var(--nexus-secondary)' }}>Fichiers Nexus</h4>
                                <button className="nexus-card" style={{ padding: '6px 12px', background: 'white', fontWeight: 800, fontSize: '0.7rem' }}>Ajouter</button>
                             </div>
                             {dmsFiles.filter(f => f.relatedId === recordId).map(file => (
                                <div key={file.id} className="nexus-card" style={{ padding: '1rem', background: 'white', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                   <FileText size={20} color="var(--nexus-primary)" />
                                   <div style={{ flex: 1 }}>
                                      <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{file.name}</div>
                                      <div style={{ fontSize: '0.7rem', color: 'var(--nexus-text-muted)' }}>{file.size}</div>
                                   </div>
                                </div>
                             ))}
                          </div>
                       ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                             <div className="nexus-card" style={{ padding: '1.5rem', background: 'white' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--nexus-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>ID Interne</div>
                                <code style={{ fontSize: '0.9rem', color: 'var(--nexus-primary)', fontWeight: 800 }}>{recordId}</code>
                             </div>
                             <div className="nexus-card" style={{ padding: '1.5rem', background: 'white' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--nexus-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Audit Log</div>
                                <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{initialData.user || 'IPC User'}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--nexus-text-muted)' }}>{new Date().toLocaleString()}</div>
                             </div>
                          </div>
                       )}
                    </div>
                 </div>
               )}
            </div>

            {/* Footer */}
            {!recordId && !isReadOnly && (
              <div style={{ padding: '1.5rem 3rem', borderTop: '1px solid var(--nexus-border)', display: 'flex', justifyContent: 'flex-end', gap: '1.5rem', background: 'var(--nexus-bg)' }}>
                <button onClick={onClose} style={{ background: 'none', border: 'none', fontWeight: 800, color: 'var(--nexus-text-muted)', cursor: 'pointer' }}>Annuler</button>
                <button onClick={handleSubmit} className="nexus-card" style={{ background: 'var(--nexus-primary)', padding: '1rem 3rem', color: 'white', fontWeight: 900, border: 'none', cursor: 'pointer' }}>Créer Enregistrement</button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default React.memo(RecordModal);
