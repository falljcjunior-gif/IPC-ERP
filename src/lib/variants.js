/**
 * ════════════════════════════════════════════════════════════════════════════
 * ANTIGRAVITY MOTION — Shared Framer Motion Variants
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Centralised animation vocabulary for the Antigravity design system.
 * All variants respect `prefers-reduced-motion` via `useMotionVariants()`.
 *
 * Usage (components):
 *   import { useMotionVariants } from '@/lib/variants';
 *   const v = useMotionVariants();
 *   <motion.div variants={v.fadeUp} initial="hidden" animate="show" />
 *
 * Usage (plain variants, no hook needed for static animation objects):
 *   import { fadeUp, staggerChildren } from '@/lib/variants';
 *   <motion.div initial={fadeUp.hidden} animate={fadeUp.show} />
 *
 * Design constraints (Antigravity Protocol):
 *   - Translate range: ±20px maximum (subtle, not distracting)
 *   - Scale range: 0.92–1.0 (perceivable but not jarring)
 *   - Duration: 0.2–0.4s on content, 0.5–0.7s on hero/landing elements
 *   - Always use opacity as the primary transition property
 *   - Spring animations: stiffness 280–340, damping 24–32
 */

import { useReducedMotion } from 'framer-motion';

// ── Easing presets ────────────────────────────────────────────────────────────

/** Standard easing for entering elements */
export const EASE_IN  = [0.0, 0.0, 0.2, 1.0];
/** Standard easing for exiting elements */
export const EASE_OUT = [0.4, 0.0, 1.0, 1.0];
/** Smooth in-out for content transitions */
export const EASE_IO  = [0.4, 0.0, 0.2, 1.0];

// ── Transition presets ────────────────────────────────────────────────────────

export const TRANSITION_FAST   = { duration: 0.18, ease: EASE_IO };
export const TRANSITION_NORMAL = { duration: 0.30, ease: EASE_IO };
export const TRANSITION_SLOW   = { duration: 0.50, ease: EASE_IO };
export const TRANSITION_SPRING = { type: 'spring', stiffness: 300, damping: 28 };
export const TRANSITION_SNAPPY = { type: 'spring', stiffness: 400, damping: 35 };

/**
 * Instant transition for `prefers-reduced-motion` — only opacity, very short.
 * Used by useMotionVariants() to swap out all movement transitions.
 */
const TRANSITION_REDUCED = { duration: 0.01 };

// ── Variant factories ─────────────────────────────────────────────────────────

/** Fade in from transparent */
export const fadeIn = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: TRANSITION_NORMAL },
  exit:   { opacity: 0, transition: TRANSITION_FAST },
};

/** Fade up — content entering from slightly below */
export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0,  transition: TRANSITION_NORMAL },
  exit:   { opacity: 0, y: -20, transition: TRANSITION_FAST },
};

/** Fade down — content entering from slightly above (e.g. dropdowns) */
export const fadeDown = {
  hidden: { opacity: 0, y: -12 },
  show:   { opacity: 1, y: 0,   transition: TRANSITION_NORMAL },
  exit:   { opacity: 0, y: -8,  transition: TRANSITION_FAST },
};

/** Scale in — for modals, dialogs, and elevated surfaces */
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.93, y: 16 },
  show:   { opacity: 1, scale: 1,    y: 0,  transition: TRANSITION_SPRING },
  exit:   { opacity: 0, scale: 0.96, y: 8,  transition: TRANSITION_FAST },
};

/** Slide in from the right — wizard steps, lateral navigation */
export const slideInRight = {
  hidden: { opacity: 0, x: 24 },
  show:   { opacity: 1, x: 0,  transition: TRANSITION_NORMAL },
  exit:   { opacity: 0, x: -24, transition: TRANSITION_FAST },
};

/** Slide in from the left — back navigation */
export const slideInLeft = {
  hidden: { opacity: 0, x: -24 },
  show:   { opacity: 1, x: 0,   transition: TRANSITION_NORMAL },
  exit:   { opacity: 0, x: 24,  transition: TRANSITION_FAST },
};

/** Container variant — staggers its children by 50ms */
export const staggerChildren = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren:   0.05,
    },
  },
};

/** Child variant for staggered lists — pairs with staggerChildren */
export const listItem = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: TRANSITION_NORMAL },
};

/** KPI card — subtle lift with a quick spring */
export const cardPop = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  show:   { opacity: 1, scale: 1,    y: 0,  transition: TRANSITION_SNAPPY },
};

/** Overlay / backdrop — simple opacity */
export const backdrop = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: TRANSITION_FAST },
  exit:   { opacity: 0, transition: TRANSITION_FAST },
};

/** Sidebar — slides in from the left edge */
export const sidebar = {
  hidden: { x: -100, opacity: 0 },
  show: {
    x:         0,
    opacity:   1,
    transition: { type: 'spring', stiffness: 280, damping: 30 },
  },
  exit: { x: -80, opacity: 0, transition: TRANSITION_FAST },
};

// ── Reduced-motion versions ───────────────────────────────────────────────────
// Opacity-only, near-instant. No spatial movement.

function reduceVariant(variant) {
  const reduce = (state) => {
    if (state === undefined) return undefined;
    const { x: _x, y: _y, scale: _s, ...rest } = state;
    return {
      ...rest,
      ...(rest.transition ? { transition: TRANSITION_REDUCED } : {}),
    };
  };

  return {
    hidden: reduce(variant.hidden),
    show:   reduce(variant.show),
    ...(variant.exit ? { exit: reduce(variant.exit) } : {}),
  };
}

/** All variant names in the library */
const ALL_VARIANTS = {
  fadeIn,
  fadeUp,
  fadeDown,
  scaleIn,
  slideInRight,
  slideInLeft,
  staggerChildren,
  listItem,
  cardPop,
  backdrop,
  sidebar,
};

// ── useMotionVariants hook ────────────────────────────────────────────────────

/**
 * Returns the full variant library.
 * When `prefers-reduced-motion: reduce` is set, all variants are replaced
 * with opacity-only, near-instant equivalents that preserve enter/exit
 * semantics without spatial movement.
 *
 * @returns {Record<string, object>} variant map
 *
 * @example
 * const v = useMotionVariants();
 * <motion.div variants={v.fadeUp} initial="hidden" animate="show" exit="exit" />
 */
export function useMotionVariants() {
  const shouldReduce = useReducedMotion();

  if (!shouldReduce) return ALL_VARIANTS;

  // Build reduced set once per render (useReducedMotion result is stable)
  return Object.fromEntries(
    Object.entries(ALL_VARIANTS).map(([key, variant]) => [key, reduceVariant(variant)])
  );
}

// ── JSX components ────────────────────────────────────────────────────────────
// PageTransition and FadeIn live in MotionComponents.jsx (JSX file).
// Import from there:
//   import { PageTransition, FadeIn } from '@/lib/MotionComponents';
