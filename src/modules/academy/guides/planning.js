export default {
  id: 'planning',
  label: 'Planning & Événements',
  icon: 'Calendar',
  color: '#0891B2',
  tagline: 'Organiser plannings d\'équipe, rendez-vous, réunions et événements',

  overview: `Le module Planning & Événements affiche un calendrier partagé pour votre équipe ou votre filiale. Vous voyez qui est où et qui fait quoi : permanences, déplacements, formations, réunions, événements. Plus de coordination par email du genre « tu peux jeudi à 14h ? ». Plus de double-réservation d\'une salle. Tout est centralisé et visible.`,

  articles: [
    {
      id: 'planning-creer',
      title: 'Créer un événement ou réunion',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Calendar',
        content: `Cliquez sur le créneau souhaité dans le calendrier. Donnez un titre, ajoutez les participants (avec recherche du nom). Le système indique en temps réel si tout le monde est disponible (vert) ou si certains sont déjà occupés (rouge). Choisissez la salle, le lien visio, ajoutez l\'ordre du jour. Validez : les invités reçoivent une invitation.`,
        bullets: [
          'Clic sur un créneau → fenêtre de création',
          'Ajout des participants avec auto-complétion',
          'Vérification des disponibilités en direct',
          'Réservation de salle ou ajout de lien visio',
          'Ordre du jour optionnel',
          'Notifications et rappels automatiques',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Zap',
        content: `Trouver un créneau qui convient à 5 personnes prend 30 secondes au lieu d\'un échange d\'emails sur 2 jours. Plus de réunion oubliée, plus de salle réservée par 2 équipes en même temps.`,
      },
    },
    {
      id: 'planning-equipe',
      title: 'Gérer le planning de son équipe',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Users',
        content: `Vue « Équipe » → tableau hebdomadaire ou mensuel avec une ligne par collaborateur. Vous voyez d\'un coup d\'œil : qui est présent, qui est en congé, qui est en déplacement, qui est en formation. Glissez-déposez une mission ou un créneau d\'une personne à l\'autre pour rééquilibrer. Les conflits (congé + mission planifiée) sont signalés en rouge.`,
        bullets: [
          'Vue hebdo ou mensuelle de toute l\'équipe',
          'Une ligne = un collaborateur',
          'Code couleur : présent, congé, mission, formation',
          'Glisser-déposer pour réorganiser',
          'Alerte en cas de conflit (deux engagements en même temps)',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Compass',
        content: `Vous savez à tout moment si votre équipe est sous-staffée, sur-staffée, ou bien dimensionnée. Vous planifiez les missions avec les bonnes personnes au bon moment. Pratique pour les équipes terrain (production, support, commercial sur la route).`,
      },
    },
    {
      id: 'planning-evenements',
      title: 'Organiser un événement d\'entreprise',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Sparkles',
        content: `Bouton « Nouvel événement ». Type (séminaire, JPO, formation, soirée…), date, lieu, capacité. Créez un formulaire d\'inscription que vous partagez par email ou QR code. Les participants s\'inscrivent en un clic. Le jour J, vous pointez les présents avec votre téléphone (scan du QR). Après l\'événement, sondage de satisfaction automatique.`,
        bullets: [
          'Formulaire d\'inscription public ou interne',
          'Limite de capacité avec liste d\'attente',
          'Confirmation et rappel par email',
          'Pointage présence avec QR code',
          'Sondage de satisfaction post-événement',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Heart',
        content: `Organiser un séminaire de 50 personnes devient gérable seul. Inscriptions, rappels, pointage, retours : tout passe par le module. Vous capitalisez aussi sur les données (taux de participation, satisfaction) pour les prochains événements.`,
      },
    },
  ],

  faq: [
    {
      q: 'Mon calendrier perso (Google, Outlook) peut-il être synchronisé ?',
      a: 'Oui. Paramètres → « Synchroniser mon calendrier ». Connexion à Google Calendar ou Outlook. Les événements du module apparaissent dans votre app habituelle, et vice versa.',
    },
    {
      q: 'Comment éviter qu\'on me convoque pendant mes pauses ou hors horaires ?',
      a: 'Paramètres → « Mes disponibilités ». Définissez vos plages : matin, après-midi, déjeuner, soir. Le système refuse les invitations hors plages (ou les marque comme « à confirmer »).',
    },
    {
      q: 'Une salle est-elle réservable ?',
      a: 'Oui si elle est enregistrée. Administration → Ressources → Ajouter salle (nom, capacité, équipements). Elle apparaîtra dans la sélection lors de la création d\'événement.',
    },
    {
      q: 'Un participant ne peut plus venir, comment l\'avertir et libérer la place ?',
      a: 'Sur l\'événement → décocher la personne → option « Notifier l\'organisateur ». Si liste d\'attente, la place est proposée automatiquement à la personne suivante.',
    },
    {
      q: 'Comment imprimer le planning de la semaine pour l\'afficher au mur ?',
      a: 'Vue Équipe → bouton « Imprimer » → format paysage A3 conseillé. Pratique pour les ateliers ou équipes terrain qui n\'ont pas tous un poste informatique.',
    },
  ],
};
