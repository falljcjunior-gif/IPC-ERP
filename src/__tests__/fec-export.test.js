/**
 * Tests — FEC Export (Fichier des Écritures Comptables)
 * Conformité DGFiP — Arrêté 29 juillet 2013
 */
import { describe, it, expect } from 'vitest';
import {
  formatFecDate,
  formatFecAmount,
  cleanFecField,
  mapEntryToFecRow,
  generateFecContent,
  validateFec,
} from '../utils/fec-export';

// ── formatFecDate ─────────────────────────────────────────────────────────

describe('formatFecDate', () => {
  it('formater une Date JavaScript en YYYYMMDD', () => {
    expect(formatFecDate(new Date('2026-01-15'))).toBe('20260115');
  });

  it('accepter une chaîne ISO', () => {
    expect(formatFecDate('2026-03-31')).toBe('20260331');
  });

  it('accepter le format DD/MM/YYYY', () => {
    expect(formatFecDate('31/12/2025')).toBe('20251231');
  });

  it('retourner le format FEC tel quel si déjà YYYYMMDD', () => {
    expect(formatFecDate('20260101')).toBe('20260101');
  });

  it('retourner chaîne vide pour null/undefined', () => {
    expect(formatFecDate(null)).toBe('');
    expect(formatFecDate(undefined)).toBe('');
    expect(formatFecDate('')).toBe('');
  });

  it('gérer un Timestamp Firestore (avec .toDate())', () => {
    const mockTs = { toDate: () => new Date('2026-05-26') };
    expect(formatFecDate(mockTs)).toBe('20260526');
  });
});

// ── formatFecAmount ───────────────────────────────────────────────────────

describe('formatFecAmount', () => {
  it('formater un entier avec 2 décimales virgule', () => {
    expect(formatFecAmount(1500)).toBe('1500,00');
  });

  it('formater un nombre décimal', () => {
    expect(formatFecAmount(1234.56)).toBe('1234,56');
  });

  it('arrondir à 2 décimales', () => {
    expect(formatFecAmount(9.999)).toBe('10,00');
  });

  it('retourner 0,00 pour null/undefined/vide', () => {
    expect(formatFecAmount(null)).toBe('0,00');
    expect(formatFecAmount(undefined)).toBe('0,00');
    expect(formatFecAmount('')).toBe('0,00');
  });

  it('retourner 0,00 pour NaN', () => {
    expect(formatFecAmount('abc')).toBe('0,00');
  });

  it('gérer les montants négatifs', () => {
    expect(formatFecAmount(-500)).toBe('-500,00');
  });
});

// ── cleanFecField ─────────────────────────────────────────────────────────

describe('cleanFecField', () => {
  it('supprimer les pipes (séparateur FEC)', () => {
    expect(cleanFecField('Règlement|Facture')).toBe('Règlement-Facture');
  });

  it('supprimer les sauts de ligne', () => {
    expect(cleanFecField('Ligne1\nLigne2')).toBe('Ligne1 Ligne2');
    expect(cleanFecField('Ligne1\r\nLigne2')).toBe('Ligne1 Ligne2');
  });

  it('remplacer les guillemets doubles', () => {
    expect(cleanFecField('"Texte"')).toBe("'Texte'");
  });

  it('trimmer les espaces', () => {
    expect(cleanFecField('  texte  ')).toBe('texte');
  });

  it('retourner chaîne vide pour null', () => {
    expect(cleanFecField(null)).toBe('');
    expect(cleanFecField(undefined)).toBe('');
  });

  it('convertir les nombres en chaîne', () => {
    expect(cleanFecField(411000)).toBe('411000');
  });
});

// ── mapEntryToFecRow ──────────────────────────────────────────────────────

describe('mapEntryToFecRow', () => {
  const mockEntry = {
    id:          'entry-001',
    journalCode: 'VT',
    journalLib:  'Ventes',
    ecritureNum: 'EC-2026-001',
    date:        '2026-01-15',
    compteNum:   '411000',
    compteLib:   'Clients',
    libelle:     'Facture F-2026-001',
    piece:       'F-2026-001',
    debit:       5000,
    credit:      0,
    devise:      'XOF',
  };

  it('mapper correctement les 18 colonnes FEC obligatoires', () => {
    const row = mapEntryToFecRow(mockEntry);
    expect(Object.keys(row)).toHaveLength(18);
    expect(row.JournalCode).toBe('VT');
    expect(row.JournalLib).toBe('Ventes');
    expect(row.EcritureNum).toBe('EC-2026-001');
    expect(row.EcritureDate).toBe('20260115');
    expect(row.CompteNum).toBe('411000');
    expect(row.CompteLib).toBe('Clients');
    expect(row.EcritureLib).toBe('Facture F-2026-001');
    expect(row.Debit).toBe('5000,00');
    expect(row.Credit).toBe('0,00');
    expect(row.Idevise).toBe('XOF');
  });

  it('enrichir CompteLib depuis le dictionnaire de comptes', () => {
    const accounts = { '411000': 'Clients Collectifs' };
    const row = mapEntryToFecRow({ ...mockEntry, compteLib: '' }, accounts);
    expect(row.CompteLib).toBe('Clients Collectifs');
  });

  it('utiliser "OD" par défaut si journalCode absent', () => {
    const row = mapEntryToFecRow({ ...mockEntry, journalCode: undefined });
    expect(row.JournalCode).toBe('OD');
  });

  it('générer un EcritureNum de fallback si absent', () => {
    const { ecritureNum: _, piece: __, reference: ___, ...entryNoNum } = mockEntry;
    const row = mapEntryToFecRow({ ...entryNoNum, id: 'test-001' });
    expect(row.EcritureNum).toContain('EC-');
  });
});

// ── generateFecContent ────────────────────────────────────────────────────

describe('generateFecContent', () => {
  const entries = [
    {
      id:          'e1',
      journalCode: 'VT',
      journalLib:  'Ventes',
      ecritureNum: 'EC-001',
      date:        '2026-01-15',
      compteNum:   '411000',
      compteLib:   'Clients',
      libelle:     'Facture client',
      debit:       5000,
      credit:      0,
      devise:      'XOF',
    },
    {
      id:          'e2',
      journalCode: 'VT',
      journalLib:  'Ventes',
      ecritureNum: 'EC-002',
      date:        '2026-01-15',
      compteNum:   '706000',
      compteLib:   'Prestations',
      libelle:     'Facture client',
      debit:       0,
      credit:      5000,
      devise:      'XOF',
    },
  ];

  it('générer un FEC avec en-tête + 2 lignes', () => {
    const { content, rowCount, errors } = generateFecContent(entries);
    expect(rowCount).toBe(2);
    expect(errors).toHaveLength(0);
    expect(content.startsWith('JournalCode|JournalLib')).toBe(true);
  });

  it('utiliser le SIREN dans le nom de fichier', () => {
    const { filename } = generateFecContent(entries, { siren: '123456789', endDate: '20261231' });
    expect(filename).toBe('123456789FEC20261231.txt');
  });

  it('exclure les écritures sans EcritureDate et rapporter l\'erreur', () => {
    const badEntries = [
      { ...entries[0] },
      { id: 'bad', compteNum: '411000', libelle: 'Sans date', debit: 100 }, // pas de date
    ];
    const { rowCount, errors } = generateFecContent(badEntries);
    expect(rowCount).toBe(1);
    expect(errors).toHaveLength(1);
    expect(errors[0].error).toContain('EcritureDate');
  });

  it('utiliser CRLF comme séparateur de lignes', () => {
    const { content } = generateFecContent(entries);
    expect(content.includes('\r\n')).toBe(true);
  });

  it('séparer les colonnes avec pipe', () => {
    const { content } = generateFecContent(entries);
    const headerLine = content.split('\r\n')[0];
    expect(headerLine.split('|')).toHaveLength(18);
  });
});

// ── validateFec ───────────────────────────────────────────────────────────

describe('validateFec', () => {
  it('valider un FEC correctement formé', () => {
    const entries = [
      {
        id: 'e1', journalCode: 'VT', journalLib: 'Ventes',
        ecritureNum: 'EC-001', date: '2026-01-15',
        compteNum: '411000', compteLib: 'Clients',
        libelle: 'Test', debit: 1000, credit: 0, devise: 'XOF',
      },
      {
        id: 'e2', journalCode: 'VT', journalLib: 'Ventes',
        ecritureNum: 'EC-002', date: '2026-01-15',
        compteNum: '706000', compteLib: 'Produits',
        libelle: 'Test', debit: 0, credit: 1000, devise: 'XOF',
      },
    ];
    const { content } = generateFecContent(entries);
    const result = validateFec(content);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.stats.balanced).toBe(true);
  });

  it('détecter un FEC vide', () => {
    const result = validateFec('');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('détecter un FEC avec une seule ligne (pas d\'écriture)', () => {
    const result = validateFec('header line\r\n');
    expect(result.valid).toBe(false);
  });

  it('avertir d\'un déséquilibre débit/crédit', () => {
    const entries = [
      {
        id: 'e1', journalCode: 'VT', journalLib: 'Ventes',
        ecritureNum: 'EC-001', date: '2026-01-15',
        compteNum: '411000', libelle: 'Test', debit: 1000, credit: 0, devise: 'XOF',
      },
    ];
    const { content } = generateFecContent(entries);
    const result = validateFec(content);
    expect(result.stats.balanced).toBe(false);
    expect(result.warnings.some(w => w.includes('Déséquilibre'))).toBe(true);
  });
});
