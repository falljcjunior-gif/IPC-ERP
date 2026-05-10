/**
 * HR Module Schema
 * Defines the structure for Employees, Candidates, and Leaves
 */
export const HRSchemas = {
  id: 'hr',
  label: 'RH',
  models: {
    employees: {
      label: 'Talents & Collaborateurs',
      fields: {
        nom: { label: 'Nom & Prénoms', type: 'text', required: true, search: true, placeholder: 'Ex: Mamadou Diop' },
        poste: { label: 'Intitulé du Poste / Fonction', type: 'text', required: true, search: true, placeholder: 'Ex: Responsable Production' },
        dept: { label: 'Pôle Opérationnel', type: 'selection', options: ['Direction', 'Finance', 'RH', 'IT', 'Ventes', 'Production', 'Logistique'], search: true },
        email: { label: 'Email Pro', type: 'email', search: true },
        // NOTE: salaire has been moved to private_data subcollection for Bank-Grade security
        performance_score: { label: 'Performance 360° (%)', type: 'number', default: 85 },
        burnout_risk: { label: 'Risque d\'Épuisement (%)', type: 'number', default: 10 },
        retention_score: { label: 'Indice de Rétention (%)', type: 'number', default: 95 },
        engagement_level: { label: 'Engagement', type: 'selection', options: ['High', 'Medium', 'Low'], default: 'High' },
        active: { label: 'Actif', type: 'boolean', default: true }
      },
      views: {
        list: ['nom', 'poste', 'dept', 'performance_score', 'active'],
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
      label: 'Vivier de Candidats',
      fields: {
        nom: { label: 'Identité du Candidat', type: 'text', required: true, search: true, placeholder: 'Ex: Fatou Sow' },
        poste: { label: 'Poste Targeté', type: 'text', search: true, placeholder: 'Ex: Ingénieur BTP' },
        status: { label: 'État du Recrutement', type: 'selection', options: ['Top of Funnel', 'Entretien Tech', 'Entretien Manager', 'Offre envoyée'], default: 'Top of Funnel' },
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
        contractType: { label: 'Type de Contrat', type: 'selection', options: ['Forfait Cadre', 'Horaire (Shift)', 'Consultant'], default: 'Forfait Cadre' },
        projet: { label: 'Projet / Centre Coût', type: 'text', search: true },
        tache: { label: 'Tâche / Quart de travail', type: 'text', search: true },
        heures: { label: 'Durée (heures / jours)', type: 'number', required: true },
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
        type: { label: 'Type d\'Absence', type: 'selection', options: ['Congé Payé', 'Maladie', 'Maternité', 'Sans Solde'], required: true, search: true },
        date_debut: { label: 'Date Début', type: 'date', required: true },
        date_fin: { label: 'Date Fin', type: 'date', required: true },
        statut: { label: 'Statut', type: 'selection', options: ['Brouillon', 'En attente', 'Validé', 'Refusé'], default: 'Brouillon' }
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
    },
    commissions: {
      label: 'Commissions & Bonus Ventes',
      fields: {
        date: { label: 'Date du Calcul', type: 'date', required: true },
        collaborateur: { label: 'Commercial / Apporteur', type: 'text', required: true, search: true },
        montant: { label: 'Montant de la Commission', type: 'money', currency: 'FCFA', required: true },
        refDocument: { label: 'Document Source (Vente)', type: 'text', search: true },
        taux: { label: 'Taux Appliqué (%)', type: 'number' },
        statut: { label: 'Statut Paiement', type: 'selection', options: ['À payer', 'Payé'], default: 'À payer' }
      },
      views: {
        list: ['date', 'collaborateur', 'montant', 'refDocument', 'statut'],
        search: {
          groups: [
            { id: 'collaborateur', label: 'Par Commercial' },
            { id: 'statut', label: 'Par État de Paiement' }
          ]
        }
      }
    },
    private_data: {
      label: 'Coffre-Fort HR (Données Sensibles)',
      fields: {
        salaire: { label: 'Salaire de Base (Brut)', type: 'money', currency: 'FCFA', required: true },
        iban: { label: 'RIB / IBAN', type: 'text' },
        ssn: { label: 'Numéro de Sécurité Sociale', type: 'text' },
        notes: { label: 'Notes Médicales/Disciplinaires', type: 'textarea' },
        _employeeId: { label: 'Employé ID', type: 'text', readonly: true }
      },
      views: {
        list: ['salaire', 'iban']
      }
    },
    skills: {
      label: 'Matrice des Compétences',
      fields: {
        collaborateur: { label: 'Collaborateur', type: 'text', required: true, search: true },
        competence: { label: 'Compétence / Habilitation', type: 'text', required: true, search: true },
        niveau: { label: 'Niveau d\'Expertise', type: 'selection', options: ['Débutant', 'Intermédiaire', 'Avancé', 'Expert'], default: 'Intermédiaire' },
        date_obtention: { label: 'Date d\'Obtention / Certification', type: 'date' },
        expiration: { label: 'Date d\'Expiration (si applicable)', type: 'date' }
      },
      views: {
        list: ['collaborateur', 'competence', 'niveau', 'expiration'],
        search: {
          groups: [
            { id: 'competence', label: 'Par Compétence' },
            { id: 'niveau', label: 'Par Niveau' }
          ]
        }
      }
    },
    evaluations: {
      label: 'Entretiens 360°',
      fields: {
        collaborateur: { label: 'Collaborateur Évalué', type: 'text', required: true, search: true },
        evaluateur: { label: 'Évaluateur (Manager)', type: 'text', required: true, search: true },
        periode: { label: 'Période (Q1, Annuel, etc.)', type: 'text', required: true },
        objectifsAtteints: { label: 'Objectifs Atteints (%)', type: 'number' },
        feedback: { label: 'Feedback Complet', type: 'textarea' },
        potentielEvolution: { label: 'Potentiel d\'Évolution', type: 'selection', options: ['Prêt', 'Dans 1 an', 'Dans 2+ ans', 'N/A'], default: 'N/A' },
        statut: { label: 'Statut Entretien', type: 'selection', options: ['Planifié', 'En cours', 'Clôturé'], default: 'Planifié' }
      },
      views: {
        list: ['collaborateur', 'evaluateur', 'periode', 'objectifsAtteints', 'statut'],
        search: {
          groups: [
            { id: 'statut', label: 'Par Statut' },
            { id: 'periode', label: 'Par Période' }
          ]
        }
      }
    }
  }
};

// [COMPAT] Alias pour compatibilité avec l'existant
export const hrSchema = HRSchemas;
