/**
 * Budget Module Schema
 * Defines structure for Department Budgets and Envelopes
 */
export const budgetSchema = {
  id: 'budget',
  label: 'Budget',
  models: {
    envelopes: {
      label: 'Enveloppes Budgétaires',
      dataPath: 'finance.budgets',
      fields: {
        dept: { label: 'Département', type: 'text', required: true, search: true },
        type: { label: 'Type', type: 'selection', options: ['OPEX', 'CAPEX', 'Provisions'], search: true },
        annee: { label: 'Année', type: 'selection', options: ['2025', '2026', '2027'], default: '2026' },
        prevision: { label: 'Prévisionnel', type: 'money', currency: 'FCFA' },
        realise: { label: 'Réalisé', type: 'money', currency: 'FCFA' },
        engage: { label: 'Engagé', type: 'money', currency: 'FCFA' }
      },
      views: {
        list: ['dept', 'type', 'annee', 'prevision', 'realise', 'engage'],
        search: {
          filters: [
            { id: 'opex', label: 'OPEX uniquement', domain: [['type', '==', 'OPEX']] },
            { id: 'capex', label: 'CAPEX uniquement', domain: [['type', '==', 'CAPEX']] }
          ],
          groups: [
            { id: 'dept', label: 'Par Département' },
            { id: 'annee', label: 'Par Année' }
          ]
        }
      }
    }
  }
};
