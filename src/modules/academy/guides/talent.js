export default {
  id: 'talent',
  label: 'People & Culture',
  icon: 'Sparkles',
  color: '#DB2777',
  tagline: 'Recruter, intégrer, faire grandir vos talents',

  overview: `People & Culture est le module dédié au recrutement et au développement des collaborateurs. Vous y gérez les offres d\'emploi, les candidatures, l\'intégration des nouveaux, les compétences, les parcours d\'évolution. Il complète Ressources Humaines (qui couvre l\'administratif) sur les aspects humains et stratégiques.`,

  articles: [
    {
      id: 'talent-recrutement',
      title: 'Publier une offre et suivre les candidatures',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Megaphone',
        content: `Bouton « Nouvelle offre ». Saisissez intitulé, descriptif, lieu, fourchette salariale, profil recherché. Choisissez où publier : site carrière interne, LinkedIn, Indeed, Welcome to the Jungle… La publication est automatique. Les candidatures arrivent dans le module et vous les traitez depuis un tableau Kanban : reçue → présélectionnée → entretien → offre → embauché ou refusé.`,
        bullets: [
          'Description d\'offre dans un éditeur visuel',
          'Multi-diffusion en un clic',
          'Pipeline de candidats en Kanban',
          'CV et lettre stockés dans le dossier candidat',
          'Notes partagées entre les évaluateurs',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Rocket',
        content: `Le recrutement se professionnalise sans demander un outil dédié. Tous les candidats sont au même endroit, plus aucun CV ne se perd dans une boîte mail. Vous répondez plus vite aux candidats, ce qui améliore votre image employeur.`,
      },
    },
    {
      id: 'talent-onboarding',
      title: 'Réussir l\'intégration d\'un nouveau',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'UserPlus',
        content: `À l\'embauche, un parcours d\'onboarding démarre automatiquement : checklist matériel à fournir, comptes à créer, formations à suivre, personnes à rencontrer. Le nouveau a sa propre vue avec les étapes à valider. Le manager voit l\'avancement et reçoit une alerte si quelque chose stagne. Au bout de 3 mois, un point de fin de période d\'essai est planifié.`,
        bullets: [
          'Checklist d\'onboarding personnalisable par poste',
          'Vue collaborateur : ses étapes à valider',
          'Vue manager : avancement de tous les nouveaux',
          'Présentations programmées avec les bons interlocuteurs',
          'Point fin de période d\'essai planifié à J+90',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Heart',
        content: `Une intégration ratée coûte cher (turnover, démotivation). Un parcours structuré donne au nouveau l\'impression d\'être attendu, accompagné. Au bout de 3 mois, il est opérationnel et engagé — pas perdu et tenté par un autre poste ailleurs.`,
      },
    },
    {
      id: 'talent-evolution',
      title: 'Cartographier les compétences et les évolutions',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'BarChart2',
        content: `Onglet « Compétences » → chaque salarié peut documenter ses compétences (niveau auto-déclaré + validé par le manager). L\'entreprise peut visualiser les compétences disponibles, les manques, les départs à risque. Les souhaits d\'évolution sont collectés lors des entretiens annuels et apparaissent dans une vue « Mobilité interne ».`,
        bullets: [
          'Cartographie des compétences par personne et par équipe',
          'Niveaux : débutant / autonome / expert / formateur',
          'Vue manquant en compétences critiques',
          'Mobilité interne : qui veut évoluer où',
          'Plan de formation cohérent avec les écarts identifiés',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Target',
        content: `Vous identifiez les talents en interne avant de recruter en externe (souvent moins cher et plus rapide). Vous voyez les compétences rares qui partent à la retraite et vous anticipez la transmission. Vos collaborateurs voient qu\'il y a un chemin d\'évolution chez vous.`,
      },
    },
  ],

  faq: [
    {
      q: 'Quelle différence entre RH et People & Culture ?',
      a: 'RH = administratif (contrats, paie, congés). People & Culture = stratégique humain (recrutement, intégration, compétences, évolution). Les deux modules sont liés et partagent les données salariés.',
    },
    {
      q: 'Comment respecter la confidentialité des candidats RGPD ?',
      a: 'Les CV sont conservés 2 ans max après la dernière interaction. Au-delà, suppression automatique. Le candidat peut demander à tout moment son retrait (lien dans l\'email de réponse).',
    },
    {
      q: 'Qui peut voir les évaluations et notes sur les candidats ?',
      a: 'Uniquement les personnes du jury de recrutement. Pas les autres collaborateurs, pas la direction d\'une autre filiale. Trace dans le module Audit.',
    },
    {
      q: 'Le module gère-t-il les stages, alternances, intérim ?',
      a: 'Oui, mêmes outils. Vous précisez le type de contrat dès l\'offre. Les obligations spécifiques (convention de stage, tuteur, livret) sont rappelées au bon moment.',
    },
    {
      q: 'Peut-on faire des évaluations 360° (manager + pairs + équipe) ?',
      a: 'Oui, en lançant une campagne d\'évaluation. Choisir les évaluateurs, envoi des questionnaires, synthèse anonymisée. Plus riche que l\'entretien annuel classique pour les profils managers.',
    },
  ],
};
