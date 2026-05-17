export default {
  id: 'subsidiary',
  label: 'Cockpit Filiale',
  icon: 'Building2',
  color: '#10B981',
  tagline: 'Le tableau de bord du DG de filiale, focalisé sur sa propre activité',

  overview: `Le Cockpit Filiale est le tableau de bord du directeur général d'une filiale. Vous y voyez uniquement les chiffres de votre filiale — pas ceux des autres. C'est votre vue quotidienne pour piloter votre business : ventes du jour, commandes en cours, stock, trésorerie, équipes. Tout est mis à jour en direct dès qu'une opération est saisie.`,

  articles: [
    {
      id: 'cockpit-filiale-matin',
      title: 'Votre routine du matin en 5 minutes',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Sun',
        content: `À l'arrivée le matin, ouvrez le Cockpit Filiale. En haut, vous voyez les chiffres de la veille : CA, nombre de commandes, trésorerie. Au milieu, les alertes qui vous concernent : un client en retard de paiement, un stock bas, un congé à valider. En bas, l'agenda de la journée : réunions, livraisons attendues, échéances. Lisez de haut en bas, c'est conçu pour ça.`,
        bullets: [
          'En haut : chiffres de la veille (CA, commandes, encaissements)',
          'Au milieu : alertes qui nécessitent votre action',
          'En bas : agenda et événements de la journée',
          'Un seul écran à consulter — pas besoin d\'ouvrir 10 modules',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Gauge',
        content: `Vous commencez la journée avec une vision claire et complète. Plus de réunions de 30 minutes pour faire le point : tout est déjà là, à jour, sans avoir rien demandé à personne. Vous gagnez du temps et vos équipes aussi.`,
      },
    },
    {
      id: 'cockpit-filiale-objectifs',
      title: 'Suivre vos objectifs trimestriels',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Target',
        content: `Une zone « Objectifs » montre les cibles que vous (ou le groupe) avez fixées : CA mensuel, marge, satisfaction client. Une barre de progression indique où vous en êtes par rapport à la cible. Vert si vous êtes en avance, orange si vous êtes juste, rouge si vous êtes en retard. Cliquez sur un objectif pour voir le détail journalier.`,
        bullets: [
          'Barre de progression pour chaque objectif',
          'Code couleur instantané : vert/orange/rouge',
          'Cliquer pour voir la courbe sur la période',
          'Vos managers voient les mêmes objectifs (transparence)',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Award',
        content: `Vous ne découvrez pas en fin de mois que vous avez manqué la cible. Vous voyez la tendance dès la première semaine et pouvez ajuster (booster l'équipe commerciale, lancer une promo…) pendant qu'il est encore temps.`,
      },
    },
    {
      id: 'cockpit-filiale-equipe',
      title: 'Voir l\'activité de vos équipes',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Users',
        content: `Une carte « Équipes » affiche l'effectif présent aujourd'hui, les absents (avec motif), les congés à valider. Vous pouvez approuver un congé directement depuis cette carte d'un clic. Une autre carte « Productivité » montre les missions terminées hier par département.`,
        bullets: [
          'Effectif présent / absent du jour',
          'Bouton « Valider » pour approuver un congé sans changer d\'écran',
          'Missions terminées par département',
          'Cliquer sur un collaborateur pour voir son activité de la semaine',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Heart',
        content: `Vous savez en quelques secondes si vous avez les bras pour assurer la production du jour. Plus besoin d'appeler les chefs d'équipe pour faire le point. Et vos collaborateurs apprécient que leurs congés soient validés rapidement.`,
      },
    },
  ],

  faq: [
    {
      q: 'Pourquoi je ne vois pas les chiffres des autres filiales ?',
      a: 'C\'est voulu, pour la confidentialité. Chaque DG voit sa filiale. Si vous avez besoin d\'une vue groupe, demandez l\'accès Cockpit Groupe à votre direction.',
    },
    {
      q: 'Les chiffres ne semblent pas à jour, que faire ?',
      a: 'Rafraîchissez la page (F5). Si le problème persiste plus de 5 minutes, ouvrez un ticket dans Support & Helpdesk catégorie IT.',
    },
    {
      q: 'Puis-je personnaliser ce que je vois ?',
      a: 'Oui, bouton « Personnaliser » en haut à droite. Vous pouvez masquer/afficher les cartes et changer leur ordre. Vos choix sont sauvegardés pour votre compte.',
    },
    {
      q: 'Comment partager une vue avec mon adjoint ?',
      a: 'Bouton « Partager » → entrer l\'email de votre adjoint. Il verra exactement la même configuration que vous (mais uniquement si ses droits le permettent).',
    },
    {
      q: 'Que veut dire l\'alerte « Trésorerie tendue » ?',
      a: 'Votre solde projeté à 30 jours passe sous le seuil que vous avez défini avec la finance. Cliquez pour voir le détail des entrées/sorties prévues.',
    },
  ],
};
