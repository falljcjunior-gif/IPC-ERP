import { defineConfig } from 'vitest/config';

/**
 * Dedicated Vitest config for Firestore Security Rules tests.
 *
 * These run against the Firestore Emulator (via @firebase/rules-unit-testing),
 * NOT jsdom. They are intentionally isolated from the app's unit-test config
 * (vitest.config.js) which mounts React/jsdom and enforces coverage thresholds.
 *
 * Run with the emulator wrapper:
 *   npm run test:rules
 *   → firebase emulators:exec --only firestore "vitest run --config vitest.rules.config.js"
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/rules/**/*.test.js'],
    exclude: ['node_modules', 'dist', 'functions', 'tests/ui'],
    testTimeout: 20000,
    hookTimeout: 30000,
    // All suites share ONE emulator instance and clearFirestore() between tests,
    // so they must not run in parallel across files/workers.
    fileParallelism: false,
    coverage: { enabled: false },
  },
});
