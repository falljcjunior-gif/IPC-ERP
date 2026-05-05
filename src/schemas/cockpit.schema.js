/**
 * Cockpit Module Schema (Strategic Command Center)
 * Defines structure for Global Metrics and Smart Alerts
 */
export const cockpitSchema = {
  id: 'cockpit',
  label: 'Cockpit Stratégique',
  description: 'Centre de commandement C-Level avec agrégation des données et alertes critiques.',
  models: {
    global_metrics: {
      label: 'Métriques Globales (Agrégées)',
      fields: {
        finance: { label: 'Finance', type: 'object' }, // { totalCA, cashFlow, ebitda }
        production: { label: 'Production', type: 'object' }, // { trs, stock_matieres }
        hr: { label: 'Ressources Humaines', type: 'object' }, // { headcount, pulseScore }
        crm: { label: 'Marketing & Ventes', type: 'object' }, // { conversionRate, totalLeads }
        forecasts: { label: 'Prédictions à 30 Jours', type: 'object' }, // { cashFlow30d, alertesRupture }
        lastUpdated: { label: 'Dernière Mise à Jour', type: 'datetime' }
      },
      views: {
        list: ['lastUpdated']
      }
    },
    alerts: {
      label: 'Smart Alerts (Crises)',
      fields: {
        title: { label: 'Titre de l\'alerte', type: 'text', required: true },
        message: { label: 'Détails', type: 'textarea' },
        level: { label: 'Niveau de Criticité', type: 'selection', options: ['WARNING', 'CRITICAL'], default: 'WARNING' },
        sourceModule: { label: 'Module Source', type: 'selection', options: ['Finance', 'Production', 'Logistique', 'RH', 'IT'] },
        statut: { label: 'Statut', type: 'selection', options: ['Active', 'Acquittée', 'Résolue'], default: 'Active' },
        createdAt: { label: 'Date de Détection', type: 'datetime' }
      },
      views: {
        list: ['title', 'level', 'sourceModule', 'statut', 'createdAt']
      }
    }
  }
};
