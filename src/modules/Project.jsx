import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  CheckSquare, 
  Plus, 
  Calendar, 
  Users, 
  Clock, 
  ChevronRight, 
  MoreVertical,
  Target
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import RecordModal from '../components/RecordModal';

import KanbanBoard from '../components/KanbanBoard';
import GanttChart from '../components/GanttChart';

const Project = ({ onOpenDetail }) => {
  const { data, addRecord, updateRecord } = useBusiness();
  const [view, setView] = useState('kanban'); // 'projects', 'tasks', 'kanban', 'gantt'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teamFilter, setTeamFilter] = useState('Toutes');
  const { projects, tasks } = data.projects;

  const taskStages = ['À faire', 'En cours', 'Terminé'];

  const teamColors = {
    'IT': '#3B82F6',
    'Ventes': '#10B981',
    'RH': '#8B5CF6',
    'Finance': '#F59E0B',
    'Production': '#F97316',
    'Marketing': '#EC4899',
    'Toutes': 'var(--text-muted)'
  };

  const handleSave = (formData) => {
    const subModule = (view === 'projects') ? 'projects' : 'tasks';
    if (view === 'tasks' || view === 'kanban') {
       formData.statut = formData.statut || 'À faire';
       formData.checklists = []; // Initialize empty checklist
       formData.progression = 0;
    }
    addRecord('projects', subModule, formData);
  };

  const handleMoveTask = (item, nextCol) => {
    updateRecord('projects', 'tasks', item.id, { statut: nextCol });
  };

  const modalFields = view === 'projects' ? [
    { name: 'nom', label: 'Nom du Projet', required: true, placeholder: 'Ex: Refonte Site Web' },
    { name: 'client', label: 'Client', required: true },
    { name: 'dateDebut', label: 'Date de Début', type: 'date', required: true },
    { name: 'echeance', label: 'Échéance', type: 'date', required: true },
    { name: 'budget', label: 'Budget (€)', type: 'number', required: true },
    { name: 'chefProjet', label: 'Chef de Projet', required: true },
  ] : [
    { name: 'titre', label: 'Nom de la Tâche', required: true },
    { name: 'projet', label: 'Projet Associé', type: 'select', options: projects.map(p => p.nom), required: true },
    { name: 'equipe', label: 'Équipe (Département)', type: 'select', options: Object.keys(teamColors).filter(t => t !== 'Toutes'), required: true },
    { name: 'assigne', label: 'Assigné à', type: 'select', options: data.hr.employees.map(e => e.nom), required: true },
    { name: 'echeance', label: 'Échéance', type: 'date', required: true },
    { name: 'priorite', label: 'Priorité', type: 'select', options: ['Basse', 'Moyenne', 'Haute'], required: true },
    { name: 'statut', label: 'Statut', type: 'select', options: ['À faire', 'En cours', 'Terminé'], required: true },
  ];

  const filteredTasks = tasks.filter(t => teamFilter === 'Toutes' || t.equipe === teamFilter);

  const renderProjects = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
      {projects.map((p) => (
        <motion.div
           key={p.id}
           whileHover={{ y: -5 }}
           onClick={() => onOpenDetail(p, 'projects', 'projects')}
           className="glass"
           style={{ padding: '2rem', borderRadius: '1.5rem', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>Active Project</span>
            <MoreVertical size={16} color="var(--text-muted)" />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{p.nom}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
             <Target size={14} /> {p.client}
          </div>
          
          <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
             <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Budget</div>
                <div style={{ fontWeight: 700 }}>{p.budget.toLocaleString()} €</div>
             </div>
             <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Chef de projet</div>
                <div style={{ fontWeight: 700 }}>{p.chefProjet}</div>
             </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                <Calendar size={14} /> Fin : {p.echeance}
             </div>
             <ChevronRight size={18} color="var(--accent)" />
          </div>
        </motion.div>
      ))}
      <motion.div
        whileHover={{ scale: 1.02 }}
        onClick={() => setIsModalOpen(true)}
        className="glass"
        style={{ padding: '2rem', borderRadius: '1.5rem', border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', cursor: 'pointer', color: 'var(--text-muted)' }}
      >
        <Plus size={32} />
        <span>Créer un Nouveau Projet</span>
      </motion.div>
    </div>
  );

  const renderTasks = () => (
    <div className="glass" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          <tr>
            <th style={{ padding: '1.25rem' }}>Tâche</th>
            <th style={{ padding: '1.25rem' }}>Projet</th>
            <th style={{ padding: '1.25rem' }}>Équipe</th>
            <th style={{ padding: '1.25rem' }}>Assigné à</th>
            <th style={{ padding: '1.25rem' }}>Progression</th>
            <th style={{ padding: '1.25rem' }}>Priorité</th>
            <th style={{ padding: '1.25rem' }}>Statut</th>
            <th style={{ padding: '1.25rem' }}></th>
          </tr>
        </thead>
        <tbody>
          {filteredTasks.map((t) => {
            const completedCount = t.checklists?.filter(c => c.completed).length || 0;
            const totalCount = t.checklists?.length || 0;
            const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : (t.progression || 0);

            return (
              <tr key={t.id} onClick={() => onOpenDetail(t, 'projects', 'tasks')} style={{ borderTop: '1px solid var(--border)', cursor: 'pointer' }}>
                <td style={{ padding: '1.25rem', fontWeight: 600 }}>{t.titre}</td>
                <td style={{ padding: '1.25rem' }}>{t.projet}</td>
                <td style={{ padding: '1.25rem' }}>
                   <span style={{ fontSize: '0.75rem', fontWeight: 700, color: teamColors[t.equipe] || 'var(--text)' }}>
                      {t.equipe || '-'}
                   </span>
                </td>
                <td style={{ padding: '1.25rem' }}>{t.assigne}</td>
                <td style={{ padding: '1.25rem' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '60px', height: '6px', background: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                         <div style={{ width: `${progress}%`, height: '100%', background: progress === 100 ? '#10B981' : 'var(--accent)' }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{Math.round(progress)}%</span>
                   </div>
                </td>
                <td style={{ padding: '1.25rem' }}>
                  <span style={{ 
                    color: t.priorite === 'Haute' ? '#EF4444' : t.priorite === 'Moyenne' ? '#F59E0B' : '#3B82F6',
                    fontWeight: 600,
                    fontSize: '0.8rem'
                  }}>
                    {t.priorite}
                  </span>
                </td>
                <td style={{ padding: '1.25rem' }}>
                   <span style={{ 
                    padding: '0.2rem 0.6rem', 
                    borderRadius: '0.5rem', 
                    background: t.statut === 'Terminé' ? '#10B98115' : '#3B82F615', 
                    color: t.statut === 'Terminé' ? '#10B981' : '#3B82F6',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    {t.statut}
                  </span>
                </td>
                <td style={{ padding: '1.25rem' }}><ChevronRight size={16} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderKanban = () => (
    <KanbanBoard 
      columns={taskStages}
      items={filteredTasks}
      columnMapping="statut"
      onMove={handleMoveTask}
      onItemClick={(item) => onOpenDetail(item, 'projects', 'tasks')}
      onAddClick={() => setIsModalOpen(true)}
      renderCardContent={(item) => {
        const completedCount = item.checklists?.filter(c => c.completed).length || 0;
        const totalCount = item.checklists?.length || 0;
        const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : (item.progression || 0);

        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', flex: 1, paddingRight: '0.5rem' }}>{item.titre}</div>
              <div style={{ 
                padding: '2px 6px', 
                borderRadius: '4px', 
                fontSize: '0.65rem', 
                fontWeight: 800, 
                color: 'white', 
                background: teamColors[item.equipe] || 'var(--accent)' 
              }}>
                {item.equipe || 'Général'}
              </div>
            </div>
            
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{item.projet}</div>
            
            {/* Progress Bar */}
            {totalCount > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Avancement</span>
                    <span>{completedCount}/{totalCount} ({Math.round(progress)}%)</span>
                 </div>
                 <div style={{ height: '4px', background: 'var(--bg-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      style={{ height: '100%', background: progress === 100 ? '#10B981' : 'var(--accent)' }}
                    />
                 </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Users size={12} /> {item.assigne}
              </div>
              <span style={{ 
                 fontSize: '0.65rem', 
                 padding: '2px 6px', 
                 borderRadius: '4px', 
                 background: item.priorite === 'Haute' ? '#EF444415' : '#64748B15',
                 color: item.priorite === 'Haute' ? '#EF4444' : '#64748B',
                 fontWeight: 700 
              }}>
                {item.priorite}
              </span>
            </div>
          </div>
        );
      }}
    />
  );

  return (
    <div style={{ padding: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Gestion de Projets</h1>
          <p style={{ color: 'var(--text-muted)' }}>Coordonnez vos équipes et optimisez vos délais.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* Team Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginRight: '1rem', padding: '0.5rem 1rem', background: 'var(--bg-subtle)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
             <Users size={16} color="var(--text-muted)" />
             <select 
               value={teamFilter}
               onChange={(e) => setTeamFilter(e.target.value)}
               style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
             >
               {Object.keys(teamColors).map(t => (
                 <option key={t} value={t}>{t === 'Toutes' ? 'Toutes les équipes' : t}</option>
               ))}
             </select>
          </div>

          <div style={{ display: 'flex', background: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: '0.8rem', border: '1px solid var(--border)' }}>
            <button onClick={() => setView('projects')} style={{ padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', background: view === 'projects' ? 'var(--bg)' : 'transparent', color: view === 'projects' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>Projets</button>
            <button onClick={() => setView('kanban')} style={{ padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', background: view === 'kanban' ? 'var(--bg)' : 'transparent', color: view === 'kanban' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>Kanban</button>
            <button onClick={() => setView('gantt')} style={{ padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', background: view === 'gantt' ? 'var(--bg)' : 'transparent', color: view === 'gantt' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>Gantt</button>
            <button onClick={() => setView('tasks')} style={{ padding: '0.5rem 1rem', borderRadius: '0.6rem', border: 'none', background: view === 'tasks' ? 'var(--bg)' : 'transparent', color: view === 'tasks' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>Liste</button>
          </div>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Nouveau
          </button>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: '2.5rem' }}>
         <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ background: '#3B82F615', color: '#3B82F6', padding: '0.75rem', borderRadius: '1rem' }}><Briefcase /></div>
            <div>
               <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Projets en Cours</div>
               <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{projects.length} Actifs</div>
            </div>
         </div>
         <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ background: '#10B98115', color: '#10B981', padding: '0.75rem', borderRadius: '1rem' }}><CheckSquare /></div>
            <div>
               <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tâches Terminées</div>
               <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{tasks.filter(t => t.statut === 'Terminé').length} / {tasks.length}</div>
            </div>
         </div>
      </div>

      {view === 'projects' && renderProjects()}
      {view === 'tasks' && renderTasks()}
      {view === 'kanban' && renderKanban()}
      {view === 'gantt' && <GanttChart tasks={tasks || []} />}

      <RecordModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        title="Nouvel Elément Projet"
        fields={modalFields}
      />
    </div>
  );
};

export default Project;
