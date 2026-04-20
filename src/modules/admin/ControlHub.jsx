import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Settings, Users, Database, 
  Sparkles, Zap, Lock, Bell, Search,
  Power, Terminal, Cpu, Layout, Activity
} from 'lucide-react';
import { useBusiness } from '../../BusinessContext';

// Components
import TabBar from '../marketing/components/TabBar';
import IdentityTab from './tabs/IdentityTab';
import StudioTab from './tabs/StudioTab';
import ConfigTab from './tabs/ConfigTab';
import SecurityTab from './tabs/SecurityTab';
import HealthTab from './tabs/HealthTab';
import MasterData from '../MasterData';
import History from '../History';

const ControlHub = ({ onOpenDetail }) => {
  const { userRole, config, currentUser, resetAllData } = useBusiness();
  const [activeTab, setActiveTab] = useState('identity');

  // Security Check : Tactical Firewall
  if (userRole !== 'SUPER_ADMIN') {
    return (
       <div style={{ padding: '6rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '2rem' }}>
          <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 4 }} style={{ padding: '2rem', borderRadius: '3rem', background: '#EF444410', color: '#EF4444', border: '1px solid #EF444430' }}>
             <Lock size={64} />
          </motion.div>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>Périmètre Sécurisé</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '500px', margin: '1rem auto' }}>
              Désolé, **{currentUser.nom}**. Votre niveau d'accréditation actuel ne vous permet pas d'accéder à la Tour de Contrôle globale.
            </p>
          </div>
          <button onClick={() => window.history.back()} className="btn-primary" style={{ padding: '1rem 2rem', borderRadius: '1.25rem', background: '#0F172A' }}>Retour au Dashboard</button>
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
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '3rem', minHeight: '1000px', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.01) 0%, rgba(249, 115, 22, 0.01) 100%)' }}>
      
      {/* Tactical Header : The Control Tower */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#F97316', marginBottom: '1rem' }}>
            <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 2 }} style={{ background: '#F9731620', padding: '8px', borderRadius: '10px' }}>
              <Terminal size={20} />
            </motion.div>
            <span style={{ fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2.5px' }}>IPC CONTROL TOWER — ROOT</span>
          </div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 900, margin: 0, letterSpacing: '-2px', color: '#0F172A', lineHeight: 1 }}>Platform Engine</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.75rem 0 0 0', fontSize: '1.1rem', fontWeight: 500, maxWidth: '600px', lineHeight: 1.5 }}>
            Cockpit d'administration globale : Gérez vos utilisateurs, durcissez votre sécurité et configurez votre infrastructure métier.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
           <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.75rem 1.5rem', borderRadius: '3rem', border: '1px solid #F9731630' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 10px #10B981' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>Status : Optimal</span>
           </div>
           
           <button className="glass" style={{ padding: '0.9rem', borderRadius: '1.25rem', color: 'var(--text-muted)' }}>
              <Bell size={22} />
           </button>
           <button onClick={() => {
             if(window.confirm('⚠️ EFFACER TOUTES LES DONNÉES : Ceci va supprimer TOUS les enregistrements (clients, commandes, stocks, RH, finance...) irréversiblement. Confirmer ?')) {
                resetAllData();
             }
           }} className="btn-primary" style={{ padding: '0.9rem 2rem', borderRadius: '1.5rem', background: '#EF4444', borderColor: '#EF4444', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Power size={20} /> <span style={{ fontWeight: 800 }}>Effacer les Données</span>
           </button>
        </div>
      </div>

      {/* Admin Navigation Hub */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
      </div>

      {/* Technical Experience Frame */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          style={{ position: 'relative' }}
        >
          {activeTab === 'identity' && <IdentityTab onOpenDetail={onOpenDetail} />}
          {activeTab === 'studio' && <StudioTab />}
          {activeTab === 'config' && <ConfigTab />}
          {activeTab === 'security' && <SecurityTab />}
          {activeTab === 'health' && <HealthTab />}
          {activeTab === 'masterdata' && (
            <div style={{ background: 'var(--bg)', borderRadius: '1.5rem', overflow: 'hidden' }}>
              <MasterData onOpenDetail={onOpenDetail} />
            </div>
          )}
          {activeTab === 'history' && (
            <div style={{ background: 'var(--bg)', borderRadius: '1.5rem', overflow: 'hidden' }}>
              <History onOpenDetail={onOpenDetail} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Cyber Security Footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ marginTop: '2rem', padding: '2rem', borderRadius: '2.5rem', background: '#0F172A', color: 'white', display: 'flex', alignItems: 'center', gap: '2rem' }}>
         <div style={{ padding: '15px', borderRadius: '20px', background: 'rgba(249, 115, 22, 0.2)', color: '#F97316' }}>
            <ShieldCheck size={32} />
         </div>
         <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', color: '#F97316', marginBottom: '8px' }}>Identity & Security Shield</h4>
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 500, lineHeight: 1.4, opacity: 0.7 }}>
               "Surveillance active : Toutes les sessions sont authentifiées via les protocoles de sécurité IPC. Aucun accès non autorisé détecté sur les dernières 24 heures."
            </p>
         </div>
      </motion.div>
    </div>
  );
};

export default ControlHub;
