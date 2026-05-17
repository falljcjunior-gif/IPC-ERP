export default {
  id: 'missions',
  label: 'Missions',
  icon: 'Kanban',
  color: '#6366f1',
  tagline: 'Organiser le travail quotidien de l\'équipe sous forme de cartes à déplacer',

  overview: `Missions est un tableau de bord visuel pour organiser le travail quotidien de votre équipe. Chaque tâche est une carte. Vous la déplacez d'une colonne à l'autre selon son avancement : « à faire », « en cours », « terminé ». Tout le monde voit la même chose en temps réel. C'est l'outil parfait pour les équipes qui veulent arrêter les emails « où ça en est ? » et les réunions de coordination.`,

  articles: [
    {
      id: 'missions-creer-carte',
      title: 'Créer une carte (= une tâche)',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'MousePointerClick',
        content: `Cliquez sur « + Ajouter une carte » dans la colonne « À faire ». Donnez un titre court (« Préparer présentation client X »). Assignez la carte à une personne (clic sur l'avatar → choisir). Ajoutez une date limite si nécessaire. Vous pouvez ajouter une description plus longue, des étiquettes de couleur, une pièce jointe. Validez : la carte apparaît dans la colonne.`,
        bullets: [
          'Bouton « + » au-dessus de chaque colonne',
          'Titre court et clair (15-20 caractères suffisent)',
          'Assigner à une personne précise (pas « toute l\'équipe »)',
          'Date limite optionnelle',
          'Étiquettes de couleur pour catégoriser (urgent, client A, support…)',
          'Pièces jointes : fichiers, photos, liens',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Rocket',
        content: `Les tâches ne se perdent plus dans les emails ou les post-it. Chacun voit ce qu'il a à faire et dans quel ordre. Quand un nouveau collègue arrive, il voit le travail de l'équipe en 5 minutes. Les vacances ne paralysent plus l'équipe : les remplaçants prennent la suite des cartes.`,
      },
    },
    {
      id: 'missions-deplacer',
      title: 'Faire avancer le travail (glisser-déposer)',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Layers',
        content: `Pour faire évoluer une tâche, glissez sa carte d'une colonne à l'autre avec la souris (ou un doigt sur mobile). Quand vous commencez la tâche, faites-la passer de « À faire » à « En cours ». Quand c'est terminé, glissez dans « Terminé ». Tout se sauvegarde tout seul, vos collègues voient le changement en direct.`,
        bullets: [
          'Glisser une carte d\'une colonne à l\'autre',
          'Aucun bouton « Sauvegarder » : c\'est automatique',
          'Vos collègues voient le changement en moins d\'une seconde',
          'Vous pouvez aussi changer l\'ordre dans une même colonne',
          'Sur mobile : appui long puis glissement',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Zap',
        content: `Un geste simple suffit pour informer toute l'équipe d'un avancement. Plus besoin de mettre à jour un statut, d'envoyer un email, de cocher une case quelque part. C'est l'outil le plus rapide et le plus visuel pour piloter une équipe.`,
      },
    },
    {
      id: 'missions-tableaux',
      title: 'Créer un tableau pour chaque équipe ou projet',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Grid',
        content: `Vous pouvez créer autant de tableaux que vous voulez : un pour l'équipe commerciale, un pour le support, un pour le projet X. Bouton « + Nouveau tableau » → nom du tableau → choisir les colonnes (par défaut : À faire / En cours / Terminé, mais personnalisable). Invitez les bons collègues. Chacun ne voit que les tableaux où il est invité.`,
        bullets: [
          'Un tableau = une équipe ou un projet',
          'Colonnes personnalisables (« Backlog », « En revue », « Livré »…)',
          'Vous décidez qui rejoint le tableau',
          'Vous pouvez archiver un tableau quand le projet est fini',
          'Modèles disponibles : Marketing, Recrutement, Support, etc.',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Compass',
        content: `Chaque équipe organise son travail comme elle le veut, sans interférer avec les autres. La direction peut quand même demander une vision groupée (« combien de tâches urgentes en attente dans toute l'entreprise ? ») sans gêner personne.`,
      },
    },
  ],

  faq: [
    {
      q: 'Je ne vois pas un tableau dont mes collègues parlent, pourquoi ?',
      a: 'Vous n\'avez pas été invité. Demandez à un membre du tableau de vous ajouter (menu du tableau → Inviter). Si vous êtes manager, vous pouvez aussi en ouvrir l\'accès depuis Administration.',
    },
    {
      q: 'Comment savoir ce qu\'on attend de moi aujourd\'hui ?',
      a: 'Onglet « Mes tâches » en haut. Il rassemble toutes vos cartes assignées dans tous les tableaux, triées par date limite. Votre to-do du jour en un seul écran.',
    },
    {
      q: 'Une carte a-t-elle été modifiée, qui et quand ?',
      a: 'Cliquez sur la carte → onglet « Activité ». Vous voyez l\'historique : qui l\'a créée, déplacée, commentée, à quelle date. Tout est tracé.',
    },
    {
      q: 'Puis-je transformer une carte en projet (avec sous-tâches, budget) ?',
      a: 'Pas directement. Mais vous pouvez créer un projet dans le module Projets et lier la carte au projet. Les deux outils communiquent.',
    },
    {
      q: 'Les cartes peuvent-elles déclencher des notifications par email ?',
      a: 'Oui. Paramètres → Notifications → Missions. Vous choisissez : nouvelle carte qui m\'est assignée, commentaire sur ma carte, date limite qui approche. Désactivable au cas par cas.',
    },
  ],
};
