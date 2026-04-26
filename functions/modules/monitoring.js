const { onCall } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * ══════════════════════════════════════════════════════════════
 * BACKEND MONITORING & HEALTH
 * ══════════════════════════════════════════════════════════════
 */

exports.getBackendStatus = onCall({
  maxInstances: 2,
  region: 'us-central1'
}, async (request) => {
  // 1. Security Check: Only ADMINs can view health
  if (!request.auth) throw new Error('unauthenticated');
  
  const callerSnap = await db.collection('users').doc(request.auth.uid).get();
  const roles = callerSnap.data()?.permissions?.roles || [];
  if (!roles.includes('ADMIN') && !roles.includes('SUPER_ADMIN')) {
    throw new Error('permission-denied');
  }

  try {
    // 2. Fetch Sync Health (Last 24h)
    const twentyFourHoursAgo = admin.firestore.Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
    
    const [syncFailures, syncSuccess, auditVolume] = await Promise.all([
      db.collection('system_sync_logs')
        .where('status', '==', 'ERROR')
        .where('timestamp', '>', twentyFourHoursAgo)
        .count().get(),
      db.collection('system_sync_logs')
        .where('status', 'in', ['SUCCESS', 'SUCCESS_STUB'])
        .where('timestamp', '>', twentyFourHoursAgo)
        .count().get(),
      db.collection('audit_logs')
        .where('timestamp', '>', twentyFourHoursAgo)
        .count().get()
    ]);

    // 3. AI Usage (Simple count for now)
    const aiLogs = await db.collection('ai_logs')
      .where('timestamp', '>', twentyFourHoursAgo)
      .count().get();

    return {
      success: true,
      health: syncFailures.data().count > 0 ? 'WARNING' : 'HEALTHY',
      metrics: {
        sync: {
          success: syncSuccess.data().count,
          failed: syncFailures.data().count
        },
        activity: {
          auditLogs: auditVolume.data().count,
          aiRequests: aiLogs.data().count
        }
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
  } catch (error) {
    logger.error('Monitoring API Error:', error);
    throw new Error(`MONITORING_ERROR: ${error.message}`);
  }
});
