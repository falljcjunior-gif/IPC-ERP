/**
 * Production Module Schema
 * Defines Manufacturing Orders (OF) and Bill of Materials (BOM)
 */
export const productionSchema = {
  id: 'production',
  label: 'Production',
  models: {
    workOrders: {
      label: 'Ordres de Fabrication',
      fields: {
        num: { label: 'N° OF', type: 'text', required: true, search: true },
        produit: { label: 'Produit', type: 'text', required: true, search: true },
        produitId: { label: 'Article ID', type: 'text' },
        qte: { label: 'Quantité', type: 'number', required: true },
        echeance: { label: 'Échéance', type: 'date', required: true },
        statut: { 
          label: 'Statut', 
          type: 'selection', 
          options: ['Planifié', 'En cours', 'Terminé', 'Annulé'],
          default: 'Planifié'
        },
        priority: { label: 'Priorité', type: 'selection', options: ['Basse', 'Normale', 'Haute', 'Urgente'], default: 'Normale' },
        progression: { label: 'Progression (%)', type: 'number', default: 0 }
      },
      views: {
        list: ['num', 'produit', 'qte', 'echeance', 'statut', 'priority', 'progression'],
        kanban: {
          groupField: 'statut',
          titleField: 'produit',
          subtitleField: 'num',
          valueField: 'qte'
        },
        search: {
          filters: [
            { id: 'in_progress', label: 'En cours', domain: [['statut', '==', 'En cours']] },
            { id: 'finished', label: 'Terminés', domain: [['statut', '==', 'Terminé']] }
          ],
          groups: [
            { id: 'produit', label: 'Par Produit' },
            { id: 'statut', label: 'Par Statut' }
          ]
        }
      }
    },
    boms: {
      label: 'Nomenclatures (BOM)',
      fields: {
        produit: { label: 'Produit Fini', type: 'text', required: true, search: true },
        coutEstime: { label: 'Coût Estimé', type: 'money', currency: 'FCFA', search: true },
        composants: { label: 'Composants', type: 'text' }
      },
      views: {
        list: ['produit', 'coutEstime'],
        search: {
          groups: [
            { id: 'produit', label: 'Par Produit' }
          ]
        }
      }
    }
  }
};
