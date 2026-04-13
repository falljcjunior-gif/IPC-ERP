/**
 * Audit Module Schema (History)
 * Defines structure for Activity Logs
 */
export const auditSchema = {
  id: 'audit',
  label: 'Historique',
  models: {
    logs: {
      label: 'Journal des Activités',
      fields: {
        timestamp: { label: 'Horodatage', type: 'datetime', search: true },
        userName: { label: 'Utilisateur', type: 'text', search: true },
        action: { label: 'Action', type: 'text', search: true },
        details: { label: 'Détails', type: 'text', search: true },
        appId: { 
          label: 'Module', 
          type: 'selection', 
          options: ['crm', 'sales', 'inventory', 'accounting', 'hr', 'production', 'projects', 'system'],
          search: true
        }
      },
      views: {
        list: ['timestamp', 'userName', 'action', 'details', 'appId'],
        search: {
          filters: [
             { id: 'system', label: 'Système', domain: [['appId', '==', 'system']] },
             { id: 'recent', label: 'Aujourd\'hui', domain: [['timestamp', '>', 'today']] }
          ],
          groups: [
             { id: 'appId', label: 'Par Module' },
             { id: 'userName', label: 'Par Utilisateur' }
          ]
        }
      }
    }
  }
};
