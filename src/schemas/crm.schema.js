/**
 * CRM Module Schema
 * Defines the structure for Leads and Opportunities
 */
export const crmSchema = {
  id: 'crm',
  label: 'CRM',
  models: {
    leads: {
      label: 'Prospects',
      fields: {
        nom: { label: 'Nom Complet', type: 'text', required: true, search: true },
        entreprise: { label: 'Entreprise', type: 'text', required: true, search: true },
        email: { label: 'Email', type: 'email', search: true },
        source: { label: 'Source', type: 'selection', options: ['Site Web', 'E-mail', 'Appel entrant', 'Partenaire', 'Conférence'] },
        statut: { label: 'Statut', type: 'selection', options: ['Nouveau', 'En cours', 'Converti', 'Perdu'], default: 'Nouveau' }
      },
      views: {
        list: ['nom', 'entreprise', 'email', 'source', 'statut'],
        search: {
          filters: [
            { id: 'active', label: 'Prospects Actifs', domain: [['statut', '!=', 'Perdu']] }
          ],
          groups: [
            { id: 'source', label: 'Par Source' }
          ]
        }
      }
    },
    opportunities: {
      label: 'Opportunités',
      fields: {
        titre: { label: 'Titre', type: 'text', required: true, search: true },
        client: { label: 'Client', type: 'text', required: true, search: true },
        montant: { label: 'Montant', type: 'money', currency: 'FCFA', search: true },
        probabilite: { label: 'Probabilité (%)', type: 'number', min: 0, max: 100 },
        etape: { label: 'Étape', type: 'selection', options: ['Nouveau', 'Qualification', 'Proposition', 'Négociation', 'Gagné', 'Perdu'], default: 'Nouveau' },
        dateFermeture: { label: 'Date de clôture', type: 'date' }
      },
      views: {
        list: ['titre', 'client', 'montant', 'etape', 'probabilite'],
        kanban: {
          groupField: 'etape',
          titleField: 'titre',
          subtitleField: 'client',
          valueField: 'montant'
        },
        search: {
          filters: [
            { id: 'won', label: 'Gagnées', domain: [['etape', '==', 'Gagné']] },
            { id: 'hot', label: 'Fort Montant', domain: [['montant', '>', 1000000]] }
          ],
          groups: [
            { id: 'etape', label: 'Par Étape' },
            { id: 'client', label: 'Par Client' }
          ]
        }
      }
    }
  }
};
