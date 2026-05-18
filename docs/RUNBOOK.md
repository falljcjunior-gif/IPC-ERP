# IPC ERP — Runbook

## Prerequisites

```bash
node >= 18
firebase-tools >= 13   # npm install -g firebase-tools
firebase login
```

Project ID: set in `.firebaserc` (`"default": "<project-id>"`)

---

## Local Development

```bash
npm install
npm run dev             # Vite dev server on http://localhost:5173
```

### Firebase Emulators (recommended for feature dev)

```bash
firebase emulators:start --only auth,firestore,functions
```

Then set `VITE_USE_EMULATORS=true` in `.env.local`.

---

## Running Tests

```bash
# Unit tests (Vitest)
npm run test

# E2E tests (Playwright) — requires dev server running
npm run test:ui

# E2E tests with browser visible
npx playwright test --headed

# Single spec
npx playwright test tests/ui/isolation.spec.js
```

### E2E environment variables

Create `.env.test` (never commit):

```
SUPER_ADMIN_EMAIL=
SUPER_ADMIN_PASSWORD=
HOLDING_CEO_EMAIL=
HOLDING_CEO_PASSWORD=
SUBSIDIARY_DG_EMAIL=
SUBSIDIARY_DG_PASSWORD=
FOUNDATION_DG_EMAIL=
FOUNDATION_DG_PASSWORD=
STAFF_CI_EMAIL=
STAFF_CI_PASSWORD=
STAFF_SN_EMAIL=
STAFF_SN_PASSWORD=
```

---

## Production Deployment

### Full deploy

```bash
npm run build           # Vite build → dist/
npm run deploy          # firebase deploy (hosting + functions + rules)
```

### Selective deploy

```bash
# Firestore rules only (fastest for security fixes)
firebase deploy --only firestore:rules

# Functions only
firebase deploy --only functions

# Specific function
firebase deploy --only functions:backfillHrPrivateEntityId

# Hosting only
firebase deploy --only hosting
```

### Deploy checklist

- [ ] `npm run build` passes with 0 errors
- [ ] `npm run test` passes with 0 failures
- [ ] `npm run lint` passes with 0 errors
- [ ] Rules Playground tested in Firebase Console
- [ ] No hardcoded dev emails in source (`grep -r "gmail\|@ipc\.com" src/`)
- [ ] No `[GO-LIVE]` markers in code (`grep -r "GO-LIVE" src/`)

---

## Secrets Management

All secrets are stored in **Firebase Secret Manager** (not in code or `.env`):

| Secret | Used by |
|---|---|
| `RESEND_API_KEY` | mail module (processMailOutbox) |
| `RECAPTCHA_SECRET_KEY` | verifyRecaptcha function |
| `ANTHROPIC_API_KEY` | nexusChat, jarvisStream, commanderChat |
| `OPENAI_API_KEY` | (if used as fallback model) |

To add/update a secret:
```bash
firebase functions:secrets:set RESEND_API_KEY
```

To grant function access:
```bash
# Already declared in function runWith() config — no manual step needed
```

---

## Post-Deploy: One-Shot Migrations

### backfillHrPrivateEntityId

Needs to be run **once** after deploying Phase A if legacy `hr_private` docs exist without `entity_id`.

1. Log in to the app as `SUPER_ADMIN`
2. Open browser console
3. Call via Firebase SDK:

```js
import { getFunctions, httpsCallable } from 'firebase/functions';
const fn = httpsCallable(getFunctions(), 'backfillHrPrivateEntityId');
const result = await fn({});
console.log(result.data);
// { scanned: N, patched: M, skippedNoUserEntity: K }
```

Or via Firebase CLI:
```bash
firebase functions:call backfillHrPrivateEntityId --region=europe-west1
```

---

## Rollback Procedure

### Rollback Hosting

```bash
# List previous releases
firebase hosting:releases:list

# Roll back to previous
firebase hosting:rollback
```

### Rollback Functions

Functions are versioned in Cloud Run. Roll back via GCP Console:
1. Cloud Run → select region `europe-west1` → select function
2. Click "Edit & Deploy new revision" → select previous image

### Rollback Firestore Rules

Rules are versioned in Firebase Console (Rules tab → History).
Click any previous version → "Republish".

### Emergency: disable a broken function

```bash
firebase functions:delete <functionName> --region europe-west1
```

---

## Monitoring

| What | Where |
|---|---|
| Function logs | GCP Console → Cloud Logging → filter by `resource.type=cloud_function` |
| Firestore reads/writes | Firebase Console → Usage tab |
| Auth events | Firebase Console → Authentication → Usage |
| Error rates | GCP Console → Error Reporting |
| Mail delivery | Firestore `mail_outbox` collection → filter `status: "FAILED"` |

### Alert: mail delivery failures

Query in Firebase Console or GCP:
```
Firestore: mail_outbox WHERE status = "FAILED" ORDER BY _createdAt DESC
```

Re-queue by updating `status` to `"PENDING"` and `retryCount` to `0`.

---

## Common Issues

| Symptom | Likely Cause | Fix |
|---|---|---|
| "Empty Authorization header" on callable | Stale Firebase token | App calls `getIdToken(true)` before callables — check `EntityService.js` |
| Provisioning stuck at step 1 | `finalBatch.commit()` race | Check Cloud Function logs for partial success response |
| Country list not loading | `subscribeToCollection` arg order | Confirmed fixed (Phase A) — check for similar patterns |
| HR employees from other entities visible | Firestore rules or `skipEntityFilter:true` | Check `businessContext.jsx` subscriptions |
| New user sees wrong modules | Custom claims not set | Run `setUserRole` Cloud Function for that user |
