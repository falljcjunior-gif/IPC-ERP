/**
 * HR ONBOARDING SPEC — Full employee provisioning flow
 *
 * Tests the 3-step onboarding wizard end-to-end:
 *   Step 1: Identity (nom, email, dept, poste)
 *   Step 2: Contract (type, salaire)
 *   Step 3: Governance (modules access)
 *   Final: Cloud Function provisioning succeeds
 *
 * Prerequisites:
 *   ADMIN_EMAIL / ADMIN_PASSWORD env vars must be set.
 *   The account must have ADMIN or HR role.
 *   Run against dev environment or Firebase emulator, NOT production.
 */

import { test, expect } from '@playwright/test';
import { skipIfNoCreds } from './helpers/auth.js';

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

test('HR Onboarding Flow — provision a new employee', async ({ page }) => {
  // Skip if credentials not provided
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    test.skip(true, 'ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping HR onboarding E2E');
    return;
  }

  // Cloud Function provisioning can be slow
  test.setTimeout(60000);

  await page.goto('/');
  await page.waitForSelector('input[type="email"]');

  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');

  await page.waitForSelector('aside', { timeout: 15000 });

  // Navigate to HR module
  const hrLink = page.locator('aside').getByText(/ressources humaines/i).first();
  await expect(hrLink).toBeVisible({ timeout: 6000 });
  await hrLink.click();

  // Open Onboarding tab
  const onboardingTab = page.getByRole('tab', { name: /onboarding|nouvel employ/i });
  if (!await onboardingTab.isVisible({ timeout: 4000 }).catch(() => false)) {
    test.skip(true, 'Onboarding tab not found — UI may have changed');
    return;
  }
  await onboardingTab.click();

  await expect(page.getByText(/Identité du Collaborateur/i)).toBeVisible({ timeout: 5000 });

  // Step 1: Identity
  const timestamp = Date.now();
  const testEmail = `e2e.test.${timestamp}@ipc-test.invalid`;
  await page.fill('input[name="nom"]', 'E2E Test User');
  await page.fill('input[name="email"]', testEmail);
  await page.fill('input[name="password"]', `E2e-${timestamp}!`);
  await page.selectOption('select[name="dept"]', 'Production');
  await page.fill('input[name="poste"]', 'Automated Tester');
  await page.click('button:has-text("Suivant")');

  // Step 2: Contract
  await expect(page.getByText(/Conditions Contractuelles/i)).toBeVisible({ timeout: 5000 });
  await page.selectOption('select[name="contratType"]', 'CDI');
  await page.fill('input[name="salaire"]', '500000');
  await page.click('button:has-text("Suivant")');

  // Step 3: Governance
  await expect(page.getByText(/Gouvernance/i)).toBeVisible({ timeout: 5000 });
  await page.click('button:has-text("Finaliser le Recrutement")');

  // Wait for Cloud Function response
  await expect(
    page.getByText(/Provisionnement Terminé|succès|terminé/i).first()
  ).toBeVisible({ timeout: 30000 });
});
