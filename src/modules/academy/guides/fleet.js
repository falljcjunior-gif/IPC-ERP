export default {
  id: 'fleet',
  label: 'Flotte',
  icon: 'Car',
  color: '#0D9488',
  tagline: 'Gérer véhicules, entretiens et carburant — sans tableurs Excel',

  overview: `Le module Flotte centralise la gestion de tous les véhicules de l'entreprise : voitures de société, camions, utilitaires. Vous y suivez chaque véhicule (kilométrage, conducteurs, entretiens, contrôles techniques, sinistres) et les coûts (carburant, péages, assurance). Plus de tableur Excel partagé qui finit par diverger entre les services.`,

  articles: [
    {
      id: 'fleet-vehicules',
      title: 'Enregistrer un véhicule',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Car',
        content: `Bouton « Nouveau véhicule ». Saisissez immatriculation, marque, modèle, année. Indiquez le type (VL, utilitaire, poids lourd) et le carburant (essence, diesel, électrique). Ajoutez les dates clés : achat, mise en circulation, prochain contrôle technique, fin d'assurance. Téléversez la carte grise et l'attestation d'assurance en photos. Validez.`,
        bullets: [
          'Immatriculation + marque + modèle suffit pour démarrer',
          'Date du prochain contrôle technique → rappel auto',
          'Carte grise et assurance archivées sur la fiche',
          'Affectation à une filiale ou un site',
          'Statut : disponible, attribué, en réparation, vendu',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Compass',
        content: `Vous savez à tout moment combien de véhicules vous avez, où ils sont, dans quel état. Plus de mauvaise surprise (« on n'a pas renouvelé l'assurance ! ») : le système vous prévient 30 jours avant chaque échéance.`,
      },
    },
    {
      id: 'fleet-conducteurs',
      title: 'Affecter un véhicule à un conducteur',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'UserPlus',
        content: `Fiche véhicule → bouton « Affecter ». Choisissez le conducteur dans la liste des collaborateurs. Saisissez la date de remise et le kilométrage. Le système génère un document de remise (à signer électroniquement) qui détaille l'état du véhicule. Le conducteur reçoit une copie. À la restitution, même processus en sens inverse.`,
        bullets: [
          'Choisir le conducteur dans la liste des collaborateurs',
          'Document de remise généré, signé électroniquement',
          'Photos d\'état au départ (rayures, intérieur)',
          'Suivi des kilométrages déclarés régulièrement',
          'Historique complet des conducteurs successifs',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Heart',
        content: `En cas de litige (rayure, accident, infraction routière), vous savez précisément qui avait le véhicule et dans quel état il était. Cela protège l'entreprise comme le salarié.`,
      },
    },
    {
      id: 'fleet-entretien-couts',
      title: 'Suivre entretiens et coûts',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Activity',
        content: `Onglet « Entretiens » sur la fiche véhicule. Bouton « Nouvel entretien » à chaque révision, vidange, réparation. Saisissez la date, le kilométrage, le garage, le coût. Joignez la facture en photo. Le module Notes de Frais peut aussi remonter les pleins de carburant automatiquement. À la fin de l'année, vous voyez le coût total par véhicule et par km parcouru.`,
        bullets: [
          'Historique entretiens : date, km, garage, montant, facture',
          'Carburants suivis depuis Notes de Frais ou cartes carburant',
          'Coût total annuel par véhicule',
          'Coût au kilomètre pour comparer la flotte',
          'Alerte si un véhicule dépasse un seuil de coût',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'BarChart2',
        content: `Vous décidez en connaissance de cause : ce véhicule coûte trop cher, on le revend ; cette marque est plus économique, on la privilégie au prochain renouvellement. Plus de décisions « au feeling ».`,
      },
    },
  ],

  faq: [
    {
      q: 'Comment gérer un sinistre ?',
      a: 'Fiche véhicule → bouton « Sinistre ». Décrire l\'incident, date, lieu, autre véhicule impliqué si applicable. Joindre constat amiable scanné. Notifier assurance. Suivi de la franchise et de l\'expertise jusqu\'à la clôture.',
    },
    {
      q: 'Le contrôle technique est en retard, que faire ?',
      a: 'Le véhicule passe en statut « Non roulant » bloquant les nouvelles affectations. Programmez le CT le plus tôt possible. Mettre à jour la date dans la fiche après passage.',
    },
    {
      q: 'Comment gérer les cartes carburant ?',
      a: 'Importer le relevé mensuel (Total, Shell, etc.) dans le module Notes de Frais. Les pleins sont automatiquement rattachés au véhicule via l\'immatriculation.',
    },
    {
      q: 'Un collaborateur quitte l\'entreprise avec un véhicule de fonction, que faire ?',
      a: 'Fiche véhicule → « Restitution ». Document d\'état au retour, kilométrage final, signature. Le véhicule passe en « disponible » pour réaffectation.',
    },
    {
      q: 'Comment limiter les conducteurs autorisés à un véhicule ?',
      a: 'Fiche véhicule → onglet « Restrictions ». Vous pouvez cocher : permis B obligatoire, conducteurs spécifiques, interdit hors heures de travail, etc.',
    },
  ],
};
