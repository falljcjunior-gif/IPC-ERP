export default {
  id: 'finance',
  label: 'Finance & Comptabilité',
  icon: 'Landmark',
  color: '#064E3B',
  tagline: 'Piloter la trésorerie, le budget et la rentabilité au jour le jour',

  overview: `Le module Finance & Comptabilité est l'outil du directeur financier (ou du dirigeant qui veut comprendre où va son argent). Vous y suivez la trésorerie en direct, vous comparez les dépenses au budget prévu, vous voyez les factures clients en retard, et vous projetez le cash des 90 prochains jours. C'est le module qui vous évite les mauvaises surprises de fin de mois.`,

  articles: [
    {
      id: 'finance-tresorerie',
      title: 'Suivre votre trésorerie au quotidien',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'TrendingUp',
        content: `À l'ouverture du module, le solde actuel de vos comptes bancaires s'affiche en gros. En dessous, un graphique montre l'évolution sur 90 jours : le passé (réel) en bleu, le futur (prévisionnel) en vert clair. Le prévisionnel additionne factures clients à encaisser, factures fournisseurs à payer, échéances fixes (loyers, salaires). Si le solde projeté passe sous votre seuil d'alerte, une zone rouge apparaît.`,
        bullets: [
          'Solde de tous vos comptes bancaires en haut',
          'Graphique sur 90 jours : réalisé + prévisionnel',
          'Zone rouge si projection sous seuil critique',
          'Détail jour par jour des entrées/sorties prévues',
          'Synchronisation bancaire automatique (selon votre banque)',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Compass',
        content: `Plus de stress en fin de mois pour savoir si vous pourrez payer les salaires. Vous voyez venir un éventuel trou de trésorerie 2 mois à l'avance, ce qui vous laisse le temps d'agir (relancer un client, négocier un délai fournisseur, mobiliser une ligne de crédit).`,
      },
    },
    {
      id: 'finance-budget',
      title: 'Comparer dépenses réelles et budget',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'BarChart2',
        content: `Onglet « Budget vs Réel ». Vous voyez par poste (salaires, achats, marketing…) le budget annuel, le réalisé à date, et le restant. Une barre de progression colorée indique si vous êtes dans les clous (vert), en alerte (orange), ou en dépassement (rouge). Cliquez sur un poste pour voir le détail des dépenses qui le composent.`,
        bullets: [
          'Vue par poste budgétaire',
          'Barre de progression : budget consommé à date',
          'Couleur : vert (OK), orange (attention), rouge (dépassement)',
          'Détail des dépenses cliquable par poste',
          'Projection fin d\'année basée sur le rythme actuel',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Target',
        content: `Vous gardez le contrôle sur les dépenses. Si un poste dérape, vous le voyez tôt et pouvez resserrer. Vous arrivez en conseil d'administration avec des chiffres à jour et des explications, pas avec des données vieilles de 6 semaines.`,
      },
    },
    {
      id: 'finance-creances',
      title: 'Relancer les clients en retard de paiement',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Mail',
        content: `Onglet « Créances clients ». La liste des factures émises non payées s'affiche, triée par ancienneté. Trois niveaux d'alerte : 0-30 jours (normal), 30-60 jours (à relancer), 60+ jours (relance urgente). Cliquez sur « Relancer » : un email pré-rédigé est envoyé au client avec la facture en pièce jointe. Vous pouvez aussi programmer des relances automatiques tous les 15 jours.`,
        bullets: [
          'Liste des factures impayées par ancienneté',
          'Couleur selon le retard : jaune / orange / rouge',
          'Bouton « Relancer » avec email pré-rédigé',
          'Relances automatiques programmables',
          'Notification quand le client paie enfin',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Heart',
        content: `Chaque jour de retard de paiement coûte cher à votre trésorerie. Avec des relances systématiques et automatiques, vous récupérez votre argent plus vite. Et vous ne laissez plus traîner de créances qui finissent en pertes.`,
      },
    },
  ],

  faq: [
    {
      q: 'Mes comptes bancaires ne sont pas synchronisés automatiquement, comment faire ?',
      a: 'Paramètres → Banques → « Ajouter banque ». Connexion via un agrégateur sécurisé (Tink, Budget Insight). Si votre banque n\'est pas dans la liste, vous pouvez importer manuellement les relevés (CSV).',
    },
    {
      q: 'Comment définir mes seuils d\'alerte trésorerie ?',
      a: 'Paramètres → Trésorerie → « Seuils ». Un seuil minimum global, et des seuils par compte si besoin. Notification email + alerte dans Cockpit Filiale dès franchissement.',
    },
    {
      q: 'Une facture est payée mais le module ne l\'a pas vu, que faire ?',
      a: 'Allez sur la facture → « Marquer comme payée » → saisir date et montant. Vous pouvez aussi rapprocher manuellement avec le relevé bancaire si la synchro a manqué l\'opération.',
    },
    {
      q: 'Puis-je donner accès à mon expert-comptable ?',
      a: 'Oui. Administration → Utilisateurs → « Inviter expert-comptable ». Accès limité à la comptabilité et aux pièces justificatives, sans vision sur le commercial ni RH.',
    },
    {
      q: 'Comment générer un compte de résultat ?',
      a: 'Onglet « Reporting » → « Compte de résultat ». Choisir la période. Le document est généré en quelques secondes, exportable en PDF ou Excel. Mensuel, trimestriel, annuel.',
    },
  ],
};
