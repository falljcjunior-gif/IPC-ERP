# QA Release Checklist — IPC ERP

## 1) Pré-Release Build & Runtime
- [x] `npm run build` passe sans erreur bloquante
- [x] Application se lance correctement en environnement cible
- [x] Aucune erreur runtime bloquante au chargement initial

## 2) Console Hygiene (Obligatoire)
- [x] Ouvrir DevTools Console sur chaque module clé
- [x] Vérifier absence de `error` non gérées
- [x] Vérifier absence de warnings critiques répétitifs
- [x] Vérifier spécifiquement les warnings Recharts de type:
  - `The width(-1) and height(-1) of chart should be greater than 0`
- [x] Si warning chart présent: **Release bloquée** jusqu’à correction ou dérogation explicite

## 3) Auth & Session
- [x] Login success path
- [x] Logout success path
- [x] Session restore / refresh
- [x] Gestion propre des états non authentifiés

## 4) Modules ERP — Smoke Test
- [x] CRM (dashboard + pipeline + actions)
- [x] Sales (dashboard + commandes + création)
- [x] Finance/Accounting (analytics + écritures)
- [x] Inventory/Logistics (vues + opérations majeures)
- [x] Production (analytics + exécution)
- [x] HR (annuaire + flux RH principaux)
- [x] Connect/Collaboration (mur, messenger, annuaire, life)

## 5) Graph Modules — Deep Smoke (Obligatoire)
- [x] BI > Executive tab
- [x] BI > Financial tab
- [x] BI > Growth tab
- [x] BI > Industrial tab
- [x] Marketing dashboards avec charts
- [x] Sales analytics chart
- [x] Production analytics chart
- [x] Changement d’onglets rapide (stress léger) sans warning chart

## 6) UX / Interaction
- [x] Boutons principaux répondent
- [x] Modales ouverture/fermeture sans fuite d’état
- [x] Formulaires: validations minimales et erreurs visibles
- [x] Navigation latérale + sous-onglets stable
- [x] Responsive de base (desktop/tablette)

## 7) Data Integrity
- [x] Vérifier mapping des champs sensibles (stock/qteStock, alerte/seuilAlerte, statuts)
- [x] Vérifier créations/modifications visibles après refresh
- [x] Vérifier cohérence localStorage vs backend (si activé)

## 8) Go/No-Go
- [x] Aucun bug bloquant ouvert
- [x] Aucun warning console critique non justifié
- [x] Rapport de smoke test archivé
- [x] Validation finale release
