/**
 * Tests — Schema Validation Utility
 * src/utils/validation.js — validateData()
 */
import { describe, it, expect } from 'vitest';
import { validateData } from '../utils/validation';

// ── Null / missing schema ─────────────────────────────────────────────────────
describe('validateData — schema manquant', () => {
  it('retourne valid:true si schema est null', () => {
    expect(validateData(null, { name: 'foo' })).toEqual({ valid: true });
  });
  it('retourne valid:true si schema est undefined', () => {
    expect(validateData(undefined, {})).toEqual({ valid: true });
  });
  it('retourne valid:true si schema.fields est absent', () => {
    expect(validateData({}, {})).toEqual({ valid: true });
  });
});

// ── Champ requis ──────────────────────────────────────────────────────────────
describe('validateData — required', () => {
  const schema = {
    fields: {
      nom: { type: 'text', required: true, label: 'Nom' },
    },
  };

  it('échoue si champ requis est absent', () => {
    const res = validateData(schema, {});
    expect(res.valid).toBe(false);
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0]).toContain('Nom');
  });
  it('échoue si champ requis est null', () => {
    const res = validateData(schema, { nom: null });
    expect(res.valid).toBe(false);
  });
  it('échoue si champ requis est chaîne vide', () => {
    const res = validateData(schema, { nom: '' });
    expect(res.valid).toBe(false);
  });
  it('réussit si champ requis est renseigné', () => {
    const res = validateData(schema, { nom: 'Alice' });
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });
  it('utilise fieldName si label absent', () => {
    const s = { fields: { email: { type: 'email', required: true } } };
    const res = validateData(s, {});
    expect(res.errors[0]).toContain('email');
  });
});

// ── Type number / money ───────────────────────────────────────────────────────
describe('validateData — type number', () => {
  const schema = {
    fields: {
      montant: { type: 'number', label: 'Montant' },
    },
  };

  it('accepte un entier', () => {
    expect(validateData(schema, { montant: 42 }).valid).toBe(true);
  });
  it('accepte un float', () => {
    expect(validateData(schema, { montant: 3.14 }).valid).toBe(true);
  });
  it('accepte une string numérique', () => {
    expect(validateData(schema, { montant: '100.50' }).valid).toBe(true);
  });
  it('échoue sur une string non-numérique', () => {
    const res = validateData(schema, { montant: 'abc' });
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain('Montant');
  });
  it('passe la vérification si vide et non-requis', () => {
    expect(validateData(schema, {}).valid).toBe(true);
  });
});

describe('validateData — type money', () => {
  const schema = {
    fields: {
      prix: { type: 'money', label: 'Prix' },
    },
  };

  it('accepte un nombre', () => {
    expect(validateData(schema, { prix: 99.99 }).valid).toBe(true);
  });
  it('échoue sur NaN string', () => {
    expect(validateData(schema, { prix: 'not-a-price' }).valid).toBe(false);
  });
});

// ── Type email ────────────────────────────────────────────────────────────────
describe('validateData — type email', () => {
  const schema = {
    fields: {
      courriel: { type: 'email', label: 'Email' },
    },
  };

  it('accepte un email valide', () => {
    expect(validateData(schema, { courriel: 'alice@example.com' }).valid).toBe(true);
  });
  it('accepte un email avec sous-domaine', () => {
    expect(validateData(schema, { courriel: 'user@mail.company.io' }).valid).toBe(true);
  });
  it('échoue sans @', () => {
    const res = validateData(schema, { courriel: 'invalid-email' });
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain('Email');
  });
  it('échoue sans domaine', () => {
    expect(validateData(schema, { courriel: 'user@' }).valid).toBe(false);
  });
  it('échoue sans TLD', () => {
    expect(validateData(schema, { courriel: 'user@domain' }).valid).toBe(false);
  });
  it('passe si vide et non-requis', () => {
    expect(validateData(schema, {}).valid).toBe(true);
  });
});

// ── Type selection / select ───────────────────────────────────────────────────
describe('validateData — type selection', () => {
  const schema = {
    fields: {
      statut: {
        type: 'selection',
        label: 'Statut',
        options: ['Actif', 'Inactif', 'Suspendu'],
      },
    },
  };

  it('accepte une valeur dans les options', () => {
    expect(validateData(schema, { statut: 'Actif' }).valid).toBe(true);
  });
  it('échoue pour une valeur hors options', () => {
    const res = validateData(schema, { statut: 'Inconnu' });
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain('Statut');
  });
  it('passe si vide et non-requis', () => {
    expect(validateData(schema, {}).valid).toBe(true);
  });
});

describe('validateData — type select avec options objet { value }', () => {
  const schema = {
    fields: {
      role: {
        type: 'select',
        label: 'Rôle',
        options: [
          { value: 'admin', label: 'Administrateur' },
          { value: 'user', label: 'Utilisateur' },
        ],
      },
    },
  };

  it('accepte une valeur .value valide', () => {
    expect(validateData(schema, { role: 'admin' }).valid).toBe(true);
  });
  it('échoue pour une valeur .value inconnue', () => {
    expect(validateData(schema, { role: 'superuser' }).valid).toBe(false);
  });
});

// ── Plusieurs champs / erreurs multiples ──────────────────────────────────────
describe('validateData — erreurs multiples', () => {
  const schema = {
    fields: {
      nom: { type: 'text', required: true, label: 'Nom' },
      email: { type: 'email', required: true, label: 'Email' },
    },
  };

  it('collecte toutes les erreurs en une passe', () => {
    const res = validateData(schema, {});
    expect(res.valid).toBe(false);
    expect(res.errors).toHaveLength(2);
  });
  it('retourne valid:true si tous les champs sont corrects', () => {
    const res = validateData(schema, { nom: 'Bob', email: 'bob@corp.com' });
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });
});

// ── Type inconnu (default case) ───────────────────────────────────────────────
describe('validateData — type inconnu', () => {
  const schema = {
    fields: {
      note: { type: 'textarea', label: 'Note' },
    },
  };

  it("ne génère pas d'erreur pour un type non géré", () => {
    expect(validateData(schema, { note: 'quelque chose' }).valid).toBe(true);
  });
});
