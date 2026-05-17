export default {
  id: 'office_admin',
  label: 'Services Généraux',
  icon: 'Building2',
  color: '#0F766E',
  tagline: 'Gérer les locaux, le matériel et les demandes internes sans friction',

  overview: `Le module Services Généraux centralise tout ce qui concerne la vie pratique du bureau : demandes de matériel, réservations de salles, gestion du parc de matériel informatique, maintenance des locaux. Une seule interface pour signaler un problème, demander une fourniture, ou réserver une salle de réunion.`,

  articles: [
    {
      id: 'office-demande',
      title: 'Faire une demande de matériel ou de service',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'ClipboardList',
        content: `Bouton « Nouvelle demande ». Choisissez la catégorie : matériel informatique, fournitures, maintenance, nettoyage, autre. Décrivez votre besoin (ou le problème) en quelques lignes. Indiquez la priorité et la date souhaitée si applicable. Validez : la demande est transmise aux services généraux. Vous recevez une notification quand elle est prise en charge et quand elle est résolue.`,
        bullets: [
          'Bouton « Nouvelle demande »',
          'Catégorie : IT, fournitures, maintenance, autre',
          'Description du besoin ou du problème',
          'Priorité : normal, urgent',
          'Suivi en temps réel jusqu\'à résolution',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Heart',
        content: `Plus besoin d'appeler ou d'envoyer un email à 3 personnes pour commander des stylos ou signaler une ampoule grillée. Votre demande est tracée, assignée, et vous savez quand elle sera traitée.`,
      },
    },
    {
      id: 'office-salles',
      title: 'Réserver une salle ou une ressource',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'MapPin',
        content: `Onglet « Ressources » → calendrier des salles de réunion, voitures de service, équipements (vidéoprojecteur, sono…). Cliquez sur le créneau disponible (en vert). Indiquez l'objet de la réservation, le nombre de personnes, et les équipements nécessaires. Validez : la salle est réservée pour vous, plus personne d'autre ne peut prendre le même créneau.`,
        bullets: [
          'Vue calendrier de toutes les ressources',
          'Créneaux disponibles en vert, occupés en rouge',
          'Réservation en 2 clics',
          'Notification de confirmation',
          'Annulation possible jusqu\'à 1 heure avant',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Compass',
        content: `Plus de double-réservation, plus de salle occupée à votre arrivée. Vous savez à l'avance si la salle avec le grand écran est dispo jeudi matin, ou si toutes les voitures sont prises ce vendredi.`,
      },
    },
    {
      id: 'office-inventaire',
      title: 'Consulter l\'inventaire du matériel',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Package',
        content: `Onglet « Inventaire ». Liste de tout le matériel de l'entreprise (ordinateurs, téléphones, véhicules, mobilier…) avec son état (en service, en réparation, disponible) et son affectation actuelle. Si vous récupérez du matériel ou le rendez, signalez-le ici en 2 clics. Le gestionnaire voit en temps réel qui a quoi.`,
        bullets: [
          'Liste complète du matériel avec statut',
          'Affectation : qui utilise quoi',
          'Signaler une réception ou un retour de matériel',
          'Signaler une panne ou un matériel endommagé',
          'Historique de chaque équipement',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'ClipboardCheck',
        content: `Fini les inventaires annuels chaotiques. Le gestionnaire sait en permanence où est chaque équipement. Si un ordinateur disparaît, on sait qui l'avait en dernier.`,
      },
    },
  ],

  faq: [
    {
      q: 'Ma demande n\'est pas dans les catégories proposées, que faire ?',
      a: 'Choisissez « Autre » et décrivez votre besoin. Un gestionnaire la recatégorisera et la traitera. Pas de risque de demande perdue.',
    },
    {
      q: 'Comment savoir si ma salle de réunion est équipée d\'un vidéoprojecteur ?',
      a: 'Dans la fiche de la salle (clic sur son nom), vous voyez les équipements disponibles : écran, vidéoprojecteur, tableau blanc, visioconférence, capacité maximale.',
    },
    {
      q: 'Quelqu\'un a pris ma réservation de salle, que faire ?',
      a: 'Impossible — le système bloque les doubles réservations. Si la salle est occupée malgré votre réservation, signalez-le via une demande de type « Litige réservation ».',
    },
    {
      q: 'Comment signaler une panne dans les locaux (fuite, électricité…) ?',
      a: 'Nouvelle demande → catégorie « Maintenance » → priorité « Urgent » si dangereux. Le responsable maintenance reçoit une alerte immédiate.',
    },
    {
      q: 'Peut-on voir les demandes en cours de toute l\'équipe ?',
      a: 'Les gestionnaires voient toutes les demandes de leur entité. Les autres collaborateurs ne voient que leurs propres demandes.',
    },
  ],
};
