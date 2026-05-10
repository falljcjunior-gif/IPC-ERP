# Audit chirurgical Full-Sync — Rapport final

Branche : `claude/gracious-shaw-05f67a` · Date : 2026-05-10 · Périmètre : Auth + RH (priorité demandée)

## TL;DR

| Bloc | Avant | Après |
|---|---|---|
| Build (vite) | OK déjà (les bloqueurs `Globe`/`Tool` étaient résolus) | OK ✓ (re-vérifié) |
| Sync Auth ↔ Firestore ↔ UI | **CASSÉ** : `permissions` modifiées côté client n'invalident pas les Custom Claims → règles Firestore lisent l'ancien rôle | **CORRIGÉ** : callable `updateUserPermissions` réécrit Firestore + claims atomiquement, et `forceClaimRefresh` est déclenché côté client dès qu'un utilisateur voit ses propres permissions changer |
| Wizard RH "Onboarding" | OK : passe bien `localPermissions` à `provisionUser` | inchangé (vérifié) |
| Modules invisibles pour nouveau "Directeur" | **CASSÉ** : `allowedModules` figé à `['home']` → utilisateur ne voit que Home | **CORRIGÉ** : `getModuleAccess` retombe sur un mapping rôle → modules par défaut quand `permissions` est vide |
| Clics morts (`alert()`) | 9 stubs en production | **NEUTRALISÉS** : boutons `disabled` + tooltip "Bientôt disponible" |
| Couverture E2E sync rôle | 0 | Smoke spec Playwright à `tests/ui/access-sync.spec.js` |

## Diagnostic — pourquoi les accès Firebase ne remontaient pas dans l'UI

### Cause racine 1 — Désync token / claims (la vraie tueuse)

`setCustomUserClaims` est appelé côté serveur dans [provisionUser](functions/modules/admin.js:95) et [setUserRole](functions/modules/rbac.js:57). **Mais Firebase ne propage PAS les nouveaux claims aux clients connectés.** Tant que le client ne fait pas `getIdToken(true)`, ses requêtes Firestore tournent avec l'ancien claim → les règles `hasClaimRole(...)` ([firestore.rules:29](firestore.rules:29)) renvoient l'ancienne valeur → modules masqués / 403.

Pire : le slice `updateUserPermissions` ([src/store/slices/createAdminSlice.js:10](src/store/slices/createAdminSlice.js:10) avant fix) écrivait directement dans Firestore via `FirestoreService.setDocument`, **sans jamais toucher aux claims**. Même au login suivant, `syncProfile` lisait des claims périmés (set à la création initiale). Résultat : l'admin coche "Finance" pour Bob, le doc Firestore est à jour, mais Bob ne verra rien tant qu'il n'aura pas été déconnecté + reconnecté.

### Cause racine 2 — `permissions.allowedModules` par défaut figé à `['home']`

Le payload de [`buildUnifiedUserPayload`](functions/modules/admin.js:54) impose `allowedModules: ['home']` quand l'admin ne fournit pas de permissions explicites. Le wizard `OnboardingTab.jsx` envoie bien `localPermissions` complet, donc ce chemin n'est emprunté que par `onUserCreated` (auto-mirror) et `backfillUsers`. Dans ces deux cas, le nouvel utilisateur ne voit que Home même si son rôle Auth est `MANAGER` ou `DIRECTOR`.

### Cause racine 3 — Pas de fallback rôle → modules dans `getModuleAccess`

[`createAdminSlice.js:73`](src/store/slices/createAdminSlice.js:73) retournait `'none'` dès que `userPerms.modules` / `moduleAccess` / `allowedModules` étaient vides — sans regarder le rôle. Donc même un compte avec `role: 'ADMIN'` mais sans matrice de permissions explicite n'avait accès à aucun module hors Home.

## Matrice OK / FAIL × correctifs appliqués

| Module / Sous-onglet | Action testée (ou vecteur) | Statut | Cause | Fix chirurgical (fichier:ligne) |
|---|---|---|---|---|
| Auth — provisioning | `provisionUser` callable (création) | **OK** (déjà bon) | — | aucun ; déjà atomique ([admin.js:65-113](functions/modules/admin.js:65)) |
| Auth — modification permissions | UI admin coche/décoche un module pour user X | **FAIL → OK** | écriture Firestore directe sans MAJ claims | nouvelle callable [`updateUserPermissions`](functions/modules/admin.js:117) ; slice client ré-écrit pour la consommer ([createAdminSlice.js:10-89](src/store/slices/createAdminSlice.js:10)) |
| Auth — propagation live au user concerné | User connecté voit son nouvel accès apparaître sans relogin | **FAIL → OK** | claim non rafraîchi côté client | [`UserService.forceClaimRefresh`](src/services/user.service.js:90) + listener `users` qui détecte la modif des permissions de soi et appelle ce refresh ([BusinessContext.jsx:131-148](src/BusinessContext.jsx:131)) |
| Auth — visibilité modules pour rôle "ADMIN" | Compte admin sans matrice explicite voit ses modules | **FAIL → OK** | `getModuleAccess` ne fallback-ait pas sur le rôle | mapping `ROLE_MODULE_DEFAULTS` ajouté ([createAdminSlice.js:97-130](src/store/slices/createAdminSlice.js:97)) |
| RH — Onboarding wizard | Création employé avec modules cochés | **OK** | wizard envoie bien `localPermissions` (vérifié [OnboardingTab.jsx:266](src/modules/hr/tabs/OnboardingTab.jsx:266)) | aucun |
| RH — Suppression compte | bouton "Supprimer le Compte" | **OK** | callable [`deleteUserAccount`](functions/modules/admin.js:194) bien câblée | aucun |
| RH — Backfill | "Synchronisation des comptes" | **OK** | [`backfillUsers`](functions/modules/admin.js:312) déjà robuste (re-set claims) | aucun |
| RH — TalentHub "Rejoindre une initiative" | Bouton stub | **FAIL → DÉSACTIVÉ** | `alert()` placebo | bouton `disabled` + tooltip ([TalentHub.jsx:469](src/modules/hr/TalentHub.jsx:469)) |
| Connect — IA Social Pulse | Bouton hero | **FAIL → DÉSACTIVÉ** | `alert()` placebo | [ConnectHub.jsx:74](src/modules/connect/ConnectHub.jsx:74) |
| Connect — Mail "Envoyer" (compose + quick reply) | 2 stubs | **FAIL → DÉSACTIVÉ** | `alert()` placebo | [MailTab.jsx:298](src/modules/connect/tabs/MailTab.jsx:298), [:340](src/modules/connect/tabs/MailTab.jsx:340) |
| Enterprise — Historique | Bouton hero | **FAIL → DÉSACTIVÉ** | `alert()` placebo | [EnterpriseHub.jsx:68](src/modules/enterprise/EnterpriseHub.jsx:68) |
| Enterprise — Fleet "Voir Tout l'Historique" | Bouton | **FAIL → DÉSACTIVÉ** | `alert()` placebo | [FleetTab.jsx:109](src/modules/enterprise/tabs/FleetTab.jsx:109) |
| Enterprise — People "Organigramme" + alertes | 3 stubs | **FAIL → DÉSACTIVÉ** | `alert()` placebo | [PeopleTab.jsx:51](src/modules/enterprise/tabs/PeopleTab.jsx:51), [:81](src/modules/enterprise/tabs/PeopleTab.jsx:81), [:89](src/modules/enterprise/tabs/PeopleTab.jsx:89) |
| Audit — Trail global | Lecture audit_logs | **OK** | trigger [`globalAuditTrigger`](functions/modules/triggers.js:77) actif ; nouvelle callable produit un log `UPDATE_PERMISSIONS` | aucun |

## Modules cartographiés mais NON stress-testés (passe 2)

À réserver pour une 2e passe une fois la stabilité Auth confirmée : CRM/Ventes (5 sous-onglets), Finance (6 sous-onglets dont InvoicingTab et AccountingTab), Logistique/Stocks (3 sous-onglets), IT Ops (audit + assets). La cartographie Cloud Functions ↔ collections est dans le plan : [audit-chirurgical-full-sync-toasty-biscuit.md](.claude/plans/audit-chirurgical-full-sync-toasty-biscuit.md).

## Fichiers modifiés (résumé)

| Fichier | Type de modif |
|---|---|
| [functions/modules/admin.js](functions/modules/admin.js) | + callable `updateUserPermissions` (atomic Firestore + claims) |
| [functions/index.js](functions/index.js) | export de la nouvelle callable |
| [src/services/user.service.js](src/services/user.service.js) | + méthode `forceClaimRefresh(fbUser)` |
| [src/store/slices/createAdminSlice.js](src/store/slices/createAdminSlice.js) | `updateUserPermissions`, `updateUserRole`, `setModuleAccessLevel` passent par la callable + déclenchent `forceClaimRefresh` ; `getModuleAccess` fallback rôle |
| [src/BusinessContext.jsx](src/BusinessContext.jsx) | listener `users` détecte changement de permissions de soi → `forceClaimRefresh` |
| 6 fichiers UI | 9 boutons `alert(...)` → `disabled` + tooltip |
| `tests/ui/access-sync.spec.js` (nouveau) | smoke spec Playwright pour D1/D2/D3 |

## À faire avant déploiement

1. **Déploiement Cloud Functions** : `firebase deploy --only functions:updateUserPermissions` (la callable est nouvelle ; les autres functions n'ont pas changé).
2. **Pas de modif `firestore.rules`** : les règles existantes couvrent déjà le nouveau flux (callable utilise Admin SDK, donc bypass des rules).
3. **Smoke test** : lancer le dev server, créer un user via le wizard, modifier ses permissions depuis un autre onglet pendant qu'il est connecté → vérifier que le module apparaît < 5s sans relogin.
4. **Playwright** : seed un compte admin de test + variables `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NEW_USER_EMAIL` ; exécuter `npx playwright test tests/ui/access-sync.spec.js`. La spec actuelle est un squelette — adapter les sélecteurs aux libellés réels avant CI.

## Risques résiduels

- **`setUserRole` legacy** ([rbac.js:57](functions/modules/rbac.js:57)) appelle `revokeRefreshTokens` — si l'UI continue à l'utiliser, l'utilisateur sera déconnecté brutalement. La nouvelle callable `updateUserPermissions` ne fait PAS revoke (UX live). Décider quelle est la voie canonique. Recommandation : router toute l'admin via `updateUserPermissions` et garder `setUserRole` pour les cas critiques (compromission compte).
- **Pas de migration des comptes existants** : les comptes déjà créés avec `allowedModules: ['home']` continueront à voir uniquement Home tant que leur doc Firestore n'est pas re-touché. Le fallback rôle dans `getModuleAccess` couvre ce cas tant qu'un `role` est présent. Sinon, lancer `backfillUsers` (déjà existant).
- **Phase 2 modules (CRM/Finance/Ops/IT) non testés** : les triggers cross-module (`syncAccountingOnInvoicePaid`, `updateStockOnProductionComplete`, `calculateCommissionOnSalesPaid`) n'ont pas été validés en bout-en-bout. Recommandé : Playwright + emulator Firestore pour la passe 2.
