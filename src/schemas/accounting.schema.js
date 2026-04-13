/**
 * Accounting Module Schema
 * Defines the Chart of Accounts and Journal Entries
 */
export const accountingSchema = {
  id: 'accounting',
  label: 'Comptabilité',
  models: {
    accounts: {
      label: 'Plan Comptable',
      dataPath: 'finance.accounts',
      fields: {
        code: { label: 'Code', type: 'text', required: true, search: true },
        label: { label: 'Intitulé', type: 'text', required: true, search: true },
        nature: { label: 'Nature', type: 'selection', options: ['Bilan', 'Gestion'], search: true },
        type: { label: 'Type', type: 'selection', options: ['Actif', 'Passif', 'Charge', 'Produit'], search: true },
        solde: { label: 'Solde', type: 'money', currency: 'FCFA' }
      },
      views: {
        list: ['code', 'label', 'nature', 'type', 'solde'],
        search: {
          filters: [
            { id: 'balance_sheet', label: 'Comptes de Bilan', domain: [['nature', '==', 'Bilan']] },
            { id: 'p_and_l', label: 'Comptes de Gestion', domain: [['nature', '==', 'Gestion']] }
          ],
          groups: [
            { id: 'type', label: 'Par Type' },
            { id: 'nature', label: 'Par Nature' }
          ]
        }
      }
    },
    entries: {
      label: 'Grand Livre',
      dataPath: 'finance.lines',
      fields: {
        date: { label: 'Date', type: 'date', required: true, search: true },
        libelle: { label: 'Libellé', type: 'text', required: true, search: true },
        piece: { label: 'Pièce', type: 'text', search: true },
        journalCode: { label: 'Journal', type: 'text', search: true },
        debit: { label: 'Débit', type: 'money', currency: 'FCFA' },
        credit: { label: 'Crédit', type: 'money', currency: 'FCFA' }
      },
      views: {
        list: ['date', 'piece', 'libelle', 'debit', 'credit'],
        search: {
          groups: [
            { id: 'date', label: 'Par Date' },
            { id: 'journalCode', label: 'Par Journal' }
          ]
        }
      }
    }
  }
};
