/**
 * ══════════════════════════════════════════════════════════════
 * ACCOUNTING — Bank-grade ledger writes (CF-only)
 * ══════════════════════════════════════════════════════════════
 *
 * WHY: Before 2026-05-22 journal entries were written client-side
 * to /finance. That allowed any FINANCE/MANAGER role to fabricate or
 * alter ledger entries, and the "bank-grade" guarantee in the rules
 * comment was illusory. This function is the ONLY supported path
 * for committing journal entries to /accounting.
 *
 * Guarantees:
 *   1. Server-side balance validation (Σ débit = Σ crédit, ±0.01)
 *   2. Mandatory entity_id (rejected if missing or doesn't match claims)
 *   3. Period not locked (financial_periods/{period}.locked == true blocks)
 *   4. Append-only — no update / no delete via this CF
 *   5. Audit log written atomically with the entry
 *   6. Idempotency key (clientEntryId) prevents double-clicks/replays
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const { z } = require('zod');
const { checkCallRate } = require('./rate_limiter');

const db = admin.firestore();

const LineSchema = z.object({
  accountId:   z.string().min(1).max(64),
  accountCode: z.string().max(32).optional(),
  libelle:     z.string().max(255).optional(),
  debit:       z.number().nonnegative().default(0),
  credit:      z.number().nonnegative().default(0),
});

const EntrySchema = z.object({
  // Idempotency: same key → same result, no duplicate write
  clientEntryId: z.string().min(8).max(128),
  // Journal metadata
  piece:       z.string().min(1).max(64),       // numéro de pièce
  date:        z.string().min(8).max(32),       // YYYY-MM-DD
  libelle:     z.string().min(1).max(512),
  journal:     z.string().max(32).optional(),   // OD, VE, AC, etc.
  // Lines (at least 2: 1 débit + 1 crédit)
  lines:       z.array(LineSchema).min(2).max(200),
});

const ALLOWED_ROLES = new Set([
  'SUPER_ADMIN', 'HOLDING_CFO', 'HOLDING_CEO',
  'SUBSIDIARY_DG', 'SUBSIDIARY_CFO',
  'FINANCE', 'ADMIN', 'DIRECTOR', 'MANAGER',
]);

exports.postAccountingEntry = onCall({
  region: 'europe-west1',
  enforceAppCheck: true,
  maxInstances: 10,
}, async (request) => {
  // 1. Auth + RBAC
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentification requise.');
  }
  const callerRole = request.auth.token?.role;
  if (!ALLOWED_ROLES.has(callerRole)) {
    throw new HttpsError('permission-denied', `Rôle ${callerRole || 'inconnu'} non autorisé à comptabiliser.`);
  }

  // 2. Rate limit — protects against rogue scripts spamming the ledger
  await checkCallRate(db, request.auth.uid, 'postAccountingEntry', {
    maxRequests: 60,
    windowMs: 60_000,
  });

  // 3. Validate input
  let parsed;
  try {
    parsed = EntrySchema.parse(request.data);
  } catch (err) {
    throw new HttpsError('invalid-argument', `Données invalides: ${err.message}`);
  }

  // 4. Server-side balance check
  const totalDebit  = parsed.lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredit = parsed.lines.reduce((s, l) => s + (l.credit || 0), 0);
  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new HttpsError(
      'invalid-argument',
      `Écriture déséquilibrée : Débit ${totalDebit.toFixed(2)} ≠ Crédit ${totalCredit.toFixed(2)}`
    );
  }
  if (totalDebit <= 0) {
    throw new HttpsError('invalid-argument', "L'écriture doit avoir un montant > 0.");
  }

  // 5. Tenant context — must come from Custom Claims (not client-supplied)
  const entity_id   = request.auth.token?.entity_id   || null;
  const entity_type = request.auth.token?.entity_type || null;
  if (!entity_id) {
    throw new HttpsError(
      'failed-precondition',
      'entity_id absent des Custom Claims — impossible de comptabiliser.'
    );
  }

  // 6. Check the fiscal period is not locked
  const periodKey = parsed.date.slice(0, 7); // YYYY-MM
  const periodRef = db.collection('financial_periods').doc(`${entity_id}_${periodKey}`);
  const periodSnap = await periodRef.get();
  if (periodSnap.exists && periodSnap.data().locked === true) {
    throw new HttpsError(
      'failed-precondition',
      `La période ${periodKey} est clôturée et verrouillée.`
    );
  }

  // 7. Idempotency — clientEntryId already posted?
  const existingByKey = await db.collection('accounting')
    .where('entity_id', '==', entity_id)
    .where('clientEntryId', '==', parsed.clientEntryId)
    .where('subModule', '==', 'entries')
    .limit(1)
    .get();
  if (!existingByKey.empty) {
    const existing = existingByKey.docs[0];
    logger.info(`[postAccountingEntry] Idempotent replay for ${parsed.clientEntryId} → ${existing.id}`);
    return { success: true, entryId: existing.id, idempotent: true };
  }

  // 8. Commit atomically: entry + lines + audit log
  const now = admin.firestore.FieldValue.serverTimestamp();
  const entryRef = db.collection('accounting').doc();
  const auditRef = db.collection('audit_logs').doc();

  const meta = {
    entity_id, entity_type,
    createdBy:     request.auth.uid,
    createdByEmail: request.auth.token?.email || null,
    createdAt:     now,
  };

  const batch = db.batch();

  batch.set(entryRef, {
    ...meta,
    subModule:     'entries',
    clientEntryId: parsed.clientEntryId,
    piece:         parsed.piece,
    date:          parsed.date,
    libelle:       parsed.libelle,
    journal:       parsed.journal || 'OD',
    totalDebit, totalCredit,
    total:         totalDebit,
    balanced:      true,
  });

  parsed.lines.forEach((l, i) => {
    const lineRef = db.collection('accounting').doc();
    batch.set(lineRef, {
      ...meta,
      subModule:  'lines',
      entryId:    entryRef.id,
      accountId:  l.accountId,
      accountCode: l.accountCode || null,
      libelle:    l.libelle || parsed.libelle,
      debit:      l.debit || 0,
      credit:     l.credit || 0,
      lineNumber: i + 1,
    });
  });

  batch.set(auditRef, {
    ...meta,
    timestamp:  now,
    collection: 'accounting',
    docId:      entryRef.id,
    operation:  'POST_ACCOUNTING_ENTRY',
    summary:    `Écriture comptable ${parsed.piece} (${parsed.libelle}) — Débit ${totalDebit.toFixed(2)} = Crédit ${totalCredit.toFixed(2)}`,
    payload:    { piece: parsed.piece, journal: parsed.journal, date: parsed.date, total: totalDebit, lineCount: parsed.lines.length },
  });

  await batch.commit();

  logger.info(`[postAccountingEntry] ${entryRef.id} posted by ${request.auth.uid} (entity ${entity_id}) — ${parsed.lines.length} lines, total ${totalDebit}`);

  return {
    success: true,
    entryId: entryRef.id,
    totalDebit,
    totalCredit,
    lineCount: parsed.lines.length,
  };
});
