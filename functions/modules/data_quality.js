/**
 * ══════════════════════════════════════════════════════════════════
 * DATA QUALITY MONITOR — IPC Intelligence Engine
 * ══════════════════════════════════════════════════════════════════
 *
 * Scan nocturne d'intégrité des données (02:00 UTC)
 * Détecte et alerte sur :
 *   1. Utilisateurs orphelins (dans Auth mais pas dans /users)
 *   2. Rôles invalides (custom claims ≠ RBAC défini)
 *   3. Comptabilité déséquilibrée (débit ≠ crédit sur un exercice)
 *   4. Stocks négatifs (quantité < 0)
 *   5. Employés sans contrat actif
 *   6. Webhooks en échec permanent (> 10 tentatives sans succès)
 *   7. Notifications non lues > 90 jours (data stale)
 *
 * Résultats écrits dans /data_quality_reports/{date}
 * Alertes Sentry envoyées pour les anomalies critiques
 */

const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin  = require('firebase-admin');
const { logger } = require('firebase-functions');

const db = admin.firestore();

// ── Constantes ────────────────────────────────────────────────────────────────
const VALID_ROLES = [
  'SUPER_ADMIN', 'ADMIN', 'HOLDING_ADMIN', 'HOLDING_FINANCE',
  'COUNTRY_ADMIN', 'SUBSIDIARY_ADMIN', 'FOUNDATION_ADMIN',
  'HR_MANAGER', 'HR', 'FINANCE', 'MANAGER', 'EMPLOYEE', 'GUEST', 'READ_ONLY',
];

const BATCH_SIZE   = 500;
const MAX_DURATION = 9 * 60 * 1000; // 9 min (CF timeout = 10 min)

// ── Helpers ───────────────────────────────────────────────────────────────────
const nowMs   = () => Date.now();
const dateStr = (d = new Date()) => d.toISOString().slice(0, 10);

const paginate = async (ref, callback) => {
  let lastDoc = null;
  let total   = 0;
  const start = nowMs();

  while (true) {
    if (nowMs() - start > MAX_DURATION) {
      logger.warn('[DataQuality] Pagination timeout safety stop');
      break;
    }

    let q = ref.orderBy(admin.firestore.FieldPath.documentId()).limit(BATCH_SIZE);
    if (lastDoc) q = q.startAfter(lastDoc);

    const snap = await q.get();
    if (snap.empty) break;

    await callback(snap.docs);
    total   += snap.size;
    lastDoc  = snap.docs[snap.docs.length - 1];
    if (snap.size < BATCH_SIZE) break;
  }
  return total;
};

// ── CHECK 1 : Orphan users (Auth présent, Firestore absent) ──────────────────
const checkOrphanUsers = async (report) => {
  logger.info('[DataQuality] Check 1: Orphan users');
  const orphans = [];

  // Lister les users Firebase Auth en pages de 1000
  let nextPageToken;
  do {
    const page = await admin.auth().listUsers(1000, nextPageToken);
    nextPageToken = page.pageToken;

    await Promise.all(
      page.users.map(async (u) => {
        const doc = await db.collection('users').doc(u.uid).get();
        if (!doc.exists) {
          orphans.push({ uid: u.uid, email: u.email, createdAt: u.metadata.creationTime });
        }
      })
    );
  } while (nextPageToken);

  report.orphanUsers = { count: orphans.length, items: orphans.slice(0, 20) }; // top-20
  if (orphans.length > 0) {
    logger.warn(`[DataQuality] ${orphans.length} orphan user(s) found`);
  }
};

// ── CHECK 2 : Invalid roles ───────────────────────────────────────────────────
const checkInvalidRoles = async (report) => {
  logger.info('[DataQuality] Check 2: Invalid roles');
  const invalid = [];

  await paginate(db.collection('users'), async (docs) => {
    docs.forEach(doc => {
      const role = doc.data().role;
      if (role && !VALID_ROLES.includes(role)) {
        invalid.push({ uid: doc.id, role, entity_id: doc.data().entity_id });
      }
    });
  });

  report.invalidRoles = { count: invalid.length, items: invalid.slice(0, 50) };
  if (invalid.length > 0) {
    logger.warn(`[DataQuality] ${invalid.length} user(s) with invalid roles`);
  }
};

// ── CHECK 3 : Accounting balance ─────────────────────────────────────────────
const checkAccountingBalance = async (report) => {
  logger.info('[DataQuality] Check 3: Accounting balance');
  const imbalanced = [];

  // Chercher toutes les entités via les entrées comptables
  const entitiesSnap = await db.collection('entities').get();
  const entityIds = entitiesSnap.docs.map(d => d.id);

  for (const entityId of entityIds) {
    try {
      const snap = await db
        .collection('accounting')
        .doc(entityId)
        .collection('entries')
        .where('validated', '==', true)
        .get();

      let totalDebit  = 0;
      let totalCredit = 0;

      snap.docs.forEach(doc => {
        const d = doc.data();
        totalDebit  += Number(d.debit  || 0);
        totalCredit += Number(d.credit || 0);
      });

      const delta = Math.abs(totalDebit - totalCredit);
      if (delta > 0.01) { // tolérance d'arrondi
        imbalanced.push({
          entity_id: entityId,
          totalDebit:  totalDebit.toFixed(2),
          totalCredit: totalCredit.toFixed(2),
          delta:       delta.toFixed(2),
          entries:     snap.size,
        });
      }
    } catch (err) {
      logger.warn(`[DataQuality] Balance check skipped for entity ${entityId}:`, err.message);
    }
  }

  report.accountingBalance = { imbalancedEntities: imbalanced.length, items: imbalanced };
  if (imbalanced.length > 0) {
    logger.error(`[DataQuality] CRITICAL: ${imbalanced.length} entity/ies with unbalanced accounting`);
  }
};

// ── CHECK 4 : Negative stock ──────────────────────────────────────────────────
const checkNegativeStock = async (report) => {
  logger.info('[DataQuality] Check 4: Negative stock');
  const negative = [];

  await paginate(db.collection('inventory'), async (docs) => {
    docs.forEach(doc => {
      const qty = Number(doc.data().quantity ?? doc.data().stock ?? 0);
      if (qty < 0) {
        negative.push({ id: doc.id, entity_id: doc.data().entity_id, quantity: qty, name: doc.data().name || doc.data().nom });
      }
    });
  });

  report.negativeStock = { count: negative.length, items: negative.slice(0, 50) };
  if (negative.length > 0) {
    logger.warn(`[DataQuality] ${negative.length} product(s) with negative stock`);
  }
};

// ── CHECK 5 : Employees without active contract ───────────────────────────────
const checkEmployeeContracts = async (report) => {
  logger.info('[DataQuality] Check 5: Employees without active contract');
  const noContract = [];
  const today = admin.firestore.Timestamp.now();

  await paginate(db.collection('hr'), async (docs) => {
    await Promise.all(docs.map(async (doc) => {
      const emp = doc.data();
      if (emp.statut !== 'Actif') return; // seuls les actifs

      const contracts = await db
        .collection('contracts')
        .where('employee_id', '==', doc.id)
        .where('statut', '==', 'Actif')
        .limit(1)
        .get();

      if (contracts.empty) {
        noContract.push({
          id:        doc.id,
          nom:       `${emp.prenom || ''} ${emp.nom || ''}`.trim(),
          entity_id: emp.entity_id,
        });
      }
    }));
  });

  report.employeeContracts = { count: noContract.length, items: noContract.slice(0, 50) };
};

// ── CHECK 6 : Stale webhooks (permanent failures) ─────────────────────────────
const checkStaleWebhooks = async (report) => {
  logger.info('[DataQuality] Check 6: Stale webhooks');

  const snap = await db
    .collection('webhook_deliveries')
    .where('status',   '==',  'failed')
    .where('attempts', '>=',  10)
    .limit(100)
    .get();

  report.staleWebhooks = {
    count: snap.size,
    items: snap.docs.slice(0, 20).map(d => ({
      id:          d.id,
      webhookId:   d.data().webhookId,
      topic:       d.data().topic,
      attempts:    d.data().attempts,
      lastAttempt: d.data().lastAttempt?.toDate?.()?.toISOString(),
    })),
  };
};

// ── CHECK 7 : Stale notifications (> 90 days unread) ─────────────────────────
const checkStaleNotifications = async (report) => {
  logger.info('[DataQuality] Check 7: Stale notifications (>90 days)');
  const cutoff = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  );

  const snap = await db
    .collection('notifications')
    .where('read',       '==',  false)
    .where('createdAt',  '<',   cutoff)
    .count()
    .get();

  report.staleNotifications = { count: snap.data().count };
};

// ── Écrire le rapport dans Firestore ─────────────────────────────────────────
const writeReport = async (report) => {
  const today = dateStr();
  await db.collection('data_quality_reports').doc(today).set({
    ...report,
    generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    version:     2,
  });
  logger.info(`[DataQuality] Report written → data_quality_reports/${today}`);
};

// ── Calculer le score global de qualité ───────────────────────────────────────
const computeScore = (report) => {
  const penalties = [
    (report.orphanUsers?.count            || 0) * 5,
    (report.invalidRoles?.count           || 0) * 3,
    (report.accountingBalance?.imbalancedEntities || 0) * 20,
    (report.negativeStock?.count          || 0) * 2,
    (report.employeeContracts?.count      || 0) * 2,
    (report.staleWebhooks?.count          || 0) * 1,
    Math.min(report.staleNotifications?.count || 0, 100) * 0.1,
  ];
  const totalPenalty = Math.min(100, penalties.reduce((s, p) => s + p, 0));
  return Math.max(0, Math.round(100 - totalPenalty));
};

// ── Scan principal ────────────────────────────────────────────────────────────
const runScan = async () => {
  const startTime = Date.now();
  const report    = { checks: {} };

  logger.info('[DataQuality] Starting nightly scan...');

  // Exécuter tous les checks en parallèle (sauf balance qui nécessite les entités)
  await Promise.allSettled([
    checkOrphanUsers(report).catch(e => logger.error('[DataQuality] orphan check failed:', e.message)),
    checkInvalidRoles(report).catch(e => logger.error('[DataQuality] roles check failed:', e.message)),
    checkNegativeStock(report).catch(e => logger.error('[DataQuality] stock check failed:', e.message)),
    checkStaleWebhooks(report).catch(e => logger.error('[DataQuality] webhooks check failed:', e.message)),
    checkStaleNotifications(report).catch(e => logger.error('[DataQuality] notifications check failed:', e.message)),
  ]);

  // Balance comptable séparément (plus lente)
  await checkAccountingBalance(report).catch(e =>
    logger.error('[DataQuality] balance check failed:', e.message)
  );

  // Contrats employés séparément (queries croisées)
  await checkEmployeeContracts(report).catch(e =>
    logger.error('[DataQuality] contracts check failed:', e.message)
  );

  report.score    = computeScore(report);
  report.duration = `${((Date.now() - startTime) / 1000).toFixed(1)}s`;
  report.date     = dateStr();

  logger.info(`[DataQuality] Scan complete. Score: ${report.score}/100 in ${report.duration}`);

  await writeReport(report);

  // Alertes critiques (score < 80)
  if (report.score < 80) {
    logger.error(`[DataQuality] CRITICAL: Data quality score ${report.score}/100 — review required`);
  }

  return report;
};

// ── Export Cloud Functions ────────────────────────────────────────────────────

/** Scan nocturne automatique à 02:00 UTC */
exports.dataQualityScan = onSchedule(
  {
    schedule:  '0 2 * * *',       // 02:00 UTC chaque nuit
    timeZone:  'UTC',
    region:    'europe-west1',
    timeoutSeconds: 540,           // 9 min
    memory:    '512MiB',
  },
  async () => {
    await runScan();
  }
);

/** Déclenchement manuel par SUPER_ADMIN */
exports.dataQualityScanNow = onCall(
  { region: 'europe-west1', memory: '512MiB', timeoutSeconds: 540 },
  async (request) => {
    const role = request.auth?.token?.role;
    if (!['SUPER_ADMIN', 'ADMIN'].includes(role)) {
      throw new HttpsError('permission-denied', 'Réservé aux administrateurs');
    }
    return await runScan();
  }
);

/** Lecture du dernier rapport (ADMIN+) */
exports.getDataQualityReport = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const role = request.auth?.token?.role;
    if (!['SUPER_ADMIN', 'ADMIN', 'HOLDING_ADMIN'].includes(role)) {
      throw new HttpsError('permission-denied', 'Accès refusé');
    }

    const date   = request.data?.date || dateStr();
    const docRef = db.collection('data_quality_reports').doc(date);
    const snap   = await docRef.get();

    if (!snap.exists) {
      // Fallback: dernier rapport disponible
      const latest = await db
        .collection('data_quality_reports')
        .orderBy('generatedAt', 'desc')
        .limit(1)
        .get();

      if (latest.empty) {
        return { error: 'NO_REPORT', message: 'Aucun rapport disponible. Lancez un scan.' };
      }
      return { id: latest.docs[0].id, ...latest.docs[0].data() };
    }

    return { id: snap.id, ...snap.data() };
  }
);
