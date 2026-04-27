import React from 'react';
import { Sun, Moon, Cpu, Menu, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = ({ theme, setView }) => {
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
            <img src="/logo.png" alt="I.P.C" className="logo-img" />
          </div>
          <span style={{ 
            fontSize: '1.5rem', 
            fontWeight: 800, 
            color: 'var(--primary)',
            fontFamily: 'var(--font-heading)',
            letterSpacing: '-1px'
          }}>
            I.P.C
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
