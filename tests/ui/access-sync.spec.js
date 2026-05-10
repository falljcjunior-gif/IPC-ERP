import { test, expect } from '@playwright/test';

/**
 * Smoke E2E — Audit Full-Sync.
 *
 * Préreq:
 *   1. `firebase emulators:start --only auth,firestore,functions` dans un autre shell.
 *   2. Compte admin de test seed via `scripts/seed-test-users.js` (à créer).
 *   3. Variables: ADMIN_EMAIL, ADMIN_PASSWORD, NEW_USER_EMAIL.
 *
 * Scénarios couverts:
 *   - D1: création utilisateur → apparition immédiate dans la liste admin (onSnapshot).
 *   - D2: nouveau user se connecte → modules de son rôle visibles dès le 1er login.
 *   - D3: admin modifie permissions d'un user connecté → propagation < 5s.
 */

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'fall.jcjunior@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';
const NEW_USER_EMAIL = process.env.NEW_USER_EMAIL || `test-${Date.now()}@example.com`;
const NEW_USER_PASSWORD = 'StrongPass123!';

async function login(page, email, password) {
  await page.goto('/');
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/mot de passe|password/i).fill(password);
  await page.getByRole('button', { name: /connexion|sign in|connecter/i }).click();
  await expect(page.getByRole('navigation')).toBeVisible({ timeout: 10000 });
}

test.describe('Sync Auth ↔ UI', () => {
  test('D1: nouvel utilisateur apparaît immédiatement dans la liste admin', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.getByRole('button', { name: /rh|talent|hr/i }).click();
    await page.getByRole('tab', { name: /onboarding|nouvel employ/i }).click();

    await page.getByLabel(/nom/i).fill('Test User');
    await page.getByLabel(/email/i).fill(NEW_USER_EMAIL);
    await page.getByLabel(/mot de passe|password/i).fill(NEW_USER_PASSWORD);
    await page.getByRole('button', { name: /provisionner|créer/i }).click();

    await expect(page.getByText(/provisionn[ée]|créé avec succès/i)).toBeVisible({ timeout: 10000 });
    await page.getByRole('tab', { name: /gérer les accès|edit/i }).click();
    await expect(page.getByText(NEW_USER_EMAIL)).toBeVisible({ timeout: 5000 });
  });

  test('D2: nouveau user voit les modules de son rôle au 1er login', async ({ page }) => {
    await login(page, NEW_USER_EMAIL, NEW_USER_PASSWORD);
    // Au minimum, Home doit être visible.
    await expect(page.getByRole('button', { name: /home|espace personnel/i })).toBeVisible();
  });

  test('D3: modification permissions live se propage à l\'autre onglet', async ({ browser }) => {
    const adminCtx = await browser.newContext();
    const userCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    const userPage = await userCtx.newPage();

    await login(adminPage, ADMIN_EMAIL, ADMIN_PASSWORD);
    await login(userPage, NEW_USER_EMAIL, NEW_USER_PASSWORD);

    // Admin ajoute le module Finance au user
    await adminPage.getByRole('button', { name: /rh|talent|hr/i }).click();
    await adminPage.getByRole('tab', { name: /gérer les accès|edit/i }).click();
    await adminPage.getByText(NEW_USER_EMAIL).click();
    await adminPage.getByLabel(/finance/i).check();
    await adminPage.getByRole('button', { name: /sauvegarder|appliquer/i }).click();

    // Le user doit voir le module Finance apparaître < 5s
    await expect(userPage.getByRole('button', { name: /finance/i })).toBeVisible({ timeout: 5000 });

    await adminCtx.close();
    await userCtx.close();
  });
});
