# IPC-ERP Cloud Functions Documentation

This document serves as the technical reference for the Cloud Functions (Firebase v2) driving the IPC-ERP backend.

## Architecture Overview
- **Runtime**: Node.js 20
- **Framework**: Firebase Functions v2
- **Validation**: Zod (all `onCall` endpoints)
- **Security**: Strict RBAC enforced via internal privilege checks.

---

## 1. AI Copilot (Nexus)

### `nexusChat` (onCall)
Interaction with the Gemini 2.0 Flash engine for ERP assistance.

- **Request Schema**:
  ```typescript
  {
    message: string (min: 1, max: 2000),
    history?: { role: 'user' | 'assistant', content: string }[],
    erpContext?: {
      activeModule?: string,
      userRole?: string,
      userName?: string,
      recordCounts?: Record<string, number>
    }
  }
  ```
- **RBAC**: Any authenticated user.
- **Secrets**: `GEMINI_API_KEY`.

---

## 2. Social & Webhooks [DISABLED]
*Note: These endpoints are currently disabled to bypass secret requirements during initial setup.*

### `exchangeSocialToken` (onCall) - DISABLED
### `metaWebhook` (onRequest) - DISABLED

---

## 3. Administration

### `deleteUserAccount` (onCall)
Hard-deletes a user from Firebase Authentication.

- **Request Schema**:
  ```typescript
  { uid: string (min: 20) }
  ```
- **RBAC**: `SUPER_ADMIN` only.

---

## 4. Monitoring

### `getBackendStatus` (onCall)
Aggregates health metrics and synchronization logs.

- **RBAC**: `ADMIN` or `SUPER_ADMIN`.
- **Metrics Provided**: Sync success/fail rate, Audit log volume, AI usage.

---

## 5. Background Triggers (Internal)

- **`globalAuditTrigger`**: Monitors all `finance_*`, `inventory_*`, `users`, `hr`, and `production_*` collections.
- **`syncAccountingOnInvoicePaid`**: Triggers when an invoice status changes to `paid`. Syncs to Axelor.
- **`updateStockOnProductionComplete`**: Triggers when a production order status changes to `completed`. Syncs to Axelor.
