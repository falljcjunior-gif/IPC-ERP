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

  // 3. Privilege Check: Custom Claims (immuable côté client)
  // ── [SECURITY FIX V-03] : Ne plus lire le rôle depuis Firestore (contournable)
  // Les Custom Claims sont signés par le SDK Admin et non modifiables côté client.
  const callerUid = request.auth.uid;
  const isSuperAdmin = request.auth.token?.role === 'SUPER_ADMIN';

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

const functions = require('firebase-functions');

/**
 * Trigger onCreate: Automatically mirror Auth user to Firestore
 */
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  const uid = user.uid;
  const email = user.email;
  const displayName = user.displayName || email.split('@')[0];

  try {
    const userRef = db.collection('users').doc(uid);
    const hrRef = db.collection('hr').doc(uid);

    const docSnap = await userRef.get();
    if (!docSnap.exists) {
      const now = admin.firestore.FieldValue.serverTimestamp();
      
      const userData = {
        _createdAt: now,
        role: 'GUEST',
        permissions: {
          roles: ['GUEST'],
          allowedModules: ['home']
        },
        profile: {
          id: uid,
          email: email,
          nom: displayName,
          createdAt: new Date().toISOString()
        }
      };

      // Ensure fall.jcjunior gets SUPER_ADMIN automatically
      if (email === 'fall.jcjunior@gmail.com') {
        userData.role = 'SUPER_ADMIN';
        userData.permissions.roles = ['SUPER_ADMIN'];
      }

      await userRef.set(userData);
      logger.info(`Mirrored user ${uid} to users collection`);

      const hrData = {
        _createdAt: now,
        id: uid,
        email: email,
        nom: displayName,
        subModule: 'employees'
      };

      await hrRef.set(hrData);
      logger.info(`Mirrored user ${uid} to hr collection`);
    }
  } catch (error) {
    logger.error(`Error mirroring user ${uid}:`, error);
  }
});
