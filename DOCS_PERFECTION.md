# IPC Intelligence Engine: Architecture de Perfection

Ce document résume la nouvelle architecture implémentée pour la modernisation de l'ERP I.P.C.

## 🏛️ 1. State Management (Zustand)
Nous avons migré du monolithe `BusinessContext` vers un store **Zustand** modulaire.

- **Fichiers :** `src/store/index.js` et `src/store/slices/*.js`
- **Avantages :** 
  - Réduction drastique des re-renders.
  - Persistance automatique des réglages (`theme`, `langue`, `activeApp`).
  - Hydratation sécurisée : l'UI attend la récupération des données avant de s'afficher.

## 🌍 2. Internationalisation (i18next)
Le système est désormais nativement prêt pour l'international.

- **Fonctionnement :** Utilisation de `useTranslation()` dans les composants.
- **Dictionnaires :** 
  - `src/locales/fr.json` (Français)
  - `src/locales/en.json` (Anglais)
- **Détection :** Détections automatique basée sur le navigateur avec persistance du choix utilisateur.

## 🔒 3. Sécurité Granulaire (RBAC)
Le contrôle d'accès a été durci au niveau du champ.

- **PermissionGuard :** Nouveau composant `<PermissionGuard />` pour protéger les éléments de l'UI.
- **Logique :** `hasPermission(module, level)` disponible globalement.
- **Niveaux :** `read`, `write`, `admin`.

## 🧪 4. Fiabilité (Vitest)
Une suite de tests unitaires garantit la précision des calculs vitaux.

- **Commande :** `npm run test` ou `npx vitest`
- **Couverture :** TVA, Calculs de marge, Équilibrage du Grand Livre.

---
*Documentation générée par Antigravity - Modernisation IPC 2026*
