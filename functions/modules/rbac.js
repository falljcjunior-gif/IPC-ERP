const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const { z } = require('zod');
const { checkCallRate } = require('./rate_limiter');

const db = admin.firestore();

// ── Rôles enterprise — liste exhaustive ──────────────────────────────────────
const ENTERPRISE_ROLES = [
  'SUPER_ADMIN', 'GROUP_AUDITOR',
  'HOLDING_CEO', 'HOLDING_CFO', 'HOLDING_CSO', 'HOLDING_CHRO', 'HOLDING_CTO',
  'HOLDING_AUDITOR', 'HOLDING_LEGAL',
  'SUBSIDIARY_DG', 'SUBSIDIARY_CFO', 'SUBSIDIARY_RH', 'SUBSIDIARY_MANAGER', 'SUBSIDIARY_STAFF',
  'FOUNDATION_DG', 'FOUNDATION_MANAGER', 'FOUNDATION_STAFF', 'FOUNDATION_AUDITOR',
  'COUNTRY_DIRECTOR_SUBSIDIARY', 'COUNTRY_DIRECTOR_FOUNDATION',
  'COUNTRY_HR', 'COUNTRY_FINANCE', 'COUNTRY_OPERATIONS', 'COUNTRY_AUDITOR',
  'ADMIN', 'DIRECTOR', 'MANAGER', 'HR_MANAGER', 'HR',
  'FINANCE', 'SALES', 'CRM', 'PRODUCTION', 'LOGISTICS', 'LEGAL', 'AUDIT',
  // [ROLE SIMPLIFICATION 2026-05-22] EMPLOYEE is the new baseline role.
  // GUEST kept in enum for backward compat with legacy users only — never assigned to new users.
  'STAFF', 'EMPLOYEE', 'GUEST',
];

const SetRoleSchema = z.object({
  uid:         z.string().min(20).max(128),
  role:        z.enum(ENTERPRISE_ROLES),
  // Contexte d'entité — optionnel, mis à jour dans les Custom Claims si fourni
  entity_id:   z.string().max(128).optional(),
  entity_type: z.enum(['HOLDING', 'SUBSIDIARY', 'FOUNDATION']).optional(),
  country_id:  z.string().max(10).optional(),
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

  // Rate limiting — max 3 role changes per minute per caller
  await checkCallRate(db, request.auth.uid, 'setUserRole', { maxRequests: 3, windowMs: 60_000 });

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

  const { uid, role, entity_id, entity_type, country_id } = validation.data;

  // 4. Empêcher l'auto-modification (un admin ne peut pas se rétrograder)
  if (uid === request.auth.uid && role !== 'SUPER_ADMIN') {
    throw new HttpsError('permission-denied', 'Vous ne pouvez pas modifier votre propre rôle SUPER_ADMIN.');
  }

  try {
    // 5. Écrire les Custom Claims (source de vérité immuable côté client)
    // Inclut entity_id + entity_type + country_id si fournis — enforce isolation multi-tenant
    const existingClaims = (await admin.auth().getUser(uid)).customClaims || {};
    const newClaims = {
      ...existingClaims,
      role,
      ...(entity_id   && { entity_id }),
      ...(entity_type && { entity_type }),
      ...(country_id  && { country_id }),
    };
    await admin.auth().setCustomUserClaims(uid, newClaims);

    // 6. Synchroniser aussi dans Firestore pour l'affichage UI
    const firestoreUpdate = {
      role,
      _roleUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      _roleUpdatedBy: request.auth.uid,
      ...(entity_id   && { entity_id }),
      ...(entity_type && { entity_type }),
      ...(country_id  && { country_id }),
    };
    await db.collection('users').doc(uid).update(firestoreUpdate);

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
  // [AUDIT FIX] Require the caller to be authenticated (the account to be bootstrapped
  // must already exist in Firebase Auth before calling this). The caller's email must
  // match the requested email — prevents a 3rd party from bootstrapping someone else.
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentification requise pour le bootstrap.');
  }

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

  // [SECURITY] The caller can only bootstrap their own account
  if (request.auth.token.email !== email) {
    throw new HttpsError('permission-denied',
      'Vous ne pouvez bootstrapper que votre propre compte.');
  }

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

/**
 * MIGRATION: Convert all legacy `GUEST` users to `EMPLOYEE`.
 * One-off callable triggered manually by a SUPER_ADMIN after the 2026-05-22
 * role simplification (only ADMIN and EMPLOYEE remain in the public surface).
 *
 * Usage (Firebase Console / shell):
 *   migrateGuestToEmployee({})
 *
 * Operation:
 *   1. Lists all users where role == 'GUEST'
 *   2. Updates Firestore `users/{uid}.role` → 'EMPLOYEE'
 *   3. Updates Custom Claims `role` → 'EMPLOYEE' so Firestore rules see the new role
 *   4. Revokes refresh tokens to force re-login with fresh claims
 *   5. Writes an audit log per migrated user
 */
exports.migrateGuestToEmployee = onCall({
  region: 'europe-west1',
  enforceAppCheck: false, // one-off migration; admin-gated
  maxInstances: 1,
}, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentification requise.');
  }
  const callerRole = request.auth.token?.role;
  if (callerRole !== 'SUPER_ADMIN') {
    throw new HttpsError('permission-denied', 'Seul un SUPER_ADMIN peut exécuter cette migration.');
  }

  const guestUsers = await db.collection('users').where('role', '==', 'GUEST').get();
  if (guestUsers.empty) {
    return { migrated: 0, message: 'Aucun utilisateur GUEST trouvé.' };
  }

  let migrated = 0;
  const errors = [];
  for (const docSnap of guestUsers.docs) {
    const uid = docSnap.id;
    try {
      // 1. Firestore role + permissions
      const data = docSnap.data() || {};
      const prevPerms = data.permissions || {};
      const nextPerms = {
        ...prevPerms,
        roles: ['EMPLOYEE'],
      };
      await docSnap.ref.update({
        role: 'EMPLOYEE',
        permissions: nextPerms,
        _migratedFromGuestAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 2. Custom Claims
      const existingClaims = (await admin.auth().getUser(uid).catch(() => null))?.customClaims || {};
      await admin.auth().setCustomUserClaims(uid, { ...existingClaims, role: 'EMPLOYEE' });

      // 3. Revoke tokens to force fresh claim load on next request
      await admin.auth().revokeRefreshTokens(uid).catch(() => {});

      // 4. Audit
      await db.collection('audit_logs').add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        collection: 'users',
        docId: uid,
        operation: 'MIGRATE_GUEST_TO_EMPLOYEE',
        changedBy: request.auth.uid,
        summary: `Migration automatique: GUEST → EMPLOYEE`,
      });

      migrated++;
    } catch (err) {
      logger.error(`[migrateGuestToEmployee] Échec ${uid}:`, err.message);
      errors.push({ uid, error: err.message });
    }
  }

  logger.info(`[migrateGuestToEmployee] ${migrated} utilisateurs migrés, ${errors.length} échecs`);
  return { migrated, errors, total: guestUsers.size };
});
