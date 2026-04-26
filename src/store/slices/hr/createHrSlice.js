/**
 * ══════════════════════════════════════════════════════════════════
 * HR STATE SLICE (ZUSTAND)
 * ══════════════════════════════════════════════════════════════════
 */

export const createHrSlice = (set, get) => ({
  hr: {
    employees: [],
    attendance: [],
    payroll: [],
    loading: false
  },

  hrActions: {
    hireEmployee: async (data) => {
      set(state => ({ hr: { ...state.hr, loading: true } }));
      try {
        // Logique de recrutement isolée
        get().logAction?.('RH', `Recrutement: ${data.nom}`, 'hr');
      } finally {
        set(state => ({ hr: { ...state.hr, loading: false } }));
      }
    }
  }
});
