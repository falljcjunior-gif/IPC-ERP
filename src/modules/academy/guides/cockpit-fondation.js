export default {
  id: 'foundation',
  label: 'Cockpit Fondation',
  icon: 'Heart',
  color: '#EC4899',
  tagline: 'Le tableau de bord de la fondation : dons, programmes, bénéficiaires',

  overview: `Le Cockpit Fondation est dédié aux dirigeants de la fondation IPC Collect. Vous y suivez les dons reçus, les programmes en cours, et l'impact social mesuré (bénéficiaires aidés, projets financés). Contrairement aux filiales commerciales, l'indicateur principal n'est pas le profit mais l'impact. Tout y est conçu pour mesurer et communiquer cet impact.`,

  articles: [
    {
      id: 'cockpit-fondation-dons',
      title: 'Suivre les dons reçus',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Gift',
        content: `Une zone « Dons » en haut affiche le total reçu ce mois, comparé au mois précédent et à l'objectif annuel. Une liste sous les chiffres montre les derniers dons (anonymisés si le donateur l'a demandé), avec date et montant. Cliquez sur un don pour voir d'où il vient (entreprise, particulier, événement) et envoyer un reçu fiscal.`,
        bullets: [
          'Total des dons du mois en cours',
          'Comparaison avec le mois précédent et l\'objectif annuel',
          'Liste chronologique des derniers dons',
          'Bouton « Envoyer reçu fiscal » sur chaque ligne',
          'Filtre par campagne, par canal (web, événement, partenaire)',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'TrendingUp',
        content: `Vous savez en permanence si la collecte avance bien et où vous en êtes par rapport à vos objectifs annuels. Les reçus fiscaux partent vite, ce qui fidélise les donateurs. Vous identifiez aussi vos meilleurs canaux pour orienter vos campagnes futures.`,
      },
    },
    {
      id: 'cockpit-fondation-programmes',
      title: 'Piloter vos programmes',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Layers',
        content: `Chaque programme social (scolarisation, santé, formation…) a sa propre carte. Elle indique : budget alloué, dépensé, bénéficiaires touchés, % d'avancement. Cliquez sur la carte pour voir les actions en cours, les équipes terrain, les prochaines étapes. Vous pouvez ajouter une mise à jour de progression directement depuis cette vue.`,
        bullets: [
          'Une carte par programme actif',
          'Budget alloué vs dépensé, en barre de progression',
          'Nombre de bénéficiaires aidés à date',
          'Bouton « Ajouter mise à jour » pour saisir un compte-rendu terrain',
          'Photos et témoignages remontés du terrain visibles dans le détail',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'CheckCircle',
        content: `Vous gardez un œil sur tous les programmes sans avoir à demander des rapports. Les chefs de projet remontent leur avancement directement. Vous gagnez en réactivité quand un programme rencontre des difficultés (financement, terrain, équipe).`,
      },
    },
    {
      id: 'cockpit-fondation-impact',
      title: 'Mesurer et communiquer l\'impact',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'BarChart2',
        content: `Une zone « Impact » totalise les indicateurs clés sur la période : nombre de bénéficiaires, projets financés, écoles construites, kits distribués… Vous pouvez générer un rapport annuel d'impact en quelques clics (bouton « Rapport d'impact »). Il s'exporte en PDF prêt à envoyer aux donateurs et partenaires.`,
        bullets: [
          'Compteurs cumulés par type d\'impact',
          'Comparaison année en cours vs précédente',
          'Bouton « Rapport d\'impact PDF » avec photos et témoignages',
          'Format prêt pour les bailleurs et donateurs majeurs',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Award',
        content: `La transparence est la clé pour fidéliser les donateurs. En montrant des chiffres précis et des histoires concrètes, vous renforcez la confiance et facilitez les renouvellements de dons. Le rapport annuel se prépare en heures au lieu de semaines.`,
      },
    },
  ],

  faq: [
    {
      q: 'Comment ajouter un nouveau programme ?',
      a: 'Bouton « Nouveau programme » en haut. Donnez-lui un nom, un budget, une période et un responsable. Il apparaîtra immédiatement dans votre cockpit.',
    },
    {
      q: 'Un donateur veut un reçu fiscal pour un don ancien, comment faire ?',
      a: 'Onglet « Dons » → filtrer par nom de donateur → cliquer sur le don → bouton « Renvoyer reçu fiscal ». Le PDF est régénéré et envoyé par email.',
    },
    {
      q: 'Peut-on importer des dons reçus par chèque ou virement bancaire ?',
      a: 'Oui. Bouton « Importer dons » → coller un tableau (Excel ou CSV) ou saisir manuellement. La comptabilité de la fondation se met à jour automatiquement.',
    },
    {
      q: 'Comment voir uniquement un programme précis ?',
      a: 'En haut, filtrer par programme. Toutes les zones (dons, dépenses, impact) se filtreront pour ce programme uniquement.',
    },
    {
      q: 'Les données de la fondation sont-elles séparées du reste du groupe ?',
      a: 'Oui, strictement. Les filiales commerciales ne voient pas la fondation et inversement. Seule la direction groupe a une vue consolidée.',
    },
  ],
};
