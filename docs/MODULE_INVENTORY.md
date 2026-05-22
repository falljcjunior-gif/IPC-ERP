# IPC ERP — Module Inventory

Last updated: 2026-05-21 (post Phase A→E remediation)

## Status Legend

| Status | Meaning |
|---|---|
| ✅ REAL | Full Firestore integration, live data, proper empty states |
| ⚠️ PARTIAL | Some data live, some stubs remain |
| 🔒 HIDDEN | `hidden: true` in registry — not shown to users |
| 📋 STATIC | Static content (guides, config) — works as-is |

---

## Cockpit

| Module ID | Label | Status | Notes |
|---|---|---|---|
| `home` | Espace Personnel | ✅ REAL | Personal workspace, live tasks |
| `holding` | Cockpit Groupe | ✅ REAL | HOLDING only · consolidated KPIs from store |
| `subsidiary` | Cockpit Filiale | ✅ REAL | SUBSIDIARY only · computed from store data |
| `foundation` | IPC Foundation | ✅ REAL | FOUNDATION only · 4 live Firestore subscriptions |
| `missions` | Portail des Missions | ✅ REAL | 16 Firestore calls · entity_id isolation fixed (Phase A) |
| `connect` | Connect Plus | ✅ REAL | Rooms, messaging · subcollection isolation fixed (Phase A) |
| `academy` | Nexus Academy | 🔒 HIDDEN | Phase C: novice content rewrite planned — re-enable after new guides |

---

## CRM & Ventes

| Module ID | Label | Status | Notes |
|---|---|---|---|
| `crm` | CRM & Ventes | ✅ REAL | Kanban pipeline · reads from `data.crm.deals` |
| `sales` | Ventes & Devis | ✅ REAL | Orders + quotes · reads from `data.sales.orders` |
| `marketing` | Marketing Digital | 🔒 HIDDEN | Phase C: campaign workflow not validated for MVP1 — re-enable post sign-off |

---

## Opérations & Logistique

| Module ID | Label | Status | Notes |
|---|---|---|---|
| `inventory` | Stocks & Logistique | 🔒 HIDDEN | Phase C: stock flows not validated for MVP1 — re-enable after warehouse ops |
| `shipping` | Expéditions | ✅ REAL | Reads from store |
| `production` | Production Avancée | ✅ REAL | Work orders · OEE computed from real data |
| `quality` | Qualité & HSE | ✅ REAL | Reads from store |
| `projects` | Projets | ✅ REAL | Reads from store |
| `fleet` | Flotte | 🔒 HIDDEN | Phase C: `fleet` collection not subscribed in BusinessContext → add to collections_to_sync to re-enable |

---

## Finance & Stratégie

| Module ID | Label | Status | Notes |
|---|---|---|---|
| `finance` | Finance & Comptabilité | ✅ REAL | Invoices, budgets, treasury · live ledger data |
| `legal` | Juridique | ✅ REAL | CLM, IP, litigation · reads from store |
| `accounting` | Comptabilité | ✅ REAL | Reads from store |
| `expenses` | Notes de Frais | ✅ REAL | Reads from store |
| `bi` | Business Intelligence | ✅ REAL | 4 tabs · hardcoded values replaced with computed (Phase C) |
| `analytics` | Analyses Avancées | ✅ REAL | Reads from store |
| `audit_hub` | Audit & Conformité | ✅ REAL | Reads from store |
| `contracts` | Contrats & Abonnements | ✅ REAL | Live subscription to `contracts` collection (Phase B) |

---

## RH & Collaboration

| Module ID | Label | Status | Notes |
|---|---|---|---|
| `hr` | Ressources Humaines | ✅ REAL | Employees, leaves, onboarding |
| `talent` | People & Culture | ✅ REAL | Live `employee_pulses` subscription (Phase B) |
| `planning` | Planning & Événements | ✅ REAL | Reads from store |
| `helpdesk` | Support & Helpdesk | ✅ REAL | Reads from store |
| `dms` | Documents Cloud | ✅ REAL | Reads from store |
| `office_admin` | Services Généraux | ✅ REAL | Reads from store |
| `signature` | Signature Électronique | 🔒 HIDDEN | Mock OTP + IP in RequestsTab · re-enable after real e-signature integration |
| `payroll` | Paie & Social | ✅ REAL | Reads from store |

---

## Configuration & Admin

| Module ID | Label | Status | Notes |
|---|---|---|---|
| `control_hub` | Administration | ✅ REAL | User management, RBAC, system config |
| `it` | IT Operations | ✅ REAL | Live subscriptions: `it_assets`, `it_tickets`, `it_interventions` (Phase B) |
| `mobile` | Application Mobile | 📋 STATIC | Info page about mobile companion |

---

## Firestore Collections in Use

| Collection | Module(s) | Isolation |
|---|---|---|
| `users` | HR, Directory | entity_id + role-based rule |
| `hr_private/*` | HR sensitive data | entity_id required (backfill CF available) |
| `rooms`, `rooms/*/participants`, `rooms/*/signals` | Connect | entity_id inherited from parent room |
| `missions_boards`, `missions_lists`, `missions_cards` | Missions | entity_id injected on create (Phase A) |
| `employee_pulses` | People & Culture | entity_id auto-injected |
| `contracts` | Contrats | entity_id auto-injected |
| `it_assets`, `it_tickets`, `it_interventions` | IT Operations | entity_id auto-injected |
| `foundation_donations`, `foundation_programs`, `foundation_beneficiaries`, `foundation_campaigns` | Foundation | entity_id auto-injected |
| `mail_outbox` | All provisioning | entity_id + processed by `processMailOutbox` CF |
| `country_scopes` | Holding > Country | skipEntityFilter (global) |
| `organizations` | Entity provisioning | entity_id of parent holding |

---

## Known Pending Actions

| Item | Who | When |
|---|---|---|
| Run `backfillHrPrivateEntityId` callable | SUPER_ADMIN | Before first HR login post-deploy |
| Re-enable `signature` module after e-sign integration | Dev team | Future sprint |
| Re-enable `academy` after novice guide rewrite | Dev team | Future sprint |
| Re-enable `marketing` after campaign workflow sign-off | Dev team | Future sprint |
| Re-enable `inventory` after warehouse ops validation | Dev team | Future sprint |
| Re-enable `fleet` — add `fleet` to `collections_to_sync` in BusinessContext | Dev team | Future sprint |
| Set env vars for E2E test accounts | DevOps | Before CI/CD pipeline |
| Wire Playwright tests into CI pipeline | DevOps | After test accounts created |
