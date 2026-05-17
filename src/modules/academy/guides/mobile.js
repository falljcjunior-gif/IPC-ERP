export default {
  id: 'mobile',
  label: 'Application Mobile',
  icon: 'Smartphone',
  color: '#0284C7',
  tagline: 'Accéder à vos données et agir depuis votre téléphone, même sans connexion',

  overview: `L'application mobile vous donne accès aux fonctions essentielles de la plateforme depuis votre smartphone. Valider une dépense en photo, consulter votre planning, répondre à un ticket — tout depuis votre poche. Certaines fonctions sont disponibles hors connexion et se synchronisent automatiquement dès que le réseau revient.`,

  articles: [
    {
      id: 'mobile-installer',
      title: 'Installer et se connecter',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Download',
        content: `Sur Android, ouvrez le Play Store et cherchez le nom de l'application (votre administrateur vous communique le nom exact). Sur iPhone, ouvrez l'App Store. Installez l'application. Au premier lancement, saisissez votre adresse email professionnelle → vous recevez un code de confirmation → saisissez-le. Vous êtes connecté. Activez les notifications pour ne rien manquer.`,
        bullets: [
          'Play Store (Android) ou App Store (iPhone)',
          'Connexion avec votre email professionnel',
          'Code de confirmation par email à la première connexion',
          'Activer les notifications push pour les alertes importantes',
          'Connexion automatique aux suivantes (selon paramètres de sécurité)',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Zap',
        content: `Vous avez accès à la plateforme partout : en déplacement, sur le terrain, chez un client. Plus besoin d'être à votre bureau pour valider une urgence ou consulter une information.`,
      },
    },
    {
      id: 'mobile-fonctions',
      title: 'Utiliser les fonctions principales',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Grid',
        content: `L'accueil affiche vos raccourcis personnalisables : tâches du jour, notifications, accès rapide aux modules que vous utilisez le plus. Balayez vers la gauche ou droite pour naviguer entre les modules. La barre de navigation en bas donne accès aux 5 sections principales. Pour les notes de frais : photo de la facture → montant → catégorie → valider. Pour les tickets : même procédure que sur PC, optimisée pour le tactile.`,
        bullets: [
          'Tableau de bord personnalisable',
          'Notifications push en temps réel',
          'Photo de facture → note de frais en 30 secondes',
          'Pointer ses heures ou valider une absence',
          'Consulter et répondre aux tickets Support',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Heart',
        content: `Les tâches rapides (valider une dépense, consulter son planning, répondre à un message) ne nécessitent plus d'ouvrir un ordinateur. Vous gagnez en réactivité, surtout pour les équipes terrain.`,
      },
    },
    {
      id: 'mobile-offline',
      title: 'Travailler sans connexion internet',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'WifiOff',
        content: `Certains modules fonctionnent en mode hors connexion : pointage des heures, notes de frais avec photo, consultation des documents récents, lecture des tâches du jour. L'application affiche un bandeau orange « Hors ligne » quand vous n'avez pas de réseau. Les actions effectuées sont enregistrées localement et envoyées automatiquement dès le retour de la connexion.`,
        bullets: [
          'Modules hors ligne : pointage, notes de frais, tâches, documents récents',
          'Bandeau orange pour signaler l\'absence de réseau',
          'Synchronisation automatique au retour du réseau',
          'Aucune perte de données si fermeture de l\'app hors ligne',
          'Modules en ligne uniquement : messagerie, notifications live',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Compass',
        content: `Sur un chantier, en zone blanche, dans un entrepôt sans wifi — vous continuez à travailler normalement. Tout se synchronise quand vous récupérez la connexion, sans rien avoir à faire.`,
      },
    },
  ],

  faq: [
    {
      q: 'L\'application est-elle gratuite ?',
      a: 'Oui, elle est incluse dans votre abonnement à la plateforme. Téléchargement gratuit sur les stores. Pas de frais supplémentaires.',
    },
    {
      q: 'Mes données sont-elles sécurisées sur le téléphone ?',
      a: 'Oui. Les données sensibles ne sont jamais stockées en clair sur l\'appareil. En cas de perte du téléphone, l\'administrateur peut désactiver votre session à distance depuis la plateforme web.',
    },
    {
      q: 'Puis-je utiliser la même application sur plusieurs téléphones ?',
      a: 'Oui. Votre compte est lié à votre email, pas à un appareil. Vous pouvez vous connecter sur votre téléphone personnel et professionnel simultanément.',
    },
    {
      q: 'L\'application consomme-t-elle beaucoup de batterie ?',
      a: 'Non. Elle est conçue pour consommer le minimum en arrière-plan. Les notifications push utilisent le système d\'Apple ou Google, pas de connexion permanente de l\'app.',
    },
    {
      q: 'Toutes les fonctions du PC sont-elles sur mobile ?',
      a: 'Les fonctions courantes oui, mais les fonctions avancées (rapports complexes, paramètres d\'administration, module comptabilité détaillé) restent sur la version web pour des raisons de confort d\'utilisation.',
    },
  ],
};
