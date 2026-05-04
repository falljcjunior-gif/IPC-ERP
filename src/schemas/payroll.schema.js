/**
 * 💰 NEXUS OS: PAYROLL (PAIE & SOCIAL) SCHEMA
 * Handles salaries, social security contributions, and pay slip generation.
 */
export const payrollSchema = {
  id: 'payroll',
  label: 'Paie & Social',
  models: {
    slips: {
      label: 'Bulletins de Paie',
      fields: {
        employeeId: { label: 'Employé', type: 'text', required: true },
        period: { label: 'Période (Mois/Année)', type: 'text', required: true },
        netPay: { label: 'Net à Payer', type: 'number', required: true },
        grossPay: { label: 'Salaire Brut', type: 'number', required: true },
        status: { label: 'État', type: 'selection', options: ['Brouillon', 'Validé', 'Payé'], default: 'Brouillon' },
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
    }
  }
};
