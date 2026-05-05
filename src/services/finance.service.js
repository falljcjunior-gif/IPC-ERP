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
   * ⚖️ ÉQUILIBRE COMPTABLE (Double Entrée)
   * Valide que le total des débits égale le total des crédits.
   */
  validateBalance(lines) {
    const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
    const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Écriture déséquilibrée ! Débit: ${totalDebit} ≠ Crédit: ${totalCredit}`);
    }
    return true;
  },

  /**
   * Génération d'écriture comptable certifiée
   */
  async generateAccountingEntry(label, lines) {
    try {
      // 1. Validation de l'équilibre
      this.validateBalance(lines);

      // 2. Préparation de l'écriture
      const entry = {
        libelle: label,
        date: new Date().toISOString(),
        lines: lines.map(l => ({
          account: l.account,
          debit: l.debit || 0,
          credit: l.credit || 0,
          label: l.label || label
        })),
        status: 'VALIDATED',
        _domain: 'finance'
      };

      // 3. Persistance
      const doc = await FirestoreService.addDocument('finance_accounting', entry);
      logger.info('Finance', `Écriture comptable générée : ${label}`, doc.id);
      return { id: doc.id, ...entry };
    } catch (error) {
      logger.error('Finance', 'Échec génération écriture', error);
      throw error;
    }
  }
};
