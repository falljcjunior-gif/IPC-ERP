/**
 * CRM Module Schema
 * Defines the structure for Leads and Opportunities
 */
export const crmSchema = {
  id: 'crm',
  label: 'CRM',
  models: {
    leads: {
      label: 'Pistes de Vente',
      fields: {
        nom: { label: 'Contact Principal', type: 'text', required: true, search: true, placeholder: 'Ex: M. Jean Dupont' },
        entreprise: { label: 'Raison Sociale', type: 'text', required: true, search: true, placeholder: 'Ex: IPC Greenblocks SA' },
        poste: { label: 'Poste / Titre', type: 'text', search: true },
        email: { label: 'Email', type: 'email', search: true },
        telephone: { label: 'Téléphone', type: 'text', search: true },
        site_web: { label: 'Site Web', type: 'text' },
        ville: { label: 'Ville', type: 'text', search: true },
        pays: { label: 'Pays', type: 'text', default: 'Sénégal' },
        secteur: { 
          label: 'Secteur Stratégique', 
          type: 'selection', 
          options: ['Industrie BTP', 'Agro-transformation', 'Services Publics', 'Logistique', 'Commerce de Gros', 'Autre'] 
        },
        taille_entreprise: { 
          label: 'Segment de Marché', 
          type: 'selection', 
          options: ['TPE/PME', 'Grande Entreprise', 'Institutionnel', 'Multinationale'] 
        },
        source: { label: 'Source', type: 'selection', options: ['Site Web', 'E-mail', 'Appel entrant', 'Partenaire', 'Conférence', 'Autre'] },
        priorite: { 
          label: 'Indice de Priorité', 
          type: 'selection', 
          options: [
            { label: '⭐ (Exploration)', value: '⭐' },
            { label: '⭐⭐ (Qualifié)', value: '⭐⭐' },
            { label: '⭐⭐⭐ (Prioritaire)', value: '⭐⭐⭐' }
          ],
          default: '⭐'
        },
        statut: { label: 'Qualification', type: 'selection', options: ['Nouveau', 'En cours', 'Converti', 'Perdu'], default: 'Nouveau' },
        budget_estime: { label: 'Budget Estimé', type: 'money', currency: 'FCFA' },
        date_rappel: { label: 'Date de Rappel', type: 'date' },
        campagne_id: { label: 'Campagne Source', type: 'text', search: true },
        description: { label: 'Notes internes', type: 'textarea' }
      },
      views: {
        list: ['nom', 'entreprise', 'poste', 'email', 'telephone', 'priorite', 'statut'],
        search: {
          filters: [
            { id: 'active', label: 'Prospects Actifs', domain: [['statut', '!=', 'Perdu']] },
            { id: 'hot', label: 'Priorité Haute', domain: [['priorite', '==', '⭐⭐⭐']] }
          ],
          groups: [
            { id: 'source', label: 'Par Source' },
            { id: 'secteur', label: 'Par Secteur' },
            { id: 'ville', label: 'Par Ville' }
          ]
        }
      }
    },
    opportunities: {
      label: 'Affaires Potentielles',
      fields: {
        titre: { label: 'Libellé de l\'Affaire', type: 'text', required: true, search: true, placeholder: 'Ex: Fourniture Briques Recyclées' },
        client: { label: 'Compte Tiers', type: 'text', required: true, search: true, placeholder: 'Rechercher un client...' },
        montant: { label: 'Montant', type: 'money', currency: 'FCFA', search: true },
        probabilite: { label: 'Probabilité (%)', type: 'number', min: 0, max: 100 },
        type: { 
          label: 'Type de deal', 
          type: 'selection', 
          options: ['Nouveau Business', 'Renouvellement', 'Up-sell'] 
        },
        priorite: { 
          label: 'Priorité', 
          type: 'selection', 
          options: [
            { label: '⭐ (Basse)', value: '⭐' },
            { label: '⭐⭐ (Moyenne)', value: '⭐⭐' },
            { label: '⭐⭐⭐ (Haute)', value: '⭐⭐⭐' }
          ],
          default: '⭐'
        },
        responsable: { label: 'Commercial Assingné', type: 'text' },
        tag: { 
          label: 'Étiquettes', 
          type: 'selection', 
          options: ['Très Urgent', 'Grand Compte', 'Récurrent', 'Stratégique', 'En attente'] 
        },
        next_step: { label: 'Prochaine Étape', type: 'text' },
        etape: { label: 'Jalon du Cycle de Vente', type: 'selection', options: ['Nouveau', 'Qualification', 'Proposition', 'Négociation', 'Gagné', 'Perdu'], default: 'Nouveau' },
        dateFermeture: { label: 'Date de clôture', type: 'date' },
        campagne_id: { label: 'Campagne Source', type: 'text', search: true },
        description: { label: 'Notes internes', type: 'textarea' }
      },
      views: {
        list: ['titre', 'client', 'montant', 'priorite', 'etape', 'responsable'],
        kanban: {
          groupField: 'etape',
          titleField: 'titre',
          subtitleField: 'client',
          valueField: 'montant',
          priorityField: 'priorite',
          tagField: 'tag'
        },
        search: {
          filters: [
            { id: 'won', label: 'Gagnées', domain: [['etape', '==', 'Gagné']] },
            { id: 'hot', label: 'Fort Montant', domain: [['montant', '>', 1000000]] },
            { id: 'strategic', label: 'Stratégique', domain: [['priorite', '==', '⭐⭐⭐']] }
          ],
          groups: [
            { id: 'etape', label: 'Par Étape' },
            { id: 'client', label: 'Par Client' },
            { id: 'responsable', label: 'Par Commercial' }
          ]
        }
      }
    },
    clients: {
      label: 'Clients',
      fields: {
        nom: { label: 'Raison Sociale', type: 'text', required: true, search: true },
        siret: { label: 'Numéro RCCM / SIRET', type: 'text', search: true },
        secteur: { 
          label: 'Secteur', 
          type: 'selection', 
          options: ['BTP', 'Industrie', 'Commerce', 'Services', 'Agro-Alimentaire', 'Transport', 'Public', 'Autre'] 
        },
        type_legal: { 
          label: 'Type Juridique', 
          type: 'selection', 
          options: ['SARL', 'SA', 'SAS', 'SASU', 'EI', 'Collectivité Publique', 'ONG', 'Autre'] 
        },
        responsable: { label: 'Responsable Commercial', type: 'text', search: true },
        email: { label: 'Email', type: 'email', search: true },
        telephone: { label: 'Téléphone', type: 'text' },
        adresse: { label: 'Adresse', type: 'text' },
        ville: { label: 'Ville', type: 'text', search: true },
        pays: { label: 'Pays', type: 'text', default: 'Sénégal' },
        ca_estime: { label: 'CA Estimé (FCFA/an)', type: 'money', currency: 'FCFA' },
        niveau: { 
          label: 'Niveau Client', 
          type: 'selection', 
          options: ['Gold', 'Silver', 'Bronze'],
          default: 'Bronze' 
        },
        statut: { 
          label: 'Statut', 
          type: 'selection', 
          options: ['Actif', 'Inactif', 'Prospect Chaud', 'En Négociation'],
          default: 'Actif' 
        },
        description: { label: 'Notes Internes', type: 'textarea' }
      },
      views: {
        list: ['nom', 'secteur', 'responsable', 'email', 'telephone', 'niveau', 'statut'],
        search: {
          filters: [
            { id: 'active', label: 'Clients Actifs', domain: [['statut', '==', 'Actif']] },
            { id: 'gold', label: 'Compte Gold', domain: [['niveau', '==', 'Gold']] }
          ],
          groups: [
            { id: 'secteur', label: 'Par Secteur' },
            { id: 'niveau', label: 'Par Niveau' },
            { id: 'ville', label: 'Par Ville' }
          ]
        }
      }
    }
  }
};
