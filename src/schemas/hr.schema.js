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
    }
  }
};
