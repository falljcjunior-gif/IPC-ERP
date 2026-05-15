/**
 *  NEXUS OS: AUDIT & COMPLIANCE SCHEMA
 * Expanded to handle formal audits, certifications, and internal controls.
 */
export const auditSchema = {
  id: 'audit',
  label: 'Audit & Conformité',
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
      }
    },
    sessions: {
      label: 'Sessions d\'Audit',
      fields: {
        title: { label: 'Titre de l\'Audit', type: 'text', required: true },
        type: { label: 'Type', type: 'selection', options: ['Interne', 'Externe (ISO)', 'Fournisseur'], required: true },
        status: { label: 'Statut', type: 'selection', options: ['Planifié', 'En cours', 'Clôturé'], default: 'Planifié' },
        auditor: { label: 'Auditeur Responsable', type: 'text', required: true },
        dateStart: { label: 'Date de début', type: 'date', required: true },
        score: { label: 'Score Global (%)', type: 'number' },
        findings: { label: 'Observations', type: 'textarea' }
      }
    },
    certifications: {
      label: 'Certifications & Normes',
      fields: {
        name: { label: 'Nom du Standard', type: 'text', required: true }, // ex: ISO 9001
        validUntil: { label: 'Valide jusqu\'au', type: 'date', required: true },
        status: { label: 'État', type: 'selection', options: ['Actif', 'À renouveler', 'Expiré'], default: 'Actif' },
        documents: { label: 'Certificats PDF', type: 'file' }
      }
    }
  }
};
