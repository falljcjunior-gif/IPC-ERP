const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const { z } = require('zod');

const db = admin.firestore();

const SetRoleSchema = z.object({
  uid: z.string().min(20).max(128),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'FINANCE', 'SALES', 'HR', 'PRODUCTION', 'LOGISTICS', 'LEGAL', 'STAFF', 'GUEST']),
});

/**
 * ══════════════════════════════════════════════════════════════
 * SET USER ROLE — Custom Claims (Seule source de vérité RBAC)
 * ══════════════════════════════════════════════════════════════
 *
 * WHY: Les Custom Claims sont signés par le SDK Admin Firebase.
 * Ils ne peuvent pas être modifiés côté client, contrairement
 * aux documents Firestore. C'est la seule façon sécurisée
 * d'attribuer des rôles dans une architecture Firebase.
 *
 * APPELÉ PAR: Interface Admin IPC (module Admin > Utilisateurs)
 * PROTECTION: Seul un SUPER_ADMIN peut appeler cette fonction.
 */
exports.setUserRole = onCall({
  maxInstances: 5,
  enforceAppCheck: true, // Requiert Firebase App Check
}, async (request) => {
  // 1. Authentification requise
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentification requise');
  }

  // 2. Seul SUPER_ADMIN peut modifier les rôles
  const callerRole = request.auth.token?.role;
  if (callerRole !== 'SUPER_ADMIN') {
    logger.warn(`[setUserRole] Tentative non-autorisée par ${request.auth.uid} (rôle: ${callerRole})`);
    throw new HttpsError('permission-denied', 'Seul un SUPER_ADMIN peut modifier les rôles.');
  }

  // 3. Validation de l'input
  const validation = SetRoleSchema.safeParse(request.data);
  if (!validation.success) {
    throw new HttpsError('invalid-argument', validation.error.message);
  }

  const { uid, role } = validation.data;

  // 4. Empêcher l'auto-modification (un admin ne peut pas se rétrograder)
  if (uid === request.auth.uid && role !== 'SUPER_ADMIN') {
    throw new HttpsError('permission-denied', 'Vous ne pouvez pas modifier votre propre rôle SUPER_ADMIN.');
  }

  try {
    // 5. Écrire le Custom Claim (source de vérité immuable côté client)
    await admin.auth().setCustomUserClaims(uid, { role });

    // 6. Synchroniser aussi dans Firestore pour l'affichage UI
    await db.collection('users').doc(uid).update({
      role,
      _roleUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      _roleUpdatedBy: request.auth.uid,
    });

    // 7. Forcer l'invalidation du token actuel (le user devra se re-connecter)
    await admin.auth().revokeRefreshTokens(uid);

    // 8. Audit log
    await db.collection('audit_logs').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      collection: 'users',
      docId: uid,
      operation: 'SET_ROLE',
      changedBy: request.auth.uid,
      summary: `Rôle modifié → ${role} pour l'utilisateur ${uid}`,
    });

    logger.info(`[setUserRole] ${uid} → ${role} par ${request.auth.uid}`);
    return { success: true, uid, role };

  } catch (error) {
    logger.error('[setUserRole] Erreur:', error);
    throw new HttpsError('internal', error.message);
  }
});

/**
 * BOOTSTRAP: Attribuer SUPER_ADMIN au créateur lors du premier déploiement.
 * À appeler UNE SEULE FOIS via la console Firebase ou un script d'init.
 *
 * firebase functions:shell
 * > bootstrapSuperAdmin({ email: 'ra.yoman@ipcgreenblocks.com' })
 */
exports.bootstrapSuperAdmin = onCall({
  maxInstances: 1,
}, async (request) => {
  // Vérifier qu'aucun SUPER_ADMIN n'existe encore
  const existingAdmins = await db.collection('users')
    .where('role', '==', 'SUPER_ADMIN')
    .limit(1)
    .get();

  if (!existingAdmins.empty) {
    throw new HttpsError('permission-denied', 'Un SUPER_ADMIN existe déjà. Bootstrap non autorisé.');
  }

  const email = request.data?.email;
  if (!email) throw new HttpsError('invalid-argument', 'email requis');

  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { role: 'SUPER_ADMIN' });
    await db.collection('users').doc(user.uid).set({
      email,
      role: 'SUPER_ADMIN',
      departement: 'DIRECTION',
      profile: { active: true, createdAt: new Date().toISOString() },
      _bootstrappedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    logger.info(`[Bootstrap] SUPER_ADMIN attribué à ${email} (${user.uid})`);
    return { success: true, uid: user.uid };
  } catch (err) {
    logger.error('[Bootstrap] Erreur:', err);
    throw new HttpsError('internal', err.message);
  }
});
