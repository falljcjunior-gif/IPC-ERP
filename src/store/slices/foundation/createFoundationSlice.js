/**
 * ══════════════════════════════════════════════════════════════════
 * FOUNDATION STORE SLICE — IPC Collect Foundation
 * ══════════════════════════════════════════════════════════════════
 *
 * Isolated state management for the Foundation subsidiary.
 * All data references foundation_* Firestore collections.
 *
 * RBAC: FOUNDATION_ADMIN | FOUNDATION_STAFF | SUPER_ADMIN | ADMIN
 */
import {
  FoundationFinanceSchema,
  FoundationEmployeeSchema,
  FoundationCollecteurSchema,
  FoundationCentreSchema,
  FoundationCollecteSchema,
  FoundationExpenseSchema,
  isFoundationAuthorized,
} from '../../../schemas/foundation.schema';

const FOUNDATION_ROLES = ['FOUNDATION_ADMIN', 'FOUNDATION_STAFF', 'SUPER_ADMIN', 'ADMIN'];

export const createFoundationSlice = (set, get) => ({

  // ── Foundation-scoped state ────────────────────────────────────────
  foundation: {
    finance: {
      dons: [],
      decaissements: [],
      journal: [],
    },
    employees: [],
    conges: [],
    paies: [],
    collecteurs: [],
    centres: [],
    collectes: [],
    expenses: [],
    // UI state
    loading: false,
    error: null,
  },

  // ── Guard: check authorization before any mutation ─────────────────
  _foundationGuard: () => {
    const role = get().userRole;
    if (!FOUNDATION_ROLES.includes(role)) {
      console.error('[Foundation] Accès refusé — rôle:', role);
      throw new Error('Accès non autorisé au module Foundation.');
    }
    return true;
  },

  // ── Setters ────────────────────────────────────────────────────────
  setFoundation: (updater) => set((state) => ({
    foundation: typeof updater === 'function'
      ? updater(state.foundation)
      : { ...state.foundation, ...updater },
  })),

  setFoundationLoading: (loading) => set((state) => ({
    foundation: { ...state.foundation, loading },
  })),

  setFoundationError: (error) => set((state) => ({
    foundation: { ...state.foundation, error },
  })),

  // ══════════════════════════════════════════════════════════════════
  // FINANCE: Dons & Décaissements
  // ══════════════════════════════════════════════════════════════════

  addFoundationDon: (data) => {
    get()._foundationGuard();
    try {
      const don = FoundationFinanceSchema.don({
        ...data,
        _createdBy: get().user?.id || null,
      });
      // Also create a journal entry (credit)
      const entry = FoundationFinanceSchema.ecritureJournal({
        libelle: `Don de ${don.donateur} — ${don.projet_cible}`,
        credit: don.montant,
        debit: 0,
        reference_source: don.id,
      });
      set((state) => ({
        foundation: {
          ...state.foundation,
          finance: {
            ...state.foundation.finance,
            dons: [...state.foundation.finance.dons, don],
            journal: [...state.foundation.finance.journal, entry],
          },
        },
      }));
      return { success: true, don, entry };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  addFoundationDecaissement: (data) => {
    get()._foundationGuard();
    try {
      const dec = FoundationFinanceSchema.decaissement({
        ...data,
        _createdBy: get().user?.id || null,
      });
      set((state) => ({
        foundation: {
          ...state.foundation,
          finance: {
            ...state.foundation.finance,
            decaissements: [...state.foundation.finance.decaissements, dec],
          },
        },
      }));
      return { success: true, decaissement: dec };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  approveFoundationDecaissement: (decId) => {
    const role = get().userRole;
    if (!['FOUNDATION_ADMIN', 'SUPER_ADMIN', 'ADMIN'].includes(role)) {
      return { success: false, error: 'Seul un FOUNDATION_ADMIN peut approuver un décaissement.' };
    }
    set((state) => {
      const dec = state.foundation.finance.decaissements.find(d => d.id === decId);
      if (!dec) return state;
      const updated = {
        ...dec,
        statut: 'approuve',
        approuve_par: state.user?.nom || state.user?.email || 'Admin',
        approuve_le: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };
      // Create debit journal entry on approval
      const entry = FoundationFinanceSchema.ecritureJournal({
        libelle: `Décaissement — ${dec.beneficiaire}: ${dec.motif}`,
        debit: dec.montant,
        credit: 0,
        reference_source: dec.id,
      });
      return {
        foundation: {
          ...state.foundation,
          finance: {
            ...state.foundation.finance,
            decaissements: state.foundation.finance.decaissements.map(d => d.id === decId ? updated : d),
            journal: [...state.foundation.finance.journal, entry],
          },
        },
      };
    });
    return { success: true };
  },

  // ══════════════════════════════════════════════════════════════════
  // EMPLOYEES
  // ══════════════════════════════════════════════════════════════════

  addFoundationEmployee: (data) => {
    get()._foundationGuard();
    try {
      const emp = FoundationEmployeeSchema.employee({
        ...data,
        _createdBy: get().user?.id || null,
      });
      set((state) => ({
        foundation: {
          ...state.foundation,
          employees: [...state.foundation.employees, emp],
        },
      }));
      return { success: true, employee: emp };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  addFoundationConge: (data) => {
    get()._foundationGuard();
    try {
      const conge = FoundationEmployeeSchema.conge(data);
      set((state) => ({
        foundation: {
          ...state.foundation,
          conges: [...state.foundation.conges, conge],
        },
      }));
      return { success: true, conge };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  approveFoundationConge: (congeId, approved = true) => {
    const role = get().userRole;
    if (!['FOUNDATION_ADMIN', 'SUPER_ADMIN', 'ADMIN'].includes(role)) {
      return { success: false, error: 'Non autorisé.' };
    }
    set((state) => ({
      foundation: {
        ...state.foundation,
        conges: state.foundation.conges.map(c =>
          c.id === congeId
            ? {
                ...c,
                statut: approved ? 'approuve' : 'rejete',
                approuve_par: state.user?.nom || 'Admin',
                approuve_le: new Date().toISOString(),
              }
            : c
        ),
      },
    }));
    return { success: true };
  },

  // ══════════════════════════════════════════════════════════════════
  // COLLECTEURS
  // ══════════════════════════════════════════════════════════════════

  addFoundationCollecteur: (data) => {
    get()._foundationGuard();
    try {
      const col = FoundationCollecteurSchema.collecteur({
        ...data,
        _createdBy: get().user?.id || null,
      });
      set((state) => ({
        foundation: {
          ...state.foundation,
          collecteurs: [...state.foundation.collecteurs, col],
        },
      }));
      return { success: true, collecteur: col };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // ══════════════════════════════════════════════════════════════════
  // CENTRES
  // ══════════════════════════════════════════════════════════════════

  addFoundationCentre: (data) => {
    get()._foundationGuard();
    try {
      const ctr = FoundationCentreSchema.centre({
        ...data,
        _createdBy: get().user?.id || null,
      });
      set((state) => ({
        foundation: {
          ...state.foundation,
          centres: [...state.foundation.centres, ctr],
        },
      }));
      return { success: true, centre: ctr };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // ══════════════════════════════════════════════════════════════════
  // COLLECTES (Tracking Plastique)
  // ══════════════════════════════════════════════════════════════════

  addFoundationCollecte: (data) => {
    get()._foundationGuard();
    try {
      const raw = FoundationCollecteSchema.collecte({
        ...data,
        _createdBy: get().user?.id || null,
      });
      // Calculate total
      const collecte = { ...raw, montant_total: raw.poids_kg * raw.prix_kg };
      set((state) => ({
        foundation: {
          ...state.foundation,
          collectes: [...state.foundation.collectes, collecte],
        },
      }));
      return { success: true, collecte };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  updateCollecteStatut: (collecteId, newStatut) => {
    get()._foundationGuard();
    const validStatuts = ['recu', 'pese', 'trie', 'recycle'];
    if (!validStatuts.includes(newStatut)) {
      return { success: false, error: `Statut invalide: ${newStatut}` };
    }
    set((state) => ({
      foundation: {
        ...state.foundation,
        collectes: state.foundation.collectes.map(c =>
          c.id === collecteId ? { ...c, statut: newStatut, _updatedAt: new Date().toISOString() } : c
        ),
      },
    }));
    return { success: true };
  },

  // ══════════════════════════════════════════════════════════════════
  // EXPENSES (Notes de Frais)
  // ══════════════════════════════════════════════════════════════════

  addFoundationExpense: (data) => {
    get()._foundationGuard();
    try {
      const exp = FoundationExpenseSchema.expense({
        ...data,
        _createdBy: get().user?.id || null,
      });
      set((state) => ({
        foundation: {
          ...state.foundation,
          expenses: [...state.foundation.expenses, exp],
        },
      }));
      return { success: true, expense: exp };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  approveFoundationExpense: (expId, approved = true, comment = '') => {
    const role = get().userRole;
    if (!['FOUNDATION_ADMIN', 'SUPER_ADMIN', 'ADMIN'].includes(role)) {
      return { success: false, error: 'Non autorisé.' };
    }
    set((state) => ({
      foundation: {
        ...state.foundation,
        expenses: state.foundation.expenses.map(e =>
          e.id === expId
            ? {
                ...e,
                statut: approved ? 'approuve' : 'rejete',
                commentaire: comment || (approved ? 'Validé par le responsable Foundation.' : 'Rejeté.'),
                approuve_par: state.user?.nom || 'Admin',
                approuve_le: new Date().toISOString(),
                _updatedAt: new Date().toISOString(),
              }
            : e
        ),
      },
    }));
    return { success: true };
  },

  // ══════════════════════════════════════════════════════════════════
  // COMPUTED HELPERS
  // ══════════════════════════════════════════════════════════════════

  getFoundationSolde: () => {
    const { journal } = get().foundation.finance;
    const totalCredits = journal.reduce((acc, e) => acc + (e.credit || 0), 0);
    const totalDebits  = journal.reduce((acc, e) => acc + (e.debit || 0), 0);
    return totalCredits - totalDebits;
  },

  getFoundationTonnageTotal: () => {
    return get().foundation.collectes.reduce((acc, c) => acc + (c.poids_kg || 0), 0);
  },

  getFoundationMasseSalariale: () => {
    return get().foundation.employees
      .filter(e => e.statut === 'Actif')
      .reduce((acc, e) => acc + (e.salaire || 0), 0);
  },
});
