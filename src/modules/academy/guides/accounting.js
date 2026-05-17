export default {
  id: 'accounting',
  label: 'Comptabilité',
  icon: 'Calculator',
  color: '#1E3A8A',
  tagline: 'Tenir les comptes proprement, sans formation comptable poussée',

  overview: `Le module Comptabilité enregistre toutes les opérations financières dans les bonnes catégories comptables. Chaque vente, achat, paiement crée automatiquement une écriture comptable conforme. Vous n'avez pas besoin de connaître le plan comptable général : le système le fait pour vous. Votre expert-comptable récupère le tout en un clic pour les déclarations.`,

  articles: [
    {
      id: 'accounting-automatique',
      title: 'Laisser les écritures se créer toutes seules',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Zap',
        content: `Vous n'avez (presque) rien à faire ici au quotidien. Quand vous créez une facture dans Ventes, encaissez un paiement, payez un fournisseur, ou passez une note de frais, l'écriture comptable correspondante se génère automatiquement dans les comptes prévus. Vous pouvez consulter le journal pour vérifier, mais la saisie est faite pour vous.`,
        bullets: [
          'Facture client émise → ventes (706) + TVA collectée (44571) + client (411)',
          'Paiement reçu → banque (512) + client (411) soldé',
          'Achat fournisseur → charges (6xx) + TVA déductible (44566) + fournisseur (401)',
          'Note de frais validée → charges + compte salarié',
          'Tout est conforme au plan comptable français',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Heart',
        content: `Vous économisez des heures de ressaisie comptable et vous évitez les erreurs (mauvais compte, oubli, double saisie). Votre comptabilité reste à jour en permanence — plus de course de fin de mois avec 200 pièces à enregistrer en deux jours.`,
      },
    },
    {
      id: 'accounting-tva',
      title: 'Préparer la déclaration de TVA',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'FileText',
        content: `Onglet « TVA » → choisir la période (mois ou trimestre). Le module calcule automatiquement la TVA collectée (sur ventes), la TVA déductible (sur achats), et le solde à payer ou crédit de TVA. Un brouillon de déclaration (CA3) est généré. Vous le vérifiez, vous l'ajustez si besoin, vous le validez. Export direct vers le portail impots.gouv.fr possible.`,
        bullets: [
          'Période mensuelle ou trimestrielle au choix',
          'Calcul automatique TVA collectée / déductible / à payer',
          'Brouillon CA3 prêt à valider',
          'Détail des opérations cliquable',
          'Export vers la DGFiP en un fichier conforme',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Award',
        content: `La TVA est l'une des taxes les plus chronophages quand on la fait à la main. Ici, c'est l'affaire de 15 minutes par mois. Plus de stress des 15 du mois, plus d'erreurs qui finissent en rappel fiscal avec pénalités.`,
      },
    },
    {
      id: 'accounting-cloture',
      title: 'Clôturer un exercice fiscal',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'CheckCircle',
        content: `En fin d'année, lancez la procédure de clôture. Le module vérifie : toutes les factures saisies, tous les paiements rapprochés, tous les inventaires validés. Liste des points à corriger affichée. Une fois tout vert, vous générez les états financiers (bilan, compte de résultat, annexes). Export pour votre expert-comptable. Une fois validé, l'exercice est figé.`,
        bullets: [
          'Liste de contrôle avant clôture (todo list)',
          'Génération bilan + compte de résultat + annexes',
          'Export FEC (Fichier des Écritures Comptables)',
          'Verrouillage de l\'exercice clos (pas de modifications a posteriori)',
          'Nouveaux soldes d\'ouverture créés pour l\'année suivante',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Compass',
        content: `La clôture annuelle se prépare tout au long de l'année. Avec ce module, elle prend des jours au lieu de semaines. Et votre expert-comptable apprécie : tout est déjà au format qu'il attend.`,
      },
    },
  ],

  faq: [
    {
      q: 'Que se passe-t-il si je me trompe sur une écriture ?',
      a: 'Sur l\'écriture concernée → bouton « Corriger ». Une écriture de contre-passation est générée automatiquement (pour la traçabilité — on ne supprime pas en comptabilité), puis la bonne écriture est créée.',
    },
    {
      q: 'Mon expert-comptable veut un format particulier (FEC, CSV…), c\'est possible ?',
      a: 'Oui. Onglet « Export » → choisir le format : FEC (norme légale), Excel, Sage, EBP, Cegid… Tout est généré en un clic.',
    },
    {
      q: 'Comment gérer la TVA intracommunautaire ?',
      a: 'Sur les factures à un client UE avec numéro de TVA, cocher « Intracom » : la TVA est à 0%, l\'écriture comptable utilise les bons comptes (auto-liquidation). La DEB est aussi générable depuis le module.',
    },
    {
      q: 'Plusieurs filiales, comment ça marche ?',
      a: 'Chaque filiale a ses propres comptes, isolés des autres. La consolidation groupe se fait dans le module Holding (Cockpit Groupe), pas en mélangeant les comptabilités.',
    },
    {
      q: 'Je découvre la comptabilité, par où commencer ?',
      a: 'Demandez à votre administrateur de programmer une formation. La logique est simple une fois vue. En attendant, vous pouvez utiliser le module en sécurité : les automatismes font le bon travail.',
    },
  ],
};
