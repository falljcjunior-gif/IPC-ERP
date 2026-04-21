import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, CheckSquare, Target, Plus, ChevronLeft, LayoutGrid } from 'lucide-react';
import { useBusiness } from '../BusinessContext';

import TrelloBoard from '../components/workspace/TrelloBoard';
import TrelloCardModal from '../components/workspace/TrelloCardModal';
import RecordModal from '../components/RecordModal';
import { projectSchema } from '../schemas/project.schema';

const ProjectHub = ({ onOpenDetail }) => {
  const { data, addRecord, updateRecord, currentUser } = useBusiness();
  const [activeProject, setActiveProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCard, setActiveCard] = useState(null);

  const projects = data?.projects?.projects || [];
  const tasks = data?.projects?.tasks || [];

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
                   onClick={() => setActiveProject(p)}
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
                     <div style={{ 
                       background: 'var(--accent)20', color: 'var(--accent)', 
                       width: '40px', height: '40px', borderRadius: '10px', 
                       display: 'flex', alignItems: 'center', justifyContent: 'center' 
                     }}>
                       <LayoutGrid size={20} />
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
                       <div style={{ height: '100%', width: \`\${progress * 100}%\`, background: 'var(--accent)' }} />
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
            // Active Trello Board
            <motion.div
              key="board"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              style={{ height: '100%' }}
            >
              <TrelloBoard 
                project={activeProject}
                tasks={tasks.filter(t => t.projet === activeProject.nom)}
                updateProject={(pid, changes) => {
                  updateRecord('projects', 'projects', pid, changes);
                  setActiveProject(prev => ({ ...prev, ...changes })); // Synchronize local state
                }}
                updateTask={(tid, changes) => updateRecord('projects', 'tasks', tid, changes)}
                addTask={(taskData) => addRecord('projects', 'tasks', taskData)}
                onCardClick={(task, colId) => setActiveCard(task)}
              />
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
            projectColumns={activeProject?.colonnes}
            currentUser={currentUser}
            updateTask={(tid, changes) => {
              updateRecord('projects', 'tasks', tid, changes);
              setActiveCard(prev => ({ ...prev, ...changes })); 
            }}
            onClose={() => setActiveCard(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectHub;
