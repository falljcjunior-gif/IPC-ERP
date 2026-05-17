export default {
  id: 'connect',
  label: 'Connect Plus',
  icon: 'Wifi',
  color: '#3B82F6',
  tagline: 'La messagerie et les salles de discussion internes du groupe',

  overview: `Connect Plus est la suite collaborative interne : messages directs, salles de discussion par projet ou département, appels vidéo. C'est l'alternative à WhatsApp ou Slack, mais intégrée à Nexus OS et hébergée par le groupe. Tout reste confidentiel à votre filiale : un collaborateur d'une autre filiale ne peut pas voir vos conversations.`,

  articles: [
    {
      id: 'connect-message',
      title: 'Envoyer un message à un collègue',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'MessageSquare',
        content: `Cliquez sur l'icône « Nouveau message » en haut à gauche. Tapez le nom de la personne, sélectionnez-la, écrivez votre message, appuyez sur Entrée. Vous pouvez joindre une photo, un document, ou enregistrer un message vocal. Le destinataire reçoit une notification et voit votre message immédiatement.`,
        bullets: [
          'Bouton « Nouveau message » → taper le nom du destinataire',
          'Pièces jointes : photo, PDF, lien vers document Cloud',
          'Bouton micro pour message vocal',
          'Coche bleue : message lu par le destinataire',
          'Indicateur « en train d\'écrire » pendant que l\'autre répond',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Zap',
        content: `Vous communiquez plus vite qu'avec un email pour les questions courtes. Et contrairement à WhatsApp, tout est dans l'écosystème pro : sécurisé, archivable, conforme aux règles RGPD du groupe.`,
      },
    },
    {
      id: 'connect-salles',
      title: 'Créer une salle de discussion d\'équipe',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Users',
        content: `Cliquez sur « + Nouvelle salle ». Donnez un nom (ex : « Équipe commerciale », « Projet déménagement »). Ajoutez les participants. Choisissez si la salle est ouverte (visible par toute la filiale) ou privée. Une fois créée, postez vos messages, partagez des fichiers, épinglez les messages importants.`,
        bullets: [
          'Bouton « + Nouvelle salle »',
          'Salle ouverte = toute la filiale peut rejoindre',
          'Salle privée = uniquement les membres invités',
          'Messages épinglés en haut pour ne pas perdre l\'info importante',
          'Recherche dans l\'historique : retrouvez un message d\'il y a 6 mois en quelques mots',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Compass',
        content: `Vos discussions de projet sont rangées par sujet, pas mélangées dans une boîte mail surchargée. Les nouveaux arrivants peuvent rejoindre une salle et lire l'historique pour comprendre le contexte. Les décisions ne se perdent plus.`,
      },
    },
    {
      id: 'connect-visio',
      title: 'Lancer un appel vidéo',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Video',
        content: `Dans une discussion (1 personne ou salle), cliquez sur l'icône caméra en haut à droite. L'appel démarre immédiatement, les autres participants reçoivent une sonnerie. Vous pouvez partager votre écran, activer/couper micro et caméra, enregistrer la réunion (avec accord des participants).`,
        bullets: [
          'Icône caméra dans la discussion → l\'appel démarre',
          'Bouton partage d\'écran pour montrer un document ou logiciel',
          'Enregistrement disponible (avec accord) — utile pour les absents',
          'Pas besoin d\'installer de logiciel : tout marche dans le navigateur',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Heart',
        content: `Plus besoin de jongler avec Zoom, Teams, Meet. Pour les sujets internes, tout se passe ici. Vos collègues à distance se sentent connectés et vous ne perdez pas de temps à organiser une visio externe pour 10 minutes.`,
      },
    },
  ],

  faq: [
    {
      q: 'Mes messages sont-ils privés ou lus par l\'employeur ?',
      a: 'Comme tout outil pro, ils peuvent être archivés et consultés en cas d\'enquête interne ou demande légale. Pour les conversations strictement privées, utilisez votre messagerie personnelle hors de l\'app.',
    },
    {
      q: 'Puis-je discuter avec un collègue d\'une autre filiale ?',
      a: 'Cela dépend des paramètres groupe. Par défaut, chaque filiale est isolée. Pour les besoins inter-filiales (groupe projet par exemple), demandez à l\'administrateur d\'ouvrir un canal cross-filiales.',
    },
    {
      q: 'Quelles notifications je peux recevoir ?',
      a: 'Notification dans l\'app, sur l\'application mobile, par email si vous êtes absent longtemps. Vous réglez tout dans Paramètres → Notifications.',
    },
    {
      q: 'Comment quitter une salle qui ne me concerne plus ?',
      a: 'Ouvrir la salle → menu en haut à droite → « Quitter la salle ». L\'historique reste pour les autres membres.',
    },
    {
      q: 'Les visio fonctionnent-elles avec un client extérieur ?',
      a: 'Pas pour l\'instant. Connect Plus est réservé aux comptes internes du groupe. Pour les rendez-vous clients, utilisez Google Meet ou Teams.',
    },
  ],
};
