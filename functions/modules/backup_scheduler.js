const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onCall } = require('firebase-functions/v2/https');
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
  // Vérification de sécurité Admin
  if (!request.auth) throw new Error('unauthenticated');
  
  const userDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
  const userData = userDoc.data();
  const isAdmin = userData?.role === 'admin' || userData?.permissions?.roles?.includes('SUPER_ADMIN');

  if (!isAdmin) {
    throw new Error('permission-denied: Seuls les administrateurs peuvent forcer un backup.');
  }

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

    throw new Error(`Export failed: ${err.message}`);
  }
}
