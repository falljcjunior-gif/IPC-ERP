import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Play, Shield, Cpu } from 'lucide-react';

const Hero = ({ setView }) => {
  return (
    <section className="section" style={{ 
      paddingTop: '10rem', 
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Abstract Background Shapes */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
        opacity: 0.1,
        filter: 'blur(80px)',
        zIndex: -1
      }} />
      <div style={{
        position: 'absolute',
        bottom: '0',
        left: '-10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)',
        opacity: 0.1,
        filter: 'blur(80px)',
        zIndex: -1
      }} />

      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--bg-subtle)',
            padding: '0.5rem 1rem',
            borderRadius: '2rem',
            border: '1px solid var(--border)',
            marginBottom: '2rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--accent)'
          }}>
            <Sparkles size={16} /> 
            <span>The Next Generation of Open Source ERP</span>
          </div>

          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', 
            marginBottom: '1.5rem',
            color: 'var(--primary)',
            lineHeight: 1.1,
            letterSpacing: '-2px'
          }}>
            The AI-Powered <br /> 
            <span style={{ 
              background: 'linear-gradient(90deg, var(--primary), var(--accent))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Low Code Platform</span>
          </h1>

          <p style={{ 
            fontSize: '1.25rem', 
            color: 'var(--text-muted)', 
            maxWidth: '700px', 
            margin: '0 auto 3rem',
            lineHeight: 1.6
          }}>
            Experience the ultimate flexibility with I.P.C. A modern, modular ecosystem designed to accelerate your business with AI-integrated workflows and a seamless low-code environment.
          </p>

          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
            <button 
              onClick={() => setView('dashboard')}
              className="btn btn-primary" 
              style={{ fontSize: '1.125rem', padding: '1rem 2rem' }}
            >
              Get Started Free
            </button>
            <button className="btn btn-secondary" style={{ fontSize: '1.125rem', padding: '1rem 2rem' }}>
              <Play size={20} fill="currentColor" /> Watch Demo
            </button>
          </div>
        </motion.div>

        {/* Feature Badges */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          style={{ 
            marginTop: '5rem',
            display: 'flex',
            justifyContent: 'center',
            gap: '3rem',
            flexWrap: 'wrap'
          }}
        >
          {[
            { icon: <Shield size={20} />, text: 'Enterprise Grade' },
            { icon: <Cpu size={20} />, text: 'AI Native' },
            { icon: <Sparkles size={20} />, text: 'Low Code' }
          ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              <div style={{ color: 'var(--accent)' }}>{item.icon}</div>
              {item.text}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
