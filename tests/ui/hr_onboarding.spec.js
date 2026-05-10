import { test, expect } from '@playwright/test';

test('HR Onboarding Flow', async ({ page }) => {
  // Configurer le timeout car la création d'utilisateur Auth + Firestore peut être lente
  test.setTimeout(60000);

  await page.goto('/');
  
  // Attendre que le formulaire de login soit visible
  await page.waitForSelector('input[type="email"]');
  
  // Login
  await page.fill('input[type="email"]', 'superadmin@ipc.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  // Wait for login to complete and dashboard to load
  await page.waitForURL(/.*dashboard/, { timeout: 15000 });
  
  // Naviguer vers le module Ressources Humaines
  // On utilise un sélecteur plus robuste si possible, sinon le texte
  await page.click('nav >> text=Ressources Humaines');
  
  // Attendre que le module HR se charge
  await page.waitForSelector('text=Human Capital');
  
  // Cliquer sur l'onglet Onboarding
  await page.click('text=Onboarding');
  
  // Vérifier qu'on est sur le mode "Nouvel Employé"
  await expect(page.locator('text=Identité du Collaborateur')).toBeVisible();
  
  // Étape 1 : Identité
  const timestamp = Date.now();
  const testEmail = `test.user.${timestamp}@ipc.com`;
  await page.fill('input[name="nom"]', 'Test Automated User');
  await page.fill('input[name="email"]', testEmail);
  await page.fill('input[name="password"]', 'password123');
  await page.selectOption('select[name="dept"]', 'Production');
  await page.fill('input[name="poste"]', 'Automated Tester');
  await page.click('button:has-text("Suivant")');
  
  // Étape 2 : Contrat
  await expect(page.locator('text=Conditions Contractuelles')).toBeVisible();
  await page.selectOption('select[name="contratType"]', 'CDI');
  await page.fill('input[name="salaire"]', '500000');
  await page.click('button:has-text("Suivant")');
  
  // Étape 3 : Gouvernance
  await expect(page.locator('text=Gouvernance & Accès Modules')).toBeVisible();
  
  // Finaliser le recrutement
  // Note: C'est ici que l'erreur "internal" pourrait survenir
  await page.click('button:has-text("Finaliser le Recrutement")');
  
  // Attendre le message de succès
  // On augmente le timeout car c'est une fonction Cloud
  await expect(page.locator('text=Provisionnement Terminé')).toBeVisible({ timeout: 30000 });
});
