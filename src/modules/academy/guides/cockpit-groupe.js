export default {
  id: 'holding',
  label: 'Cockpit Groupe',
  icon: 'Globe',
  color: '#064E3B',
  tagline: 'La vue d\'ensemble du groupe en un coup d\'œil',

  overview: `Le Cockpit Groupe est le tableau de bord du dirigeant qui supervise toutes les filiales et fondations du groupe. En ouvrant ce module, vous voyez immédiatement les chiffres-clés consolidés : chiffre d'affaires, trésorerie, effectifs, alertes. Vous pouvez plonger dans une filiale précise d'un seul clic. C'est l'endroit où l'on prend les grandes décisions stratégiques sans se noyer dans le détail opérationnel.`,

  articles: [
    {
      id: 'cockpit-groupe-lire',
      title: 'Lire vos indicateurs principaux',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Eye',
        content: `À l'ouverture du module, vous voyez des cartes colorées en haut de l'écran : chacune représente un indicateur (CA, marge, trésorerie, effectif…). La couleur indique l'état : vert = sain, orange = à surveiller, rouge = action requise. En dessous, des graphiques montrent l'évolution sur 12 mois. Passez la souris sur une courbe pour voir le détail mois par mois.`,
        bullets: [
          'Cartes du haut : chiffres-clés du groupe en temps réel',
          'Couleur de la carte : vert (OK), orange (attention), rouge (urgent)',
          'Graphiques : évolution sur 12 mois glissants',
          'Cliquer sur une carte pour voir le détail par filiale',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Compass',
        content: `Vous gagnez un temps précieux en arrivant le matin : pas besoin d'aller chercher les chiffres dans chaque filiale. Vous voyez immédiatement où le groupe va bien et où il faut agir. Cela vous permet de poser les bonnes questions en réunion plutôt que de demander des rapports qui mettent des jours à arriver.`,
      },
    },
    {
      id: 'cockpit-groupe-comparer',
      title: 'Comparer les filiales entre elles',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'BarChart2',
        content: `Cliquez sur l'onglet « Comparaison ». Choisissez les filiales à comparer dans la liste (cochez 2 à 5 filiales). Sélectionnez l'indicateur (chiffre d'affaires, marge, productivité…). Le système affiche un graphique côte à côte. Vous pouvez exporter le résultat en PDF pour le conseil d'administration.`,
        bullets: [
          'Onglet « Comparaison » → cocher les filiales',
          'Choisir l\'indicateur à comparer',
          'Graphique en barres côte à côte',
          'Bouton « Exporter PDF » en haut à droite',
          'L\'historique de vos comparaisons est sauvegardé',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Target',
        content: `Vous repérez rapidement les filiales qui sur-performent (pour partager leurs bonnes pratiques) et celles qui décrochent (pour les aider). Plus besoin de demander à la finance de monter un tableau Excel : tout est prêt en 30 secondes, à jour, et déjà mis en forme.`,
      },
    },
    {
      id: 'cockpit-groupe-alertes',
      title: 'Gérer les alertes critiques',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Zap',
        content: `Une zone « Alertes » en haut de l'écran liste les événements importants : trésorerie qui descend trop bas, retard de paiement, incident qualité, départ d'un cadre clé. Chaque alerte indique la filiale, le type, et propose une action (appeler le DG, demander un point, ouvrir le module concerné). Cliquez sur « Traiter » pour marquer l'alerte comme prise en compte.`,
        bullets: [
          'Zone rouge en haut = alertes en attente',
          'Cliquer sur une alerte pour voir le détail et la filiale',
          'Bouton « Traiter » : l\'alerte est archivée mais reste consultable',
          'Vous recevez aussi une notification email pour les alertes urgentes',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Heart',
        content: `Plus aucun mauvaise surprise. Si une filiale a un souci sérieux, vous le savez le jour même, pas en fin de mois quand les comptes remontent. Vous pouvez intervenir tôt, quand c'est encore corrigeable.`,
      },
    },
  ],

  faq: [
    {
      q: 'Je ne vois pas une filiale dans mon cockpit, pourquoi ?',
      a: 'Soit la filiale n\'est pas encore rattachée au groupe (à faire par l\'administrateur dans Administration → Entités), soit vos droits ne couvrent pas cette filiale. Contactez votre administrateur.',
    },
    {
      q: 'Les chiffres sont-ils en temps réel ?',
      a: 'Oui. Dès qu\'une vente, une dépense ou un mouvement est enregistré dans une filiale, le Cockpit Groupe se met à jour automatiquement (quelques secondes de délai).',
    },
    {
      q: 'Puis-je modifier les chiffres d\'une filiale depuis ici ?',
      a: 'Non. Le Cockpit Groupe est en lecture seule pour préserver l\'autonomie des filiales. Chaque filiale gère ses propres données. Vous voyez tout, mais vous n\'écrivez pas à leur place.',
    },
    {
      q: 'Comment exporter un rapport pour le conseil d\'administration ?',
      a: 'En haut à droite, bouton « Rapport CA ». Choisissez la période, les indicateurs et les filiales à inclure. Le PDF est généré en quelques secondes, déjà mis en forme.',
    },
    {
      q: 'Que signifie une carte qui devient grise ?',
      a: 'Les données ne sont pas encore arrivées de la filiale concernée (ex : clôture mensuelle pas terminée). Cliquez sur la carte pour voir qui doit valider et quand.',
    },
  ],
};
