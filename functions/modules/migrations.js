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

const db = () => admin.firestore();

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

/**
 * Backfill `entity_id` on legacy Foundation documents created before the
 * 3-SPACE isolation tightening of 2026-05-29 (foundation_* collections now
 * require canReadOwnEntity / canWriteOwnEntity).
 *
 * These are TOP-LEVEL collections (no parent doc), so entity_id is resolved
 * from the creator's profile: doc._createdBy → users/{uid}.entity_id.
 * If that fails and `defaultEntityId` is provided, it is used as a fallback
 * (useful when all legacy docs belong to a single known foundation).
 *
 * SUPER_ADMIN-only. Idempotent: docs that already carry entity_id are skipped.
 *
 * @param {object} request.data
 * @param {boolean} [request.data.dryRun=false]      Report only, write nothing.
 * @param {string}  [request.data.defaultEntityId]   Fallback entity_id when _createdBy can't resolve.
 * @returns {{ dryRun, totals, perCollection, unresolved }}
 */
const FOUNDATION_COLLECTIONS = [
  'foundation_donations',
  'foundation_programs',
  'foundation_beneficiaries',
  'foundation_campaigns',
  'foundation_finance',
  'foundation_partners',
  'foundation_governance',
];

exports.backfillFoundationEntityId = onCall(
  { region: 'europe-west1', enforceAppCheck: true, timeoutSeconds: 540 },
  async (request) => {
    requireSuperAdmin(request);
    const dryRun          = request.data?.dryRun === true;
    const defaultEntityId = (request.data?.defaultEntityId || '').trim() || null;

    logger.info(`[backfillFoundationEntityId] Starting (dryRun=${dryRun}, defaultEntityId=${defaultEntityId || 'none'})...`);

    const userEntityCache = new Map(); // uid → entity_id | null
    async function resolveCreatorEntity(uid) {
      if (!uid) return null;
      if (userEntityCache.has(uid)) return userEntityCache.get(uid);
      let entity = null;
      try {
        const u = await db().collection('users').doc(uid).get();
        entity = u.exists ? (u.data().entity_id || null) : null;
      } catch (e) {
        logger.warn(`[backfillFoundationEntityId] user lookup failed for ${uid}: ${e.message}`);
      }
      userEntityCache.set(uid, entity);
      return entity;
    }

    const perCollection = {};
    const unresolved    = []; // { path } docs we could not resolve an entity for
    let totalScanned = 0, totalPatched = 0, totalSkipped = 0, totalUnresolved = 0;

    for (const coll of FOUNDATION_COLLECTIONS) {
      let scanned = 0, patched = 0, skipped = 0, unresolvedCount = 0;
      const snap = await db().collection(coll).get();
      scanned = snap.size;

      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        if (data.entity_id) { skipped++; continue; } // idempotent

        let entity_id = await resolveCreatorEntity(data._createdBy);
        if (!entity_id) entity_id = defaultEntityId;

        if (!entity_id) {
          unresolvedCount++;
          unresolved.push({ path: docSnap.ref.path });
          continue;
        }

        if (!dryRun) {
          await docSnap.ref.update({
            entity_id,
            _backfilledAt: admin.firestore.FieldValue.serverTimestamp(),
            _backfillSource: data._createdBy ? 'creator_profile' : 'default_entity',
          });
        }
        patched++;
      }

      perCollection[coll] = { scanned, patched, skipped, unresolved: unresolvedCount };
      totalScanned += scanned; totalPatched += patched; totalSkipped += skipped; totalUnresolved += unresolvedCount;
      logger.info(`[backfillFoundationEntityId] ${coll}: scanned=${scanned} patched=${patched} skipped=${skipped} unresolved=${unresolvedCount}`);
    }

    // Audit log (skip on dryRun)
    if (!dryRun) {
      try {
        await db().collection('audit_logs').add({
          operation:  'BACKFILL_FOUNDATION_ENTITY_ID',
          actorUid:   request.auth.uid,
          callerRole: request.auth.token?.role || null,
          summary:    `Backfill entity_id fondations — patched=${totalPatched}, unresolved=${totalUnresolved}`,
          perCollection,
          defaultEntityId,
          _subModule: 'migrations',
          timestamp:  admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (e) {
        logger.warn(`[backfillFoundationEntityId] audit log failed: ${e.message}`);
      }
    }

    logger.info(`[backfillFoundationEntityId] Done. scanned=${totalScanned} patched=${totalPatched} skipped=${totalSkipped} unresolved=${totalUnresolved}`);
    return {
      dryRun,
      totals: { scanned: totalScanned, patched: totalPatched, skipped: totalSkipped, unresolved: totalUnresolved },
      perCollection,
      unresolved: unresolved.slice(0, 200), // cap payload
    };
  }
);
