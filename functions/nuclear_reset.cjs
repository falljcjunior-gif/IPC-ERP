/**
 * ════════════════════════════════════════════════════════════════════
 * NEXUS OS — NUCLEAR RESET SCRIPT
 * ════════════════════════════════════════════════════════════════════
 * 
 * PURPOSE:
 *   Complete factory-reset of the ERP environment in preparation for
 *   the official production deployment. This script:
 *     1. Purges ALL Firebase Auth users EXCEPT fall.jcjunior@gmail.com
 *     2. Wipes specified Firestore collections (test/trial data)
 *     3. Resets auto-increment counters to zero
 *     4. Recreates the SUPER_ADMIN profile from scratch ("Renaissance")
 * 
 * SAFETY:
 *   - Requires explicit --confirm flag to execute
 *   - Preserves settings/core configuration document
 *   - Logs every action to console for full audit trail
 * 
 * USAGE:
 *   node functions/nuclear_reset.cjs                  # Dry-run (shows what WOULD happen)
 *   node functions/nuclear_reset.cjs --confirm        # Live execution
 * 
 * PRE-REQUISITES:
 *   - GOOGLE_APPLICATION_CREDENTIALS or firebase login
 *   - firebase-admin installed in functions/
 */

const admin = require('firebase-admin');

// ── Configuration ─────────────────────────────────────────────────
const ADMIN_EMAIL = 'fall.jcjunior@gmail.com';
const PROJECT_ID = 'ipc-erp';
const DRY_RUN = !process.argv.includes('--confirm');

// Collections to purge completely
const COLLECTIONS_TO_PURGE = [
  // Identity & Access
  'users',
  'employees',
  'permissions_audit',
  // HR
  'hr',
  // Business / Métier
  'crm',
  'crm_leads',
  'sales',
  'invoices',
  'transactions',
  'finance',
  'accounting',
  'inventory',
  'stock_movements',
  'purchase',
  'production',
  'logistics',
  'legal',
  'marketing',
  // Communication
  'messages',
  'rooms',
  'calls',
  'notifications',
  // Documents
  'documents',
  'signature',
  // Logs & System
  'sync_queue',
  'activity_logs',
  'activities',
  'error_reports',
  'audit_logs',
  'mail_logs',
  'office_supplies',
  'visitors_log',
  'facilities_tickets',
  // Workflows
  'workflows',
  'base',
];

// Collections to PRESERVE (never touch these)
const PRESERVED_COLLECTIONS = ['settings'];

// ── Initialization ────────────────────────────────────────────────
admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();
const auth = admin.auth();

// ── Utilities ─────────────────────────────────────────────────────
const log = (icon, msg) => console.log(`  ${icon}  ${msg}`);
const divider = () => console.log('─'.repeat(60));

/**
 * Delete all documents in a Firestore collection using batched writes.
 * Handles collections of any size via pagination.
 */
async function purgeCollection(collectionName) {
  const collRef = db.collection(collectionName);
  let totalDeleted = 0;

  while (true) {
    const snapshot = await collRef.limit(400).get();
    if (snapshot.empty) break;

    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));

    if (!DRY_RUN) {
      await batch.commit();
    }
    totalDeleted += snapshot.size;
  }

  return totalDeleted;
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 1 — FIREBASE AUTH CLEANUP
// ═══════════════════════════════════════════════════════════════════
async function phaseAuthCleanup() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  PHASE 1 — FIREBASE AUTH CLEANUP                    ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  let preserved = 0;
  let deleted = 0;
  let adminUid = null;

  const processPage = async (pageToken) => {
    const listResult = await auth.listUsers(1000, pageToken);

    for (const user of listResult.users) {
      if (user.email === ADMIN_EMAIL) {
        adminUid = user.uid;
        preserved++;
        log('🛡️', `PRESERVED: ${user.email} (${user.uid})`);
        continue;
      }

      if (!DRY_RUN) {
        await auth.deleteUser(user.uid);
      }
      deleted++;
      log('🗑️', `${DRY_RUN ? '[DRY-RUN] WOULD DELETE' : 'DELETED'}: ${user.email || user.uid}`);
    }

    if (listResult.pageToken) {
      await processPage(listResult.pageToken);
    }
  };

  await processPage();

  divider();
  log('📊', `Auth Summary: ${deleted} deleted, ${preserved} preserved`);
  return adminUid;
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 2 — FIRESTORE COLLECTIONS PURGE
// ═══════════════════════════════════════════════════════════════════
async function phaseFirestorePurge() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  PHASE 2 — FIRESTORE COLLECTIONS PURGE              ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  let totalDocs = 0;

  for (const collection of COLLECTIONS_TO_PURGE) {
    // Safety check: never purge preserved collections
    if (PRESERVED_COLLECTIONS.includes(collection)) {
      log('🛡️', `SKIPPED (preserved): ${collection}`);
      continue;
    }

    const count = await purgeCollection(collection);
    totalDocs += count;

    if (count > 0) {
      log('🗑️', `${DRY_RUN ? '[DRY-RUN]' : ''} ${collection}: ${count} documents ${DRY_RUN ? 'would be' : ''} purged`);
    } else {
      log('⬚ ', `${collection}: already empty`);
    }
  }

  divider();
  log('📊', `Firestore Summary: ${totalDocs} documents purged across ${COLLECTIONS_TO_PURGE.length} collections`);
  log('🛡️', `Preserved: ${PRESERVED_COLLECTIONS.join(', ')}`);
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 3 — RESET AUTO-INCREMENT COUNTERS
// ═══════════════════════════════════════════════════════════════════
async function phaseResetCounters() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  PHASE 3 — RESET AUTO-INCREMENT COUNTERS            ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  const countersToReset = {
    'settings/counters': {
      invoiceNumber: 0,
      quoteNumber: 0,
      purchaseOrderNumber: 0,
      employeeNumber: 0,
      projectNumber: 0,
      ticketNumber: 0,
      _resetAt: admin.firestore.FieldValue.serverTimestamp(),
      _resetReason: 'Nuclear Reset — Production deployment preparation',
    }
  };

  for (const [docPath, data] of Object.entries(countersToReset)) {
    if (!DRY_RUN) {
      await db.doc(docPath).set(data, { merge: true });
    }
    log('🔄', `${DRY_RUN ? '[DRY-RUN] WOULD RESET' : 'RESET'}: ${docPath}`);
    Object.entries(data).forEach(([key, val]) => {
      if (!key.startsWith('_')) {
        log('  ', `  ${key} → ${val}`);
      }
    });
  }

  divider();
  log('📊', 'All counters reset to zero');
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 4 — RENAISSANCE (RECREATE SUPER_ADMIN)
// ═══════════════════════════════════════════════════════════════════
async function phaseRenaissance(adminUid) {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  PHASE 4 — RENAISSANCE (SUPER_ADMIN REBIRTH)        ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  if (!adminUid) {
    // Lookup the admin user
    try {
      const adminUser = await auth.getUserByEmail(ADMIN_EMAIL);
      adminUid = adminUser.uid;
    } catch (err) {
      log('❌', `Admin user ${ADMIN_EMAIL} not found in Auth! Cannot proceed.`);
      return;
    }
  }

  const now = admin.firestore.FieldValue.serverTimestamp();

  // 1. Set Custom Claims
  if (!DRY_RUN) {
    await auth.setCustomUserClaims(adminUid, { role: 'SUPER_ADMIN' });
  }
  log('🔐', `${DRY_RUN ? '[DRY-RUN]' : ''} Custom Claims set: { role: 'SUPER_ADMIN' }`);

  // 2. Recreate Firestore /users/{uid}
  const userPayload = {
    _createdAt: now,
    _deletedAt: null,
    role: 'SUPER_ADMIN',
    departement: 'DIRECTION',
    permissions: {
      roles: ['SUPER_ADMIN'],
      allowedModules: ['*'],  // Full access
    },
    profile: {
      id: adminUid,
      email: ADMIN_EMAIL,
      nom: 'Fall JC Junior',
      createdAt: new Date().toISOString(),
    },
  };

  if (!DRY_RUN) {
    await db.collection('users').doc(adminUid).set(userPayload);
  }
  log('👤', `${DRY_RUN ? '[DRY-RUN]' : ''} /users/${adminUid} created (SUPER_ADMIN)`);

  // 3. Recreate Firestore /hr/{uid}
  const hrPayload = {
    _createdAt: now,
    _deletedAt: null,
    id: adminUid,
    email: ADMIN_EMAIL,
    nom: 'Fall JC Junior',
    subModule: 'employees',
    poste: 'Directeur Général',
    departement: 'DIRECTION',
    status: 'active',
  };

  if (!DRY_RUN) {
    await db.collection('hr').doc(adminUid).set(hrPayload);
  }
  log('📋', `${DRY_RUN ? '[DRY-RUN]' : ''} /hr/${adminUid} created (employee record)`);

  // 4. Revoke existing tokens to force fresh login with new claims
  if (!DRY_RUN) {
    await auth.revokeRefreshTokens(adminUid);
  }
  log('🔑', `${DRY_RUN ? '[DRY-RUN]' : ''} Refresh tokens revoked — fresh login required`);

  // 5. Write audit log for this reset
  if (!DRY_RUN) {
    await db.collection('audit_logs').add({
      timestamp: now,
      operation: 'NUCLEAR_RESET',
      executedBy: ADMIN_EMAIL,
      summary: 'Full ERP reset performed. All test data purged. SUPER_ADMIN profile recreated.',
      details: {
        collectionsWiped: COLLECTIONS_TO_PURGE,
        preservedCollections: PRESERVED_COLLECTIONS,
      },
    });
  }
  log('📝', `${DRY_RUN ? '[DRY-RUN]' : ''} Audit log recorded`);

  divider();
  log('🎉', 'Renaissance complete. System ready for first real Onboarding.');
}

// ═══════════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════════
async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║       NEXUS OS — NUCLEAR RESET PROCEDURE            ║');
  console.log('║       Project: ipc-erp                              ║');
  console.log(`║       Mode: ${DRY_RUN ? 'DRY-RUN (safe preview)  ' : '🔴 LIVE EXECUTION       '}              ║`);
  console.log(`║       Date: ${new Date().toISOString()}       ║`);
  console.log('╚══════════════════════════════════════════════════════╝');

  if (DRY_RUN) {
    console.log('\n  ⚠️  DRY-RUN MODE: No data will be modified.');
    console.log('  ⚠️  Run with --confirm to execute for real.\n');
  } else {
    console.log('\n  🔴 LIVE MODE: All changes are PERMANENT.\n');
  }

  try {
    // Phase 1: Auth cleanup
    const adminUid = await phaseAuthCleanup();

    // Phase 2: Firestore purge
    await phaseFirestorePurge();

    // Phase 3: Reset counters
    await phaseResetCounters();

    // Phase 4: Renaissance
    await phaseRenaissance(adminUid);

    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║              ✅ NUCLEAR RESET COMPLETE               ║');
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('');
    console.log('  Next steps:');
    console.log('  1. Log out of the app completely');
    console.log('  2. Log in with fall.jcjunior@gmail.com');
    console.log('  3. Navigate to Administration to verify SUPER_ADMIN access');
    console.log('  4. Start the first real employee Onboarding');
    console.log('');

    process.exit(0);
  } catch (err) {
    console.error('\n  ❌ FATAL ERROR:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
