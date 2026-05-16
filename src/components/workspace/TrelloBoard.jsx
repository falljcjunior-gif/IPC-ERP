import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreHorizontal, MessageSquare, AlignLeft, CheckSquare, Clock, Paperclip } from 'lucide-react';

const TrelloBoard = ({ project, tasks, updateProject, updateTask, addTask, onCardClick, users = [], isAdmin = false }) => {
  const [columns, setColumns] = useState(project?.colonnes || []);
  const [addingCol, setAddingCol] = useState(false);
  const [colTitle, setColTitle] = useState('');
  
  const [addingTask, setAddingTask] = useState(null); // column id
  const [taskTitle, setTaskTitle] = useState('');

  const [localTasks, setLocalTasks] = useState(tasks || []);

  useEffect(() => {
    setLocalTasks(tasks || []);
    if (project?.colonnes && project.colonnes.length > 0) {
      setColumns(project.colonnes);
    } else {
       const defCols = [{ id: 'col1', title: 'À faire' }, { id: 'col2', title: 'En cours' }, { id: 'col3', title: 'Terminé' }];
       setColumns(defCols);
       updateProject(project.id, { colonnes: defCols });
    }
  }, [tasks, project]);

  const handleDragStart = (e, taskId, sourceColId) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.setData('sourceCol', sourceColId);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetColId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const sourceColId = e.dataTransfer.getData('sourceCol');
    
    if (sourceColId === targetColId) return;

    setLocalTasks(prev => prev.map(t => t.id === taskId ? { ...t, colonneId: targetColId } : t));
    updateTask(taskId, { colonneId: targetColId });
  };

  const handleAddCol = () => {
    if (!colTitle.trim()) { setAddingCol(false); return; }
    const newCol = { id: 'col_' + Date.now(), title: colTitle };
    const newCols = [...columns, newCol];
    setColumns(newCols);
    updateProject(project.id, { colonnes: newCols });
    setColTitle('');
    setAddingCol(false);
  };

  const handleDeleteCol = (colId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette liste ?')) return;
    const newCols = columns.filter(c => c.id !== colId);
    setColumns(newCols);
    updateProject(project.id, { colonnes: newCols });
  };

  const handleAddTask = (colId) => {
    if (!taskTitle.trim()) { setAddingTask(null); return; }
    const numItems = localTasks.filter(t => t.colonneId === colId).length;
    addTask({
      titre: taskTitle,
      projet: project.nom,
      colonneId: colId,
      position: numItems,
      statut: 'À faire'
    });
    setTaskTitle('');
    setAddingTask(null);
  };

  // Helper to resolve User Avatar — match by id or name
  const getAvatar = (nameOrId) => {
    if (!nameOrId) return '?';
    const u = users.find(user => user.id === nameOrId || user.nom === nameOrId || user.email === nameOrId);
    return (u?.nom || u?.name || nameOrId)?.[0]?.toUpperCase() || '?';
  };

  return (
    <div style={{ display: 'flex', overflowX: 'auto', gap: '1rem', paddingBottom: '2rem', height: '100%', minHeight: '65vh', alignItems: 'flex-start' }}>
      {columns.map(col => (
        <div 
          key={col.id} 
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, col.id)}
          style={{
            minWidth: '280px', maxWidth: '280px',
            background: '#F1F5F9',
            borderRadius: '12px',
            padding: '0.75rem',
            display: 'flex', flexDirection: 'column', gap: '0.5rem',
            maxHeight: '100%'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem', marginBottom: '0.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>{col.title}</h3>
            {isAdmin && (
              <button 
                onClick={() => handleDeleteCol(col.id)}
                style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}
                title="Supprimer la liste"
              >
                <MoreHorizontal size={16} />
              </button>
            )}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: '20px', overflowY: 'auto', paddingRight: '4px' }}>
            {localTasks.filter(t => t.colonneId === col.id).sort((a,b) => (a.position||0) - (b.position||0)).map(t => {
              const hasDesc = !!t.description;
              const hasChecklists = t.checklists && t.checklists.length > 0;
              const hasComments = t.commentaires && t.commentaires.length > 0;
              const hasAttachments = t.attachments && t.attachments.length > 0;
              const totalChecks = t.checklists?.reduce((acc, c) => acc + (c.items?.length||0), 0) || 0;
              const checkedChecks = t.checklists?.reduce((acc, c) => acc + (c.items?.filter(i => i.done)?.length||0), 0) || 0;

              // Due date coloring
              let dueColor = 'transparent';
              let dueBg = 'transparent';
              let dueText = '';
              const isTermine = col.title.toLowerCase().includes('termin') || col.title.toLowerCase().includes('done') || col.title.toLowerCase().includes('fini');

              if (t.echeance) {
                const due = new Date(t.echeance);
                const now = new Date();
                const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
                dueText = due.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
                
                if (isTermine) {
                   dueBg = '#10B981'; dueColor = 'white'; // Green
                } else if (diffDays < 0) {
                   dueBg = '#EF4444'; dueColor = 'white'; // Red Overdue
                } else if (diffDays <= 2) {
                   dueBg = '#F59E0B'; dueColor = 'white'; // Yellow Soon
                } else {
                   dueBg = 'transparent'; dueColor = '#64748B'; // Normal
                }
              }

              return (
                <div
                  key={t.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, t.id, col.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onCardClick(t, col.id)}
                  className="glass-hover"
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    userSelect: 'none',
                    display: 'flex', flexDirection: 'column',
                    overflow: 'hidden',
                    borderLeft: t.priorite === 'Haute' ? '3px solid #EF4444' : '3px solid transparent'
                  }}
                >
                  {/* Cover Image */}
                  {t.cover && (
                    <div style={{ height: '120px', width: '100%', backgroundImage: `url(${t.cover})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#CBD5E1' }} />
                  )}

                  <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {t.labels && t.labels.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.2rem' }}>
                        {t.labels.map((l, i) => <div key={i} style={{ height: '8px', minWidth: '40px', borderRadius: '4px', background: l.color }} title={l.text} />)}
                      </div>
                    )}
                    <div style={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 500, lineHeight: 1.4 }}>{t.titre}</div>
                    
                    {/* Badges row */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
                      
                      {t.echeance && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: dueBg, color: dueColor, fontWeight: dueBg !== 'transparent' ? 700 : 500 }}>
                           <Clock size={12} /> {dueText}
                        </div>
                      )}

                      {(hasDesc || hasChecklists || hasComments || hasAttachments) && (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#64748B' }}>
                          {hasDesc && <AlignLeft size={12} />}
                          {hasComments && <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.7rem' }}><MessageSquare size={12} /> {t.commentaires.length}</div>}
                          {hasAttachments && <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.7rem' }}><Paperclip size={12} /> {t.attachments.length}</div>}
                          {hasChecklists && <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.7rem' }}><CheckSquare size={12} /> {checkedChecks}/{totalChecks}</div>}
                        </div>
                      )}

                      {/* Assignees (Avatars right aligned) */}
                      {t.membresId && t.membresId.length > 0 && (
                        <div style={{ display: 'flex', marginLeft: 'auto', gap: '-4px' }}>
                          {t.membresId.slice(0, 3).map((m, i) => (
                             <div key={i} style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#8B5CF6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', border: '2px solid white', marginLeft: i > 0 ? '-8px' : '0' }}>
                               {getAvatar(m)}
                             </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {addingTask === col.id ? (
            <div style={{ marginTop: '0.5rem' }}>
              <textarea 
                autoFocus
                placeholder="Saisissez un titre pour cette carte..."
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
                onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddTask(col.id); } }}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1', resize: 'none', background: 'white', minHeight: '60px', outline: 'none', color: '#0F172A', fontSize: '0.85rem' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button onClick={() => handleAddTask(col.id)} className="btn-primary" style={{ padding: '0.4rem 0.8rem', borderRadius: '4px' }}>Ajouter</button>
                <button onClick={() => setAddingTask(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}>Fermer</button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setAddingTask(col.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', background: 'transparent', border: 'none', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: 500, fontSize: '0.85rem', marginTop: '0.25rem' }}
              onMouseOver={e => e.currentTarget.style.background = '#E2E8F0'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              <Plus size={16} /> Ajouter une carte
            </button>
          )}
        </div>
      ))}

      {/* Add New List (Admin Only) */}
      {isAdmin && (
        <div style={{ minWidth: '280px', maxWidth: '280px' }}>
          {addingCol ? (
            <div style={{ background: '#F1F5F9', padding: '0.5rem', borderRadius: '12px' }}>
              <input 
                autoFocus
                placeholder="Saisir le titre de la liste..."
                value={colTitle}
                onChange={e => setColTitle(e.target.value)}
                onKeyDown={e => { if(e.key === 'Enter') handleAddCol(); }}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #CBD5E1', outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button onClick={handleAddCol} className="btn-primary" style={{ padding: '0.4rem 0.8rem', borderRadius: '4px' }}>Ajouter la liste</button>
                <button onClick={() => setAddingCol(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}>Fermer</button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setAddingCol(true)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#F8FAFC', background: 'rgba(255,255,255,0.2)', border: 'none', padding: '0.8rem', borderRadius: '12px', cursor: 'pointer', textAlign: 'left', fontWeight: 600, fontSize: '0.9rem' }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >
              <Plus size={18} /> Ajouter une autre liste
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TrelloBoard;
