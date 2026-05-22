import React, { Suspense, lazy } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { Sparkles, ArrowRight, ChevronDown, Play } from 'lucide-react';

const ERPOrbitalScene = lazy(() => import('../three/ERPOrbitalScene'));

const EASE = [0.16, 1, 0.3, 1];

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export default function HeroSection({ onCTA }) {
  const shouldReduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const scrollProgress = useTransform(scrollY, [0, 600], [0, 1]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroY = useTransform(scrollY, [0, 400], [0, shouldReduceMotion ? 0 : -60]);

  return (
    <section
      id="hero"
      style={{
        position: 'relative',
        minHeight: '100svh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        background: 'var(--bg)',
      }}
    >
      {/* 3D Scene Background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '56%',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        <Suspense fallback={null}>
          <ERPOrbitalScene
            scrollProgress={0}
            style={{ width: '100%', height: '100%' }}
          />
        </Suspense>
      </div>

      {/* Gradient overlay to blend 3D with content */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(90deg, rgba(255,255,255,1) 40%, rgba(255,255,255,0.3) 65%, transparent 80%)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <motion.div
        className="hero-content"
        style={{
          position: 'relative',
          zIndex: 3,
          maxWidth: 1200,
          margin: '0 auto',
          padding: '8rem 2rem 4rem',
          width: '100%',
          opacity: heroOpacity,
          y: heroY,
        }}
      >
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          style={{ maxWidth: 580 }}
        >
          {/* Badge */}
          <motion.div variants={fadeUp}>
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              <Sparkles size={14} />
              <span>ERP Intelligence — Nouvelle Génération</span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1 className="hero-headline" variants={fadeUp}>
            Visualisez votre{' '}
            <span className="hero-headline-accent">entreprise en temps réel</span>
          </motion.h1>

          {/* Description */}
          <motion.p className="hero-description" variants={fadeUp}>
            I.P.C transforme la complexité de votre ERP en une expérience visuelle
            fluide et narrative. Chaque département, chaque flux, chaque KPI —
            observables en un coup d'œil.
          </motion.p>

          {/* CTAs */}
          <motion.div className="hero-cta-group" variants={fadeUp}>
            <motion.button
              className="btn btn-primary"
              style={{ fontSize: '1.0625rem', padding: '0.9rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              onClick={onCTA}
              whileHover={shouldReduceMotion ? {} : { scale: 1.03, y: -2 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              Demander une démo
              <ArrowRight size={18} />
            </motion.button>

            <motion.button
              className="btn btn-secondary"
              style={{ fontSize: '1.0625rem', padding: '0.9rem 1.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              onClick={() => document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' })}
              whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Play size={16} fill="currentColor" />
              Voir en action
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div className="hero-stats" variants={fadeUp}>
            {[
              { value: '500+', label: 'Entreprises' },
              null,
              { value: '99.9%', label: 'Uptime SLA' },
              null,
              { value: '< 2s', label: 'Chargement' },
            ].map((item, i) =>
              item === null ? (
                <div key={i} className="hero-stat-divider" />
              ) : (
                <div key={i} className="hero-stat">
                  <span className="hero-stat-value">{item.value}</span>
                  <span className="hero-stat-label">{item.label}</span>
                </div>
              )
            )}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        className="hero-scroll-hint"
        style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 4 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
      >
        <span>Défiler pour explorer</span>
        <ChevronDown size={18} className="hero-scroll-arrow" />
      </motion.div>
    </section>
  );
}
