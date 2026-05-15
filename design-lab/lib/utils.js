/**
 * Tiny `cn()` utility — merges Tailwind classes safely (Shadcn UI pattern).
 * Replace with `clsx` + `tailwind-merge` if you want stricter merging.
 */
export function cn(...inputs) {
  return inputs.filter(Boolean).join(' ');
}

/**
 * Locale-aware compact number (1_234_567 → "1.2M").
 */
export const fmt = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

/**
 * Currency formatter — EUR by default.
 */
export const eur = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

/**
 * Smooth cascading variant for `framer-motion` lists.
 */
export const cascade = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.05 + i * 0.07,
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1], // ease-out-quint — Stripe-style
    },
  }),
};
