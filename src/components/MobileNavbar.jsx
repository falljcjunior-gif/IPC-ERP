import React from 'react';
import { motion } from 'framer-motion';
import { 
  Home, Grid, Search, Sparkles, 
  MessageCircle, User, Bell 
} from 'lucide-react';

const MobileNavbar = ({ activeApp, setActiveApp, onOpenAI, onOpenSearch }) => {
  const items = [
    { id: 'home', icon: <Home size={20} />, label: 'Home' },
    { id: 'search', icon: <Search size={20} />, label: 'Chercher', action: onOpenSearch },
    { id: 'ai', icon: <Sparkles size={24} />, label: 'IA', action: onOpenAI, primary: true },
    { id: 'notifications', icon: <Bell size={20} />, label: 'Notifs' },
    { id: 'menu', icon: <Grid size={20} />, label: 'Menu' },
  ];

  return (
    <div className="glass" style={{
      position: 'fixed', bottom: '1.5rem', left: '1rem', right: '1rem',
      height: '70px', borderRadius: '2rem', display: 'flex', 
      alignItems: 'center', justifyContent: 'space-around',
      padding: '0 0.5rem', zIndex: 1100,
      background: 'rgba(255, 255, 255, 0.85)',
      border: '1px solid rgba(255, 255, 255, 0.4)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
    }}>
      {items.map((item) => {
        const isActive = activeApp === item.id;
        
        return (
          <motion.button
            key={item.id}
            whileTap={{ scale: 0.9 }}
            onClick={() => item.action ? item.action() : setActiveApp(item.id)}
            style={{
              background: item.primary ? 'var(--accent)' : 'transparent',
              color: item.primary ? 'white' : (isActive ? 'var(--accent)' : 'var(--text-muted)'),
              border: 'none',
              padding: item.primary ? '12px' : '8px',
              borderRadius: item.primary ? '1.5rem' : '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              position: item.primary ? 'relative' : 'static',
              top: item.primary ? '-15px' : 'auto',
              boxShadow: item.primary ? '0 8px 20px rgba(82, 153, 144, 0.4)' : 'none'
            }}
          >
            {item.icon}
            {!item.primary && <span style={{ fontSize: '0.6rem', fontWeight: 800 }}>{item.label}</span>}
          </motion.button>
        );
      })}
    </div>
  );
};

export default MobileNavbar;
