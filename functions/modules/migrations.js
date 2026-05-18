/**
 * ════════════════════════════════════════════════════════════════════════════
 * MIGRATIONS — One-shot data backfills
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Callable Cloud Functions used to migrate legacy data when Firestore Rules
 * tighten. Each migration is idempotent and SUPER_ADMIN-only.
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');

const db   = () => admin.firestore();
const auth = () => admin.auth();

function requireSuperAdmin(request) {
  const role = request.auth?.token?.role || '';
  if (role !== 'SUPER_ADMIN') {
    throw new HttpsError('permission-denied', 'SUPER_ADMIN required.');
  }
}

/**
 * Backfill `entity_id` on `hr_private` legacy sub-collection docs that were
 * created before the 3-SPACE isolation tightening (A.1.b). Looks up the
 * parent user's entity_id and writes it on each child doc.
 *
 * Idempotent: skips docs that already have entity_id.
 * Returns: { scanned, patched, skippedNoUserEntity }
 */
exports.backfillHrPrivateEntityId = onCall(
  { region: 'europe-west1', timeoutSeconds: 540 },
  async (request) => {
    requireSuperAdmin(request);
    logger.info('[backfillHrPrivateEntityId] Starting backfill...');

    let scanned = 0;
    let patched = 0;
    let skippedNoUserEntity = 0;

    // collectionGroup query reaches every /users/{uid}/hr_private/* doc.
    const snap = await db().collectionGroup('hr_private').get();
    scanned = snap.size;
    logger.info(`[backfillHrPrivateEntityId] Found ${scanned} docs.`);

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      if (data.entity_id) continue;

      // Parent doc id == user uid
      const userUid = docSnap.ref.parent.parent?.id;
      if (!userUid) {
        skippedNoUserEntity++;
        continue;
      }

      try {
        const userDoc = await db().collection('users').doc(userUid).get();
        const entity_id = userDoc.exists ? userDoc.data().entity_id : null;
        if (!entity_id) {
          skippedNoUserEntity++;
          continue;
        }
        await docSnap.ref.update({
          entity_id,
          _backfilledAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        patched++;
      } catch (err) {
        logger.warn(`[backfillHrPrivateEntityId] Skipped ${docSnap.ref.path}: ${err.message}`);
        skippedNoUserEntity++;
      }
    }

    logger.info(`[backfillHrPrivateEntityId] Done. scanned=${scanned} patched=${patched} skipped=${skippedNoUserEntity}`);
    return { scanned, patched, skippedNoUserEntity };
  }
);
