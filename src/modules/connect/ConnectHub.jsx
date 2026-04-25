import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, LayoutGrid, Users, Calendar, 
  Sparkles, Zap, Heart, Search, Bell, Settings, X, ToggleLeft, ToggleRight
} from 'lucide-react';
import { useStore } from '../../store';

// Components
import TabBar from '../marketing/components/TabBar';
import WallTab from './tabs/WallTab';
import MessengerTab from './tabs/MessengerTab';
import DirectoryTab from './tabs/DirectoryTab';
import EventsTab from './tabs/EventsTab';

const ConnectHub = ({ onOpenDetail }) => {
  const { data, currentUser, navigationIntent, setNavigationIntent, shellView } = useStore();
  const [activeTab, setActiveTab] = useState('wall');
  const [showSettings, setShowSettings] = useState(false);
  const [connectSettings, setConnectSettings] = useState({
    notifyMentions: true,
    notifyLikes: true,
    notifyComments: true,
    publicProfile: true,
    showStatus: true,
  });

  // Deep Link Handling
  useEffect(() => {
    if (navigationIntent && navigationIntent.module === 'connect') {
      if (navigationIntent.tab) setActiveTab(navigationIntent.tab);
    }
  }, [navigationIntent]);

  const tabs = [
    { id: 'wall', label: 'Mur Enterprise', icon: <LayoutGrid size={16} /> },
    { id: 'messenger', label: 'Messenger', icon: <MessageCircle size={16} /> },
    { id: 'directory', label: 'Annuaire Staff', icon: <Users size={16} /> },
    { id: 'events', label: 'IPC Life', icon: <Calendar size={16} /> },
  ];

  return (
    <div style={{ padding: shellView?.mobile ? '0.75rem' : '2.5rem', display: 'flex', flexDirection: 'column', gap: shellView?.mobile ? '1rem' : '3rem', minHeight: '100%', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.02) 0%, rgba(99, 102, 241, 0.02) 100%)' }}>
      
      {/* Header : masqué sur mobile, plein sur desktop */}
      {!shellView?.mobile && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#8B5CF6', marginBottom: '1rem' }}>
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 4 }} style={{ background: '#8B5CF620', padding: '8px', borderRadius: '10px' }}>
                <Zap size={20} />
              </motion.div>
              <span style={{ fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2.5px' }}>IPC CONNECT OS</span>
            </div>
            <h1 style={{ fontSize: '3.5rem', fontWeight: 900, margin: 0, letterSpacing: '-2px', color: 'var(--text)', lineHeight: 1 }}>Human Synergy</h1>
            <p style={{ color: 'var(--text-muted)', margin: '0.75rem 0 0 0', fontSize: '1.1rem', fontWeight: 500, maxWidth: '600px', lineHeight: 1.5 }}>
              Votre écosystème collaboratif intelligent : Communiquez, collaborez et célébrez la culture de l'entreprise au même endroit.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
             <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.75rem 1.5rem', borderRadius: '3rem', border: '1px solid #8B5CF630' }}>
                <Heart size={16} color="#8B5CF6" />
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#8B5CF6' }}>Cœur Social : 100% Connecté</span>
             </div>
             <button onClick={() => setShowSettings(true)} className="glass" style={{ padding: '0.9rem', borderRadius: '1.25rem', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', background: 'white' }}>
                <Settings size={22} />
             </button>
             <button className="btn-primary" style={{ padding: '0.9rem 2rem', borderRadius: '1.5rem', background: '#0F172A', borderColor: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Sparkles size={20} /> <span style={{ fontWeight: 800 }}>IA Social Pulse</span>
             </button>
          </div>
        </div>
      )}
      {/* Header mobile minimaliste */}
      {shellView?.mobile && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.3rem', color: 'var(--text)' }}>Connect+</h2>
          <button onClick={() => setShowSettings(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.4rem' }}>
            <Settings size={22} />
          </button>
        </div>
      )}

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={e => e.target === e.currentTarget && setShowSettings(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              style={{ background: 'var(--bg)', borderRadius: '2rem', padding: '2.5rem', width: '480px', maxWidth: '95vw', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.3rem' }}>Paramètres IPC Connect</h3>
                <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { key: 'notifyMentions', label: 'Notifications de mentions', desc: 'Vous alerter quand quelqu\'un vous mentionne' },
                  { key: 'notifyLikes', label: 'Notifications de likes', desc: 'Vous alerter quand vos posts reçoivent des réactions' },
                  { key: 'notifyComments', label: 'Notifications de commentaires', desc: 'Vous alerter sur les nouveaux commentaires' },
                  { key: 'publicProfile', label: 'Profil public dans l\'annuaire', desc: 'Visible par tous les collaborateurs' },
                  { key: 'showStatus', label: 'Afficher mon statut de présence', desc: 'Montrer si vous êtes en ligne' },
                ].map(s => (
                  <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderRadius: '1rem', background: 'var(--bg-subtle)' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{s.label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{s.desc}</div>
                    </div>
                    <button onClick={() => setConnectSettings(p => ({ ...p, [s.key]: !p[s.key] }))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: connectSettings[s.key] ? '#8B5CF6' : 'var(--text-muted)' }}>
                      {connectSettings[s.key] ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowSettings(false)}
                style={{ width: '100%', marginTop: '1.5rem', padding: '0.9rem', borderRadius: '1rem', background: '#8B5CF6', color: 'white', border: 'none', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer' }}>
                Sauvegarder
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connectivity Navigation */}
      <div style={{ overflow: 'hidden' }}>
        <TabBar tabs={tabs} active={activeTab} onChange={(t) => { setActiveTab(t); setNavigationIntent(null); }} />
      </div>

      {/* Social Experience Frame */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -15, filter: 'blur(10px)' }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          style={{ position: 'relative' }}
        >
          {activeTab === 'wall' && <WallTab data={data} currentUser={currentUser} />}
          {activeTab === 'messenger' && <MessengerTab onOpenDetail={onOpenDetail} navigationIntent={navigationIntent} />}
          {activeTab === 'directory' && <DirectoryTab data={data} onOpenDetail={onOpenDetail} />}
          {activeTab === 'events' && <EventsTab data={data} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ConnectHub;
