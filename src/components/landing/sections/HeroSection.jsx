import React from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronDown, Play, Zap } from 'lucide-react';
import AfricanWorkplaceScene from '../AfricanWorkplaceScene';

// ── Animation presets ─────────────────────────────────────────────────────────
const EASE = [0.16, 1, 0.3, 1];

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.11, delayChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.72, ease: EASE } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease: EASE } },
};

// ── Inline styles so the dark theme is self-contained (no global CSS dep) ─────
const S = {
  section: {
    position: 'relative',
    minHeight: '100svh',
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
    // Dark emerald gradient matching the scene
    background: 'linear-gradient(135deg, #020D06 0%, #031A0E 45%, #041F10 75%, #052516 100%)',
  },

  // Ambient top-left glow for depth
  glowTL: {
    position: 'absolute',
    top: '-10%',
    left: '-5%',
    width: 640,
    height: 640,
    borderRadius: '50%',
    background: 'radial-gradient(ellipse, rgba(16,185,129,0.08) 0%, rgba(6,78,59,0.04) 40%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
  },

  // Ambient bottom-right glow
  glowBR: {
    position: 'absolute',
    bottom: '-20%',
    right: '-5%',
    width: 500,
    height: 500,
    borderRadius: '50%',
    background: 'radial-gradient(ellipse, rgba(6,78,59,0.1) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
  },

  // Scene container (right side)
  sceneWrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '58%',
    height: '100%',
    zIndex: 1,
    pointerEvents: 'none',
  },

  // Left-to-right fade so scene bleeds into text area
  blendOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(90deg, #020D06 30%, rgba(2,13,6,0.75) 55%, rgba(2,13,6,0.08) 78%, transparent 92%)',
    zIndex: 2,
    pointerEvents: 'none',
  },

  // Grid noise texture subtle overlay
  noise: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E")`,
    opacity: 0.4,
    pointerEvents: 'none',
    zIndex: 1,
    mixBlendMode: 'overlay',
  },

  // Content wrapper
  content: {
    position: 'relative',
    zIndex: 3,
    maxWidth: 1280,
    margin: '0 auto',
    padding: '7rem 2rem 4rem',
    width: '100%',
  },

  // Badge chip
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 14px 6px 10px',
    borderRadius: 999,
    background: 'rgba(16,185,129,0.1)',
    border: '1px solid rgba(52,211,153,0.25)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    marginBottom: '1.5rem',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#34D399',
    boxShadow: '0 0 8px rgba(52,211,153,0.8)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 700,
    color: 'rgba(52,211,153,0.9)',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },

  // Headline
  headline: {
    margin: '0 0 1.5rem',
    fontSize: 'clamp(2.4rem, 5.5vw, 4rem)',
    fontWeight: 900,
    lineHeight: 1.1,
    letterSpacing: '-0.03em',
    color: '#F0FDF4',
  },
  headlineAccent: {
    background: 'linear-gradient(135deg, #34D399 0%, #10B981 50%, #059669 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    display: 'inline',
  },

  // Sub-copy
  description: {
    margin: '0 0 2.25rem',
    fontSize: 'clamp(1rem, 1.8vw, 1.15rem)',
    lineHeight: 1.7,
    color: 'rgba(209,250,229,0.62)',
    maxWidth: 520,
    fontWeight: 400,
  },

  // CTA row
  ctaGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.875rem',
    marginBottom: '2.75rem',
  },

  // Primary CTA
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '0.9rem 2rem',
    borderRadius: 14,
    background: 'linear-gradient(135deg, #059669 0%, #047857 60%, #065F46 100%)',
    color: '#F0FDF4',
    fontWeight: 800,
    fontSize: '1.0625rem',
    border: '1px solid rgba(52,211,153,0.35)',
    cursor: 'pointer',
    boxShadow: '0 8px 32px rgba(5,150,105,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
    letterSpacing: '-0.01em',
    outline: 'none',
    WebkitTapHighlightColor: 'transparent',
  },

  // Secondary CTA
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '0.9rem 1.75rem',
    borderRadius: 14,
    background: 'rgba(255,255,255,0.04)',
    color: 'rgba(209,250,229,0.85)',
    fontWeight: 700,
    fontSize: '1.0625rem',
    border: '1px solid rgba(52,211,153,0.15)',
    cursor: 'pointer',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    letterSpacing: '-0.01em',
    outline: 'none',
    WebkitTapHighlightColor: 'transparent',
  },

  // Stats row
  stats: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
    flexWrap: 'wrap',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  statValue: {
    fontSize: 'clamp(1.45rem, 2.8vw, 1.9rem)',
    fontWeight: 900,
    color: '#F0FDF4',
    letterSpacing: '-0.03em',
    lineHeight: 1.1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: 'rgba(52,211,153,0.6)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 32,
    background: 'rgba(52,211,153,0.12)',
    borderRadius: 1,
    flexShrink: 0,
  },

  // Scroll hint
  scrollHint: {
    position: 'absolute',
    bottom: '2rem',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 4,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    color: 'rgba(52,211,153,0.45)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    cursor: 'default',
    userSelect: 'none',
  },
};

// ── Scroll-animated chevron ───────────────────────────────────────────────────
function ScrollArrow() {
  return (
    <motion.div
      animate={{ y: [0, 5, 0] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
    >
      <ChevronDown size={16} />
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function HeroSection({ onCTA }) {
  const shouldReduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 420], [1, 0]);
  const heroY       = useTransform(scrollY, [0, 420], [0, shouldReduceMotion ? 0 : -56]);

  return (
    <section id="hero" style={S.section}>
      {/* Ambient glows */}
      <div style={S.glowTL} />
      <div style={S.glowBR} />

      {/* Noise texture */}
      <div style={S.noise} aria-hidden="true" />

      {/* Scene — right side */}
      <div style={S.sceneWrap} aria-hidden="true">
        <AfricanWorkplaceScene />
      </div>

      {/* Left-to-right blend */}
      <div style={S.blendOverlay} aria-hidden="true" />

      {/* Text content */}
      <motion.div style={{ ...S.content, opacity: heroOpacity, y: heroY }}>
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          style={{ maxWidth: 580 }}
        >
          {/* Badge */}
          <motion.div variants={fadeUp}>
            <div style={S.badge}>
              <span style={S.badgeDot} />
              <Zap size={12} color="#34D399" />
              <span style={S.badgeText}>ERP Intelligence — Nouvelle Génération</span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1 style={S.headline} variants={fadeUp}>
            Pilotez votre{' '}
            <span style={S.headlineAccent}>entreprise africaine</span>
            {' '}en temps réel
          </motion.h1>

          {/* Description */}
          <motion.p style={S.description} variants={fadeUp}>
            I.P.C unifie finance, RH, CRM, production et stock dans une seule
            expérience — fluide, intelligente, taillée pour les groupes africains
            multi-filiales.
          </motion.p>

          {/* CTAs */}
          <motion.div style={S.ctaGroup} variants={fadeUp}>
            <motion.button
              style={S.btnPrimary}
              onClick={onCTA}
              whileHover={shouldReduceMotion ? {} : {
                scale: 1.04,
                y: -2,
                boxShadow: '0 12px 40px rgba(5,150,105,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 420, damping: 18 }}
            >
              Demander une démo
              <ArrowRight size={18} />
            </motion.button>

            <motion.button
              style={S.btnSecondary}
              onClick={() => document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' })}
              whileHover={shouldReduceMotion ? {} : {
                scale: 1.02,
                background: 'rgba(255,255,255,0.07)',
                borderColor: 'rgba(52,211,153,0.28)',
              }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 420, damping: 18 }}
            >
              <Play size={15} fill="currentColor" />
              Voir en action
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div style={S.stats} variants={fadeIn}>
            {[
              { value: '500+',  label: 'Entreprises' },
              null,
              { value: '99.9%', label: 'Uptime SLA' },
              null,
              { value: '< 2s',  label: 'Chargement' },
              null,
              { value: '12+',   label: 'Pays couverts' },
            ].map((item, i) =>
              item === null ? (
                <div key={i} style={S.statDivider} aria-hidden="true" />
              ) : (
                <div key={i} style={S.stat}>
                  <span style={S.statValue}>{item.value}</span>
                  <span style={S.statLabel}>{item.label}</span>
                </div>
              )
            )}
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        style={S.scrollHint}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.7 }}
        aria-hidden="true"
      >
        <span>Défiler</span>
        {!shouldReduceMotion && <ScrollArrow />}
        {shouldReduceMotion && <ChevronDown size={16} />}
      </motion.div>
    </section>
  );
}
