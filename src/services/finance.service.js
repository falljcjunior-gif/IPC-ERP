/**
 * ══════════════════════════════════════════════════════════════════
 * FINANCE DOMAIN SERVICE
 * ══════════════════════════════════════════════════════════════════
 * 
 * WHY: Isolation de la logique métier financière.
 * Ce service garantit l'intégrité comptable indépendamment de l'UI.
 */

import { FirestoreService } from './firestore.service';
import { FinanceSchemas } from '../schemas/finance.schema';
import logger from '../utils/logger';

export const FinanceService = {

  /**
   * Crée une transaction avec validation de schéma.
   */
  async createTransaction(transactionData) {
    try {
      const validated = FinanceSchemas.transaction(transactionData);
      return await FirestoreService.createDocument('finance_transactions', validated);
    } catch (err) {
      logger.error('FinanceService:createTransaction', err);
      throw err;
    }
  },

  /**
   * 🛡️ 3-WAY MATCH (Logique Anti-Fraude)
   * Vérifie la cohérence entre : 
   * 1. Bon de Commande (PO)
   * 2. Bon de Réception (GRN)
   * 3. Facture Fournisseur
   */
  async validateVendorInvoice(billData, purchaseOrder, receptionNote) {
    const qteCommandee = purchaseOrder.quantity || 0;
    const qteRecue = receptionNote.quantity || 0;
    const qteFacturee = billData.quantity || 0;

    const isMatch = (qteCommandee === qteRecue) && (qteRecue === qteFacturee);

    if (!isMatch) {
       logger.warn('FinanceService:3-Way Match Failure', {
         billNum: billData.num,
         po: purchaseOrder.num,
         note: receptionNote.id
       });
       throw new Error(`Divergence détectée ! Cmd(${qteCommandee}) ≠ Reçue(${qteRecue}) ≠ Fact(${qteFacturee})`);
    }

    return await this.createInvoice({ ...billData, type: 'vendor', status: 'paid' });
  },

  /**
   * Génération de Facture Client
   */
  async createInvoice(invoiceData) {
    try {
      const validated = FinanceSchemas.invoice(invoiceData);
      return await FirestoreService.createDocument('finance_invoices', validated);
    } catch (err) {
      logger.error('FinanceService:createInvoice', err);
      throw err;
    }
  },

  /**
   * Génération d'écriture comptable automatique
   */
  async generateAccountingEntry(label, amount, debitAccount, creditAccount) {
    const entry = FinanceSchemas.accountingEntry({
      libelle: label,
      debit: amount,
      credit: amount,
      account: debitAccount // Simplifié pour démo
    });
    return await FirestoreService.createDocument('finance_accounting', entry);
  }
};
