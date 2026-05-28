/**
 * ════════════════════════════════════════════════════════════════════════════
 * HOLDING GOVERNANCE — Server-Side Approval Engine
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Replaces direct Firestore writes from the HoldingCockpit client.
 *
 * WHY: Approvals for budget, intercompany, recruitment, and investment
 * decisions MUST be validated server-side:
 *   1. Caller's identity verified via Admin SDK (not claimable client-side)
 *   2. Role check enforced in the function (HOLDING_CEO / HOLDING_CFO / SUPER_ADMIN)
 *   3. Audit log written atomically with the decision (server timestamp)
 *   4. Idempotency guard — an already-processed item cannot be re-processed
 *
 * Functions exported:
 *   approveGovernanceItem  → validates + approves + audit log
 *   rejectGovernanceItem   → validates + rejects  + audit log
 */

'use strict';

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger }             = require('firebase-functions');
const admin                  = require('firebase-admin');
const { z }                  = require('zod');
const { checkCallRate }      = require('./rate_limiter');

const db = admin.firestore();

// ── Roles allowed to approve/reject governance items ─────────────────────────
const GOVERNANCE_ROLES = new Set([
  'SUPER_ADMIN',
  'HOLDING_CEO',
  'HOLDING_CFO',
  'HOLDING_CSO',
]);

// ── Input schema ──────────────────────────────────────────────────────────────
const GovernanceActionSchema = z.object({
  itemId:     z.string().min(1).max(256),
  reason:     z.string().max(1000).optional(),
});

// ── Shared action handler ─────────────────────────────────────────────────────

async function processGovernanceAction(request, action) {
  // 1. Authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentification requise.');
  }

  const callerUid  = request.auth.uid;
  const callerRole = request.auth.token?.role;

  // 2. Rate limiting — max 20 governance actions per minute
  await checkCallRate(db, callerUid, 'governanceAction', { maxRequests: 20, windowMs: 60_000 });

  // 3. Role check — only HOLDING-level roles can approve/reject
  if (!GOVERNANCE_ROLES.has(callerRole)) {
    logger.warn(`[Governance] Unauthorized ${action} attempt by ${callerUid} (role: ${callerRole})`);
    throw new HttpsError(
      'permission-denied',
      `Seuls les rôles HOLDING_CEO, HOLDING_CFO, HOLDING_CSO, SUPER_ADMIN peuvent ${action === 'approved' ? 'approuver' : 'refuser'} une décision de gouvernance.`
    );
  }

  // 4. Input validation
  const parsed = GovernanceActionSchema.safeParse(request.data);
  if (!parsed.success) {
    throw new HttpsError('invalid-argument', parsed.error.message);
  }

  const { itemId, reason } = parsed.data;
  const ref = db.collection('intercompany_approvals').doc(itemId);

  // 5. Read current state — idempotency guard
  const snap = await ref.get();
  if (!snap.exists) {
    throw new HttpsError('not-found', `Décision introuvable : ${itemId}`);
  }

  const current = snap.data();
  if (current.status !== 'pending') {
    logger.info(`[Governance] Item ${itemId} already processed (${current.status}) — idempotent skip`);
    return { success: true, itemId, status: current.status, skipped: true };
  }

  // 6. Atomic write: update approval + audit log
  const batch = db.batch();
  const now   = admin.firestore.FieldValue.serverTimestamp();

  // 6a. Update the approval document
  const decisionFields = action === 'approved'
    ? { status: 'approved', approvedBy: callerUid, approvedByRole: callerRole, approvedAt: now }
    : { status: 'rejected', rejectedBy: callerUid, rejectedByRole: callerRole, rejectedAt: now };

  if (reason) decisionFields.reason = reason;

  batch.update(ref, {
    ...decisionFields,
    _processedAt: now,
    _processedBy: callerUid,
  });

  // 6b. Audit log (SIEM-compatible)
  const auditRef = db.collection('audit_logs').doc();
  batch.set(auditRef, {
    timestamp:   now,
    operation:   action === 'approved' ? 'GOVERNANCE_APPROVE' : 'GOVERNANCE_REJECT',
    collection:  'intercompany_approvals',
    docId:       itemId,
    changedBy:   callerUid,
    callerRole,
    summary:     `Décision ${action === 'approved' ? 'approuvée' : 'refusée'} : ${current.title || current.description || itemId}`,
    entity_id:   current.entity_id || null,
    itemType:    current.type      || null,
    reason:      reason            || null,
    oldStatus:   'pending',
    newStatus:   action,
  });

  await batch.commit();

  logger.info(`[Governance] ${action.toUpperCase()} — item ${itemId} by ${callerUid} (${callerRole})`);
  return { success: true, itemId, status: action };
}

// ── Exports ───────────────────────────────────────────────────────────────────

exports.approveGovernanceItem = onCall({
  region:          'europe-west1',
  maxInstances:    10,
  enforceAppCheck: true,
}, (request) => processGovernanceAction(request, 'approved'));

exports.rejectGovernanceItem = onCall({
  region:          'europe-west1',
  maxInstances:    10,
  enforceAppCheck: true,
}, (request) => processGovernanceAction(request, 'rejected'));
