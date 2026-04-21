import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, CheckSquare, Target, Plus, ChevronLeft, LayoutGrid, Kanban, Calendar as CalendarIcon, PieChart, Table as TableIcon, Copy } from 'lucide-react';
import { useBusiness } from '../BusinessContext';

import TrelloBoard from '../components/workspace/TrelloBoard';
import TrelloCardModal from '../components/workspace/TrelloCardModal';
import TrelloDashboard from '../components/workspace/TrelloDashboard';
import TrelloCalendar from '../components/workspace/TrelloCalendar';
import TrelloButlerModal from '../components/workspace/TrelloButlerModal';
import RecordModal from '../components/RecordModal';
import { projectSchema } from '../schemas/project.schema';

const ProjectHub = ({ onOpenDetail }) => {
  const { data, addRecord, updateRecord, currentUser } = useBusiness();
  const [activeProject, setActiveProject] = useState(null);
  const [activeView, setActiveView] = useState('board'); // 'board', 'calendar', 'dashboard'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isButlerOpen, setIsButlerOpen] = useState(false);
  const [activeCard, setActiveCard] = useState(null);

  const projects = data?.projects?.projects || [];
  const tasks = data?.projects?.tasks || [];

  const isBoardAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.nom === activeProject?.chefProjet;

  const handleCloneProject = (p) => {
    const newTemplate = {
      nom: p.nom + ' (Copie Modèle)',
      client: p.client,
      budget: p.budget,
      chefProjet: currentUser?.nom || p.chefProjet,
      colonnes: p.colonnes || [],
      rules: p.rules || [],
      customFields: p.customFields || []
    };
    addRecord('projects', 'projects', newTemplate);
  };

  // Moteur d'automatisation I.P.C Butler
  const applyRules = (taskId, changes) => {
    if (!activeProject || !activeProject.rules) {
      updateRecord('projects', 'tasks', taskId, changes);
      return;
    }

    const mergedChanges = { ...changes };
    const taskBefore = tasks.find(t => t.id === taskId);
    let actionLogs = [];

    activeProject.rules.forEach(rule => {
      // Si la règle est "Quand déplacé vers la colonne Y"
      if (rule.trigger.type === 'move' && changes.colonneId && changes.colonneId === rule.trigger.targetColId) {
        
        if (rule.effect.type === 'mark_done') { // All Checklists to true + Echeance vert
          if (taskBefore?.checklists) {
            mergedChanges.checklists = taskBefore.checklists.map(cl => ({...cl, items: cl.items?.map(i => ({...i, done: true})) }));
          }
          if (taskBefore?.echeance) {
            // Keep date but change color (done natively based on terminee col)
          }
          actionLogs.push({ id: Date.now().toString() + Math.random(), type: 'activity', text: 'Butler : A validé toutes les checklists', author: '🤖 Butler', date: new Date().toISOString() });
        }
        
        if (rule.effect.type === 'add_green_label') {
          mergedChanges.labels = [...(taskBefore?.labels||[]), { color: '#10B981', text: 'Validé' }];
          actionLogs.push({ id: Date.now().toString() + Math.random(), type: 'activity', text: 'Butler : A ajouté une étiquette verte', author: '🤖 Butler', date: new Date().toISOString() });
        }
        
        if (rule.effect.type === 'assign_me') {
          mergedChanges.membresId = [...new Set([...(taskBefore?.membresId||[]), currentUser?.nom || 'Moi'])];
          actionLogs.push({ id: Date.now().toString() + Math.random(), type: 'activity', text: 'Butler : Vous a affecté à la carte', author: '🤖 Butler', date: new Date().toISOString() });
        }
      }
    });

    if (actionLogs.length > 0) {
      mergedChanges.commentaires = [...(taskBefore?.commentaires||[]), ...(changes.commentaires||[]), ...actionLogs];
    }
    updateRecord('projects', 'tasks', taskId, mergedChanges);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'linear-gradient(135deg, #F8FAFC 0%, rgba(139, 92, 246, 0.05) 100%)' }}>
      
      {/* Header */}
      <div style={{ padding: '2.5rem 2.5rem 1rem 2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#8B5CF6', marginBottom: '0.75rem' }}>
             <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 4 }} style={{ background: '#8B5CF620', padding: '6px', borderRadius: '8px' }}>
                <Target size={18} />
             </motion.div>
             <span style={{ fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2.5px' }}>I.P.C Project Desk</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {activeProject && (
              <button 
                onClick={() => setActiveProject(null)} 
                title="Retour aux tableaux"
                style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                 <ChevronLeft size={20} color="var(--text)" />
              </button>
            )}
            <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: 0, letterSpacing: '-1.5px', color: 'var(--text)' }}>
              {activeProject ? activeProject.nom : 'Tableaux de Projets'}
            </h1>
          </div>

          {activeProject && (
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem', width: '100%', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={() => setActiveView('board')} 
                  style={{ background: 'transparent', border: 'none', borderBottom: activeView === 'board' ? '3px solid #8B5CF6' : '3px solid transparent', padding: '0.5rem 1rem', color: activeView === 'board' ? '#8B5CF6' : '#64748B', fontWeight: 700, cursor: 'pointer', display: 'flex', gap: '0.5rem', marginBottom: '-0.6rem' }}
                >
                  <Kanban size={18} /> Tableau
                </button>
                <button 
                  onClick={() => setActiveView('calendar')} 
                  style={{ background: 'transparent', border: 'none', borderBottom: activeView === 'calendar' ? '3px solid #8B5CF6' : '3px solid transparent', padding: '0.5rem 1rem', color: activeView === 'calendar' ? '#8B5CF6' : '#64748B', fontWeight: 700, cursor: 'pointer', display: 'flex', gap: '0.5rem', marginBottom: '-0.6rem' }}
                >
                  <CalendarIcon size={18} /> Calendrier
                </button>
                <button 
                  onClick={() => setActiveView('dashboard')} 
                  style={{ background: 'transparent', border: 'none', borderBottom: activeView === 'dashboard' ? '3px solid #8B5CF6' : '3px solid transparent', padding: '0.5rem 1rem', color: activeView === 'dashboard' ? '#8B5CF6' : '#64748B', fontWeight: 700, cursor: 'pointer', display: 'flex', gap: '0.5rem', marginBottom: '-0.6rem' }}
                >
                  <PieChart size={18} /> Dashboard
                </button>
              </div>
              {isBoardAdmin && (
                <button onClick={() => setIsButlerOpen(true)} className="btn-secondary" style={{ padding: '0.4rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  Automatisation
                </button>
              )}
            </div>
          )}
          
          {!activeProject && (
            <p style={{ color: 'var(--text-muted)', margin: '0.6rem 0 0 0', fontSize: '1rem', fontWeight: 500, maxWidth: '600px', lineHeight: 1.5 }}>
              Sélectionnez un projet pour ouvrir son tableau de travail collaboratif de type Trello, ou créez un nouvel espace.
            </p>
          )}
        </div>

        {!activeProject && (
          <button className="btn-primary" onClick={() => setIsModalOpen(true)} style={{ padding: '0.8rem 1.8rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Plus size={20} /> <span style={{ fontWeight: 800 }}>Nouveau Tableau</span>
          </button>
        )}
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, padding: '1rem 2.5rem 2.5rem 2.5rem', overflowY: 'auto' }}>
        <AnimatePresence mode="wait">
          {!activeProject ? (
            // Projects Grid View (Home)
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}
            >
               {projects.map(p => {
                 const boardTasks = tasks.filter(t => t.projet === p.nom);
                 const progress = boardTasks.length > 0 && p.colonnes?.length > 0 
                     ? boardTasks.filter(t => t.colonneId === p.colonnes[p.colonnes.length-1].id).length / boardTasks.length 
                     : 0;

                 return (
                 <motion.div
                   key={p.id}
                   whileHover={{ y: -5 }}
                   onClick={() => { setActiveProject(p); setActiveView('board'); }}
                   className="glass"
                   style={{
                     padding: '1.5rem',
                     borderRadius: '16px',
                     cursor: 'pointer',
                     display: 'flex', flexDirection: 'column', gap: '1rem',
                     border: '1px solid var(--border)',
                     boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                   }}
                 >
                   <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                     <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                       <div style={{ 
                         background: 'var(--accent)20', color: 'var(--accent)', 
                         width: '40px', height: '40px', borderRadius: '10px', 
                         display: 'flex', alignItems: 'center', justifyContent: 'center' 
                       }}>
                         <LayoutGrid size={20} />
                       </div>
                       <button 
                         onClick={(e) => { e.stopPropagation(); handleCloneProject(p); }} 
                         style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '0.4rem', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }} 
                         title="Faire de ce tableau un modèle (Dupliquer l'architecture)"
                       >
                         <Copy size={16} />
                       </button>
                     </div>
                     <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{boardTasks.length} Tâches</span>
                   </div>
                   
                   <div>
                     <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>{p.nom}</h3>
                     <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>{p.client}</p>
                   </div>
                   
                   {/* Progress Bar Mini */}
                   <div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 800, marginBottom: '0.2rem', color: 'var(--text-muted)' }}>
                       <span>Avancement Global</span>
                       <span>{Math.round(progress * 100)}%</span>
                     </div>
                     <div style={{ height: '6px', background: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                       <div style={{ height: '100%', width: `${progress * 100}%`, background: 'var(--accent)' }} />
                     </div>
                   </div>
                 </motion.div>
               )})}

               <motion.div
                 whileHover={{ y: -5 }}
                 onClick={() => setIsModalOpen(true)}
                 style={{
                   padding: '1.5rem', borderRadius: '16px', cursor: 'pointer',
                   display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                   border: '2px dashed var(--border)', background: 'transparent',
                   color: 'var(--text-muted)'
                 }}
               >
                 <Plus size={32} />
                 <span style={{ fontWeight: 700 }}>Créer un nouveau tableau</span>
               </motion.div>
            </motion.div>
          ) : (
            // Active Trello Views
            <motion.div
              key="views"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              style={{ height: '100%' }}
            >
              {activeView === 'board' && (
                <TrelloBoard 
                  project={activeProject}
                  isAdmin={isBoardAdmin}
                  tasks={tasks.filter(t => t.projet === activeProject.nom)}
                  updateProject={(pid, changes) => {
                    updateRecord('projects', 'projects', pid, changes);
                    setActiveProject(prev => ({ ...prev, ...changes })); // Synchronize local state
                  }}
                  updateTask={(tid, changes) => applyRules(tid, changes)}
                  addTask={(taskData) => addRecord('projects', 'tasks', taskData)}
                  onCardClick={(task, colId) => setActiveCard(task)}
                />
              )}
              {activeView === 'calendar' && (
                <TrelloCalendar 
                  project={activeProject}
                  tasks={tasks.filter(t => t.projet === activeProject.nom)}
                  onCardClick={(task) => setActiveCard(task)}
                />
              )}
              {activeView === 'dashboard' && (
                <TrelloDashboard 
                  project={activeProject}
                  tasks={tasks.filter(t => t.projet === activeProject.nom)}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <RecordModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Créer un Tableau de Projet"
        fields={Object.entries(projectSchema.models.projects.fields).filter(([k]) => k !== 'colonnes').map(([name, f]) => ({ ...f, name }))}
        onSave={(formData) => {
          formData.colonnes = [
            { id: 'col_' + Date.now() + '_1', title: 'À faire' },
            { id: 'col_' + Date.now() + '_2', title: 'En cours' },
            { id: 'col_' + Date.now() + '_3', title: 'Terminé' }
          ];
          addRecord('projects', 'projects', formData);
          setIsModalOpen(false);
        }}
      />

      <AnimatePresence>
        {activeCard && (
          <TrelloCardModal 
            task={activeCard}
            project={activeProject}
            projectColumns={activeProject?.colonnes}
            currentUser={currentUser}
            updateTask={(tid, changes) => {
              applyRules(tid, changes);
              setActiveCard(prev => ({ ...prev, ...changes })); 
            }}
            onClose={() => setActiveCard(null)}
          />
        )}
      </AnimatePresence>

      {isButlerOpen && (
        <TrelloButlerModal 
          project={activeProject}
          updateProject={(pid, changes) => {
            updateRecord('projects', 'projects', pid, changes);
            setActiveProject(prev => ({ ...prev, ...changes })); 
          }}
          onClose={() => setIsButlerOpen(false)}
        />
      )}
    </div>
  );
};

export default ProjectHub;
