#!/usr/bin/env node
/**
 * One-off migration: GUEST → EMPLOYEE
 *
 * Runs directly against the production Firestore + Firebase Auth using
 * Application Default Credentials (gcloud auth application-default login).
 *
 * Equivalent to the migrateGuestToEmployee Cloud Function, but executable
 * locally without needing the function to be deployed first.
 *
 * Usage:
 *   gcloud auth application-default login   # one-time
 *   node scripts/migrate-guest-to-employee.js
 */

const admin = require('firebase-admin');

admin.initializeApp({
  projectId: 'ipc-erp',
});

const db = admin.firestore();
const auth = admin.auth();

(async () => {
  const startedAt = Date.now();
  console.log('[migrate] Querying users with role == "GUEST"...');

  const snap = await db.collection('users').where('role', '==', 'GUEST').get();
  if (snap.empty) {
    console.log('[migrate] No GUEST users found. Nothing to do.');
    process.exit(0);
  }

  console.log(`[migrate] Found ${snap.size} GUEST user(s). Migrating...`);

  let migrated = 0;
  const errors = [];

  for (const docSnap of snap.docs) {
    const uid = docSnap.id;
    const email = docSnap.data()?.email || '(no email)';
    try {
      // 1. Firestore role + permissions update
      const data = docSnap.data() || {};
      const prevPerms = data.permissions || {};
      const nextPerms = { ...prevPerms, roles: ['EMPLOYEE'] };

      await docSnap.ref.update({
        role: 'EMPLOYEE',
        permissions: nextPerms,
        _migratedFromGuestAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 2. Custom Claims
      let existingClaims = {};
      try {
        const userRecord = await auth.getUser(uid);
        existingClaims = userRecord.customClaims || {};
      } catch (e) {
        console.warn(`[migrate] ${uid}: Auth user not found, skipping claims update`);
      }
      if (Object.keys(existingClaims).length > 0 || true) {
        await auth.setCustomUserClaims(uid, { ...existingClaims, role: 'EMPLOYEE' }).catch(() => {});
        await auth.revokeRefreshTokens(uid).catch(() => {});
      }

      // 3. Audit log
      await db.collection('audit_logs').add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        collection: 'users',
        docId: uid,
        operation: 'MIGRATE_GUEST_TO_EMPLOYEE',
        changedBy: 'script:migrate-guest-to-employee',
        summary: 'Migration automatique GUEST → EMPLOYEE',
      });

      console.log(`[migrate]   ✓ ${email} (${uid})`);
      migrated++;
    } catch (err) {
      console.error(`[migrate]   ✗ ${email} (${uid}): ${err.message}`);
      errors.push({ uid, email, error: err.message });
    }
  }

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`[migrate] DONE in ${elapsed}s`);
  console.log(`[migrate]   Migrated:  ${migrated} / ${snap.size}`);
  console.log(`[migrate]   Errors:    ${errors.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (errors.length > 0) {
    console.log('[migrate] Error details:');
    errors.forEach(e => console.log(`  - ${e.uid} (${e.email}): ${e.error}`));
    process.exit(1);
  }
  process.exit(0);
})().catch(err => {
  console.error('[migrate] FATAL:', err.message);
  console.error(err.stack);
  process.exit(2);
});
