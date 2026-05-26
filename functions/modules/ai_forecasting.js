/**
 * ══════════════════════════════════════════════════════════════════
 * AI FORECASTING — Prévisions intelligentes (Gemini 1.5 Flash)
 * IPC Intelligence Engine
 * ══════════════════════════════════════════════════════════════════
 *
 * Modules :
 *   1. forecastSalesRevenue   — Prévision CA 30/60/90 jours (série temporelle)
 *   2. forecastStockDepletion — Date d'épuisement des stocks critiques
 *   3. forecastChurnRisk      — Score de risque désabonnement client (0-100)
 *   4. forecastCashFlow       — Trésorerie prévisionnelle 90 jours
 *
 * Modèle : Gemini 1.5 Flash (google-ai-generativelanguage)
 * Fallback : régression linéaire locale si Gemini indisponible
 *
 * Exécution :
 *   - forecastSalesRevenue   → hebdomadaire (lundi 06:00 UTC)
 *   - forecastStockDepletion → quotidien (03:00 UTC)
 *   - forecastChurnRisk      → hebdomadaire (dimanche 04:00 UTC)
 *   - forecastCashFlow       → quotidien (04:00 UTC)
 *   - Tous disponibles via onCall pour calcul à la demande
 */

const { onSchedule }          = require('firebase-functions/v2/scheduler');
const { onCall, HttpsError }  = require('firebase-functions/v2/https');
const admin                   = require('firebase-admin');
const { logger }              = require('firebase-functions');

const db = admin.firestore();

// ── Gemini client ─────────────────────────────────────────────────────────────
let _genAI = null;

const getGenAI = () => {
  if (_genAI) return _genAI;
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
    _genAI = new GoogleGenerativeAI(apiKey);
    return _genAI;
  } catch (err) {
    logger.warn('[AIForecasting] Gemini unavailable:', err.message);
    return null;
  }
};

const callGemini = async (prompt, maxTokens = 1024) => {
  const genAI = getGenAI();
  if (!genAI) return null;

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature:     0.1,    // low temp pour des prévisions stables
      responseMimeType: 'application/json',
    },
  });

  const text = result.response.text();
  return JSON.parse(text);
};

// ── Fallback : régression linéaire simple ─────────────────────────────────────
const linearRegression = (xyPairs) => {
  const n  = xyPairs.length;
  if (n < 2) return { slope: 0, intercept: xyPairs[0]?.[1] || 0 };

  const sumX  = xyPairs.reduce((s, [x]) => s + x, 0);
  const sumY  = xyPairs.reduce((s, [, y]) => s + y, 0);
  const sumXY = xyPairs.reduce((s, [x, y]) => s + x * y, 0);
  const sumX2 = xyPairs.reduce((s, [x]) => s + x * x, 0);

  const slope     = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
};

const predictLinear = (regression, x) =>
  Math.max(0, regression.slope * x + regression.intercept);

// ── CHECK 1 : Sales Revenue Forecast ─────────────────────────────────────────
const runSalesForecast = async (entity_id) => {
  // Récupérer les 12 dernières semaines de CA
  const since = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() - 84 * 24 * 60 * 60 * 1000)  // 12 semaines
  );

  const snap = await db.collection('finance')
    .doc(entity_id)
    .collection('invoices')
    .where('status',    '==', 'paid')
    .where('paidAt',    '>=', since)
    .select('total', 'paidAt')
    .get();

  if (snap.empty) return null;

  // Agréger par semaine
  const weekly = {};
  snap.docs.forEach(doc => {
    const { total, paidAt } = doc.data();
    const weekKey = Math.floor(
      (paidAt.toDate() - new Date(Date.now() - 84 * 24 * 60 * 60 * 1000)) / (7 * 24 * 60 * 60 * 1000)
    );
    weekly[weekKey] = (weekly[weekKey] || 0) + (total || 0);
  });

  const series = Object.entries(weekly)
    .sort(([a], [b]) => a - b)
    .map(([w, rev]) => [Number(w), rev]);

  // Tenter Gemini
  try {
    const geminiResult = await callGemini(`
      Tu es un expert en analyse financière. Voici les revenus hebdomadaires des 12 dernières semaines (en EUR) pour une entreprise :
      ${series.map(([w, r]) => `Semaine ${w}: ${r.toFixed(2)} EUR`).join('\n')}

      Génère une prévision pour les 4, 8 et 12 prochaines semaines.
      Inclus aussi un intervalle de confiance (±%) et une tendance (HAUSSE/BAISSE/STABLE).

      Réponds UNIQUEMENT en JSON avec ce format exact :
      {
        "forecast_4w": <number>,
        "forecast_8w": <number>,
        "forecast_12w": <number>,
        "confidence_pct": <number 0-100>,
        "trend": "HAUSSE" | "BAISSE" | "STABLE",
        "reasoning": "<string max 200 chars>"
      }
    `);

    if (geminiResult) {
      return { ...geminiResult, method: 'gemini', series_weeks: series.length };
    }
  } catch (err) {
    logger.warn('[AIForecasting] Gemini sales forecast failed:', err.message);
  }

  // Fallback linéaire
  const reg = linearRegression(series);
  const lastWeek = series[series.length - 1][0];
  return {
    forecast_4w:      Math.round(predictLinear(reg, lastWeek + 4)),
    forecast_8w:      Math.round(predictLinear(reg, lastWeek + 8)),
    forecast_12w:     Math.round(predictLinear(reg, lastWeek + 12)),
    confidence_pct:   60,
    trend:            reg.slope > 50 ? 'HAUSSE' : reg.slope < -50 ? 'BAISSE' : 'STABLE',
    reasoning:        'Régression linéaire sur 12 semaines (Gemini indisponible)',
    method:           'linear_regression',
    series_weeks:     series.length,
  };
};

// ── CHECK 2 : Stock Depletion Forecast ────────────────────────────────────────
const runStockForecast = async (entity_id) => {
  const snap = await db.collection('inventory')
    .where('entity_id', '==', entity_id)
    .where('quantity',  '<=', 100)  // focus sur les stocks faibles
    .select('name', 'quantity', 'reorder_point', 'avg_daily_consumption')
    .limit(50)
    .get();

  if (snap.empty) return { alerts: [] };

  const alerts = [];

  snap.docs.forEach(doc => {
    const { name, quantity, reorder_point, avg_daily_consumption } = doc.data();
    const qty       = Number(quantity            || 0);
    const dailyRate = Number(avg_daily_consumption || 1);
    const reorder   = Number(reorder_point        || 10);

    if (dailyRate <= 0) return;

    const daysUntilEmpty   = Math.floor(qty / dailyRate);
    const daysUntilReorder = Math.floor((qty - reorder) / dailyRate);

    if (daysUntilEmpty <= 30) {
      alerts.push({
        id:                doc.id,
        name:              name || doc.id,
        quantity:          qty,
        daysUntilEmpty,
        daysUntilReorder:  Math.max(0, daysUntilReorder),
        severity:          daysUntilEmpty <= 7 ? 'CRITICAL' : daysUntilEmpty <= 14 ? 'HIGH' : 'MEDIUM',
        estimatedEmptyDate: new Date(Date.now() + daysUntilEmpty * 86400000).toISOString().slice(0, 10),
      });
    }
  });

  return {
    alerts: alerts.sort((a, b) => a.daysUntilEmpty - b.daysUntilEmpty),
    criticalCount: alerts.filter(a => a.severity === 'CRITICAL').length,
  };
};

// ── CHECK 3 : Churn Risk Scoring ──────────────────────────────────────────────
const runChurnRiskScoring = async (entity_id) => {
  const thirtyDaysAgo = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );
  const ninetyDaysAgo = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  );

  const clientsSnap = await db.collection('crm')
    .where('entity_id', '==', entity_id)
    .where('type', '==', 'client')
    .select('id', 'nom', 'email', 'rfm_recency', 'rfm_frequency', 'rfm_monetary', 'lastActivity')
    .limit(200)
    .get();

  const atRisk = [];

  clientsSnap.docs.forEach(doc => {
    const d = doc.data();

    // Score de risque basé sur RFM
    const recencyScore    = 100 - Math.min(100, (d.rfm_recency   || 90));
    const frequencyScore  = Math.min(100, (d.rfm_frequency || 0) * 10);
    const monetaryScore   = Math.min(100, Math.log10((d.rfm_monetary || 1) + 1) * 25);

    const churnRisk = Math.round(
      (100 - recencyScore)  * 0.5 +
      (100 - frequencyScore)* 0.3 +
      (100 - monetaryScore) * 0.2
    );

    if (churnRisk >= 60) {
      atRisk.push({
        id:        doc.id,
        nom:       d.nom,
        churnRisk,
        rfm: {
          recency:   d.rfm_recency,
          frequency: d.rfm_frequency,
          monetary:  d.rfm_monetary,
        },
        recommendation:
          churnRisk >= 85 ? 'Action urgente : appel commercial immédiat' :
          churnRisk >= 70 ? 'Envoyer une offre de rétention personnalisée' :
                            'Planifier une relance email dans les 7 jours',
      });
    }
  });

  return {
    atRiskClients:   atRisk.sort((a, b) => b.churnRisk - a.churnRisk).slice(0, 50),
    highRiskCount:   atRisk.filter(c => c.churnRisk >= 85).length,
    mediumRiskCount: atRisk.filter(c => c.churnRisk >= 70 && c.churnRisk < 85).length,
  };
};

// ── CHECK 4 : Cash Flow Forecast (90 jours) ───────────────────────────────────
const runCashFlowForecast = async (entity_id) => {
  const thirtyDaysAgo = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );

  const [receivables, payables] = await Promise.all([
    db.collection('finance').doc(entity_id).collection('invoices')
      .where('status', 'in', ['unpaid', 'overdue'])
      .select('total', 'dueDate')
      .get(),
    db.collection('finance').doc(entity_id).collection('purchase_orders')
      .where('status', 'in', ['pending', 'approved'])
      .select('total', 'dueDate')
      .get(),
  ]);

  // Regrouper par période de 30 jours
  const forecast = { d30: 0, d60: 0, d90: 0 };
  const now = Date.now();

  receivables.docs.forEach(doc => {
    const { total, dueDate } = doc.data();
    if (!dueDate) return;
    const daysUntilDue = (dueDate.toDate() - now) / 86400000;
    const amount = Number(total || 0);
    if (daysUntilDue <= 30)       forecast.d30 += amount;
    else if (daysUntilDue <= 60)  forecast.d60 += amount;
    else if (daysUntilDue <= 90)  forecast.d90 += amount;
  });

  const outflows = { d30: 0, d60: 0, d90: 0 };
  payables.docs.forEach(doc => {
    const { total, dueDate } = doc.data();
    if (!dueDate) return;
    const daysUntilDue = (dueDate.toDate() - now) / 86400000;
    const amount = Number(total || 0);
    if (daysUntilDue <= 30)       outflows.d30 += amount;
    else if (daysUntilDue <= 60)  outflows.d60 += amount;
    else if (daysUntilDue <= 90)  outflows.d90 += amount;
  });

  return {
    inflows:   { d30: Math.round(forecast.d30), d60: Math.round(forecast.d60), d90: Math.round(forecast.d90) },
    outflows:  { d30: Math.round(outflows.d30), d60: Math.round(outflows.d60), d90: Math.round(outflows.d90) },
    netCashFlow: {
      d30: Math.round(forecast.d30 - outflows.d30),
      d60: Math.round(forecast.d60 - outflows.d60),
      d90: Math.round(forecast.d90 - outflows.d90),
    },
    totalReceivables:  Math.round(Object.values(forecast).reduce((s, v) => s + v, 0)),
    totalPayables:     Math.round(Object.values(outflows).reduce((s, v) => s + v, 0)),
    generatedAt:       new Date().toISOString(),
  };
};

// ── Scheduled exports ─────────────────────────────────────────────────────────

exports.forecastSalesRevenue = onSchedule(
  { schedule: '0 6 * * 1', timeZone: 'UTC', region: 'europe-west1', memory: '512MiB', timeoutSeconds: 300 },
  async () => {
    logger.info('[AIForecasting] Weekly sales revenue forecast starting...');
    const entities = await db.collection('entities').select().get();

    for (const entity of entities.docs) {
      try {
        const forecast = await runSalesForecast(entity.id);
        if (forecast) {
          await db.collection('ai_forecasts').doc(`${entity.id}_sales`).set({
            entity_id:   entity.id,
            type:        'SALES_REVENUE',
            ...forecast,
            generatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      } catch (err) {
        logger.error(`[AIForecasting] Sales forecast failed for ${entity.id}:`, err.message);
      }
    }
  }
);

exports.forecastStockDepletion = onSchedule(
  { schedule: '0 3 * * *', timeZone: 'UTC', region: 'europe-west1', memory: '256MiB', timeoutSeconds: 300 },
  async () => {
    const entities = await db.collection('entities').select().get();
    for (const entity of entities.docs) {
      try {
        const result = await runStockForecast(entity.id);
        await db.collection('ai_forecasts').doc(`${entity.id}_stock`).set({
          entity_id:   entity.id,
          type:        'STOCK_DEPLETION',
          ...result,
          generatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (err) {
        logger.error(`[AIForecasting] Stock forecast failed for ${entity.id}:`, err.message);
      }
    }
  }
);

exports.forecastCashFlow = onSchedule(
  { schedule: '0 4 * * *', timeZone: 'UTC', region: 'europe-west1', memory: '256MiB', timeoutSeconds: 300 },
  async () => {
    const entities = await db.collection('entities').select().get();
    for (const entity of entities.docs) {
      try {
        const result = await runCashFlowForecast(entity.id);
        await db.collection('ai_forecasts').doc(`${entity.id}_cashflow`).set({
          entity_id:   entity.id,
          type:        'CASH_FLOW',
          ...result,
          generatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (err) {
        logger.error(`[AIForecasting] Cash flow forecast failed for ${entity.id}:`, err.message);
      }
    }
  }
);

// ── onCall : calcul à la demande ──────────────────────────────────────────────
exports.computeForecastNow = onCall(
  { region: 'europe-west1', memory: '512MiB', timeoutSeconds: 120 },
  async (request) => {
    const role      = request.auth?.token?.role;
    const entity_id = request.auth?.token?.entity_id;

    if (!['SUPER_ADMIN', 'ADMIN', 'HOLDING_ADMIN', 'HOLDING_FINANCE', 'FINANCE'].includes(role)) {
      throw new HttpsError('permission-denied', 'Accès refusé');
    }

    const { type } = request.data || {};

    switch (type) {
      case 'SALES':     return await runSalesForecast(entity_id);
      case 'STOCK':     return await runStockForecast(entity_id);
      case 'CHURN':     return await runChurnRiskScoring(entity_id);
      case 'CASHFLOW':  return await runCashFlowForecast(entity_id);
      default:
        throw new HttpsError('invalid-argument', 'type must be: SALES | STOCK | CHURN | CASHFLOW');
    }
  }
);
