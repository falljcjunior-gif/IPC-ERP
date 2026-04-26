/**
 * ══════════════════════════════════════════════════════════════════
 * FINANCE STATE SLICE (ZUSTAND)
 * ══════════════════════════════════════════════════════════════════
 * 
 * WHY: Isolation de l'état réactif financier.
 * Ce slice est purement piloté par les services.
 */

import { FinanceService } from '../../../services/finance.service';
import logger from '../../../utils/logger';

export const createFinanceSlice = (set, get) => ({
  finance: {
    data: {
      transactions: [],
      invoices: [],
      accounting: [],
      balances: { cash: 0, bank: 0 }
    },
    loading: false,
    error: null
  },

  financeActions: {
    /**
     * 🔄 INITIALISATION TEMPS RÉEL (ISOLÉE)
     */
    initFinance: () => {
      const { unsubscribeTransactions, unsubscribeInvoices } = get().finance.subscriptions || {};
      if (unsubscribeTransactions) unsubscribeTransactions();
      if (unsubscribeInvoices) unsubscribeInvoices();

      const subT = FirestoreService.subscribeToCollection('finance_transactions', (docs) => {
        set(state => ({ finance: { ...state.finance, data: { ...state.finance.data, transactions: docs } } }));
      });

      const subI = FirestoreService.subscribeToCollection('finance_invoices', (docs) => {
        set(state => ({ finance: { ...state.finance, data: { ...state.finance.data, invoices: docs } } }));
      });

      set(state => ({ 
        finance: { 
          ...state.finance, 
          subscriptions: { unsubscribeTransactions: subT, unsubscribeInvoices: subI } 
        } 
      }));
    },

    cleanupFinance: () => {
      const { unsubscribeTransactions, unsubscribeInvoices } = get().finance.subscriptions || {};
      unsubscribeTransactions?.();
      unsubscribeInvoices?.();
    },

    /**
     * Action orchestrée : Enregistre une transaction
     */
    addTransaction: async (data) => {
      set(state => ({ finance: { ...state.finance, loading: true } }));
      try {
        const id = await FinanceService.createTransaction(data);
        // L'UI sera mise à jour via le listener FirestoreService.subscribeToCollection
        // Mais nous logguons l'action ici
        get().logAction?.('Trésorerie', `Ajout transaction: ${data.description}`, 'finance');
        return id;
      } catch (err) {
        set(state => ({ finance: { ...state.finance, error: err.message, loading: false } }));
        throw err;
      }
    },

    /**
     * Traite un paiement de facture avec génération comptable automatique
     */
    payInvoice: async (invoiceId, amount) => {
      try {
        // Logique "Waterfall" : Paiement -> Comptabilité
        await FinanceService.createTransaction({
          amount,
          type: 'income',
          description: `Paiement Facture #${invoiceId}`
        });

        await FinanceService.generateAccountingEntry(
          `Règlement Facture #${invoiceId}`,
          amount,
          '512000', // Compte Banque
          '411000'  // Compte Client
        );

        get().addHint?.({ 
          title: "Paiement Validé", 
          message: "Transaction cash + Écriture comptable générées.",
          type: 'success', 
          appId: 'finance' 
        });
      } catch (err) {
        logger.error('FinanceSlice:payInvoice', err);
      }
    }
  }
});
