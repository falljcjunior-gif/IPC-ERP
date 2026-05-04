import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Edit3, CheckCircle2, FileText, ChevronRight } from 'lucide-react';
import Chatter from './Chatter';
import SmartButtons from './SmartButtons';
import { useStore } from '../store';
import { useTranslation } from 'react-i18next';
import { useToast } from './ToastProvider';

const RecordModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
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
  const canSeeField = useStore(s => s.canSeeField);
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
    if (e) e.preventDefault();
    if (isLoading) return;
    
    const missingFields = fields.filter(f => f.required && !formData[f.name]);
    if (missingFields.length > 0) {
        addToast("Champs requis : " + missingFields.map(f => t(f.label)).join(', '), 'error');
        return;
    }

    setShowSuccessAnim(true);
    setTimeout(() => {
       setShowSuccessAnim(false);
       onSave(formData);
       if (recordId) setIsEditMode(false);
    }, 1200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          
          {/* Elite Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(20px)', zIndex: 1000 }} 
          />

          {/* Success Animation Overlay */}
          <AnimatePresence>
            {showSuccessAnim && (
               <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.9 }} 
                style={{ 
                  position: 'absolute', inset: 0, background: 'var(--primary)', zIndex: 3000, 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 'var(--radius-antigravity)'
                }}
               >
                 <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    transition={{ type: 'spring', damping: 12 }}
                    style={{ background: 'white', padding: '30px', borderRadius: '50%', marginBottom: '2rem', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
                 >
                   <CheckCircle2 size={80} color="var(--primary)" />
                 </motion.div>
                 <h2 style={{ color: 'white', fontSize: '3rem', fontWeight: 900, textAlign: 'center', letterSpacing: '-0.04em' }}>Synchronisation...</h2>
                 <p style={{ color: 'white', opacity: 0.7, fontWeight: 600, fontSize: '1.1rem' }}>Le registre IPC a été mis à jour.</p>
               </motion.div>
            )}
          </AnimatePresence>

          {/* Main Modal Container */}
          <motion.div 
            initial={{ scale: 0.98, opacity: 0, y: 40 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.98, opacity: 0, y: 40 }} 
            className="antigravity-card"
            style={{ 
              width: '100%', maxWidth: '1200px', height: '90vh', position: 'relative', zIndex: 1001, 
              background: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden',
              boxShadow: '0 50px 100px -20px rgba(15, 23, 42, 0.25)',
              border: '1px solid rgba(15, 23, 42, 0.08)'
            }}
          >
            
            {/* Ultra-Clean Header */}
            <div style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
              padding: '2rem 3rem', background: '#FFFFFF', borderBottom: '1px solid var(--border-light)' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <div style={{ 
                  width: '56px', height: '56px', background: 'var(--primary)', borderRadius: '18px', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                  boxShadow: '0 12px 24px rgba(6, 78, 59, 0.15)'
                }}>
                   <FileText size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>
                    {isReadOnly ? 'Consultation' : (isEditMode ? 'Édition Active' : 'Registre Nexus')}
                  </div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>{title}</h2>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                {!isReadOnly && !isEditMode && (
                  <button 
                    onClick={() => setIsEditMode(true)} 
                    className="btn btn-secondary btn-lg"
                    style={{ borderRadius: '14px' }}
                  >
                    <Edit3 size={18}/> Modifier
                  </button>
                )}
                <button 
                  onClick={onClose} 
                  className="btn-ghost"
                  style={{ width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-light)' }}
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Content Explorer */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
               {/* Primary Data Form */}
               <div style={{ flex: recordId ? 1.6 : 1, overflowY: 'auto', padding: '4rem 3rem', background: 'white' }}>
                  <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    {smartButtons.length > 0 && <div style={{ marginBottom: '3rem' }}><SmartButtons buttons={smartButtons} /></div>}
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '3rem' }}>
                      {fields.filter(f => canSeeField(appId, f.name)).map(field => (
                        <div key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginLeft: '2px' }}>
                            {t(field.label)} {field.required && <span style={{ color: '#EF4444' }}>*</span>}
                          </label>
                          
                          {!isEditMode ? (
                            <div style={{ 
                              padding: '1.25rem', background: 'var(--bg-subtle)', borderRadius: '16px',
                              fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)',
                              border: '1.5px solid transparent'
                            }}>
                              {formData[field.name]?.toString() || '—'}
                            </div>
                          ) : (
                            (field.type === 'selection' || field.type === 'select') ? (
                              <select 
                                value={formData[field.name] || ''} 
                                onChange={(e) => handleChange(field.name, e.target.value)} 
                                style={{ 
                                  padding: '1.1rem', borderRadius: '16px', border: '1.5px solid var(--border)', 
                                  background: 'white', fontWeight: 600, fontSize: '1rem', outline: 'none',
                                  transition: 'all 0.3s', cursor: 'pointer', appearance: 'none'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                              >
                                 <option value="">Sélectionner...</option>
                                 {field.options?.map(opt => <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>)}
                              </select>
                            ) : field.type === 'textarea' ? (
                              <textarea 
                                value={formData[field.name] || ''} 
                                onChange={(e) => handleChange(field.name, e.target.value)} 
                                placeholder={`Entrez ${t(field.label).toLowerCase()}...`}
                                style={{ 
                                  padding: '1.1rem', borderRadius: '16px', border: '1.5px solid var(--border)', 
                                  background: 'white', fontWeight: 600, fontSize: '1rem', outline: 'none',
                                  minHeight: '140px', transition: 'all 0.3s', lineHeight: 1.6
                                }} 
                                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                              />
                            ) : (
                              <input 
                                value={formData[field.name] || ''} 
                                type={field.type || 'text'} 
                                onChange={(e) => handleChange(field.name, e.target.value)} 
                                placeholder={`Entrez ${t(field.label).toLowerCase()}...`}
                                style={{ 
                                  padding: '1.1rem', borderRadius: '16px', border: '1.5px solid var(--border)', 
                                  background: 'white', fontWeight: 600, fontSize: '1rem', outline: 'none',
                                  transition: 'all 0.3s'
                                }} 
                                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                              />
                            )
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
               </div>

               {/* Right Side: Context Panel */}
               {recordId && (
                 <div style={{ flex: 1, background: 'var(--bg-subtle)', borderLeft: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', padding: '0.5rem', gap: '0.5rem', background: 'white', borderBottom: '1px solid var(--border-light)' }}>
                       {['data', 'chatter', 'documents'].map(tab => (
                         <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)} 
                            style={{ 
                              flex: 1, padding: '1rem', borderRadius: '12px', border: 'none', 
                              background: activeTab === tab ? 'var(--primary)' : 'transparent', 
                              color: activeTab === tab ? 'white' : 'var(--text-muted)', 
                              fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px',
                              cursor: 'pointer', transition: 'all 0.3s'
                            }}
                          >
                            {tab}
                          </button>
                       ))}
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '2.5rem' }}>
                       {activeTab === 'chatter' ? (
                          <Chatter targetId={recordId} targetType={recordType} />
                       ) : activeTab === 'documents' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <h4 style={{ margin: 0, fontWeight: 900, fontSize: '0.85rem', color: 'var(--text)' }}>Coffre-fort Nexus</h4>
                                <button className="btn btn-secondary btn-xs">Dépôt</button>
                             </div>
                             {dmsFiles.filter(f => f.relatedId === recordId).length === 0 ? (
                               <div style={{ padding: '3rem 1rem', textAlign: 'center', background: 'rgba(0,0,0,0.02)', borderRadius: '20px', border: '1px dashed var(--border)' }}>
                                 <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Aucun document scellé</div>
                               </div>
                             ) : (
                               dmsFiles.filter(f => f.relatedId === recordId).map(file => (
                                  <div key={file.id} className="antigravity-card" style={{ padding: '1.25rem', background: 'white', display: 'flex', alignItems: 'center', gap: '1.25rem', border: '1px solid var(--border-light)', borderRadius: '18px' }}>
                                     <div style={{ width: '40px', height: '40px', background: 'var(--bg-subtle)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FileText size={20} color="var(--primary)" />
                                     </div>
                                     <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text)' }}>{file.name}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{file.size}</div>
                                     </div>
                                     <ChevronRight size={16} color="var(--border)" />
                                  </div>
                               ))
                             )}
                          </div>
                       ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                             <div className="antigravity-card" style={{ padding: '2rem', background: 'white', border: '1px solid var(--border-light)' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '1px' }}>Signature Digitale</div>
                                <code style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 900, background: 'var(--bg-subtle)', padding: '4px 8px', borderRadius: '6px' }}>{recordId}</code>
                             </div>
                             <div className="antigravity-card" style={{ padding: '2rem', background: 'white', border: '1px solid var(--border-light)' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '1px' }}>Dernière Activité</div>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                   <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.8rem' }}>
                                      {initialData.user?.charAt(0) || 'I'}
                                   </div>
                                   <div>
                                      <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{initialData.user || 'Collaborateur IPC'}</div>
                                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                   </div>
                                </div>
                             </div>
                          </div>
                       )}
                    </div>
                 </div>
               )}
            </div>

            {/* Premium Action Bar */}
            {isEditMode && (
              <div style={{ 
                padding: '2rem 3rem', borderTop: '1px solid var(--border-light)', 
                display: 'flex', justifyContent: 'flex-end', gap: '1.5rem', background: '#FFFFFF' 
              }}>
                <button 
                  onClick={() => recordId ? setIsEditMode(false) : onClose()} 
                  className="btn btn-ghost btn-xl"
                  style={{ color: 'var(--text-muted)', fontWeight: 700 }}
                >
                  Annuler
                </button>
                <button 
                  onClick={handleSubmit} 
                  className="btn btn-primary btn-xl"
                  style={{ paddingLeft: '4rem', paddingRight: '4rem', boxShadow: '0 20px 40px rgba(6, 78, 59, 0.2)' }}
                >
                  <Save size={20} /> {recordId ? 'Appliquer les Modifications' : 'Créer l\'Enregistrement'}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default React.memo(RecordModal);
