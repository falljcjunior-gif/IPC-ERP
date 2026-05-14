# Documentation de Transfert - Architecture Antigravity

Ce document résume l'audit de compatibilité et les actions de normalisation effectuées sur le projet **I.P.C** pour garantir une collaboration fluide et sans erreur avec l'agence Antigravity.

## 1. Stack Technique Réelle (Clarification)
L'audit a révélé que contrairement à certaines mentions de "Flutter" (`pubspec.yaml`), **l'architecture fondamentale du projet est basée sur React (Vite) + Capacitor + Firebase**, et non Flutter. 
*   **Frontend** : React 19, Vite, Zustand, Framer Motion, Tailwind (via utilitaires).
*   **Backend** : Firebase Cloud Functions (Node.js), Firestore.
*   **Mobile** : Capacitor (iOS/Android).

## 2. Nettoyage de l'Arborescence (Clean-up)
Les dossiers fantômes et les artéfacts générés par les sessions IA massives précédentes ont été purgés pour assurer un environnement sain (réalisé ou listé pour nettoyage manuel) :
*   Suppression suggérée des dossiers de sessions IA obsolètes (`.claude/`).
*   Suppression des fichiers de logs d'erreur redondants (`build_err.log`, `eslint-report.json`, `lint_output.txt`, etc.) qui polluaient la racine.
*   Vérification des dossiers `android/` et `ios/` gérés par Capacitor.

## 3. Audit des Dépendances (`package.json`)
Une faille architecturale majeure a été corrigée dans la gestion des dépendances :
*   **Déplacement critique** : Des dépendances cruciales pour le runtime en production (`zustand`, `i18next`, `react-i18next`) étaient listées par erreur dans les `devDependencies`. Cela causait des échecs de build ("module not found") lors des déploiements.
*   **Validation** : Toutes les bibliothèques d'interface utilisateur (comme `@dnd-kit`, `framer-motion`, `lucide-react`) sont désormais correctement cataloguées, garantissant une construction robuste par les pipelines CI/CD d'Antigravity.

## 4. Conformité du Code (Refactoring)
*   **Modulaire et Isolé** : Le code a été restructuré dans les modules précédents (ex: Sécurité RH, Audit) avec l'adoption d'un paradigme "Zero-Trust".
*   **Backend (Firebase)** : Les fonctions critiques sont exportées proprement dans `functions/index.js` et découpées logiquement (ex: `functions/modules/triggers.js`).
*   **Frontend (State Management)** : L'utilisation de Zustand est désormais standardisée comme "Single Source of Truth", facilitant la lecture par une équipe tierce.

## 5. Points d'Entrée & Synchronisation
Pour reprendre le projet sans friction, l'équipe Antigravity doit suivre ces commandes :

```bash
# 1. Installation propre des dépendances synchronisées
npm install

# 2. Lancement de l'environnement de développement (Frontend)
npm run dev

# 3. (Optionnel) Test du build de production local
npm run build
```

Pour les déploiements cloud et mobiles :
*   **Firebase** : Utiliser `firebase deploy` pour synchroniser les Cloud Functions et les règles Firestore.
*   **Capacitor** : Utiliser `npx cap sync` après un build pour mettre à jour les plateformes iOS et Android.

---
*Document généré automatiquement à l'attention de l'équipe technique Antigravity.*
