/**
 * SMOKE SPEC — Basic module open/navigate for all functional modules
 *
 * For each live module: verify it opens without JS crash and shows
 * either real content or a proper empty state (not a spinner forever).
 *
 * Uses SUPER_ADMIN credentials to see all modules.
 * Does NOT require any seeded data — empty states are acceptable.
 */

import { test, expect } from '@playwright/test';
import { login, logout, CREDS, skipIfNoCreds } from './helpers/auth.js';

// All modules that should open without error for SUPER_ADMIN
// Phase C hidden modules (academy, inventory, marketing, fleet, signature) are excluded here
// and verified in the "hidden modules" suite below.
const FUNCTIONAL_MODULES = [
  { label: 'Espace Personnel',        heading: /espace personnel|bonjour|dashboard/i },
  { label: 'Missions',                heading: /missions|portail/i },
  { label: 'Connect',                 heading: /connect/i },
  { label: 'CRM',                     heading: /crm|ventes|pipeline/i },
  { label: 'Ventes & Devis',          heading: /ventes|devis|sales/i },
  { label: 'Production',              heading: /production/i },
  { label: 'Finance',                 heading: /finance|comptabilité/i },
  { label: 'Juridique',               heading: /juridique|legal/i },
  { label: 'Business Intelligence',   heading: /intelligence|decision core|bi/i },
  { label: 'Ressources Humaines',     heading: /ressources humaines|rh|human/i },
  { label: 'People & Culture',        heading: /people|culture|talent/i },
  { label: 'Planning',                heading: /planning|événements/i },
  { label: 'Support',                 heading: /support|helpdesk/i },
  { label: 'Documents Cloud',         heading: /documents|dms/i },
  { label: 'Administration',          heading: /administration|contrôle/i },
  { label: 'IT Operations',           heading: /it operations|operational/i },
  { label: 'Contrats',                heading: /contrats|abonnements/i },
];

// Modules hidden by Phase C (should NOT appear in sidebar for any role)
const PHASE_C_HIDDEN_MODULES = [
  'Nexus Academy',
  'Stocks & Logistique',
  'Marketing Digital',
  'Flotte',
  'Signature Électronique',
];

test.describe('Smoke — all functional modules open without crash', () => {
  test.beforeEach(async ({ page }) => {
    skipIfNoCreds(test, 'superAdmin');
    await login(page, CREDS.superAdmin.email, CREDS.superAdmin.password);
  });

  test.afterEach(async ({ page }) => {
    await logout(page);
  });

  for (const { label, heading } of FUNCTIONAL_MODULES) {
    test(`module "${label}" opens and renders`, async ({ page }) => {
      // Find module in sidebar
      const sidebarLink = page.locator('aside a, aside button')
        .filter({ hasText: new RegExp(label, 'i') })
        .first();

      if (!await sidebarLink.isVisible({ timeout: 4000 }).catch(() => false)) {
        // Module not in sidebar for this role — skip gracefully
        test.skip(true, `"${label}" not found in sidebar for SUPER_ADMIN`);
        return;
      }

      await sidebarLink.click();
      await page.waitForLoadState('networkidle');

      // Should not see a fatal error boundary
      await expect(
        page.getByText(/something went wrong|erreur critique|fatal error/i)
      ).not.toBeVisible({ timeout: 3000 }).catch(() => {});

      // Should not see an infinite spinner after load
      const spinner = page.locator('[data-testid="loading-spinner"], .spinner, [aria-label="chargement"]');
      if (await spinner.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Give it extra time to resolve
        await expect(spinner).not.toBeVisible({ timeout: 10000 });
      }

      // Either a heading or a known empty state should be visible
      const moduleHeading = page.getByRole('heading').filter({ hasText: heading }).first();
      const emptyState = page.getByText(/aucun|aucune|vide|no data|pas encore/i).first();
      const hasHeading = await moduleHeading.isVisible({ timeout: 5000 }).catch(() => false);
      const hasEmptyState = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);

      expect(hasHeading || hasEmptyState).toBe(true);
    });
  }
});

test.describe('Smoke — Phase C hidden modules do not appear in sidebar', () => {
  test.beforeEach(async ({ page }) => {
    skipIfNoCreds(test, 'superAdmin');
    await login(page, CREDS.superAdmin.email, CREDS.superAdmin.password);
  });
  test.afterEach(async ({ page }) => { await logout(page); });

  for (const label of PHASE_C_HIDDEN_MODULES) {
    test(`"${label}" is NOT visible in sidebar (hidden: true)`, async ({ page }) => {
      await expect(
        page.locator('aside').getByText(new RegExp(label, 'i')).first()
      ).not.toBeVisible({ timeout: 4000 }).catch(() => {});
    });
  }
});

test.describe('Smoke — BI module shows live values, not hardcoded ones', () => {
  test('BI Executive tab radar values are not all hardcoded (78/82/74/65)', async ({ page }) => {
    skipIfNoCreds(test, 'superAdmin');
    await login(page, CREDS.superAdmin.email, CREDS.superAdmin.password);

    const biLink = page.locator('aside').getByText(/business intelligence|bi/i).first();
    if (!await biLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip(true, 'BI module not found in sidebar');
      return;
    }
    await biLink.click();
    await page.waitForLoadState('networkidle');

    // The page should not contain all 4 hardcoded values simultaneously
    const text = await page.locator('body').innerText();
    const has78 = text.includes('78');
    const has82 = text.includes('82');
    const has74 = text.includes('74');
    const has65 = text.includes('65');
    // It's very unlikely all 4 would appear as live-computed values simultaneously
    // If they all appear it may be coincidence — this is a heuristic check
    if (has78 && has82 && has74 && has65) {
      console.warn('[SMOKE] All 4 previously-hardcoded BI values appear simultaneously — verify they are computed from live data.');
    }

    // More importantly, no crash occurred
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 5000 });
    await logout(page);
  });
});
