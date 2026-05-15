/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './design-lab/**/*.{js,jsx,ts,tsx}',
    // For Next.js, also include:
    // './app/**/*.{js,jsx,ts,tsx}',
    // './pages/**/*.{js,jsx,ts,tsx}',
    // './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Inter — variable. Add to <head> or self-host.
        sans: [
          'Inter',
          'Geist',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Helvetica Neue',
          'sans-serif',
        ],
      },
      letterSpacing: {
        tight: '-0.012em',
      },
      boxShadow: {
        // Stripe-style soft elevations
        sm: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 1px 0 rgb(15 23 42 / 0.02)',
        md: '0 4px 12px -2px rgb(15 23 42 / 0.06), 0 2px 4px -1px rgb(15 23 42 / 0.04)',
        lg: '0 12px 24px -6px rgb(15 23 42 / 0.10), 0 4px 8px -2px rgb(15 23 42 / 0.05)',
      },
      colors: {
        // Optional aliases — emerald already covers the green; expose if you want
        // accent: { DEFAULT: '#10B981', soft: '#ECFDF5', muted: '#34D399' },
      },
    },
  },
  plugins: [],
};
