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
      {/* Logo */}
      <div className="landing-nav-logo">
        <svg width="24" height="21" viewBox="0 0 64 56" fill="none">
          <path d="M2 20 L18 11 L34 20 L18 29 Z" fill="#064E3B" />
          <path d="M2 20 L2 36 L18 45 L18 29 Z" fill="rgba(6,78,59,0.4)" />
          <path d="M34 20 L34 36 L18 45 L18 29 Z" fill="rgba(6,78,59,0.25)" />
          <path d="M30 8 L46 0 L62 8 L46 16 Z" fill="rgba(6,78,59,0.85)" />
          <path d="M30 8 L30 24 L46 32 L46 16 Z" fill="rgba(6,78,59,0.3)" />
          <path d="M62 8 L62 24 L46 32 L46 16 Z" fill="rgba(6,78,59,0.15)" />
        </svg>
        I.P.C Intelligence
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
