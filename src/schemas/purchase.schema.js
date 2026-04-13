/**
 * Purchase Module Schema
 * Defines structure for Purchase Orders and Vendors
 */
export const purchaseSchema = {
  id: 'purchase',
  label: 'Achats',
  models: {
    orders: {
      label: 'Bons de Commande',
      fields: {
        num: { label: 'Référence', type: 'text', required: true, search: true },
        fournisseur: { label: 'Fournisseur', type: 'text', required: true, search: true },
        date: { label: 'Date', type: 'date', required: true },
        echeance: { label: 'Livraison Prévue', type: 'date' },
        total: { label: 'Montant HT', type: 'money', currency: 'FCFA', search: true },
        statut: { 
          label: 'Statut', 
          type: 'selection', 
          options: ['Brouillon', 'En approbation', 'Commandé', 'Réceptionné', 'Facturé'],
          default: 'Brouillon'
        }
      },
      views: {
        list: ['num', 'fournisseur', 'date', 'echeance', 'total', 'statut'],
        kanban: {
          groupField: 'statut',
          titleField: 'num',
          subtitleField: 'fournisseur',
          valueField: 'total'
        },
        search: {
          filters: [
            { id: 'to_receive', label: 'À réceptionner', domain: [['statut', '==', 'Commandé']] },
            { id: 'draft', label: 'Brouillons', domain: [['statut', '==', 'Brouillon']] }
          ],
          groups: [
            { id: 'fournisseur', label: 'Par Fournisseur' },
            { id: 'statut', label: 'Par Statut' }
          ]
        }
      }
    },
    vendors: {
      label: 'Fournisseurs',
      dataPath: 'base.contacts',
      staticDomain: [['type', '==', 'Fournisseur']],
      fields: {
        nom: { label: 'Nom', type: 'text', required: true, search: true },
        email: { label: 'Email', type: 'text', search: true },
        contact: { label: 'Contact', type: 'text' },
        categories: { label: 'Catégorie', type: 'text', search: true }
      },
      views: {
        list: ['nom', 'categories', 'email', 'contact'],
        search: {
          groups: [
            { id: 'categories', label: 'Par Catégorie' }
          ]
        }
      }
    }
  }
};
