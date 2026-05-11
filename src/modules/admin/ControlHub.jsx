import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Settings, Users, Database, 
  Lock, 
  Power, Terminal, Cpu, Layout, Activity, RefreshCw
} from 'lucide-react';
import { useStore } from '../../store';
import { functions } from '../../firebase/config';
import { httpsCallable } from 'firebase/functions';

// Components
import IdentityTab from './tabs/IdentityTab';
import StudioTab from './tabs/StudioTab';
import ConfigTab from './tabs/ConfigTab';
import SecurityTab from './tabs/SecurityTab';
import HealthTab from './tabs/HealthTab';
import MasterData from '../MasterData';
import History from '../History';

const ControlHub = ({ onOpenDetail }) => {
  const { userRole, currentUser, resetAllData, shellView } = useStore();
  const [activeTab, setActiveTab] = useState('identity');
  const [isBackfilling, setIsBackfilling] = useState(false);

  const handleBackfill = async () => {
    if (!window.confirm('🚀 LANCER LA SYNCHRONISATION MASSIVE ? Cette opération va pousser toutes les données vers PostgreSQL.')) return;
    setIsBackfilling(true);
    try {
      const backfillFn = httpsCallable(functions, 'backfillGreenBlock');
      const result = await backfillFn();
      alert(`✅ Backfill Terminé : ${result.data.syncs} enregistrements synchronisés.`);
    } catch (err) {
      console.error(err);
      alert('❌ Échec du Backfill. Vérifiez les logs Cloud Functions.');
    } finally {
      setIsBackfilling(false);
    }
  };

  // Security Check : Tactical Firewall
  if (userRole !== 'SUPER_ADMIN') {
    return (
       <div style={{ padding: '6rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '2rem' }}>
          <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="nexus-glow" style={{ padding: '2rem', borderRadius: '3rem', background: '#EF444410', color: '#EF4444', border: '1px solid #EF444430' }}>
             <Lock size={64} />
          </motion.div>
          <div>
            <h1 className="nexus-gradient-text" style={{ fontSize: '3rem', fontWeight: 900, margin: 0 }}>Périmètre Sécurisé</h1>
            <p style={{ color: 'var(--nexus-text-muted)', fontSize: '1.2rem', maxWidth: '500px', margin: '1rem auto', fontWeight: 600 }}>
              Désolé, **{currentUser?.nom}**. Votre accréditation actuelle est insuffisante pour franchir le pare-feu Nexus.
            </p>
          </div>
          <button onClick={() => window.history.back()} className="nexus-card" style={{ padding: '1rem 2.5rem', background: 'var(--nexus-secondary)', color: 'white', fontWeight: 900, border: 'none' }}>Retour au Dashboard</button>
       </div>
    );
  }

  const tabs = [
    { id: 'identity', label: 'Identity', icon: <Users size={16} /> },
    { id: 'studio', label: 'Studio Logic', icon: <Cpu size={16} /> },
    { id: 'config', label: 'Global Config', icon: <Settings size={16} /> },
    { id: 'security', label: 'Guard Center', icon: <ShieldCheck size={16} /> },
    { id: 'health', label: 'Health Hub', icon: <Activity size={16} /> },
    { id: 'masterdata', label: 'Données Maîtres', icon: <Layout size={16} /> },
    { id: 'history', label: 'Historique & Audit', icon: <Database size={16} /> }
  ];

  return (
    <div style={{ padding: shellView?.mobile ? '1rem' : '2.5rem', display: 'flex', flexDirection: 'column', gap: '3rem', minHeight: '100%', background: 'var(--nexus-bg)' }}>
      
      {/* Tactical Header : The Control Tower */}
      {!shellView?.mobile && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--nexus-primary)', marginBottom: '1rem' }}>
              <div className="nexus-glow" style={{ background: 'var(--nexus-primary)', padding: '8px', borderRadius: '10px' }}>
                <Terminal size={20} color="white" />
              </div>
              <span style={{ fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2.5px' }}>Nexus Command & Control — Root</span>
            </div>
            <h1 className="nexus-gradient-text" style={{ fontSize: '3.5rem', fontWeight: 900, margin: 0, letterSpacing: '-2px', lineHeight: 1 }}>Platform Engine</h1>
            <p style={{ color: 'var(--nexus-text-muted)', margin: '0.75rem 0 0 0', fontSize: '1.1rem', fontWeight: 500, maxWidth: '600px', lineHeight: 1.5 }}>
              Cockpit d&apos;administration Nexus : Pilotez les identités, la sécurité et l&apos;architecture logicielle de votre écosystème.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
             <div className="nexus-card" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.75rem 1.5rem', background: 'white' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--nexus-primary)', boxShadow: '0 0 10px var(--nexus-primary)' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--nexus-text-muted)' }}>Status : Optimal</span>
             </div>
             
             <button 
                onClick={handleBackfill}
                disabled={isBackfilling}
                className="nexus-card" 
                style={{ 
                  padding: '0.9rem 2rem', 
                  background: 'var(--nexus-primary)', 
                  color: 'white', 
                  border: 'none', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  fontWeight: 900, 
                  cursor: isBackfilling ? 'not-allowed' : 'pointer',
                  opacity: isBackfilling ? 0.7 : 1
                }}
              >
                 <RefreshCw size={20} className={isBackfilling ? 'spin' : ''} /> 
                 {isBackfilling ? 'Synchronisation...' : 'Lancer Backfill SSOT'}
              </button>

             <button onClick={() => {
               if(window.confirm('⚠️ EFFACER TOUTES LES DONNÉES : Ceci va supprimer TOUS les enregistrements irréversiblement. Confirmer ?')) {
                  resetAllData();
               }
             }} className="nexus-card" style={{ padding: '0.9rem 2rem', background: '#EF4444', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900, cursor: 'pointer' }}>
                <Power size={20} /> Effacer les Données
             </button>
          </div>
        </div>
      )}

      {/* Admin Navigation Hub */}
      <div style={{ display: 'flex', justifyContent: shellView?.mobile ? 'flex-start' : 'center', overflowX: 'auto', padding: '0.5rem' }}>
        <div className="nexus-card" style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.03)', padding: '0.4rem', borderRadius: '1rem', gap: '0.4rem', border: '1px solid var(--nexus-border)' }}>
          {tabs.map(t => {
            const isActive = activeTab === t.id;
            return (
              <button 
                key={t.id} 
                onClick={() => setActiveTab(t.id)} 
                style={{ 
                  padding: '0.6rem 1.25rem', 
                  borderRadius: '0.75rem', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontWeight: 800, 
                  fontSize: '0.8rem', 
                  background: isActive ? 'white' : 'transparent', 
                  color: isActive ? 'var(--nexus-primary)' : 'var(--nexus-text-muted)', 
                  boxShadow: isActive ? 'var(--shadow-nexus)' : 'none',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem',
                  transition: 'var(--transition-nexus)',
                  whiteSpace: 'nowrap'
                }}
              >
                {React.cloneElement(t.icon, { size: 16, strokeWidth: isActive ? 3 : 2 })} 
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Technical Experience Frame */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.02, y: -10 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'relative' }}
        >
          {activeTab === 'identity' && <IdentityTab onOpenDetail={onOpenDetail} />}
          {activeTab === 'studio' && <StudioTab />}
          {activeTab === 'config' && <ConfigTab />}
          {activeTab === 'security' && <SecurityTab />}
          {activeTab === 'health' && <HealthTab />}
          {activeTab === 'masterdata' && (
            <div className="nexus-card" style={{ background: 'white', overflow: 'hidden' }}>
              <MasterData onOpenDetail={onOpenDetail} />
            </div>
          )}
          {activeTab === 'history' && (
            <div className="nexus-card" style={{ background: 'white', overflow: 'hidden' }}>
              <History onOpenDetail={onOpenDetail} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Nexus Footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="nexus-card" style={{ padding: '2rem', background: 'var(--nexus-secondary)', color: 'white', display: 'flex', alignItems: 'center', gap: '2rem', border: 'none' }}>
         <div className="nexus-glow" style={{ padding: '15px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.2)', color: 'var(--nexus-primary)' }}>
            <ShieldCheck size={32} />
         </div>
         <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--nexus-primary)', marginBottom: '8px' }}>Identity & Nexus Shield</h4>
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 500, lineHeight: 1.4, opacity: 0.7 }}>
               &quot;Surveillance Nexus Active : Toutes les sessions sont scellées et authentifiées. Aucun accès non autorisé détecté sur le périmètre de sécurité.&quot;
            </p>
         </div>
      </motion.div>
    </div>
  );
};

export default ControlHub;
