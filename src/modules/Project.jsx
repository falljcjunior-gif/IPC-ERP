import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, CheckSquare, Plus, Calendar, Users, 
  Clock, ChevronRight, MoreVertical, Target, BarChart2,
  ListFilter, LayoutGrid, GanttChart as GanttIcon
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import EnterpriseView from '../components/EnterpriseView';
import KanbanBoard from '../components/KanbanBoard';
import GanttChart from '../components/GanttChart';
import KpiCard from '../components/KpiCard';
import { projectSchema } from '../schemas/project.schema.js';

/* ─── Helpers ─── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } }
};

/* ════════════════════════════════════
   PROJECT MODULE — Full Enterprise
   Now powered by IPC Platform Engine
   ════════════════════════════════════ */
const Project = ({ onOpenDetail }) => {
  const { data, updateRecord } = useBusiness();
  const [view, setView] = useState('dashboard'); // 'dashboard', 'projects', 'tasks', 'kanban', 'gantt'
  const { projects = [], tasks = [] } = data.projects || {};

  const handleMoveTask = (item, nextCol) => {
    updateRecord('projects', 'tasks', item.id, { statut: nextCol });
  };

  /* ─── Dashboard Renderer ─── */
  const renderDashboard = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <KpiCard title="Projets Actifs" value={`${projects.length} Projets`} icon={<Briefcase size={20}/>} color="#3B82F6" />
        <KpiCard title="Tâches Complétées" value={`${tasks.filter(t => t.statut === 'Terminé').length} / ${tasks.length}`} icon={<CheckSquare size={20}/>} color="#10B981" />
        <KpiCard title="Deadline Proche" value="3 Tâches" icon={<Clock size={20}/>} color="#EF4444" />
      </div>

      <div className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
         <div style={{ background: 'var(--accent)10', padding: '1.5rem', borderRadius: '1rem', color: 'var(--accent)' }}>
            <Target size={32} />
         </div>
         <div>
            <h3 style={{ fontWeight: 800 }}>Moteur de Pilotage par Objectifs</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '500px' }}>Le pôle Projet IPC synchronise vos ressources RH avec vos jalons clients. Utilisez la vue Gantt pour une planification temporelle précise.</p>
         </div>
      </div>
    </motion.div>
  );

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
       {/* Module Header Toolbar */}
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-subtle)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)' }}>
             {[
               { id: 'dashboard', label: 'Dashboard', icon: <BarChart2 size={16} /> },
               { id: 'projects', label: 'Projets', icon: <Briefcase size={16} /> },
               { id: 'tasks', label: 'Tâches (Liste)', icon: <ListFilter size={16} /> },
               { id: 'kanban', label: 'Kanban', icon: <LayoutGrid size={16} /> },
               { id: 'gantt', label: 'Gantt', icon: <GanttIcon size={16} /> }
             ].map(t => (
               <button
                 key={t.id}
                 onClick={() => setView(t.id)}
                 style={{
                   padding: '6px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                   background: view === t.id ? 'var(--bg)' : 'transparent',
                   color: view === t.id ? 'var(--accent)' : 'var(--text-muted)',
                   fontWeight: 700, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px',
                   boxShadow: view === t.id ? 'var(--shadow-sm)' : 'none'
                 }}
               >
                 {t.icon} {t.label}
               </button>
             ))}
          </div>
       </div>

       <AnimatePresence mode="wait">
          {view === 'dashboard' ? (
             <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {renderDashboard()}
             </motion.div>
          ) : view === 'kanban' ? (
             <motion.div key="kanban" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <KanbanBoard 
                  columns={['À faire', 'En cours', 'Terminé']}
                  items={tasks}
                  columnMapping="statut"
                  onMove={handleMoveTask}
                  onItemClick={(item) => onOpenDetail(item, 'projects', 'tasks')}
                />
             </motion.div>
          ) : view === 'gantt' ? (
             <motion.div key="gantt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <GanttChart tasks={tasks} />
             </motion.div>
          ) : (
             <motion.div key="records" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <EnterpriseView 
                  moduleId="projects" 
                  modelId={view}
                  schema={projectSchema}
                  onOpenDetail={onOpenDetail}
                />
             </motion.div>
          )}
       </AnimatePresence>
    </div>
  );
};

export default Project;
