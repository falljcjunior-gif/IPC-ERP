/**
 * OKR Module Schema (Objectives & Key Results)
 * Defines structure for Strategic Goals and Metrics
 */
export const okrSchema = {
  id: 'okr',
  label: 'Missions & Objectifs (OKR)',
  models: {
    objectives: {
      label: 'Objectifs Stratégiques',
      fields: {
        titre: { label: 'Titre de l\'Objectif', type: 'text', required: true, search: true, placeholder: 'Ex: Réduire l\'empreinte carbone de 10%' },
        departement: { label: 'Département Cible', type: 'selection', options: ['Direction', 'Finance', 'RH', 'Production', 'Logistique', 'Global'], default: 'Global', search: true },
        trimestre: { label: 'Trimestre / Période', type: 'selection', options: ['Q1', 'Q2', 'Q3', 'Q4', 'Annuel'], default: 'Annuel' },
        statut: { label: 'Statut', type: 'selection', options: ['Planifié', 'En cours', 'Atteint', 'En retard', 'Abandonné'], default: 'Planifié' },
        owner: { label: 'Propriétaire (Directeur)', type: 'text', search: true },
        progressionGlobale: { label: 'Progression Globale (%)', type: 'number', readonly: true, default: 0 }
      },
      views: {
        list: ['titre', 'departement', 'trimestre', 'progressionGlobale', 'statut'],
        kanban: {
          groupField: 'statut',
          titleField: 'titre',
          subtitleField: 'departement',
          valueField: 'progressionGlobale'
        },
        search: {
          groups: [
            { id: 'departement', label: 'Par Département' },
            { id: 'statut', label: 'Par Statut' }
          ]
        }
      }
    },
    key_results: {
      label: 'Résultats Clés (KPIs)',
      fields: {
        objectiveId: { label: 'Objectif Parent', type: 'text', required: true, search: true },
        titre: { label: 'Résultat Clé', type: 'text', required: true, placeholder: 'Ex: Augmenter le CA de 20%' },
        metricType: { label: 'Type de Métrique', type: 'selection', options: ['Pourcentage', 'Devise (FCFA)', 'Unité'], default: 'Pourcentage' },
        valeurCible: { label: 'Valeur Cible', type: 'number', required: true },
        valeurActuelle: { label: 'Valeur Actuelle', type: 'number', default: 0 },
        sourceAutomatique: { label: 'Liaison Automatique', type: 'selection', options: ['Aucune (Manuel)', 'Chiffre d\'Affaires', 'Trésorerie', 'Effectif RH', 'Taux de Conversion CRM'], default: 'Aucune (Manuel)' }
      },
      views: {
        list: ['titre', 'metricType', 'valeurActuelle', 'valeurCible']
      }
    }
  }
};
