/**
 * Tests unitaires — RFM Engine
 * Cible : functions/modules/rfm_engine.js
 * Couverture : scoring, segmentation, edge cases
 */

// Extraire la fonction pure computeRFM pour tester sans Firebase
const { computeRFM } = (() => {
  // Stub admin pour éviter les initialisations Firebase
  const mockAdmin = {
    firestore: { FieldValue: { serverTimestamp: () => null, increment: () => null } },
  };

  // Isoler la fonction computeRFM depuis le module (lecture directe)
  const fs = require('fs');
  const path = require('path');
  const src = fs.readFileSync(path.join(__dirname, '../../functions/modules/rfm_engine.js'), 'utf-8');

  // Extraire et évaluer uniquement la fonction computeRFM
  const match = src.match(/function computeRFM[\s\S]+?^}/m);
  if (!match) throw new Error('computeRFM not found');

  const fn = new Function('return ' + match[0])();
  return { computeRFM: fn };
})();

// ─── Helper ───
const makeInvoice = (montant, daysAgo) => ({
  montant,
  createdAt: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
});

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('computeRFM — Client sans factures', () => {
  test('Doit retourner le segment INACTIF avec score 3', () => {
    const result = computeRFM([]);
    expect(result.segment).toBe('INACTIF');
    expect(result.total).toBe(3);
    expect(result.ltv).toBe(0);
  });

  test('Doit retourner le segment INACTIF si invoices est null', () => {
    const result = computeRFM(null);
    expect(result.segment).toBe('INACTIF');
  });
});

describe('computeRFM — Scoring Récence', () => {
  test('Achat il y a 10 jours → rScore = 5', () => {
    const result = computeRFM([makeInvoice(100_000, 10)]);
    expect(result.rScore).toBe(5);
  });

  test('Achat il y a 45 jours → rScore = 4', () => {
    const result = computeRFM([makeInvoice(100_000, 45)]);
    expect(result.rScore).toBe(4);
  });

  test('Achat il y a 200 jours → rScore = 1', () => {
    const result = computeRFM([makeInvoice(100_000, 200)]);
    expect(result.rScore).toBe(1);
  });
});

describe('computeRFM — Scoring Fréquence', () => {
  test('10 achats → fScore = 5', () => {
    const invoices = Array.from({ length: 10 }, () => makeInvoice(50_000, 10));
    const result = computeRFM(invoices);
    expect(result.fScore).toBe(5);
  });

  test('1 achat → fScore = 2', () => {
    const result = computeRFM([makeInvoice(50_000, 10)]);
    expect(result.fScore).toBe(2);
  });
});

describe('computeRFM — Scoring Montant (LTV)', () => {
  test('LTV 6 000 000 FCFA → mScore = 5', () => {
    const result = computeRFM([makeInvoice(6_000_000, 5)]);
    expect(result.mScore).toBe(5);
  });

  test('LTV 300 000 FCFA → mScore = 3', () => {
    const result = computeRFM([makeInvoice(300_000, 5)]);
    expect(result.mScore).toBe(3);
  });

  test('LTV 10 000 FCFA → mScore = 1', () => {
    const result = computeRFM([makeInvoice(10_000, 5)]);
    expect(result.mScore).toBe(1);
  });
});

describe('computeRFM — Segmentation VIP', () => {
  test('Client récent, fréquent, gros montant → VIP_PLATINUM', () => {
    const invoices = Array.from({ length: 12 }, () => makeInvoice(600_000, 5));
    const result = computeRFM(invoices);
    expect(result.segment).toBe('VIP_PLATINUM');
    expect(result.total).toBeGreaterThanOrEqual(13);
  });

  test('Client régulier, montant moyen → ACTIF ou VIP_GOLD', () => {
    const invoices = Array.from({ length: 5 }, () => makeInvoice(250_000, 30));
    const result = computeRFM(invoices);
    expect(['ACTIF', 'VIP_GOLD']).toContain(result.segment);
  });

  test('Client inactif depuis 6+ mois, faible montant → A_RISQUE ou INACTIF', () => {
    const result = computeRFM([makeInvoice(30_000, 200)]);
    expect(['A_RISQUE', 'INACTIF']).toContain(result.segment);
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

  test('recenceJours est positif', () => {
    const result = computeRFM([makeInvoice(100_000, 15)]);
    expect(result.recenceJours).toBeGreaterThan(14);
    expect(result.recenceJours).toBeLessThan(16);
  });
});
