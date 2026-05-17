export default {
  id: 'marketing',
  label: 'Marketing Digital',
  icon: 'Megaphone',
  color: '#EC4899',
  tagline: 'Lancer des campagnes, mesurer leur impact, attirer de nouveaux clients',

  overview: `Le module Marketing Digital vous aide à organiser vos campagnes promotionnelles : emails, réseaux sociaux, événements, publicités. Vous planifiez, vous lancez, vous suivez les résultats (combien de personnes ont vu, cliqué, acheté). Plus besoin d'avoir 10 outils différents : votre marketing s'aligne avec vos ventes et votre CRM dans une seule plateforme.`,

  articles: [
    {
      id: 'marketing-campagne',
      title: 'Créer une campagne email',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Mail',
        content: `Bouton « Nouvelle campagne » → choisissez « Email ». Donnez un nom interne (ex : « Promo rentrée 2026 »). Choisissez votre audience (tous les clients, prospects étiquette « salon Paris », clients inactifs depuis 6 mois…). Rédigez l'objet et le contenu (modèle visuel ou texte simple). Programmez la date et l'heure d'envoi. Validez.`,
        bullets: [
          'Nom interne + objet de l\'email',
          'Audience choisie depuis vos contacts CRM',
          'Modèles visuels prêts à l\'emploi ou texte simple',
          'Aperçu sur mobile et bureau avant envoi',
          'Programmation à la date/heure de votre choix',
          'Test d\'envoi à vous-même avant le grand départ',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Rocket',
        content: `Vous communiquez avec vos clients au bon moment, avec le bon message, sans vous battre avec un logiciel d'emailing externe. Les contacts viennent directement de votre CRM : pas d'export-import à risque RGPD.`,
      },
    },
    {
      id: 'marketing-mesurer',
      title: 'Mesurer les résultats d\'une campagne',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'BarChart2',
        content: `Une fois la campagne envoyée, ouvrez son rapport. Vous voyez : nombre d'envois, ouvertures, clics sur les liens, désinscriptions, ventes générées (si la campagne mène à un produit suivi). Un graphique montre l'évolution heure par heure. Vous savez ce qui fonctionne (objet de l'email, créneau d'envoi) pour la prochaine fois.`,
        bullets: [
          'Taux d\'ouverture : un bon email dépasse 20%',
          'Taux de clic : 2-5% est correct, 10% est excellent',
          'CA généré : combien la campagne a rapporté en €',
          'Comparaison avec les campagnes précédentes',
          'Liste des contacts qui ont cliqué (à transmettre aux commerciaux)',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Target',
        content: `Vous arrêtez de tirer dans le brouillard. Chaque campagne vous apprend quelque chose : tel objet a mieux marché, tel créneau est moins efficace. En quelques mois, votre marketing devient nettement plus performant — et vous pouvez prouver le retour sur investissement à votre direction.`,
      },
    },
    {
      id: 'marketing-evenements',
      title: 'Organiser un événement (salon, webinaire, JPO)',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Sparkles',
        content: `Bouton « Nouvel événement ». Saisissez le titre, la date, le lieu (ou lien visio). Créez un formulaire d'inscription public (lien à partager) : nom, email, société. Les inscrits arrivent automatiquement dans votre CRM avec l'étiquette de l'événement. Le jour J, marquez les présents en quelques clics. Après l'événement, lancez une campagne de relance ciblée.`,
        bullets: [
          'Formulaire d\'inscription public à partager sur LinkedIn, site web',
          'Inscrits intégrés au CRM avec étiquette dédiée',
          'Email de confirmation automatique',
          'Liste de présence à pointer le jour J',
          'Campagne de remerciement / relance après l\'événement',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Heart',
        content: `Un événement bien suivi génère 3 fois plus de ventes qu'un événement où on perd les contacts dans un cahier. Tout est tracé du premier clic à l'inscription, à la présence, à la commande. Vous mesurez exactement le retour sur investissement de chaque salon.`,
      },
    },
  ],

  faq: [
    {
      q: 'Combien de contacts puis-je toucher par campagne ?',
      a: 'Selon votre plan, plusieurs milliers à plusieurs dizaines de milliers par jour. Si vous prévoyez un envoi massif, prévenez l\'administrateur 48h avant pour éviter une coupure du fournisseur email.',
    },
    {
      q: 'Comment éviter d\'être marqué comme spam ?',
      a: 'Respectez 3 règles : (1) n\'envoyez qu\'à des contacts qui ont accepté, (2) mettez un lien de désinscription visible, (3) ne sur-promettez pas dans l\'objet (« GRATUIT !!! »). Le module bloque les pratiques à risque.',
    },
    {
      q: 'Puis-je faire des campagnes A/B (tester deux objets) ?',
      a: 'Oui. Lors de la création, activez « Test A/B ». Saisissez deux objets différents. La campagne envoie 20% des emails avec chaque objet, mesure les ouvertures, et envoie le reste avec le gagnant.',
    },
    {
      q: 'Mes contacts sont dans plusieurs filiales, comment cibler ?',
      a: 'Chaque filiale a sa base. Pour cibler les contacts d\'une seule filiale, votre audience est automatiquement limitée. Pour une campagne groupe, demandez à la direction.',
    },
    {
      q: 'Comment savoir si une campagne a rapporté de l\'argent ?',
      a: 'Lors de la création, liez la campagne à un produit ou une promo. Toute commande sur ce produit dans les 30 jours suivants est attribuée à la campagne. CA total visible dans le rapport.',
    },
  ],
};
