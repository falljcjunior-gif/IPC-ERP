export default {
  id: 'crm',
  label: 'CRM & Ventes',
  icon: 'Users',
  color: '#F59E0B',
  tagline: 'Garder le contact avec vos clients et prospects, ne jamais en perdre un',

  overview: `Le module CRM (Customer Relationship Management) est votre carnet de contacts professionnel. Vous y trouvez tous vos clients et prospects, leur historique d'échanges, leurs commandes, leurs préférences. Chaque interaction (appel, email, visite) est tracée. Quand un commercial part en vacances, son remplaçant retrouve tout le contexte en 2 minutes.`,

  articles: [
    {
      id: 'crm-creer-contact',
      title: 'Ajouter un nouveau prospect',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'UserPlus',
        content: `Cliquez sur « Nouveau contact ». Saisissez le nom, la société, le téléphone et l'email. Choisissez le type : prospect (pas encore client), client, partenaire. Ajoutez des étiquettes (ex : « salon Paris », « secteur agro ») pour le retrouver plus tard. Validez : le contact est ajouté à votre base.`,
        bullets: [
          'Bouton « Nouveau contact » en haut',
          'Nom, société, téléphone, email — c\'est le minimum',
          'Étiquettes : libres, pour vous y retrouver',
          'Type : prospect / client / partenaire / autre',
          'Validation : le contact est créé en moins d\'une minute',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Compass',
        content: `Plus de carnets papier ou de fichiers Excel perdus. Tous vos contacts sont au même endroit, partagés avec votre équipe (selon les droits), retrouvables en quelques secondes. Si vous changez d'équipe ou si vous prenez votre retraite, l'entreprise garde sa mémoire commerciale.`,
      },
    },
    {
      id: 'crm-suivre',
      title: 'Suivre les échanges avec un client',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'MessageSquare',
        content: `Ouvrez la fiche du client. Vous voyez la liste de toutes les interactions : appels, emails, rendez-vous, devis envoyés. Pour ajouter un nouvel échange, cliquez sur « Ajouter activité » → choisissez le type → décrivez en 2 lignes ce qui s'est dit → validez. Vous pouvez aussi planifier le prochain contact (« rappeler dans 15 jours »).`,
        bullets: [
          'Liste chronologique des échanges sur la fiche client',
          'Bouton « Ajouter activité » → type + description + date',
          'Bouton « Planifier rappel » : alerte qui s\'affichera à la date prévue',
          'Joindre un email, un devis PDF ou une note vocale',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Heart',
        content: `Quand vous reprenez contact avec un client après 3 mois, vous voyez en un coup d'œil ce dont vous aviez parlé la dernière fois. Le client se sent reconnu (« vous m'aviez parlé de votre projet d'expansion »). C'est la base d'une relation commerciale solide.`,
      },
    },
    {
      id: 'crm-pipeline',
      title: 'Piloter votre pipeline commercial',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'BarChart2',
        content: `L'onglet « Pipeline » affiche vos opportunités commerciales sous forme de colonnes : à prospecter, contact établi, devis envoyé, négociation, gagné, perdu. Glissez une carte d'une colonne à l'autre quand le statut évolue. Le total prévisionnel en haut de chaque colonne se met à jour automatiquement.`,
        bullets: [
          'Vue en colonnes (Kanban) avec une opportunité par carte',
          'Glisser-déposer pour faire avancer une opportunité',
          'Total prévisionnel par colonne (somme des montants)',
          'Filtre par commercial, par produit, par période',
          'Couleur de la carte : rouge si pas d\'activité depuis 15 jours',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Target',
        content: `Vous visualisez en une image l'état de votre activité commerciale. Vous repérez les opportunités qui dorment, celles qui méritent un coup de pouce, et vous projetez votre CA des prochaines semaines avec réalisme. Plus de tableaux Excel à remettre à jour.`,
      },
    },
  ],

  faq: [
    {
      q: 'Comment éviter les doublons quand deux personnes saisissent le même client ?',
      a: 'Le système détecte les doublons (même email ou téléphone) au moment de la création et propose de fusionner. Vous pouvez aussi lancer une recherche de doublons depuis le menu Paramètres CRM.',
    },
    {
      q: 'Puis-je importer mes contacts depuis un fichier Excel ?',
      a: 'Oui. Bouton « Importer » → glisser votre fichier CSV ou Excel → faire correspondre les colonnes (nom, email, téléphone) → valider. Plusieurs centaines de contacts en une fois.',
    },
    {
      q: 'Je vois les contacts de mon collègue, est-ce normal ?',
      a: 'Selon les paramètres de votre filiale, les contacts peuvent être partagés (vision équipe) ou privés (chaque commercial son carnet). Demandez à votre administrateur la règle en vigueur.',
    },
    {
      q: 'Comment exporter ma base de contacts pour une campagne emailing ?',
      a: 'Bouton « Exporter » → filtrer (ex : prospects étiquette « salon Paris ») → choisir le format (CSV, Excel) → télécharger. Vous obtenez un fichier prêt pour Mailchimp ou autre.',
    },
    {
      q: 'Un client demande la suppression de ses données (RGPD), comment faire ?',
      a: 'Ouvrir la fiche → menu « ... » → « Supprimer (RGPD) ». Les données sont anonymisées (mais l\'historique des commandes reste pour les obligations comptables). Un journal de l\'opération est conservé.',
    },
  ],
};
