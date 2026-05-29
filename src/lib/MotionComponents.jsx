/**
 * MotionComponents — Antigravity JSX wrappers using the shared variant library.
 *
 * These components are in a .jsx file (not .js) because they contain JSX syntax.
 * Pure variant objects and hooks live in variants.js.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useMotionVariants } from './variants';

/**
 * PageTransition — wraps module/route content with a standard fade-up
 * enter/exit animation that respects `prefers-reduced-motion`.
 *
 * @param {{ children: React.ReactNode, id: string }} props
 *   `id` must change between routes so AnimatePresence detects the transition.
 *
 * @example
 * <PageTransition id={activeApp}>{renderContent()}</PageTransition>
 */
export function PageTransition({ children, id }) {
  const v = useMotionVariants();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={id}
        variants={v.fadeUp}
        initial="hidden"
        animate="show"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * FadeIn — simple fade wrapper for any content.
 *
 * @param {{ children: React.ReactNode, delay?: number }} props
 */
export function FadeIn({ children, delay = 0 }) {
  const v = useMotionVariants();
  return (
    <motion.div
      variants={v.fadeIn}
      initial="hidden"
      animate="show"
      exit="exit"
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerList — animates a list of children with staggered entry.
 *
 * @param {{ children: React.ReactNode, className?: string }} props
 */
export function StaggerList({ children, className }) {
  const v = useMotionVariants();
  return (
    <motion.ul
      variants={v.staggerChildren}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.ul>
  );
}

/**
 * StaggerItem — child of StaggerList, uses listItem variant.
 *
 * @param {{ children: React.ReactNode, className?: string }} props
 */
export function StaggerItem({ children, className }) {
  const v = useMotionVariants();
  return (
    <motion.li variants={v.listItem} className={className}>
      {children}
    </motion.li>
  );
}
