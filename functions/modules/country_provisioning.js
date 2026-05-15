/**
 * ════════════════════════════════════════════════════════════════════════════
 * COUNTRY PROVISIONING — Holding-as-SaaS: Country Scope Lifecycle
 * ════════════════════════════════════════════════════════════════════════════
 *
 *  CONTRAT
 *  ───────
 *  Une seule callable atomique : `provisionCountryScope`.
 *
 *  Input (request.data) :
 *    {
 *      country_code: 'SN',                       // ISO 3166-1 alpha-2
 *      country_name: 'Sénégal',
 *      currency:     'XOF',
 *      timezone:     'Africa/Dakar',
 *      flag:         '🇸🇳',
 *      licenses: {
 *        subsidiary_plan: 'BUSINESS',
 *        foundation_plan: 'FOUNDATION',
 *      },
 *      subsidiary: {
 *        name:    'IPC Sénégal',                 // optionnel — défaut: IPC <country_name>
 *        industry:'Conglomérat',
 *        modules: ['crm','sales','finance','hr','inventory'],
 *        director: {
 *          email:  'directeur.sn@ipc.com',
 *          nom:    'Diop',
 *          prenom: 'Aïssatou',
 *        },
 *      },
 *      foundation: {
 *        name:    'IPC Foundation Sénégal',      // optionnel
 *        modules: ['foundation_impact','foundation_donations','foundation_campaigns','foundation_esg','dms'],
 *        director: {
 *          email:  'foundation.sn@ipc.com',
 *          nom:    'Ndiaye',
 *          prenom: 'Mamadou',
 *        },
 *      },
 *    }
 *
 *  Output :
 *    {
 *      country_id:            'SN',
 *      subsidiary_id:         'ipc_senegal',
 *      foundation_id:         'ipc_foundation_senegal',
 *      subsidiary_director_uid: 'auth_uid_xxx',
 *      foundation_director_uid: 'auth_uid_yyy',
 *      state:                 'ACTIVE',
 *      errors:                [],
 *    }
 *
 *  GARANTIES
 *  ─────────
 *  - Idempotent sur `country_code` : un pays ne peut être créé deux fois
 *    (collision → HttpsError 'already-exists').
 *  - Transaction Firestore pour les 6 écritures atomiques (scope, 2 orgs,
 *    2 licences, 2 usage counters, 2 org_structures).
 *  - Auth + Firestore users provisionnés HORS transaction (best-effort,
 *    erreurs loguées dans le doc country_scope.errors[]).
 *
 *  SÉCURITÉ
 *  ────────
 *  Réservé aux rôles : HOLDING_CEO, HOLDING_CFO, HOLDING_AUDIT, SUPER_ADMIN.
 *  Aucune autre persona (y compris COUNTRY_DIRECTOR_*) ne peut appeler cette CF.
 * ════════════════════════════════════════════════════════════════════════════
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger }             = require('firebase-functions');
const admin                  = require('firebase-admin');
const { checkCallRate }      = require('./rate_limiter');

const db   = admin.firestore;
const auth = admin.auth;

const HOLDING_ROLES = new Set(['HOLDING_CEO', 'HOLDING_CFO', 'HOLDING_AUDIT', 'SUPER_ADMIN']);

function requireHoldingRole(request) {
  const token = request.auth?.token;
  if (!token) throw new HttpsError('unauthenticated', 'Authentification requise.');
  const role = token.role || '';
  if (!HOLDING_ROLES.has(role)) {
    throw new HttpsError('permission-denied',
      `Accès réservé aux rôles Holding. Rôle actuel: ${role}`);
  }
  return token;
}

// ── Slugify utility (sans accents, lowercase, snake_case) ───────────────────
function slugify(s = '') {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 40);
}

// ── Departments & baseline modules par type d'entité ───────────────────────

const DEFAULT_DEPARTMENTS_SUBSIDIARY = [
  'Direction Générale',
  'Finance & Comptabilité',
  'Ressources Humaines',
  'Commercial & Ventes',
  'Opérations & Logistique',
  'Juridique & Conformité',
  'Informatique & Systèmes',
];

const DEFAULT_DEPARTMENTS_FOUNDATION = [
  'Direction Générale',
  'Programmes & Mission',
  'Bénéficiaires & Terrain',
  'Suivi-Évaluation Impact',
  'Communication & Plaidoyer',
  'Finance & Conformité',
  'Partenariats & Levée de fonds',
];

const BASELINE_MODULES_SUBSIDIARY = ['home', 'hr', 'finance', 'connect', 'dms'];
const BASELINE_MODULES_FOUNDATION = ['home', 'connect', 'dms', 'foundation_impact'];

// ── Audit log helper ────────────────────────────────────────────────────────

async function auditLog(action, actorUid, countryId, details = {}) {
  try {
    await db().collection('audit_logs').add({
      action,
      actorUid,
      countryId,
      details,
      _subModule: 'country_provisioning',
      _createdAt: db.FieldValue.serverTimestamp(),
    });
  } catch (e) {
    logger.warn('[country_provisioning] audit log failed:', e.message);
  }
}

// ── Provision Auth user + Firestore profile pour un directeur pays ─────────

async function provisionCountryDirector({
  director,
  role,
  entity_id,
  entity_type,
  entity_name,
  country_id,
  modules,
  actorUid,
}) {
  // 1) Auth user (créé ou récupéré)
  let directorUid = null;
  try {
    const existing = await auth().getUserByEmail(director.email);
    directorUid = existing.uid;
  } catch {
    const created = await auth().createUser({
      email:         director.email,
      displayName:   `${director.prenom || ''} ${director.nom}`.trim(),
      emailVerified: false,
      disabled:      false,
    });
    directorUid = created.uid;
  }

  // 2) Custom claims (rôle + entity + country pour ABAC/rules)
  await auth().setCustomUserClaims(directorUid, {
    role,
    entity_id,
    entity_type,
    country_id,
  });

  // 3) Firestore user profile
  const moduleAccess = Object.fromEntries(modules.map(m => [m, 'write']));
  await db().collection('users').doc(directorUid).set({
    uid:        directorUid,
    email:      director.email,
    nom:        director.nom,
    prenom:     director.prenom || '',
    role,
    entity_id,
    entity_type,
    entity_name,
    country_id,
    permissions: {
      roles:          [role],
      allowedModules: modules,
      moduleAccess,
    },
    _createdAt: db.FieldValue.serverTimestamp(),
    _createdBy: actorUid,
    _subModule: 'users',
  }, { merge: true });

  return directorUid;
}

// ── CALLABLE: provisionCountryScope ─────────────────────────────────────────

exports.provisionCountryScope = onCall(
  { region: 'europe-west1', enforceAppCheck: false, timeoutSeconds: 120 },
  async (request) => {
    const token   = requireHoldingRole(request);
    const actorUid = request.auth.uid;

    // [AUDIT FIX] Rate limiting — provisioning is expensive; max 10 per hour
    await checkCallRate(db(), actorUid, 'provisionCountryScope', { maxRequests: 10, windowMs: 3_600_000 });

    const {
      country_code,
      country_name,
      currency  = 'XOF',
      timezone  = 'Africa/Abidjan',
      flag      = '🌍',
      licenses  = {},
      subsidiary = {},
      foundation = {},
    } = request.data || {};

    // ── 1. Validation ─────────────────────────────────────────────────────
    if (!country_code || country_code.length !== 2) {
      throw new HttpsError('invalid-argument', 'country_code (ISO alpha-2) requis.');
    }
    if (!country_name) {
      throw new HttpsError('invalid-argument', 'country_name requis.');
    }
    if (!licenses.subsidiary_plan || !licenses.foundation_plan) {
      throw new HttpsError('invalid-argument',
        'licenses.subsidiary_plan et licenses.foundation_plan requis.');
    }
    if (!subsidiary.director?.email || !foundation.director?.email) {
      throw new HttpsError('invalid-argument',
        'Les emails des deux directeurs (subsidiary + foundation) sont requis.');
    }

    const country_id = country_code.toUpperCase();

    // ── 2. Idempotence : refuse si le scope existe déjà ───────────────────
    const scopeRef = db().collection('country_scopes').doc(country_id);
    const existing = await scopeRef.get();
    if (existing.exists && existing.data().state !== 'ARCHIVED') {
      throw new HttpsError('already-exists',
        `Le pays ${country_id} possède déjà un Country Scope actif.`);
    }

    // ── 3. Calcul des entity_id jumeaux ───────────────────────────────────
    const slug = slugify(country_name);
    const subsidiary_id = `ipc_${slug}`;
    const foundation_id = `ipc_foundation_${slug}`;

    const subsidiary_name = subsidiary.name?.trim() || `IPC ${country_name}`;
    const foundation_name = foundation.name?.trim() || `IPC Foundation ${country_name}`;

    const subsidiary_modules = Array.from(new Set([
      ...BASELINE_MODULES_SUBSIDIARY,
      ...(subsidiary.modules || []),
    ]));
    const foundation_modules = Array.from(new Set([
      ...BASELINE_MODULES_FOUNDATION,
      ...(foundation.modules || []),
    ]));

    // ── 4. Transaction Firestore : 7 docs atomiques ───────────────────────
    const batch = db().batch();
    const now   = db.FieldValue.serverTimestamp();

    // 4a) country_scope master doc
    batch.set(scopeRef, {
      country_id,
      country_name,
      currency,
      timezone,
      flag,
      state:          'PROVISIONING',
      tenant_id:      'ipc_group',
      holding_id:     'ipc_holding',
      subsidiary_id,
      foundation_id,
      licenses: {
        subsidiary_plan: licenses.subsidiary_plan,
        foundation_plan: licenses.foundation_plan,
      },
      directors: { subsidiary_uid: null, foundation_uid: null },
      errors:    [],
      _createdAt: now,
      _createdBy: actorUid,
      _subModule: 'country_scopes',
    });

    // 4b) organizations — SUBSIDIARY
    batch.set(db().collection('organizations').doc(subsidiary_id), {
      entity_id:     subsidiary_id,
      entity_type:   'SUBSIDIARY',
      parent_id:     'ipc_holding',
      country_id,
      name:          subsidiary_name,
      industry:      subsidiary.industry || 'Conglomérat',
      country:       country_id,
      currency,
      timezone,
      autonomyLevel: 'supervised',
      modules:       subsidiary_modules,
      state:         'PROVISIONING',
      directorEmail: subsidiary.director.email,
      directorUid:   null,
      _createdAt:    now,
      _createdBy:    actorUid,
      _updatedAt:    now,
      _subModule:    'organizations',
    });

    // 4c) organizations — FOUNDATION
    batch.set(db().collection('organizations').doc(foundation_id), {
      entity_id:     foundation_id,
      entity_type:   'FOUNDATION',
      parent_id:     'ipc_holding',
      country_id,
      name:          foundation_name,
      industry:      'ONG / Social / ESG',
      country:       country_id,
      currency,
      timezone,
      autonomyLevel: 'supervised',
      isNonProfit:   true,
      modules:       foundation_modules,
      state:         'PROVISIONING',
      directorEmail: foundation.director.email,
      directorUid:   null,
      _createdAt:    now,
      _createdBy:    actorUid,
      _updatedAt:    now,
      _subModule:    'organizations',
    });

    // 4d) entity_licenses — 2 docs
    for (const [eid, planId] of [
      [subsidiary_id, licenses.subsidiary_plan],
      [foundation_id, licenses.foundation_plan],
    ]) {
      batch.set(db().collection('entity_licenses').doc(eid), {
        entity_id:    eid,
        country_id,
        planId,
        state:        'ACTIVE',
        customQuotas: {},
        assignedAt:   now,
        assignedBy:   actorUid,
        expiresAt:    null,
        _updatedAt:   now,
      });
    }

    // 4e) entity_usage — 2 docs initialisés à zéro
    for (const eid of [subsidiary_id, foundation_id]) {
      batch.set(db().collection('entity_usage').doc(eid), {
        entity_id:     eid,
        country_id,
        userCount:     0,
        storageMB:     0,
        projectCount:  0,
        workflowCount: 0,
        aiTokensUsed:  0,
        apiCallsUsed:  0,
        campaignCount: 0,
        documentCount: 0,
        _updatedAt:    now,
      });
    }

    // 4f) organization_structure — départements par défaut
    batch.set(db().collection('organization_structure').doc(subsidiary_id), {
      entity_id:   subsidiary_id,
      country_id,
      departments: DEFAULT_DEPARTMENTS_SUBSIDIARY.map((name, idx) => ({
        id: `dept_${idx + 1}`, name, headUid: null, order: idx,
      })),
      _createdAt:  now,
    });
    batch.set(db().collection('organization_structure').doc(foundation_id), {
      entity_id:   foundation_id,
      country_id,
      departments: DEFAULT_DEPARTMENTS_FOUNDATION.map((name, idx) => ({
        id: `dept_${idx + 1}`, name, headUid: null, order: idx,
      })),
      _createdAt:  now,
    });

    await batch.commit();

    // ── 5. Provisioning des 2 directeurs (best-effort, hors transaction) ───
    const errors = [];
    let subsidiary_director_uid = null;
    let foundation_director_uid = null;

    try {
      subsidiary_director_uid = await provisionCountryDirector({
        director:    subsidiary.director,
        role:        'COUNTRY_DIRECTOR_SUBSIDIARY',
        entity_id:   subsidiary_id,
        entity_type: 'SUBSIDIARY',
        entity_name: subsidiary_name,
        country_id,
        modules:     subsidiary_modules,
        actorUid,
      });
    } catch (err) {
      logger.error('[provisionCountryScope] subsidiary director failed:', err);
      errors.push({ scope: 'subsidiary_director', message: err.message });
    }

    try {
      foundation_director_uid = await provisionCountryDirector({
        director:    foundation.director,
        role:        'COUNTRY_DIRECTOR_FOUNDATION',
        entity_id:   foundation_id,
        entity_type: 'FOUNDATION',
        entity_name: foundation_name,
        country_id,
        modules:     foundation_modules,
        actorUid,
      });
    } catch (err) {
      logger.error('[provisionCountryScope] foundation director failed:', err);
      errors.push({ scope: 'foundation_director', message: err.message });
    }

    // ── 6. Finalisation : passer en ACTIVE + lier les directeurs ──────────
    const finalState = errors.length === 0 ? 'ACTIVE' : 'PROVISIONING';

    const finalBatch = db().batch();
    finalBatch.update(scopeRef, {
      state: finalState,
      directors: {
        subsidiary_uid: subsidiary_director_uid,
        foundation_uid: foundation_director_uid,
      },
      errors,
      provisioned_at: now,
      activated_at:   finalState === 'ACTIVE' ? now : null,
    });
    if (subsidiary_director_uid) {
      finalBatch.update(db().collection('organizations').doc(subsidiary_id), {
        directorUid: subsidiary_director_uid,
        state:       finalState,
        _updatedAt:  now,
      });
    }
    if (foundation_director_uid) {
      finalBatch.update(db().collection('organizations').doc(foundation_id), {
        directorUid: foundation_director_uid,
        state:       finalState,
        _updatedAt:  now,
      });
    }
    await finalBatch.commit();

    // ── 7. Notifications + audit (non bloquant) ───────────────────────────
    db().collection('notifications').add({
      type:       'COUNTRY_SCOPE_PROVISIONED',
      title:      `Nouveau pays : ${country_name}`,
      body:       `Filiale ${subsidiary_name} et Foundation ${foundation_name} provisionnées.`,
      country_id,
      _createdAt: now,
      _subModule: 'notifications',
    }).catch(() => {});

    await auditLog('CREATE_COUNTRY_SCOPE', actorUid, country_id, {
      subsidiary_id, foundation_id,
      subsidiary_plan: licenses.subsidiary_plan,
      foundation_plan: licenses.foundation_plan,
      subsidiary_director_email: subsidiary.director.email,
      foundation_director_email: foundation.director.email,
      errors,
    });

    return {
      country_id,
      subsidiary_id,
      foundation_id,
      subsidiary_director_uid,
      foundation_director_uid,
      state: finalState,
      errors,
    };
  }
);

// ── CALLABLE: changeCountryScopeState ───────────────────────────────────────
// Gel/réactivation d'un pays (cascade sur les 2 entités jumelles)

const VALID_COUNTRY_STATES = ['ACTIVE', 'SUSPENDED', 'ARCHIVED'];

exports.changeCountryScopeState = onCall(
  { region: 'europe-west1', enforceAppCheck: false },
  async (request) => {
    requireHoldingRole(request);
    const actorUid = request.auth.uid;
    const { country_id, newState, reason = '' } = request.data || {};

    if (!country_id) throw new HttpsError('invalid-argument', 'country_id requis.');
    if (!VALID_COUNTRY_STATES.includes(newState)) {
      throw new HttpsError('invalid-argument', `État invalide: ${newState}`);
    }

    const scopeRef = db().collection('country_scopes').doc(country_id);
    const scopeDoc = await scopeRef.get();
    if (!scopeDoc.exists) {
      throw new HttpsError('not-found', `Country scope ${country_id} introuvable.`);
    }

    const scope = scopeDoc.data();
    const batch = db().batch();
    const now   = db.FieldValue.serverTimestamp();

    batch.update(scopeRef, { state: newState, _updatedAt: now, _updatedBy: actorUid });
    // Cascade : passer les 2 entités jumelles dans le même état
    if (scope.subsidiary_id) {
      batch.update(db().collection('organizations').doc(scope.subsidiary_id),
        { state: newState, _updatedAt: now });
    }
    if (scope.foundation_id) {
      batch.update(db().collection('organizations').doc(scope.foundation_id),
        { state: newState, _updatedAt: now });
    }
    await batch.commit();

    await auditLog('CHANGE_COUNTRY_STATE', actorUid, country_id,
      { newState, reason, cascadeEntities: [scope.subsidiary_id, scope.foundation_id] });

    return { success: true, country_id, newState };
  }
);
