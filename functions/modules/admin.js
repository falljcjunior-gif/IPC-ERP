const { onCall } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const { z } = require('zod');

const db = admin.firestore();

const DeleteUserSchema = z.object({
  uid: z.string().min(20).max(128) // Standard Firebase UID length
});

/**
 * Admin: Delete User account from Firebase Auth
 */
exports.deleteUserAccount = onCall({
  maxInstances: 5
}, async (request) => {
  // 1. Input Validation
  const validation = DeleteUserSchema.safeParse(request.data);
  if (!validation.success) {
    throw new Error(`invalid-argument: ${validation.error.message}`);
  }

  const { uid } = validation.data;

  // 2. Security Check
  if (!request.auth) throw new Error('unauthenticated');

  // 3. Privilege Check: Only SUPER_ADMIN allowed
  const callerUid = request.auth.uid;
  const callerSnap = await db.collection('users').doc(callerUid).get();
  const callerData = callerSnap.data();
  
  const isSuperAdmin = callerData?.permissions?.roles?.includes('SUPER_ADMIN');

  if (!isSuperAdmin) {
    logger.warn(`Unauthorized delete attempt by ${callerUid}`);
    throw new Error('permission-denied');
  }

  try {
    await admin.auth().deleteUser(uid);
    logger.info(`User ${uid} successfully deleted from Auth by ${callerUid}`);
    
    // Audit log
    await db.collection('audit_logs').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      collection: 'users',
      docId: uid,
      operation: 'DELETE_AUTH',
      changedBy: callerUid,
      summary: `User ${uid} deleted from Firebase Auth`
    });
    
    return { success: true };
  } catch (error) {
    logger.error(`Error deleting user ${uid}:`, error);
    throw new Error(`INTERNAL_ERROR: ${error.message}`);
  }
});
