import React, { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowRight, Play, ChevronDown, Cloud, ShieldCheck, Network, BrainCircuit } from 'lucide-react';

// ── Animation presets ─────────────────────────────────────────────────────────
const EASE = [0.16, 1, 0.3, 1];

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.55, ease: EASE } },
};

// ── Feature pills (row under CTAs) ───────────────────────────────────────────
const FEATURES = [
  { icon: Cloud,         label: '100% Cloud' },
  { icon: ShieldCheck,   label: 'Sécurisé' },
  { icon: Network,       label: 'Multi-filiales' },
  { icon: BrainCircuit,  label: 'IA intégrée' },
];


// ── Inline styles ─────────────────────────────────────────────────────────────
const S = {
  // ---- outer wrapper
  section: {
    position: 'relative',
    minHeight: '100svh',
    background: '#ffffff',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
  },

  // ---- hero body (text + video)
  heroBody: {
    position: 'relative',
    width: '100%',
    minHeight: '100svh',
    display: 'flex',
    alignItems: 'center',
  },

  // ---- video wrapper — right side, absolute
  videoWrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '65%',
    height: '100%',
    zIndex: 0,
    overflow: 'hidden',
  },

  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center top',
    display: 'block',
  },

  // white → transparent fade so text reads cleanly
  videoBlend: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(90deg, #ffffff 0%, #ffffff 22%, rgba(255,255,255,0.88) 38%, rgba(255,255,255,0.3) 56%, transparent 74%)',
    zIndex: 1,
    pointerEvents: 'none',
  },

  // top and bottom vignette
  videoVignetteTop: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 100,
    background: 'linear-gradient(to bottom, #ffffff 0%, transparent 100%)',
    zIndex: 1,
    pointerEvents: 'none',
  },
  videoVignetteBottom: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 120,
    background: 'linear-gradient(to top, #ffffff 0%, transparent 100%)',
    zIndex: 1,
    pointerEvents: 'none',
  },

  // ---- text content
  content: {
    position: 'relative',
    zIndex: 2,
    maxWidth: 1280,
    margin: '0 auto',
    padding: '5rem 2rem 3rem',
    width: '100%',
  },

  textBlock: {
    maxWidth: 520,
  },

  // badge
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '5px 14px 5px 10px',
    borderRadius: 999,
    background: 'rgba(5,150,105,0.08)',
    border: '1px solid rgba(5,150,105,0.2)',
    marginBottom: '1.4rem',
    cursor: 'default',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#059669',
    boxShadow: '0 0 6px rgba(5,150,105,0.6)',
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 700,
    color: '#059669',
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
  },

  // headline
  headline: {
    margin: '0 0 1.25rem',
    fontSize: 'clamp(2.6rem, 5.2vw, 4rem)',
    fontWeight: 900,
    lineHeight: 1.08,
    letterSpacing: '-0.03em',
    color: '#0A1A12',
  },
  headlineAccent: {
    color: '#059669',
    display: 'inline',
  },

  // description
  description: {
    margin: '0 0 2rem',
    fontSize: 'clamp(1rem, 1.7vw, 1.125rem)',
    lineHeight: 1.72,
    color: '#4B5563',
    maxWidth: 480,
    fontWeight: 400,
  },

  // CTAs
  ctaGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.875rem',
    marginBottom: '2rem',
  },

  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '0.875rem 1.875rem',
    borderRadius: 12,
    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    color: '#fff',
    fontWeight: 800,
    fontSize: '1rem',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(5,150,105,0.35)',
    letterSpacing: '-0.01em',
    outline: 'none',
    WebkitTapHighlightColor: 'transparent',
  },

  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '0.875rem 1.625rem',
    borderRadius: 12,
    background: 'transparent',
    color: '#111827',
    fontWeight: 700,
    fontSize: '1rem',
    border: '1.5px solid #E5E7EB',
    cursor: 'pointer',
    letterSpacing: '-0.01em',
    outline: 'none',
    WebkitTapHighlightColor: 'transparent',
  },

  // feature pills
  featureRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1.25rem',
    alignItems: 'center',
  },
  featurePill: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
  },

  // scroll hint
  scrollHint: {
    position: 'absolute',
    bottom: '2rem',
    right: '2rem',
    zIndex: 3,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    cursor: 'default',
    userSelect: 'none',
  },
};

// ── Scroll hint ───────────────────────────────────────────────────────────────
function ScrollHint({ reduced }) {
  return (
    <motion.div
      style={S.scrollHint}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2, duration: 0.6 }}
      aria-hidden="true"
    >
      <span>Défiler</span>
      <motion.div
        animate={reduced ? {} : { y: [0, 5, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ChevronDown size={14} />
      </motion.div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function HeroSection({ onCTA }) {
  const reduced = useReducedMotion();
  const videoRef = useRef(null);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 380], [1, 0]);
  const heroY       = useTransform(scrollY, [0, 380], [0, reduced ? 0 : -48]);

  // Ensure video plays after mount (autoplay policy)
  useEffect(() => {
    const v = videoRef.current;
    if (!v || reduced) return;
    v.play().catch(() => {/* blocked by browser policy — video stays paused */});
  }, [reduced]);

  return (
    <section id="hero" style={S.section}>

      {/* ── Hero body ── */}
      <div style={S.heroBody}>

        {/* Video — right side */}
        {!reduced && (
          <div style={S.videoWrap} aria-hidden="true">
            <video
              ref={videoRef}
              src="/videos/hero-scene.mp4"
              style={S.video}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            />
            {/* Blends video into white text area */}
            <div style={S.videoBlend} />
            <div style={S.videoVignetteTop} />
            <div style={S.videoVignetteBottom} />
          </div>
        )}

        {/* Text content */}
        <motion.div style={{ ...S.content, opacity: heroOpacity, y: heroY }}>
          <motion.div
            style={S.textBlock}
            variants={stagger}
            initial="hidden"
            animate="visible"
          >

            {/* Badge */}
            <motion.div variants={fadeUp}>
              <div style={S.badge}>
                <span style={S.badgeDot} />
                <span style={S.badgeText}>Nouvelle Génération</span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1 style={S.headline} variants={fadeUp}>
              Visualisez{' '}
              <span style={S.headlineAccent}>votre entreprise</span>
              {' '}en temps réel
            </motion.h1>

            {/* Sub-copy */}
            <motion.p style={S.description} variants={fadeUp}>
              I.P.C centralise, connecte et intelligentise vos opérations.
              Prenez de meilleures décisions grâce à une vision 360°
              de votre activité.
            </motion.p>

            {/* CTAs */}
            <motion.div style={S.ctaGroup} variants={fadeUp}>
              <motion.button
                style={S.btnPrimary}
                onClick={onCTA}
                whileHover={reduced ? {} : {
                  scale: 1.04,
                  y: -2,
                  boxShadow: '0 8px 28px rgba(5,150,105,0.45)',
                }}
                whileTap={reduced ? {} : { scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 420, damping: 18 }}
              >
                Demander une démo
                <ArrowRight size={17} />
              </motion.button>

              <motion.button
                style={S.btnSecondary}
                onClick={() => document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' })}
                whileHover={reduced ? {} : {
                  scale: 1.02,
                  borderColor: '#D1D5DB',
                  background: '#F9FAFB',
                }}
                whileTap={reduced ? {} : { scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 420, damping: 18 }}
              >
                <Play size={15} fill="currentColor" />
                Découvrir la plateforme
              </motion.button>
            </motion.div>

            {/* Feature pills */}
            <motion.div style={S.featureRow} variants={fadeIn}>
              {FEATURES.map(({ icon: Icon, label }) => (
                <div key={label} style={S.featurePill}>
                  <Icon size={14} color="#059669" strokeWidth={2} />
                  {label}
                </div>
              ))}
            </motion.div>

          </motion.div>
        </motion.div>

        <ScrollHint reduced={reduced} />
      </div>

    </section>
  );
}
