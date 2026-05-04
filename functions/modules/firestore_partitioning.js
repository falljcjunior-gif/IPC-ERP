/**
 * ══════════════════════════════════════════════════════════════
 * FIRESTORE PARTITIONING — IPC Green Block
 * Utilitaire de préparation au partitionnement par tenant/année.
 *
 * STRUCTURE CIBLE (pour 100x de volume) :
 *   tenants/{tenantId}/finance/invoices/{year}/{month}/records/{docId}
 *   tenants/{tenantId}/crm/clients/{docId}
 *   tenants/{tenantId}/inventory/products/{docId}
 *   tenants/{tenantId}/notifications/{docId}
 *
 * MIGRATION : Ce module expose les helpers pour écrire dans les deux
 * structures simultanément (dualWrite) pendant la période de transition.
 * ══════════════════════════════════════════════════════════════
 */
const admin = require('firebase-admin');
const { logger } = require('firebase-functions');

const db = admin.firestore;

// ── Tenants connus (IPC multi-marques) ──
const TENANTS = {
  SHAYNAYAH: 'shaynayah',
  MONDHIRO:  'mondhiro',
  CLEANGO:   'cleango',
  SHARED:    'shared', // Données communes
};

/**
 * Retourne la référence partitionnée d'une collection Finance.
 * @param {string} tenantId - ID du tenant (ex: 'shaynayah')
 * @param {string} collection - Sous-collection (ex: 'invoices', 'vendor_bills')
 * @param {Date|null} date - Date pour le partitionnement (défaut: aujourd'hui)
 * @returns {FirebaseFirestore.CollectionReference}
 */
function getFinancePartition(tenantId, collection, date = new Date()) {
  const year  = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return db()
    .collection('tenants').doc(tenantId)
    .collection('finance').doc(collection)
    .collection(year).doc(month)
    .collection('records');
}

/**
 * Retourne la référence partitionnée d'une collection CRM.
 * @param {string} tenantId
 * @returns {FirebaseFirestore.CollectionReference}
 */
function getCrmCollection(tenantId, sub = 'clients') {
  return db().collection('tenants').doc(tenantId).collection('crm').doc(sub).collection('records');
}

/**
 * DualWrite : Écrit simultanément dans l'ancienne structure (flat)
 * ET la nouvelle structure partitionnée.
 * Utiliser pendant la période de migration.
 *
 * @param {object} params
 * @param {FirebaseFirestore.WriteBatch} params.batch
 * @param {string} params.flatCollection - Collection plate actuelle (ex: 'finance_invoices')
 * @param {FirebaseFirestore.CollectionReference} params.partitionedRef - Réf partitionnée
 * @param {string} params.docId - ID du document
 * @param {object} params.data - Données à écrire
 */
function dualWrite({ batch, flatCollection, partitionedRef, docId, data }) {
  // Écriture legacy (flat)
  const flatRef = db().collection(flatCollection).doc(docId);
  batch.set(flatRef, data, { merge: true });

  // Écriture partitionnée
  const partRef = partitionedRef.doc(docId);
  batch.set(partRef, { ...data, _partitioned: true }, { merge: true });
}

/**
 * MIGRATION SCRIPT : Migre une collection plate vers la structure partitionnée.
 * À exécuter une fois via firebase functions:shell ou une Cloud Function de migration.
 *
 * @param {string} tenantId - ID du tenant à migrer
 * @param {string} flatCollectionName - Nom de la collection plate (ex: 'finance_invoices')
 * @param {function} getPartitionRef - Fonction(doc) → CollectionReference partitionnée
 * @param {number} batchSize - Taille des batches (défaut: 400)
 */
async function migrateFlatToPartitioned({
  tenantId,
  flatCollectionName,
  getPartitionRef,
  batchSize = 400,
}) {
  logger.info(`[Partitioning] Migration de ${flatCollectionName} → tenant/${tenantId}...`);

  const snap = await db().collection(flatCollectionName).get();
  if (snap.empty) {
    logger.info(`[Partitioning] Collection ${flatCollectionName} vide. Rien à migrer.`);
    return { migrated: 0 };
  }

  let batchInstance = db().batch();
  let count = 0;
  let migrated = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const partitionRef = getPartitionRef(data).doc(docSnap.id);

    batchInstance.set(partitionRef, {
      ...data,
      _partitioned: true,
      _migratedAt: admin.firestore.FieldValue.serverTimestamp(),
      _tenantId: tenantId,
    }, { merge: true });

    count++;
    migrated++;

    if (count >= batchSize) {
      await batchInstance.commit();
      batchInstance = db().batch();
      count = 0;
      logger.info(`[Partitioning] ${migrated} documents migrés...`);
    }
  }

  if (count > 0) await batchInstance.commit();

  logger.info(`[Partitioning] ✅ ${migrated} documents migrés vers tenant/${tenantId}.`);
  return { migrated };
}

/**
 * Exemples d'utilisation des helpers de partition.
 */
const PARTITION_EXAMPLES = {
  // Écrire une facture partitionnée
  writeInvoice: (tenantId, invoice) => {
    const date = invoice.dateEmission ? new Date(invoice.dateEmission) : new Date();
    return getFinancePartition(tenantId, 'invoices', date).doc(invoice.id || 'auto');
  },

  // Requête sur les factures du mois courant
  queryCurrentMonthInvoices: (tenantId) => {
    const now = new Date();
    return getFinancePartition(tenantId, 'invoices', now);
  },

  // Requête sur une année entière (group query)
  queryYearInvoices: (tenantId, year) => {
    return db()
      .collectionGroup('records')
      .where('_tenantId', '==', tenantId)
      .where('_domain', '==', 'finance')
      .where('_year', '==', String(year));
  },
};

module.exports = {
  TENANTS,
  getFinancePartition,
  getCrmCollection,
  dualWrite,
  migrateFlatToPartitioned,
  PARTITION_EXAMPLES,
};
