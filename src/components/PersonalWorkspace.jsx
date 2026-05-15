import React, { useMemo, useState, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import {
  Zap, Clock, Briefcase, CheckCircle2, AlertCircle,
  Target, TrendingUp, Calendar, ChevronRight, Activity, XOctagon, Edit2, Check, Star
} from 'lucide-react';
import { useStore } from '../store';
import GPSWorkspace from './GPSWorkspace';
import FocusTracker from './workspace/FocusTracker';
import VictoryHeartbeat from './workspace/VictoryHeartbeat';
import QuickNotes from './workspace/QuickNotes';
import GamificationBadges from './workspace/GamificationBadges';
import KaizenBox from './workspace/KaizenBox';
import StaffPortal from '../modules/StaffPortal';
import CommandCenter from './workspace/CommandCenter';
const NexusScoreWidget  = lazy(() => import('./workspace/NexusScoreWidget'));
const ProfileSettings   = lazy(() => import('./workspace/ProfileSettings'));

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const PersonalWorkspace = () => {
  const data = useStore(s => s.data);
  const currentUser = useStore(s => s.user);
  const navigateTo = useStore(s => s.navigateTo);
  const [activeTab, setActiveTab] = useState('overview');

  const [isEditingName, setIsEditingName] = useState(false);
  const [nickname, setNickname] = useState(() => localStorage.getItem('ipc_erp_nickname_' + currentUser?.id) || currentUser?.nom || 'Utilisateur');

  const handleNicknameSave = () => {
    setIsEditingName(false);
    localStorage.setItem('ipc_erp_nickname_' + currentUser?.id, nickname);
  };
  
  // --- 1. Compute User Specific Data ---
  const myLeaves = (data.hr?.leaves || []).filter(l => l.employe === currentUser?.nom);
  const myExpenses = (data.hr?.expenses || []).filter(e => e.employe === currentUser?.nom);
  
  // Projects & Tasks
  const myProjects = (data.projects?.projects || []).filter(p => 
    p.team?.some(t => t.nom === currentUser?.nom) || p.chefProjet === currentUser?.nom
  );
  
  // Production
  const myWorkOrders = (data.production?.workOrders || []).filter(wo => wo.assignee === currentUser?.nom || wo.statut === 'En cours'); 
  // Note: fallback on 'En cours' for demo if no assignee is set. Ideally, we filter properly.
  
  // Sales
  const myLeads = (data.crm?.leads || []).filter(l => l.assignee === currentUser?.nom);
  const myOpportunities = (data.crm?.opportunities || []).filter(o => o.assignee === currentUser?.nom);
  
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const role = currentUser?.role || 'STAFF';

  // --- 2. Compute "En Retard" (Delays & Alerts) ---
  const today = new Date().toISOString().split('T')[0];
  const delays = [];

  myWorkOrders.forEach(wo => {
    if (wo.echeance && wo.echeance < today && wo.statut !== 'Terminé') {
      delays.push({ id: wo.id, type: 'Production', label: `OF ${wo.num} en retard`, date: wo.echeance, link: 'production' });
    }
  });

  myOpportunities.forEach(opp => {
    if (opp.expectedClose && opp.expectedClose < today && opp.status !== 'Gagnée') {
      delays.push({ id: opp.id, type: 'CRM', label: `Opportunité ${opp.nom} expirée`, date: opp.expectedClose, link: 'crm' });
    }
  });

  // Approvals waiting ONLY for managers/admins
  if (['HR_MANAGER', 'SUPER_ADMIN'].includes(role) || currentUser?.dept === 'RH') {
    const pendingLeaves = (data.hr?.leaves || []).filter(l => l.statut === 'En attente');
    if (pendingLeaves.length > 0) {
      delays.push({ id: 'leaves', type: 'Validation RH', label: `${pendingLeaves.length} congés en attente de validation`, date: 'Urgent', link: 'hr' });
    }
  }

  // --- 3. Compute "Avancées" (Progress Metric) ---
  // A generic progress score based on user's assigned items.
  let totalTasks = 0;
  let completedTasks = 0;

  // Track projects completion
  myProjects.forEach(p => {
    totalTasks += 100; // Treat project as 100 points
    completedTasks += (p.progression || 0);
  });

  // Track timesheets count as some progress generically (example behavior)
  const myTimesheets = (data.hr?.timesheets || []).filter(t => t.employe === currentUser?.nom);
  if (myTimesheets.length > 0) {
    totalTasks += 20; 
    completedTasks += Math.min(myTimesheets.length * 2, 20); // up to 20 pts for filled timesheets
  }

  // Track CRM if sales
  if (myOpportunities.length > 0) {
    totalTasks += myOpportunities.length * 10;
    completedTasks += myOpportunities.filter(o => o.status === 'Gagnée').length * 10;
  }

  const successScore = totalTasks === 0 ? 100 : Math.round((completedTasks / totalTasks) * 100);

  // --- 4. Today's Feed ---
  // Create a combined list of upcoming/active stuff
  const myDay = [
    ...myProjects.filter(p => (p.progression || 0) < 100).map(p => ({
      icon: <Briefcase size={16} />, title: `Projet: ${p.nom}`, desc: `Actuellement à ${p.progression}%`, color: '#8B5CF6', link: 'projects'
    })),
    ...myLeaves.filter(l => l.statut === 'Validé' && l.du >= today).map(l => ({
      icon: <Calendar size={16} />, title: `Congés à venir`, desc: `Du ${l.du} au ${l.au}`, color: '#10B981', link: 'staff_portal'
    })),
    ...myLeads.filter(l => l.statut === 'Nouveau' || l.statut === 'Contacté').map(l => ({
      icon: <Target size={16} />, title: `Lead: ${l.nom}`, desc: "Doit être travaillé aujourd'hui", color: '#3B82F6', link: 'crm'
    }))
  ].slice(0, 5); // Take top 5 for "My Day"


  /* UI RENDER */
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* HEADER SECTION */}
      <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', color: 'var(--accent)', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
            <Zap size={16} /> Espace Personnel IPC
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
             {isEditingName ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>Bonjour, </span>
                   <input 
                     autoFocus
                     value={nickname}
                     onChange={e => setNickname(e.target.value)}
                     onKeyDown={e => e.key === 'Enter' && handleNicknameSave()}
                     onBlur={handleNicknameSave}
                     style={{ fontSize: '2.5rem', fontWeight: 800, background: 'transparent', border: 'none', borderBottom: '2px solid var(--accent)', color: 'var(--text)', outline: 'none', width: '250px' }}
                   />
                   <button onClick={handleNicknameSave} style={{ background: 'var(--accent)', border: 'none', padding: '8px', borderRadius: '50%', color: 'white', cursor: 'pointer', display: 'flex' }}>
                     <Check size={20} />
                   </button>
                </div>
             ) : (
                <div 
                  onClick={() => setIsEditingName(true)} 
                  title="Modifier comment l'application vous appelle"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                  className="hover-opacity"
                >
                   <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800 }}>Bonjour, <span style={{ textDecoration: 'underline', textDecorationColor: 'var(--border)', textUnderlineOffset: '8px' }}>{nickname}</span></h1>
                   <Edit2 size={18} color="var(--text-muted)" style={{ marginTop: '10px' }} />
                </div>
             )}
          </div>
          <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-muted)' }}>Bienvenue dans votre espace de travail. Voici l'état de vos missions.</p>
        </div>
        <div className="glass" style={{ padding: '1.25rem', borderRadius: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', minWidth: '300px' }}>
          <div style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* SVG Circular Progress */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="40" cy="40" r="36" fill="none" stroke="var(--border)" strokeWidth="6" />
              <circle cx="40" cy="40" r="36" fill="none" stroke={successScore < 50 ? '#EF4444' : successScore < 80 ? '#F59E0B' : '#10B981'} strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${(successScore / 100) * 226} 226`} style={{ transition: 'stroke-dasharray 1s ease' }} />
            </svg>
            <span style={{ fontWeight: 800, fontSize: '1.4rem' }}>{successScore}%</span>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0.2rem' }}>Taux de Réussite</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Projets, tickets et missions assignés.</div>
          </div>
        </div>
      </motion.div>

      {/* SWITCH TABS */}
      <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
         <button onClick={() => setActiveTab('overview')} style={{ background: 'transparent', border: 'none', fontSize: '1rem', fontWeight: 800, color: activeTab === 'overview' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', paddingBottom: '0.5rem', borderBottom: activeTab === 'overview' ? '2px solid var(--accent)' : '2px solid transparent' }}>Vue d'Ensemble</button>
         <button onClick={() => setActiveTab('hr')} style={{ background: 'transparent', border: 'none', fontSize: '1rem', fontWeight: 800, color: activeTab === 'hr' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', paddingBottom: '0.5rem', borderBottom: activeTab === 'hr' ? '2px solid var(--accent)' : '2px solid transparent' }}>Mon Dossier RH</button>
         <button onClick={() => setActiveTab('gps')} style={{ background: 'transparent', border: 'none', fontSize: '1rem', fontWeight: 800, color: activeTab === 'gps' ? 'var(--accent)' : 'var(--text-muted)', cursor: 'pointer', paddingBottom: '0.5rem', borderBottom: activeTab === 'gps' ? '2px solid var(--accent)' : '2px solid transparent' }}>Mon GPS Stratégique</button>
         <button onClick={() => setActiveTab('commander')} style={{ background: 'transparent', border: 'none', fontSize: '1rem', fontWeight: 800, color: activeTab === 'commander' ? '#EF4444' : 'var(--text-muted)', cursor: 'pointer', paddingBottom: '0.5rem', borderBottom: activeTab === 'commander' ? '2px solid #EF4444' : '2px solid transparent', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
 Command Center
 </button>
         <button onClick={() => setActiveTab('score')} style={{ background: 'transparent', border: 'none', fontSize: '1rem', fontWeight: 800, color: activeTab === 'score' ? '#F59E0B' : 'var(--text-muted)', cursor: 'pointer', paddingBottom: '0.5rem', borderBottom: activeTab === 'score' ? '2px solid #F59E0B' : '2px solid transparent', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
           <Star size={16} strokeWidth={2} /> Mon Score
         </button>
         <button
           onClick={() => setActiveTab('profile')}
           style={{
             background: 'transparent', border: 'none', fontSize: '1rem', fontWeight: 800,
             color: activeTab === 'profile' ? '#8B5CF6' : 'var(--text-muted)',
             cursor: 'pointer', paddingBottom: '0.5rem',
             borderBottom: activeTab === 'profile' ? '2px solid #8B5CF6' : '2px solid transparent',
             display: 'flex', alignItems: 'center', gap: '0.4rem',
           }}
         >
 Mon Profil
 </button>
      </div>

      {activeTab === 'profile' ? (
        <Suspense fallback={<div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Chargement du profil…</div>}>
          <ProfileSettings />
        </Suspense>
      ) : activeTab === 'commander' ? (
        <CommandCenter />
      ) : activeTab === 'score' ? (
        <Suspense fallback={<div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Chargement du Score...</div>}>
          <NexusScoreWidget />
        </Suspense>
      ) : activeTab === 'gps' ? (
        <GPSWorkspace />
      ) : activeTab === 'hr' ? (
        <StaffPortal embedded={true} />
      ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '2rem' }}>
        
        {/* RETARDS & ALERTES (ATTENTION REQUISE) */}
        <motion.div variants={itemVariants} className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', minHeight: '340px' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', color: delays.length > 0 ? '#EF4444' : '#10B981' }}>
            {delays.length > 0 ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />} 
            Attention Requise
          </h3>
          
          {delays.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={40} style={{ opacity: 0.2, margin: '0 auto 1rem auto' }} />
              <p>Excellent ! Aucun retard ni tâche bloquante.</p>
            </div>
          ) : (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {delays.map((d, i) => (
                <div key={i} onClick={() => navigateTo(d.link)} style={{ padding: '1rem', background: '#EF444415', borderRadius: '1rem', borderLeft: '4px solid #EF4444', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#EF4444', fontSize: '0.9rem' }}>{d.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Échéance : {d.date}</div>
                  </div>
                  <ChevronRight size={18} color="#EF4444" />
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* MA JOURNEE / MY DAY */}
        <motion.div variants={itemVariants} className="glass" style={{ padding: '2rem', borderRadius: '1.5rem', minHeight: '340px' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Activity size={20} color="var(--accent)" /> Au programme aujourd'hui
          </h3>
          
          {myDay.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <Clock size={40} style={{ opacity: 0.2, margin: '0 auto 1rem auto' }} />
              <p>Rien d'urgent aujourd'hui.<br/>Naviguez dans les modules pour commencer de nouvelles missions.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {myDay.map((md, i) => (
                <div key={i} onClick={() => navigateTo(md.link)} style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: '0.2s', border: '1px solid transparent' }} className="hover-border-accent">
                  <div style={{ width: '40px', height: '40px', borderRadius: '0.8rem', background: `${md.color}15`, color: md.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {md.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{md.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{md.desc}</div>
                  </div>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </div>
              ))}
            </div>
          )}
        </motion.div>

      </div>

      {/* BENTO BOX GRID: 5 NEW WIDGETS */}
      <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '2rem' }}>
        <FocusTracker />
        <VictoryHeartbeat />
        <QuickNotes />
        <GamificationBadges score={successScore} timesheets={(data.hr?.timesheets || []).filter(t => t.employe === currentUser?.nom).length || 0} leads={myLeads?.length || 0} />
        <KaizenBox />
      </motion.div>

      {/* QUICK WORK WIDGETS BY ROLE */}
      <motion.div variants={itemVariants}>
         <h3 style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: '1.5rem' }}>Mes Accès Directs</h3>
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))', gap: '1.5rem' }}>
           
           <div onClick={() => setActiveTab('hr')} className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Briefcase size={28} color="var(--accent)" />
              <div>
                <span style={{ fontWeight: 700, display: 'block' }}>Espace Employé</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Congés, Frais, RH</span>
              </div>
           </div>

           {(role.includes('SALES') || isSuperAdmin) && (
             <div onClick={() => navigateTo('crm')} className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Target size={28} color="#3B82F6" />
                <div>
                  <span style={{ fontWeight: 700, display: 'block' }}>Mon CRM</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{myLeads.length} Leads, {myOpportunities.length} Opportunités</span>
                </div>
             </div>
           )}

           {(role.includes('HR') || isSuperAdmin) && (
             <div onClick={() => navigateTo('hr')} className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <CheckCircle2 size={28} color="#10B981" />
                <div>
                  <span style={{ fontWeight: 700, display: 'block' }}>Validations RH</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Afficher demandes en cours</span>
                </div>
             </div>
           )}

           {(role.includes('PRODUCTION') || isSuperAdmin) && (
             <div onClick={() => navigateTo('production')} className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Zap size={28} color="#F59E0B" />
                <div>
                  <span style={{ fontWeight: 700, display: 'block' }}>Ordres de Fabrication</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mes ordres assignés</span>
                </div>
             </div>
           )}

         </div>
      </motion.div>
      </div>
      )}

    </motion.div>
  );
};

export default PersonalWorkspace;
