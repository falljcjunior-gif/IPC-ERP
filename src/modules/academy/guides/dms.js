export default {
  id: 'dms',
  label: 'Documents Cloud',
  icon: 'FolderOpen',
  color: '#0369A1',
  tagline: 'Stocker, partager et retrouver vos documents en quelques secondes',

  overview: `Le module Documents Cloud est votre armoire à documents numérique partagée. Contrats, factures, présentations, photos de chantier — tout est centralisé, organisé en dossiers, et accessible depuis n'importe quel appareil. Plus jamais de pièce jointe introuvable dans un email d'il y a 6 mois.`,

  articles: [
    {
      id: 'dms-deposer',
      title: 'Déposer un document',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Upload',
        content: `Cliquez sur « Nouveau » puis « Importer un fichier ». Choisissez le fichier sur votre ordinateur (ou glissez-le directement dans la fenêtre). Sélectionnez le dossier de destination. Ajoutez un titre clair et des étiquettes si utile. Cliquez sur « Enregistrer ». Le fichier est immédiatement disponible pour les personnes autorisées.`,
        bullets: [
          'Bouton « Nouveau » → « Importer »',
          'Glisser-déposer depuis votre bureau directement',
          'Choisir le dossier (Contrats, RH, Finance…)',
          'Ajouter des étiquettes pour faciliter la recherche',
          'Formats acceptés : PDF, Word, Excel, images, vidéos…',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Zap',
        content: `Plus besoin d'envoyer des fichiers par email et de perdre la dernière version. Tout le monde travaille sur le même document. Si quelqu'un télécharge et modifie un fichier, il peut déposer la version mise à jour — l'historique est conservé.`,
      },
    },
    {
      id: 'dms-partager',
      title: 'Partager un document avec quelqu\'un',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Share2',
        content: `Cliquez sur le document → bouton « Partager ». Choisissez des personnes dans la liste (par nom) ou des rôles entiers (ex : tous les managers). Définissez le niveau d'accès : lecture seule, ou téléchargement autorisé. Cliquez « Envoyer » : les personnes reçoivent une notification avec le lien direct. Pour un partage externe (client, prestataire), générez un lien temporaire avec date d'expiration.`,
        bullets: [
          'Clic sur le document → « Partager »',
          'Ajouter des personnes ou des rôles',
          'Choisir : lecture seule ou téléchargement',
          'Lien temporaire pour les personnes extérieures à l\'entreprise',
          'Révoquer l\'accès à tout moment',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Users',
        content: `Vous partagez exactement ce qu'il faut, à qui il faut, pour la durée qu'il faut. Plus de document envoyé par erreur à la mauvaise personne, plus de lien valable indéfiniment.`,
      },
    },
    {
      id: 'dms-retrouver',
      title: 'Retrouver un document rapidement',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Search',
        content: `Barre de recherche en haut → tapez 2 ou 3 mots du titre ou du contenu. Les résultats s'affichent instantanément. Filtrez par type de fichier, par dossier, par date, ou par personne qui a déposé. Si vous consultez souvent le même document, ajoutez-le à vos « Favoris » (étoile) pour le retrouver en un clic depuis votre tableau de bord.`,
        bullets: [
          'Recherche par mots-clés dans le titre et le contenu',
          'Filtres : type, dossier, date, auteur',
          'Favoris : marquer les documents consultés fréquemment',
          'Historique : vos 20 derniers documents consultés',
          'Vue liste ou grille selon vos préférences',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Clock',
        content: `Retrouver un document prend 10 secondes au lieu de 10 minutes passées à fouiller sa boîte mail. Même un document déposé il y a 2 ans par un collègue est trouvable en tapant quelques mots.`,
      },
    },
  ],

  faq: [
    {
      q: 'Quelle taille maximale pour un fichier ?',
      a: 'Jusqu\'à 500 Mo par fichier. Pour les vidéos lourdes ou archives volumineuses, contacter l\'administration qui peut ajuster le quota.',
    },
    {
      q: 'Comment organiser les dossiers ?',
      a: 'Administration → Documents → « Gérer les dossiers ». Créez une arborescence (ex : Clients > Contrats > 2026). Les droits d\'accès peuvent être définis dossier par dossier.',
    },
    {
      q: 'Un document a été supprimé par erreur, peut-on le récupérer ?',
      a: 'Oui. Corbeille (icône en bas à gauche) → retrouver le document → « Restaurer ». Les documents supprimés sont conservés 30 jours avant suppression définitive.',
    },
    {
      q: 'Comment voir les versions précédentes d\'un document ?',
      a: 'Cliquer sur le document → onglet « Historique des versions ». Chaque dépôt d\'une nouvelle version est listé avec date et auteur. Vous pouvez télécharger ou restaurer une ancienne version.',
    },
    {
      q: 'Les documents sont-ils sauvegardés automatiquement ?',
      a: 'Oui, sauvegarde automatique en temps réel sur des serveurs sécurisés. Pas besoin de faire de sauvegarde manuelle.',
    },
  ],
};
