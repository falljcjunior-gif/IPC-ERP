/**
 *  NEXUS OS: PAYROLL (PAIE & SOCIAL) SCHEMA
 * Handles salaries, social security contributions, and pay slip generation.
 * Full SYSCOHADA/West African fiscal compliance.
 */

export const SALARY_TYPES = {
  MENSUEL: 'Mensuel',
  JOURNALIER: 'Journalier',
  HORAIRE: 'Horaire',
  MISSION: 'Mission/Projet',
  CONTRAT: 'Contrat à durée déterminée',
  FREELANCE: 'Freelance',
  CONSULTANT: 'Consultant',
  EXECUTIF: 'Package Exécutif'
};

export const CURRENCIES = ['XOF', 'EUR', 'USD', 'GBP', 'MAD', 'GNF', 'MRU'];

export const CONTRACT_TYPES = ['CDI', 'CDD', 'Stage', 'Alternance', 'Freelance', 'Consultant', 'Intérim'];

export const PAYMENT_MODES = ['Virement Bancaire', 'Mobile Money (Orange/Wave)', 'Chèque', 'Espèces'];

export const payrollSchema = {
  id: 'payroll',
  label: 'Paie & Social',
  models: {
    salary_structures: {
      label: 'Structures Salariales',
      fields: {
        salaire_base: { label: 'Salaire de Base', type: 'number', required: true },
        devise: { label: 'Devise', type: 'selection', options: CURRENCIES, default: 'XOF' },
        type_remuneration: { label: 'Type de Rémunération', type: 'selection', options: Object.values(SALARY_TYPES), default: 'Mensuel' },
        periodicite: { label: 'Périodicité', type: 'selection', options: ['Mensuel', 'Bimensuel', 'Hebdomadaire', 'Journalier'], default: 'Mensuel' },
        prime_anciennete: { label: 'Prime d\'Ancienneté', type: 'number', default: 0 },
        prime_transport: { label: 'Prime de Transport', type: 'number', default: 0 },
        prime_logement: { label: 'Prime de Logement', type: 'number', default: 0 },
        prime_performance: { label: 'Prime de Performance', type: 'number', default: 0 },
        indemnite_representation: { label: 'Indemnité de Représentation', type: 'number', default: 0 },
        prime_risque: { label: 'Prime de Risque', type: 'number', default: 0 },
        retenue_avance: { label: 'Retenue sur Avance', type: 'number', default: 0 },
        retenue_pret: { label: 'Retenue sur Prêt', type: 'number', default: 0 },
        taux_heures_sup: { label: 'Taux Heures Supplémentaires (%)', type: 'number', default: 25 },
        mode_paiement: { label: 'Mode de Paiement', type: 'selection', options: PAYMENT_MODES, default: 'Virement Bancaire' },
        banque: { label: 'Banque', type: 'text' },
        compte_bancaire: { label: 'Numéro de Compte', type: 'text' },
        date_effet: { label: 'Date d\'Effet', type: 'date', required: true },
        payroll_status: { label: 'Statut Paie', type: 'selection', options: ['Actif', 'Suspendu', 'Clôturé'], default: 'Actif' }
      }
    },
    payroll_profiles: {
      label: 'Profils de Paie',
      fields: {
        employeeId: { label: 'Employé', type: 'text', required: true },
        employeeName: { label: 'Nom Employé', type: 'text', required: true },
        entity_id: { label: 'Entité', type: 'text', required: true },
        salary_structure_id: { label: 'Structure Salariale', type: 'text' },
        payroll_group: { label: 'Groupe de Paie', type: 'text', default: 'Production' },
        cotisation_cnps: { label: 'Cotisation CNPS', type: 'boolean', default: true },
        cotisation_its: { label: 'Cotisation ITS', type: 'boolean', default: true },
        cotisation_irpp: { label: 'Cotisation IRPP', type: 'boolean', default: false },
        regime_fiscal: { label: 'Régime Fiscal', type: 'selection', options: ['Droit Commun', 'Exonéré', 'Partiel'], default: 'Droit Commun' },
        bank_account: { label: 'Compte Bancaire', type: 'text' },
        statut_paie: { label: 'Statut Paie', type: 'selection', options: ['Actif', 'Suspendu', 'Clôturé'], default: 'Actif' }
      }
    },
    payroll_cycles: {
      label: 'Cycles de Paie',
      fields: {
        periode: { label: 'Période', type: 'text', required: true },
        statut: { label: 'Statut', type: 'selection', options: ['Brouillon', 'En calcul', 'Validé RH', 'Validé Finance', 'Payé'], default: 'Brouillon' },
        total_brut: { label: 'Total Brut', type: 'number', default: 0 },
        total_net: { label: 'Total Net', type: 'number', default: 0 },
        total_charges_patronales: { label: 'Charges Patronales', type: 'number', default: 0 },
        total_charges_salariales: { label: 'Charges Salariales', type: 'number', default: 0 },
        total_taxes: { label: 'Total Taxes', type: 'number', default: 0 },
        nb_employes: { label: 'Nombre d\'Employés', type: 'number', default: 0 },
        validated_by_hr: { label: 'Validé par RH', type: 'boolean', default: false },
        validated_by_finance: { label: 'Validé par Finance', type: 'boolean', default: false }
      }
    },
    slips: {
      label: 'Bulletins de Paie',
      fields: {
        employeeId: { label: 'Employé', type: 'text', required: true },
        cycle_id: { label: 'Cycle de Paie', type: 'text' },
        periode: { label: 'Période (Mois/Année)', type: 'text', required: true },
        salaire_base: { label: 'Salaire de Base', type: 'number', required: true },
        primes_total: { label: 'Total Primes', type: 'number', default: 0 },
        indemnites_total: { label: 'Total Indemnités', type: 'number', default: 0 },
        brut_imposable: { label: 'Brut Imposable', type: 'number', required: true },
        cnps_salariale: { label: 'CNPS Salariale', type: 'number', default: 0 },
        irpp: { label: 'IRPP', type: 'number', default: 0 },
        its: { label: 'ITS', type: 'number', default: 0 },
        net_a_payer: { label: 'Net à Payer', type: 'number', required: true },
        statut: { label: 'État', type: 'selection', options: ['Brouillon', 'Validé', 'Payé'], default: 'Brouillon' },
        paymentDate: { label: 'Date de Paiement', type: 'date' },
        document: { label: 'PDF Bulletin', type: 'file' }
      }
    },
    variables: {
      label: 'Éléments Variables',
      fields: {
        employeeId: { label: 'Employé', type: 'text', required: true },
        type: { label: 'Type', type: 'selection', options: ['Heures Sup', 'Prime', 'Absence', 'Avance'], required: true },
        amount: { label: 'Montant/Valeur', type: 'number', required: true },
        date: { label: 'Date d\'effet', type: 'date', required: true },
        approved: { label: 'Approuvé', type: 'boolean', default: false }
      }
    },
    contributions: {
      label: 'Charges Sociales',
      fields: {
        name: { label: 'Organisme (CNPS, etc)', type: 'text', required: true },
        amount: { label: 'Montant dû', type: 'number', required: true },
        period: { label: 'Période', type: 'text', required: true },
        isPaid: { label: 'Réglé', type: 'boolean', default: false }
      }
    },
    compensation_history: {
      label: 'Historique des Rémunérations',
      fields: {
        employeeId: { label: 'Employé', type: 'text', required: true },
        date_effet: { label: 'Date d\'Effet', type: 'date', required: true },
        ancien_salaire: { label: 'Ancien Salaire', type: 'number', required: true },
        nouveau_salaire: { label: 'Nouveau Salaire', type: 'number', required: true },
        motif: { label: 'Motif', type: 'selection', options: ['Augmentation', 'Promotion', 'Révision', 'Correction'], required: true },
        approuve_par: { label: 'Approuvé par', type: 'text' }
      }
    },
    employee_benefits: {
      label: 'Avantages en Nature',
      fields: {
        employeeId: { label: 'Employé', type: 'text', required: true },
        type: { label: 'Type', type: 'selection', options: ['Assurance', 'Véhicule', 'Logement', 'Téléphone', 'Ticket Repas'], required: true },
        valeur: { label: 'Valeur', type: 'number', required: true },
        devise: { label: 'Devise', type: 'selection', options: CURRENCIES, default: 'XOF' },
        date_debut: { label: 'Date de Début', type: 'date', required: true },
        date_fin: { label: 'Date de Fin', type: 'date' }
      }
    }
  }
};
