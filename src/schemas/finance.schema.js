/**
 * Finance Module Schema
 * Defines structure for Customer Invoices and Vendor Bills
 */
export const financeSchema = {
  id: 'finance',
  label: 'Finance',
  models: {
    invoices: {
      label: 'Factures Clients',
      fields: {
        num: { label: 'Numéro', type: 'text', required: true, search: true },
        client: { label: 'Client', type: 'text', required: true, search: true },
        date: { label: 'Date', type: 'date', required: true },
        montant: { label: 'Montant TTC', type: 'money', currency: 'FCFA', search: true },
        statut: { 
          label: 'Statut', 
          type: 'selection', 
          options: ['Brouillon', 'Envoyé', 'Payé', 'En retard', 'Annulé'],
          default: 'Brouillon'
        }
      },
      views: {
        list: ['num', 'client', 'date', 'montant', 'statut'],
        kanban: {
          groupField: 'statut',
          titleField: 'num',
          subtitleField: 'client',
          valueField: 'montant'
        },
        search: {
          filters: [
            { id: 'unpaid', label: 'À encaisser', domain: [['statut', '!=', 'Payé']] },
            { id: 'overdue', label: 'En retard', domain: [['statut', '==', 'En retard']] }
          ],
          groups: [
            { id: 'client', label: 'Par Client' },
            { id: 'statut', label: 'Par Statut' }
          ]
        }
      }
    },
    vendor_bills: {
      label: 'Factures Fournisseurs',
      fields: {
        num: { label: 'Référence Fournisseur', type: 'text', required: true, search: true },
        fournisseur: { label: 'Fournisseur', type: 'text', required: true, search: true },
        date: { label: 'Date', type: 'date', required: true },
        montant: { label: 'Montant TTC', type: 'money', currency: 'FCFA' },
        statut: { label: 'Statut', type: 'selection', options: ['À payer', 'Payé', 'Litige'], default: 'À payer' }
      },
      views: {
        list: ['num', 'fournisseur', 'date', 'montant', 'statut'],
        search: {
          filters: [
            { id: 'to_pay', label: 'À régler', domain: [['statut', '==', 'À payer']] }
          ]
        }
      }
    },
    expenses: {
      label: 'Notes de Frais',
      dataPath: 'hr.expenses',
      fields: {
        title: { label: 'Libellé', type: 'text', required: true, search: true },
        amount: { label: 'Montant TTC', type: 'money', currency: 'FCFA', search: true },
        date: { label: 'Date', type: 'date', required: true },
        type: { label: 'Catégorie', type: 'selection', options: ['Transport', 'Repas', 'Hébergement', 'Déplacement', 'Fournitures', 'Autre'], search: true },
        employee: { label: 'Collaborateur', type: 'text', search: true },
        status: { label: 'Statut', type: 'selection', options: ['En attente', 'Approuvé', 'Rejeté', 'Remboursé'], default: 'En attente' }
      },
      views: {
        list: ['date', 'employee', 'title', 'amount', 'type', 'status'],
        kanban: {
          groupField: 'status',
          titleField: 'title',
          subtitleField: 'employee',
          valueField: 'amount'
        },
        search: {
          filters: [
            { id: 'pending', label: 'En attente', domain: [['status', '==', 'En attente']] }
          ],
          groups: [
            { id: 'employee', label: 'Par Collaborateur' },
            { id: 'type', label: 'Par Catégorie' }
          ]
        }
      }
    }
  }
};
