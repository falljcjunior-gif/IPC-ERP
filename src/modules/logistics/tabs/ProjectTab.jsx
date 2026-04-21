import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, CheckSquare, Plus, Calendar, Users, 
  Clock, ChevronRight, MoreVertical, Target, BarChart2,
  ListFilter, LayoutGrid, GanttChart as GanttIcon,
  Zap, ShieldCheck, Flag, MoreHorizontal, Activity
} from 'lucide-react';
import KanbanBoard from '../../../components/KanbanBoard';
import GanttChart from '../../../components/GanttChart';
import KpiCard from '../../../components/KpiCard';
import EnterpriseView from '../../../components/EnterpriseView';
import { projectSchema } from '../../../schemas/project.schema';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

const ProjectTab = ({ data, onOpenDetail, updateRecord }) => {
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban', 'gantt', 'list'
  const { projects = [], tasks = [] } = data?.projects || {};

  const handleMoveTask = (item, nextCol) => {
    if (updateRecord) updateRecord('projects', 'tasks', item.id, { statut: nextCol });
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Project Execution KPIs */}
      <motion.div variants={item} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '1.5rem' }}>
        <KpiCard title="Projets Actifs" value={projects.length} icon={<Briefcase size={22} />} color="#4F46E5" />
        <KpiCard title="Burn-Rate (Tâches)" value="0%" icon={<Zap size={22} />} color="#F59E0B" />
        <KpiCard title="OTIF Livraison" value="0%" icon={<ShieldCheck size={22} />} color="#0D9488" />
        <KpiCard title="Risque Dérive" value="Basse" icon={<Flag size={22} />} color="#6366F1" />
      </motion.div>

      {/* Toolbar & View Switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div className="glass" style={{ display: 'flex', padding: '0.4rem', borderRadius: '1.25rem', background: 'var(--bg-subtle)' }}>
              {[
                { id: 'kanban', label: 'Espace Kanban', icon: <LayoutGrid size={14} /> },
                { id: 'gantt', label: 'Vue Gantt', icon: <GanttIcon size={14} /> },
                { id: 'list', label: 'Tâches (Liste)', icon: <ListFilter size={14} /> },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setViewMode(t.id)}
                  style={{
                    padding: '0.6rem 1.75rem', borderRadius: '1rem', border: 'none', cursor: 'pointer',
                    background: viewMode === t.id ? 'var(--bg)' : 'transparent',
                    color: viewMode === t.id ? '#4F46E5' : 'var(--text-muted)',
                    fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.8rem',
                    boxShadow: viewMode === t.id ? 'var(--shadow-sm)' : 'none', transition: '0.2s'
                  }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
         </div>

         <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="glass" style={{ padding: '0.7rem 1.25rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '0.85rem' }}>
              <Activity size={18} /> Rapports
            </button>
            <button 
               onClick={() => onOpenDetail && onOpenDetail(null, 'projects', 'tasks')}
               className="btn-primary" style={{ padding: '0.7rem 1.75rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900, background: '#4F46E5', borderColor: '#4F46E5' }}>
               <Plus size={20} /> Nouvelle Tâche
            </button>
         </div>
      </div>

      {/* Execution Content Focus */}
      <div style={{ minHeight: '600px' }}>
         {viewMode === 'kanban' ? (
           <KanbanBoard 
              columns={['À faire', 'En cours', 'Terminé']}
              items={tasks}
              columnMapping="statut"
              onMove={handleMoveTask}
              onItemClick={(item) => onOpenDetail(item, 'projects', 'tasks')}
              renderCardContent={(t) => (
                <div style={{ position: 'relative' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ padding: '4px 8px', borderRadius: '6px', background: '#4F46E510', color: '#4F46E5', fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase' }}>
                         {t.projet}
                      </div>
                      <MoreHorizontal size={14} color="var(--text-muted)" />
                   </div>
                   <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--text)', lineHeight: 1.4 }}>{t.titre}</div>
                   
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                         <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-subtle)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem' }}>
                            {t.assigne?.charAt(0)}
                         </div>
                         <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>{t.assigne}</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: t.priorite === 'Haute' ? '#F43F5E' : 'var(--text-muted)' }}>
                         {t.priorite}
                      </div>
                   </div>
                </div>
              )}
           />
         ) : viewMode === 'gantt' ? (
           <div className="glass" style={{ padding: '1rem', borderRadius: '2rem', border: '1px solid var(--border)', overflow: 'hidden' }}>
             <GanttChart tasks={tasks} />
           </div>
         ) : (
           <motion.div variants={item}>
              <EnterpriseView 
                 moduleId="projects" 
                 modelId="tasks"
                 schema={projectSchema}
                 onOpenDetail={onOpenDetail}
              />
           </motion.div>
         )}
      </div>
    </motion.div>
  );
};

export default ProjectTab;
