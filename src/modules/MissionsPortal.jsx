import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, CheckCircle2, Clock, AlertCircle, 
  Filter, Search, Calendar, Layout, List,
  Zap, Users, ArrowRight, ShieldCheck,
  Briefcase, LifeBuoy, FileText, ChevronRight
} from 'lucide-react';
import { useStore } from '../store';
import SmartButton from '../components/SmartButton';
import KanbanBoard from '../components/KanbanBoard';
import '../components/GlobalDashboard.css';

const MissionsPortal = ({ onOpenDetail }) => {
  const data = useStore(state => state.data);
  const updateRecord = useStore(state => state.updateRecord);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban', 'list', 'timeline', 'workload'
  const [filterType, setFilterType] = useState('all');

  // ── DATA AGGREGATION ──
  const allMissions = useMemo(() => {
    const list = [];

    // 1. Project Tasks
    const projectTasks = (data.projects?.tasks || []).map(t => ({
      ...t,
      missionType: 'project',
      source: t.projet,
      assignee: t.assigne,
      date: t.echeance || t.dateDebut,
      icon: <Briefcase size={14} />,
      color: '#8B5CF6'
    }));
    list.push(...projectTasks);

    // 2. Helpdesk Tickets
    const tickets = (data.helpdesk?.tickets || []).map(t => ({
      ...t,
      missionType: 'support',
      source: 'Support Client',
      assignee: t.assigne || t.createur,
      date: t.echeance || t.dateCreation,
      icon: <LifeBuoy size={14} />,
      color: '#0D9488'
    }));
    list.push(...tickets);

    // 3. HR Approvals (Leaves)
    const leaves = (data.hr?.leaves || []).filter(l => l.statut === 'En attente').map(l => ({
      ...l,
      id: l.id || `leave-${Math.random()}`,
      titre: `Demande de Congés: ${l.collaborateur}`,
      missionType: 'hr',
      source: 'Ressources Humaines',
      assignee: l.collaborateur,
      date: l.du || l.date_debut,
      priorite: 'Haute',
      icon: <FileText size={14} />,
      color: '#F59E0B'
    }));
    list.push(...leaves);

    return list;
  }, [data]);

  const missions = useMemo(() => {
    return allMissions.filter(m => filterType === 'all' || m.missionType === filterType);
  }, [allMissions, filterType]);

  // ── STATS FOR WORKLOAD ──
  const workloadData = useMemo(() => {
    const stats = {};
    allMissions.forEach(m => {
      const user = m.assignee || 'Non assigné';
      stats[user] = (stats[user] || 0) + 1;
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [allMissions]);

  // ── TIMELINE GROUPING ──
  const timelineMissions = useMemo(() => {
    const grouped = {};
    missions.filter(m => m.date).forEach(m => {
      const day = m.date;
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(m);
    });
    return Object.entries(grouped).sort((a, b) => new Date(a[0]) - new Date(b[0]));
  }, [missions]);

  const stages = ['À faire', 'En cours', 'Terminé'];

  const handleMoveMission = async (item, nextCol) => {
    if (item.missionType === 'project') {
      const colId = nextCol === 'À faire' ? 'col1' : nextCol === 'En cours' ? 'col2' : 'col3';
      return updateRecord('projects', 'tasks', item.id, { colonneId: colId });
    } else if (item.missionType === 'support') {
      const statusMap = { 'À faire': 'Nouveau', 'En cours': 'En cours', 'Terminé': 'Résolu' };
      return updateRecord('helpdesk', 'tickets', item.id, { statut: statusMap[nextCol] });
    } else if (item.missionType === 'hr') {
      const statusMap = { 'À faire': 'En attente', 'En cours': 'En cours', 'Terminé': 'Approuvé' };
      return updateRecord('hr', 'leaves', item.id, { statut: statusMap[nextCol] });
    }
  };

  return (
    <div className="luxury-dashboard-container" style={{ padding: '3rem', minHeight: '100vh' }}>
      
      {/* ── HEADER MISSION CONTROL ── */}
      <div className="luxury-header" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="luxury-subtitle">IPC Mission Control Center</div>
          <h1 className="luxury-title">Unified <strong>Operations</strong></h1>
        </div>
        
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <div className="glass" style={{ padding: '1rem 1.5rem', borderRadius: '1.25rem', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#8B5CF6', textTransform: 'uppercase', marginBottom: '4px' }}>Missions Actives</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{allMissions.length}</div>
          </div>
          <div className="glass" style={{ padding: '1rem 1.5rem', borderRadius: '1.25rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10B981', textTransform: 'uppercase', marginBottom: '4px' }}>Alertes Butler</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{allMissions.filter(m => m.priorite === 'Critique').length}</div>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="glass" style={{ display: 'flex', padding: '0.4rem', borderRadius: '1rem' }}>
            {['all', 'project', 'support', 'hr'].map(t => (
              <SmartButton 
                key={t}
                onClick={() => setFilterType(t)}
                variant={filterType === t ? 'primary' : 'ghost'}
                style={{ 
                  padding: '0.6rem 1.25rem', borderRadius: '0.75rem',
                  fontSize: '0.8rem', minWidth: '80px'
                }}
              >
                {t === 'all' ? 'Toutes' : t === 'project' ? 'Projets' : t === 'support' ? 'Tickets' : 'RH'}
              </SmartButton>
            ))}
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
            <input type="text" placeholder="Rechercher une mission..." className="glass" style={{ padding: '0.7rem 1rem 0.7rem 2.5rem', borderRadius: '1rem', border: '1px solid rgba(0,0,0,0.05)', fontSize: '0.9rem', width: '250px' }} />
          </div>
        </div>

        <div className="glass" style={{ display: 'flex', padding: '0.4rem', borderRadius: '1rem' }}>
          <button onClick={() => setViewMode('kanban')} style={{ padding: '0.6rem', borderRadius: '0.75rem', border: 'none', background: viewMode === 'kanban' ? 'white' : 'transparent', cursor: 'pointer', color: viewMode === 'kanban' ? 'var(--accent)' : '#64748b' }}><Layout size={18} /></button>
          <button onClick={() => setViewMode('list')} style={{ padding: '0.6rem', borderRadius: '0.75rem', border: 'none', background: viewMode === 'list' ? 'white' : 'transparent', cursor: 'pointer', color: viewMode === 'list' ? 'var(--accent)' : '#64748b' }}><List size={18} /></button>
          <button onClick={() => setViewMode('timeline')} style={{ padding: '0.6rem', borderRadius: '0.75rem', border: 'none', background: viewMode === 'timeline' ? 'white' : 'transparent', cursor: 'pointer', color: viewMode === 'timeline' ? 'var(--accent)' : '#64748b' }}><Calendar size={18} /></button>
          <button onClick={() => setViewMode('workload')} style={{ padding: '0.6rem', borderRadius: '0.75rem', border: 'none', background: viewMode === 'workload' ? 'white' : 'transparent', cursor: 'pointer', color: viewMode === 'workload' ? 'var(--accent)' : '#64748b' }}><Users size={18} /></button>
        </div>
      </div>

      {/* ── MISSIONS BOARD ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode + filterType}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
        >
          {viewMode === 'kanban' && (
            <KanbanBoard
              columns={stages}
              items={missions}
              onAddClick={() => onOpenDetail && onOpenDetail(null, 'projects', 'tasks')}
              columnMapping={(m) => {
                if (m.missionType === 'project') return m.colonneId === 'col3' ? 'Terminé' : m.colonneId === 'col2' ? 'En cours' : 'À faire';
                if (m.missionType === 'support') return m.statut === 'Résolu' ? 'Terminé' : m.statut === 'En cours' ? 'En cours' : 'À faire';
                return 'À faire';
              }}
              onMove={handleMoveMission}
              renderCardContent={(m) => (
                <div style={{ padding: '0.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.65rem', fontWeight: 900, color: m.color, textTransform: 'uppercase' }}>
                      {m.icon} {m.source}
                    </div>
                    {m.priorite === 'Critique' && (
                      <div style={{ background: '#F43F5E', width: '8px', height: '8px', borderRadius: '50%', boxShadow: '0 0 10px #F43F5E' }} />
                    )}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1f2937', marginBottom: '0.5rem', lineHeight: 1.3 }}>{m.titre}</div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800 }}>
                        {m.assigne?.charAt(0) || m.collaborateur?.charAt(0)}
                      </div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>{m.assigne || m.collaborateur}</span>
                    </div>
                    {m.date && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: '#EF4444', fontWeight: 800 }}>
                        <Clock size={12} /> {m.date}
                      </div>
                    )}
                  </div>
                </div>
              )}
            />
          )}

          {viewMode === 'list' && (
            <div className="glass" style={{ borderRadius: '1.5rem', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'rgba(0,0,0,0.02)', fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b' }}>
                  <tr>
                    <th style={{ padding: '1.25rem', textAlign: 'left' }}>Mission</th>
                    <th style={{ padding: '1.25rem', textAlign: 'left' }}>Source</th>
                    <th style={{ padding: '1.25rem', textAlign: 'left' }}>Assigné</th>
                    <th style={{ padding: '1.25rem', textAlign: 'left' }}>Échéance</th>
                    <th style={{ padding: '1.25rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {missions.map(m => (
                    <tr key={m.id} style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                      <td style={{ padding: '1.25rem' }}>
                        <div style={{ fontWeight: 800 }}>{m.titre}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>{m.num || m.priorite}</div>
                      </td>
                      <td style={{ padding: '1.25rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: m.color }}>{m.source}</span>
                      </td>
                      <td style={{ padding: '1.25rem' }}>{m.assigne || m.collaborateur}</td>
                      <td style={{ padding: '1.25rem', color: '#EF4444', fontWeight: 700 }}>{m.date || '-'}</td>
                      <td style={{ padding: '1.25rem', textAlign: 'right' }}>
                        <SmartButton 
                          onClick={() => onOpenDetail(m, m.missionType === 'project' ? 'projects' : m.missionType === 'support' ? 'helpdesk' : 'hr', m.missionType === 'project' ? 'tasks' : m.missionType === 'support' ? 'tickets' : 'leaves')}
                          variant="ghost"
                          icon={ChevronRight}
                          style={{ padding: '0.5rem', borderRadius: '0.75rem' }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {viewMode === 'timeline' && (
            <div style={{ padding: '1rem' }}>
              {timelineMissions.map(([day, items], idx) => (
                <div key={day} style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', position: 'relative' }}>
                  {/* Vertical Line */}
                  {idx < timelineMissions.length - 1 && (
                    <div style={{ position: 'absolute', left: '11px', top: '24px', bottom: '-24px', width: '2px', background: 'rgba(0,0,0,0.05)' }} />
                  )}
                  
                  <div style={{ flexShrink: 0 }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'white', border: '4px solid var(--accent)', zIndex: 2, position: 'relative' }} />
                    <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--accent)' }}>{new Date(day).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</div>
                    </div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {items.map(m => (
                      <div key={m.id} className="glass" style={{ padding: '1.25rem', borderRadius: '1rem', borderLeft: `4px solid ${m.color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: m.color, textTransform: 'uppercase' }}>{m.source}</span>
                            <span style={{ color: '#64748b', opacity: 0.3 }}>•</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>{m.assigne}</span>
                          </div>
                          <div style={{ fontWeight: 800, fontSize: '1rem' }}>{m.titre}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: m.priorite === 'Critique' ? '#EF4444' : '#64748b' }}>{m.priorite}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {timelineMissions.length === 0 && (
                <div className="glass" style={{ padding: '4rem', textAlign: 'center', borderRadius: '1.5rem' }}>
                  <Calendar size={48} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
                  <div style={{ fontWeight: 800, color: '#64748b' }}>Aucune échéance planifiée pour le moment.</div>
                </div>
              )}
            </div>
          )}

          {viewMode === 'workload' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {workloadData.map(([user, count]) => (
                <div key={user} className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 900 }}>
                      {user.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>{user}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{count} mission{count > 1 ? 's' : ''} active{count > 1 ? 's' : ''}</div>
                    </div>
                  </div>
                  
                  {/* Micro Progress Bar */}
                  <div style={{ background: 'rgba(0,0,0,0.05)', height: '6px', borderRadius: '3px', width: '100%' }}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((count / 10) * 100, 100)}%` }}
                      style={{ background: count > 5 ? '#F43F5E' : 'var(--accent)', height: '100%', borderRadius: '3px' }}
                    />
                  </div>
                  <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                    <span>Charge de travail</span>
                    <span>{Math.min((count / 10) * 100, 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

    </div>
  );
};

export default React.memo(MissionsPortal);
