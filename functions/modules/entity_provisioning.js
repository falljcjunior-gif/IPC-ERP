/**
 * ════════════════════════════════════════════════════════════════════════════
 * ENTITY PROVISIONING — Holding-as-SaaS: Group Entity Lifecycle
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Cloud Function callables invoked exclusively by the Holding Cockpit.
 * Server-side enforcement of HOLDING roles — client can never bypass.
 *
 * Callable functions:
 *   createGroupEntity      — Full provisioning: org doc, license, director
 *   updateGroupEntity      — Update entity metadata / modules
 *   changeEntityState      — Lifecycle transitions (ACTIVE ↔ SUSPENDED etc.)
 *   assignEntityLicense    — Apply a plan to an entity (+ custom quotas)
 *   approveEntityUpgrade   — Holding approves a subsidiary upgrade request
 *   duplicateGroupEntity   — Template-based entity duplication
 *
 * Security: every function verifies caller has HOLDING_CEO / HOLDING_CFO /
 * SUPER_ADMIN custom claim before executing.
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

const db  = admin.firestore;
const auth = admin.auth;

// ── Helpers ───────────────────────────────────────────────────────────────────

const HOLDING_ROLES = new Set(['HOLDING_CEO', 'HOLDING_CFO', 'SUPER_ADMIN', 'HOLDING_AUDIT']);

/**
 * Verify the caller has a Holding-level role.
 * Throws HttpsError PERMISSION_DENIED on failure.
 */
function requireHoldingRole(context) {
  const token = context.auth?.token;
  if (!token) throw new HttpsError('unauthenticated', 'Authentification requise.');
  const role = token.role || '';
  if (!HOLDING_ROLES.has(role)) {
    throw new HttpsError('permission-denied',
      `Accès réservé aux rôles Holding. Rôle actuel: ${role}`);
  }
  return token;
}

/**
 * Generate a URL-safe slug from a name.
 * e.g. "IPC Green Blocks" → "ipc_green_blocks"
 */
function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // strip accents
    .replace(/[^a-z0-9\s_-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .substring(0, 40);
}

/**
 * Write a structured audit log entry.
 */
async function auditLog(action, actorUid, entityId, details = {}) {
  try {
    await db().collection('audit_logs').add({
      action,
      actorUid,
      entityId,
      details,
      _subModule: 'entity_provisioning',
      _createdAt: db.FieldValue.serverTimestamp(),
    });
  } catch {
    // Non-blocking — audit failure should never break provisioning
  }
}

// Default department structure provisioned for every new entity
const DEFAULT_DEPARTMENTS = [
  'Direction Générale',
  'Finance & Comptabilité',
  'Ressources Humaines',
  'Commercial & Ventes',
  'Opérations & Logistique',
  'Juridique & Conformité',
  'Informatique & Systèmes',
];

// Minimum module set granted to every entity regardless of plan
const BASELINE_MODULES = ['home', 'hr', 'finance', 'connect'];

// ── CALLABLE: createGroupEntity ───────────────────────────────────────────────

exports.createGroupEntity = onCall(
  { region: 'europe-west1', enforceAppCheck: false },
  async (request) => {
    const token = requireHoldingRole(request);
    const uid   = request.auth.uid;

    const {
      type,            // 'SUBSIDIARY' | 'FOUNDATION'
      name,
      industry,
      country   = 'CI',
      currency  = 'XOF',
      timezone  = 'Africa/Abidjan',
      modules   = BASELINE_MODULES,
      licensePlanId,
      customQuotas = {},
      director,        // { email, nom, prenom }
      autonomyLevel = 'supervised',
    } = request.data;

    // ── Validate required fields ──────────────────────────────────────────────
    if (!type || !['SUBSIDIARY', 'FOUNDATION'].includes(type)) {
      throw new HttpsError('invalid-argument', 'type doit être SUBSIDIARY ou FOUNDATION.');
    }
    if (!name || name.trim().length < 2) {
      throw new HttpsError('invalid-argument', 'Le nom de l\'entité est requis (min. 2 caractères).');
    }
    if (!licensePlanId) {
      throw new HttpsError('invalid-argument', 'licensePlanId est requis.');
    }
    if (!director?.email || !director?.nom) {
      throw new HttpsError('invalid-argument', 'Les informations du directeur (email, nom) sont requises.');
    }

    const entityId = `${slugify(name)}_${Date.now().toString(36)}`;
    const batch = db().batch();

    // ── 1. Organizations collection — entity master record ───────────────────
    const orgRef = db().collection('organizations').doc(entityId);
    batch.set(orgRef, {
      entity_id:     entityId,
      entity_type:   type,
      parent_id:     'ipc_holding',
      name:          name.trim(),
      industry:      industry || null,
      country,
      currency,
      timezone,
      autonomyLevel,
      modules:       [...new Set([...BASELINE_MODULES, ...modules])],
      state:         'PROVISIONING',
      directorEmail: director.email,
      directorUid:   null,        // filled after Auth user creation
      logo:          null,
      _createdAt:    db.FieldValue.serverTimestamp(),
      _createdBy:    uid,
      _updatedAt:    db.FieldValue.serverTimestamp(),
      _subModule:    'organizations',
    });

    // ── 2. License assignment ────────────────────────────────────────────────
    const licRef = db().collection('entity_licenses').doc(entityId);
    batch.set(licRef, {
      entity_id:     entityId,
      planId:        licensePlanId,
      state:         'ACTIVE',
      customQuotas,
      assignedAt:    db.FieldValue.serverTimestamp(),
      assignedBy:    uid,
      expiresAt:     null,
      _updatedAt:    db.FieldValue.serverTimestamp(),
    });

    // ── 3. Usage counters — initialized at 0 ────────────────────────────────
    const usageRef = db().collection('entity_usage').doc(entityId);
    batch.set(usageRef, {
      entity_id:     entityId,
      userCount:     0,
      storageMB:     0,
      projectCount:  0,
      workflowCount: 0,
      aiTokensUsed:  0,
      apiCallsUsed:  0,
      campaignCount: 0,
      documentCount: 0,
      _updatedAt:    db.FieldValue.serverTimestamp(),
    });

    // ── 4. Default departments / organizational structure ─────────────────────
    const structRef = db().collection('organization_structure').doc(entityId);
    batch.set(structRef, {
      entity_id:   entityId,
      departments: DEFAULT_DEPARTMENTS.map((name_, idx) => ({
        id:   `dept_${idx + 1}`,
        name: name_,
        headUid: null,
        order: idx,
      })),
      _createdAt:  db.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    // ── 5. Create director Firebase Auth account ─────────────────────────────
    let directorUid = null;
    let directorProvisioningError = null;
    try {
      let directorUser;
      try {
        // If account already exists, fetch it
        directorUser = await auth().getUserByEmail(director.email);
        directorUid  = directorUser.uid;
      } catch {
        // Create new account
        directorUser = await auth().createUser({
          email:       director.email,
          displayName: `${director.prenom || ''} ${director.nom}`.trim(),
          emailVerified: false,
          disabled:    false,
        });
        directorUid = directorUser.uid;
      }

      const directorRole = type === 'FOUNDATION' ? 'FOUNDATION_DG' : 'SUBSIDIARY_DG';

      // Set custom claims
      await auth().setCustomUserClaims(directorUid, {
        role:      directorRole,
        entity_id: entityId,
        entity_type: type,
      });

      // Create Firestore user profile
      await db().collection('users').doc(directorUid).set({
        uid:       directorUid,
        email:     director.email,
        nom:       director.nom,
        prenom:    director.prenom || '',
        role:      directorRole,
        entity_id: entityId,
        entity_type: type,
        entity_name: name.trim(),
        permissions: {
          roles:         [directorRole],
          allowedModules: [...new Set([...BASELINE_MODULES, ...modules])],
          moduleAccess:   Object.fromEntries(
            [...new Set([...BASELINE_MODULES, ...modules])].map(m => [m, 'write'])
          ),
        },
        _createdAt: db.FieldValue.serverTimestamp(),
        _createdBy: uid,
        _subModule: 'users',
      }, { merge: true });

      // Update entity with resolved directorUid
      await db().collection('organizations').doc(entityId).update({
        directorUid,
        state:      'ACTIVE',
        _updatedAt: db.FieldValue.serverTimestamp(),
      });

    } catch (err) {
      directorProvisioningError = err.message;
      // Entity is created but director failed — keep PROVISIONING state
      // Holding can retry via updateGroupEntity
      console.error(`[createGroupEntity] Director provisioning failed for ${entityId}:`, err);
    }

    // ── 6. Notify Holding + Director (non-blocking) ──────────────────────────
    const notif = {
      type:      'ENTITY_PROVISIONED',
      title:     `Nouvelle entité : ${name}`,
      body:      `${type === 'FOUNDATION' ? 'Fondation' : 'Filiale'} "${name}" provisionnée par la Holding.`,
      entityId,
      _createdAt: db.FieldValue.serverTimestamp(),
      _subModule: 'notifications',
    };
    db().collection('notifications').add(notif).catch(() => {});

    // ── 7. Audit log ─────────────────────────────────────────────────────────
    await auditLog('CREATE_ENTITY', uid, entityId, {
      type, name, industry, country, licensePlanId,
      directorEmail: director.email, directorUid,
      directorProvisioningError,
    });

    return {
      entityId,
      directorUid,
      state:                  directorUid ? 'ACTIVE' : 'PROVISIONING',
      directorProvisioningError: directorProvisioningError || null,
    };
  }
);

// ── CALLABLE: updateGroupEntity ───────────────────────────────────────────────

exports.updateGroupEntity = onCall(
  { region: 'europe-west1', enforceAppCheck: false },
  async (request) => {
    const token = requireHoldingRole(request);
    const uid   = request.auth.uid;

    const { entityId, updates } = request.data;
    if (!entityId) throw new HttpsError('invalid-argument', 'entityId requis.');

    // Whitelist of editable fields from the Holding cockpit
    const ALLOWED_UPDATE_KEYS = [
      'name', 'industry', 'country', 'currency', 'timezone',
      'autonomyLevel', 'modules', 'logo', 'directorEmail',
    ];

    const sanitized = Object.fromEntries(
      Object.entries(updates || {}).filter(([k]) => ALLOWED_UPDATE_KEYS.includes(k))
    );

    if (Object.keys(sanitized).length === 0) {
      throw new HttpsError('invalid-argument', 'Aucun champ modifiable fourni.');
    }

    await db().collection('organizations').doc(entityId).update({
      ...sanitized,
      _updatedAt: db.FieldValue.serverTimestamp(),
      _updatedBy: uid,
    });

    await auditLog('UPDATE_ENTITY', uid, entityId, { updates: sanitized });
    return { success: true, entityId };
  }
);

// ── CALLABLE: changeEntityState ───────────────────────────────────────────────

const VALID_STATES    = ['ACTIVE', 'SUSPENDED', 'ARCHIVED', 'DELETED', 'TRIAL'];
const ALLOWED_TRANSITIONS = {
  PROVISIONING: ['ACTIVE'],
  TRIAL:        ['ACTIVE', 'SUSPENDED', 'ARCHIVED'],
  ACTIVE:       ['TRIAL', 'SUSPENDED', 'ARCHIVED'],
  SUSPENDED:    ['ACTIVE', 'ARCHIVED'],
  ARCHIVED:     ['DELETED'],
  DELETED:      [],
};

exports.changeEntityState = onCall(
  { region: 'europe-west1', enforceAppCheck: false },
  async (request) => {
    requireHoldingRole(request);
    const uid = request.auth.uid;

    const { entityId, newState, reason = '' } = request.data;
    if (!entityId) throw new HttpsError('invalid-argument', 'entityId requis.');
    if (!VALID_STATES.includes(newState)) {
      throw new HttpsError('invalid-argument', `État invalide: ${newState}`);
    }

    const orgDoc = await db().collection('organizations').doc(entityId).get();
    if (!orgDoc.exists) throw new HttpsError('not-found', `Entité ${entityId} introuvable.`);

    const currentState = orgDoc.data().state || 'ACTIVE';
    const allowed = ALLOWED_TRANSITIONS[currentState] || [];
    if (!allowed.includes(newState)) {
      throw new HttpsError('failed-precondition',
        `Transition ${currentState} → ${newState} non autorisée.`);
    }

    const batch = db().batch();

    batch.update(db().collection('organizations').doc(entityId), {
      state:      newState,
      _updatedAt: db.FieldValue.serverTimestamp(),
      _updatedBy: uid,
    });

    batch.update(db().collection('entity_licenses').doc(entityId), {
      state:      newState === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE',
      _updatedAt: db.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    // If suspending, disable director account (best-effort)
    if (newState === 'SUSPENDED') {
      const directorUid = orgDoc.data().directorUid;
      if (directorUid) {
        auth().updateUser(directorUid, { disabled: true }).catch(() => {});
      }
    }
    if (newState === 'ACTIVE' && currentState === 'SUSPENDED') {
      const directorUid = orgDoc.data().directorUid;
      if (directorUid) {
        auth().updateUser(directorUid, { disabled: false }).catch(() => {});
      }
    }

    await auditLog('CHANGE_ENTITY_STATE', uid, entityId, { from: currentState, to: newState, reason });
    return { success: true, entityId, previousState: currentState, newState };
  }
);

// ── CALLABLE: assignEntityLicense ─────────────────────────────────────────────

exports.assignEntityLicense = onCall(
  { region: 'europe-west1', enforceAppCheck: false },
  async (request) => {
    requireHoldingRole(request);
    const uid = request.auth.uid;

    const { entityId, planId, customQuotas = {} } = request.data;
    if (!entityId || !planId) throw new HttpsError('invalid-argument', 'entityId et planId requis.');

    await db().collection('entity_licenses').doc(entityId).set({
      entity_id:   entityId,
      planId,
      customQuotas,
      assignedAt:  db.FieldValue.serverTimestamp(),
      assignedBy:  uid,
      state:       'ACTIVE',
      _updatedAt:  db.FieldValue.serverTimestamp(),
    }, { merge: true });

    await auditLog('ASSIGN_LICENSE', uid, entityId, { planId, customQuotas });
    return { success: true, entityId, planId };
  }
);

// ── CALLABLE: approveEntityUpgrade ───────────────────────────────────────────

exports.approveEntityUpgrade = onCall(
  { region: 'europe-west1', enforceAppCheck: false },
  async (request) => {
    requireHoldingRole(request);
    const uid = request.auth.uid;

    const { requestId, newPlanId, customQuotas = {} } = request.data;
    if (!requestId || !newPlanId) {
      throw new HttpsError('invalid-argument', 'requestId et newPlanId requis.');
    }

    const reqDoc = await db().collection('upgrade_requests').doc(requestId).get();
    if (!reqDoc.exists) throw new HttpsError('not-found', 'Demande introuvable.');
    if (reqDoc.data().status !== 'pending') {
      throw new HttpsError('failed-precondition', 'Cette demande est déjà traitée.');
    }

    const entityId = reqDoc.data().entity_id;

    const batch = db().batch();

    // Update request status
    batch.update(db().collection('upgrade_requests').doc(requestId), {
      status:     'approved',
      approvedBy: uid,
      approvedAt: db.FieldValue.serverTimestamp(),
      newPlanId,
    });

    // Apply new license
    batch.set(db().collection('entity_licenses').doc(entityId), {
      entity_id:   entityId,
      planId:      newPlanId,
      customQuotas,
      assignedAt:  db.FieldValue.serverTimestamp(),
      assignedBy:  uid,
      state:       'ACTIVE',
      _updatedAt:  db.FieldValue.serverTimestamp(),
    }, { merge: true });

    await batch.commit();

    // Notify entity
    db().collection('notifications').add({
      type:      'LICENSE_UPGRADE_APPROVED',
      entityId,
      title:     'Mise à niveau approuvée',
      body:      `Votre demande de mise à niveau vers le plan ${newPlanId} a été approuvée par la Holding.`,
      _createdAt: db.FieldValue.serverTimestamp(),
      _subModule: 'notifications',
    }).catch(() => {});

    await auditLog('APPROVE_UPGRADE', uid, entityId, { requestId, newPlanId });
    return { success: true, entityId, newPlanId };
  }
);

// ── CALLABLE: duplicateGroupEntity ────────────────────────────────────────────

exports.duplicateGroupEntity = onCall(
  { region: 'europe-west1', enforceAppCheck: false },
  async (request) => {
    requireHoldingRole(request);
    const uid = request.auth.uid;

    const { sourceEntityId, name, director, licensePlanId } = request.data;
    if (!sourceEntityId || !name || !director?.email) {
      throw new HttpsError('invalid-argument', 'sourceEntityId, name et director.email requis.');
    }

    const sourceDoc = await db().collection('organizations').doc(sourceEntityId).get();
    if (!sourceDoc.exists) throw new HttpsError('not-found', `Entité source ${sourceEntityId} introuvable.`);

    const sourceData = sourceDoc.data();
    const sourceLic  = await db().collection('entity_licenses').doc(sourceEntityId).get();

    // Delegate to createGroupEntity logic by constructing equivalent payload
    const entityId = `${slugify(name)}_${Date.now().toString(36)}`;
    const newPlanId = licensePlanId || sourceLic.data()?.planId || 'STARTER';

    const batch = db().batch();

    batch.set(db().collection('organizations').doc(entityId), {
      ...sourceData,
      entity_id:     entityId,
      name:          name.trim(),
      directorEmail: director.email,
      directorUid:   null,
      state:         'PROVISIONING',
      _createdAt:    db.FieldValue.serverTimestamp(),
      _createdBy:    uid,
      _clonedFrom:   sourceEntityId,
    });

    batch.set(db().collection('entity_licenses').doc(entityId), {
      entity_id:  entityId,
      planId:     newPlanId,
      state:      'ACTIVE',
      assignedAt: db.FieldValue.serverTimestamp(),
      assignedBy: uid,
    });

    batch.set(db().collection('entity_usage').doc(entityId), {
      entity_id: entityId,
      userCount: 0, storageMB: 0, projectCount: 0,
      workflowCount: 0, aiTokensUsed: 0, apiCallsUsed: 0,
      campaignCount: 0, documentCount: 0,
      _updatedAt: db.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    await auditLog('DUPLICATE_ENTITY', uid, entityId, { sourceEntityId, name, newPlanId });
    return { entityId, state: 'PROVISIONING' };
  }
);
