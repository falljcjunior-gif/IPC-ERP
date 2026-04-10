import React from 'react';
import { Sun, Moon, Cpu, Menu, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = ({ theme, toggleTheme, setView }) => {
  return (
    <nav className="glass" style={{
      position: 'fixed',
      top: 0,
      width: '100%',
      zIndex: 1000,
      padding: '1rem 0'
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <motion.div 
          whileHover={{ scale: 1.05 }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
          onClick={() => setView('landing')}
        >
          <div style={{ width: '40px', height: '40px' }}>
            <img src="/logo.png" alt="IPC ERP" className="logo-img" />
          </div>
          <span style={{ 
            fontSize: '1.5rem', 
            fontWeight: 800, 
            color: 'var(--primary)',
            fontFamily: 'var(--font-heading)',
            letterSpacing: '-1px'
          }}>
            IPC ERP
          </span>
        </motion.div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div className="nav-links" style={{ display: 'flex', gap: '2rem', fontWeight: 500 }}>
            <a href="#features" style={{ color: 'var(--text)' }}>Platform</a>
            <a href="#" style={{ color: 'var(--text)' }}>Solutions</a>
            <a href="#" style={{ color: 'var(--text)' }}>Open Source</a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              onClick={toggleTheme}
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button 
              onClick={() => setView('dashboard')}
              className="btn btn-primary"
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}
            >
              Launch App <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
