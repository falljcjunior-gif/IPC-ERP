/**
 * Marketing Module Schema (Metricool Logic)
 * Defines structures for Ads, Social Planning, Analytics and SmartLinks
 */
export const marketingSchema = {
  id: 'marketing',
  label: 'Marketing & Croissance',
  models: {
    campaigns: {
      label: 'Campagnes Ads',
      fields: {
        nom: { label: 'Nom de la Campagne', type: 'text', required: true, search: true },
        type: { label: 'Canal', type: 'selection', options: ['Google Ads', 'Facebook Ads', 'LinkedIn Ads', 'Instagram Ads', 'TikTok Ads'] },
        budget: { label: 'Budget (FCFA)', type: 'money' },
        url_source: { label: 'Lien Publicité', type: 'text' },
        statut: { label: 'Statut', type: 'selection', options: ['Planifié', 'En cours', 'Terminé', 'En pause'], default: 'Planifié' },
        date_debut: { label: 'Début', type: 'date' },
        date_fin: { label: 'Fin', type: 'date' }
      },
      views: {
        list: ['nom', 'type', 'budget', 'statut'],
        search: {
          filters: [
            { id: 'active', label: 'Campagnes Actives', domain: [['statut', '==', 'En cours']] }
          ]
        }
      }
    },
    posts: {
      label: 'Planning Social',
      fields: {
        titre: { label: 'Titre du Post', type: 'text', required: true, search: true },
        plateforme: { label: 'Réseau', type: 'selection', options: ['Facebook', 'Instagram', 'LinkedIn', 'TikTok', 'Twitter/X'] },
        date_publication: { label: 'Date de Publication', type: 'datetime', required: true },
        statut: { label: 'État', type: 'selection', options: ['Brouillon', 'Programmé', 'Publié', 'Erreur'], default: 'Brouillon' },
        contenu: { label: 'Contenu (Texte)', type: 'textarea' },
        media_url: { label: 'URL Média (Image/Video)', type: 'text' }
      },
      views: {
        list: ['titre', 'plateforme', 'date_publication', 'statut'],
        calendar: {
          dateField: 'date_publication',
          titleField: 'titre'
        }
      }
    },
    accounts: {
      label: 'Comptes Connectés',
      fields: {
        nom: { label: 'Nom du compte', type: 'text', required: true },
        reseau: { label: 'Réseau', type: 'selection', options: ['Facebook', 'Instagram', 'LinkedIn', 'TikTok', 'Google', 'Website'] },
        email: { label: 'Email de connexion', type: 'email' },
        statut: { label: 'Connexion', type: 'selection', options: ['Connecté', 'Déconnecté', 'Erreur de Token'], default: 'Connecté' },
        derniere_sync: { label: 'Dernière Synchro', type: 'datetime' }
      }
    },
    smartlinks: {
      label: 'SmartLinks (Bio & Tracking)',
      fields: {
        label: { label: 'Label', type: 'text', required: true, search: true },
        url_destination: { label: 'URL Destination', type: 'text', required: true },
        slug: { label: 'Code unique', type: 'text', required: true },
        clicks: { label: 'Clics totaux', type: 'number', default: 0 }
      }
    },
    messages: {
      label: 'Interactions Sociales',
      fields: {
        sender: { label: 'Expéditeur', type: 'text', required: true },
        source: { label: 'Plateforme', type: 'selection', options: ['Facebook', 'Instagram', 'WhatsApp', 'LinkedIn'] },
        content: { label: 'Message', type: 'textarea', required: true },
        timestamp: { label: 'Date/Heure', type: 'datetime', default: 'now' },
        statut: { label: 'Statut', type: 'selection', options: ['Nouveau', 'En cours', 'Répondu', 'Archivé'], default: 'Nouveau' }
      }
    }
  }
};
