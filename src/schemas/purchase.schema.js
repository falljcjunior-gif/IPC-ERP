/**
 * Purchase Module Schema
 * Defines structure for Purchase Orders and Vendors
 */
export const purchaseSchema = {
  id: 'purchase',
  label: 'Achats',
  models: {
    orders: {
      label: 'Demandes d\'Achats & Commandes',
      fields: {
        num: { label: 'Code de l\'Engagement d\'Achat', type: 'text', required: true, search: true, placeholder: 'Ex: PO-2024-001' },
        fournisseur: { label: 'Entité Fournisseur', type: 'text', required: true, search: true, placeholder: 'Sélectionner un fournisseur...' },
        produitId: { label: 'Article de Destination', type: 'text', search: true },
        qte: { label: 'Volume de Commande', type: 'number' },
        date: { label: 'Date d\'Émission', type: 'date', required: true },
        echeance: { label: 'Date de Livraison Contractuelle', type: 'date' },
        total: { label: 'Montant de l\'Engagement (HT)', type: 'money', currency: 'FCFA', search: true },
        statut: { 
          label: 'Phase de l\'Approvisionnement', 
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
      label: 'Base Fournisseurs',
      dataPath: 'base.contacts',
      staticDomain: [['type', '==', 'Fournisseur']],
      fields: {
        nom: { label: 'Raison Sociale Fournisseur', type: 'text', required: true, search: true, placeholder: 'Ex: Africa Cement SA' },
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
