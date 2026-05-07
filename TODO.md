# TODO – ERP Coverage Lot 1

- [x] Mapper les domaines ERP demandés
- [x] Identifier les gaps de couverture par domaine
- [x] Implémenter les hubs MVP : Website / Commerce / Talent
- [x] Enregistrer les modules dans `registry_init.jsx`
- [x] Aligner `ModuleSwitcher.jsx` avec la taxonomie ERP

## Lot Saisie (Website / Commerce / Talent)

- [x] Ajouter des formulaires de saisie dans `WebsiteHub.jsx`
- [x] Ajouter des formulaires de saisie dans `CommerceHub.jsx`
- [x] Ajouter des formulaires de saisie dans `TalentHub.jsx`
- [x] Brancher la création de données via `addRecord`
- [x] Afficher les enregistrements saisis dans chaque onglet
- [x] Ajouter suppression basique des enregistrements
- [x] Tester manuellement le flux de saisie de bout en bout

## HR 2.0 & Qualité (En cours)
- [x] Unifier le modèle de données (users + hr_private)
- [x] Implémenter le Wizard d'onboarding (3 étapes)
- [x] Migration des données héritées
- [x] Résoudre les erreurs de Linting bloquant la CI/CD
- [/] Mise en place de Playwright pour les tests UI
- [ ] Couverture E2E du flux de création d'employé
- [ ] Suppression définitive de la collection racine `hr`
