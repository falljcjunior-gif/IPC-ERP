import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, CheckSquare, Target, Plus, ChevronLeft, LayoutGrid, Kanban, Calendar as CalendarIcon, PieChart, Copy } from 'lucide-react';
import { useStore } from '../store';

import TrelloBoard from '../components/workspace/TrelloBoard';
import TrelloCardModal from '../components/workspace/TrelloCardModal';
import TrelloDashboard from '../components/workspace/TrelloDashboard';
import TrelloCalendar from '../components/workspace/TrelloCalendar';
import TrelloButlerModal from '../components/workspace/TrelloButlerModal';
import RecordModal from '../components/RecordModal';
import { projectSchema } from '../schemas/project.schema';
import SmartButton from '../components/SmartButton';
import AnimatedCounter from '../components/Dashboard/AnimatedCounter';
import '../components/GlobalDashboard.css';

const ProjectHub = ({ onOpenDetail }) => {
  const data = useStore(state => state.data);
  const addRecord = useStore(state => state.addRecord);
  const updateRecord = useStore(state => state.updateRecord);
  const currentUser = useStore(state => state.currentUser);
  const [activeProject, setActiveProject] = useState(null);
  const [activeView, setActiveView] = useState('board'); // 'board', 'calendar', 'dashboard'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isButlerOpen, setIsButlerOpen] = useState(false);
  const [activeCard, setActiveCard] = useState(null);

  const projects = data?.projects?.projects || [];
  const tasks = data?.projects?.tasks || [];

  const isBoardAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.nom === activeProject?.chefProjet;

  const handleCloneProject = async (p) => {
    const newTemplate = {
      nom: p.nom + ' (Copie Modèle)',
      client: p.client,
      budget: p.budget,
      chefProjet: currentUser?.nom || p.chefProjet,
      colonnes: p.colonnes || [],
      rules: p.rules || [],
      customFields: p.customFields || []
    };
    return addRecord('projects', 'projects', newTemplate);
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
        if (rule.effect.type === 'mark_done') { 
          if (taskBefore?.checklists) {
            mergedChanges.checklists = taskBefore.checklists.map(cl => ({...cl, items: cl.items?.map(i => ({...i, done: true})) }));
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
        if (rule.effect.type === 'notify_manager') {
          mergedChanges._notifyManagerRequested = true;
          actionLogs.push({ id: Date.now().toString() + Math.random(), type: 'activity', text: 'Butler : A alerté le manager par push', author: '🤖 Butler', date: new Date().toISOString() });
        }
      }

    });

    if (actionLogs.length > 0) {
      mergedChanges.commentaires = [...(taskBefore?.commentaires||[]), ...(changes.commentaires||[]), ...actionLogs];
    }
    updateRecord('projects', 'tasks', taskId, mergedChanges);
  };

  return (
    <div className="luxury-dashboard-container" style={{ padding: '3rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── HEADER ── */}
      <div className="luxury-header" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div className="luxury-subtitle">Project Workspace</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {activeProject && (
              <button 
                onClick={() => setActiveProject(null)} 
                title="Retour aux tableaux"
                style={{ background: 'white', border: '1px solid #e2e8f0', padding: '0.6rem', borderRadius: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
              >
                 <ChevronLeft size={20} color="#111827" />
              </button>
            )}
            <h1 className="luxury-title" style={{ margin: 0 }}>
              {activeProject ? activeProject.nom : <span>Portefeuille <strong>Projets</strong></span>}
            </h1>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-end' }}>
          {!activeProject ? (
            <>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Projets Actifs</div>
                <div className="luxury-value-massive" style={{ fontSize: '3rem', color: '#8B5CF6' }}>
                  <AnimatedCounter from={0} to={projects.length} duration={1.5} formatter={(v) => `${v}`} />
                </div>
              </div>
              <SmartButton 
                onClick={() => setIsModalOpen(true)} 
                variant="primary"
                icon={Plus}
                style={{ padding: '1rem 2rem', borderRadius: '1.5rem', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)' }}
              >
                Nouveau Chantier
              </SmartButton>
            </>
          ) : (
            isBoardAdmin && (
              <SmartButton 
                onClick={() => setIsButlerOpen(true)} 
                variant="secondary"
                icon={Target}
                style={{ borderRadius: '1rem', background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}
              >
                Automatisation Butler
              </SmartButton>
            )
          )}
        </div>
      </div>

      {/* ── VIEWS CONTROLS (FROSTED GLASS) ── */}
      {activeProject && (
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.5)', padding: '0.5rem', borderRadius: '1.5rem', backdropFilter: 'blur(10px)', marginBottom: '2rem', width: 'fit-content' }}>
          <button 
            onClick={() => setActiveView('board')} 
            style={{ 
              padding: '0.8rem 2rem', borderRadius: '1rem', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s',
              background: activeView === 'board' ? 'white' : 'transparent',
              color: activeView === 'board' ? '#8B5CF6' : '#64748B',
              boxShadow: activeView === 'board' ? '0 10px 20px -10px rgba(139,92,246,0.15)' : 'none',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            <Kanban size={16} /> Tableau
          </button>
          <button 
            onClick={() => setActiveView('calendar')} 
            style={{ 
              padding: '0.8rem 2rem', borderRadius: '1rem', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s',
              background: activeView === 'calendar' ? 'white' : 'transparent',
              color: activeView === 'calendar' ? '#8B5CF6' : '#64748B',
              boxShadow: activeView === 'calendar' ? '0 10px 20px -10px rgba(139,92,246,0.15)' : 'none',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            <CalendarIcon size={16} /> Planning
          </button>
          <button 
            onClick={() => setActiveView('dashboard')} 
            style={{ 
              padding: '0.8rem 2rem', borderRadius: '1rem', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s',
              background: activeView === 'dashboard' ? 'white' : 'transparent',
              color: activeView === 'dashboard' ? '#8B5CF6' : '#64748B',
              boxShadow: activeView === 'dashboard' ? '0 10px 20px -10px rgba(139,92,246,0.15)' : 'none',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            <PieChart size={16} /> Analyses
          </button>
        </div>
      )}

      {/* ── CONTENT AREA ── */}
      <div style={{ flex: 1, paddingBottom: '2rem' }}>
        <AnimatePresence mode="wait">
          {!activeProject ? (
            // Projects Grid View
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '2rem' }}
            >
               {projects.map(p => {
                 const boardTasks = tasks.filter(t => t.projet === p.nom);
                 const progress = boardTasks.length > 0 && p.colonnes?.length > 0 
                     ? boardTasks.filter(t => t.colonneId === p.colonnes[p.colonnes.length-1].id).length / boardTasks.length 
                     : 0;

                 return (
                 <motion.div
                   key={p.id}
                   whileHover={{ y: -5, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}
                   onClick={() => { setActiveProject(p); setActiveView('board'); }}
                   className="luxury-widget"
                   style={{
                     padding: '2rem', borderRadius: '1.5rem', cursor: 'pointer',
                     display: 'flex', flexDirection: 'column', gap: '1.5rem',
                     background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)',
                     border: '1px solid rgba(255,255,255,0.5)'
                   }}
                 >
                   <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                     <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                       <div style={{ 
                         background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', 
                         width: '48px', height: '48px', borderRadius: '1rem', 
                         display: 'flex', alignItems: 'center', justifyContent: 'center' 
                       }}>
                         <LayoutGrid size={24} />
                       </div>
                        <SmartButton 
                          onClick={(e) => { e.stopPropagation(); return handleCloneProject(p); }} 
                          variant="ghost"
                          icon={Copy}
                          style={{ padding: '0.5rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', background: 'white' }} 
                          title="Copier le modèle"
                        />
                     </div>
                     <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{boardTasks.length} Tâches</span>
                   </div>
                   
                   <div>
                     <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800, color: '#111827' }}>{p.nom}</h3>
                      <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>{p.client}</p>
                      
                      {/* 🤖 BUTLER AUTO-TAGS */}
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {p.tags?.map(tag => (
                          <span key={tag} style={{ 
                            fontSize: '0.65rem', fontWeight: 800, padding: '0.25rem 0.6rem', 
                            borderRadius: '2rem', background: tag === 'Stratégique' ? '#8B5CF6' : '#64748B', 
                            color: 'white', textTransform: 'uppercase' 
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>

                   </div>
                   
                   <div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', color: '#64748b', textTransform: 'uppercase' }}>
                       <span>Avancement Global</span>
                       <span style={{ color: '#8B5CF6' }}>{Math.round(progress * 100)}%</span>
                     </div>
                     <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                       <div style={{ height: '100%', width: `${progress * 100}%`, background: '#8B5CF6', borderRadius: '4px' }} />
                     </div>
                   </div>
                 </motion.div>
               )})}

               <motion.div
                 whileHover={{ y: -5, background: 'rgba(255,255,255,0.9)' }}
                 onClick={() => setIsModalOpen(true)}
                 style={{
                   padding: '2rem', borderRadius: '1.5rem', cursor: 'pointer',
                   display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem',
                   border: '2px dashed #cbd5e1', background: 'rgba(255,255,255,0.4)',
                   color: '#64748b', transition: 'all 0.3s'
                 }}
               >
                 <Plus size={40} color="#94a3b8" />
                 <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#475569' }}>Créer un espace</span>
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
                    setActiveProject(prev => ({ ...prev, ...changes })); 
                  }}
                  updateTask={(tid, changes) => applyRules(tid, changes)}
                  addTask={(taskData) => addRecord('projects', 'tasks', taskData)}
                  onCardClick={(task) => setActiveCard(task)}
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
            { id: 'col_' + Date.now() + '_1', title: 'Planifié / En Étude' },
            { id: 'col_' + Date.now() + '_2', title: 'En Exécution' },
            { id: 'col_' + Date.now() + '_3', title: 'Livré / Réceptionné' }
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

export default React.memo(ProjectHub);
