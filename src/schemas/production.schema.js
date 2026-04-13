/**
 * Production Module Schema
 * Defines Manufacturing Orders (OF) and Bill of Materials (BOM)
 */
export const productionSchema = {
  id: 'production',
  label: 'Production',
  models: {
    orders: {
      label: 'Ordres de Fabrication',
      fields: {
        num: { label: 'N° OF', type: 'text', required: true, search: true },
        produit: { label: 'Produit', type: 'text', required: true, search: true },
        qte: { label: 'Quantité', type: 'number', required: true },
        echeance: { label: 'Échéance', type: 'date', required: true },
        statut: { 
          label: 'Statut', 
          type: 'selection', 
          options: ['Planifié', 'En cours', 'Terminé', 'Annulé'],
          default: 'Planifié'
        },
        progression: { label: 'Progression (%)', type: 'number' }
      },
      views: {
        list: ['num', 'produit', 'qte', 'echeance', 'statut', 'progression'],
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
