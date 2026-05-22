import React, { useState, useEffect } from 'react';
import { motion, useScroll, useSpring, useReducedMotion } from 'framer-motion';
import './LandingPage.css';

import HeroSection from './sections/HeroSection';
import ChaosSection from './sections/ChaosSection';
import SolutionSection from './sections/SolutionSection';
import ModulesSection from './sections/ModulesSection';
import DashboardSection from './sections/DashboardSection';
import DemoSection from './sections/DemoSection';
import CTASection from './sections/CTASection';

const NAV_LINKS = [
  { label: 'Solution', href: '#hero' },
  { label: 'Modules', href: '#modules' },
  { label: 'Dashboard', href: '#dashboard' },
  { label: 'Démo', href: '#demo-section' },
];

function LandingNav({ onCTA }) {
  const [scrolled, setScrolled] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrollTo = (href) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.nav
      className={`landing-nav${scrolled ? ' scrolled' : ''}`}
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Logos */}
      <div className="landing-nav-logo" style={{ gap: '0.75rem' }}>
        <img src="/logo-holding.png" alt="IPC Green Blocks Holding" style={{ height: 36, objectFit: 'contain' }} />
        <div style={{ width: 1, height: 22, background: 'var(--border)', flexShrink: 0 }} />
        <img src="/logo-filiale.png" alt="IPC Green Blocks" style={{ height: 36, objectFit: 'contain' }} />
        <div style={{ width: 1, height: 22, background: 'var(--border)', flexShrink: 0 }} />
        <img src="/logo-fondation.png" alt="Fondation IPC Collect" style={{ height: 36, objectFit: 'contain' }} />
      </div>

      {/* Links */}
      <nav className="landing-nav-links">
        {NAV_LINKS.map((link) => (
          <a key={link.label} onClick={() => scrollTo(link.href)}>
            {link.label}
          </a>
        ))}
      </nav>

      {/* CTAs */}
      <div className="landing-nav-cta">
        <motion.button
          className="btn btn-ghost"
          style={{ fontSize: '0.875rem', padding: '0.5rem 1.25rem' }}
          onClick={onCTA}
          whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          Se connecter
        </motion.button>
        <motion.button
          className="btn btn-primary"
          style={{ fontSize: '0.875rem', padding: '0.5rem 1.25rem' }}
          onClick={onCTA}
          whileHover={shouldReduceMotion ? {} : { scale: 1.03, y: -1 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          Demander une démo
        </motion.button>
      </div>
    </motion.nav>
  );
}

export default function LandingPage({ onCTA }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <div style={{ background: 'var(--bg)', overflowX: 'hidden' }}>
      {/* Scroll progress bar */}
      <motion.div
        className="landing-scroll-bar"
        style={{ scaleX }}
      />

      {/* Navigation */}
      <LandingNav onCTA={onCTA} />

      {/* Sections */}
      <HeroSection onCTA={onCTA} />
      <ChaosSection />
      <SolutionSection />
      <ModulesSection />
      <DashboardSection />
      <DemoSection />
      <CTASection onCTA={onCTA} />
    </div>
  );
}
