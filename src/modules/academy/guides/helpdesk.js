export default {
  id: 'helpdesk',
  label: 'Support & Helpdesk',
  icon: 'LifeBuoy',
  color: '#0EA5E9',
  tagline: 'Demander de l\'aide en 2 clics et suivre la résolution',

  overview: `Le module Support & Helpdesk permet à toute personne dans l'entreprise de signaler un problème ou demander de l'aide (IT, RH, logistique…). Chaque demande devient un « ticket » pris en charge par la bonne équipe. Vous suivez l'avancement, vous êtes notifié à la résolution. Plus besoin d'envoyer un mail à plusieurs personnes : tout est centralisé et tracé.`,

  articles: [
    {
      id: 'helpdesk-creer',
      title: 'Créer un ticket en 30 secondes',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'MousePointerClick',
        content: `Cliquez sur « Nouveau ticket » en haut. Choisissez la catégorie (IT, RH, Logistique, Finance…), la priorité, décrivez votre problème avec vos mots. Joignez une photo si utile (capture d'écran d'une erreur, photo d'un matériel cassé). Validez : le ticket est envoyé automatiquement à l'équipe concernée.`,
        bullets: [
          'Bouton « Nouveau ticket »',
          'Catégorie qui oriente vers la bonne équipe',
          'Description en quelques phrases',
          'Photo en pièce jointe (très utile pour l\'équipe support)',
          'Réception confirmée par email',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Heart',
        content: `Plus besoin de courir après le bon interlocuteur. Le ticket arrive directement chez la personne qui peut résoudre. Vous gardez une trace écrite. Si l'agent est absent, son remplaçant prend le relais — vous n'êtes jamais bloqué.`,
      },
    },
    {
      id: 'helpdesk-suivre',
      title: 'Suivre l\'avancement de vos demandes',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Eye',
        content: `Onglet « Mes tickets ». La liste de toutes vos demandes en cours s'affiche avec leur statut : ouvert, pris en charge, en attente d'info, résolu, fermé. Cliquez sur un ticket pour voir l'historique des échanges. Vous pouvez ajouter un commentaire à tout moment (« J'ai testé, ça marche toujours pas »). Le support répond, vous êtes notifié.`,
        bullets: [
          'Liste de vos tickets en cours et fermés',
          'Statut visible en un coup d\'œil',
          'Historique complet de la conversation',
          'Ajout de commentaires des deux côtés',
          'Notification email à chaque réponse',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Compass',
        content: `Vous ne vous demandez plus si votre demande a été lue. Vous voyez exactement où elle en est. Si elle traîne, vous pouvez relancer poliment via un commentaire. Les délais s'améliorent côté support quand chacun voit qui a quoi en charge.`,
      },
    },
    {
      id: 'helpdesk-confidentiel',
      title: 'Choisir la bonne catégorie (notamment RH)',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Lock',
        content: `Certaines demandes sont sensibles : harcèlement, conflit, demande de mobilité interne, problème de paie. Choisissez la catégorie « Confidentiel RH ». Le ticket sera visible uniquement par les RH et vous, jamais par d'autres managers ni l'équipe support classique. Description anonymisable si vraiment nécessaire.`,
        bullets: [
          'Catégorie « Confidentiel RH » pour les sujets sensibles',
          'Visibilité réduite : RH + vous, c\'est tout',
          'Trace conservée pour la protection des deux parties',
          'Option anonyme pour les situations très graves',
          'Délais de réponse cadrés par la politique RH',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Shield',
        content: `Vous avez un canal sécurisé pour les sujets délicats que vous n'osez pas mettre par email. Vos données restent confidentielles, et l'entreprise a une trace officielle de votre demande (utile en cas de procédure ultérieure).`,
      },
    },
  ],

  faq: [
    {
      q: 'Je ne sais pas dans quelle catégorie ranger ma demande…',
      a: 'Mettez « Autre ». Un agent réorientera vers la bonne équipe. Pas grave de se tromper, le système est conçu pour absorber ça.',
    },
    {
      q: 'Combien de temps pour une réponse ?',
      a: 'Selon la priorité que vous avez choisie : Urgent ≤ 1 h, Haute ≤ 4 h, Normale ≤ 1 jour, Basse ≤ 3 jours. Délais affichés sur le ticket. Si dépassés, escalade automatique au manager support.',
    },
    {
      q: 'Puis-je voir les tickets de mes collègues ?',
      a: 'Non — par confidentialité, vous ne voyez que les vôtres. Sauf si vous êtes manager support ou habilité dans Administration.',
    },
    {
      q: 'Comment relancer si on me répond pas ?',
      a: 'Ouvrir le ticket → bouton « Relancer ». Cela notifie l\'agent assigné et son manager. Pratique sans être agressif.',
    },
    {
      q: 'Les tickets d\'une filiale sont-ils visibles par les autres ?',
      a: 'Non. Chaque filiale gère ses propres tickets. La direction groupe peut voir des statistiques globales, mais pas le détail.',
    },
  ],
};
