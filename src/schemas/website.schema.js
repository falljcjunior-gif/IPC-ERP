export const websiteSchema = {
  id: 'website',
  label: 'Site Web',
  models: {
    config: {
      label: 'Configuration Thème',
      fields: {
        heroTitle: { label: 'Titre Principal', type: 'text' },
        heroSubtitle: { label: 'Sous-titre', type: 'text' },
        ctaLabel: { label: 'Texte Bouton', type: 'text' },
        primaryColor: { label: 'Couleur', type: 'text' }
      }
    },
    pages: {
      label: 'Pages Web',
      fields: {
        titre: { label: 'Titre', type: 'text', required: true },
        slug: { label: 'URL', type: 'text' },
        statut: { type: 'selection', options: ['Brouillon', 'Publié'] }
      }
    },
    chats: {
      label: 'Live Chat (Inbox)',
      fields: {
        visiteur: { label: 'Visiteur', type: 'text' },
        message: { label: 'Dernier Message', type: 'text' },
        statut: { type: 'selection', options: ['Nouveau', 'En cours', 'Résolu'] }
      },
      views: {
        list: ['visiteur', 'message', 'statut']
      }
    }
  }
};
