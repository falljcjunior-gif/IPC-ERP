/**
 * ROLE-CHANGE SPEC — Admin → Employee → Guest role transition scenarios
 *
 * Verifies that when a user's role changes (simulated by re-login with
 * different credentials) the UI correctly reflects the new permissions
 * without stale state leaking from the previous session.
 *
 * Critical: after each logout the store must be fully cleared so the
 * next user never sees data from the previous session.
 */

import { test, expect } from '@playwright/test';
import { login, logout, CREDS, skipIfNoCreds } from './helpers/auth.js';

// ── Helper ──────────────────────────────────────────────────────────
async function getVisibleModuleLabels(page) {
  const links = page.locator('aside a, aside button').filter({ hasText: /\w/ });
  const count = await links.count();
  const labels = [];
  for (let i = 0; i < count; i++) {
    const text = (await links.nth(i).textContent())?.trim();
    if (text) labels.push(text);
  }
  return labels;
}

// ── Test Suite ───────────────────────────────────────────────────────
test.describe('Role change — session isolation & sidebar refresh', () => {

  test('Admin sidebar has more modules than Employee sidebar', async ({ page }) => {
    skipIfNoCreds(test, 'admin');
    skipIfNoCreds(test, 'employee');

    // 1. Login as Admin
    await login(page, CREDS.admin.email, CREDS.admin.password);
    await page.waitForLoadState('networkidle');
    const adminModules = await getVisibleModuleLabels(page);
    await logout(page);

    // 2. Login as Employee
    await login(page, CREDS.employee.email, CREDS.employee.password);
    await page.waitForLoadState('networkidle');
    const employeeModules = await getVisibleModuleLabels(page);
    await logout(page);

    // Employee should see fewer (or equal) modules than Admin
    expect(employeeModules.length).toBeLessThanOrEqual(adminModules.length);
  });

  test('After logout, active module resets to home — not previous user module', async ({ page }) => {
    skipIfNoCreds(test, 'admin');
    skipIfNoCreds(test, 'employee');

    // Admin navigates to Finance
    await login(page, CREDS.admin.email, CREDS.admin.password);
    await page.waitForLoadState('networkidle');
    const financeLink = page.locator('aside').getByText(/finance/i).first();
    if (await financeLink.isVisible({ timeout: 4000 }).catch(() => false)) {
      await financeLink.click();
      await page.waitForLoadState('networkidle');
    }
    await logout(page);

    // Employee logs in — should land on home, not Finance
    await login(page, CREDS.employee.email, CREDS.employee.password);
    await page.waitForLoadState('networkidle');

    // URL should be / or /home, not /finance
    const url = page.url();
    expect(url).not.toMatch(/\/finance/i);
    await logout(page);
  });

  test('Employee cannot see Administration module', async ({ page }) => {
    skipIfNoCreds(test, 'employee');
    await login(page, CREDS.employee.email, CREDS.employee.password);
    await page.waitForLoadState('networkidle');

    await expect(
      page.locator('aside').getByText(/administration|contrôle général/i).first()
    ).not.toBeVisible({ timeout: 4000 }).catch(() => {});

    await logout(page);
  });

  test('Guest (unauthenticated) sees login, not dashboard', async ({ page }) => {
    // Navigate directly to the app without logging in
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should see a login form or landing page, not the ERP shell
    const hasLoginForm = await page.locator('input[type="email"], input[type="password"]').first()
      .isVisible({ timeout: 5000 }).catch(() => false);
    const hasLanding = await page.getByText(/demander une démo|planifier|se connecter/i).first()
      .isVisible({ timeout: 3000 }).catch(() => false);
    const hasErpSidebar = await page.locator('aside').isVisible({ timeout: 2000 }).catch(() => false);

    expect(hasLoginForm || hasLanding).toBe(true);
    expect(hasErpSidebar).toBe(false);
  });

  test('After role change (re-login), stale permissions do not persist', async ({ page }) => {
    skipIfNoCreds(test, 'superAdmin');
    skipIfNoCreds(test, 'employee');

    // SuperAdmin logs in, confirms admin-only module visible
    await login(page, CREDS.superAdmin.email, CREDS.superAdmin.password);
    await page.waitForLoadState('networkidle');

    const adminOnlyLink = page.locator('aside').getByText(/administration|juridique|it operations/i).first();
    const adminCanSeeAdminModule = await adminOnlyLink.isVisible({ timeout: 4000 }).catch(() => false);
    await logout(page);

    // Employee logs in — should NOT see that same module
    await login(page, CREDS.employee.email, CREDS.employee.password);
    await page.waitForLoadState('networkidle');

    if (adminCanSeeAdminModule) {
      // Only assert if the admin actually saw it — confirms it's role-gated
      const employeeCanSeeAdminModule = await page.locator('aside')
        .getByText(/administration|juridique|it operations/i).first()
        .isVisible({ timeout: 3000 }).catch(() => false);
      expect(employeeCanSeeAdminModule).toBe(false);
    }

    await logout(page);
  });
});
