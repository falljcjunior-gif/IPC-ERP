/**
 * Project Module Schema
 * Defines structure for Projects and Tasks
 */
export const projectSchema = {
  id: 'projects',
  label: 'Projets',
  models: {
    projects: {
      label: 'Liste des Projets',
      fields: {
        nom: { label: 'Nom du Projet', type: 'text', required: true, search: true },
        client: { label: 'Client', type: 'text', required: true, search: true },
        dateDebut: { label: 'Date Début', type: 'date' },
        echeance: { label: 'Échéance', type: 'date', search: true },
        budget: { label: 'Budget', type: 'money', currency: 'EUR' },
        chefProjet: { label: 'Chef de Projet', type: 'text', search: true }
      },
      views: {
        list: ['nom', 'client', 'echeance', 'budget', 'chefProjet'],
        kanban: {
          groupField: 'chefProjet',
          titleField: 'nom',
          subtitleField: 'client',
          valueField: 'budget'
        },
        search: {
          filters: [
            { id: 'overdue', label: 'En retard', domain: [['echeance', '<', 'today']] }
          ],
          groups: [
            { id: 'client', label: 'Par Client' },
            { id: 'chefProjet', label: 'Par Chef de Projet' }
          ]
        }
      }
    },
    tasks: {
      label: 'Tâches',
      fields: {
        titre: { label: 'Titre', type: 'text', required: true, search: true },
        projet: { label: 'Projet', type: 'text', search: true },
        equipe: { label: 'Équipe', type: 'selection', options: ['IT', 'Ventes', 'RH', 'Finance', 'Production', 'Marketing'], search: true },
        assigne: { label: 'Assigné à', type: 'text', search: true },
        echeance: { label: 'Échéance', type: 'date', search: true },
        priorite: { label: 'Priorité', type: 'selection', options: ['Basse', 'Moyenne', 'Haute'], search: true },
        statut: { label: 'Statut', type: 'selection', options: ['À faire', 'En cours', 'Terminé'], default: 'À faire' },
        progression: { label: 'Avancement (%)', type: 'number' }
      },
      views: {
        list: ['titre', 'projet', 'equipe', 'assigne', 'echeance', 'priorite', 'statut', 'progression'],
        kanban: {
          groupField: 'statut',
          titleField: 'titre',
          subtitleField: 'assigne',
          valueField: 'progression'
        },
        search: {
          filters: [
            { id: 'high_priority', label: 'Priorité Haute', domain: [['priorite', '==', 'Haute']] },
            { id: 'my_tasks', label: 'Mes Tâches', domain: [['assigne', '==', 'currentUser']] }
          ],
          groups: [
            { id: 'projet', label: 'Par Projet' },
            { id: 'equipe', label: 'Par Équipe' },
            { id: 'statut', label: 'Par État' }
          ]
        }
      }
    }
  }
};
