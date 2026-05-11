/**
 * ════════════════════════════════════════════════════════════════
 *  MONTE CARLO ENGINE — Nexus OS / IPC Green Blocks
 *
 *  Algorithmes :
 *    triangular(min, mode, max)   — générateur de variates
 *    computeMonth(vars)           — modèle financier mensuel
 *    runMonteCarlo(vars, N)       — N simulations → distribution
 *    buildProjection(vars)        — 12 mois × 3 scénarios
 *    sensitivityAnalysis(vars)    — impact ±5% par variable
 *    riskScore(p50NetProfit, rev) — jauge 0-100
 *
 *  Hypothèses IPC Green Blocks (ajustables via sliders) :
 *    Bloc = 0.60 kg ciment + 1.40 kg agrégats recyclés
 *    IS = 25% (taux Côte d'Ivoire)
 *    Overhead fixe = 20% du chiffre d'affaires base
 * ════════════════════════════════════════════════════════════════
 */

// ── Paramètres physiques du produit ──────────────────────────────
const CEMENT_KG_PER_UNIT   = 0.60;   // kg de ciment par bloc
const AGGRGT_KG_PER_UNIT   = 1.40;   // kg d'agrégats par bloc
const TAX_RATE             = 0.25;   // IS Côte d'Ivoire
const OVERHEAD_BASE_RATIO  = 0.12;   // frais généraux fixes (% CA base)
const MONTHS               = 12;
const SEASONAL = [
  1.00, 0.95, 1.02, 1.05, 1.08, 1.10,  // J-F-M-A-M-J
  0.98, 0.92, 1.03, 1.06, 1.09, 1.12,  // Jl-A-S-O-N-D
];

// ─────────────────────────────────────────────────────────────────
// 1. DISTRIBUTION TRIANGULAIRE
// ─────────────────────────────────────────────────────────────────

export function triangular(min, mode, max) {
  if (min >= max) return mode;
  const u  = Math.random();
  const fc = (mode - min) / (max - min);
  return u < fc
    ? min + Math.sqrt(u * (max - min) * (mode - min))
    : max - Math.sqrt((1 - u) * (max - min) * (max - mode));
}

// ─────────────────────────────────────────────────────────────────
// 2. MODÈLE FINANCIER MENSUEL
// ─────────────────────────────────────────────────────────────────

export function computeMonth(vars, monthIndex = 0) {
  const seasonal       = SEASONAL[monthIndex % 12];
  const effectiveVol   = vars.orderVolume * (vars.productionCapacity / 100) * seasonal;

  // Chiffre d'affaires
  const revenue        = effectiveVol * vars.unitPrice;

  // Coût matières premières
  const cimentTons     = (effectiveVol * CEMENT_KG_PER_UNIT) / 1000;
  const aggregatTons   = (effectiveVol * AGGRGT_KG_PER_UNIT) / 1000;
  const materialCost   = cimentTons * vars.cimentCostPerTon
                       + aggregatTons * vars.aggregatCostPerTon;

  // Marge brute
  const grossMargin    = revenue - materialCost;
  const grossMarginPct = revenue > 0 ? (grossMargin / revenue) * 100 : 0;

  // OPEX (masse salariale indexée inflation + marketing + overhead)
  const inflFactor     = 1 + (vars.inflationRate / 100) * (monthIndex / 12);
  const payrollAdj     = vars.payroll * inflFactor;
  const overhead       = revenue * OVERHEAD_BASE_RATIO;
  const opex           = payrollAdj + vars.marketingBudget + overhead;

  // EBIT & net
  const ebit           = grossMargin - opex;
  const tax            = ebit > 0 ? ebit * TAX_RATE : 0;
  const netProfit      = ebit - tax;
  const netMargin      = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  // Point mort mensuel (unités pour EBIT = 0)
  const unitContrib    = vars.unitPrice
    - (CEMENT_KG_PER_UNIT / 1000) * vars.cimentCostPerTon
    - (AGGRGT_KG_PER_UNIT / 1000) * vars.aggregatCostPerTon;
  const breakEven      = unitContrib > 0 ? opex / unitContrib : Infinity;

  return {
    revenue, materialCost, grossMargin, grossMarginPct,
    opex, ebit, netProfit, netMargin, breakEven, effectiveVol,
  };
}

// ─────────────────────────────────────────────────────────────────
// 3. PROJECTION 12 MOIS (3 SCÉNARIOS DÉTERMINISTES)
// ─────────────────────────────────────────────────────────────────

function scenarioVars(base, type) {
  const deltas = {
    pessimistic: {
      cimentCostPerTon:   1.20,
      aggregatCostPerTon: 1.20,
      inflationRate:      2.0,     // multiplicateur additif
      productionCapacity: 0.75,
      payroll:            1.10,
      marketingBudget:    0.70,
      unitPrice:          0.92,
      orderVolume:        0.80,
    },
    realistic: {
      cimentCostPerTon:   1.00,
      aggregatCostPerTon: 1.00,
      inflationRate:      1.0,
      productionCapacity: 1.00,
      payroll:            1.00,
      marketingBudget:    1.00,
      unitPrice:          1.00,
      orderVolume:        1.00,
    },
    optimistic: {
      cimentCostPerTon:   0.85,
      aggregatCostPerTon: 0.88,
      inflationRate:      0.5,
      productionCapacity: 1.15,
      payroll:            1.00,
      marketingBudget:    1.20,
      unitPrice:          1.06,
      orderVolume:        1.18,
    },
  };
  const d = deltas[type];
  return {
    ...base,
    cimentCostPerTon:   base.cimentCostPerTon   * d.cimentCostPerTon,
    aggregatCostPerTon: base.aggregatCostPerTon  * d.aggregatCostPerTon,
    inflationRate:      base.inflationRate       * d.inflationRate,
    productionCapacity: Math.min(100, base.productionCapacity * d.productionCapacity),
    payroll:            base.payroll             * d.payroll,
    marketingBudget:    base.marketingBudget     * d.marketingBudget,
    unitPrice:          base.unitPrice           * d.unitPrice,
    orderVolume:        base.orderVolume         * d.orderVolume,
  };
}

export function buildProjection(baseVars) {
  const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Juil','Aoû','Sep','Oct','Nov','Déc'];
  const pVars = scenarioVars(baseVars, 'pessimistic');
  const rVars = scenarioVars(baseVars, 'realistic');
  const oVars = scenarioVars(baseVars, 'optimistic');

  return MOIS.map((mois, i) => {
    const p = computeMonth(pVars, i);
    const r = computeMonth(rVars, i);
    const o = computeMonth(oVars, i);
    return {
      mois,
      revenuePessimiste:  Math.round(p.revenue / 1e6 * 10) / 10,
      revenueRealiste:    Math.round(r.revenue / 1e6 * 10) / 10,
      revenueOptimiste:   Math.round(o.revenue / 1e6 * 10) / 10,
      profitPessimiste:   Math.round(p.netProfit / 1e6 * 10) / 10,
      profitRealiste:     Math.round(r.netProfit / 1e6 * 10) / 10,
      profitOptimiste:    Math.round(o.netProfit / 1e6 * 10) / 10,
      margeRealiste:      Math.round(r.netMargin * 10) / 10,
    };
  });
}

// ─────────────────────────────────────────────────────────────────
// 4. MONTE CARLO — Distribution du profit annuel
// ─────────────────────────────────────────────────────────────────

const UNCERTAINTY = {
  cimentCostPerTon:   0.25,  // ± 25 % volatilité matière
  aggregatCostPerTon: 0.20,
  inflationRate:      0.50,
  productionCapacity: 0.10,
  payroll:            0.05,
  marketingBudget:    0.15,
  unitPrice:          0.08,
  orderVolume:        0.20,
};

export function runMonteCarlo(baseVars, N = 1500) {
  const results = [];
  const pVars = scenarioVars(baseVars, 'pessimistic');
  const oVars = scenarioVars(baseVars, 'optimistic');

  for (let iter = 0; iter < N; iter++) {
    const vars = {};
    for (const key of Object.keys(UNCERTAINTY)) {
      const unc  = UNCERTAINTY[key];
      const mode = baseVars[key];
      const lo   = pVars[key] !== undefined ? Math.min(pVars[key], mode * (1 - unc)) : mode * (1 - unc);
      const hi   = oVars[key] !== undefined ? Math.max(oVars[key], mode * (1 + unc)) : mode * (1 + unc);
      vars[key]  = triangular(lo, mode, hi);
    }

    let annualProfit = 0;
    for (let m = 0; m < MONTHS; m++) {
      annualProfit += computeMonth(vars, m).netProfit;
    }
    results.push(annualProfit);
  }

  results.sort((a, b) => a - b);

  const percentile = (p) => results[Math.floor((p / 100) * N)] || 0;
  const p10 = percentile(10);
  const p50 = percentile(50);
  const p90 = percentile(90);

  // Histogram (30 buckets)
  const min = results[0];
  const max = results[N - 1];
  const bucketSize = (max - min) / 30 || 1;
  const histogram = Array.from({ length: 30 }, (_, i) => {
    const lo = min + i * bucketSize;
    const hi = lo + bucketSize;
    return {
      value: Math.round((lo + hi) / 2 / 1e6 * 10) / 10,
      count: results.filter(r => r >= lo && r < hi).length,
      isPositive: (lo + hi) / 2 > 0,
    };
  });

  return { p10, p50, p90, histogram, min, max };
}

// ─────────────────────────────────────────────────────────────────
// 5. ANALYSE DE SENSIBILITÉ (TORNADE)
// ─────────────────────────────────────────────────────────────────

const VARIABLE_LABELS = {
  cimentCostPerTon:   'Coût ciment (FCFA/t)',
  aggregatCostPerTon: 'Coût agrégats (FCFA/t)',
  inflationRate:      "Taux d'inflation (%)",
  productionCapacity: 'Capacité de production (%)',
  payroll:            'Masse salariale (FCFA)',
  marketingBudget:    'Budget marketing (FCFA)',
  unitPrice:          'Prix de vente unitaire',
  orderVolume:        'Volume de commandes',
};

export function sensitivityAnalysis(baseVars, delta = 0.05) {
  const baseAnnual = Array.from({ length: MONTHS }, (_, m) =>
    computeMonth(baseVars, m).netProfit
  ).reduce((a, b) => a + b, 0);

  return Object.keys(UNCERTAINTY).map(key => {
    const varsUp   = { ...baseVars, [key]: baseVars[key] * (1 + delta) };
    const varsDn   = { ...baseVars, [key]: baseVars[key] * (1 - delta) };
    const upProfit = Array.from({ length: MONTHS }, (_, m) => computeMonth(varsUp, m).netProfit).reduce((a,b)=>a+b,0);
    const dnProfit = Array.from({ length: MONTHS }, (_, m) => computeMonth(varsDn, m).netProfit).reduce((a,b)=>a+b,0);
    const upImpact = ((upProfit - baseAnnual) / Math.abs(baseAnnual || 1)) * 100;
    const dnImpact = ((dnProfit - baseAnnual) / Math.abs(baseAnnual || 1)) * 100;
    return {
      key,
      label: VARIABLE_LABELS[key] || key,
      upImpact: Math.round(upImpact * 10) / 10,
      dnImpact: Math.round(dnImpact * 10) / 10,
      absRange: Math.abs(upImpact - dnImpact),
    };
  }).sort((a, b) => b.absRange - a.absRange);
}

// ─────────────────────────────────────────────────────────────────
// 6. SCORE DE RISQUE → jauge 0-100
// ─────────────────────────────────────────────────────────────────

export function computeRiskScore(mc, baseVars) {
  const { p10, p50, p90 } = mc;
  const annualRevenue = Array.from({ length: MONTHS }, (_, m) =>
    computeMonth(baseVars, m).revenue
  ).reduce((a, b) => a + b, 0);

  const marginScore = Math.min(100, Math.max(0,
    (p50 / (annualRevenue || 1)) * 100 * 5  // 20% margin = 100pts
  ));
  const volatilityScore = Math.max(0, 100 - (p90 - p10) / (annualRevenue / 12 || 1) * 50);
  const positiveProb = p10 > 0 ? 100 : p50 > 0 ? 60 : 20;

  return Math.round(marginScore * 0.4 + volatilityScore * 0.3 + positiveProb * 0.3);
}

// ─────────────────────────────────────────────────────────────────
// 7. FORMATAGE FCFA
// ─────────────────────────────────────────────────────────────────

export function fmtFCFA(v, decimals = 1) {
  const abs = Math.abs(v);
  if (abs >= 1e9) return `${(v / 1e9).toFixed(decimals)} Mrd`;
  if (abs >= 1e6) return `${(v / 1e6).toFixed(decimals)} M`;
  if (abs >= 1e3) return `${(v / 1e3).toFixed(0)} k`;
  return `${Math.round(v)}`;
}
