#!/usr/bin/env node
/**
 * One-off: Set Yoman Raphael as SUPER_ADMIN at ipc_holding (HOLDING)
 *
 * Usage:
 *   node scripts/set-yoman-super-admin.cjs
 */

const admin = require('firebase-admin');

admin.initializeApp({ projectId: 'ipc-erp' });

const db    = admin.firestore();
const auth  = admin.auth();

async function run() {
  console.log('🔍 Searching for Yoman Raphael...');

  const snap = await db.collection('users').get();

  // Find by email or name
  const candidates = snap.docs.filter(d => {
    const data  = d.data();
    const email = (data.email || '').toLowerCase();
    const nom   = (data.profile?.nom || data.nom || '').toLowerCase();
    const prenom = (data.profile?.prenom || data.prenom || '').toLowerCase();
    return (
      email.includes('yoman') ||
      email.includes('raphael') ||
      nom.includes('raphael') ||
      prenom.includes('yoman')
    );
  });

  if (candidates.length === 0) {
    console.error('❌ No user found for Yoman Raphael. Listing all users for manual inspection:');
    snap.docs.forEach(d => {
      const data = d.data();
      console.log(` - ${d.id} | ${data.email} | ${data.role} | ${data.entity_id}`);
    });
    process.exit(1);
  }

  console.log(`✅ Found ${candidates.length} candidate(s):`);
  candidates.forEach(d => {
    const data = d.data();
    console.log(`   UID: ${d.id} | email: ${data.email} | role: ${data.role} | entity_id: ${data.entity_id}`);
  });

  // If multiple, pick the most likely (email with 'yoman' first)
  const doc = candidates.find(d => (d.data().email || '').includes('yoman')) || candidates[0];
  const uid  = doc.id;
  const data = doc.data();

  console.log(`\n🎯 Targeting UID: ${uid} (${data.email})`);
  console.log(`   Current: role=${data.role}, entity_id=${data.entity_id}, entity_type=${data.entity_type}`);

  // 1. Update Firestore /users/{uid}
  await db.collection('users').doc(uid).update({
    role:        'SUPER_ADMIN',
    entity_id:   'ipc_holding',
    entity_type: 'HOLDING',
    'profile.entity_id':   'ipc_holding',
    'profile.entity_type': 'HOLDING',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('✅ Firestore /users updated');

  // 2. Set Custom Claims
  await auth.setCustomUserClaims(uid, {
    role:        'SUPER_ADMIN',
    entity_id:   'ipc_holding',
    entity_type: 'HOLDING',
    permissions: {},
  });
  console.log('✅ Custom Claims updated');

  // 3. Revoke refresh tokens (force re-login to pick up new claims)
  await auth.revokeRefreshTokens(uid);
  console.log('✅ Refresh tokens revoked (user must re-login)');

  // 4. Write audit log
  await db.collection('audit_logs').add({
    timestamp:   admin.firestore.FieldValue.serverTimestamp(),
    collection:  'users',
    operation:   'SET_ROLE',
    changedBy:   'script:set-yoman-super-admin',
    targetUid:   uid,
    targetEmail: data.email,
    before: { role: data.role, entity_id: data.entity_id, entity_type: data.entity_type },
    after:  { role: 'SUPER_ADMIN', entity_id: 'ipc_holding', entity_type: 'HOLDING' },
  });
  console.log('✅ Audit log written');

  console.log('\n🏆 Done — Yoman Raphael is now SUPER_ADMIN @ ipc_holding (HOLDING)');
  console.log('   → User must re-login to get the new token with updated claims.');
  process.exit(0);
}

run().catch(err => {
  console.error('💥 Error:', err);
  process.exit(1);
});
