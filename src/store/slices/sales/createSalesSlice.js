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
      const unsubLeads = FirestoreService.subscribeToCollection(
        'sales_leads',
        { orderByField: '_createdAt', descending: true, limit: 500 },
        (docs) => { set(state => ({ sales: { ...state.sales, leads: docs } })); }
      );
      const unsubInvoices = FirestoreService.subscribeToCollection(
        'sales_invoices',
        { orderByField: '_createdAt', descending: true, limit: 500 },
        (docs) => { set(state => ({ sales: { ...state.sales, invoices: docs } })); }
      );
      return () => {
        if (typeof unsubLeads === 'function') unsubLeads();
        if (typeof unsubInvoices === 'function') unsubInvoices();
      };
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
