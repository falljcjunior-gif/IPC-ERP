# IPC ERP — Architecture Reference

## 1. Three-Space Hierarchy

The platform models a holding group with three distinct entity types, each isolated in its own data space.

```
HOLDING (Niveau 1)
│   Cockpit Groupe — consolidated view across all entities
│   Global RBAC — manages subsidiary / foundation access
│
├── SUBSIDIARY (Niveau 2) — one per country/branch
│       Cockpit Filiale — scoped to this entity only
│       Modules: HR, Finance, Sales, Production, Logistics, …
│
└── FOUNDATION (Niveau 3) — non-profit arm
        Foundation Cockpit — donations, programs, beneficiaries
        Scoped collections: foundation_donations, foundation_programs, …
```

### Data Isolation Rules

Every Firestore document created by the platform carries three fields injected automatically by `FirestoreService.createDocument()`:

| Field | Source | Purpose |
|---|---|---|
| `entity_id` | `getTenantContext().entityId` | Scopes doc to a single entity |
| `entity_type` | `HOLDING` \| `SUBSIDIARY` \| `FOUNDATION` | Allows cross-entity queries for Holding |
| `_createdBy` | `auth.currentUser.uid` | Audit trail |

**FirestoreService** (src/services/firestore.service.js) auto-injects these on every `createDocument` / `addDocument` call. Direct SDK calls bypass this — all such calls must use `withTenantFields()` manually (see A.1.c fix in Phase A).

---

## 2. RBAC Model

Custom claims are the **source of truth** for roles. They are set on the Firebase Auth token by Cloud Functions and checked in both:
- **Firestore Security Rules** (server-side, authoritative)
- **Registry module `roles` field** (client-side, UI gating only)

### Global Roles

| Role | Scope | Key Permissions |
|---|---|---|
| `SUPER_ADMIN` | All entities | Full access, bootstrap, migrations |
| `ADMIN` | Own entity | All modules in own entity |

### Holding Roles (entity_type = HOLDING)

| Role | Description |
|---|---|
| `HOLDING_CEO` | Full group visibility, read all entities |
| `HOLDING_CFO` | Finance consolidation |
| `HOLDING_CTO` | IT + technical modules |
| `HOLDING_CHRO` | HR across entities |
| `HOLDING_CSO` | Sales strategy |
| `HOLDING_AUDITOR` | Read-only audit access |
| `HOLDING_LEGAL` | Legal module across entities |
| `GROUP_AUDITOR` | Cross-entity audit |

### Subsidiary Roles (entity_type = SUBSIDIARY)

| Role | Description |
|---|---|
| `SUBSIDIARY_DG` | General director — full subsidiary access |
| `SUBSIDIARY_CFO` | Finance for this subsidiary |
| `SUBSIDIARY_RH` | HR for this subsidiary |
| `COUNTRY_DIRECTOR_SUBSIDIARY` | Country-level director |
| `COUNTRY_HR` / `COUNTRY_FINANCE` / `COUNTRY_OPERATIONS` / `COUNTRY_AUDITOR` | Functional leads |

### Foundation Roles (entity_type = FOUNDATION)

| Role | Description |
|---|---|
| `FOUNDATION_DG` | Foundation director |
| `FOUNDATION_MANAGER` | Program managers |
| `FOUNDATION_STAFF` | Operational staff |
| `FOUNDATION_AUDITOR` | Read-only compliance |
| `COUNTRY_DIRECTOR_FOUNDATION` | Country foundation lead |

### Legacy / Generic Roles (assigned on any entity type)

`STAFF`, `MANAGER`, `DIRECTOR`, `HR`, `FINANCE`, `SALES`, `PRODUCTION`, `LOGISTICS`, `LEGAL`

---

## 3. Module Registry

Modules are registered in `src/registry_init.jsx` using `registry.register({...})`. Key fields:

```js
registry.register({
  id: 'hr',
  label: 'Ressources Humaines',
  category: 'hr',               // cockpit | crm | operations | finance | hr | admin
  roles: ['ADMIN', 'HR'],       // which roles see this in sidebar
  entityTypes: ['SUBSIDIARY'],  // optional: restrict to specific entity types
  component: HR,
  hidden: false,                // true = never shown (GO-LIVE blocker)
  priority: 40,                 // lower = higher in sidebar
});
```

`PlatformShell` calls `registry.getModulesByCategoryForSpace(entityType)` on render, applying both `roles` and `entityTypes` filters. `hidden: true` modules are never rendered.

---

## 4. Cloud Functions Architecture

All callable functions run in `europe-west1`, 2nd Gen (`onCall`). Auth is enforced at function entry via `request.auth`.

### Module → Function mapping

| Module | Functions |
|---|---|
| Auth / RBAC | `setUserRole`, `bootstrapSuperAdmin`, `provisionUser`, `updateUserPermissions` |
| Entity lifecycle | `createGroupEntity`, `updateGroupEntity`, `changeEntityState`, `assignEntityLicense`, `approveEntityUpgrade`, `duplicateGroupEntity` |
| Country provisioning | `provisionCountryScope`, `changeCountryScopeState` |
| AI / JARVIS | `nexusChat`, `jarvisStream`, `jarvisMonitor` (scheduled 2h), `commanderScan` (scheduled 4h), `commanderChat` |
| Analytics | `computeNexusScoresWeekly`, `computeNexusScoresMonthly`, `computeNexusScoresNow` |
| Sales automation | `devisRelanceAutomatic`, `stockReorderAlert`, `generateRecurringInvoices`, `clientEngagementAlerts` |
| RFM | `computeRFMScores` (daily), `recomputeClientRFMOnInvoice` |
| Missions | `onMissionsCardMoved`, `onMissionsCardCreated`, `missionsDeadlineScanner`, `missionsWeeklyReport` |
| Email | `processMailOutbox` |
| Monitoring | `getBackendStatus`, `scheduledFirestoreExport`, `manualFirestoreExport` |
| Migrations | `backfillHrPrivateEntityId` (one-shot, SUPER_ADMIN only) |

### Outbox pattern

All emails go through `mail_outbox` (Firestore collection). `processMailOutbox` (scheduled) picks them up and calls Resend API. This ensures at-least-once delivery and retryability.

---

## 5. Firestore Security Rules (post Phase A)

Key rules enforcing 3-space isolation:

```javascript
// Users — scoped by entity or role
match /users/{userId} {
  allow read: if isAuthenticated() && (
    request.auth.uid == userId ||
    isSuperAdmin() || isHoldingLevel() ||
    canReadOwnEntity(resource.data.get('entity_id', null))
  );
}

// HR private — entity_id required (no legacy bypass)
match /{path=**}/hr_private/{docId} {
  allow read: if isAuthenticated() && (
    isSuperAdmin() || isHoldingLevel() ||
    ((hasRole('HR_MANAGER') || hasRole('DIRECTOR')) &&
      resource.data.entity_id == getEntityId())
  );
}

// Rooms sub-collections — inherit parent room's entity_id
match /rooms/{roomId}/participants/{uid} {
  allow read, write: if isAuthenticated() &&
    canReadOwnEntity(get(/databases/$(database)/documents/rooms/$(roomId)).data.get('entity_id', null));
}
```

---

## 6. Frontend State Architecture

```
BusinessContext (src/BusinessContext.jsx)
│   Authenticates user → loads custom claims
│   Sets TenantContext (entityId, entityType, role)
│   Subscribes to global store collections:
│     users, notifications, (scoped by entity)
│
└── Zustand Store (src/store/)
      createOperationsSlice — HR, Finance, Sales, Production, …
      useStore() — accessed by all module components
      FirestoreService.subscribeToCollection() — auto-injects entity_id filter
```

Module components call `useStore(s => s.data.hr.employees)` etc. They do NOT subscribe to Firestore directly (except specialist modules: TalentHub employee_pulses, Contracts, IT Module — added in Phase B).

---

## 7. Key Design Decisions

| Decision | Rationale |
|---|---|
| Custom claims as RBAC source of truth | Enforced server-side in Firestore Rules — can't be spoofed client-side |
| Defense-in-depth entity_id on every write | Even if rules are temporarily misconfigured, data is self-scoped |
| Outbox pattern for emails | Retryable, auditable, decoupled from provisioning transactions |
| `hidden: true` in registry for incomplete modules | Prevents users from seeing stub/mock UI in production |
| FirestoreService as the single write path | Guarantees entity_id + audit fields on every document |
