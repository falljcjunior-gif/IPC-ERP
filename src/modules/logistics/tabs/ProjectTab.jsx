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
    <motion.div variants={container} initial="hidden" animate="show" 
      style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}
    >
      {/* KPI Row */}
      <motion.div variants={item} className="nexus-card" style={{ gridColumn: 'span 3', padding: '1.5rem', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '10px', color: 'var(--nexus-primary)' }}><Briefcase size={20} /></div>
          <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--nexus-primary)' }}>ACTIF</div>
        </div>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Projets Actifs</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>{projects.length}</div>
      </motion.div>

      <motion.div variants={item} className="nexus-card" style={{ gridColumn: 'span 3', padding: '1.5rem', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '8px', borderRadius: '10px', color: '#F59E0B' }}><Zap size={20} /></div>
          <div style={{ fontSize: '0.65rem', fontWeight: 900, color: '#F59E0B' }}>SPEED</div>
        </div>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Burn-Rate</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>Nexus High</div>
      </motion.div>

      <motion.div variants={item} className="nexus-card" style={{ gridColumn: 'span 3', padding: '1.5rem', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '10px', color: 'var(--nexus-primary)' }}><ShieldCheck size={20} /></div>
          <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--nexus-primary)' }}>QUALITY</div>
        </div>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Livrables OTIF</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>96.4%</div>
      </motion.div>

      <motion.div variants={item} className="nexus-card" style={{ gridColumn: 'span 3', padding: '1.5rem', background: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.05)', padding: '8px', borderRadius: '10px', color: 'var(--nexus-secondary)' }}><Flag size={20} /></div>
          <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>STABLE</div>
        </div>
        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Risque Dérive</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--nexus-secondary)' }}>Basse</div>
      </motion.div>

      {/* Toolbar & View Switcher */}
      <div style={{ gridColumn: 'span 12', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
         <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div className="nexus-card" style={{ display: 'flex', padding: '0.4rem', borderRadius: '1.25rem', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)' }}>
              {[
                { id: 'kanban', label: 'Espace Kanban', icon: <LayoutGrid size={14} /> },
                { id: 'gantt', label: 'Vue Gantt', icon: <GanttIcon size={14} /> },
                { id: 'list', label: 'Tâches (Liste)', icon: <ListFilter size={14} /> },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setViewMode(t.id)}
                  style={{
                    padding: '0.7rem 1.75rem', borderRadius: '1rem', border: 'none', cursor: 'pointer',
                    background: viewMode === t.id ? 'var(--nexus-secondary)' : 'transparent',
                    color: viewMode === t.id ? 'white' : 'var(--nexus-text-muted)',
                    fontWeight: 900, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.8rem',
                    transition: '0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: viewMode === t.id ? '0 10px 20px -5px rgba(15, 23, 42, 0.2)' : 'none'
                  }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
         </div>

         <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="nexus-card" style={{ background: 'white', padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer' }}>
              <Activity size={18} /> Rapports
            </button>
            <button 
               onClick={() => onOpenDetail && onOpenDetail(null, 'projects', 'tasks')}
               className="nexus-card" style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900, background: 'var(--nexus-primary)', color: 'white', border: 'none', cursor: 'pointer' }}>
               <Plus size={18} strokeWidth={3} /> Nouvelle Tâche
            </button>
         </div>
      </div>

      {/* Execution Content Focus */}
      <div style={{ gridColumn: 'span 12', minHeight: '600px' }}>
         {viewMode === 'kanban' ? (
           <KanbanBoard 
              columns={['À faire', 'En cours', 'Terminé']}
              items={tasks}
              columnMapping="statut"
              onMove={handleMoveTask}
              onItemClick={(item) => onOpenDetail(item.id, 'projects', 'tasks')}
              renderCardContent={(t) => (
                <div style={{ position: 'relative' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div style={{ padding: '4px 10px', borderRadius: '8px', background: 'var(--nexus-bg)', color: 'var(--nexus-primary)', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', border: '1px solid var(--nexus-border)' }}>
                         {t.projet || 'GÉNÉRAL'}
                      </div>
                      <MoreHorizontal size={16} color="var(--nexus-text-muted)" />
                   </div>
                   <div style={{ fontWeight: 900, fontSize: '1rem', marginBottom: '1.25rem', color: 'var(--nexus-secondary)', lineHeight: 1.4 }}>{t.titre}</div>
                   
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--nexus-bg)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                         <div className="nexus-glow" style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--nexus-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900 }}>
                            {t.assigne?.charAt(0)}
                         </div>
                         <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--nexus-text-muted)' }}>{t.assigne}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 900, color: t.priorite === 'Haute' ? '#EF4444' : 'var(--nexus-text-muted)' }}>
                         {t.priorite}
                      </div>
                   </div>
                </div>
              )}
           />
         ) : viewMode === 'gantt' ? (
           <div className="nexus-card" style={{ padding: '2rem', background: 'white', overflow: 'hidden' }}>
             <GanttChart tasks={tasks} />
           </div>
         ) : (
           <motion.div variants={item} className="nexus-card" style={{ background: 'white', padding: '1rem' }}>
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
