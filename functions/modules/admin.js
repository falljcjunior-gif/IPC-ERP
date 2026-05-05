const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const { z } = require('zod');

const db = admin.firestore();

const DeleteUserSchema = z.object({
  uid: z.string().min(20).max(128) // Standard Firebase UID length
});

// Helpers pour construire les payloads (partagés entre trigger et backfill)
const buildUserPayload = (user, now) => {
  const uid = user.uid;
  const email = user.email;
  const displayName = user.displayName || email?.split('@')[0] || 'Unknown';
  
  const userData = {
    _createdAt: now,
    _deletedAt: null,
    role: 'GUEST',
    permissions: {
      roles: ['GUEST'],
      allowedModules: ['home']
    },
    profile: {
      id: uid,
      email: email,
      nom: displayName,
      active: true,
      createdAt: new Date().toISOString()
    }
  };

  // Privilèges automatiques pour les admins connus
  if (email === 'fall.jcjunior@gmail.com' || email === 'ra.yoman@ipcgreenblocks.com') {
    userData.role = 'SUPER_ADMIN';
    userData.permissions.roles = ['SUPER_ADMIN'];
  }
  
  return userData;
};

const buildHrPayload = (user, now) => {
  const uid = user.uid;
  const email = user.email;
  const displayName = user.displayName || email?.split('@')[0] || 'Unknown';

  return {
    _createdAt: now,
    _deletedAt: null,
    id: uid,
    userId: uid, // Nécessaire pour les règles Firestore
    email: email,
    nom: displayName,
    active: true,
    subModule: 'employees'
  };
};


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

const functionsV1 = require('firebase-functions/v1');

/**
 * Trigger onCreate: Automatically mirror Auth user to Firestore and set claims
 */
exports.onUserCreated = functionsV1.auth.user().onCreate(async (user) => {
  const uid = user.uid;
  const email = user.email;
  try {
    const userRef = db.collection('users').doc(uid);
    const hrRef = db.collection('hr').doc(uid);

    const docSnap = await userRef.get();
    const now = admin.firestore.FieldValue.serverTimestamp();

    if (!docSnap.exists) {
      const userData = buildUserPayload(user, now);
      await userRef.set(userData);
      await hrRef.set(buildHrPayload(user, now));
      
      // SET CUSTOM CLAIMS
      await admin.auth().setCustomUserClaims(uid, { role: userData.role });
      
      logger.info(`Mirrored user ${uid} and set role ${userData.role}`);
    } else {
      // S'assurer que le rôle est aussi dans les claims s'il existe déjà dans Firestore
      const data = docSnap.data();
      if (data.role) {
        await admin.auth().setCustomUserClaims(uid, { role: data.role });
      }
    }
  } catch (error) {
    logger.error(`Error mirroring user ${uid}:`, error);
  }
});


/**
 * Backfill: S'assure que tous les utilisateurs Auth ont leur miroir Firestore
 * Utile après un "Nuclear Wipe" ou une migration.
 */
exports.backfillUsers = onCall({ maxInstances: 2 }, async (request) => {
  logger.info('Backfill requested by:', { 
    uid: request.auth?.uid, 
    email: request.auth?.token?.email, 
    role: request.auth?.token?.role 
  });

  // Garde-fou de sécurité
  const isSuperAdmin = request.auth?.token?.role === 'SUPER_ADMIN';
  const isAuthorizedEmail = ['fall.jcjunior@gmail.com', 'ra.yoman@ipcgreenblocks.com'].includes(request.auth?.token?.email);
  
  if (!isSuperAdmin && !isAuthorizedEmail) {
    logger.warn('Backfill: Permission denied for user', request.auth?.uid);
    throw new HttpsError('permission-denied', 'Only SUPER_ADMIN or authorized developers can run backfill.');
  }

  let scanned = 0;
  let createdUsers = 0;
  let createdHr = 0;
  let patched = 0;

  const processPage = async (pageToken) => {
    const listUsersResult = await admin.auth().listUsers(1000, pageToken);
    
    for (const user of listUsersResult.users) {
      scanned++;
      const uid = user.uid;
      const userRef = db.collection('users').doc(uid);
      const hrRef = db.collection('hr').doc(uid);

      const [userDoc, hrDoc] = await Promise.all([userRef.get(), hrRef.get()]);
      const now = admin.firestore.FieldValue.serverTimestamp();

      // Mirror Users
      if (!userDoc.exists) {
        const userData = buildUserPayload(user, now);
        await userRef.set(userData);
        await admin.auth().setCustomUserClaims(uid, { role: userData.role });
        createdUsers++;
      } else {
        // Sync claims for existing users
        const data = userDoc.data();
        if (data.role) {
          await admin.auth().setCustomUserClaims(uid, { role: data.role });
        }
        
        // Patch documents existants (si _deletedAt est resté à true par erreur)
        if (data._deletedAt !== null) {
          await userRef.update({ _deletedAt: null });
          patched++;
        }
      }

      // Mirror HR
      if (!hrDoc.exists) {
        await hrRef.set(buildHrPayload(user, now));
        createdHr++;
      } else {
        const data = hrDoc.data();
        const updates = {};
        if (data._deletedAt !== null) updates._deletedAt = null;
        if (data.subModule !== 'employees') updates.subModule = 'employees';
        if (!data.userId) updates.userId = uid; // Ensure userId exists
        
        if (Object.keys(updates).length > 0) {
          await hrRef.update(updates);
          patched++;
        }
      }

    }

    if (listUsersResult.pageToken) {
      await processPage(listUsersResult.pageToken);
    }
  };

  try {
    await processPage();
    return { 
      success: true, 
      scanned, 
      createdUsers, 
      createdHr, 
      patched 
    };
  } catch (error) {
    logger.error('Backfill execution failed:', error);
    throw new HttpsError('internal', error.message);
  }
});
