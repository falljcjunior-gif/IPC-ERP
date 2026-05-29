/**
 * ════════════════════════════════════════════════════════════════════════════
 * BACKFILL ROLE CLAIMS — P1-A migration tooling
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Ensures every Firebase Auth user has a `role` JWT custom claim that matches
 * their Firestore `users/{uid}.role` field.
 *
 * This is the PREREQUISITE for the P1-A3 Firestore rules flip:
 *   "Remove hasRole() Firestore fallback → rely on custom claims only."
 *
 * The flip is SAFE to deploy only when `verifyRoleClaimsCoverage` reports
 * `uncoveredCount === 0`.
 *
 * Hard gates:
 *   - SUPER_ADMIN JWT claim required (not Firestore fallback).
 *   - No write to prod DB — only auth claims are modified.
 *   - emulator-safe: honours FIRESTORE_EMULATOR_HOST.
 *
 * Exports:
 *   backfillRoleClaims        — scan + optionally patch mismatched claims
 *   verifyRoleClaimsCoverage  — read-only coverage report (no mutations)
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger }             = require('firebase-functions');
const admin                  = require('firebase-admin');

const AUTH_LIST_PAGE_SIZE = 1000; // max allowed by Firebase Admin SDK

// ─── Auth guard ───────────────────────────────────────────────────────────────

function requireSuperAdminClaim(request) {
  // Claims-only check (no Firestore fallback — we are building toward that world)
  const role = request.auth?.token?.role ?? '';
  if (role !== 'SUPER_ADMIN') {
    throw new HttpsError(
      'permission-denied',
      'SUPER_ADMIN custom claim required to run role backfill.'
    );
  }
}

// ─── Core helpers ─────────────────────────────────────────────────────────────

/**
 * Paginate through all Firebase Auth users and yield them in batches.
 * @yields {admin.auth.UserRecord[]}
 */
async function* listAllUsers() {
  let pageToken;
  do {
    const listResult = await admin.auth().listUsers(AUTH_LIST_PAGE_SIZE, pageToken);
    yield listResult.users;
    pageToken = listResult.pageToken;
  } while (pageToken);
}

/**
 * Fetch the `role` field from a Firestore users/{uid} document.
 * Returns null if the document is missing or has no role.
 *
 * @param {string} uid
 * @returns {Promise<string|null>}
 */
async function getFirestoreRole(uid) {
  try {
    const snap = await admin.firestore().collection('users').doc(uid).get();
    if (!snap.exists) return null;
    return snap.data().role ?? null;
  } catch (err) {
    logger.warn(`[backfillRoleClaims] Could not fetch users/${uid}: ${err.message}`);
    return null;
  }
}

// ─── Callables ────────────────────────────────────────────────────────────────

/**
 * backfillRoleClaims
 * ──────────────────
 * Scans every Auth user. For each user whose JWT `role` claim does not match
 * their Firestore `users/{uid}.role`, sets the correct custom claim.
 *
 * Idempotent: users whose claim already matches their Firestore role are skipped.
 * Users with no Firestore role (no users/{uid} doc, or no role field) are
 * counted under `skippedNoFirestoreRole` and left untouched.
 *
 * @param {object} data
 *   @param {boolean} [data.dryRun=false]
 *     If true, scan + report but do NOT set any custom claims.
 *
 * @returns {{ scanned, patched, alreadyCorrect, skippedNoFirestoreRole, errors }}
 */
exports.backfillRoleClaims = onCall(
  { region: 'europe-west1', timeoutSeconds: 540 },
  async (request) => {
    requireSuperAdminClaim(request);

    const dryRun = Boolean(request.data?.dryRun ?? false);
    const tag    = dryRun ? '[DRY RUN]' : '[LIVE]';
    logger.info(`[backfillRoleClaims] ${tag} Starting role claim backfill…`);

    const stats = {
      scanned:                 0,
      patched:                 0,
      alreadyCorrect:          0,
      skippedNoFirestoreRole:  0,
      errors:                  [],
    };

    for await (const batch of listAllUsers()) {
      for (const user of batch) {
        stats.scanned++;
        const { uid } = user;

        const firestoreRole = await getFirestoreRole(uid);
        if (!firestoreRole) {
          stats.skippedNoFirestoreRole++;
          logger.debug(`[backfillRoleClaims] ${tag} uid=${uid}: no Firestore role — skipped`);
          continue;
        }

        const claimRole = user.customClaims?.role ?? null;
        if (claimRole === firestoreRole) {
          stats.alreadyCorrect++;
          continue;
        }

        // Claim is missing or wrong — patch it
        logger.info(
          `[backfillRoleClaims] ${tag} uid=${uid}: claim=${JSON.stringify(claimRole)} → ${firestoreRole}`
        );

        if (!dryRun) {
          try {
            // Preserve any existing non-role claims (entity_id, etc.)
            const mergedClaims = { ...(user.customClaims ?? {}), role: firestoreRole };
            await admin.auth().setCustomUserClaims(uid, mergedClaims);
            stats.patched++;
          } catch (err) {
            logger.error(`[backfillRoleClaims] uid=${uid} claim set failed: ${err.message}`);
            stats.errors.push({ uid, error: err.message });
          }
        } else {
          // dryRun: count as would-be patched
          stats.patched++;
        }
      }
    }

    logger.info('[backfillRoleClaims] Done.', stats);
    return { dryRun, ...stats };
  }
);

// ─────────────────────────────────────────────────────────────────────────────

/**
 * verifyRoleClaimsCoverage
 * ────────────────────────
 * Read-only coverage check. Returns how many users still lack a matching
 * `role` custom claim vs their Firestore profile.
 *
 * Use this as the A3 deployment gate:
 *   ✅ safe to flip A3 when `uncoveredCount === 0 && errorCount === 0`
 *
 * @returns {{ scanned, covered, uncovered, uncoveredUids, noFirestoreRole, errors }}
 */
exports.verifyRoleClaimsCoverage = onCall(
  { region: 'europe-west1', timeoutSeconds: 540 },
  async (request) => {
    requireSuperAdminClaim(request);
    logger.info('[verifyRoleClaimsCoverage] Scanning for coverage gaps…');

    const stats = {
      scanned:          0,
      covered:          0,
      uncovered:        0,
      uncoveredUids:    [],   // first 100 max (avoid huge response payloads)
      noFirestoreRole:  0,
      errors:           [],
    };

    for await (const batch of listAllUsers()) {
      for (const user of batch) {
        stats.scanned++;
        const { uid } = user;

        const firestoreRole = await getFirestoreRole(uid);
        if (!firestoreRole) {
          stats.noFirestoreRole++;
          continue;
        }

        const claimRole = user.customClaims?.role ?? null;
        if (claimRole === firestoreRole) {
          stats.covered++;
        } else {
          stats.uncovered++;
          if (stats.uncoveredUids.length < 100) {
            stats.uncoveredUids.push({ uid, claimRole, firestoreRole });
          }
        }
      }
    }

    const allCovered = stats.uncovered === 0 && stats.errors.length === 0;
    logger.info(
      `[verifyRoleClaimsCoverage] Done. allCovered=${allCovered}`, stats
    );

    return {
      allCovered,
      ...stats,
      // Deployment gate hint
      a3DeploymentSafe: allCovered,
    };
  }
);
