import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Flag, Zap, Plus, X, Save, CheckCircle2, Circle, Search, Users2 } from 'lucide-react';
import { useBusiness } from '../BusinessContext';

const GPSWorkspace = () => {
  const { data, currentUser, addRecord, updateRecord, userRole } = useBusiness();
  const [gpsData, setGpsData] = useState({ goals: [] });
  const [recordId, setRecordId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // For Manager View
  const [viewedUser, setViewedUser] = useState(currentUser?.nom);
  
  // Current term (Ex: "Q2 2026")
  const currentTerm = `Q${Math.floor(new Date().getMonth() / 3) + 1} ${new Date().getFullYear()}`;

  // Fetch or initialize GPS Record
  useEffect(() => {
    const allGps = data.hr?.gps_okr || [];
    const myGps = allGps.find(g => g.collaborateur === viewedUser && g.semestre === currentTerm);
    
    if (myGps) {
      setRecordId(myGps.id);
      try {
        setGpsData(JSON.parse(myGps.donnees || '{"goals":[]}'));
      } catch(e) { setGpsData({ goals: [] }); }
    } else {
      setRecordId(null);
      setGpsData({ goals: [] });
    }
  }, [data.hr?.gps_okr, viewedUser, currentTerm]);

  const saveGPS = () => {
    const payload = JSON.stringify(gpsData);
    if (recordId) {
      updateRecord('hr', 'gps_okr', recordId, { donnees: payload });
    } else {
      addRecord('hr', 'gps_okr', {
        collaborateur: viewedUser,
        departement: currentUser?.dept || 'General',
        semestre: currentTerm,
        manager: '',
        donnees: payload
      });
    }
    setIsEditing(false);
  };

  const addGoal = () => {
    if (gpsData.goals.length >= 3) return alert("Maximum 3 Goals (Objectifs) autorisés pour rester focus !");
    setGpsData({ ...gpsData, goals: [...gpsData.goals, { id: Date.now().toString(), titre: 'Nouvel Objectif Macro', priorities: [] }] });
    setIsEditing(true);
  };

  const addPriority = (goalId) => {
    setGpsData(prev => {
      const goals = prev.goals.map(g => {
        if (g.id === goalId) {
          if (g.priorities.length >= 3) { alert("Maximum 3 priorités par objectif !"); return g; }
          return { ...g, priorities: [...g.priorities, { id: Date.now().toString(), titre: 'Nouvelle Priorité Clé', strategies: [] }] };
        }
        return g;
      });
      return { ...prev, goals };
    });
    setIsEditing(true);
  };

  const addStrategy = (goalId, priorityId) => {
    setGpsData(prev => {
      const goals = prev.goals.map(g => {
        if (g.id === goalId) {
          return {
            ...g,
            priorities: g.priorities.map(p => {
              if (p.id === priorityId) {
                if (p.strategies.length >= 5) { alert("Maximum 5 stratégies d'action !"); return p; }
                return { ...p, strategies: [...p.strategies, { id: Date.now().toString(), titre: 'Nouvelle Action', done: false }] };
              }
              return p;
            })
          };
        }
        return g;
      });
      return { ...prev, goals };
    });
    setIsEditing(true);
  };

  const updateText = (type, goalId, priorityId, stratId, newText) => {
    setGpsData(prev => {
      const goals = prev.goals.map(g => {
        if (g.id === goalId) {
          if (type === 'goal') return { ...g, titre: newText };
          return {
            ...g,
            priorities: g.priorities.map(p => {
              if (p.id === priorityId) {
                if (type === 'priority') return { ...p, titre: newText };
                return {
                  ...p,
                  strategies: p.strategies.map(s => {
                    if (s.id === stratId) return { ...s, titre: newText };
                    return s;
                  })
                };
              }
              return p;
            })
          };
        }
        return g;
      });
      return { ...prev, goals };
    });
  };

  const toggleStrategyDone = (goalId, priorityId, stratId) => {
    setGpsData(prev => {
      const goals = prev.goals.map(g => {
        if (g.id === goalId) {
          return {
            ...g,
            priorities: g.priorities.map(p => {
              if (p.id === priorityId) {
                return {
                  ...p,
                  strategies: p.strategies.map(s => {
                    if (s.id === stratId) return { ...s, done: !s.done };
                    return s;
                  })
                };
              }
              return p;
            })
          };
        }
        return g;
      });
      return { ...prev, goals };
    });
    setIsEditing(true); // Need to save
  };

  const deleteItem = (type, goalId, priorityId, stratId) => {
    setGpsData(prev => {
      let goals = [...prev.goals];
      if (type === 'goal') {
        goals = goals.filter(g => g.id !== goalId);
      } else if (type === 'priority') {
        goals = goals.map(g => g.id === goalId ? { ...g, priorities: g.priorities.filter(p => p.id !== priorityId) } : g);
      } else if (type === 'strategy') {
        goals = goals.map(g => g.id === goalId ? { ...g, priorities: g.priorities.map(p => p.id === priorityId ? { ...p, strategies: p.strategies.filter(s => s.id !== stratId) } : p) } : g);
      }
      return { ...prev, goals };
    });
    setIsEditing(true);
  };

  // Manager Options
  const myTeam = ['SUPER_ADMIN', 'RH', 'DIRECTION'].some(r => userRole?.includes(r)) 
    ? (data.hr?.employees || []).map(e => e.nom) 
    : [currentUser?.nom];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* TOOLBAR */}
      <div className="glass" style={{ padding: '1rem 2rem', borderRadius: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#10B981' }}>
            <Target size={24} /> GPS Stratégique — {currentTerm}
          </h2>
          <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Goals (Objectifs) • Priorities (Priorités) • Strategies (Stratégies d'Action)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {myTeam.length > 1 && (
            <select 
              value={viewedUser} 
              onChange={e => setViewedUser(e.target.value)}
              style={{ padding: '0.5rem 1rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', outline: 'none' }}
            >
              <optgroup label="Mon GPS">
                <option value={currentUser?.nom}>{currentUser?.nom} (Moi)</option>
              </optgroup>
              <optgroup label="Mon Équipe">
                {myTeam.filter(n => n !== currentUser?.nom).map(n => <option key={n} value={n}>{n}</option>)}
              </optgroup>
            </select>
          )}

          {isEditing && (
            <motion.button 
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              onClick={saveGPS}
              className="btn-primary"
              style={{ padding: '0.5rem 1.25rem', borderRadius: '1rem', background: '#10B981', borderColor: '#10B981', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Save size={16} /> Sauvegarder
            </motion.button>
          )}
        </div>
      </div>

      {/* TREE CONTENT */}
      {gpsData.goals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--bg-subtle)', borderRadius: '2rem' }}>
          <Target size={48} color="var(--border)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>Aucun plan GPS défini</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Vous naviguez à vue pour ce semestre. Définissez un grand objectif pour commencer.</p>
          <button onClick={addGoal} className="btn-primary" style={{ padding: '0.8rem 1.5rem', borderRadius: '1.25rem', background: 'var(--text)', borderColor: 'var(--text)', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Initialiser mon GPS
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: '2rem' }}>
          {gpsData.goals.map((goal, gIndex) => (
            <motion.div 
              key={goal.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="glass"
              style={{ padding: '1.5rem', borderRadius: '2rem', borderTop: '4px solid #10B981', position: 'relative' }}
            >
              <button onClick={() => deleteItem('goal', goal.id)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="Supprimer l'objectif"><X size={16}/></button>
              
              {/* GOAL */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#10B98120', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>G{gIndex + 1}</div>
                <input 
                  value={goal.titre}
                  onChange={e => { updateText('goal', goal.id, null, null, e.target.value); setIsEditing(true); }}
                  placeholder="Objectif Macro..."
                  style={{ flex: 1, fontSize: '1.25rem', fontWeight: 900, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)' }}
                />
              </div>

              {/* PRIORITIES */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {goal.priorities.map((prio, pIndex) => (
                  <div key={prio.id} style={{ paddingLeft: '1rem', borderLeft: '2px solid var(--border)', position: 'relative' }}>
                    <button onClick={() => deleteItem('priority', goal.id, prio.id)} style={{ position: 'absolute', top: 0, right: 0, background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={14}/></button>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <Flag size={14} color="#F59E0B" />
                      <input 
                        value={prio.titre}
                        onChange={e => { updateText('priority', goal.id, prio.id, null, e.target.value); setIsEditing(true); }}
                        placeholder="Priorité Clé..."
                        style={{ flex: 1, fontSize: '1rem', fontWeight: 800, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)' }}
                      />
                    </div>

                    {/* STRATEGIES */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '1.5rem' }}>
                      {prio.strategies.map((strat) => (
                        <div key={strat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', group: 'true' }}>
                          <div onClick={() => toggleStrategyDone(goal.id, prio.id, strat.id)} style={{ cursor: 'pointer', color: strat.done ? '#10B981' : 'var(--border)' }}>
                            {strat.done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                          </div>
                          <input 
                            value={strat.titre}
                            onChange={e => { updateText('strategy', goal.id, prio.id, strat.id, e.target.value); setIsEditing(true); }}
                            placeholder="Stratégie d'action..."
                            style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600, background: 'transparent', border: 'none', outline: 'none', color: strat.done ? 'var(--text-muted)' : 'var(--text)', textDecoration: strat.done ? 'line-through' : 'none' }}
                          />
                           <button onClick={() => deleteItem('strategy', goal.id, prio.id, strat.id)} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', opacity: 0.5 }}><X size={12}/></button>
                        </div>
                      ))}
                      {prio.strategies.length < 5 && (
                        <button onClick={() => addStrategy(goal.id, prio.id)} style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <Plus size={12} /> Stratégie
                        </button>
                      )}
                    </div>

                  </div>
                ))}

                {goal.priorities.length < 3 && (
                  <button onClick={() => addPriority(goal.id)} style={{ alignSelf: 'flex-start', padding: '0.6rem 1rem', borderRadius: '0.75rem', background: '#F59E0B15', color: '#F59E0B', border: 'none', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '1rem' }}>
                    <Plus size={14} /> Ajouter une Priorité
                  </button>
                )}
              </div>

            </motion.div>
          ))}

          {gpsData.goals.length < 3 && (
            <div onClick={addGoal} className="glass" style={{ minHeight: '200px', borderRadius: '2rem', border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', transition: '0.2s', opacity: 0.6 }} >
              <Plus size={32} style={{ marginBottom: '0.5rem' }} />
              <div style={{ fontWeight: 800 }}>Nouvel Objectif</div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default GPSWorkspace;
