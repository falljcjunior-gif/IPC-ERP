/**
 * ════════════════════════════════════════════════════════════════════════════
 * PURGE FIRESTORE — Modules supprimés (commerce, website, maintenance,
 *                   procurement, esg, esg_consolidated, foundation_esg_reports)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Exécution : cd functions && node ../scripts/purge_removed_modules.cjs
 *
 * Pré-requis : Application Default Credentials
 *   → gcloud auth application-default login    (une seule fois)
 *
 * À EXÉCUTER APRÈS le déploiement des nouvelles firestore.rules.
 * Supprime tous les documents des collections obsolètes.
 */

const path  = require('path');
const admin = require(path.join(__dirname, '..', 'functions', 'node_modules', 'firebase-admin'));

admin.initializeApp({ projectId: 'ipc-erp' });
const db = admin.firestore();

const COLLECTIONS_TO_PURGE = [
  'commerce',
  'website',
  'maintenance',
  'procurement',
  'esg',
  'esg_consolidated',
  'foundation_esg_reports',
];

const BATCH_SIZE = 400;

async function purgeCollection(name) {
  const ref = db.collection(name);
  let totalDeleted = 0;
  while (true) {
    const snap = await ref.limit(BATCH_SIZE).get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    totalDeleted += snap.size;
    process.stdout.write(`  ${name}: ${totalDeleted} docs supprimés…\r`);
    if (snap.size < BATCH_SIZE) break;
  }
  console.log(`  ${name}: ${totalDeleted} docs supprimés. ✓`);
}

(async () => {
  console.log('▶ Purge Firestore — modules supprimés');
  for (const coll of COLLECTIONS_TO_PURGE) {
    try {
      await purgeCollection(coll);
    } catch (err) {
      console.error(`  ${coll}: ERREUR —`, err.message);
    }
  }
  console.log('✓ Purge terminée.');
  process.exit(0);
})();
