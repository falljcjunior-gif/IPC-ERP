/**
 * Shared Playwright helpers — IPC ERP E2E suite
 *
 * Usage:
 *   import { login, logout, skipIfNoCreds } from './helpers/auth';
 *
 * Env variables expected (set in .env.test or CI secrets):
 *   SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD
 *   HOLDING_CEO_EMAIL / HOLDING_CEO_PASSWORD
 *   SUBSIDIARY_DG_EMAIL / SUBSIDIARY_DG_PASSWORD
 *   FOUNDATION_DG_EMAIL / FOUNDATION_DG_PASSWORD
 *   STAFF_CI_EMAIL / STAFF_CI_PASSWORD   (Filiale Côte d'Ivoire)
 *   STAFF_SN_EMAIL / STAFF_SN_PASSWORD   (Filiale Sénégal)
 */

import { expect } from '@playwright/test';

export const CREDS = {
  superAdmin:    { email: process.env.SUPER_ADMIN_EMAIL,    password: process.env.SUPER_ADMIN_PASSWORD },
  holdingCeo:    { email: process.env.HOLDING_CEO_EMAIL,    password: process.env.HOLDING_CEO_PASSWORD },
  subsidiaryDg:  { email: process.env.SUBSIDIARY_DG_EMAIL,  password: process.env.SUBSIDIARY_DG_PASSWORD },
  foundationDg:  { email: process.env.FOUNDATION_DG_EMAIL,  password: process.env.FOUNDATION_DG_PASSWORD },
  staffCI:       { email: process.env.STAFF_CI_EMAIL,       password: process.env.STAFF_CI_PASSWORD },
  staffSN:       { email: process.env.STAFF_SN_EMAIL,       password: process.env.STAFF_SN_PASSWORD },
};

/**
 * Log in to the IPC ERP and wait until the sidebar is visible.
 * @param {import('@playwright/test').Page} page
 * @param {string} email
 * @param {string} password
 */
export async function login(page, email, password) {
  await page.goto('/');
  // The public root can render either the login form or the marketing landing.
  // Follow the production UX before filling credentials.
  const emailInput = page.locator('input[type="email"]').first();
  if (!(await emailInput.isVisible({ timeout: 5000 }).catch(() => false))) {
    const loginCta = page.getByRole('button', { name: /se connecter|connexion|login/i }).first();
    await expect(loginCta).toBeVisible({ timeout: 10000 });
    await loginCta.click();
  }
  await expect(emailInput).toBeVisible({ timeout: 10000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  // Wait for sidebar/nav (authenticated state)
  await expect(page.locator('aside, nav[data-testid="sidebar"]').first())
    .toBeVisible({ timeout: 20000 });
}

/**
 * Click the user avatar / profile and log out.
 */
export async function logout(page) {
  // Try common logout patterns
  const avatar = page.locator('[data-testid="user-avatar"], [aria-label*="profil"], [aria-label*="compte"]').first();
  if (await avatar.isVisible({ timeout: 2000 }).catch(() => false)) {
    await avatar.click();
    const logoutBtn = page.getByRole('button', { name: /déconnexion|logout|sign out/i });
    if (await logoutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await logoutBtn.click();
    }
  } else {
    await page.goto('/');
  }
}

/**
 * Skip a test if the required credentials are not set in env.
 * Call at the top of each test or in beforeAll.
 * @param {import('@playwright/test').TestInfo} testInfo
 * @param {...string} roleKeys — keys from CREDS to check
 */
export function skipIfNoCreds(test, ...roleKeys) {
  for (const key of roleKeys) {
    const creds = CREDS[key];
    if (!creds?.email || !creds?.password) {
      test.skip(true, `Credentials for "${key}" not set. Set ${key.toUpperCase()}_EMAIL and ${key.toUpperCase()}_PASSWORD env vars.`);
      return;
    }
  }
}

/**
 * Navigate to a module by its sidebar label (partial match, case-insensitive).
 * @param {import('@playwright/test').Page} page
 * @param {string} moduleLabel
 */
export async function navigateTo(page, moduleLabel) {
  const link = page.locator('aside a, aside button, nav a, nav button')
    .filter({ hasText: new RegExp(moduleLabel, 'i') })
    .first();
  await expect(link).toBeVisible({ timeout: 5000 });
  await link.click();
  await page.waitForLoadState('networkidle');
}
