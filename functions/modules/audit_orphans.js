/**
 * ══════════════════════════════════════════════════════════════
 * AUDIT ORPHAN USERS — Daily scheduled function
 * ══════════════════════════════════════════════════════════════
 *
 * Runs once a day. Scans /users for documents with:
 *   - entity_id missing / null / empty
 *   - entity_id pointing to a non-existent organization
 *   - role missing
 *   - claims out-of-sync with the Firestore doc (role mismatch)
 *
 * Writes findings to /audit_logs (operation: ORPHAN_USER_SWEEP) AND
 * a separate /system_alerts/{uid_YYYY-MM-DD} doc so the dashboard
 * surface can render the list. Never auto-mutates user records —
 * remediation is explicit (call migrateGuestToEmployee or fix manually).
 *
 * Schedule: every day at 03:00 Europe/Paris.
 */

const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

async function runOrphanSweep(triggeredBy = 'schedule') {
  const startedAt = Date.now();
  const todayKey = new Date().toISOString().slice(0, 10);
  logger.info(`[OrphanSweep] Starting — triggered by ${triggeredBy}`);

  // 1. Load all known organization ids — used to detect dangling entity_ids
  const orgsSnap = await db.collection('organizations').get();
  const knownEntityIds = new Set(orgsSnap.docs.map(d => d.id));
  // Allow a few well-known defaults
  ['ipc_group', 'ipc_holding', 'ipc_green_blocks', 'ipc_collect'].forEach(id => knownEntityIds.add(id));

  // 2. Scan users
  const usersSnap = await db.collection('users').get();
  const findings = [];

  for (const docSnap of usersSnap.docs) {
    const uid  = docSnap.id;
    const data = docSnap.data() || {};
    if (data._deletedAt) continue; // soft-deleted — not an orphan

    const issues = [];
    if (!data.entity_id) issues.push('MISSING_ENTITY_ID');
    else if (!knownEntityIds.has(data.entity_id)) issues.push(`UNKNOWN_ENTITY:${data.entity_id}`);
    if (!data.role) issues.push('MISSING_ROLE');
    if (data.role === 'GUEST') issues.push('LEGACY_GUEST_ROLE');
    if (!data.entity_type) issues.push('MISSING_ENTITY_TYPE');

    // Check Custom Claims sync
    try {
      const userRecord = await admin.auth().getUser(uid);
      const claims = userRecord.customClaims || {};
      if (claims.role && claims.role !== data.role) {
        issues.push(`CLAIM_ROLE_MISMATCH:claim=${claims.role},doc=${data.role}`);
      }
      if (claims.entity_id && claims.entity_id !== data.entity_id) {
        issues.push(`CLAIM_ENTITY_MISMATCH:claim=${claims.entity_id},doc=${data.entity_id}`);
      }
    } catch (e) {
      issues.push('AUTH_RECORD_MISSING');
    }

    if (issues.length > 0) {
      findings.push({
        uid,
        email: data.email || null,
        nom: data.profile?.nom || data.nom || null,
        entity_id: data.entity_id || null,
        role: data.role || null,
        issues,
      });
    }
  }

  // 3. Write summary + alerts
  const elapsed = Date.now() - startedAt;
  const summary = {
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    collection: 'users',
    operation: 'ORPHAN_USER_SWEEP',
    changedBy: triggeredBy,
    summary: `Sweep terminé: ${findings.length} anomalies / ${usersSnap.size} users en ${elapsed}ms`,
    payload: { findings, totalUsers: usersSnap.size, durationMs: elapsed, runDate: todayKey },
  };
  await db.collection('audit_logs').add(summary);

  // Per-user alert doc — idempotent on (uid, date) so daily runs replace
  // yesterday's snapshot instead of accumulating noise.
  const batch = db.batch();
  for (const f of findings) {
    const ref = db.collection('system_alerts').doc(`${f.uid}_${todayKey}`);
    batch.set(ref, {
      ...f,
      kind: 'ORPHAN_USER',
      severity: f.issues.some(i => i.startsWith('MISSING_') || i.startsWith('CLAIM_')) ? 'HIGH' : 'MEDIUM',
      detectedAt: admin.firestore.FieldValue.serverTimestamp(),
      runDate: todayKey,
    });
  }
  if (findings.length > 0) await batch.commit();

  logger.info(`[OrphanSweep] DONE — ${findings.length} orphan(s) flagged out of ${usersSnap.size} users (${elapsed}ms)`);
  return { totalUsers: usersSnap.size, orphans: findings.length, elapsed, findings };
}

// Scheduled — every day at 03:00 Europe/Paris
exports.auditOrphanUsersScheduled = onSchedule({
  schedule: 'every day 03:00',
  timeZone: 'Europe/Paris',
  region: 'europe-west1',
  retryCount: 2,
}, async () => {
  await runOrphanSweep('schedule');
});

// Manual trigger — SUPER_ADMIN only, useful for on-demand health checks
exports.auditOrphanUsersNow = onCall({
  region: 'europe-west1',
  maxInstances: 1,
}, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Authentification requise.');
  if (request.auth.token?.role !== 'SUPER_ADMIN') {
    throw new HttpsError('permission-denied', 'SUPER_ADMIN uniquement.');
  }
  return await runOrphanSweep(`manual:${request.auth.uid}`);
});
