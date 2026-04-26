/**
 * ══════════════════════════════════════════════════════════════════
 * PRODUCTION STATE SLICE (ZUSTAND)
 * ══════════════════════════════════════════════════════════════════
 */

import { ProductionService } from '../../../services/production.service';

export const createProductionSlice = (set, get) => ({
  production: {
    orders: [],
    boms: [], // Bill of Materials
    machines: [],
    loading: false
  },

  productionActions: {
    createNewOF: async (data) => {
      set(state => ({ production: { ...state.production, loading: true } }));
      try {
        await ProductionService.startProduction(data);
        get().logAction?.('Production', `Nouvel OF: ${data.produit}`, 'production');
      } finally {
        set(state => ({ production: { ...state.production, loading: false } }));
      }
    }
  }
});
