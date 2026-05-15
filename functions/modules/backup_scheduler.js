const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');

// 🚀 CONFIGURATION DU BACKUP INDUSTRIEL
const BACKUP_BUCKET = `gs://ipc-erp-backups-487186181701`;


/**
 * 📅 BACKUP AUTOMATIQUE (Tous les jours à 03h00 du matin)
 */
exports.scheduledFirestoreExport = onSchedule('0 3 * * *', async (event) => {
  return performExport();
});

/**
 * ⚡ BACKUP MANUEL (Déclenché par un Admin depuis l'UI)
 */
exports.manualFirestoreExport = onCall(async (request) => {
  // [AUDIT FIX] Use Custom Claims (server-signed token) — no Firestore read needed.
  // Previous bug: checked role === 'admin' (lowercase) but system uses 'ADMIN'/'SUPER_ADMIN'.
  if (!request.auth) throw new HttpsError('unauthenticated', 'User must be logged in.');

  const claimedRole = request.auth.token?.role;
  if (claimedRole !== 'SUPER_ADMIN' && claimedRole !== 'ADMIN') {
    logger.warn('[Backup] Unauthorized manual export attempt', {
      uid: request.auth.uid,
      role: claimedRole,
    });
    throw new HttpsError('permission-denied', 'Seuls les administrateurs peuvent forcer un backup.');
  }

  logger.info('[Backup] Manual export authorized', { uid: request.auth.uid, role: claimedRole });
  return performExport();
});

/**
 * Logique principale d'exportation vers Cloud Storage
 */
async function performExport() {
  const client = new admin.firestore.v1.FirestoreAdminClient();
  const databaseName = client.databasePath(process.env.GCLOUD_PROJECT, '(default)');

  try {
    logger.info(`Starting Firestore Export to ${BACKUP_BUCKET}...`);
    
    const responses = await client.exportDocuments({
      name: databaseName,
      outputUriPrefix: BACKUP_BUCKET,
      collectionIds: [] // Vide = Toutes les collections
    });

    const response = responses[0];
    logger.info(`Backup Operation started: ${response.name}`);

    // Log l'opération dans Firestore pour le suivi UI
    await admin.firestore().collection('audit_logs').add({
      type: 'SYSTEM_BACKUP',
      status: 'STARTED',
      operationName: response.name,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      bucket: BACKUP_BUCKET
    });

    return { 
      success: true, 
      operationName: response.name,
      bucket: BACKUP_BUCKET 
    };

  } catch (err) {
    logger.error('Export operation failed', err);
    
    await admin.firestore().collection('audit_logs').add({
      type: 'SYSTEM_BACKUP',
      status: 'FAILED',
      error: err.message,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    throw new HttpsError('internal', `Export failed: ${err.message}`);
  }
}
