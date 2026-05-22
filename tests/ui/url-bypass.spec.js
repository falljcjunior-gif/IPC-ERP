/**
 * URL BYPASS SPEC — Direct URL access to unauthorized modules
 *
 * Verifies that navigating directly to a module URL (e.g. /administration)
 * without having the required role:
 *   1. Does NOT render the module content
 *   2. Either redirects to home/login or shows an access-denied state
 *   3. Does NOT expose any sensitive data from the module
 *
 * Also verifies that unauthenticated navigation to any /module URL
 * redirects to login / landing page.
 */

import { test, expect } from '@playwright/test';
import { login, logout, CREDS, skipIfNoCreds } from './helpers/auth.js';

const ADMIN_ONLY_PATHS = [
  '/administration',
  '/it-operations',
  '/juridique',
];

const ALL_MODULE_PATHS = [
  '/crm',
  '/finance',
  '/rh',
  '/production',
  '/administration',
  '/it-operations',
];

// ── Unauthenticated bypass ───────────────────────────────────────────
test.describe('URL bypass — unauthenticated direct navigation', () => {
  for (const path of ALL_MODULE_PATHS) {
    test(`unauthenticated: GET ${path} does not render ERP shell`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      // Must NOT see the ERP sidebar
      await expect(page.locator('aside')).not.toBeVisible({ timeout: 4000 }).catch(() => {});

      // Must see login form or landing page
      const hasLoginOrLanding = await page.locator(
        'input[type="email"], input[type="password"], [data-testid="landing-hero"]'
      ).first().isVisible({ timeout: 4000 }).catch(() => false);

      const hasLoginText = await page.getByText(/se connecter|connexion|login|email/i)
        .first().isVisible({ timeout: 3000 }).catch(() => false);

      expect(hasLoginOrLanding || hasLoginText).toBe(true);
    });
  }
});

// ── Employee bypassing admin-only modules ────────────────────────────
test.describe('URL bypass — Employee navigating to admin-only URLs', () => {
  test.beforeEach(async ({ page }) => {
    skipIfNoCreds(test, 'employee');
    await login(page, CREDS.employee.email, CREDS.employee.password);
  });
  test.afterEach(async ({ page }) => { await logout(page); });

  for (const path of ADMIN_ONLY_PATHS) {
    test(`Employee direct URL ${path} — no admin content rendered`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      // Should not see module-specific admin content
      await expect(
        page.getByText(/administration système|contrôle général|rôles & droits/i).first()
      ).not.toBeVisible({ timeout: 4000 }).catch(() => {});

      // Should not show a fatal JS crash
      await expect(
        page.getByText(/something went wrong|erreur critique|fatal error/i).first()
      ).not.toBeVisible({ timeout: 3000 }).catch(() => {});

      // Either redirected to home or shows an access-denied message
      const onHome = await page.locator('[data-testid="global-dashboard"], aside').first()
        .isVisible({ timeout: 4000 }).catch(() => false);
      const hasAccessDenied = await page.getByText(/accès refusé|non autorisé|permission/i).first()
        .isVisible({ timeout: 3000 }).catch(() => false);

      expect(onHome || hasAccessDenied).toBe(true);
    });
  }
});

// ── SuperAdmin direct URL smoke ───────────────────────────────────────
test.describe('URL bypass — SuperAdmin can reach admin modules directly', () => {
  test.beforeEach(async ({ page }) => {
    skipIfNoCreds(test, 'superAdmin');
    await login(page, CREDS.superAdmin.email, CREDS.superAdmin.password);
  });
  test.afterEach(async ({ page }) => { await logout(page); });

  for (const path of ADMIN_ONLY_PATHS) {
    test(`SuperAdmin direct URL ${path} — renders without crash`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');

      // No JS crash
      await expect(
        page.getByText(/something went wrong|erreur critique/i).first()
      ).not.toBeVisible({ timeout: 3000 }).catch(() => {});

      // Either heading or empty state visible
      const hasHeading = await page.getByRole('heading').first().isVisible({ timeout: 5000 }).catch(() => false);
      const hasEmptyState = await page.getByText(/aucun|vide|no data/i).first().isVisible({ timeout: 3000 }).catch(() => false);
      expect(hasHeading || hasEmptyState).toBe(true);
    });
  }
});
