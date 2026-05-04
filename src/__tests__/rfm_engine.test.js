/**
 * Tests unitaires — RFM Engine (logique pure, sans dépendances Firebase)
 * Cible : fonctions computeRFM et getSegmentFromScore
 * NOTE : La logique est répliquée ici pour permettre le test en environnement jsdom.
 *        Les règles métier DOIVENT rester synchronisées avec rfm_engine.js.
 */

// ── Logique RFM pure (miroir de functions/modules/rfm_engine.js) ──────────
const SCORING_RULES = {
  recence: [
    { max: 30,  score: 5 },
    { max: 60,  score: 4 },
    { max: 90,  score: 3 },
    { max: 180, score: 2 },
    { max: Infinity, score: 1 },
  ],
  frequence: [
    { min: 10, score: 5 },
    { min: 6,  score: 4 },
    { min: 3,  score: 3 },
    { min: 2,  score: 2 },
    { min: 0,  score: 1 },
  ],
  montant: [
    { min: 5_000_000, score: 5 },
    { min: 2_000_000, score: 4 },
    { min: 500_000,   score: 3 },
    { min: 100_000,   score: 2 },
    { min: 0,         score: 1 },
  ],
};

function computeRFM(invoices) {
  if (!invoices || invoices.length === 0) {
    return { rScore: 1, fScore: 1, mScore: 1, total: 3, segment: 'INACTIF', segmentLabel: 'Inactif', segmentColor: '#94A3B8', ltv: 0, avgOrderValue: 0, recenceJours: 999, frequence: 0 };
  }

  const now = Date.now();

  // Récence : jours depuis le dernier achat
  const lastDate = invoices.reduce((last, inv) => {
    const d = new Date(inv.createdAt?.toDate ? inv.createdAt.toDate() : inv.createdAt).getTime();
    return d > last ? d : last;
  }, 0);
  const recenceJours = Math.floor((now - lastDate) / 86_400_000);
  const rScore = SCORING_RULES.recence.find(r => recenceJours <= r.max)?.score ?? 1;

  // Fréquence
  const frequence = invoices.length;
  const fScore = SCORING_RULES.frequence.find(r => frequence >= r.min)?.score ?? 1;

  // Montant (LTV)
  const ltv = invoices.reduce((sum, inv) => sum + (Number(inv.montant) || 0), 0);
  const mScore = SCORING_RULES.montant.find(r => ltv >= r.min)?.score ?? 1;

  const total = rScore + fScore + mScore;
  const avgOrderValue = frequence > 0 ? ltv / frequence : 0;

  const segment = getSegmentFromScore(total);
  const LABELS = {
    VIP_PLATINUM: { label: 'VIP Platinum', color: '#7C3AED' },
    VIP_GOLD:     { label: 'VIP Gold',     color: '#F59E0B' },
    ACTIF:        { label: 'Actif',        color: '#10B981' },
    A_RISQUE:     { label: 'À Risque',     color: '#F97316' },
    INACTIF:      { label: 'Inactif',      color: '#94A3B8' },
  };

  return {
    rScore, fScore, mScore, total, segment,
    segmentLabel: LABELS[segment].label,
    segmentColor: LABELS[segment].color,
    ltv, avgOrderValue, recenceJours, frequence,
  };
}

function getSegmentFromScore(total) {
  if (total >= 13) return 'VIP_PLATINUM';
  if (total >= 10) return 'VIP_GOLD';
  if (total >= 7)  return 'ACTIF';
  if (total >= 5)  return 'A_RISQUE';
  return 'INACTIF';
}
// ─────────────────────────────────────────────────────────────────────────────

// Helper
const makeInvoice = (montant, daysAgo) => ({
  montant,
  createdAt: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
});

// ── TESTS ────────────────────────────────────────────────────────────────────
describe('computeRFM — Client sans factures', () => {
  test('Doit retourner le segment INACTIF avec score 3', () => {
    const result = computeRFM([]);
    expect(result.segment).toBe('INACTIF');
    expect(result.total).toBe(3);
    expect(result.ltv).toBe(0);
  });

  test('Doit retourner INACTIF si invoices est null', () => {
    const result = computeRFM(null);
    expect(result.segment).toBe('INACTIF');
  });
});

describe('computeRFM — Scoring Récence', () => {
  test('Achat il y a 10 jours → rScore = 5', () => {
    expect(computeRFM([makeInvoice(100_000, 10)]).rScore).toBe(5);
  });

  test('Achat il y a 45 jours → rScore = 4', () => {
    expect(computeRFM([makeInvoice(100_000, 45)]).rScore).toBe(4);
  });

  test('Achat il y a 200 jours → rScore = 1', () => {
    expect(computeRFM([makeInvoice(100_000, 200)]).rScore).toBe(1);
  });
});

describe('computeRFM — Scoring Fréquence', () => {
  test('10 achats → fScore = 5', () => {
    const invoices = Array.from({ length: 10 }, () => makeInvoice(50_000, 10));
    expect(computeRFM(invoices).fScore).toBe(5);
  });

  test('1 achat → fScore = 1', () => {
    expect(computeRFM([makeInvoice(50_000, 10)]).fScore).toBe(1);
  });

  test('3 achats → fScore = 3', () => {
    const invoices = Array.from({ length: 3 }, () => makeInvoice(50_000, 10));
    expect(computeRFM(invoices).fScore).toBe(3);
  });
});

describe('computeRFM — Scoring Montant (LTV)', () => {
  test('LTV 6 000 000 FCFA → mScore = 5', () => {
    expect(computeRFM([makeInvoice(6_000_000, 5)]).mScore).toBe(5);
  });

  test('LTV 300 000 FCFA → mScore = 2', () => {
    expect(computeRFM([makeInvoice(300_000, 5)]).mScore).toBe(2);
  });

  test('LTV 10 000 FCFA → mScore = 1', () => {
    expect(computeRFM([makeInvoice(10_000, 5)]).mScore).toBe(1);
  });
});

describe('computeRFM — Segmentation', () => {
  test('Client récent, fréquent, gros montant → VIP_PLATINUM (total ≥ 13)', () => {
    const invoices = Array.from({ length: 12 }, () => makeInvoice(600_000, 5));
    const result = computeRFM(invoices);
    expect(result.segment).toBe('VIP_PLATINUM');
    expect(result.total).toBeGreaterThanOrEqual(13);
  });

  test('Total 10-12 → VIP_GOLD', () => {
    expect(getSegmentFromScore(10)).toBe('VIP_GOLD');
    expect(getSegmentFromScore(12)).toBe('VIP_GOLD');
  });

  test('Total 7-9 → ACTIF', () => {
    expect(getSegmentFromScore(7)).toBe('ACTIF');
    expect(getSegmentFromScore(9)).toBe('ACTIF');
  });

  test('Total 5-6 → A_RISQUE', () => {
    expect(getSegmentFromScore(5)).toBe('A_RISQUE');
    expect(getSegmentFromScore(6)).toBe('A_RISQUE');
  });

  test('Total ≤ 4 → INACTIF', () => {
    expect(getSegmentFromScore(3)).toBe('INACTIF');
    expect(getSegmentFromScore(4)).toBe('INACTIF');
  });
});

describe('computeRFM — Calculs dérivés', () => {
  test('avgOrderValue = LTV / fréquence', () => {
    const invoices = [makeInvoice(100_000, 10), makeInvoice(200_000, 20)];
    const result = computeRFM(invoices);
    expect(result.avgOrderValue).toBe(150_000);
    expect(result.ltv).toBe(300_000);
    expect(result.frequence).toBe(2);
  });

  test('recenceJours est positif et proche de la valeur attendue', () => {
    const result = computeRFM([makeInvoice(100_000, 15)]);
    expect(result.recenceJours).toBeGreaterThanOrEqual(14);
    expect(result.recenceJours).toBeLessThanOrEqual(16);
  });

  test('segmentLabel et segmentColor sont définis', () => {
    const result = computeRFM([makeInvoice(100_000, 10)]);
    expect(result.segmentLabel).toBeDefined();
    expect(result.segmentColor).toMatch(/^#/);
  });
});
