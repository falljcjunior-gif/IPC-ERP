import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'url';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.js'],
    include: ['src/__tests__/**/*.test.{js,jsx,ts,tsx}'],
    exclude: ['node_modules', 'dist', 'functions'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: [
        'src/modules/**',
        'src/components/**',
        'src/services/**',
        'src/store/**',
      ],
      exclude: [
        'src/__tests__/**',
        'src/main.jsx',
        'node_modules/**',
      ],
      thresholds: {
        lines:      60,
        functions:  60,
        branches:   55,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('src', import.meta.url)) },
  },
});
