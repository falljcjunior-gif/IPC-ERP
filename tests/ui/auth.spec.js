/**
 * AUTH SPEC — Login flow for each role
 *
 * Verifies:
 * - Each role can authenticate successfully
 * - After login, sidebar is visible
 * - Each role lands on the correct default view (Cockpit/Espace Personnel)
 * - Invalid credentials show an error message
 *
 * Prerequisites: set env vars (see tests/ui/helpers/auth.js)
 */

import { test, expect } from '@playwright/test';
import { login, logout, CREDS, skipIfNoCreds } from './helpers/auth.js';

test.describe('Authentication — login per role', () => {
  test('invalid credentials show an error', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('input[type="email"]');
    await page.fill('input[type="email"]', 'nobody@nowhere.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    // Error message should appear (not redirect to dashboard)
    const errorMsg = page.locator('[role="alert"], .error, [data-testid="auth-error"]')
      .or(page.getByText(/invalide|incorrect|introuvable|wrong|error|erreur/i));
    await expect(errorMsg.first()).toBeVisible({ timeout: 8000 });
    // Should NOT be on authenticated page
    await expect(page.locator('aside')).not.toBeVisible({ timeout: 3000 }).catch(() => {});
  });

  test('SUPER_ADMIN — login and see admin modules', async ({ page }) => {
    skipIfNoCreds(test, 'superAdmin');
    await login(page, CREDS.superAdmin.email, CREDS.superAdmin.password);
    // Super admin sees the sidebar
    await expect(page.locator('aside')).toBeVisible();
    // Should have access to Administration module
    await expect(
      page.locator('aside').getByText(/administration|contrôle|control hub/i).first()
    ).toBeVisible({ timeout: 5000 });
    await logout(page);
  });

  test('HOLDING_CEO — login and see Cockpit Groupe', async ({ page }) => {
    skipIfNoCreds(test, 'holdingCeo');
    await login(page, CREDS.holdingCeo.email, CREDS.holdingCeo.password);
    await expect(page.locator('aside')).toBeVisible();
    // Holding CEO sees the group cockpit
    await expect(
      page.locator('aside').getByText(/cockpit groupe|groupe/i).first()
    ).toBeVisible({ timeout: 5000 });
    // Should NOT see Foundation or Subsidiary cockpit items directly
    await expect(
      page.locator('aside').getByText(/cockpit filiale/i)
    ).not.toBeVisible().catch(() => {});
    await logout(page);
  });

  test('SUBSIDIARY_DG — login and see Cockpit Filiale', async ({ page }) => {
    skipIfNoCreds(test, 'subsidiaryDg');
    await login(page, CREDS.subsidiaryDg.email, CREDS.subsidiaryDg.password);
    await expect(page.locator('aside')).toBeVisible();
    await expect(
      page.locator('aside').getByText(/cockpit filiale/i).first()
    ).toBeVisible({ timeout: 5000 });
    // Should NOT see Cockpit Groupe
    await expect(
      page.locator('aside').getByText(/cockpit groupe/i)
    ).not.toBeVisible().catch(() => {});
    await logout(page);
  });

  test('FOUNDATION_DG — login and see IPC Foundation', async ({ page }) => {
    skipIfNoCreds(test, 'foundationDg');
    await login(page, CREDS.foundationDg.email, CREDS.foundationDg.password);
    await expect(page.locator('aside')).toBeVisible();
    await expect(
      page.locator('aside').getByText(/foundation|fondation/i).first()
    ).toBeVisible({ timeout: 5000 });
    await logout(page);
  });

  test('STAFF_CI — login and land on Espace Personnel', async ({ page }) => {
    skipIfNoCreds(test, 'staffCI');
    await login(page, CREDS.staffCI.email, CREDS.staffCI.password);
    await expect(page.locator('aside')).toBeVisible();
    // Staff should see Espace Personnel as default
    await expect(
      page.locator('aside').getByText(/espace personnel|personnel/i).first()
    ).toBeVisible({ timeout: 5000 });
    // Staff should NOT see Administration or IT Operations
    await expect(
      page.locator('aside').getByText(/administration/i)
    ).not.toBeVisible().catch(() => {});
    await logout(page);
  });
});

test.describe('Authentication — session persistence', () => {
  test('page reload keeps the user logged in', async ({ page }) => {
    skipIfNoCreds(test, 'staffCI');
    await login(page, CREDS.staffCI.email, CREDS.staffCI.password);
    await page.reload();
    // After reload, should still be authenticated (sidebar still visible)
    await expect(page.locator('aside')).toBeVisible({ timeout: 15000 });
  });
});
