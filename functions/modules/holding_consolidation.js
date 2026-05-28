/**
 * ════════════════════════════════════════════════════════════════════════════
 * HOLDING CONSOLIDATION — Aggregate Group Metrics
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Populates `consolidated_reports/latest` in Firestore every 15 minutes.
 * This document is the single source of truth for HoldingCockpit KPIs.
 *
 * Data sources:
 *   - `subsidiary_reports/{entity_id}` — each subsidiary pushes its own metrics
 *     (CA, EBITDA, cash, headcount, score, trend) via their local Cloud Function
 *   - `intercompany_flows` — inter-entity transactions for elimination calculation
 *
 * Output (`consolidated_reports/latest`):
 * {
 *   revenue:         number,  // Sum of all subsidiary revenues
 *   ebitda:          number,  // Sum of all subsidiary EBITDAs
 *   cash:            number,  // Sum of all subsidiary cash positions
 *   headcount:       number,  // Total headcount across all entities
 *   subsidiaries:    number,  // Count of active subsidiaries
 *   eliminations:    number,  // Sum of intercompany revenues to eliminate
 *   opex:            number,  // Sum of all OpEx
 *   depreciation:    number,  // Sum of all amortissements
 *   financialCosts:  number,  // Sum of financial charges
 *   taxes:           number,  // Sum of IS
 *   netResult:       number,  // Résultat net consolidé
 *   subsidiaryPerf:  Array,   // Per-subsidiary detail for PerformanceTab
 *   _computedAt:     Timestamp,
 *   _version:        number,
 * }
 */

'use strict';

const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger }     = require('firebase-functions');
const admin          = require('firebase-admin');

const db = admin.firestore();

// ── Core aggregation logic (shared between scheduled and on-demand) ───────────

async function computeConsolidation() {
  // 1. Fetch all subsidiary_reports (one doc per active entity)
  const reportsSnap = await db.collection('subsidiary_reports')
    .where('active', '==', true)
    .get();

  let revenue         = 0;
  let ebitda          = 0;
  let cash            = 0;
  let headcount       = 0;
  let opex            = 0;
  let depreciation    = 0;
  let financialCosts  = 0;
  let taxes           = 0;
  const subsidiaryPerf = [];

  reportsSnap.docs.forEach(doc => {
    const d = doc.data();
    revenue        += d.revenue        || 0;
    ebitda         += d.ebitda         || 0;
    cash           += d.cash           || 0;
    headcount      += d.headcount      || 0;
    opex           += d.opex           || 0;
    depreciation   += d.depreciation   || 0;
    financialCosts += d.financialCosts || 0;
    taxes          += d.taxes          || 0;

    subsidiaryPerf.push({
      id:        doc.id,
      revenue:   d.revenue   || 0,
      ebitda:    d.ebitda    || 0,
      headcount: d.headcount || 0,
      growth:    d.growth    || 0,
      margin:    d.margin    || 0,
      score:     d.score     || 0,
      trend:     d.trend     || 'neutral',
    });
  });

  // 2. Fetch intercompany eliminations
  const icSnap = await db.collection('intercompany_flows')
    .where('status', '==', 'validated')
    .get();

  const eliminations = icSnap.docs.reduce((s, d) => s + (d.data().amount || 0), 0);

  // 3. Compute derived metrics
  const revenueNet = revenue - eliminations;
  const netResult  = ebitda - depreciation - financialCosts - taxes;

  return {
    revenue,
    ebitda,
    cash,
    headcount,
    subsidiaries:    subsidiaryPerf.length,
    eliminations,
    opex,
    depreciation,
    financialCosts,
    taxes,
    netResult,
    revenueNet,
    subsidiaryPerf,
  };
}

// ── Scheduled function — runs every 15 minutes ────────────────────────────────

exports.aggregateHoldingMetrics = onSchedule(
  {
    schedule:       '*/15 * * * *',   // every 15 min
    timeZone:       'Africa/Abidjan',
    region:         'europe-west1',
    memory:         '256MiB',
    timeoutSeconds: 120,
  },
  async () => {
    logger.info('[Consolidation] Starting 15-min holding aggregation…');

    try {
      const metrics = await computeConsolidation();

      await db.collection('consolidated_reports').doc('latest').set({
        ...metrics,
        _computedAt: admin.firestore.FieldValue.serverTimestamp(),
        _version:    admin.firestore.FieldValue.increment(1),
        _trigger:    'scheduled',
      }, { merge: true });

      logger.info(
        `[Consolidation] Done — CA: ${metrics.revenue}, Headcount: ${metrics.headcount}, `
        + `Filiales: ${metrics.subsidiaries}`
      );
    } catch (err) {
      logger.error('[Consolidation] Aggregation failed:', err.message);
    }
  }
);

// ── On-demand trigger — called by SUPER_ADMIN to force refresh ────────────────

exports.triggerConsolidationRefresh = onCall(
  {
    region:          'europe-west1',
    maxInstances:    2,
    enforceAppCheck: true,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentification requise.');
    }

    const callerRole = request.auth.token?.role;
    const ALLOWED = new Set(['SUPER_ADMIN', 'HOLDING_CEO', 'HOLDING_CFO']);

    if (!ALLOWED.has(callerRole)) {
      throw new HttpsError('permission-denied', 'Réservé aux rôles HOLDING C-Level.');
    }

    logger.info(`[Consolidation] Manual refresh triggered by ${request.auth.uid} (${callerRole})`);

    const metrics = await computeConsolidation();

    await db.collection('consolidated_reports').doc('latest').set({
      ...metrics,
      _computedAt: admin.firestore.FieldValue.serverTimestamp(),
      _version:    admin.firestore.FieldValue.increment(1),
      _trigger:    'manual',
      _triggeredBy: request.auth.uid,
    }, { merge: true });

    return { success: true, subsidiaries: metrics.subsidiaries };
  }
);
