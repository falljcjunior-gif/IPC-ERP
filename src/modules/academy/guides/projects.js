export default {
  id: 'projects',
  label: 'Projets',
  icon: 'Briefcase',
  color: '#0EA5E9',
  tagline: 'Piloter un projet du lancement à la livraison, sans rien oublier',

  overview: `Le module Projets vous aide à gérer les chantiers, projets clients, ou initiatives internes du début à la fin. Vous découpez en étapes, vous assignez des responsables, vous suivez l'avancement, vous voyez ce qui prend du retard. C'est l'outil idéal quand plusieurs personnes doivent collaborer sur un objectif commun avec une date de livraison.`,

  articles: [
    {
      id: 'projects-creer',
      title: 'Créer un nouveau projet',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Sparkles',
        content: `Bouton « Nouveau projet ». Donnez un titre clair, une date de début et une date cible de fin. Choisissez un chef de projet et les membres de l'équipe. Si le projet est pour un client, sélectionnez-le dans le CRM. Définissez le budget si applicable. Validez : votre espace projet est créé avec un tableau vide prêt à remplir.`,
        bullets: [
          'Titre clair (évitez « Projet Untel », préférez « Refonte site web 2026 »)',
          'Dates début et fin pour cadrer le projet',
          'Chef de projet + équipe (vous pouvez ajouter plus tard)',
          'Client lié au CRM si projet externe',
          'Budget en € (suivi des dépenses dans le module Finance)',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Compass',
        content: `Un projet bien cadré dès le début évite 80% des conflits ultérieurs. Tout le monde sait qui fait quoi, pour quand, et avec quel budget. Le client (ou la direction) reçoit un lien pour suivre l'avancement en temps réel sans vous appeler.`,
      },
    },
    {
      id: 'projects-taches',
      title: 'Découper en tâches et assigner',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Layers',
        content: `Dans l'espace projet, ajoutez des tâches une par une. Pour chaque tâche : un titre, un responsable, une date limite, une priorité. Vous pouvez créer des dépendances (« la tâche B ne peut commencer qu'après la fin de A »). Vue en colonnes (Kanban) ou en planning (Gantt) selon votre préférence.`,
        bullets: [
          'Une tâche = une action concrète avec un livrable',
          'Assignée à une personne (la responsable, pas « toute l\'équipe »)',
          'Date limite réaliste, négociée avec la personne',
          'Dépendances entre tâches pour le planning',
          'Vue Kanban (mouvement) ou Gantt (calendrier) — votre choix',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'CheckCircle',
        content: `Chaque personne sait précisément ce qu'elle doit faire et pour quand. Plus de réunions de 1h pour faire le point — tout le monde voit l'état du projet en ouvrant l'app. Les retards apparaissent tôt, vous pouvez réagir avant que ça dérape.`,
      },
    },
    {
      id: 'projects-suivre',
      title: 'Suivre l\'avancement au quotidien',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Activity',
        content: `Une barre de progression en haut indique le % d'avancement (calculé sur les tâches terminées). Une zone « En retard » liste les tâches dépassées ou à risque. Les membres de l'équipe cochent leurs tâches au fur et à mesure. Vous pouvez ajouter des commentaires sur une tâche pour suivre les discussions. Tout est notifié à l'équipe.`,
        bullets: [
          'Barre de progression globale automatique',
          'Liste rouge : tâches en retard ou à risque',
          'Cocher = marquer terminé en un clic',
          'Commentaires par tâche pour les échanges',
          'Notifications quand une tâche vous est assignée ou commentée',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Eye',
        content: `Vous arrêtez de courir après les gens pour savoir où ils en sont. L'info est dans l'app, à jour, accessible 24/7. Si une réunion s'impose, elle dure 15 minutes au lieu d'1h car tout le monde arrive avec le même niveau d'info.`,
      },
    },
  ],

  faq: [
    {
      q: 'Quelle différence entre Projets et Missions ?',
      a: 'Missions = tâches récurrentes du quotidien (Kanban d\'équipe). Projets = initiatives avec début, fin, livrable, budget. Un projet peut contenir plusieurs missions/tâches.',
    },
    {
      q: 'Comment partager le projet avec un client externe ?',
      a: 'Menu projet → « Partager avec client ». Vous créez un lien sécurisé en lecture seule. Le client voit l\'avancement et les jalons mais ne peut pas modifier ni voir les discussions internes.',
    },
    {
      q: 'Le projet a beaucoup de tâches, comment ne pas se noyer ?',
      a: 'Groupez par phase (« Étude », « Réalisation », « Livraison »). Utilisez les filtres : par responsable, par statut, par échéance. Activez la vue « Mes tâches » pour ne voir que les vôtres.',
    },
    {
      q: 'Comment gérer un changement de scope (le client demande plus) ?',
      a: 'Ajoutez les nouvelles tâches, mettez à jour le budget si besoin, notez le changement dans la zone « Décisions » du projet. Tout reste traçable en cas de discussion plus tard.',
    },
    {
      q: 'Le projet est terminé, on en fait quoi ?',
      a: 'Menu projet → « Clôturer ». Vous rédigez un bilan court (ce qui a marché, ce qui a coincé). Le projet passe en archive consultable. Pratique pour capitaliser sur les futurs projets similaires.',
    },
  ],
};
