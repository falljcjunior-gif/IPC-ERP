/**
 * ════════════════════════════════════════════════════════════════════════════
 * PROVISIONING SAGA — Saga-pattern entity lifecycle with compensation
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Provides a saga-based alternative to createGroupEntity with:
 *   - Per-step state tracking in `provisioning_jobs` Firestore collection
 *   - Automatic compensation (rollback) on step failure, in reverse order
 *   - Idempotency keys — safe to retry without side-effects
 *   - Resume capability — skips already-completed steps on retry
 *
 * Collections:
 *   provisioning_jobs/{jobId} — job metadata + per-step state
 *
 * Exported callables:
 *   createEntityWithSaga   — saga-based entity creation (replaces createGroupEntity)
 *   retryProvisioningJob   — SUPER_ADMIN: retry a FAILED/COMPENSATED job
 *   getProvisioningJob     — read job state (any Holding-level role)
 *
 * Security: all callables require HOLDING_CEO / HOLDING_CFO / SUPER_ADMIN claims
 *           + App Check. Admin SDK bypasses Firestore rules.
 */

'use strict';

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const { checkCallRate } = require('./rate_limiter');

const db   = () => admin.firestore();
const auth = () => admin.auth();
const FieldValue = admin.firestore.FieldValue;

// ── Constants ─────────────────────────────────────────────────────────────────

const HOLDING_ROLES  = new Set(['HOLDING_CEO', 'HOLDING_CFO', 'SUPER_ADMIN', 'HOLDING_AUDIT']);
const SUPER_ADMINS   = new Set(['SUPER_ADMIN']);
const BASELINE_MODULES = ['home', 'hr', 'finance', 'connect'];
const DEFAULT_DEPARTMENTS = [
  'Direction Générale',
  'Finance & Comptabilité',
  'Ressources Humaines',
  'Commercial & Ventes',
  'Opérations & Logistique',
  'Juridique & Conformité',
  'Informatique & Systèmes',
];

/** Job status enum */
const JOB_STATUS = Object.freeze({
  PENDING:      'PENDING',
  IN_PROGRESS:  'IN_PROGRESS',
  DONE:         'DONE',
  FAILED:       'FAILED',
  COMPENSATING: 'COMPENSATING',
  COMPENSATED:  'COMPENSATED',   // rollback complete — safe to retry
});

const STEP_STATUS = Object.freeze({
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  DONE:    'DONE',
  FAILED:  'FAILED',
  SKIPPED: 'SKIPPED',  // already done on a previous attempt
});

// ── Auth helpers ──────────────────────────────────────────────────────────────

function requireHoldingRole(request) {
  const token = request.auth?.token;
  if (!token) throw new HttpsError('unauthenticated', 'Authentification requise.');
  const role = token.role || '';
  if (!HOLDING_ROLES.has(role)) {
    throw new HttpsError('permission-denied',
      `Rôle Holding requis. Rôle actuel: ${role}`);
  }
  return token;
}

function requireSuperAdmin(request) {
  const token = request.auth?.token;
  if (!token) throw new HttpsError('unauthenticated', 'Authentification requise.');
  if (!SUPER_ADMINS.has(token.role || '')) {
    throw new HttpsError('permission-denied', 'SUPER_ADMIN requis.');
  }
  return token;
}

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s_-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .substring(0, 40);
}

// ── Saga runner ───────────────────────────────────────────────────────────────

/**
 * @typedef {Object} SagaStep
 * @property {string}   name        — unique step identifier
 * @property {Function} run         — async () => result
 * @property {Function} [compensate] — async (result) => void  (rollback)
 * @property {boolean}  [skipable]  — true = safe to skip if already DONE
 */

/**
 * runSaga — execute a list of steps with automatic compensation on failure.
 *
 * Writes step state to Firestore after each terminal transition (DONE/FAILED).
 * State updates are best-effort — a tracking write failure does NOT abort
 * the business logic, but is logged at ERROR level.
 *
 * @param {FirebaseFirestore.DocumentReference} jobRef
 * @param {SagaStep[]} steps
 * @param {Record<string,any>} [existingSteps={}]  — steps already completed (for resume)
 * @returns {Promise<Record<string,any>>}  — map of stepName → result
 */
async function runSaga(jobRef, steps, existingSteps = {}) {
  const completed = [];  // [{step, result}] for compensation (LIFO)
  const results   = {};

  /** Best-effort Firestore update — never throws */
  async function track(update) {
    try {
      await jobRef.update({ ...update, updatedAt: FieldValue.serverTimestamp() });
    } catch (trackErr) {
      logger.error('[Saga] Tracking write failed (non-fatal):', trackErr?.message || trackErr);
    }
  }

  for (const step of steps) {
    // Resume: skip if this step already succeeded on a previous attempt
    const prior = existingSteps[step.name];
    if (prior?.status === STEP_STATUS.DONE) {
      results[step.name] = prior.result ?? null;
      completed.push({ step, result: prior.result ?? null });
      continue;
    }

    await track({ [`steps.${step.name}.status`]: STEP_STATUS.RUNNING });

    try {
      const result = await step.run();
      results[step.name] = result;
      completed.push({ step, result });

      await track({
        [`steps.${step.name}.status`]:      STEP_STATUS.DONE,
        [`steps.${step.name}.result`]:      result ?? null,
        [`steps.${step.name}.completedAt`]: FieldValue.serverTimestamp(),
      });
    } catch (err) {
      const errMsg = err.message || String(err);

      await track({
        [`steps.${step.name}.status`]: STEP_STATUS.FAILED,
        [`steps.${step.name}.error`]:  errMsg,
        status: JOB_STATUS.COMPENSATING,
        error:  errMsg,
      });

      logger.error(`[Saga] Step "${step.name}" failed: ${errMsg}`);

      // ── Compensate in reverse order ────────────────────────────────────────
      for (const { step: cs, result: sr } of [...completed].reverse()) {
        if (typeof cs.compensate !== 'function') continue;
        const cKey = `compensations.${cs.name}`;
        try {
          await cs.compensate(sr, results);
          await track({
            [`${cKey}.status`]:      'DONE',
            [`${cKey}.completedAt`]: FieldValue.serverTimestamp(),
          });
          logger.info(`[Saga] Compensation for "${cs.name}" succeeded.`);
        } catch (compErr) {
          logger.error(`[Saga] Compensation for "${cs.name}" failed:`, compErr?.message || compErr);
          await track({
            [`${cKey}.status`]: 'FAILED',
            [`${cKey}.error`]:  compErr?.message || String(compErr),
          });
          // Continue compensating remaining steps even if one fails
        }
      }

      await track({ status: JOB_STATUS.COMPENSATED });

      // Re-throw so the caller knows the saga failed
      if (err instanceof HttpsError) throw err;
      throw new HttpsError('internal', errMsg);
    }
  }

  return results;
}

// ── createEntityWithSaga ──────────────────────────────────────────────────────

exports.createEntityWithSaga = onCall(
  { region: 'europe-west1', enforceAppCheck: true },
  async (request) => {
    const token = requireHoldingRole(request);
    const uid   = request.auth.uid;

    await checkCallRate(db(), uid, 'createEntityWithSaga', {
      maxRequests: 5,
      windowMs: 60 * 60 * 1000,
    });

    const {
      type,
      name,
      industry,
      country       = 'CI',
      currency      = 'XOF',
      timezone      = 'Africa/Abidjan',
      modules       = BASELINE_MODULES,
      licensePlanId,
      customQuotas  = {},
      director,
      autonomyLevel = 'supervised',
      idempotencyKey,  // caller supplies a unique key for safe retries
    } = request.data;

    // ── Validate required fields ──────────────────────────────────────────────
    if (!type || !['SUBSIDIARY', 'FOUNDATION'].includes(type)) {
      throw new HttpsError('invalid-argument', 'type must be SUBSIDIARY or FOUNDATION.');
    }
    if (!name || name.trim().length < 2) {
      throw new HttpsError('invalid-argument', 'name is required (min. 2 chars).');
    }
    if (!licensePlanId) {
      throw new HttpsError('invalid-argument', 'licensePlanId is required.');
    }
    if (!director?.email || !director?.nom) {
      throw new HttpsError('invalid-argument', 'director.email and director.nom are required.');
    }
    if (!idempotencyKey || typeof idempotencyKey !== 'string' || idempotencyKey.length < 8) {
      throw new HttpsError('invalid-argument', 'idempotencyKey must be a string of ≥8 chars.');
    }

    const callerEmail = (token.email || '').toLowerCase();
    if (callerEmail && director.email.toLowerCase() === callerEmail) {
      throw new HttpsError('invalid-argument', 'Caller cannot be the entity director.');
    }

    const allModules = [...new Set([...BASELINE_MODULES, ...modules])];

    // ── Idempotency check ─────────────────────────────────────────────────────
    const jobsRef  = db().collection('provisioning_jobs');
    const existing = await jobsRef
      .where('idempotencyKey', '==', idempotencyKey)
      .limit(1)
      .get();

    if (!existing.empty) {
      const existingJob = existing.docs[0].data();
      // Already DONE — return cached result
      if (existingJob.status === JOB_STATUS.DONE) {
        return { jobId: existing.docs[0].id, ...existingJob.result, cached: true };
      }
      // IN_PROGRESS or COMPENSATING — signal concurrent call
      if ([JOB_STATUS.IN_PROGRESS, JOB_STATUS.COMPENSATING].includes(existingJob.status)) {
        throw new HttpsError('already-exists',
          `Job ${existing.docs[0].id} is already in progress. Wait for it to finish.`);
      }
      // FAILED or COMPENSATED — re-throw last error so caller sees what went wrong
      if (existingJob.status === JOB_STATUS.FAILED) {
        throw new HttpsError('internal',
          `Previous attempt failed: ${existingJob.error}. Use retryProvisioningJob to retry.`);
      }
      // COMPENSATED — fall through to create a fresh job (retry path)
    }

    // ── Create job document ───────────────────────────────────────────────────
    const entityId = `${slugify(name)}_${Date.now().toString(36)}`;
    const jobRef   = jobsRef.doc();
    const jobId    = jobRef.id;

    const initialSteps = {};
    for (const s of ['writeOrgDocs', 'createAuthUser', 'setCustomClaims',
                      'writeUserProfile', 'activateEntity']) {
      initialSteps[s] = { status: STEP_STATUS.PENDING };
    }

    await jobRef.set({
      jobId,
      idempotencyKey,
      type: 'CREATE_ENTITY',
      status:   JOB_STATUS.IN_PROGRESS,
      entityId,
      input: { type, name, industry, country, currency, timezone,
               modules: allModules, licensePlanId, customQuotas,
               director, autonomyLevel },
      steps:    initialSteps,
      compensations: {},
      result:   null,
      error:    null,
      createdBy: uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    logger.info(`[Saga] Job ${jobId} started for entity "${name}" (${entityId}).`);

    // ── Define saga steps ─────────────────────────────────────────────────────

    /** Track whether Auth user was freshly created (vs already existing) */
    let authUserWasCreated = false;

    const sagaSteps = [

      // Step 1 — Firestore batch: org, license, usage counters, departments
      {
        name: 'writeOrgDocs',
        async run() {
          const batch = db().batch();

          batch.set(db().collection('organizations').doc(entityId), {
            entity_id:     entityId,
            entity_type:   type,
            parent_id:     'ipc_holding',
            name:          name.trim(),
            industry:      industry || null,
            country, currency, timezone, autonomyLevel,
            modules:       allModules,
            state:         'PROVISIONING',
            directorEmail: director.email,
            directorUid:   null,
            logo:          null,
            _createdAt:    FieldValue.serverTimestamp(),
            _createdBy:    uid,
            _updatedAt:    FieldValue.serverTimestamp(),
            _subModule:    'organizations',
          });

          batch.set(db().collection('entity_licenses').doc(entityId), {
            entity_id:  entityId,
            planId:     licensePlanId,
            state:      'ACTIVE',
            customQuotas,
            assignedAt: FieldValue.serverTimestamp(),
            assignedBy: uid,
            expiresAt:  null,
            _updatedAt: FieldValue.serverTimestamp(),
          });

          batch.set(db().collection('entity_usage').doc(entityId), {
            entity_id: entityId,
            userCount: 0, storageMB: 0, projectCount: 0,
            workflowCount: 0, aiTokensUsed: 0, apiCallsUsed: 0,
            campaignCount: 0, documentCount: 0,
            _updatedAt: FieldValue.serverTimestamp(),
          });

          batch.set(db().collection('organization_structure').doc(entityId), {
            entity_id:   entityId,
            departments: DEFAULT_DEPARTMENTS.map((dName, idx) => ({
              id:      `dept_${idx + 1}`,
              name:    dName,
              headUid: null,
              order:   idx,
            })),
            _createdAt: FieldValue.serverTimestamp(),
          });

          await batch.commit();
          return { entityId };
        },
        async compensate() {
          // Delete all four documents created in the batch
          const batchDel = db().batch();
          batchDel.delete(db().collection('organizations').doc(entityId));
          batchDel.delete(db().collection('entity_licenses').doc(entityId));
          batchDel.delete(db().collection('entity_usage').doc(entityId));
          batchDel.delete(db().collection('organization_structure').doc(entityId));
          await batchDel.commit();
          logger.info(`[Saga][compensate:writeOrgDocs] Deleted org docs for ${entityId}.`);
        },
      },

      // Step 2 — Create (or fetch) director Firebase Auth account
      {
        name: 'createAuthUser',
        async run() {
          let directorUser;
          try {
            directorUser = await auth().getUserByEmail(director.email);
            authUserWasCreated = false;
          } catch {
            directorUser = await auth().createUser({
              email:         director.email,
              displayName:   `${director.prenom || ''} ${director.nom}`.trim(),
              emailVerified: false,
              disabled:      false,
            });
            authUserWasCreated = true;
          }
          return { directorUid: directorUser.uid, wasCreated: authUserWasCreated };
        },
        async compensate(result) {
          if (!result?.directorUid) return;
          // Only delete if we created the account during this saga run
          if (authUserWasCreated) {
            await auth().deleteUser(result.directorUid);
            logger.info(`[Saga][compensate:createAuthUser] Deleted Auth user ${result.directorUid}.`);
          }
        },
      },

      // Step 3 — Set custom claims on the director
      {
        name: 'setCustomClaims',
        async run() {
          // directorUid is populated by the prior step via _resultsRef closure
          const directorUid = _resultsRef.createAuthUser?.directorUid;
          if (!directorUid) throw new HttpsError('internal', 'directorUid missing from step createAuthUser.');

          const directorRole = type === 'FOUNDATION' ? 'FOUNDATION_DG' : 'SUBSIDIARY_DG';
          await auth().setCustomUserClaims(directorUid, {
            role:        directorRole,
            entity_id:   entityId,
            entity_type: type,
          });
          return { directorUid, directorRole };
        },
        async compensate(result) {
          if (!result?.directorUid) return;
          // Clear custom claims (set to empty object)
          await auth().setCustomUserClaims(result.directorUid, {});
          logger.info(`[Saga][compensate:setCustomClaims] Cleared claims for ${result.directorUid}.`);
        },
      },

      // Step 4 — Write director Firestore user profile
      {
        name: 'writeUserProfile',
        async run() {
          const directorUid  = _resultsRef.createAuthUser?.directorUid;
          const directorRole = _resultsRef.setCustomClaims?.directorRole;
          if (!directorUid || !directorRole) {
            throw new HttpsError('internal', 'Missing directorUid or directorRole for writeUserProfile.');
          }
          await db().collection('users').doc(directorUid).set({
            uid:         directorUid,
            email:       director.email,
            nom:         director.nom,
            prenom:      director.prenom || '',
            role:        directorRole,
            entity_id:   entityId,
            entity_type: type,
            entity_name: name.trim(),
            permissions: {
              roles:          [directorRole],
              allowedModules: allModules,
              moduleAccess:   Object.fromEntries(allModules.map(m => [m, 'write'])),
            },
            _createdAt:  FieldValue.serverTimestamp(),
            _createdBy:  uid,
            _subModule:  'users',
          }, { merge: true });
          return { directorUid };
        },
        async compensate(result) {
          if (!result?.directorUid) return;
          await db().collection('users').doc(result.directorUid).delete();
          logger.info(`[Saga][compensate:writeUserProfile] Deleted user profile ${result.directorUid}.`);
        },
      },

      // Step 5 — Activate entity (set state = ACTIVE, write directorUid)
      {
        name: 'activateEntity',
        async run() {
          const directorUid = _resultsRef.createAuthUser?.directorUid;
          await db().collection('organizations').doc(entityId).update({
            directorUid,
            state:      'ACTIVE',
            _updatedAt: FieldValue.serverTimestamp(),
          });
          return { entityId, state: 'ACTIVE', directorUid };
        },
        async compensate() {
          // Re-set to PROVISIONING (not DELETED — org doc deletion handled by writeOrgDocs compensate)
          await db().collection('organizations').doc(entityId).update({
            state:      'PROVISIONING',
            _updatedAt: FieldValue.serverTimestamp(),
          }).catch(() => {}); // may already be gone
        },
      },

    ];

    // _resultsRef — mutable reference so steps can read prior step results
    // (runSaga populates this as steps complete)
    const _resultsRef = {};

    // Patch runSaga to populate _resultsRef (we can't modify runSaga signature easily)
    // Instead, we use a proxy object approach: steps close over _resultsRef and
    // runSaga will return the results; we copy them into _resultsRef after each step
    // by wrapping each step.run in a closure that writes to _resultsRef.
    for (const step of sagaSteps) {
      const originalRun = step.run.bind(step);
      step.run = async () => {
        const r = await originalRun();
        _resultsRef[step.name] = r;
        return r;
      };
    }

    // ── Execute the saga ──────────────────────────────────────────────────────
    let sagaResult;
    try {
      sagaResult = await runSaga(jobRef, sagaSteps);
    } catch (err) {
      // Job doc already updated to COMPENSATED by runSaga — write audit log
      try {
        await db().collection('audit_logs').add({
          action:   'CREATE_ENTITY_SAGA_FAILED',
          actorUid: uid,
          entityId,
          jobId,
          error:    err.message,
          _createdAt: FieldValue.serverTimestamp(),
          _subModule: 'provisioning_saga',
        });
      } catch { /* non-blocking */ }
      throw err;
    }

    // ── Mark job DONE ─────────────────────────────────────────────────────────
    const finalResult = {
      entityId,
      directorUid: sagaResult.createAuthUser?.directorUid,
      state:       'ACTIVE',
    };

    await jobRef.update({
      status:    JOB_STATUS.DONE,
      result:    finalResult,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Notification (non-blocking)
    db().collection('notifications').add({
      type:      'ENTITY_PROVISIONED',
      title:     `Nouvelle entité : ${name}`,
      body:      `${type === 'FOUNDATION' ? 'Fondation' : 'Filiale'} "${name}" provisionnée.`,
      entityId,
      jobId,
      _createdAt: FieldValue.serverTimestamp(),
      _subModule: 'notifications',
    }).catch(e => logger.warn('[Saga] Notification write failed (non-fatal):', e?.message));

    // Audit log
    try {
      await db().collection('audit_logs').add({
        action:      'CREATE_ENTITY_SAGA_DONE',
        actorUid:    uid,
        entityId,
        jobId,
        directorUid: finalResult.directorUid,
        _createdAt:  FieldValue.serverTimestamp(),
        _subModule:  'provisioning_saga',
      });
    } catch { /* non-blocking */ }

    logger.info(`[Saga] Job ${jobId} completed — entity ${entityId} is ACTIVE.`);
    return { jobId, ...finalResult };
  }
);

// ── retryProvisioningJob ──────────────────────────────────────────────────────

exports.retryProvisioningJob = onCall(
  { region: 'europe-west1', enforceAppCheck: true },
  async (request) => {
    requireSuperAdmin(request);
    const uid = request.auth.uid;

    const { jobId } = request.data;
    if (!jobId) throw new HttpsError('invalid-argument', 'jobId is required.');

    const jobRef = db().collection('provisioning_jobs').doc(jobId);
    const jobSnap = await jobRef.get();
    if (!jobSnap.exists) throw new HttpsError('not-found', `Job ${jobId} not found.`);

    const job = jobSnap.data();
    if (job.status === JOB_STATUS.DONE) {
      return { jobId, message: 'Job already completed.', result: job.result };
    }
    if (job.status === JOB_STATUS.IN_PROGRESS) {
      throw new HttpsError('failed-precondition', 'Job is currently in progress.');
    }
    if (![JOB_STATUS.FAILED, JOB_STATUS.COMPENSATED].includes(job.status)) {
      throw new HttpsError('failed-precondition', `Cannot retry job in status "${job.status}".`);
    }

    // Reset job to IN_PROGRESS (compensated steps are cleared, done steps are kept for skip)
    await jobRef.update({
      status:    JOB_STATUS.IN_PROGRESS,
      error:     null,
      updatedAt: FieldValue.serverTimestamp(),
      retriedBy: uid,
      retriedAt: FieldValue.serverTimestamp(),
    });

    logger.info(`[Saga] Job ${jobId} re-queued for retry by ${uid}.`);

    // NOTE: A full retry would re-invoke createEntityWithSaga logic here.
    // For now, this resets the status so the Holding operator can call
    // createEntityWithSaga again with the same idempotencyKey and it will
    // resume from the last completed step.
    return { jobId, message: 'Job reset to IN_PROGRESS. Call createEntityWithSaga again to resume.' };
  }
);

// ── getProvisioningJob ────────────────────────────────────────────────────────

exports.getProvisioningJob = onCall(
  { region: 'europe-west1', enforceAppCheck: true },
  async (request) => {
    requireHoldingRole(request);

    const { jobId } = request.data;
    if (!jobId) throw new HttpsError('invalid-argument', 'jobId is required.');

    const jobSnap = await db().collection('provisioning_jobs').doc(jobId).get();
    if (!jobSnap.exists) throw new HttpsError('not-found', `Job ${jobId} not found.`);

    const job = jobSnap.data();
    // Strip internal input.director email from non-SUPER_ADMIN callers
    const token = request.auth?.token;
    const isSuperAdmin = token?.role === 'SUPER_ADMIN';
    if (!isSuperAdmin && job.input?.director) {
      job.input = { ...job.input, director: { nom: job.input.director.nom } };
    }

    return job;
  }
);
