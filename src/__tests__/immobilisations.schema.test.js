/**
 * Tests unitaires — Moteur de calcul des amortissements
 * Référence : PCG (Plan Comptable Général) + CGI art. 39A
 */
import { describe, it, expect } from 'vitest';
import {
  COEFFICIENT_DEGRESSIF,
  calculerPlanAmortissement,
  calculerVNC,
  calculerResultatCession,
  dotationsDuExercice,
} from '../schemas/immobilisations.schema.js';

// ── COEFFICIENT_DEGRESSIF ────────────────────────────────────────────────────

describe('COEFFICIENT_DEGRESSIF (CGI art. 39A)', () => {
  it('retourne 1 pour durée < 3 ans (pas de dégressif)', () => {
    expect(COEFFICIENT_DEGRESSIF(1)).toBe(1);
    expect(COEFFICIENT_DEGRESSIF(2)).toBe(1);
  });

  it('retourne 1.25 pour 3–4 ans', () => {
    expect(COEFFICIENT_DEGRESSIF(3)).toBe(1.25);
    expect(COEFFICIENT_DEGRESSIF(4)).toBe(1.25);
  });

  it('retourne 1.75 pour 5–6 ans', () => {
    expect(COEFFICIENT_DEGRESSIF(5)).toBe(1.75);
    expect(COEFFICIENT_DEGRESSIF(6)).toBe(1.75);
  });

  it('retourne 2.25 pour >= 7 ans', () => {
    expect(COEFFICIENT_DEGRESSIF(7)).toBe(2.25);
    expect(COEFFICIENT_DEGRESSIF(10)).toBe(2.25);
    expect(COEFFICIENT_DEGRESSIF(20)).toBe(2.25);
  });
});

// ── PLAN LINÉAIRE ────────────────────────────────────────────────────────────

describe('calculerPlanAmortissement — méthode linéaire', () => {
  const actifBase = {
    valeur_brute: 10000,
    valeur_residuelle: 0,
    duree_amortissement: 5,
    methode: 'lineaire',
    date_acquisition: '2020-01-01',
  };

  it('retourne le bon nombre de lignes', () => {
    const plan = calculerPlanAmortissement(actifBase);
    expect(plan).toHaveLength(5);
  });

  it('année de début correcte', () => {
    const plan = calculerPlanAmortissement(actifBase);
    expect(plan[0].annee).toBe(2020);
    expect(plan[4].annee).toBe(2024);
  });

  it('dotation annuelle constante (2 000 FCFA / an)', () => {
    const plan = calculerPlanAmortissement(actifBase);
    plan.forEach(ligne => expect(ligne.dotation).toBe(2000));
  });

  it('amortissement cumulé correct à chaque étape', () => {
    const plan = calculerPlanAmortissement(actifBase);
    expect(plan[0].amortissementCumule).toBe(2000);
    expect(plan[2].amortissementCumule).toBe(6000);
    expect(plan[4].amortissementCumule).toBe(10000);
  });

  it('VNC fin = 0 à la dernière ligne (sans valeur résiduelle)', () => {
    const plan = calculerPlanAmortissement(actifBase);
    expect(plan[plan.length - 1].vncFin).toBe(0);
  });

  it('VNC début de la ligne N = VNC fin de la ligne N-1', () => {
    const plan = calculerPlanAmortissement(actifBase);
    for (let i = 1; i < plan.length; i++) {
      expect(plan[i].vncDebut).toBe(plan[i - 1].vncFin);
    }
  });

  it('respecte la valeur résiduelle non nulle', () => {
    const actif = { ...actifBase, valeur_residuelle: 1000 };
    const plan = calculerPlanAmortissement(actif);
    // Valeur amortissable = 9 000, dotation annuelle = 1 800
    expect(plan[0].dotation).toBe(1800);
    expect(plan[plan.length - 1].vncFin).toBe(1000);
  });

  it('taux affiché correct pour durée 5 ans (20.00%)', () => {
    const plan = calculerPlanAmortissement(actifBase);
    expect(plan[0].taux).toBe('20.00%');
  });

  it('durée 1 an — amortit tout en une ligne', () => {
    const actif = { ...actifBase, duree_amortissement: 1 };
    const plan = calculerPlanAmortissement(actif);
    expect(plan).toHaveLength(1);
    expect(plan[0].dotation).toBe(10000);
    expect(plan[0].vncFin).toBe(0);
  });

  it('valeur_brute 0 — plan vide (dotation 0)', () => {
    const actif = { ...actifBase, valeur_brute: 0 };
    const plan = calculerPlanAmortissement(actif);
    plan.forEach(l => expect(l.dotation).toBe(0));
  });

  it('gère les montants non divisibles exactement (arrondi à la dernière ligne)', () => {
    // 10 001 FCFA sur 3 ans → 3 333 + 3 333 + 3 335
    const actif = { ...actifBase, valeur_brute: 10001, duree_amortissement: 3 };
    const plan = calculerPlanAmortissement(actif);
    const totalDotations = plan.reduce((s, l) => s + l.dotation, 0);
    expect(totalDotations).toBe(10001);
  });
});

// ── PLAN DÉGRESSIF ───────────────────────────────────────────────────────────

describe('calculerPlanAmortissement — méthode dégressif', () => {
  const actifDegressif = {
    valeur_brute: 10000,
    valeur_residuelle: 0,
    duree_amortissement: 5,
    methode: 'degressif',
    date_acquisition: '2022-01-01',
  };

  it('retourne le bon nombre de lignes (≤ durée)', () => {
    const plan = calculerPlanAmortissement(actifDegressif);
    expect(plan.length).toBeLessThanOrEqual(5);
    expect(plan.length).toBeGreaterThan(0);
  });

  it('première dotation plus élevée qu\'en linéaire', () => {
    const degressif = calculerPlanAmortissement(actifDegressif);
    const lineaire  = calculerPlanAmortissement({ ...actifDegressif, methode: 'lineaire' });
    expect(degressif[0].dotation).toBeGreaterThan(lineaire[0].dotation);
  });

  it('coefficient 1.75 appliqué pour 5 ans (taux dégressif = 35%)', () => {
    // Taux linéaire 5 ans = 20% ; coefficient = 1.75 ; taux dégressif = 35%
    const plan = calculerPlanAmortissement(actifDegressif);
    expect(plan[0].taux).toBe('35.00%');
    // Dotation année 1 = 10 000 × 35% = 3 500
    expect(plan[0].dotation).toBe(3500);
  });

  it('bascule vers linéaire quand taux linéaire sur durée restante > taux dégressif', () => {
    // Après bascule, les dotations sur les dernières années sont plus élevées
    const plan = calculerPlanAmortissement(actifDegressif);
    // La bascule se manifeste : dotation[n-1] >= dotation[n] avant bascule,
    // puis dotation devient constante ou croissante
    const derniere = plan[plan.length - 1];
    const avantDerniere = plan[plan.length - 2];
    // Après bascule, les deux dernières dotations doivent être égales ou quasi-égales
    if (plan.length >= 2) {
      expect(Math.abs(derniere.dotation - avantDerniere.dotation)).toBeLessThanOrEqual(1);
    }
  });

  it('VNC finale ne descend jamais sous la valeur résiduelle', () => {
    const actif = { ...actifDegressif, valeur_residuelle: 500 };
    const plan = calculerPlanAmortissement(actif);
    plan.forEach(ligne => {
      expect(ligne.vncFin).toBeGreaterThanOrEqual(500);
    });
  });

  it('durée < 3 ans → identique au linéaire (pas de dégressif fiscal)', () => {
    const actif = { ...actifDegressif, duree_amortissement: 2 };
    const d = calculerPlanAmortissement(actif);
    const l = calculerPlanAmortissement({ ...actif, methode: 'lineaire' });
    d.forEach((ligne, i) => expect(ligne.dotation).toBe(l[i].dotation));
  });
});

// ── calculerVNC ──────────────────────────────────────────────────────────────

describe('calculerVNC', () => {
  const actif = {
    valeur_brute: 10000,
    valeur_residuelle: 0,
    duree_amortissement: 5,
    methode: 'lineaire',
    date_acquisition: '2020-01-01',
  };

  it('VNC avant le début de l\'amortissement = valeur brute', () => {
    const vnc = calculerVNC(actif, new Date('2019-12-31'));
    expect(vnc).toBe(10000);
  });

  it('VNC à la fin de l\'année 1 = 8 000', () => {
    const vnc = calculerVNC(actif, new Date('2020-12-31'));
    expect(vnc).toBe(8000);
  });

  it('VNC à la fin de l\'année 3 = 4 000', () => {
    const vnc = calculerVNC(actif, new Date('2022-12-31'));
    expect(vnc).toBe(4000);
  });

  it('VNC après la fin d\'amortissement = 0', () => {
    const vnc = calculerVNC(actif, new Date('2030-01-01'));
    expect(vnc).toBe(0);
  });

  it('utilise la date courante si dateRef omise', () => {
    // Ne pas tester la valeur précise (dépend de la date système)
    // Juste vérifier que ça ne throw pas
    expect(() => calculerVNC(actif)).not.toThrow();
  });
});

// ── calculerResultatCession ──────────────────────────────────────────────────

describe('calculerResultatCession', () => {
  const actif = {
    valeur_brute: 10000,
    valeur_residuelle: 0,
    duree_amortissement: 5,
    methode: 'lineaire',
    date_acquisition: '2020-01-01',
  };

  it('détecte une plus-value (vente au-dessus de la VNC)', () => {
    // VNC fin 2022 = 4 000 ; vente à 6 000
    const res = calculerResultatCession(actif, 6000, '2022-12-31');
    expect(res.vnc).toBe(4000);
    expect(res.prixCession).toBe(6000);
    expect(res.resultat).toBe(2000);
    expect(res.type).toBe('plus_value');
  });

  it('détecte une moins-value (vente en dessous de la VNC)', () => {
    // VNC fin 2021 = 6 000 ; vente à 4 000
    const res = calculerResultatCession(actif, 4000, '2021-12-31');
    expect(res.vnc).toBe(6000);
    expect(res.resultat).toBe(-2000);
    expect(res.type).toBe('moins_value');
  });

  it('résultat = 0 quand cession exactement à la VNC', () => {
    // VNC fin 2020 = 8 000 ; vente à 8 000
    const res = calculerResultatCession(actif, 8000, '2020-12-31');
    expect(res.resultat).toBe(0);
    expect(res.type).toBe('plus_value'); // 0 >= 0
  });

  it('cession après amortissement complet — VNC = 0, résultat = prix cession', () => {
    const res = calculerResultatCession(actif, 500, '2030-01-01');
    expect(res.vnc).toBe(0);
    expect(res.resultat).toBe(500);
    expect(res.type).toBe('plus_value');
  });
});

// ── dotationsDuExercice ──────────────────────────────────────────────────────

describe('dotationsDuExercice', () => {
  const actifs = [
    {
      id: 'a1',
      designation: 'Serveur',
      categorie: 'informatique',
      valeur_brute: 10000,
      valeur_residuelle: 0,
      duree_amortissement: 5,
      methode: 'lineaire',
      date_acquisition: '2022-01-01',
      etat: 'actif',
    },
    {
      id: 'a2',
      designation: 'Véhicule',
      categorie: 'transport',
      valeur_brute: 20000,
      valeur_residuelle: 0,
      duree_amortissement: 4,
      methode: 'lineaire',
      date_acquisition: '2022-01-01',
      etat: 'actif',
    },
    {
      id: 'a3',
      designation: 'Vieux PC',
      categorie: 'informatique',
      valeur_brute: 5000,
      valeur_residuelle: 0,
      duree_amortissement: 3,
      methode: 'lineaire',
      date_acquisition: '2020-01-01',
      etat: 'cede', // doit être exclu
    },
  ];

  it('retourne les dotations pour l\'exercice 2022', () => {
    const dotations = dotationsDuExercice(actifs, 2022);
    expect(dotations).toHaveLength(2); // a3 exclu (cédé)
    const d1 = dotations.find(d => d.actifId === 'a1');
    const d2 = dotations.find(d => d.actifId === 'a2');
    expect(d1.dotation).toBe(2000);  // 10000 / 5
    expect(d2.dotation).toBe(5000);  // 20000 / 4
  });

  it('exclut les actifs cédés et mis au rebut', () => {
    const actifsAvecRebut = [
      ...actifs,
      { id: 'a4', designation: 'Vieux matériel', etat: 'mis_au_rebut',
        valeur_brute: 1000, duree_amortissement: 5, methode: 'lineaire',
        date_acquisition: '2022-01-01' }
    ];
    const dotations = dotationsDuExercice(actifsAvecRebut, 2022);
    const ids = dotations.map(d => d.actifId);
    expect(ids).not.toContain('a3');
    expect(ids).not.toContain('a4');
  });

  it('retourne tableau vide si aucun actif en service sur l\'exercice', () => {
    const dotations = dotationsDuExercice(actifs, 2030); // après fin amortissement
    expect(dotations).toHaveLength(0);
  });

  it('structure de chaque entrée contient les champs attendus', () => {
    const dotations = dotationsDuExercice(actifs, 2022);
    dotations.forEach(d => {
      expect(d).toHaveProperty('actifId');
      expect(d).toHaveProperty('designation');
      expect(d).toHaveProperty('categorie');
      expect(d).toHaveProperty('dotation');
      expect(d).toHaveProperty('vnc');
      expect(typeof d.dotation).toBe('number');
    });
  });
});
