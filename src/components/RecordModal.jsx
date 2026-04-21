import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Edit3, Trash2, Printer, MoreHorizontal, MessageSquare, History, FileText, Upload, Plus, CheckCircle2 } from 'lucide-react';
import Chatter from './Chatter';
import SmartButtons from './SmartButtons';
import { useBusiness } from '../BusinessContext';

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
  smartButtons = [],
  isLoading = false 
}) => {
  const { data } = useBusiness();
  const [formData, setFormData] = useState(initialData || {});
  const [isEditMode, setIsEditMode] = useState(!recordId); // Default to edit if no ID (new record)
  const [activeTab, setActiveTab] = useState('data'); // data, chatter, documents
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLoading) return;
    
    // Native-like validation for 'required' fields since footer button bypasses form submit
    const missingFields = fields.filter(f => f.required && !formData[f.name]);
    if (missingFields.length > 0) {
        alert("Attention : Veuillez remplir les champs obligatoires suivants : " + missingFields.map(f => f.label).join(', '));
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '1rem'
        }}>
          {/* Success Overlay */}
          <AnimatePresence>
            {showSuccessAnim && (
               <motion.div
                 initial={{ opacity: 0, scale: 0.8 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.8 }}
                 style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(16, 185, 129, 0.95)', zIndex: 3000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '2rem' }}
               >
                 <CheckCircle2 size={80} color="white" style={{ marginBottom: '1rem' }} />
                 <h2 style={{ color: 'white', fontSize: '2rem', fontWeight: 900, textAlign: 'center' }}>Demande envoyée !</h2>
               </motion.div>
            )}
          </AnimatePresence>

          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(10px)'
            }}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            className="glass"
            style={{
              width: '100%',
              maxWidth: '1200px',
              height: '90vh',
              borderRadius: '2rem',
              position: 'relative',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              boxShadow: '0 40px 100px -20px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Header / Barra de ferramientas */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '1.5rem 2.5rem', 
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text)' }}>{title}</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {isEditMode ? (
                     <button onClick={handleSubmit} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}><Save size={14}/> Enregistrer</button>
                  ) : (
                     <button onClick={() => setIsEditMode(true)} className="btn glass" style={{ border: '1px solid var(--border)', padding: '0.4rem 1rem', fontSize: '0.8rem' }}><Edit3 size={14}/> Modifier</button>
                  )}
                  <button className="btn glass" style={{ border: '1px solid var(--border)', padding: '0.4rem 1rem', fontSize: '0.8rem' }}><Printer size={14}/> Imprimer</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                 <button className="btn glass" style={{ border: '1px solid var(--border)', padding: '0.5rem' }}><MoreHorizontal size={18}/></button>
                 <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={24} /></button>
              </div>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
               {/* Left Side: Data & Forms */}
               <div style={{ flex: 1.5, overflowY: 'auto', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  
                  {/* Smart Buttons Row */}
                  <SmartButtons buttons={smartButtons} />

                  <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                      {fields.map(field => (
                        <div key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {field.label}
                          </label>
                          {!isEditMode ? (
                            <div style={{ padding: '0.75rem 0', fontWeight: 700, fontSize: '1rem', borderBottom: '1px solid var(--border)' }}>
                              {initialData[field.name]?.toString() || '—'}
                            </div>
                          ) : (
                            (field.type === 'selection' || field.type === 'select') ? (
                              <select
                                value={formData[field.name] || ''}
                                required={field.required}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                className="glass"
                                style={{ padding: '0.85rem 1rem', borderRadius: '0.85rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text)', outline: 'none', fontWeight: 600 }}
                              >
                                <option value="">Sélectionner...</option>
                                {field.options && field.options.map(opt => {
                                  const value = typeof opt === 'object' ? opt.value : opt;
                                  const label = typeof opt === 'object' ? opt.label : opt;
                                  return <option key={value} value={value}>{label}</option>;
                                })}
                              </select>
                            ) : field.type === 'textarea' ? (
                              <textarea
                                value={formData[field.name] || ''}
                                required={field.required}
                                placeholder={field.placeholder}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                className="glass"
                                style={{ padding: '0.85rem 1rem', borderRadius: '0.85rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text)', outline: 'none', fontWeight: 600, minHeight: '120px', resize: 'vertical' }}
                              />
                            ) : (
                              <input
                                value={formData[field.name] || ''}
                                type={field.type === 'money' ? 'number' : (field.type || 'text')}
                                required={field.required}
                                placeholder={field.placeholder}
                                onChange={(e) => handleChange(field.name, (field.type === 'number' || field.type === 'money') ? Number(e.target.value) : e.target.value)}
                                className="glass"
                                style={{ padding: '0.85rem 1rem', borderRadius: '0.85rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text)', outline: 'none', fontWeight: 600 }}
                              />
                            )
                          )}
                        </div>
                      ))}
                    </div>
                  </form>
               </div>

               {/* Right Side: Chatter (The Odoo Magic) */}
               {recordId && (
                 <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                    <div style={{ display: 'flex', background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                       <button 
                        onClick={() => setActiveTab('data')}
                        style={{ flex: 1, padding: '1rem', border: 'none', background: 'transparent', borderBottom: activeTab === 'data' ? '2px solid var(--accent)' : 'none', color: activeTab === 'data' ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                       >
                         INFOS
                       </button>
                       <button 
                        onClick={() => setActiveTab('chatter')}
                        style={{ flex: 1, padding: '1rem', border: 'none', background: 'transparent', borderBottom: activeTab === 'chatter' ? '2px solid var(--accent)' : 'none', color: activeTab === 'chatter' ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                       >
                         CHATTER <MessageSquare size={14}/>
                       </button>
                       <button 
                        onClick={() => setActiveTab('documents')}
                        style={{ flex: 1, padding: '1rem', border: 'none', background: 'transparent', borderBottom: activeTab === 'documents' ? '2px solid var(--accent)' : 'none', color: activeTab === 'documents' ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                       >
                         DOCS <FileText size={14}/>
                       </button>
                    </div>
                    
                    <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                       {activeTab === 'chatter' ? (
                          <Chatter targetId={recordId} targetType={recordType} />
                       ) : activeTab === 'documents' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Documents liés</h4>
                                <button className="btn glass" style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Upload size={12}/> Ajouter</button>
                             </div>
                             {(data.dms?.files || []).filter(f => f.relatedId === recordId).length > 0 ? (
                                (data.dms?.files || []).filter(f => f.relatedId === recordId).map(file => (
                                  <div key={file.id} className="glass" style={{ padding: '0.75rem 1rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                     <FileText size={16} color="var(--accent)" />
                                     <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 700, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{file.name}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{file.size} · {file.type}</div>
                                     </div>
                                  </div>
                                ))
                             ) : (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem', border: '2px dashed var(--border)', borderRadius: '1rem' }}>
                                   Aucun document joint.
                                </div>
                             )}
                          </div>
                       ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                             <div className="glass" style={{ padding: '1rem', borderRadius: '1rem' }}>
                                <h4 style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Identifiant Interne</h4>
                                <code style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>{recordId}</code>
                             </div>
                             <div className="glass" style={{ padding: '1rem', borderRadius: '1rem' }}>
                                <h4 style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text_muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Audit Création</h4>
                                <div style={{ fontSize: '0.8rem' }}>Créé par: <span style={{ fontWeight: 700 }}>{initialData.user || 'Système'}</span></div>
                                <div style={{ fontSize: '0.8rem' }}>Le: <span style={{ fontWeight: 700 }}>{initialData.createdAt ? new Date(initialData.createdAt).toLocaleString() : '—'}</span></div>
                             </div>
                          </div>
                       )}
                    </div>
                 </div>
               )}
            </div>

            {/* Footer Actions if needed (New Record only) */}
            {!recordId && (
              <div style={{ padding: '1.5rem 2.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                 <button onClick={onClose} className="btn glass" style={{ border: '1px solid var(--border)' }}>Annuler</button>
                 <button onClick={handleSubmit} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}><Save size={18}/> Créer {title}</button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RecordModal;
