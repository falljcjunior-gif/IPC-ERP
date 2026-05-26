/**
 * Tests — Finance Utilities
 * src/utils/finance.js — helpers monétaires, dates, statuts
 */
import { describe, it, expect } from 'vitest';
import {
  safeRatio, safePercent,
  isPaid, isOverdue,
  parseDate, normalizeDate, monthKeyUTC,
  roundCents, sumMoney,
  currentQuarterLabel, fiscalYearLabel,
  isInPeriod,
} from '../utils/finance';

// ── safeRatio ────────────────────────────────────────────────────────────────
describe('safeRatio', () => {
  it('retourne num/den pour des valeurs normales', () => {
    expect(safeRatio(10, 2)).toBe(5);
    expect(safeRatio(1, 3)).toBeCloseTo(0.333, 3);
  });
  it('retourne fallback si den === 0', () => {
    expect(safeRatio(10, 0)).toBe(0);
    expect(safeRatio(10, 0, -1)).toBe(-1);
  });
  it('retourne fallback si num est NaN', () => {
    expect(safeRatio(NaN, 5)).toBe(0);
  });
  it('retourne fallback si den est NaN', () => {
    expect(safeRatio(5, NaN)).toBe(0);
  });
  it('retourne fallback si den est Infinity', () => {
    expect(safeRatio(5, Infinity)).toBe(0);
  });
  it('accepte les strings numériques', () => {
    expect(safeRatio('10', '2')).toBe(5);
  });
});

// ── safePercent ──────────────────────────────────────────────────────────────
describe('safePercent', () => {
  it('retourne un entier arrondi', () => {
    expect(safePercent(1, 3)).toBe(33);
    expect(safePercent(2, 3)).toBe(67);
    expect(safePercent(1, 4)).toBe(25);
  });
  it('retourne 0 pour den === 0', () => {
    expect(safePercent(5, 0)).toBe(0);
  });
  it('retourne 100 pour num === den', () => {
    expect(safePercent(5, 5)).toBe(100);
  });
});

// ── isPaid ───────────────────────────────────────────────────────────────────
describe('isPaid', () => {
  it('reconnaît "Payé" (avec accent)', () => {
    expect(isPaid({ statut: 'Payé' })).toBe(true);
  });
  it('reconnaît "Payée" (féminin)', () => {
    expect(isPaid({ statut: 'Payée' })).toBe(true);
  });
  it('reconnaît "paid" (anglais)', () => {
    expect(isPaid({ status: 'paid' })).toBe(true);
  });
  it('reconnaît "Réglé"', () => {
    expect(isPaid({ statut: 'Réglé' })).toBe(true);
  });
  it('ignore la casse et les espaces', () => {
    expect(isPaid({ statut: '  PAYÉ  ' })).toBe(true);
  });
  it('retourne false pour "En attente"', () => {
    expect(isPaid({ statut: 'En attente' })).toBe(false);
  });
  it('retourne false pour "Impayé"', () => {
    expect(isPaid({ statut: 'Impayé' })).toBe(false);
  });
  it('retourne false pour null', () => {
    expect(isPaid(null)).toBe(false);
  });
  it('retourne false pour objet sans statut', () => {
    expect(isPaid({})).toBe(false);
  });
  it('supporte le champ status (anglais)', () => {
    expect(isPaid({ status: 'settled' })).toBe(true);
  });
});

// ── isOverdue ────────────────────────────────────────────────────────────────
describe('isOverdue', () => {
  const past   = new Date('2020-01-01');
  const future = new Date('2099-12-31');
  const now    = new Date('2026-05-26');

  it('retourne true si non payé et date passée', () => {
    expect(isOverdue({ statut: 'Impayé', dueDate: past }, now)).toBe(true);
  });
  it('retourne false si payé même si date passée', () => {
    expect(isOverdue({ statut: 'Payé', dueDate: past }, now)).toBe(false);
  });
  it('retourne false si date future', () => {
    expect(isOverdue({ statut: 'Impayé', dueDate: future }, now)).toBe(false);
  });
  it('retourne false si null', () => {
    expect(isOverdue(null)).toBe(false);
  });
  it('retourne false si dueDate absent', () => {
    expect(isOverdue({ statut: 'Impayé' }, now)).toBe(false);
  });
});

// ── parseDate ────────────────────────────────────────────────────────────────
describe('parseDate', () => {
  it('parse une string ISO', () => {
    const d = parseDate('2026-05-26');
    expect(d).toBeInstanceOf(Date);
    expect(d.getUTCFullYear()).toBe(2026);
  });
  it('retourne une Date inchangée', () => {
    const d = new Date('2026-01-01');
    expect(parseDate(d)).toBe(d);
  });
  it('retourne null pour null', () => {
    expect(parseDate(null)).toBeNull();
  });
  it('retourne null pour string invalide', () => {
    expect(parseDate('not-a-date')).toBeNull();
  });
  it('retourne null pour undefined', () => {
    expect(parseDate(undefined)).toBeNull();
  });
  it('accepte un timestamp numérique', () => {
    const ts = new Date('2026-06-01').getTime();
    expect(parseDate(ts)).toBeInstanceOf(Date);
  });
  it('accepte un Firestore Timestamp-like (toDate)', () => {
    const fakeTimestamp = { toDate: () => new Date('2026-07-01') };
    const d = parseDate(fakeTimestamp);
    expect(d).toBeInstanceOf(Date);
    expect(d.getUTCMonth()).toBe(6); // juillet = 6
  });
});

// ── normalizeDate ─────────────────────────────────────────────────────────────
describe('normalizeDate', () => {
  it('retourne YYYY-MM-DD', () => {
    expect(normalizeDate('2026-05-26T14:30:00Z')).toBe('2026-05-26');
  });
  it('retourne null pour entrée invalide', () => {
    expect(normalizeDate(null)).toBeNull();
    expect(normalizeDate('')).toBeNull();
  });
});

// ── monthKeyUTC ───────────────────────────────────────────────────────────────
describe('monthKeyUTC', () => {
  it('retourne YYYY-MM', () => {
    expect(monthKeyUTC('2026-05-15')).toBe('2026-05');
  });
  it('pad les mois < 10', () => {
    expect(monthKeyUTC('2026-01-01')).toBe('2026-01');
  });
  it('retourne null pour entrée invalide', () => {
    expect(monthKeyUTC(null)).toBeNull();
  });
});

// ── roundCents ────────────────────────────────────────────────────────────────
describe('roundCents', () => {
  it('arrondit à 2 décimales', () => {
    expect(roundCents(1.1)).toBe(1.1);
    expect(roundCents(2.554)).toBe(2.55);
    expect(roundCents(2.555)).toBe(2.56);
  });
  it('retourne 0 pour NaN / Infinity', () => {
    expect(roundCents(NaN)).toBe(0);
    expect(roundCents(Infinity)).toBe(0);
  });
  it('accepte les strings', () => {
    expect(roundCents('3.14')).toBe(3.14);
  });
});

// ── sumMoney ──────────────────────────────────────────────────────────────────
describe('sumMoney', () => {
  it('additionne des montants sans dérive float', () => {
    const items = [0.1, 0.2, 0.3];
    expect(sumMoney(items)).toBe(0.6);
  });
  it('utilise un accessor', () => {
    const invoices = [{ total: 100 }, { total: 200.5 }, { total: 50 }];
    expect(sumMoney(invoices, i => i.total)).toBe(350.5);
  });
  it('retourne 0 pour un tableau vide', () => {
    expect(sumMoney([])).toBe(0);
  });
  it('retourne 0 pour un non-tableau', () => {
    expect(sumMoney(null)).toBe(0);
    expect(sumMoney(undefined)).toBe(0);
  });
  it('ignore les valeurs non-numériques', () => {
    const items = [{ v: 'abc' }, { v: 100 }];
    expect(sumMoney(items, i => i.v)).toBe(100);
  });
});

// ── currentQuarterLabel ───────────────────────────────────────────────────────
describe('currentQuarterLabel', () => {
  it('retourne Q1 pour janvier', () => {
    expect(currentQuarterLabel(new Date('2026-01-15'))).toBe('Q1 2026');
  });
  it('retourne Q2 pour avril', () => {
    expect(currentQuarterLabel(new Date('2026-04-01'))).toBe('Q2 2026');
  });
  it('retourne Q3 pour juillet', () => {
    expect(currentQuarterLabel(new Date('2026-07-31'))).toBe('Q3 2026');
  });
  it('retourne Q4 pour octobre', () => {
    expect(currentQuarterLabel(new Date('2026-10-10'))).toBe('Q4 2026');
  });
});

// ── fiscalYearLabel ───────────────────────────────────────────────────────────
describe('fiscalYearLabel', () => {
  it('retourne "Exercice YYYY"', () => {
    expect(fiscalYearLabel(new Date('2026-05-26'))).toBe('Exercice 2026');
  });
});

// ── isInPeriod ────────────────────────────────────────────────────────────────
describe('isInPeriod', () => {
  const d = '2026-05-26';
  it('retourne true si dans la plage', () => {
    expect(isInPeriod(d, { from: '2026-01-01', to: '2026-12-31' })).toBe(true);
  });
  it('retourne false si avant from', () => {
    expect(isInPeriod('2025-12-31', { from: '2026-01-01' })).toBe(false);
  });
  it('retourne false si après to', () => {
    expect(isInPeriod('2027-01-01', { to: '2026-12-31' })).toBe(false);
  });
  it('retourne true si pas de bornes', () => {
    expect(isInPeriod(d, {})).toBe(true);
  });
  it('retourne false pour date invalide', () => {
    expect(isInPeriod(null, { from: '2026-01-01' })).toBe(false);
  });
  it('retourne true si exactement égal à from (inclusif)', () => {
    expect(isInPeriod('2026-01-01', { from: '2026-01-01' })).toBe(true);
  });
  it('retourne true si exactement égal à to (inclusif)', () => {
    expect(isInPeriod('2026-12-31', { to: '2026-12-31' })).toBe(true);
  });
});
