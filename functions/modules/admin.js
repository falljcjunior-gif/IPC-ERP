const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const { z } = require('zod');
const { checkCallRate } = require('./rate_limiter');
const { assertCanModifyRole, isImmutableRole } = require('./roleGuard');

logger.info('Admin module loading...');
const db = admin.firestore();

const DeleteUserSchema = z.object({
  uid: z.string().min(20).max(128) // Standard Firebase UID length
});

const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;

// ── Rôles protégés — toute modification doit passer par setUserRole (rbac.js) ──
const PROTECTED_ROLES = new Set(['SUPER_ADMIN', 'HOLDING_CEO', 'GROUP_AUDITOR']);

const buildTenantClaims = (userData, existingClaims = {}, roleOverride = null) => {
  const entityId = userData.entity_id || existingClaims.entity_id;
  if (!entityId) {
    throw new HttpsError('failed-precondition', 'entity_id manquant : impossible de publier des Custom Claims sûrs.');
  }

  const resolvedRole = roleOverride || userData.role || existingClaims.role;
  if (!resolvedRole) {
    // Refuse to silently fall back to EMPLOYEE — surface the missing role immediately.
    throw new HttpsError('failed-precondition',
      `Aucun rôle trouvé pour l'utilisateur ${userData.uid || existingClaims.uid || '?'}. ` +
      'Utilisez setUserRole pour attribuer un rôle explicite avant de publier des claims.');
  }

  return {
    ...existingClaims,
    role: resolvedRole,
    entity_type: userData.entity_type || existingClaims.entity_type || 'SUBSIDIARY',
    entity_id: entityId,
    tenant_id: userData.tenant_id || existingClaims.tenant_id || 'ipc_group',
  };
};

// ── Unified Payload Builder (HR 2.0) ──────────────────────────────────────
const buildUnifiedUserPayload = (user, now, extraData = {}) => {
  const uid = user.uid;
  const email = user.email;
  const displayName = user.displayName || extraData.nom || email?.split('@')[0] || 'Utilisateur';
  
  // Role must always be explicitly supplied by the caller — no silent fallback.
  // Every code path that calls buildUnifiedUserPayload must pass a role.
  if (!extraData.role) {
    logger.error('[buildUnifiedUserPayload] role is required — refusing to default to EMPLOYEE', { uid: user.uid });
    throw new Error('role is required when building a unified user payload. Pass an explicit role.');
  }
  const role = extraData.role;
  
  return {
    _createdAt: now,
    _updatedAt: now,
    _deletedAt: null,
    uid: uid,
    email: email,
    role: role,
    hierarchy_level: extraData.hierarchy_level || 'Employee',
    // Multi-tenant routing fields — MUST be present for App.jsx space detection
    entity_type: extraData.entity_type || 'SUBSIDIARY',
    // [SECURITY FIX B-P1] No silent fallback to 'ipc_green_blocks'.
    // Callers MUST supply entity_id. If absent, log a warning and default to null
    // so the Firestore rule (canReadOwnEntity(null)) blocks cross-entity reads.
    entity_id: (() => {
      if (!extraData.entity_id) {
        // [P0 FIX 2026-05-22] Previously logged a warning and wrote null,
        // which created users invisible to entity-scoped Firestore subscriptions
        // and impossible to recover without a manual patch. Now hard-fail at the
        // provisioning boundary so the caller is forced to pass an entity_id.
        logger.error('[buildUnifiedUserPayload] entity_id REQUIRED — refusing to write user with null entity_id', { uid: user.uid });
        throw new Error('entity_id is required when provisioning a user');
      }
      return extraData.entity_id;
    })(),
    entity_name: extraData.entity_name || extraData.entity_id || 'IPC Group',
    tenant_id:   extraData.tenant_id   || 'ipc_group',

    // Public profile (visible to all for Directory)
    profile: {
      id: uid,
      email: email,
      nom: displayName,
      poste: extraData.poste || 'À définir',
      dept: extraData.dept || 'Production',
      avatar: (displayName ? displayName[0] : 'U').toUpperCase(),
      active: true,
      createdAt: new Date().toISOString()
    },

    // HR Metadata (Basic - visible to HR/Admin)
    // NOTE: Sensitive data like 'salaire_base' is now in hr_private/vault
    hr: {
      contratType: extraData.contratType || 'CDI',
      date_entree: extraData.date_entree || new Date().toISOString().split('T')[0],
      performance_score: 85,
      burnout_risk: 10,
      retention_score: 95,
      subModule: 'employees'
    },

    // Detailed Permissions
    permissions: extraData.permissions || {
      roles: [role],
      allowedModules: ['home'],
      moduleAccess: { home: 'write' }
    }
  };
};

/**
 * Admin: Atomic Provisioning (Auth + Firestore + Claims)
 */
exports.provisionUser = onCall({
  maxInstances: 5,
  region: 'europe-west1'
}, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Authentification requise.');

  // [AUDIT FIX] Rate limiting — prevent mass account creation abuse (max 20/min per user)
  await checkCallRate(db, request.auth.uid, 'provisionUser', { maxRequests: 20, windowMs: 60_000 });

  const callerRole = request.auth.token?.role;
  if (callerRole !== 'SUPER_ADMIN' && callerRole !== 'ADMIN') {
    throw new HttpsError('permission-denied', 'Seuls les administrateurs peuvent provisionner des comptes.');
  }

  const { email, password, ...extraData } = request.data;
  if (!email || !password) throw new HttpsError('invalid-argument', 'Email et Mot de passe requis.');
  if (!STRONG_PASSWORD_REGEX.test(password)) {
    throw new HttpsError(
      'invalid-argument',
      'Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un symbole.'
    );
  }

  try {
    // 1. Create Auth User
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: extraData.nom
    });
    const uid = userRecord.uid;

    const now = admin.firestore.FieldValue.serverTimestamp();
    const payload = buildUnifiedUserPayload(userRecord, now, extraData);

    logger.debug('Provisioning payload:', { uid, payload });

    // 2. Atomic Firestore Write (Batch)
    try {
      const batch = db.batch();
      const userRef = db.collection('users').doc(uid);
      const vaultRef = userRef.collection('hr_private').doc('vault');

      // Main User Document
      batch.set(userRef, payload);

      // Sensitive HR Vault
      batch.set(vaultRef, {
        subModule: 'vault',
        salaire: extraData.salaire || 0,
        iban: extraData.iban || null,
        ssn: extraData.ssn || null,
        _employeeId: uid,
        entity_id: payload.entity_id,
        entity_type: payload.entity_type,
        tenant_id: payload.tenant_id,
        _createdAt: now,
        _updatedAt: now
      });

      await batch.commit();
      logger.info(`Firestore documents created for ${uid} (Profile + Vault)`);

      // 3. Create Salary Structure, Payroll Profile and Contract documents
      const displayName = userRecord.displayName || extraData.nom || email?.split('@')[0] || 'Utilisateur';
      const salaryRef = db.collection('salaries').doc(uid);
      const payrollProfileRef = db.collection('payroll_profiles').doc(uid);
      const contractRef = db.collection('contracts').doc(uid);

      const salaryData = {
        employee_id: uid,
        employee_nom: displayName,
        poste: extraData.poste || 'À définir',
        dept: extraData.dept || 'Production',
        // Prefer salaire_base (from Step 3 wizard) over salaire (Step 2 quick entry)
        salaire_base: extraData.salaire_base || extraData.salaire || 0,
        devise: extraData.devise || 'XOF',
        type_remuneration: extraData.type_remuneration || 'Mensuel',
        periodicite: extraData.periodicite || 'Mensuel',
        prime_transport: extraData.prime_transport || 0,
        prime_logement: extraData.prime_logement || 0,
        prime_performance: extraData.prime_performance || 0,
        prime_anciennete: extraData.prime_anciennete || 0,
        indemnite_representation: extraData.indemnite_representation || 0,
        mode_paiement: extraData.mode_paiement || 'Virement Bancaire',
        banque: extraData.banque || null,
        compte_bancaire: extraData.compte_bancaire || null,
        date_effet: extraData.date_effet_salaire || new Date().toISOString().split('T')[0],
        payroll_status: 'Actif',
        entity_id: payload.entity_id,
        entity_type: payload.entity_type,
        tenant_id: payload.tenant_id,
        _createdAt: now,
        _updatedAt: now,
        _deletedAt: null,
      };

      const payrollProfileData = {
        employee_id: uid,
        employee_nom: displayName,
        salary_structure_id: uid,
        payroll_group: extraData.dept || 'Production',
        regime_fiscal: 'Droit Commun',
        cotisation_cnps: true,
        cotisation_its: true,
        bank_account: extraData.compte_bancaire || null,
        statut_paie: 'Actif',
        entity_id: payload.entity_id,
        entity_type: payload.entity_type,
        tenant_id: payload.tenant_id,
        _createdAt: now,
        _updatedAt: now,
        _deletedAt: null,
      };

      const contractData = {
        employee_id: uid,
        employee_nom: displayName,
        type: extraData.contratType || 'CDI',
        date_debut: extraData.date_entree || new Date().toISOString().split('T')[0],
        date_fin: null,
        poste: extraData.poste || 'À définir',
        salaire_base: extraData.salaire_base || extraData.salaire || 0,
        devise: extraData.devise || 'XOF',
        statut: 'Actif',
        entity_id: payload.entity_id,
        entity_type: payload.entity_type,
        tenant_id: payload.tenant_id,
        _createdAt: now,
        _updatedAt: now,
        _deletedAt: null,
      };

      try {
        const batch2 = db.batch();
        batch2.set(salaryRef, salaryData);
        batch2.set(payrollProfileRef, payrollProfileData);
        batch2.set(contractRef, contractData);
        await batch2.commit();
        logger.info(`Salary/Payroll/Contract documents created for ${uid}`);
      } catch (batch2Error) {
        logger.error(`Salary batch write failed for ${uid} (non-fatal):`, batch2Error);
        // Non-fatal: user account still created successfully
      }
    } catch (fsError) {
      logger.error(`Firestore batch write failed for ${uid}:`, fsError);
      throw fsError;
    }

    // 3. Set Custom Claims (include entity_type + entity_id for App.jsx space routing)
    try {
      await admin.auth().setCustomUserClaims(uid, buildTenantClaims(payload));
      logger.info(`Custom claims set for ${uid}: ${payload.role} / ${payload.entity_type}`);
    } catch (claimError) {
      logger.error(`Custom claims failed for ${uid}:`, claimError);
      throw claimError;
    }

    logger.info(`Successfully provisioned user ${uid} (${email}) with role ${payload.role}`);
    
    return { success: true, uid };
  } catch (error) {
    logger.error('Provisioning error:', error);
    if (error.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'Cet email est déjà utilisé.');
    }
    if (error.code === 'auth/invalid-password') {
      throw new HttpsError('invalid-argument', 'Mot de passe invalide : 12 caractères minimum avec complexité forte.');
    }
    if (error.code === 'auth/invalid-email') {
      throw new HttpsError('invalid-argument', 'Format d\'email invalide.');
    }
    throw new HttpsError('internal', `Échec du provisionnement : ${error.message}`);
  }
});



/**
 * Admin: Update Permissions & Role atomically (Firestore + Custom Claims).
 *
 * WHY: la modification de `permissions` côté client n'invalidait pas les Custom Claims,
 * provoquant la désync UI ↔ règles Firestore. Cette callable garantit l'écriture
 * atomique des deux sources de vérité.
 */
const UpdatePermissionsSchema = z.object({
  uid: z.string().min(20).max(128),
  role: z.string().optional(),
  permissions: z.object({
    roles: z.array(z.string()).optional(),
    allowedModules: z.array(z.string()).optional(),
    moduleAccess: z.record(z.string()).optional(),
    modules: z.record(z.any()).optional(),
    hierarchy_level: z.string().optional()
  }).optional(),
  hierarchy_level: z.string().optional()
});

exports.updateUserPermissions = onCall({
  maxInstances: 5,
  region: 'europe-west1'
}, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Authentification requise.');

  // [AUDIT FIX] Rate limiting
  await checkCallRate(db, request.auth.uid, 'updateUserPermissions', { maxRequests: 30, windowMs: 60_000 });

  const callerRole = request.auth.token?.role;
  if (callerRole !== 'SUPER_ADMIN' && callerRole !== 'ADMIN') {
    throw new HttpsError('permission-denied', 'Seuls les administrateurs peuvent modifier les permissions.');
  }

  const validation = UpdatePermissionsSchema.safeParse(request.data);
  if (!validation.success) {
    throw new HttpsError('invalid-argument', validation.error.message);
  }

  const { uid, role, permissions, hierarchy_level } = validation.data;

  try {
    const userRef = db.collection('users').doc(uid);
    const snap = await userRef.get();
    if (!snap.exists) throw new HttpsError('not-found', `Utilisateur ${uid} introuvable.`);

    const userData = snap.data();

    // ── RBAC GUARD: Centralized role hierarchy enforcement ───────────────────
    assertCanModifyRole(callerRole, userData.role, role || null, request.auth.uid, uid);

    const updates = { _updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    if (permissions) updates.permissions = permissions;
    if (hierarchy_level) updates.hierarchy_level = hierarchy_level;

    let finalRole = role || userData.role;
    if (role) updates.role = role;
    updates._permissionsUpdatedBy = request.auth.uid;

    await userRef.update(updates);

    if (finalRole) {
      const authUser = await admin.auth().getUser(uid);
      const mergedClaims = buildTenantClaims(userData, authUser.customClaims || {}, finalRole);
      await admin.auth().setCustomUserClaims(uid, mergedClaims);
    }

    await db.collection('audit_logs').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      collection: 'users',
      docId: uid,
      operation: 'UPDATE_PERMISSIONS',
      changedBy: request.auth.uid,
      summary: `Permissions mises à jour pour ${uid} (rôle: ${finalRole || 'inchangé'})`
    });

    logger.info(`[updateUserPermissions] ${uid} updated by ${request.auth.uid}`);
    return { success: true, uid, role: finalRole };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    logger.error('[updateUserPermissions] error:', error);
    throw new HttpsError('internal', `Échec de la mise à jour : ${error.message}`);
  }
});

/**
 * Admin: Delete User account from Firebase Auth
 */
exports.deleteUserAccount = onCall({
  maxInstances: 5,
  region: 'europe-west1'
}, async (request) => {
  // 1. Input Validation
  const validation = DeleteUserSchema.safeParse(request.data);
  if (!validation.success) {
    throw new HttpsError('invalid-argument', validation.error.message);
  }

  const { uid } = validation.data;

  // 2. Security Check
  if (!request.auth) throw new HttpsError('unauthenticated', 'User must be logged in.');

  const callerUid   = request.auth.uid;
  const callerRole  = request.auth.token?.role || '';
  const callerEmail = request.auth.token?.email || '';

  const DELETION_ROLES = new Set([
    'SUPER_ADMIN', 'HOLDING_CEO', 'HOLDING_CFO', 'HOLDING_CSO',
  ]);
  // [SECURITY FIX A.2] AUTHORIZED_EMAILS whitelist removed — bypassed RBAC.
  // Authorization is now exclusively role-based via Custom Claims.
  // If a SUPER_ADMIN account hasn't been bootstrapped yet, use bootstrapSuperAdmin().
  const canDelete = DELETION_ROLES.has(callerRole);

  if (!canDelete) {
    logger.warn(`Unauthorized delete attempt by ${callerUid} (role: ${callerRole}, email: ${callerEmail})`);
    throw new HttpsError('permission-denied',
      'Seuls les rôles HOLDING_CEO et SUPER_ADMIN peuvent supprimer des comptes.');
  }

  try {
    try {
      await admin.auth().deleteUser(uid);
      logger.info(`User ${uid} successfully deleted from Auth by ${callerUid}`);
    } catch (authError) {
      if (authError.code === 'auth/user-not-found') {
        logger.info(`User ${uid} already missing from Auth, proceeding with database cleanup.`);
      } else {
        throw authError;
      }
    }
    
    // 3. Database Cleanup (Hard Delete)
    // Unified model: Clean up the user document and its private sub-collection
    const userRef = db.collection('users').doc(uid);
    const hrPrivateRef = userRef.collection('hr_private');
    
    // Delete sub-collection documents first (manual loop required in Firestore)
    const subDocs = await hrPrivateRef.get();
    const batch = db.batch();
    subDocs.forEach(doc => batch.delete(doc.ref));
    
    // Delete main user doc
    batch.delete(userRef);
    
    // [CLEANUP] Also delete from deprecated 'hr' collection if exists
    const legacyHrRef = db.collection('hr').doc(uid);
    batch.delete(legacyHrRef);

    await batch.commit();
    logger.info(`Database records for user ${uid} purged from all unified and legacy collections.`);

    // Audit log
    await db.collection('audit_logs').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      collection: 'users',
      docId: uid,
      operation: 'HARD_DELETE_ACCOUNT',
      changedBy: callerUid,
      summary: `User ${uid} deleted from Auth and Database (Unified Reboot)`
    });
    
    return { success: true };
  } catch (error) {
    logger.error(`Error in deleteUserAccount for ${uid}:`, error);
    throw new HttpsError('internal', `Erreur lors de la suppression complète : ${error.message}`);
  }
});

const functionsV1 = require('firebase-functions/v1');

/**
 * Trigger onCreate: Automatically mirror Auth user to Firestore and set claims
 * Updated for HR 2.0 Unified Model
 */
exports.onUserCreated = functionsV1.auth.user().onCreate(async (user) => {
  const uid = user.uid;
  try {
    const userRef = db.collection('users').doc(uid);
    const docSnap = await userRef.get();
    const now = admin.firestore.FieldValue.serverTimestamp();

    // If the auth user already has scoped claims (set by provisioning script
    // or bootstrapSuperAdmin before this trigger fires), never overwrite them.
    const existingClaims = user.customClaims || {};
    const hasScopedClaims = Boolean(existingClaims.role && existingClaims.entity_id);

    if (!docSnap.exists) {
      if (!hasScopedClaims) {
        logger.warn(`[onUserCreated] Auth user ${uid} has no entity_id claim; Firestore mirror skipped until admin provisioning.`);
        return null;
      }

      const userData = buildUnifiedUserPayload(user, now, {
        role: existingClaims.role,
        entity_type: existingClaims.entity_type || 'SUBSIDIARY',
        entity_id: existingClaims.entity_id,
        tenant_id: existingClaims.tenant_id || 'ipc_group',
      });
      if (userData.permissions) userData.permissions.roles = [existingClaims.role];

      await userRef.set(userData);
      logger.info(`Mirrored user ${uid} (Unified) and set role ${userData.role}`);
    } else {
      // Sync claims from Firestore — merge to preserve all claim fields, never downgrade.
      const data = docSnap.data();
      if (data.role && !hasScopedClaims) {
        await admin.auth().setCustomUserClaims(uid, buildTenantClaims(data, existingClaims));
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
exports.backfillUsers = onCall({ 
  maxInstances: 1, // Limiter à 1 pour éviter les conflits de backfill concurrents
  timeoutSeconds: 540,
  memory: '1GiB',
  enforceAppCheck: true
}, async (request) => {
  const callerUid = request.auth?.uid;
  const callerEmail = request.auth?.token?.email;
  const callerRole = request.auth?.token?.role;

  logger.info('Backfill execution started', { 
    callerUid, 
    callerEmail, 
    callerRole 
  });

  // [AUDIT FIX] Remove hardcoded personal email whitelist — SUPER_ADMIN claim only.
  // Hardcoded emails in server-side code are a security anti-pattern (GDPR risk + backdoor).
  if (!callerUid) throw new HttpsError('unauthenticated', 'Authentification requise.');
  const isSuperAdmin = callerRole === 'SUPER_ADMIN';
  if (!isSuperAdmin) {
    logger.warn('Backfill: Permission denied', { callerUid, callerRole });
    throw new HttpsError('permission-denied', 'Only SUPER_ADMIN can run backfill.');
  }

  let scanned = 0;
  let createdUsers = 0;
  let createdHr = 0;
  let patched = 0;
  let errors = 0;

  try {
    let pageToken;
    do {
      const listUsersResult = await admin.auth().listUsers(1000, pageToken);
      
      // Utilisation d'un traitement séquentiel pour éviter de surcharger Firestore et Auth
      // et pour faciliter le débogage par logs
      for (const user of listUsersResult.users) {
        scanned++;
        const uid = user.uid;
        
        try {
          const userRef = db.collection('users').doc(uid);
          const now = admin.firestore.FieldValue.serverTimestamp();

          const userDoc = await userRef.get();
          const existingClaims = user.customClaims || {};

          // 1. Sync User & HR Unified Document
          if (!userDoc.exists) {
            if (!existingClaims.entity_id) {
              errors++;
              logger.warn(`Backfill: skipped ${uid} (${user.email}) because entity_id claim is missing.`);
              continue;
            }

            // [RBAC GUARD] Never silently assign EMPLOYEE during backfill.
            // If no role claim exists, skip this user and log — a SUPER_ADMIN must
            // explicitly assign a role via setUserRole before the user can be backfilled.
            if (!existingClaims.role) {
              errors++;
              logger.warn(`Backfill: skipped ${uid} (${user.email}) — no role claim. Assign a role via setUserRole first.`);
              continue;
            }

            const userData = buildUnifiedUserPayload(user, now, {
              role: existingClaims.role,
              entity_type: existingClaims.entity_type || 'SUBSIDIARY',
              entity_id: existingClaims.entity_id,
              tenant_id: existingClaims.tenant_id || 'ipc_group',
            });

            await userRef.set(userData);
            await admin.auth().setCustomUserClaims(uid, buildTenantClaims(userData, existingClaims));
            
            // Initialize hr_private sub-collection
            const privateFields = {
              salaire: 0,
              iban: '',
              ssn: '',
              rib: '',
              entity_id: userData.entity_id,
              entity_type: userData.entity_type,
              tenant_id: userData.tenant_id,
              lastModified: new Date().toISOString()
            };
            await userRef.collection('hr_private').doc('main').set(privateFields, { merge: true });

            createdUsers++;
            createdHr++;
            logger.info(`Backfill: Created unified user doc for ${uid} (${user.email})`);
          } else {
            const data = userDoc.data();
            // Sync claims if missing or inconsistent
            if (data.role) {
              await admin.auth().setCustomUserClaims(uid, buildTenantClaims(data, existingClaims));
            }
            
            // Repair metadata and hierarchy
            const updates = {};
            if (data._deletedAt !== null) updates._deletedAt = null;
            if (!data.hierarchy_level) updates.hierarchy_level = 'Employee';
            if (!data.profile) {
              const freshPayload = buildUnifiedUserPayload(user, now, {
                role: data.role,
                entity_type: data.entity_type,
                entity_id: data.entity_id,
                tenant_id: data.tenant_id,
              });
              updates.profile = freshPayload.profile;
            }
            if (!data.tenant_id) updates.tenant_id = existingClaims.tenant_id || 'ipc_group';
            
            if (Object.keys(updates).length > 0) {
              await userRef.update(updates);
              patched++;
            }

            if (data.entity_id) {
              await userRef.collection('hr_private').doc('main').set({
                entity_id: data.entity_id,
                entity_type: data.entity_type || existingClaims.entity_type || 'SUBSIDIARY',
                tenant_id: data.tenant_id || existingClaims.tenant_id || 'ipc_group',
                _updatedAt: now,
              }, { merge: true });
            }
          }

          // [CLEANUP] Remove legacy doc from root 'hr' if exists
          const legacyHrRef = db.collection('hr').doc(uid);
          const legacySnap = await legacyHrRef.get();
          if (legacySnap.exists) {
            await legacyHrRef.delete();
          }

        } catch (userErr) {
          errors++;
          logger.error(`Backfill: Error processing user ${uid}:`, userErr);
        }
      }

      pageToken = listUsersResult.pageToken;
    } while (pageToken);

    logger.info('Backfill completed successfully', { 
      scanned, 
      createdUsers, 
      createdHr, 
      patched, 
      errors 
    });

    return { 
      success: true, 
      message: 'La synchronisation des comptes a été effectuée avec succès.',
      scanned, 
      createdUsers, 
      createdHr, 
      patched,
      errors
    };
  } catch (error) {
    logger.error('Backfill fatal error:', error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', `Backfill failed: ${error.message}`);
  }
});

/**
 * 🔗 GREEN BLOCK: BACKFILL TO POSTGRESQL (CALLABLE)
 */
const greenblock = require('./greenblock');

exports.backfillGreenBlock = onCall({
  maxInstances: 1,
  timeoutSeconds: 540,
  memory: '1GiB'
}, async (request) => {
  const callerRole = request.auth?.token?.role;
  if (callerRole !== 'SUPER_ADMIN') {
    throw new HttpsError('permission-denied', 'Only SUPER_ADMIN can trigger SSOT backfill.');
  }

  const COLLECTIONS = [
    { name: 'users', model: 'com.ipc.greenblock.base.db.Partner' },
    { name: 'crm_clients', model: 'com.ipc.greenblock.base.db.Partner' },
    { name: 'finance_invoices', model: 'com.ipc.greenblock.finance.db.Invoice' },
    { name: 'hr_expenses', model: 'com.ipc.greenblock.hr.db.Expense' },
    { name: 'inventory_products', model: 'com.ipc.greenblock.product.db.ProductTemplate' }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const item of COLLECTIONS) {
    const snap = await db.collection(item.name).get();
    for (const doc of snap.docs) {
      try {
        await greenblock.syncRecord(item.model, doc.data(), doc.id);
        successCount++;
      } catch (err) {
        errorCount++;
        logger.error(`Backfill error for ${item.name}/${doc.id}:`, err);
      }
    }
  }

  return { success: true, syncs: successCount, errors: errorCount };
});
