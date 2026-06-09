/**
 * REPAIR SCRIPT — Restore SUPER_ADMIN role for Holding users incorrectly demoted to EMPLOYEE
 *
 * This is a one-off remediation for the silent SUPER_ADMIN → EMPLOYEE demotion bug
 * fixed in PR #53. Run this ONCE to restore the correct roles.
 *
 * Usage:
 *   node functions/repair_holding_super_admins.cjs
 *
 * Prerequisites:
 *   firebase login (or GOOGLE_APPLICATION_CREDENTIALS set)
 */

const admin = require('firebase-admin');

admin.initializeApp({ projectId: 'ipc-erp' });

const db   = admin.firestore();
const auth = admin.auth();

// ── Users to restore (email → target role) ───────────────────────────────────
// Add both Holding SUPER_ADMINs here.
const USERS_TO_RESTORE = [
  { email: 'fall.jcjunior@gmail.com',    targetRole: 'SUPER_ADMIN', entity_type: 'HOLDING', entity_id: 'ipc_green_blocks' },
  { email: 'ra.yoman@ipcgreenblocks.com', targetRole: 'SUPER_ADMIN', entity_type: 'HOLDING', entity_id: 'ipc_green_blocks' },
  { email: 'n.marre@ipcgreenblocks.com',  targetRole: 'SUPER_ADMIN', entity_type: 'HOLDING', entity_id: 'ipc_green_blocks' },
];

async function repairUser({ email, targetRole, entity_type, entity_id }) {
  console.log(`\n▶ Processing ${email}…`);

  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
  } catch (err) {
    console.warn(`  ⚠️  User not found in Firebase Auth: ${email} — skipping`);
    return;
  }

  const uid = userRecord.uid;
  const currentClaims = userRecord.customClaims || {};
  console.log(`  UID: ${uid}`);
  console.log(`  Current claims role: ${currentClaims.role || '(none)'}`);

  // Read Firestore doc
  const snap = await db.collection('users').doc(uid).get();
  const fsRole = snap.exists ? snap.data()?.role : '(doc missing)';
  console.log(`  Firestore role: ${fsRole}`);

  if (currentClaims.role === targetRole && fsRole === targetRole) {
    console.log(`  ✅ Already ${targetRole} — no action needed.`);
    return;
  }

  // 1. Update Custom Claims
  const newClaims = {
    ...currentClaims,
    role: targetRole,
    entity_type: entity_type || currentClaims.entity_type || 'HOLDING',
    entity_id:   entity_id   || currentClaims.entity_id   || 'ipc_green_blocks',
    tenant_id:   currentClaims.tenant_id || 'ipc_group',
  };
  await auth.setCustomUserClaims(uid, newClaims);
  console.log(`  ✅ Custom Claims updated → role: ${targetRole}`);

  // 2. Update Firestore
  await db.collection('users').doc(uid).set({
    role:        targetRole,
    entity_type: newClaims.entity_type,
    entity_id:   newClaims.entity_id,
    departement: 'DIRECTION',
    _roleRepairedAt: admin.firestore.FieldValue.serverTimestamp(),
    _roleRepairedBy: 'repair_holding_super_admins.cjs',
  }, { merge: true });
  console.log(`  ✅ Firestore updated → role: ${targetRole}`);

  // 3. Revoke refresh tokens → forces re-login with fresh claims
  await auth.revokeRefreshTokens(uid);
  console.log(`  ✅ Tokens revoked — user must re-login to get new claims`);

  // 4. Audit log
  await db.collection('audit_logs').add({
    timestamp:   admin.firestore.FieldValue.serverTimestamp(),
    operation:   'REPAIR_ROLE',
    collection:  'users',
    docId:       uid,
    changedBy:   'repair_holding_super_admins.cjs',
    oldRole:     currentClaims.role || fsRole,
    newRole:     targetRole,
    changes:     { role: { from: currentClaims.role || fsRole, to: targetRole } },
    summary:     `Role repaired: ${currentClaims.role || fsRole} → ${targetRole} for ${email}`,
  });
  console.log(`  ✅ Audit log written`);
}

async function main() {
  console.log('🔧 Repair: Restore SUPER_ADMIN for Holding users');
  console.log('═══════════════════════════════════════════════');

  for (const user of USERS_TO_RESTORE) {
    await repairUser(user);
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log('🎉 Repair complete. Ask affected users to log out and back in.');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
