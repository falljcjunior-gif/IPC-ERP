/**
 * ══════════════════════════════════════════════════════════════════
 * FINANCE DOMAIN SLICE
 * ══════════════════════════════════════════════════════════════════
 * 
 * WHY: Gestion de l'état financier de l'ERP.
 * Ce slice est purement piloté par les services.
 */

import { FirestoreService } from '../../../services/firestore.service';
import { FinanceService } from '../../../services/finance.service';
import logger from '../../../utils/logger';

export const createFinanceSlice = (set, get) => ({
  finance: {
    data: {
      invoices: [],
      vendorBills: [],
      transactions: [],
      budgets: []
    },
    loading: false,
    error: null
  },

  // Actions
  fetchInvoices: async () => {
    set(state => ({ finance: { ...state.finance, loading: true } }));
    try {
      const invoices = await FirestoreService.getCollection('invoices');
      set(state => ({ finance: { ...state.finance, data: { ...state.finance.data, invoices }, loading: false } }));
    } catch (error) {
      set(state => ({ finance: { ...state.finance, error, loading: false } }));
    }
  },

  createInvoice: async (invoiceData) => {
    try {
      const newInvoice = await FinanceService.createInvoice(invoiceData);
      set(state => ({ 
        finance: { 
          ...state.finance, 
          data: { 
            ...state.finance.data, 
            invoices: [newInvoice, ...state.finance.data.invoices] 
          } 
        } 
      }));
      logger.info('Finance', 'Facture créée avec succès', newInvoice.id);
      return newInvoice;
    } catch (error) {
      logger.error('Finance', 'Échec création facture', error);
      throw error;
    }
  }
});
