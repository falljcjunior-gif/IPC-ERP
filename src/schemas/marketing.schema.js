/**
 * Marketing Module Schema — Inspiré IPC Green Block ERP
 * Campagnes, E-mailing, Événements, Leads entrants, Budget
 */
export const marketingSchema = {
  id: 'marketing',
  label: 'Marketing',
  models: {
    campaigns: {
      label: 'Stratégies de Croissance & Campagnes',
      fields: {
        nom: { label: 'Libellé de la Campagne', type: 'text', required: true, search: true, placeholder: 'Ex: Lancement Gamme Briques 2024' },
        type: {
          label: 'Type',
          type: 'selection',
          options: ['E-mailing', 'Événement', 'Réseaux Sociaux', 'Presse / Affichage', 'Digital Ads', 'Phoning', 'Partenariat', 'Autre'],
          required: true
        },
        canal: {
          label: 'Canal Principal',
          type: 'selection',
          options: ['Facebook', 'Instagram', 'LinkedIn', 'TikTok', 'Google Ads', 'Email', 'WhatsApp', 'Terrain', 'Autre']
        },
        objectif: {
          label: 'Objectif',
          type: 'selection',
          options: ['Notoriété', 'Génération de Leads', 'Conversion', 'Fidélisation', 'Lancement Produit', 'Recrutement']
        },
        responsable: { label: 'Responsable', type: 'text', search: true },
        dateDebut: { label: 'Date de Début', type: 'date', required: true },
        dateFin: { label: 'Date de Fin', type: 'date' },
        budget: { label: 'Enveloppe Budgétaire (FCFA)', type: 'money', currency: 'FCFA' },
        depense: { label: 'Dépenses Réelles (FCFA)', type: 'money', currency: 'FCFA' },
        cible: { label: 'Cible / Audience', type: 'text', search: true },
        statut: {
          label: 'Cycle de Vie de la Campagne',
          type: 'selection',
          options: ['Brouillon', 'En Attente de Validation', 'Approuvée', 'Planifiée', 'Active', 'En Pause', 'Clôturée', 'Annulée'],
          default: 'Brouillon'
        },
        approuvePar: { label: 'Approuvé par (Dir.)', type: 'text' },
        dateApprobation: { label: 'Date d\'Approbation', type: 'date' },
        reach: { label: 'Portée (Reach)', type: 'number' },
        clics: { label: 'Clics', type: 'number' },
        conversions: { label: 'Conversions / Leads', type: 'number' },
        description: { label: 'Notes / Brief', type: 'textarea' }
      },
      views: {
        list: ['nom', 'type', 'objectif', 'responsable', 'dateDebut', 'statut', 'budget'],
        kanban: { groupField: 'statut', titleField: 'nom', subtitleField: 'objectif', valueField: 'budget' },
        search: {
          filters: [
            { id: 'active', label: 'Actives', domain: [['statut', '==', 'Active']] },
            { id: 'planned', label: 'Planifiées', domain: [['statut', '==', 'Planifiée']] },
            { id: 'draft', label: 'Brouillons', domain: [['statut', '==', 'Brouillon']] },
            { id: 'closed', label: 'Clôturées', domain: [['statut', '==', 'Clôturée']] }
          ],
          groups: [
            { id: 'type', label: 'Par Type' },
            { id: 'canal', label: 'Par Canal' },
            { id: 'objectif', label: 'Par Objectif' }
          ]
        }
      }
    },

    emailings: {
      label: 'Campagnes E-mailing',
      fields: {
        titre: { label: 'Objet de l\'E-mail', type: 'text', required: true, search: true },
        template: {
          label: 'Template',
          type: 'selection',
          options: ['Promotionnel', 'Newsletter', 'Invitation', 'Relance', 'Transactionnel', 'Bienvenue']
        },
        campagne: { label: 'Campagne Parente', type: 'text', search: true },
        expediteur: { label: 'Nom Expéditeur', type: 'text' },
        emailExpediteur: { label: 'Email Expéditeur', type: 'email' },
        liste: {
          label: 'Liste de Contacts',
          type: 'selection',
          options: ['Tous les Clients', 'Prospects Qualifiés', 'Leads Froids', 'Partenaires', 'Newsletter', 'Personnalisée']
        },
        dateEnvoi: { label: 'Date d\'Envoi Programmé', type: 'date' },
        nbEnvoyes: { label: 'Envoyés', type: 'number' },
        nbOuvertures: { label: 'Ouvertures', type: 'number' },
        nbClics: { label: 'Clics', type: 'number' },
        nbDesabonnements: { label: 'Désabonnements', type: 'number' },
        statut: {
          label: 'Statut',
          type: 'selection',
          options: ['Brouillon', 'Planifié', 'Envoyé', 'Partiel', 'Annulé'],
          default: 'Brouillon'
        }
      },
      views: {
        list: ['titre', 'template', 'dateEnvoi', 'nbEnvoyes', 'nbOuvertures', 'statut'],
        search: {
          filters: [
            { id: 'sent', label: 'Envoyés', domain: [['statut', '==', 'Envoyé']] },
            { id: 'planned', label: 'Planifiés', domain: [['statut', '==', 'Planifié']] }
          ]
        }
      }
    },

    events: {
      label: 'Événements Marketing',
      fields: {
        nom: { label: 'Nom de l\'Événement', type: 'text', required: true, search: true },
        type: {
          label: 'Type',
          type: 'selection',
          options: ['Salon / Foire', 'Webinaire', 'Conférence', 'Lancement Produit', 'Formation Client', 'Portes Ouvertes', 'Networking', 'Autre']
        },
        lieu: { label: 'Lieu / Plateforme', type: 'text', search: true },
        dateDebut: { label: 'Date de Début', type: 'date', required: true },
        dateFin: { label: 'Date de Fin', type: 'date' },
        responsable: { label: 'Responsable', type: 'text', search: true },
        budget: { label: 'Budget (FCFA)', type: 'money', currency: 'FCFA' },
        nbInscrits: { label: 'Inscrits', type: 'number' },
        nbPresents: { label: 'Présents', type: 'number' },
        nbLeads: { label: 'Leads Générés', type: 'number' },
        statut: {
          label: 'Statut',
          type: 'selection',
          options: ['Planifié', 'Confirmé', 'En cours', 'Terminé', 'Annulé'],
          default: 'Planifié'
        },
        description: { label: 'Notes', type: 'textarea' }
      },
      views: {
        list: ['nom', 'type', 'lieu', 'dateDebut', 'nbInscrits', 'nbLeads', 'statut'],
        search: {
          filters: [
            { id: 'upcoming', label: 'À venir', domain: [['statut', '==', 'Planifié']] },
            { id: 'done', label: 'Terminés', domain: [['statut', '==', 'Terminé']] }
          ],
          groups: [
            { id: 'type', label: 'Par Type' }
          ]
        }
      }
    },

    leads_entrants: {
      label: 'Flux de Leads Entrants',
      dataPath: 'crm.leads',
      fields: {
        prenom: { label: 'Prénom', type: 'text', required: true, search: true },
        nom: { label: 'Nom', type: 'text', required: true, search: true },
        entreprise: { label: 'Entreprise', type: 'text', search: true },
        email: { label: 'Email', type: 'email', search: true },
        telephone: { label: 'Téléphone', type: 'text' },
        source: {
          label: 'Source Marketing',
          type: 'selection',
          options: ['Facebook', 'Instagram', 'LinkedIn', 'Google Ads', 'E-mailing', 'Événement', 'Formulaire Web', 'Bouche à Oreille', 'Appel Entrant', 'Autre']
        },
        campagne: { label: 'Campagne Associée', type: 'text', search: true },
        statut: {
          label: 'Statut',
          type: 'selection',
          options: ['Nouveau', 'Qualifié', 'En Cours de Traitement', 'Transféré CRM', 'Non Qualifié'],
          default: 'Nouveau'
        },
        interet: {
          label: 'Niveau d\'Intérêt',
          type: 'selection',
          options: ['Froid', 'Tiède', 'Chaud', 'Très Chaud'],
          default: 'Tiède'
        },
        message: { label: 'Message / Besoin Exprimé', type: 'textarea' }
      },
      views: {
        list: ['prenom', 'nom', 'entreprise', 'source', 'campagne', 'interet', 'statut'],
        kanban: { groupField: 'statut', titleField: 'nom', subtitleField: 'source', valueField: 'interet' },
        search: {
          filters: [
            { id: 'new', label: 'Nouveaux', domain: [['statut', '==', 'Nouveau']] },
            { id: 'hot', label: 'Chauds', domain: [['interet', '==', 'Chaud']] },
            { id: 'very_hot', label: 'Très Chauds', domain: [['interet', '==', 'Très Chaud']] }
          ],
          groups: [
            { id: 'source', label: 'Par Source' },
            { id: 'campagne', label: 'Par Campagne' }
          ]
        }
      }
    }
  }
};
