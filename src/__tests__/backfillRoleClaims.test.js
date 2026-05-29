/**
 * Unit tests for the backfillRoleClaims + verifyRoleClaimsCoverage logic.
 *
 * We inline the core scanning + patching logic here (same approach as
 * provisioningSaga.test.js) to avoid firebase-admin import issues in jsdom.
 * We verify the algorithm rather than the CF wrapper.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Inline algorithm under test ──────────────────────────────────────────────
//
// Mirrors backfillRoleClaims.js business logic (list → compare → patch/report).

/**
 * @param {object[]} authUsers     Array of { uid, customClaims: { role? } }
 * @param {object}   firestoreRoles Map uid → role string (or undefined if no doc)
 * @param {boolean}  dryRun
 * @returns {object} stats
 */
async function runBackfill(authUsers, firestoreRoles, dryRun = false) {
  const stats = {
    scanned: 0,
    patched: 0,
    alreadyCorrect: 0,
    skippedNoFirestoreRole: 0,
    errors: [],
    claimsSet: [], // records what would be set (for assertions)
  };

  const setClaimFn = vi.fn(async (uid, claims) => {
    stats.claimsSet.push({ uid, claims });
  });

  for (const user of authUsers) {
    stats.scanned++;
    const firestoreRole = firestoreRoles[user.uid] ?? null;

    if (!firestoreRole) {
      stats.skippedNoFirestoreRole++;
      continue;
    }

    const claimRole = user.customClaims?.role ?? null;
    if (claimRole === firestoreRole) {
      stats.alreadyCorrect++;
      continue;
    }

    if (!dryRun) {
      try {
        const mergedClaims = { ...(user.customClaims ?? {}), role: firestoreRole };
        await setClaimFn(user.uid, mergedClaims);
        stats.patched++;
      } catch (err) {
        stats.errors.push({ uid: user.uid, error: err.message });
      }
    } else {
      stats.patched++; // dry-run: count as would-be patched
    }
  }

  return { stats, setClaimFn };
}

/**
 * @param {object[]} authUsers     Array of { uid, customClaims: { role? } }
 * @param {object}   firestoreRoles Map uid → role string
 * @returns {object} coverage report
 */
function runCoverageCheck(authUsers, firestoreRoles) {
  const report = {
    scanned: 0,
    covered: 0,
    uncovered: 0,
    uncoveredUids: [],
    noFirestoreRole: 0,
    errors: [],
  };

  for (const user of authUsers) {
    report.scanned++;
    const firestoreRole = firestoreRoles[user.uid] ?? null;
    if (!firestoreRole) {
      report.noFirestoreRole++;
      continue;
    }
    const claimRole = user.customClaims?.role ?? null;
    if (claimRole === firestoreRole) {
      report.covered++;
    } else {
      report.uncovered++;
      if (report.uncoveredUids.length < 100) {
        report.uncoveredUids.push({ uid: user.uid, claimRole, firestoreRole });
      }
    }
  }

  report.allCovered      = report.uncovered === 0 && report.errors.length === 0;
  report.a3DeploymentSafe = report.allCovered;
  return report;
}

// ─── Test data ────────────────────────────────────────────────────────────────

const USERS_CLEAN = [
  { uid: 'u1', customClaims: { role: 'ADMIN' } },
  { uid: 'u2', customClaims: { role: 'MANAGER' } },
  { uid: 'u3', customClaims: { role: 'STAFF' } },
];
const ROLES_CLEAN = { u1: 'ADMIN', u2: 'MANAGER', u3: 'STAFF' };

const USERS_PARTIAL = [
  { uid: 'u1', customClaims: { role: 'ADMIN' } },        // correct
  { uid: 'u2', customClaims: { role: 'STAFF' } },        // wrong claim
  { uid: 'u3', customClaims: null },                      // missing claim
  { uid: 'u4', customClaims: { role: 'SUPER_ADMIN' } },  // no Firestore doc
];
const ROLES_PARTIAL = { u1: 'ADMIN', u2: 'MANAGER', u3: 'STAFF' };  // u4 not present

// ─── backfillRoleClaims ───────────────────────────────────────────────────────

describe('backfillRoleClaims — happy path', () => {
  it('skips users whose claim already matches Firestore', async () => {
    const { stats } = await runBackfill(USERS_CLEAN, ROLES_CLEAN, false);
    expect(stats.scanned).toBe(3);
    expect(stats.alreadyCorrect).toBe(3);
    expect(stats.patched).toBe(0);
    expect(stats.skippedNoFirestoreRole).toBe(0);
    expect(stats.errors).toHaveLength(0);
  });

  it('patches users with wrong or missing claims', async () => {
    const { stats, setClaimFn } = await runBackfill(USERS_PARTIAL, ROLES_PARTIAL, false);
    expect(stats.scanned).toBe(4);
    expect(stats.alreadyCorrect).toBe(1);   // u1 is correct
    expect(stats.patched).toBe(2);           // u2 (wrong) + u3 (missing)
    expect(stats.skippedNoFirestoreRole).toBe(1); // u4 has no Firestore doc
    expect(stats.errors).toHaveLength(0);
    expect(setClaimFn).toHaveBeenCalledTimes(2);
  });

  it('sets the correct role when patching', async () => {
    const { stats } = await runBackfill(USERS_PARTIAL, ROLES_PARTIAL, false);
    // u2 should get role: 'MANAGER' (from Firestore)
    const u2Patch = stats.claimsSet.find(c => c.uid === 'u2');
    expect(u2Patch?.claims?.role).toBe('MANAGER');
    // u3 should get role: 'STAFF'
    const u3Patch = stats.claimsSet.find(c => c.uid === 'u3');
    expect(u3Patch?.claims?.role).toBe('STAFF');
  });

  it('preserves existing non-role claims when patching', async () => {
    const users = [{ uid: 'u1', customClaims: { role: 'STAFF', entity_id: 'ent_001' } }];
    const roles  = { u1: 'MANAGER' }; // role is wrong
    const { stats } = await runBackfill(users, roles, false);
    expect(stats.patched).toBe(1);
    expect(stats.claimsSet[0].claims).toEqual({ role: 'MANAGER', entity_id: 'ent_001' });
  });

  it('skips users with no Firestore role document', async () => {
    const { stats } = await runBackfill(USERS_PARTIAL, ROLES_PARTIAL, false);
    expect(stats.skippedNoFirestoreRole).toBe(1); // u4 has no Firestore role
  });
});

describe('backfillRoleClaims — dryRun mode', () => {
  it('counts would-be patches without calling setCustomUserClaims', async () => {
    const { stats, setClaimFn } = await runBackfill(USERS_PARTIAL, ROLES_PARTIAL, true);
    expect(stats.patched).toBe(2);       // u2 + u3 counted
    expect(setClaimFn).not.toHaveBeenCalled(); // no real mutation
  });

  it('returns the same scanned count as live mode', async () => {
    const { stats: dry  } = await runBackfill(USERS_PARTIAL, ROLES_PARTIAL, true);
    const { stats: live } = await runBackfill(USERS_PARTIAL, ROLES_PARTIAL, false);
    expect(dry.scanned).toBe(live.scanned);
    expect(dry.alreadyCorrect).toBe(live.alreadyCorrect);
    expect(dry.skippedNoFirestoreRole).toBe(live.skippedNoFirestoreRole);
  });
});

describe('backfillRoleClaims — edge cases', () => {
  it('handles an empty user list', async () => {
    const { stats } = await runBackfill([], {}, false);
    expect(stats.scanned).toBe(0);
    expect(stats.patched).toBe(0);
  });

  it('handles all users having no Firestore role', async () => {
    const { stats } = await runBackfill(USERS_CLEAN, {}, false);
    expect(stats.skippedNoFirestoreRole).toBe(3);
    expect(stats.patched).toBe(0);
  });

  it('is idempotent: running twice changes nothing on second run', async () => {
    // First run: patch u2 and u3
    const { stats: first } = await runBackfill(USERS_PARTIAL, ROLES_PARTIAL, false);
    expect(first.patched).toBe(2);

    // Simulate second run: apply the patched claims to the user objects
    const usersAfterPatch = USERS_PARTIAL.map(u => {
      if (u.uid === 'u2') return { ...u, customClaims: { role: 'MANAGER' } };
      if (u.uid === 'u3') return { ...u, customClaims: { role: 'STAFF' } };
      return u;
    });
    const { stats: second } = await runBackfill(usersAfterPatch, ROLES_PARTIAL, false);
    expect(second.patched).toBe(0);
    expect(second.alreadyCorrect).toBe(3); // u1 + u2 + u3 now all correct; u4 skipped (no Firestore role)
  });
});

// ─── verifyRoleClaimsCoverage ────────────────────────────────────────────────

describe('verifyRoleClaimsCoverage — coverage report', () => {
  it('returns a3DeploymentSafe=true when all users have correct claims', () => {
    const report = runCoverageCheck(USERS_CLEAN, ROLES_CLEAN);
    expect(report.a3DeploymentSafe).toBe(true);
    expect(report.covered).toBe(3);
    expect(report.uncovered).toBe(0);
    expect(report.uncoveredUids).toHaveLength(0);
  });

  it('returns a3DeploymentSafe=false when any user has wrong/missing claim', () => {
    const report = runCoverageCheck(USERS_PARTIAL, ROLES_PARTIAL);
    expect(report.a3DeploymentSafe).toBe(false);
    expect(report.uncovered).toBe(2); // u2 (wrong) + u3 (missing)
    expect(report.covered).toBe(1);   // u1
    expect(report.noFirestoreRole).toBe(1); // u4
  });

  it('includes uid details for uncovered users (up to 100)', () => {
    const report = runCoverageCheck(USERS_PARTIAL, ROLES_PARTIAL);
    const u2entry = report.uncoveredUids.find(e => e.uid === 'u2');
    expect(u2entry).toBeDefined();
    expect(u2entry.claimRole).toBe('STAFF');
    expect(u2entry.firestoreRole).toBe('MANAGER');
  });

  it('does not include users with no Firestore doc in covered or uncovered', () => {
    const report = runCoverageCheck(USERS_PARTIAL, ROLES_PARTIAL);
    const allUids = [...report.uncoveredUids.map(e => e.uid)];
    expect(allUids).not.toContain('u4'); // u4 has no Firestore role → noFirestoreRole bucket
  });

  it('handles empty user list', () => {
    const report = runCoverageCheck([], {});
    expect(report.a3DeploymentSafe).toBe(true);
    expect(report.scanned).toBe(0);
  });

  it('caps uncoveredUids at 100 entries', () => {
    const bigUsers = Array.from({ length: 200 }, (_, i) => ({
      uid: `u${i}`,
      customClaims: { role: 'WRONG_ROLE' },
    }));
    const bigRoles = Object.fromEntries(bigUsers.map(u => [u.uid, 'CORRECT_ROLE']));
    const report = runCoverageCheck(bigUsers, bigRoles);
    expect(report.uncovered).toBe(200);
    expect(report.uncoveredUids).toHaveLength(100); // capped
  });
});
