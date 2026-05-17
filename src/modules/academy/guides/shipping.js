export default {
  id: 'shipping',
  label: 'Expéditions',
  icon: 'Truck',
  color: '#0891B2',
  tagline: 'Préparer, expédier et suivre les livraisons jusqu\'au client',

  overview: `Le module Expéditions gère tout ce qui se passe entre la commande validée et la livraison chez le client : préparation du colis, étiquette de transport, choix du transporteur, suivi du numéro de tracking. Vous voyez en un coup d'œil les colis en attente, en route, livrés ou en retard. Vos clients reçoivent automatiquement les notifications de suivi.`,

  articles: [
    {
      id: 'shipping-preparer',
      title: 'Préparer une expédition',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Package',
        content: `Onglet « À expédier » → la liste des commandes prêtes à partir s'affiche. Cliquez sur une commande pour la préparer. Vérifiez les produits, ajustez les quantités si besoin, indiquez le poids et les dimensions du colis. Choisissez le transporteur dans la liste (Chronopost, DHL, etc.). Validez : l'étiquette d'expédition est générée et prête à imprimer.`,
        bullets: [
          'Liste « À expédier » triée par date promise au client',
          'Bouton « Préparer » pour ouvrir le détail',
          'Saisir poids et dimensions (calculées par défaut si produits standards)',
          'Choisir transporteur (vos comptes pré-configurés)',
          'Étiquette PDF prête à imprimer en un clic',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Zap',
        content: `Vous gagnez 5 à 10 minutes par expédition par rapport au logiciel du transporteur. Tout est intégré : pas besoin de retaper l'adresse, la facture, le numéro de commande. Et vous gardez la traçabilité du transporteur choisi pour chaque colis.`,
      },
    },
    {
      id: 'shipping-suivre',
      title: 'Suivre les colis en route',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Eye',
        content: `Onglet « En transit » → liste des colis partis mais pas encore livrés. Chaque ligne affiche le numéro de suivi, le transporteur, la date d'expédition, le statut actuel (« en cours d'acheminement », « en livraison », « livré »). Cliquez sur un colis pour voir le détail des étapes. Si un colis est bloqué plus de 3 jours, une alerte rouge apparaît.`,
        bullets: [
          'Statut mis à jour automatiquement plusieurs fois par jour',
          'Cliquer sur un colis → détail des étapes (avec dates)',
          'Alerte si bloqué trop longtemps',
          'Bouton « Contacter le transporteur » avec numéro pré-rempli',
          'Notification automatique au client à chaque étape clé',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Heart',
        content: `Vous n'avez plus à aller sur 5 sites de transporteurs différents pour vérifier où en sont vos colis. Quand un client appelle pour savoir où en est sa livraison, vous avez la réponse en 5 secondes. Les retards sont détectés tôt, vous pouvez agir avant que le client ne s'énerve.`,
      },
    },
    {
      id: 'shipping-livre',
      title: 'Clôturer une livraison',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'CheckCircle',
        content: `Quand le transporteur confirme la livraison, le statut passe à « Livré » automatiquement. Si vous livrez vous-même (camion d'entreprise), le chauffeur clôture depuis l'app mobile avec signature du client sur l'écran. La preuve de livraison (POD) est stockée. La facture est déclenchée automatiquement si elle n'a pas déjà été émise.`,
        bullets: [
          'Statut « Livré » automatique pour les transporteurs',
          'Livraison interne : signature client sur app mobile',
          'Preuve de livraison (POD) stockée dans le dossier client',
          'Facture déclenchée automatiquement à la livraison',
          'Email de remerciement / demande d\'avis envoyé au client',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Award',
        content: `Le cycle se ferme proprement : vous prouvez la livraison (utile en cas de litige), vous facturez sans délai (trésorerie), vous demandez un avis (réputation). Tout ça sans intervention manuelle.`,
      },
    },
  ],

  faq: [
    {
      q: 'Comment ajouter un nouveau transporteur ?',
      a: 'Paramètres → Transporteurs → « Ajouter ». Saisir le nom, vos identifiants API (fournis par le transporteur lors de l\'ouverture du compte). Tester. Vos employés pourront ensuite le choisir lors des expéditions.',
    },
    {
      q: 'Que faire si une étiquette ne s\'imprime pas correctement ?',
      a: 'Vérifiez que vous avez sélectionné le bon format d\'imprimante (A4 ou étiquette thermique). Bouton « Re-télécharger ». Si le souci persiste, ouvrez un ticket dans Support & Helpdesk.',
    },
    {
      q: 'Un colis revient (refus, mauvaise adresse), comment gérer ?',
      a: 'Onglet « Retours » → enregistrer le retour avec motif. Le stock se met à jour automatiquement, et vous pouvez choisir : ré-expédier après correction, rembourser, recréer la facture.',
    },
    {
      q: 'Puis-je grouper plusieurs commandes dans un seul colis ?',
      a: 'Oui. Sélectionner plusieurs commandes → bouton « Regrouper en une expédition ». Pratique pour les clients qui passent plusieurs commandes dans la journée.',
    },
    {
      q: 'Le client veut changer son adresse après expédition, c\'est possible ?',
      a: 'Tant que le colis n\'a pas été remis au transporteur, oui (modifier dans le détail puis re-générer l\'étiquette). Après, ça dépend du transporteur — contactez-le directement.',
    },
  ],
};
