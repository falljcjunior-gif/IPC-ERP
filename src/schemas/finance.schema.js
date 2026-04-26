/**
 * ══════════════════════════════════════════════════════════════════
 * FINANCE DOMAIN SCHEMAS
 * ══════════════════════════════════════════════════════════════════
 * 
 * WHY: Validation stricte des flux financiers.
 * Ne faites jamais confiance au client.
 */

const validatePositive = (val, fieldName) => {
  const num = Number(val);
  if (isNaN(num) || num < 0) {
    throw new Error(`[FinanceSchema] Le champ '${fieldName}' doit être un nombre positif.`);
  }
  return num;
};

export const FinanceSchemas = {
  
  /**
   * TRANSACTION (Cash/Bank)
   */
  transaction: (data) => {
    if (!data.amount) throw new Error('[FinanceSchema] Montant transaction obligatoire');
    return {
      type: data.type || 'expense', 
      amount: validatePositive(data.amount, 'amount'),
      currency: 'FCFA',
      category: data.category || 'other',
      description: data.description || '',
      date: data.date || new Date().toISOString(),
      isValidated: false,
      _domain: 'finance'
    };
  },

  /**
   * INVOICE (Client/Vendor)
   */
  invoice: (data) => {
    const amountHT = validatePositive(data.amountHT || data.amount, 'amountHT'); // Accepte amount par souplesse
    return {
      num: data.num || `INV-${Date.now()}`,
      type: data.type || 'client',
      clientName: data.clientName || 'Inconnu',
      amountHT: amountHT,
      tva: Number(data.tva) || 0,
      amountTTC: amountHT * 1.18, 
      status: data.status || 'draft',
      dueDate: data.dueDate || '',
      items: data.items || [],
      _domain: 'finance'
    };
  },

  /**
   * ACCOUNTING ENTRY (Double-Entry)
   */
  accountingEntry: (data) => {
    return {
      num: data.num || '',
      libelle: data.libelle || '',
      debit: validatePositive(data.debit || 0, 'debit'),
      credit: validatePositive(data.credit || 0, 'credit'),
      account: data.account || '',
      period: data.period || new Date().getMonth() + 1,
      _domain: 'finance'
    };
  }
};
