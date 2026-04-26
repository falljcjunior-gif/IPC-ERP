import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlignLeft, CheckSquare, MessageSquare, Tag, Users, CreditCard, Clock, Image as ImageIcon, Paperclip, Activity, Plus } from 'lucide-react';

const TrelloCardModal = ({ task, project, updateTask, onClose, projectColumns, currentUser }) => {
  const [desc, setDesc] = useState(task.description || '');
  const [editingDesc, setEditingDesc] = useState(false);
  const [commentText, setCommentText] = useState('');
  
  const [customData, setCustomData] = useState(task.customData || {});

  const [pickingDate, setPickingDate] = useState(false);
  const [dueDate, setDueDate] = useState(task.echeance || '');

  const logActivity = (actionText) => {
    const newActivity = {
      id: Date.now().toString() + Math.random(),
      type: 'activity',
      text: actionText,
      author: currentUser?.nom || 'Inconnu',
      date: new Date().toISOString()
    };
    return newActivity;
  };

  const handleSaveDesc = () => {
    updateTask(task.id, { description: desc });
    setEditingDesc(false);
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const newComment = {
      id: Date.now().toString(),
      type: 'comment',
      text: commentText,
      author: currentUser?.nom || 'Inconnu',
      date: new Date().toISOString()
    };
    updateTask(task.id, { commentaires: [...(task.commentaires || []), newComment] });
    setCommentText('');
  };

  const setCover = () => {
    // Simulated upload / cover picker
    const covers = [
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=2000&auto=format&fit=crop',
      null // remove cover
    ];
    const nextCover = covers[Math.floor(Math.random() * covers.length)];
    const act = logActivity(nextCover ? 'a ajouté une couverture à cette carte' : 'a retiré la couverture de la carte');
    updateTask(task.id, { cover: nextCover, commentaires: [...(task.commentaires||[]), act] });
  };

  const saveDate = () => {
    const act = logActivity(`a défini l'échéance au ${new Date(dueDate).toLocaleDateString()}`);
    updateTask(task.id, { echeance: dueDate, commentaires: [...(task.commentaires||[]), act] });
    setPickingDate(false);
  };

  const addAttachment = () => {
    const act = logActivity('a joint un fichier document.pdf');
    const newAtt = { name: 'document_specifications.pdf', size: '2.4 MB', date: new Date().toISOString() };
    updateTask(task.id, { 
      attachments: [...(task.attachments || []), newAtt],
      commentaires: [...(task.commentaires||[]), act]
    });
  };

  const updateCustomData = (fieldId, value) => {
    const newData = { ...customData, [fieldId]: value };
    setCustomData(newData);
    updateTask(task.id, { customData: newData });
  };

  const colName = projectColumns?.find(c => c.id === task.colonneId)?.title || 'Général';

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto' }}>
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        style={{ 
          background: 'var(--bg)', 
          minHeight: '600px', width: '100%', maxWidth: '768px', 
          margin: '4rem auto', borderRadius: '12px', position: 'relative',
          overflow: 'hidden' 
        }}
      >
        {/* Cover Section */}
        {task.cover && (
          <div style={{ height: '160px', width: '100%', backgroundImage: `url(${task.cover})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
             <button onClick={setCover} style={{ position: 'absolute', bottom: '1rem', right: '1rem', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}><ImageIcon size={14} /> Couverture</button>
          </div>
        )}

        <button onClick={onClose} style={{ position: 'absolute', top: task.cover ? '1rem' : '1rem', right: '1rem', background: task.cover ? 'rgba(0,0,0,0.3)' : 'transparent', border: 'none', cursor: 'pointer', color: task.cover ? 'white' : 'var(--text-muted)', borderRadius: '50%', padding: '4px', zIndex: 10 }}><X size={24} /></button>
        
        <div style={{ padding: '1.5rem' }}>
          {/* Header (Title) */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <CreditCard size={24} color="#0F172A" style={{ marginTop: '4px' }} />
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text)', fontWeight: 800 }}>{task.titre}</h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Dans la liste <span style={{ textDecoration: 'underline' }}>{colName}</span>
              </div>
              
              <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                {/* Labels */}
                {task.labels && task.labels.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Étiquettes</div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {task.labels.map((l, i) => (
                        <div key={i} style={{ background: l.color, color: 'white', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{l.text}</div>
                      ))}
                      <button style={{ background: 'var(--bg-subtle)', border: 'none', padding: '0.25rem', borderRadius: '4px', cursor: 'pointer' }}><Plus size={16} /></button>
                    </div>
                  </div>
                )}

                {/* Due Date */}
                {task.echeance && (
                  <div>
                     <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Date Limite</div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-subtle)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                       <input type="checkbox" onChange={() => {}} style={{ cursor: 'pointer' }} />
                       <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{new Date(task.echeance).toLocaleDateString()}</span>
                   </div>
                 </div>
               )}
              </div>
              
              {/* Custom Fields (Power-Up) */}
              {project?.customFields && project.customFields.length > 0 && (
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                  {project.customFields.map(cf => (
                    <div key={cf.id} style={{ minWidth: '150px' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>{cf.name}</div>
                      <input 
                        type={cf.type === 'date' ? 'date' : cf.type === 'number' ? 'number' : 'text'}
                        value={customData[cf.id] || ''}
                        onChange={e => updateCustomData(cf.id, e.target.value)}
                        placeholder="Saisir..."
                        style={{ padding: '0.4rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-subtle)', width: '100%', outline: 'none', color: 'var(--text)', fontSize: '0.85rem' }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '2rem' }}>
            {/* Main Column */}
            <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              {/* Description */}
              <div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <AlignLeft size={20} color="#0F172A" />
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Description</h3>
                  {!editingDesc && task.description && (
                    <button onClick={() => setEditingDesc(true)} style={{ marginLeft: '1rem', background: 'var(--bg-subtle)', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Modifier</button>
                  )}
                </div>
                <div style={{ marginLeft: '36px' }}>
                  {editingDesc || !task.description ? (
                    <div>
                      <textarea 
                        autoFocus
                        placeholder="Ajouter une description plus détaillée..."
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-subtle)', minHeight: '100px', resize: 'vertical', color: 'var(--text)' }}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button onClick={handleSaveDesc} className="btn-primary" style={{ padding: '0.4rem 1rem', borderRadius: '4px' }}>Enregistrer</button>
                        <button onClick={() => setEditingDesc(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>Annuler</button>
                      </div>
                    </div>
                  ) : (
                    <div onClick={() => setEditingDesc(true)} style={{ cursor: 'pointer', padding: '0.5rem', background: '#F8FAFC', borderRadius: '8px', color: 'var(--text)', lineHeight: 1.5, minHeight: '60px' }}>
                      {task.description}
                    </div>
                  )}
                </div>
              </div>

              {/* Attachments */}
              {task.attachments && task.attachments.length > 0 && (
                <div>
                   <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.8rem' }}>
                     <Paperclip size={20} color="#0F172A" />
                     <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Pièces Jointes</h3>
                   </div>
                   <div style={{ marginLeft: '36px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                     {task.attachments.map((att, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
                           <div style={{ background: '#E2E8F0', padding: '1rem', borderRadius: '4px', fontWeight: 800, color: '#64748B' }}>PDF</div>
                           <div style={{ flex: 1 }}>
                             <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{att.name}</div>
                             <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Ajouté {new Date(att.date).toLocaleDateString()} - {att.size}</div>
                           </div>
                        </div>
                     ))}
                   </div>
                </div>
              )}

              {/* Checklists */}
              {task.checklists && task.checklists.length > 0 && (
                <div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.8rem' }}>
                    <CheckSquare size={20} color="#0F172A" />
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Checklists</h3>
                  </div>
                  <div style={{ marginLeft: '36px' }}>
                    {task.checklists.map((cl, idx) => {
                      const doneItems = cl.items?.filter(i => i.done).length || 0;
                      const totalItems = cl.items?.length || 0;
                      const percent = totalItems ? Math.round((doneItems/totalItems)*100) : 0;
                      return (
                      <div key={idx} style={{ marginBottom: '1.5rem' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          {cl.name}
                          <button style={{ background: 'var(--bg-subtle)', border: 'none', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>Supprimer</button>
                        </h4>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                           <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{percent}%</span>
                           <div style={{ flex: 1, height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${percent}%`, background: percent === 100 ? '#10B981' : '#3B82F6', transition: 'width 0.3s, background 0.3s' }} />
                           </div>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          {cl.items?.map((item, iIdx) => (
                            <div key={iIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.2rem 0' }}>
                              <input type="checkbox" checked={item.done} readOnly style={{ cursor: 'pointer', marginTop: '4px' }} onClick={() => {
                                 // Deep clone and toggle
                                 const newLocal = JSON.parse(JSON.stringify(task.checklists));
                                 newLocal[idx].items[iIdx].done = !newLocal[idx].items[iIdx].done;
                                 const act = logActivity(newLocal[idx].items[iIdx].done ? `a coché ${item.text}` : `a décoché ${item.text}`);
                                 updateTask(task.id, { checklists: newLocal, commentaires: [...(task.commentaires||[]), act] });
                              }}/>
                              <span style={{ textDecoration: item.done ? 'line-through' : 'none', color: item.done ? '#64748B' : 'var(--text)', background: item.done ? 'transparent' : '#F8FAFC', padding: '0.2rem 0.5rem', borderRadius: '4px', flex: 1 }}>{item.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )})}
                  </div>
                </div>
              )}

              {/* Activity / Comments */}
              <div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <Activity size={20} color="#0F172A" />
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Activité</h3>
                </div>
                <div style={{ marginLeft: '36px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {/* Input box */}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ width: '32px', height: '32px', minWidth: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                      {currentUser?.nom?.[0] || '?'}
                    </div>
                    <div style={{ flex: 1, background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)', padding: '0.5rem', transition: 'border 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                      <textarea 
                        placeholder="Écrire un commentaire..."
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        style={{ width: '100%', border: 'none', background: 'transparent', resize: 'none', outline: 'none', color: 'var(--text)', minHeight: '40px' }}
                      />
                      {commentText && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                          <button onClick={handleAddComment} className="btn-primary" style={{ padding: '0.4rem 1rem', borderRadius: '4px' }}>Enregistrer</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comment & Activity Feed */}
                  {task.commentaires?.slice().reverse().map(c => {
                    if (c.type === 'activity') {
                      return (
                        <div key={c.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                           <div style={{ width: '32px', minWidth: '32px', display: 'flex', justifyContent: 'center' }}><Activity size={12} color="#94A3B8" /></div>
                           <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                             <span style={{ fontWeight: 700, color: '#0F172A' }}>{c.author}</span> {c.text}
                             <span style={{ fontSize: '0.75rem', color: '#94A3B8', marginLeft: '0.5rem' }}>{new Date(c.date).toLocaleString()}</span>
                           </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={c.id} style={{ display: 'flex', gap: '1rem' }}>
                         <div style={{ width: '32px', height: '32px', minWidth: '32px', borderRadius: '50%', background: '#64748B', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {c.author?.[0]}
                         </div>
                         <div style={{ flex: 1 }}>
                           <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
                             <span style={{ fontWeight: 700 }}>{c.author}</span>
                             <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(c.date).toLocaleString()}</span>
                           </div>
                           <div style={{ background: '#FFFFFF', border: '1px solid var(--border)', padding: '0.75rem', borderRadius: '8px', marginTop: '0.4rem', color: 'var(--text)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                             {c.text}
                           </div>
                         </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Sidebar Menu */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                 <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Ajouter à la carte</h4>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.5rem', background: 'var(--bg-subtle)', border: 'none', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', fontWeight: 600 }}>
                      <Users size={16} /> Membres
                    </button>
                    <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.5rem', background: 'var(--bg-subtle)', border: 'none', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', fontWeight: 600 }}>
                      <Tag size={16} /> Étiquettes
                    </button>
                    <button onClick={() => {
                        const newCl = { name: 'Nouvelle Checklist', items: [{ text: 'Exemple de tâche', done: false }] };
                        const act = logActivity('a ajouté une checklist');
                        updateTask(task.id, { checklists: [...(task.checklists||[]), newCl], commentaires: [...(task.commentaires||[]), act] });
                    }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.5rem', background: 'var(--bg-subtle)', border: 'none', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', fontWeight: 600 }}>
                      <CheckSquare size={16} /> Checklist
                    </button>
                    <button onClick={() => setPickingDate(!pickingDate)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.5rem', background: pickingDate ? '#E2E8F0' : 'var(--bg-subtle)', border: 'none', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', fontWeight: 600 }}>
                      <Clock size={16} /> Dates
                    </button>
                    {pickingDate && (
                      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '4px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.2rem' }}>
                         <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border)' }} />
                         <button onClick={saveDate} className="btn-primary" style={{ padding: '0.4rem', borderRadius: '4px' }}>Enregistrer</button>
                      </div>
                    )}
                    <button onClick={addAttachment} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.5rem', background: 'var(--bg-subtle)', border: 'none', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', fontWeight: 600 }}>
                      <Paperclip size={16} /> Pièce jointe
                    </button>
                    {!task.cover && (
                      <button onClick={setCover} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.5rem', background: 'var(--bg-subtle)', border: 'none', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', fontWeight: 600 }}>
                        <ImageIcon size={16} /> Couverture
                      </button>
                    )}
                 </div>
              </div>
              
              {/* Actions */}
              <div>
                 <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Actions</h4>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.5rem', background: '#EF444415', color: '#EF4444', border: 'none', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', fontWeight: 600 }}>
                      <X size={16} /> Archiver
                    </button>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TrelloCardModal;
