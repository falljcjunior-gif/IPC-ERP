import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, LayoutGrid, Users, Calendar, 
  Sparkles, Zap, Heart, Search, Bell, Settings
} from 'lucide-react';
import { useBusiness } from '../../BusinessContext';

// Components
import TabBar from '../marketing/components/TabBar';
import WallTab from './tabs/WallTab';
import MessengerTab from './tabs/MessengerTab';
import DirectoryTab from './tabs/DirectoryTab';
import EventsTab from './tabs/EventsTab';

const ConnectHub = ({ onOpenDetail }) => {
  const { data, currentUser } = useBusiness();
  const [activeTab, setActiveTab] = useState('wall');

  const tabs = [
    { id: 'wall', label: 'Mur Enterprise', icon: <LayoutGrid size={16} /> },
    { id: 'messenger', label: 'Messenger', icon: <MessageCircle size={16} /> },
    { id: 'directory', label: 'Annuaire Staff', icon: <Users size={16} /> },
    { id: 'events', label: 'IPC Life', icon: <Calendar size={16} /> },
  ];

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '3rem', minHeight: '1000px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.02) 0%, rgba(99, 102, 241, 0.02) 100%)' }}>
      
      {/* Header : The Social Pulse */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#8B5CF6', marginBottom: '1rem' }}>
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 4 }} style={{ background: '#8B5CF620', padding: '8px', borderRadius: '10px' }}>
              <Zap size={20} />
            </motion.div>
            <span style={{ fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2.5px' }}>IPC CONNECT OS</span>
          </div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 900, margin: 0, letterSpacing: '-2px', color: '#0F172A', lineHeight: 1 }}>Human Synergy</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.75rem 0 0 0', fontSize: '1.1rem', fontWeight: 500, maxWidth: '600px', lineHeight: 1.5 }}>
            Votre écosystème collaboratif intelligent : Communiquez, collaborez et célébrez la culture de l'entreprise au même endroit.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
           <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.75rem 1.5rem', borderRadius: '3rem', border: '1px solid #8B5CF630' }}>
              <Heart size={16} color="#8B5CF6" />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#8B5CF6' }}>Cœur Social : 100% Connecté</span>
           </div>
           
           <button className="glass" style={{ padding: '0.9rem', borderRadius: '1.25rem', color: 'var(--text-muted)' }}>
              <Settings size={22} />
           </button>
           <button className="btn-primary" style={{ padding: '0.9rem 2rem', borderRadius: '1.5rem', background: '#0F172A', borderColor: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Sparkles size={20} /> <span style={{ fontWeight: 800 }}>IA Social Pulse</span>
           </button>
        </div>
      </div>

      {/* Connectivity Navigation */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
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
          {activeTab === 'messenger' && <MessengerTab onOpenDetail={onOpenDetail} />}
          {activeTab === 'directory' && <DirectoryTab data={data} onOpenDetail={onOpenDetail} />}
          {activeTab === 'events' && <EventsTab data={data} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ConnectHub;
