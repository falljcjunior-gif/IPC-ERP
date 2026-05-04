/**
 * Tests unitaires — Automation Sales
 * Cible : logique de relance, calcul des seuils, idempotence
 * Note: Ces tests valident la logique pure sans Firebase
 */

// ─── Logique de relance devis ──────────────────────────────────────────────
describe('Relance Devis — Règles métier', () => {
  const RELANCE_RULES = [
    { etape: 'Qualification', seuilJours: 5,  escalade: 'Proposition',  priorite: 'Normal' },
    { etape: 'Proposition',   seuilJours: 7,  escalade: null,            priorite: 'Urgent' },
    { etape: 'Négociation',   seuilJours: 10, escalade: null,            priorite: 'Critique' },
  ];

  function shouldRelance(opportunity, rule, now = new Date()) {
    const seuil = new Date(now.getTime() - rule.seuilJours * 24 * 3600 * 1000);
    const lastUpdate = opportunity._updatedAt || opportunity.createdAt;
    if (!lastUpdate || lastUpdate > seuil.toISOString()) return false;

    const lastRelance = opportunity._lastRelanceAt;
    if (lastRelance) {
      const cooldown = new Date(now.getTime() - 3 * 24 * 3600 * 1000).toISOString();
      if (lastRelance > cooldown) return false;
    }
    return true;
  }

  test('Opportunité à "Proposition" depuis 8 jours → doit être relancée', () => {
    const opp = {
      etape: 'Proposition',
      _updatedAt: new Date(Date.now() - 8 * 86_400_000).toISOString(),
    };
    const rule = RELANCE_RULES.find(r => r.etape === 'Proposition');
    expect(shouldRelance(opp, rule)).toBe(true);
  });

  test('Opportunité à "Proposition" depuis 3 jours → NE doit PAS être relancée', () => {
    const opp = {
      etape: 'Proposition',
      _updatedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
    };
    const rule = RELANCE_RULES.find(r => r.etape === 'Proposition');
    expect(shouldRelance(opp, rule)).toBe(false);
  });

  test('Cooldown actif (relancé il y a 1 jour) → NE doit PAS être relancée', () => {
    const opp = {
      etape: 'Proposition',
      _updatedAt: new Date(Date.now() - 10 * 86_400_000).toISOString(),
      _lastRelanceAt: new Date(Date.now() - 1 * 86_400_000).toISOString(),
    };
    const rule = RELANCE_RULES.find(r => r.etape === 'Proposition');
    expect(shouldRelance(opp, rule)).toBe(false);
  });

  test('Opportunité "Négociation" → priorité Critique', () => {
    const rule = RELANCE_RULES.find(r => r.etape === 'Négociation');
    expect(rule.priorite).toBe('Critique');
  });

  test('Opportunité "Qualification" → escalade vers "Proposition"', () => {
    const rule = RELANCE_RULES.find(r => r.etape === 'Qualification');
    expect(rule.escalade).toBe('Proposition');
  });
});

// ─── Logique de réassort stock ─────────────────────────────────────────────
describe('Réassort Stock — Logique déclenchement', () => {
  function shouldTriggerReorder(oldStock, newStock, stockMinimum) {
    return oldStock > stockMinimum && newStock <= stockMinimum;
  }

  function calcQuantiteACommander(stockActuel, stockCible, stockMinimum) {
    const cible = stockCible || stockMinimum * 3;
    return Math.ceil(cible - stockActuel);
  }

  test('Stock passe de 15 à 8 avec seuil 10 → déclenche réassort', () => {
    expect(shouldTriggerReorder(15, 8, 10)).toBe(true);
  });

  test('Stock passe de 8 à 5 (déjà sous seuil) → NE déclenche PAS', () => {
    expect(shouldTriggerReorder(8, 5, 10)).toBe(false);
  });

  test('Stock passe de 15 à 12 (reste au-dessus) → NE déclenche PAS', () => {
    expect(shouldTriggerReorder(15, 12, 10)).toBe(false);
  });

  test('Stock passe de 15 à 0 (rupture totale) → déclenche réassort', () => {
    expect(shouldTriggerReorder(15, 0, 10)).toBe(true);
  });

  test('Quantité à commander = stockCible - stockActuel (arrondi sup)', () => {
    expect(calcQuantiteACommander(3, 50, 10)).toBe(47);
  });

  test('Sans stockCible → commande 3x le seuil minimum - stock actuel', () => {
    expect(calcQuantiteACommander(5, null, 10)).toBe(25); // 30 - 5
  });
});

// ─── Logique de facturation récurrente ─────────────────────────────────────
describe('Facturation Récurrente — Calcul dates', () => {
  function getNextBillingDate(currentDate, typeFacturation) {
    const d = new Date(currentDate);
    if (typeFacturation === 'mensuel')      { d.setMonth(d.getMonth() + 1); }
    else if (typeFacturation === 'trimestriel') { d.setMonth(d.getMonth() + 3); }
    else if (typeFacturation === 'annuel')  { d.setFullYear(d.getFullYear() + 1); }
    return d.toISOString().split('T')[0];
  }

  function shouldBillToday(prochaineDateFacture, today = new Date().toISOString().split('T')[0]) {
    return prochaineDateFacture <= today;
  }

  test('Facturation mensuelle le 4 Mai → prochaine le 4 Juin', () => {
    const next = getNextBillingDate('2026-05-04', 'mensuel');
    expect(next).toBe('2026-06-04');
  });

  test('Facturation trimestrielle le 4 Mai → prochaine le 4 Août', () => {
    const next = getNextBillingDate('2026-05-04', 'trimestriel');
    expect(next).toBe('2026-08-04');
  });

  test('Facturation annuelle → +1 an exact', () => {
    const next = getNextBillingDate('2026-05-04', 'annuel');
    expect(next).toBe('2027-05-04');
  });

  test('Contrat avec date passée → doit être facturé aujourd\'hui', () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
    expect(shouldBillToday(yesterday)).toBe(true);
  });

  test('Contrat avec date future → NE doit PAS être facturé', () => {
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split('T')[0];
    expect(shouldBillToday(tomorrow)).toBe(false);
  });
});

// ─── Pipeline Pondéré (Cash Flow Forecast) ────────────────────────────────
describe('Pipeline Pondéré — Prévision trésorerie', () => {
  const WEIGHTS = {
    'Qualification': 0.15,
    'Proposition':   0.35,
    'Négociation':   0.60,
    'Bon de Commande': 0.85,
  };

  function computeWeightedPipeline(opportunities) {
    return opportunities
      .filter(o => o.etape !== 'Perdu' && o.etape !== 'Gagné')
      .reduce((acc, o) => acc + (o.montant || 0) * (WEIGHTS[o.etape] || 0.1), 0);
  }

  test('1 000 000 en Négociation → contribue 600 000', () => {
    const opps = [{ etape: 'Négociation', montant: 1_000_000 }];
    expect(computeWeightedPipeline(opps)).toBeCloseTo(600_000);
  });

  test('Les opps Perdues sont exclues du pipeline', () => {
    const opps = [
      { etape: 'Perdu', montant: 5_000_000 },
      { etape: 'Négociation', montant: 500_000 },
    ];
    expect(computeWeightedPipeline(opps)).toBeCloseTo(300_000);
  });

  test('Pipeline vide → retourne 0', () => {
    expect(computeWeightedPipeline([])).toBe(0);
  });

  test('Multiple étapes → somme pondérée correcte', () => {
    const opps = [
      { etape: 'Qualification', montant: 1_000_000 },   // 150 000
      { etape: 'Proposition',   montant: 2_000_000 },   // 700 000
    ];
    expect(computeWeightedPipeline(opps)).toBeCloseTo(850_000);
  });
});
