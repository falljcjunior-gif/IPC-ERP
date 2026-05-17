export default {
  id: 'bi',
  label: 'Analyses Avancées',
  icon: 'BarChart2',
  color: '#6D28D9',
  tagline: 'Comprendre vos chiffres et prendre de meilleures décisions',

  overview: `Le module Analyses Avancées transforme toutes les données de vos modules (ventes, RH, production, finance…) en graphiques et tableaux de bord clairs. Vous identifiez les tendances, comparez les périodes, et prenez des décisions basées sur des faits. Pas besoin de maîtriser Excel : les analyses sont prêtes à l'emploi.`,

  articles: [
    {
      id: 'analytics-explorer',
      title: 'Explorer les tableaux de bord prêts à l\'emploi',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'LayoutDashboard',
        content: `Accueil du module : liste de tableaux de bord préconfigurés par domaine (Commercial, RH, Finance, Production…). Cliquez sur un tableau de bord pour l'ouvrir. Utilisez les filtres en haut (période, entité, département) pour affiner les données. Survolez un graphique pour voir les chiffres précis. Cliquez sur une barre ou un point pour voir le détail des données sous-jacentes.`,
        bullets: [
          'Tableaux de bord par domaine : Commercial, RH, Finance, Ops',
          'Filtres : période (semaine, mois, trimestre, année), entité, département',
          'Survol d\'un graphique → chiffres exacts',
          'Clic sur un élément → liste des données détaillées',
          'Mise à jour automatique des données en temps réel',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'TrendingUp',
        content: `En 2 minutes, vous avez une photo complète de votre activité. Plus besoin de demander des extractions à la comptabilité ou au contrôleur de gestion. Les réponses sont là, immédiatement.`,
      },
    },
    {
      id: 'analytics-creer',
      title: 'Créer un rapport personnalisé',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'PlusCircle',
        content: `Bouton « Nouveau rapport ». Choisissez la source de données (Ventes, RH, Finance…). Sélectionnez les indicateurs à afficher (chiffre d'affaires, nombre de commandes, effectif…) et les axes de comparaison (par mois, par commercial, par produit). Choisissez le type de graphique (barres, courbes, camembert, tableau). Donnez un nom et sauvegardez. Le rapport est disponible dans vos tableaux de bord.`,
        bullets: [
          'Choix de la source de données',
          'Sélection des indicateurs (KPIs) à afficher',
          'Axes de comparaison : temporel, géographique, par personne',
          'Types de graphiques : barres, courbes, camembert, tableau',
          'Sauvegarde et partage avec d\'autres utilisateurs',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Compass',
        content: `Vous construisez exactement le rapport dont vous avez besoin pour votre réunion de direction, votre revue mensuelle, ou votre rapport au conseil d'administration. Une fois créé, il se met à jour tout seul.`,
      },
    },
    {
      id: 'analytics-exporter',
      title: 'Exporter et partager les données',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Share2',
        content: `Sur n'importe quel rapport ou tableau de bord → bouton « Exporter ». Choisissez le format : PDF (pour présentation), Excel (pour retraitement), CSV (pour import dans un autre outil). Pour partager un tableau de bord avec un collègue : bouton « Partager » → choisir la personne → elle reçoit un lien direct. Vous pouvez aussi programmer un envoi automatique par email (ex : rapport hebdomadaire tous les lundis à 8h).`,
        bullets: [
          'Export : PDF, Excel, CSV',
          'Partage avec un collègue par lien ou email',
          'Envoi automatique programmé (quotidien, hebdomadaire, mensuel)',
          'Impression directe depuis le module',
          'Intégration dans une présentation PowerPoint possible via l\'export image',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Award',
        content: `Vos reportings se font en 5 minutes au lieu de 2 heures. Le rapport de direction du lundi arrive automatiquement dans la boîte mail des membres du COMEX sans que vous ayez à rien faire.`,
      },
    },
  ],

  faq: [
    {
      q: 'Jusqu\'à quand remontent les données historiques ?',
      a: 'Depuis la date de mise en service de la plateforme pour votre entité. Plus l\'entreprise utilise la plateforme longtemps, plus les analyses historiques sont riches.',
    },
    {
      q: 'Peut-on comparer deux entités (Filiale Sénégal vs Filiale Côte d\'Ivoire) ?',
      a: 'Oui si vous avez les droits Holding. Dans les filtres, sélectionnez plusieurs entités. Le graphique les affiche en parallèle pour comparaison directe.',
    },
    {
      q: 'Les données affichées sont-elles en temps réel ?',
      a: 'Oui pour la plupart. Certains indicateurs calculés (marges, agrégats) sont mis à jour toutes les heures pour éviter de ralentir la plateforme.',
    },
    {
      q: 'Puis-je créer une alerte si un indicateur dépasse un seuil ?',
      a: 'Oui. Sur un indicateur → clic droit → « Créer une alerte ». Définissez le seuil (ex : CA en dessous de 50 000 €/mois) et le canal de notification (email, notification dans l\'app). Vous êtes prévenu automatiquement.',
    },
    {
      q: 'Est-ce qu\'on peut connecter une source de données externe (Google Analytics, Shopify…) ?',
      a: 'Selon votre contrat, des connecteurs tiers sont disponibles. Contactez votre administrateur ou l\'équipe technique pour connaître les intégrations disponibles.',
    },
  ],
};
