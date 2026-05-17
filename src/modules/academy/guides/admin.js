export default {
  id: 'control_hub',
  label: 'Administration',
  icon: 'Settings',
  color: '#374151',
  tagline: 'Configurer la plateforme, gérer les accès et piloter les paramètres globaux',

  overview: `Le module Administration est réservé aux responsables techniques et aux administrateurs de la plateforme. Il permet de configurer les modules actifs, gérer les utilisateurs et leurs rôles, personnaliser l'apparence, et définir les paramètres globaux de l'entreprise. C'est le panneau de contrôle central — à utiliser avec soin.`,

  articles: [
    {
      id: 'admin-utilisateurs',
      title: 'Gérer les utilisateurs et leurs rôles',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Users',
        content: `Onglet « Utilisateurs ». La liste de tous les comptes actifs s'affiche. Pour ajouter quelqu'un : bouton « Inviter » → saisir l'email → choisir le rôle (Staff, Manager, Admin…) → choisir l'entité (Holding, Filiale X, Fondation Y) → envoyer. La personne reçoit un email d'invitation avec un lien pour créer son mot de passe. Pour modifier un rôle : cliquer sur l'utilisateur → changer le rôle → sauvegarder.`,
        bullets: [
          'Bouton « Inviter » → email + rôle + entité',
          'Rôles disponibles : Staff, Manager, HR, Finance, Admin, Super Admin',
          'Un utilisateur = une entité (Holding ou Filiale ou Fondation)',
          'Désactivation d\'un compte sans suppression des données',
          'Historique des connexions consultable',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Shield',
        content: `Vous contrôlez précisément qui accède à quoi. Un commercial ne voit pas les données RH, un comptable ne modifie pas les contrats clients. La sécurité des données repose sur des rôles bien configurés.`,
      },
    },
    {
      id: 'admin-modules',
      title: 'Activer ou désactiver des modules',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'ToggleLeft',
        content: `Onglet « Modules ». Liste de tous les modules disponibles avec leur statut (actif / inactif). Pour activer un module : cliquer sur le switch → confirmer. Il apparaît immédiatement dans la navigation pour les utilisateurs concernés. Pour le désactiver : même procédure — les données ne sont pas supprimées, le module est juste masqué.`,
        bullets: [
          'Liste des modules avec switch actif/inactif',
          'Activation immédiate — visible pour les utilisateurs sans rechargement',
          'Désactivation préserve toutes les données',
          'Possibilité de restreindre un module à certains rôles',
          'Modules payants indiqués avec leur statut de licence',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Compass',
        content: `Vous ne payez et n'exposez que ce dont vous avez besoin. Une filiale qui n'a pas de flotte de véhicules n'a pas à voir le module Flotte. Vous adaptez la plateforme à chaque entité.`,
      },
    },
    {
      id: 'admin-parametres',
      title: 'Configurer les paramètres de l\'entreprise',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Sliders',
        content: `Onglet « Paramètres ». Organisés par section : Identité (nom, logo, couleurs), Fiscal (SIRET, TVA, adresse légale), Notifications (quelles alertes envoyer par email), Sécurité (durée de session, double authentification obligatoire). Modifiez une valeur → cliquez « Sauvegarder ». Certains changements (logo, couleurs) sont visibles immédiatement par tous les utilisateurs.`,
        bullets: [
          'Identité : nom, logo, couleurs de l\'interface',
          'Fiscal : SIRET, numéro de TVA, coordonnées légales',
          'Notifications : email, fréquence, types d\'alertes',
          'Sécurité : durée de session, 2FA, politique mot de passe',
          'Intégrations : connexions avec outils tiers (comptabilité, etc.)',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Award',
        content: `Une plateforme aux couleurs de votre entreprise, avec les bonnes informations légales sur chaque document généré, et des règles de sécurité adaptées à votre contexte. Tout en un seul endroit.`,
      },
    },
  ],

  faq: [
    {
      q: 'Quelle différence entre Admin et Super Admin ?',
      a: 'L\'Admin gère les utilisateurs et les paramètres de son entité. Le Super Admin a accès à toutes les entités du groupe, peut créer des Admins, et accède aux paramètres techniques avancés.',
    },
    {
      q: 'Comment ajouter une nouvelle filiale ou fondation ?',
      a: 'Onglet « Entités » → « Nouvelle entité » → choisir le type (Filiale, Fondation), renseigner les infos légales, assigner un Admin local. L\'entité est immédiatement opérationnelle.',
    },
    {
      q: 'Peut-on voir le journal de toutes les actions faites sur la plateforme ?',
      a: 'Oui. Onglet « Journal d\'audit » → filtrer par utilisateur, module, date. Chaque action (connexion, modification, suppression) est tracée avec l\'heure et l\'adresse IP.',
    },
    {
      q: 'Comment exporter toutes les données de l\'entreprise ?',
      a: 'Onglet « Données » → « Exporter ». Vous choisissez les modules à inclure et le format (CSV, Excel). Un fichier ZIP est généré et téléchargeable. Réservé aux Super Admins.',
    },
    {
      q: 'Que se passe-t-il si je désactive un utilisateur par erreur ?',
      a: 'L\'utilisateur ne peut plus se connecter, mais toutes ses données sont préservées. Ré-activez-le en cliquant sur son profil → « Réactiver le compte ». Immédiat.',
    },
  ],
};
