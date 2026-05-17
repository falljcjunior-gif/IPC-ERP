export default {
  id: 'hr',
  label: 'Ressources Humaines',
  icon: 'Users',
  color: '#DC2626',
  tagline: 'Gérer les collaborateurs, leurs contrats, leurs congés, leur évolution',

  overview: `Le module Ressources Humaines centralise toute la vie administrative et professionnelle des collaborateurs : embauche, contrat, congés, formations, entretiens, départ. Plus de classeurs RH éparpillés ni de tableurs Excel avec mots de passe partagés. Chaque salarié a son dossier complet, sécurisé, accessible uniquement aux personnes autorisées.`,

  articles: [
    {
      id: 'hr-dossier',
      title: 'Créer le dossier d\'un nouveau collaborateur',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'UserPlus',
        content: `Bouton « Nouvelle embauche ». Saisissez les informations d\'identité, contact, poste. Précisez le type de contrat (CDI, CDD, alternance…), la date d\'entrée, le salaire. Téléversez les pièces : carte d\'identité, RIB, attestation Sécu, diplômes. Le système crée son compte d\'accès à la plateforme et envoie un email d\'accueil avec ses identifiants.`,
        bullets: [
          'Identité, contact, poste, type de contrat, salaire',
          'Pièces justificatives téléversées (PDF ou photo)',
          'Compte plateforme créé automatiquement',
          'Email de bienvenue avec identifiants',
          'Notification au manager et à la compta',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Heart',
        content: `Un onboarding propre dès le jour 1 : le nouveau collaborateur a son accès, son équipe est informée, la paie est prête. Pas besoin de courir entre 5 services pour démarrer correctement.`,
      },
    },
    {
      id: 'hr-conges',
      title: 'Demander et valider des congés',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Sun',
        content: `Le collaborateur ouvre l\'onglet « Mes congés », clique sur « Demander un congé », choisit dates et type (congés payés, RTT, sans solde…). Sa demande part chez son manager qui valide en 1 clic. Le solde de congés se met à jour automatiquement. L\'équipe voit les absences à venir dans le planning collectif.`,
        bullets: [
          'Demande en 30 secondes côté collaborateur',
          'Validation en 1 clic côté manager',
          'Solde mis à jour automatiquement',
          'Planning collectif des absences visible par l\'équipe',
          'Pas de conflit possible : 2 absences simultanées détectées',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Compass',
        content: `Plus d\'emails de demande de congé qui se perdent. Plus de calcul de solde sur Excel. Le manager voit les absences à venir et peut anticiper la charge. Tout le monde gagne du temps.`,
      },
    },
    {
      id: 'hr-entretiens',
      title: 'Mener un entretien annuel',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'MessageSquare',
        content: `Onglet « Entretiens » → « Planifier ». Choisir le collaborateur, la date. Le système envoie une convocation et un questionnaire de préparation. Pendant l\'entretien, manager et salarié remplissent ensemble la trame (réalisations, difficultés, objectifs, formation, évolution). Le compte-rendu est signé électroniquement par les deux. Archivé dans le dossier RH.`,
        bullets: [
          'Convocation et préparation envoyées automatiquement',
          'Trame structurée pour ne rien oublier',
          'Co-rédaction pendant l\'entretien',
          'Signature électronique des deux parties',
          'Suivi des objectifs jusqu\'au prochain entretien',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Award',
        content: `Un entretien annuel bien mené est un puissant outil de motivation et de progression. Avec une trame structurée et un suivi d\'année en année, vous capitalisez sur les engagements pris et vous donnez du sens à l\'évolution professionnelle.`,
      },
    },
  ],

  faq: [
    {
      q: 'Qui peut voir les salaires ?',
      a: 'Strictement la direction, les RH, le manager direct (selon configuration). Pas les collègues, pas les autres managers. Le module Audit trace toute consultation de données salariales.',
    },
    {
      q: 'Comment gérer un arrêt maladie ?',
      a: 'Onglet « Absences » → « Nouvel arrêt » sur la fiche du salarié. Téléverser l\'arrêt (PDF). Saisir dates. Le système met à jour le planning et notifie la paie pour le calcul des IJ.',
    },
    {
      q: 'Un collaborateur part, quelle est la procédure ?',
      a: 'Fiche salarié → « Initier départ » avec motif (démission, fin de CDD, rupture conventionnelle…). Le système génère la checklist sortie (matériel à rendre, accès à révoquer, solde tout compte) et trace chaque étape.',
    },
    {
      q: 'Comment former l\'équipe sur un nouveau sujet ?',
      a: 'Onglet « Formations » → planifier une formation. Inscrire les participants. Suivi des présences et des attestations. Lien avec le plan de formation annuel.',
    },
    {
      q: 'Les données RH respectent-elles le RGPD ?',
      a: 'Oui. Accès strictement contrôlé, données chiffrées, audit complet, durée de conservation respectée (5 ans après le départ pour la plupart, 50 ans pour le bulletin de paie). Voir module Audit & Conformité.',
    },
  ],
};
