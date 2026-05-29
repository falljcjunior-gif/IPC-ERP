/**
 * Unit tests — src/lib/variants.js
 *
 * Verifies:
 *   - All exported variant objects have hidden/show states
 *   - useMotionVariants() returns full variants by default
 *   - useMotionVariants() strips transforms when reduced-motion is set
 *   - reduceVariant logic removes x/y/scale but preserves opacity
 */

import { describe, it, test, expect, vi, beforeEach } from 'vitest';

// ── Mock framer-motion ─────────────────────────────────────────────────────────
// We mock useReducedMotion so we can control it in tests without a real browser.
// PageTransition and FadeIn use motion/AnimatePresence which we stub too.

let _shouldReduce = false;

vi.mock('framer-motion', () => ({
  useReducedMotion: () => _shouldReduce,
  motion: {
    div: ({ children, ...props }) => ({ type: 'div', props, children }),
  },
  AnimatePresence: ({ children }) => children,
}));

import {
  fadeIn, fadeUp, fadeDown, scaleIn, slideInRight, slideInLeft,
  staggerChildren, listItem, cardPop, backdrop, sidebar,
  useMotionVariants,
  EASE_IO, TRANSITION_NORMAL, TRANSITION_SPRING,
} from '../lib/variants';

// ── Helpers ────────────────────────────────────────────────────────────────────

function hasMotion(state) {
  return state && (
    state.x !== undefined || state.y !== undefined || state.scale !== undefined
  );
}

// ── Variant shape tests ────────────────────────────────────────────────────────

describe('exported variants — shape', () => {
  const NAMED_VARIANTS = [
    ['fadeIn',       fadeIn],
    ['fadeUp',       fadeUp],
    ['fadeDown',     fadeDown],
    ['scaleIn',      scaleIn],
    ['slideInRight', slideInRight],
    ['slideInLeft',  slideInLeft],
    ['staggerChildren', staggerChildren],
    ['listItem',     listItem],
    ['cardPop',      cardPop],
    ['backdrop',     backdrop],
    ['sidebar',      sidebar],
  ];

  test.each(NAMED_VARIANTS)('%s has a hidden state', (name, v) => {
    expect(v).toHaveProperty('hidden');
  });

  test.each(NAMED_VARIANTS)('%s has a show state', (name, v) => {
    expect(v).toHaveProperty('show');
  });

  test.each(
    NAMED_VARIANTS.filter(([, v]) => v.exit !== undefined)
  )('%s exit state has opacity', (name, v) => {
    expect(v.exit).toHaveProperty('opacity');
  });

  it('fadeUp hidden state has y offset', () => {
    expect(fadeUp.hidden.y).toBeGreaterThan(0);
  });

  it('scaleIn hidden state has scale < 1', () => {
    expect(scaleIn.hidden.scale).toBeLessThan(1);
  });

  it('slideInRight hidden state has positive x', () => {
    expect(slideInRight.hidden.x).toBeGreaterThan(0);
  });

  it('slideInLeft hidden state has negative x', () => {
    expect(slideInLeft.hidden.x).toBeLessThan(0);
  });

  it('staggerChildren show.transition has staggerChildren delay', () => {
    expect(staggerChildren.show.transition.staggerChildren).toBeGreaterThan(0);
  });
});

// ── useMotionVariants — normal mode ───────────────────────────────────────────

describe('useMotionVariants() — normal motion', () => {
  beforeEach(() => { _shouldReduce = false; });

  it('returns fadeUp with y offsets intact', () => {
    const v = useMotionVariants();
    expect(v.fadeUp.hidden.y).toBe(fadeUp.hidden.y);
    expect(v.fadeUp.show.y).toBe(0);
  });

  it('returns scaleIn with scale values intact', () => {
    const v = useMotionVariants();
    expect(v.scaleIn.hidden.scale).toBeLessThan(1);
  });

  it('returns the same object references as the exported constants', () => {
    const v = useMotionVariants();
    expect(v.fadeIn).toBe(fadeIn);
    expect(v.sidebar).toBe(sidebar);
  });

  it('returns all 11 named variants', () => {
    const v = useMotionVariants();
    const keys = Object.keys(v);
    expect(keys).toContain('fadeIn');
    expect(keys).toContain('fadeUp');
    expect(keys).toContain('staggerChildren');
    expect(keys).toContain('sidebar');
    expect(keys.length).toBeGreaterThanOrEqual(11);
  });
});

// ── useMotionVariants — reduced motion ────────────────────────────────────────

describe('useMotionVariants() — reduced motion', () => {
  beforeEach(() => { _shouldReduce = true; });

  it('strips x from slideInRight', () => {
    const v = useMotionVariants();
    expect(v.slideInRight.hidden.x).toBeUndefined();
    expect(v.slideInRight.hidden.opacity).toBe(0);
  });

  it('strips y from fadeUp', () => {
    const v = useMotionVariants();
    expect(v.fadeUp.hidden.y).toBeUndefined();
    expect(v.fadeUp.hidden.opacity).toBe(0);
  });

  it('strips scale from scaleIn', () => {
    const v = useMotionVariants();
    expect(v.scaleIn.hidden.scale).toBeUndefined();
    expect(v.scaleIn.hidden.opacity).toBe(0);
  });

  it('preserves opacity in all hidden states', () => {
    const v = useMotionVariants();
    for (const [name, variant] of Object.entries(v)) {
      if (variant.hidden?.opacity !== undefined) {
        expect(typeof variant.hidden.opacity, `${name}.hidden.opacity`).toBe('number');
      }
    }
  });

  it('no variant has spatial movement when reduced', () => {
    const v = useMotionVariants();
    for (const [name, variant] of Object.entries(v)) {
      expect(hasMotion(variant.hidden), `${name}.hidden should have no movement`).toBe(false);
      expect(hasMotion(variant.show),   `${name}.show should have no movement`).toBe(false);
      if (variant.exit) {
        expect(hasMotion(variant.exit), `${name}.exit should have no movement`).toBe(false);
      }
    }
  });

  it('returns different objects from the original constants', () => {
    const v = useMotionVariants();
    // Should be new reduced objects, not the same references
    expect(v.fadeUp).not.toBe(fadeUp);
    expect(v.scaleIn).not.toBe(scaleIn);
  });
});

// ── Transition preset sanity checks ──────────────────────────────────────────

describe('transition presets', () => {
  test('EASE_IO is a 4-element array', () => {
    expect(EASE_IO).toHaveLength(4);
  });

  test('TRANSITION_NORMAL has a duration', () => {
    expect(TRANSITION_NORMAL.duration).toBeGreaterThan(0);
  });

  test('TRANSITION_SPRING is a spring', () => {
    expect(TRANSITION_SPRING.type).toBe('spring');
    expect(TRANSITION_SPRING.stiffness).toBeGreaterThan(0);
    expect(TRANSITION_SPRING.damping).toBeGreaterThan(0);
  });
});
