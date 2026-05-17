export default {
  id: 'it',
  label: 'IT Operations',
  icon: 'Server',
  color: '#1D4ED8',
  tagline: 'Piloter le parc informatique et assurer la continuité des services',

  overview: `Le module IT Operations est l'outil du responsable informatique. Il centralise la gestion du parc (ordinateurs, serveurs, licences), le suivi des incidents techniques, les mises à jour de sécurité, et l'accès aux tableaux de bord de santé des systèmes. Un seul écran pour savoir si tout fonctionne — et agir si ce n'est pas le cas.`,

  articles: [
    {
      id: 'it-parc',
      title: 'Gérer le parc informatique',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Monitor',
        content: `Onglet « Parc ». Liste de tous les équipements enregistrés : ordinateurs, téléphones, imprimantes, serveurs. Chaque équipement a une fiche : modèle, numéro de série, date d'achat, garantie, utilisateur assigné, état. Ajoutez un équipement avec le bouton « Nouveau » et scannez son code-barres ou entrez le numéro de série. Signalez une panne, un prêt, ou un retour directement sur la fiche.`,
        bullets: [
          'Inventaire complet avec fiche par équipement',
          'Assignation à un utilisateur ou une salle',
          'Alertes automatiques de fin de garantie',
          'Gestion des prêts temporaires',
          'Export de l\'inventaire pour les audits',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'ClipboardCheck',
        content: `Vous savez en permanence ce que vous avez, où c'est, et dans quel état. Les inventaires annuels sont automatiques. Vous anticipez les renouvellements avant que les équipements tombent en panne.`,
      },
    },
    {
      id: 'it-incidents',
      title: 'Traiter les incidents et tickets IT',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'AlertTriangle',
        content: `Onglet « Incidents ». Tous les tickets ouverts depuis le module Support & Helpdesk avec la catégorie IT apparaissent ici. Chaque ticket indique : demandeur, description, priorité, temps écoulé. Cliquez sur un ticket → « Prendre en charge » → résolvez → « Clôturer » avec une note de résolution. En cas de problème majeur, créez un « Incident majeur » qui notifie tous les utilisateurs impactés.`,
        bullets: [
          'File d\'attente des tickets IT classés par priorité',
          'Prise en charge en un clic',
          'Clôture avec note de résolution (base de connaissance)',
          'Incidents majeurs : notification groupée aux utilisateurs',
          'Statistiques : temps de résolution moyen, volume par catégorie',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Zap',
        content: `Vous ne perdez plus aucun ticket IT. Les utilisateurs savent que leur problème est pris en charge. Les notes de résolution constituent une base de connaissance pour les pannes récurrentes.`,
      },
    },
    {
      id: 'it-securite',
      title: 'Surveiller la sécurité et les accès',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'ShieldCheck',
        content: `Onglet « Sécurité ». Tableau de bord avec : tentatives de connexion échouées, comptes inactifs depuis plus de 90 jours, utilisateurs sans double authentification activée. Cliquez sur chaque alerte pour voir le détail et agir (désactiver un compte suspect, forcer la mise à jour du mot de passe, activer le 2FA pour un utilisateur). Le journal d'audit liste chaque action sur la plateforme.`,
        bullets: [
          'Alertes : connexions suspectes, comptes inactifs',
          'Liste des utilisateurs sans 2FA activé',
          'Journal d\'audit : qui a fait quoi et quand',
          'Désactivation d\'un compte en 1 clic en cas d\'urgence',
          'Rapport de sécurité mensuel exportable',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Shield',
        content: `Vous détectez rapidement un accès suspect ou un compte compromis. La conformité RGPD et les audits de sécurité sont facilités par les journaux automatiques. Vous dormez mieux.`,
      },
    },
  ],

  faq: [
    {
      q: 'Comment enregistrer un nouvel équipement à la réception ?',
      a: 'Parc → « Nouveau » → scanner le code-barres ou entrer le numéro de série → remplir les infos (modèle, fournisseur, coût, garantie) → assigner à un utilisateur ou laisser « En stock ». Prend 2 minutes.',
    },
    {
      q: 'Un collaborateur part en congé longue durée, comment gérer ses accès ?',
      a: 'Administration → Utilisateurs → fiche du collaborateur → « Suspendre le compte ». Les accès sont coupés immédiatement, les données conservées. Réactivation en un clic à son retour.',
    },
    {
      q: 'Comment forcer tous les utilisateurs à activer le double authentification ?',
      a: 'Administration → Sécurité → « Politique 2FA » → activer « Obligatoire pour tous ». Les utilisateurs sans 2FA seront bloqués à la prochaine connexion jusqu\'à ce qu\'ils l\'activent.',
    },
    {
      q: 'Peut-on gérer les licences logicielles (Office, Zoom…) ?',
      a: 'Oui. Parc → onglet « Licences ». Entrez chaque licence avec son nombre de postes, son coût annuel et sa date de renouvellement. Alerte automatique 60 jours avant expiration.',
    },
    {
      q: 'Comment accéder aux logs serveur en cas de problème critique ?',
      a: 'Onglet « Logs système » → filtrer par date, type d\'erreur, service. Pour les incidents critiques, contacter l\'équipe technique via le bouton « Escalade » qui ouvre un canal prioritaire.',
    },
  ],
};
