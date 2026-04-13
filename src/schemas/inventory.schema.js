/**
 * Inventory Module Schema
 * Defines structure for Stock Articles and Movements
 */
export const inventorySchema = {
  id: 'inventory',
  label: 'Stocks',
  models: {
    products: {
      label: 'Articles en Stock',
      fields: {
        code: { label: 'Référence', type: 'text', search: true },
        nom: { label: 'Désignation', type: 'text', required: true, search: true },
        stock: { label: 'En Stock', type: 'number', search: true },
        alerte: { label: 'Seuil Alerte', type: 'number' },
        emplacement: { label: 'Emplacement', type: 'text', search: true },
        coutUnit: { label: 'Coût Unitaire', type: 'money', currency: 'FCFA' }
      },
      views: {
        list: ['code', 'nom', 'stock', 'alerte', 'emplacement', 'coutUnit'],
        search: {
          filters: [
            { id: 'low_stock', label: 'Alertes Stock', domain: [['stock', '<=', 'alerte']] }
          ],
          groups: [
            { id: 'emplacement', label: 'Par Emplacement' }
          ]
        }
      }
    },
    movements: {
      label: 'Mouvements de Stock',
      fields: {
        date: { label: 'Date', type: 'date', search: true },
        produit: { label: 'Article', type: 'text', required: true, search: true },
        type: { 
          label: 'Type', 
          type: 'selection', 
          options: ['Réception', 'Expédition', 'Transfert', 'Ajustement', 'Inventaire'], 
          search: true 
        },
        qte: { label: 'Quantité', type: 'number' },
        ref: { label: 'Document Source', type: 'text', search: true },
        source: { label: 'Source', type: 'text' },
        dest: { label: 'Destination', type: 'text' }
      },
      views: {
        list: ['date', 'produit', 'type', 'qte', 'ref'],
        kanban: {
          groupField: 'type',
          titleField: 'produit',
          subtitleField: 'ref',
          valueField: 'qte'
        },
        search: {
          filters: [
            { id: 'in', label: 'Entrées', domain: [['type', '==', 'Réception']] },
            { id: 'out', label: 'Sorties', domain: [['type', '==', 'Expédition']] }
          ],
          groups: [
            { id: 'type', label: 'Par Type' },
            { id: 'produit', label: 'Par Article' }
          ]
        }
      }
    }
  }
};
