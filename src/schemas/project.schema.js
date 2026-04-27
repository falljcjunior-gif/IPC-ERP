/**
 * Project Module Schema
 * Defines structure for Projects and Tasks
 */
export const projectSchema = {
  id: 'projects',
  label: 'Projets',
  models: {
    projects: {
      label: 'Portefeuille de Projets & Chantiers',
      fields: {
        nom: { label: 'Intitulé de l\'Opération', type: 'text', required: true, search: true, placeholder: 'Ex: Aménagement Zone Industrielle' },
        client: { label: 'Maître d\'Ouvrage / Partenaire', type: 'text', required: true, search: true, placeholder: 'Sélectionner un client...' },
        dateDebut: { label: 'Date Début', type: 'date' },
        echeance: { label: 'Échéance', type: 'date', search: true },
        budget: { label: 'Engagement Budgétaire (FCFA)', type: 'money', currency: 'FCFA' },
        chefProjet: { label: 'Chef de Projet', type: 'text', search: true },
        colonnes: { label: 'Colonnes (Trello)', type: 'json', default: [{ id: 'col1', title: 'À faire' }, { id: 'col2', title: 'En cours' }, { id: 'col3', title: 'Terminé' }] },
        rules: { label: 'Règles Butler', type: 'json', default: [] },
        customFields: { label: 'Champs Personnalisés', type: 'json', default: [] }
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
      label: 'Actions & Jalons Opérationnels',
      fields: {
        titre: { label: 'Libellé de l\'Action Stratégique', type: 'text', required: true, search: true, placeholder: 'Ex: Coulage de la dalle R+1' },
        projet: { label: 'Opération de Rattachement', type: 'text', search: true },
        equipe: { label: 'Cellule / Département Responsable', type: 'selection', options: ['Direction Générale', 'IT', 'Ventes', 'RH', 'Finance', 'Production', 'Marketing', 'Logistique'], search: true },
        assigne: { label: 'Chargé de Mission', type: 'text', search: true },
        echeance: { label: 'Date Limite de Réalisation', type: 'date', search: true },
        priorite: { label: 'Indice de Criticité', type: 'selection', options: ['Mineure', 'Importante', 'Critique'], search: true },
        colonneId: { label: 'Colonne', type: 'text', default: 'col1' },
        position: { label: 'Ordre de Priorité', type: 'number', default: 0 },
        description: { label: 'Consignes & Précisions', type: 'textarea' },
        progression: { label: 'Taux de Complétion (%)', type: 'number' },
        customData: { label: 'Données Personnalisées', type: 'json', default: {} }
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
