/**
 * ══════════════════════════════════════════════════════════════════
 * SALES STATE SLICE (ZUSTAND)
 * ══════════════════════════════════════════════════════════════════
 */

import { SalesService } from '../../../services/sales.service';
import { FirestoreService } from '../../../services/firestore.service';

export const createSalesSlice = (set, get) => ({
  sales: {
    leads: [],
    invoices: [],
    pipeline: { prospect: [], qualified: [], closed: [] },
    loading: false
  },

  salesActions: {
    initSales: () => {
      FirestoreService.subscribeToCollection('sales_leads', (docs) => {
        set(state => ({ sales: { ...state.sales, leads: docs } }));
      });
      FirestoreService.subscribeToCollection('sales_invoices', (docs) => {
        set(state => ({ sales: { ...state.sales, invoices: docs } }));
      });
    },

    addLead: async (data) => {
      set(state => ({ sales: { ...state.sales, loading: true } }));
      try {
        await SalesService.createLead(data);
        get().logAction?.('CRM', `Nouveau prospect: ${data.nom}`, 'sales');
      } finally {
        set(state => ({ sales: { ...state.sales, loading: false } }));
      }
    }
  }
});
