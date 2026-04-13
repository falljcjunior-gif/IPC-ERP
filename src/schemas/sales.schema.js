/**
 * Sales Module Schema
 * Defines structure for Quotations, Orders and Product Catalog (Sales View)
 */
export const salesSchema = {
  id: 'sales',
  label: 'Ventes',
  models: {
    orders: {
      label: 'Commandes Client',
      fields: {
        num: { label: 'Référence', type: 'text', required: true, search: true },
        client: { label: 'Client', type: 'text', required: true, search: true },
        date: { label: 'Date', type: 'date', required: true },
        totalHT: { label: 'Total HT', type: 'money', currency: 'FCFA', search: true },
        statut: { 
          label: 'Statut', 
          type: 'selection', 
          options: ['Brouillon', 'Confirmé', 'Livré', 'Facturé', 'Annulé'],
          default: 'Brouillon'
        },
        devise: { label: 'Devise', type: 'selection', options: ['FCFA', 'EUR', 'USD'], default: 'FCFA' }
      },
      views: {
        list: ['num', 'client', 'date', 'totalHT', 'statut'],
        kanban: {
          groupField: 'statut',
          titleField: 'num',
          subtitleField: 'client',
          valueField: 'totalHT'
        },
        search: {
          filters: [
            { id: 'to_invoice', label: 'À facturer', domain: [['statut', '==', 'Livré']] },
            { id: 'draft', label: 'Brouillons', domain: [['statut', '==', 'Brouillon']] }
          ],
          groups: [
            { id: 'client', label: 'Par Client' },
            { id: 'statut', label: 'Par Statut' }
          ]
        }
      }
    },
    products: {
      label: 'Catalogue Articles',
      fields: {
        code: { label: 'Code', type: 'text', search: true },
        nom: { label: 'Désignation', type: 'text', required: true, search: true },
        categorie: { label: 'Catégorie', type: 'selection', options: ['Logiciel', 'Matériel', 'Service', 'Consommable'], search: true },
        prixMoyen: { label: 'Prix de Vente', type: 'money', currency: 'FCFA' },
        type: { label: 'Type', type: 'selection', options: ['Stockable', 'Service', 'Consommable'] }
      },
      views: {
        list: ['code', 'nom', 'categorie', 'prixMoyen', 'type'],
        kanban: {
          groupField: 'categorie',
          titleField: 'nom',
          subtitleField: 'code',
          valueField: 'prixMoyen'
        }
      }
    }
  }
};
