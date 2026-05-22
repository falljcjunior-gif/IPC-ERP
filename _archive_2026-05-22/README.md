# ⚠️ ARCHIVED — DO NOT RUN

These scripts are kept for **historical reference only**. They reverse-sync the
deprecated `/hr` Firestore collection back into `/users` with default role
`'GUEST'` (now retired), which would:

1. Silently revert the 2026-05-22 `GUEST → EMPLOYEE` migration
2. Overwrite canonical user profiles with stale `/hr` data
3. Create phantom users with mismatched UIDs

If you need to reconcile legacy data, write a new script that:

- Uses `EMPLOYEE` as the default role (never `GUEST`)
- Validates `entity_id` is present (rejects null/empty)
- Only **reads** `/hr` and merges into `/users` without overwriting newer fields
- Logs each mutation to `audit_logs`
- Is admin-gated and only runs once

Archived files:
- `fix_users_from_hr.js`
- `final_fix.js`
