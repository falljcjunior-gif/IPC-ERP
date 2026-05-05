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
    const currency = data.currency || 'FCFA';
    return {
      num: data.num || `INV-${Date.now()}`,
      type: data.type || 'client',
      clientName: data.clientName || 'Inconnu',
      amountHT: amountHT,
      taxes: data.taxes || [{ name: 'TVA Standard', rate: 18, amount: amountHT * 0.18 }], // Multi-taxes support
      amountTTC: amountHT + (data.taxes ? data.taxes.reduce((acc, t) => acc + t.amount, 0) : amountHT * 0.18), 
      currency: currency, // Multi-currency support
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
  },
  /**
   * MODELS FOR REGISTRY
   */
  models: {
    invoices: {
      label: 'Registre de Facturation Émise',
      fields: {
        num: { label: 'Référence Facture', type: 'text', required: true, search: true },
        clientName: { label: 'Désignation du Tiers', type: 'text', required: true, search: true },
        currency: { label: 'Devise', type: 'selection', options: ['FCFA', 'EUR', 'USD'], default: 'FCFA' },
        amountHT: { label: 'Assiette HT', type: 'money', currency: 'FCFA', required: true },
        amountTTC: { label: 'Total Net à Payer (TTC)', type: 'money', currency: 'FCFA', readonly: true },
        taxes: { label: 'Taxes Appliquées', type: 'json' },
        status: { label: 'État du Recouvrement', type: 'selection', options: ['Brouillon', 'Envoyé', 'Payé', 'En Retard', 'Annulé'], default: 'Brouillon' },
        dueDate: { label: 'Date d\'Échéance de Paiement', type: 'date', required: true }
      },
      views: {
        list: ['num', 'clientName', 'amountTTC', 'status', 'dueDate'],
        search: {
          filters: [
            { id: 'overdue', label: 'Factures en Souffrance', domain: [['status', '==', 'En Retard']] },
            { id: 'paid', label: 'Règlements Encaissés', domain: [['status', '==', 'Payé']] }
          ],
          groups: [
            { id: 'status', label: 'Par État de Recouvrement' }
          ]
        }
      }
    },
    transactions: {
      label: 'Journal de Trésorerie & Flux',
      fields: {
        date: { label: 'Date de Valeur', type: 'date', required: true },
        description: { label: 'Libellé de l\'Opération', type: 'text', required: true, search: true },
        amount: { label: 'Montant de l\'Écriture', type: 'money', currency: 'FCFA', required: true },
        type: { label: 'Sens du Flux', type: 'selection', options: ['Recette', 'Dépense'], default: 'Dépense' },
        category: { label: 'Poste Budgétaire', type: 'selection', options: ['Salaires', 'Achats MP', 'Logistique', 'Loyer', 'Impôts', 'Ventes', 'Autre'] }
      },
      views: {
        list: ['date', 'description', 'amount', 'type', 'category'],
        search: {
          filters: [
            { id: 'revenue', label: 'Flux Entrants', domain: [['type', '==', 'Recette']] },
            { id: 'expense', label: 'Flux Sortants', domain: [['type', '==', 'Dépense']] }
          ],
          groups: [
            { id: 'category', label: 'Par Poste Budgétaire' }
          ]
        }
      }
    }
  }
};

// [COMPAT] Alias pour compatibilité avec l'existant
export const financeSchema = FinanceSchemas;
