import React, { useState, useMemo, useEffect } from 'react';
import { FirestoreService } from '../../services/firestore.service';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Ticket, 
  Terminal, Activity, Lock, Search, Plus,
  Monitor, Smartphone, HardDrive, Settings,
  ShieldAlert, Wrench, Clock, Globe, ShieldX, Key
} from 'lucide-react';

import { useStore } from '../../store';
import { useCanSeeSubTab } from '../../store/selectors';
import InfrastructureHealth from './components/InfrastructureHealth';
import SecurityThreatMap from './components/SecurityThreatMap';
import SmartButton from '../../components/SmartButton';
import { debugInteraction } from '../../utils/InteractionAuditor';
import { useToastStore } from '../../store/useToastStore';

/**
 *  NEXUS OS: IT OPERATIONS MODULE (ELITE 2.0 COMMANDER HUD)
 * Advanced Command Center with AIOps, Cybersecurity HUD, and War Room mode.
 */
const ITModule = () => {
  const { userRole } = useStore();
  const canSee = useCanSeeSubTab();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [criticalMode, setCriticalMode] = useState(false);
  const [showDoubleAuth, setShowDoubleAuth] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [itAssets, setItAssets] = useState([]);
  const [itInterventions, setItInterventions] = useState([]);
  const [itTickets, setItTickets] = useState([]);

  useEffect(() => {
    const unsubs = [
      FirestoreService.subscribeToCollection('it_assets',
        { orderByField: '_createdAt', descending: true, limit: 200 },
        (docs) => setItAssets(docs)),
      FirestoreService.subscribeToCollection('it_interventions',
        { orderByField: '_createdAt', descending: true, limit: 100 },
        (docs) => setItInterventions(docs)),
      FirestoreService.subscribeToCollection('it_tickets',
        { orderByField: '_createdAt', descending: true, limit: 200 },
        (docs) => setItTickets(docs)),
    ];
    return () => unsubs.forEach(u => typeof u === 'function' && u());
  }, []);

  const tabs = useMemo(() => {
    const allTabs = [
      { id: 'dashboard', label: 'Dashboard (NOC)', icon: <Activity size={16} /> },
      { id: 'security', label: 'Security Map', icon: <Globe size={16} /> },
      { id: 'inventory', label: 'Parc Informatique', icon: <Monitor size={16} /> },
      { id: 'tickets', label: 'Service Desk', icon: <Ticket size={16} /> },
      { id: 'maintenance', label: 'Maintenance & Ops', icon: <Wrench size={16} /> },
      { id: 'audit', label: 'Security Audit', icon: <Shield size={16} /> },
    ];
    return allTabs.filter(t => canSee('it', t.id));
  }, [canSee]);

  const toggleCriticalMode = () => setCriticalMode(!criticalMode);

  const triggerSensitiveAction = (action) => {
    setPendingAction(action);
    setShowDoubleAuth(true);
  };

  const confirmSensitiveAction = () => {
    setShowDoubleAuth(false);
    setPendingAction(null);
    alert(`Action exécutée : ${pendingAction}`);
  };

  return (
    <div style={{ 
      minHeight: '100vh', padding: '3rem', 
      background: 'var(--bg-subtle)',
      color: 'var(--text)',
      transition: 'var(--transition)',
      border: criticalMode ? '10px solid rgba(220, 38, 38, 0.2)' : 'none',
      position: 'relative'
    }}>
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ 
              padding: '10px', borderRadius: '12px', 
              background: criticalMode ? '#DC2626' : 'var(--primary)',
              boxShadow: criticalMode ? '0 0 20px rgba(220, 38, 38, 0.4)' : 'var(--shadow-accent)',
              transition: 'var(--transition)'
            }}>
              <Shield size={20} color="white" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
               <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '2px', color: criticalMode ? '#DC2626' : 'var(--primary)', textTransform: 'uppercase' }}>
                Operational Technology
              </span>
              <div style={{ height: '2px', width: '24px', background: criticalMode ? '#DC2626' : 'var(--primary)', marginTop: '2px' }} />
            </div>
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: 0, letterSpacing: '-1.5px', color: 'var(--text)' }}>
            IT Operations
          </h1>
          <p style={{ margin: '0.75rem 0 0 0', color: 'var(--text-muted)', fontWeight: 500, fontSize: '1.1rem' }}>
            AIOps, real-time threat intelligence & digital resilience.
          </p>
        </div>

        {/* Commander HUD Tools */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <SmartButton 
            onClick={async () => toggleCriticalMode()}
            variant={criticalMode ? 'danger' : 'secondary'}
            icon={criticalMode ? ShieldAlert : ShieldX}
            style={{ 
              padding: '0.75rem 1.5rem', borderRadius: '1.25rem', boxShadow: 'var(--shadow-md)',
              border: criticalMode ? 'none' : '1px solid #DC2626'
            }}
            successMessage={criticalMode ? 'War Room Deactivated' : 'War Room Active'}
          >
            {criticalMode ? 'WAR ROOM ACTIVE' : 'ENTER CRITICAL MODE'}
          </SmartButton>
          
          <div style={{ 
            padding: '0.75rem 1.5rem', borderRadius: '999px', 
            background: 'white', border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex', alignItems: 'center', gap: '0.75rem' 
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: criticalMode ? '#DC2626' : 'var(--accent)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
              {criticalMode ? 'INCIDENT P1 DETECTED' : 'SYSTEMS NOMINAL'}
            </span>
          </div>
        </div>
      </div>

      {/* ── NAVIGATION (ELITE TABS) ── */}
      <div style={{ 
        display: 'flex', gap: '0.5rem', marginBottom: '3rem', 
        padding: '6px', borderRadius: '1.5rem', 
        background: 'rgba(15, 23, 42, 0.03)',
        border: '1px solid var(--border-light)',
        width: 'fit-content' 
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.8rem 1.75rem', borderRadius: '1.25rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', transition: 'var(--transition)',
              background: activeTab === tab.id ? 'white' : 'transparent',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: activeTab === tab.id ? 'var(--shadow-md)' : 'none'
            }}
          >
            {React.cloneElement(tab.icon, { size: 18, color: activeTab === tab.id ? 'var(--primary)' : 'currentColor' })} 
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {activeTab === 'dashboard' && <InfrastructureHealth />}
          {activeTab === 'security' && <SecurityThreatMap />}
          
          {activeTab === 'inventory' && (
            <div style={{
              padding: '2.5rem', borderRadius: '2.5rem', background: 'white',
              border: '1px solid var(--border)', boxShadow: 'var(--shadow-premium)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem' }}>Asset Health Scoring</h3>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {itAssets.length} actif{itAssets.length !== 1 ? 's' : ''} inventorié{itAssets.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <SmartButton
                  variant="primary"
                  icon={Terminal}
                  style={{ borderRadius: '1rem' }}
                  onClick={async () => {
                    const nom = window.prompt('Nom de l\'actif (ex: MacBook Pro #12)');
                    if (!nom?.trim()) return;
                    const type = window.prompt('Type (Laptop / Serveur / Switch / Imprimante / Autre)', 'Laptop');
                    const assignedTo = window.prompt('Assigné à (nom ou email, optionnel)', '') || '';
                    await FirestoreService.addDocument('it_assets', {
                      nom: nom.trim(),
                      type: type?.trim() || 'Autre',
                      assignedTo: assignedTo.trim(),
                      status: 'Actif',
                      healthScore: 100,
                    });
                    useToastStore.getState().addToast(`Actif "${nom.trim()}" ajouté`, 'success');
                  }}
                >
                  Nouvel Actif
                </SmartButton>
              </div>

              {itAssets.length === 0 ? (
                <div style={{
                  padding: '3rem 1.5rem', borderRadius: '1.5rem',
                  border: '1px dashed var(--border)', background: 'var(--bg-subtle)',
                  textAlign: 'center',
                }}>
                  <Monitor size={40} style={{ opacity: 0.2, margin: '0 auto 1rem', display: 'block' }} />
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text)' }}>Aucun actif IT inventorié</div>
                  <div style={{ fontSize: '0.78rem', marginTop: '0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Cliquez sur "Nouvel Actif" pour enregistrer votre premier poste ou serveur.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {itAssets.map(asset => {
                    const health = Number(asset.healthScore ?? 100);
                    const healthColor = health >= 80 ? '#10B981' : health >= 50 ? '#F59E0B' : '#EF4444';
                    return (
                      <div key={asset.id} style={{ padding: '1.25rem 1.5rem', borderRadius: '1.25rem', background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'white', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                            {asset.type === 'Serveur' ? <HardDrive size={18} /> : asset.type === 'Smartphone' ? <Smartphone size={18} /> : <Monitor size={18} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{asset.nom}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{asset.type} · {asset.assignedTo || 'Non assigné'}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 3 }}>Health</div>
                            <div style={{ fontSize: '1rem', fontWeight: 900, color: healthColor }}>{health}%</div>
                          </div>
                          <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 800,
                            background: asset.status === 'Actif' ? '#10B98115' : '#EF444415',
                            color: asset.status === 'Actif' ? '#10B981' : '#EF4444' }}>
                            {asset.status || 'Actif'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tickets' && (() => {
            const openTickets   = itTickets.filter(t => !t.resolvedAt && t.status !== 'Résolu' && t.status !== 'Fermé');
            const resolvedTickets = itTickets.filter(t => t.resolvedAt || t.status === 'Résolu');
            const slaBreaches   = itTickets.filter(t => t.slaBreached).length;
            const p1p2Tickets   = openTickets.filter(t => t.priority === 'P1' || t.priority === 'P2');
            const avgResolutionH = (() => {
              if (resolvedTickets.length === 0) return '—';
              const totalMs = resolvedTickets.reduce((s, t) => {
                const created  = new Date(t._createdAt?.toDate?.() || t._createdAt || t.createdAt || Date.now());
                const resolved = new Date(t.resolvedAt?.toDate?.() || t.resolvedAt || Date.now());
                return s + Math.max(0, resolved - created);
              }, 0);
              const avgH = totalMs / resolvedTickets.length / 3600000;
              return `${avgH.toFixed(1)}h`;
            })();
            return (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
                  {[
                    { label: 'Avg Resolution Time', val: avgResolutionH, trend: resolvedTickets.length > 0 ? `${resolvedTickets.length} résolus` : 'Aucun résolu' },
                    { label: 'SLA Breaches', val: String(slaBreaches), trend: slaBreaches > 0 ? 'Action requise' : 'OK', critical: slaBreaches > 0 },
                    { label: 'Active P1/P2', val: String(p1p2Tickets.length), trend: p1p2Tickets.length > 0 ? 'Critique' : 'Stable' }
                  ].map(kpi => (
                    <div key={kpi.label} style={{ padding: '1.5rem', borderRadius: '1.5rem', background: 'white', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{kpi.label}</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: kpi.critical ? '#DC2626' : 'var(--primary)' }}>{kpi.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
                  {[
                    { col: 'To Do',       statuses: ['Nouveau', 'Ouvert', 'To Do'] },
                    { col: 'In Progress', statuses: ['En cours', 'In Progress', 'Assigné'] },
                    { col: 'Resolved',    statuses: ['Résolu', 'Fermé', 'Resolved'] },
                  ].map(({ col, statuses }) => {
                    const colTickets = itTickets.filter(t => statuses.some(s => t.status === s) ||
                      (col === 'To Do' && !t.status));
                    return (
                      <div key={col} style={{ padding: '2rem', borderRadius: '2rem', minHeight: '400px', background: 'white', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--primary)', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          {col}
                          <div style={{ width: 24, height: 24, borderRadius: '6px', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>{colTickets.length}</div>
                        </div>
                        {colTickets.length === 0 ? (
                          <div style={{ border: '1.5px dashed var(--border)', padding: '3rem 1.5rem', borderRadius: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                            Aucun ticket
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {colTickets.map(t => (
                              <div key={t.id} style={{ padding: '1rem', borderRadius: '1rem', background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
                                <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: 4 }}>{t.titre || t.title || '(sans titre)'}</div>
                                {t.priority && <span style={{ fontSize: '0.65rem', padding: '1px 7px', borderRadius: 999, fontWeight: 800, background: (t.priority === 'P1' || t.priority === 'P2') ? '#EF444415' : '#F59E0B15', color: (t.priority === 'P1' || t.priority === 'P2') ? '#EF4444' : '#F59E0B' }}>{t.priority}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
             </div>
            );
          })()}

          {activeTab === 'maintenance' && (
             <div style={{ padding: '2.5rem', borderRadius: '2.5rem', background: 'white', border: '1px solid var(--border)', boxShadow: 'var(--shadow-premium)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                   <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem' }}>Intervention History</h3>
                   <div style={{ display: 'flex', gap: '1rem' }}>
                      <SmartButton 
                        onClick={async () => triggerSensitiveAction('Rotation des Clés API')}
                        variant="danger"
                        icon={Key}
                        style={{ borderRadius: '1rem' }}
                      >
                        Rotate API Keys
                      </SmartButton>
                      <button style={{ padding: '0.75rem 1.5rem', borderRadius: '1rem', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>
                        Nouvelle Intervention
                      </button>
                   </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                   {itInterventions.length === 0 ? (
                     <div style={{ padding: '3rem', borderRadius: '1.5rem', border: '1px dashed var(--border)', background: 'var(--bg-subtle)', textAlign: 'center' }}>
                       <Wrench size={36} style={{ opacity: 0.2, margin: '0 auto 1rem', display: 'block' }} />
                       <div style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Aucune intervention enregistrée</div>
                       <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Les interventions créées ici apparaîtront dans l'historique.</div>
                     </div>
                   ) : itInterventions.map(log => {
                     const d = log._createdAt?.toDate?.() || new Date(log._createdAt || log.date || Date.now());
                     return (
                       <div key={log.id} style={{ padding: '1.5rem', borderRadius: '1.5rem', background: 'var(--bg-subtle)', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                             <div style={{ fontWeight: 800, color: 'var(--text)' }}>{log.type || 'Intervention'}: {log.asset || log.actif || '—'}</div>
                             <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{log.description || log.desc || '—'}</div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                             <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{log.technicien || log.tech || '—'}</div>
                             <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.toLocaleDateString('fr-FR')}</div>
                          </div>
                       </div>
                     );
                   })}
                </div>
             </div>
          )}

          {activeTab === 'audit' && (
            <div style={{ 
              padding: '2.5rem', borderRadius: '2.5rem', background: 'white', 
              border: '1px solid var(--border)', boxShadow: 'var(--shadow-premium)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem' }}>Security Pipeline</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Full traceability of system-level actions.</p>
                </div>
                <button 
                  onClick={() => triggerSensitiveAction('Purge des Logs d\'Audit')}
                  style={{ padding: '0.75rem 1.5rem', borderRadius: '1rem', border: '1px solid #DC2626', color: '#DC2626', background: 'white', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Purge Audit Logs
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ padding: '2.5rem', borderRadius: '1.5rem', border: '1px dashed var(--border)', background: 'var(--bg-subtle)', textAlign: 'center' }}>
                  <Shield size={36} style={{ opacity: 0.2, margin: '0 auto 1rem', display: 'block' }} />
                  <div style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Audit Pipeline sécurisé</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem', maxWidth: 400, margin: '0.4rem auto 0' }}>
                    Les événements de sécurité (changements de permissions, connexions, exports) sont automatiquement tracés ici par le module d'audit global.
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── DOUBLE-VALIDATION MODAL (2FA UI) ── */}
      <AnimatePresence>
        {showDoubleAuth && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              style={{ padding: '3rem', borderRadius: '2.5rem', background: 'white', width: '450px', boxShadow: 'var(--shadow-premium)', textAlign: 'center' }}
            >
              <div style={{ width: 80, height: 80, borderRadius: '24px', background: '#DC2626', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem auto', boxShadow: '0 10px 25px rgba(220, 38, 38, 0.3)' }}>
                <Lock size={32} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem' }}>Autorisation Requise</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontWeight: 500 }}>
                Vous vous apprêtez à exécuter une action sensible : <br/>
                <strong style={{ color: 'var(--text)' }}>{pendingAction}</strong>. <br/>
                Veuillez confirmer votre identité.
              </p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={() => setShowDoubleAuth(false)}
                  style={{ flex: 1, padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'white', fontWeight: 800, cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <SmartButton 
                  onClick={async () => {
                    await debugInteraction('Sensitive IT Action', async () => {
                      confirmSensitiveAction();
                      useToastStore.getState().addToast(`Action "${pendingAction}" exécutée`, 'success');
                    });
                  }}
                  variant="danger"
                  style={{ flex: 1, borderRadius: '1rem', boxShadow: '0 10px 20px rgba(220, 38, 38, 0.2)' }}
                >
                  Confirmer
                </SmartButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ITModule;
