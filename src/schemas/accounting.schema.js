/**
 * Accounting Module Schema
 * Defines the Chart of Accounts and Journal Entries
 */
export const accountingSchema = {
  id: 'accounting',
  label: 'Comptabilité',
  models: {
    accounts: {
      label: 'Nomenclature du Plan Comptable',
      dataPath: 'finance.accounts',
      fields: {
        code: { label: 'Numéro de Compte', type: 'text', required: true, search: true, placeholder: 'Ex: 411000' },
        label: { label: 'Libellé du Compte', type: 'text', required: true, search: true, placeholder: 'Ex: Clients Collectifs' },
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
      label: 'Registre du Grand Livre',
      dataPath: 'finance.lines',
      fields: {
        date: { label: 'Date', type: 'date', required: true, search: true },
        libelle: { label: 'Libellé de l\'Écriture', type: 'text', required: true, search: true, placeholder: 'Ex: Règlement Facture F-2024-001' },
        piece: { label: 'Réf. Pièce Justificative', type: 'text', search: true, placeholder: 'Ex: CHQ-88271' },
        journalCode: { label: 'Code Journal', type: 'text', search: true, placeholder: 'Ex: BQ (Banque)' },
        debit: { label: 'Débit', type: 'money', currency: 'FCFA' },
        credit: { label: 'Crédit', type: 'money', currency: 'FCFA' },
        analyticAccount: { label: 'Compte Analytique', type: 'text', search: true },
        profitCenter: { label: 'Centre de Profit', type: 'selection', options: ['Usine', 'Logistique', 'Ventes', 'Administration'], search: true }
      },
      views: {
        list: ['date', 'piece', 'libelle', 'debit', 'credit', 'profitCenter'],
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
