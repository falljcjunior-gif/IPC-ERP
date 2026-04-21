import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlignLeft, CheckSquare, MessageSquare, Tag, Users, CreditCard, Clock } from 'lucide-react';

const TrelloCardModal = ({ task, updateTask, onClose, projectColumns, currentUser }) => {
  const [desc, setDesc] = useState(task.description || '');
  const [editingDesc, setEditingDesc] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleSaveDesc = () => {
    updateTask(task.id, { description: desc });
    setEditingDesc(false);
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const newComment = {
      id: Date.now().toString(),
      text: commentText,
      author: currentUser?.nom || 'Inconnu',
      date: new Date().toISOString()
    };
    const updatedComments = [...(task.commentaires || []), newComment];
    updateTask(task.id, { commentaires: updatedComments });
    setCommentText('');
  };

  // Safe fallback for colonne
  const colName = projectColumns?.find(c => c.id === task.colonneId)?.title || 'Général';

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto' }}>
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        style={{ background: 'var(--bg)', minHeight: '600px', width: '100%', maxWidth: '768px', margin: '4rem auto', borderRadius: '12px', padding: '1.5rem', position: 'relative' }}
      >
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={24} /></button>
        
        {/* Header (Title) */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <CreditCard size={24} color="#0F172A" />
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text)', fontWeight: 800 }}>{task.titre}</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Dans la liste <span style={{ textDecoration: 'underline' }}>{colName}</span>
            </div>
            
            {task.labels && task.labels.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                {task.labels.map((l, i) => (
                  <div key={i} style={{ background: l.color, color: 'white', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{l.text}</div>
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

            {/* Checklists */}
            {task.checklists && task.checklists.length > 0 && (
              <div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <CheckSquare size={20} color="#0F172A" />
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Checklists</h3>
                </div>
                <div style={{ marginLeft: '36px' }}>
                  {task.checklists.map((cl, idx) => (
                    <div key={idx} style={{ marginBottom: '1rem' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0', display: 'flex', justifyContent: 'space-between' }}>
                        {cl.name}
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cl.items?.filter(i => i.done).length || 0} / {cl.items?.length || 0}</span>
                      </h4>
                      {/* Interactive checklist progress bar */}
                      <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', marginBottom: '0.5rem', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: cl.items?.length ? `${(cl.items.filter(i => i.done).length / cl.items.length) * 100}%` : '0%', background: '#10B981', transition: 'width 0.3s' }} />
                      </div>
                      
                      {cl.items?.map((item, iIdx) => (
                        <div key={iIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.2rem 0' }}>
                          <input type="checkbox" checked={item.done} readOnly style={{ cursor: 'pointer' }} onClick={() => {
                             // Deep clone and toggle
                             const newLocal = JSON.parse(JSON.stringify(task.checklists));
                             newLocal[idx].items[iIdx].done = !newLocal[idx].items[iIdx].done;
                             updateTask(task.id, { checklists: newLocal });
                          }}/>
                          <span style={{ textDecoration: item.done ? 'line-through' : 'none', color: item.done ? '#64748B' : 'var(--text)' }}>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activity / Comments */}
            <div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.8rem' }}>
                <MessageSquare size={20} color="#0F172A" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Activité</h3>
              </div>
              <div style={{ marginLeft: '36px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Input box */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ width: '32px', height: '32px', minWidth: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {currentUser?.nom?.[0] || '?'}
                  </div>
                  <div style={{ flex: 1, background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border)', padding: '0.5rem', transition: 'border 0.2s' }}>
                    <textarea 
                      placeholder="Écrire un commentaire..."
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      style={{ width: '100%', border: 'none', background: 'transparent', resize: 'none', outline: 'none', color: 'var(--text)', minHeight: '40px' }}
                    />
                    {commentText && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                        <button onClick={handleAddComment} className="btn-primary" style={{ padding: '0.4rem 1rem', borderRadius: '4px' }}>Créer</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Comment Feed */}
                {task.commentaires?.slice().reverse().map(c => (
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
                ))}
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
                      const newCl = { name: 'Nouvelle Checklist', items: [{ text: 'À valider', done: false }] };
                      updateTask(task.id, { checklists: [...(task.checklists||[]), newCl] });
                  }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.5rem', background: 'var(--bg-subtle)', border: 'none', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', fontWeight: 600 }}>
                    <CheckSquare size={16} /> Checklist
                  </button>
                  <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.5rem', background: 'var(--bg-subtle)', border: 'none', borderRadius: '4px', cursor: 'pointer', textAlign: 'left', fontWeight: 600 }}>
                    <Clock size={16} /> Date limite
                  </button>
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
      </motion.div>
    </div>
  );
};

export default TrelloCardModal;
