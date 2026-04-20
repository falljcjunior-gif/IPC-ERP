/**
 * HR Module Schema
 * Defines the structure for Employees, Candidates, and Leaves
 */
export const hrSchema = {
  id: 'hr',
  label: 'RH',
  models: {
    employees: {
      label: 'Collaborateurs',
      fields: {
        nom: { label: 'Nom Complet', type: 'text', required: true, search: true },
        poste: { label: 'Poste / Fonction', type: 'text', required: true, search: true },
        dept: { label: 'Département', type: 'selection', options: ['Direction', 'Finance', 'RH', 'IT', 'Ventes', 'Production', 'Logistique'], search: true },
        email: { label: 'Email Pro', type: 'email', search: true },
        salaire: { label: 'Salaire Brut', type: 'money', currency: 'FCFA' },
        active: { label: 'Actif', type: 'boolean', default: true }
      },
      views: {
        list: ['nom', 'poste', 'dept', 'email', 'active'],
        kanban: {
          groupField: 'dept',
          titleField: 'nom',
          subtitleField: 'poste'
        },
        search: {
          filters: [
            { id: 'active', label: 'Employés Actifs', domain: [['active', '==', true]] },
            { id: 'it', label: 'Équipe IT', domain: [['dept', '==', 'IT']] }
          ],
          groups: [
            { id: 'dept', label: 'Par Département' },
            { id: 'poste', label: 'Par Poste' }
          ]
        }
      }
    },
    candidates: {
      label: 'Candidats',
      fields: {
        nom: { label: 'Nom Complet', type: 'text', required: true, search: true },
        poste: { label: 'Poste visé', type: 'text', search: true },
        status: { label: 'Étape', type: 'selection', options: ['Top of Funnel', 'Entretien Tech', 'Entretien Manager', 'Offre envoyée'], default: 'Top of Funnel' },
        email: { label: 'Email', type: 'email' },
        score: { label: 'Score Match (%)', type: 'number' }
      },
      views: {
        list: ['nom', 'poste', 'status', 'score'],
        kanban: {
          groupField: 'status',
          titleField: 'nom',
          subtitleField: 'poste',
          valueField: 'score'
        }
      }
    },
    timesheets: {
      label: 'Pointages',
      fields: {
        date: { label: 'Date', type: 'date', required: true, search: true },
        collaborateur: { label: 'Collaborateur', type: 'text', required: true, search: true },
        projet: { label: 'Projet / Centre Coût', type: 'text', search: true },
        tache: { label: 'Tâche', type: 'text', search: true },
        heures: { label: 'Durée (heures)', type: 'number', required: true },
        facturable: { label: 'Facturable', type: 'boolean', default: false },
        statut: { label: 'Statut', type: 'selection', options: ['En attente', 'Validé', 'Refusé'], default: 'En attente' }
      },
      views: {
        list: ['date', 'collaborateur', 'projet', 'heures', 'facturable', 'statut'],
        search: {
          filters: [
            { id: 'pending', label: 'En attente', domain: [['statut', '==', 'En attente']] }
          ],
          groups: [
            { id: 'collaborateur', label: 'Par Collaborateur' },
            { id: 'projet', label: 'Par Projet' }
          ]
        }
      }
    },
    leaves: {
      label: 'Congés & Absences',
      fields: {
        collaborateur: { label: 'Collaborateur', type: 'text', required: true, search: true },
        type: { label: 'Type', type: 'selection', options: ['Congé Payé', 'Maladie', 'Maternité', 'Sans Solde'], required: true, search: true },
        date_debut: { label: 'Date Début', type: 'date', required: true },
        date_fin: { label: 'Date Fin', type: 'date', required: true },
        statut: { label: 'Statut', type: 'selection', options: ['Brouillon', 'Soumis', 'Approuvé', 'Refusé'], default: 'Brouillon' }
      },
      views: {
        list: ['collaborateur', 'type', 'date_debut', 'date_fin', 'statut'],
        kanban: {
          groupField: 'statut',
          titleField: 'collaborateur',
          subtitleField: 'type'
        }
      }
    },
    gps_okr: {
      label: 'GPS Personnel (Stratégies)',
      fields: {
        collaborateur: { label: 'Employé', type: 'text', required: true, search: true },
        manager: { label: 'Manager / Responsable', type: 'text', search: true },
        departement: { label: 'Département', type: 'text', search: true },
        semestre: { label: 'Semestre / Trimestre', type: 'text', search: true },
        donnees: { label: 'Arbre GPS (JSON)', type: 'textarea' }
      },
      views: {
        list: ['collaborateur', 'departement', 'semestre', 'manager'],
        kanban: {
          groupField: 'departement',
          titleField: 'collaborateur',
          subtitleField: 'semestre'
        }
      }
    }
  }
};
