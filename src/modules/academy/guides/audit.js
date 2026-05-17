export default {
  id: 'audit_hub',
  label: 'Audit & Conformité',
  icon: 'Fingerprint',
  color: '#7E22CE',
  tagline: 'Garder la trace de tout ce qui se passe dans l\'app — qui, quoi, quand',

  overview: `Le module Audit & Conformité enregistre chaque action importante effectuée dans la plateforme : qui a créé un client, qui a modifié un prix, qui a validé une commande, qui a consulté un dossier confidentiel. C\'est votre journal de bord. Indispensable pour la sécurité, le RGPD, les certifications ISO, et tout simplement pour comprendre ce qui se passe en cas de problème.`,

  articles: [
    {
      id: 'audit-consulter',
      title: 'Consulter le journal d\'audit',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Eye',
        content: `Onglet « Journal ». La liste des actions s\'affiche, du plus récent au plus ancien. Chaque ligne indique : date et heure, utilisateur, action (création, modification, suppression, consultation), objet concerné. Filtres en haut : par utilisateur, par module, par type d\'action, par période. Cliquez sur une ligne pour voir le détail (ancienne valeur vs nouvelle valeur).`,
        bullets: [
          'Liste chronologique des actions',
          'Filtres : utilisateur, module, type, période',
          'Détail : qui, quoi, quand, depuis quelle IP',
          'Comparaison avant / après pour les modifications',
          'Export PDF ou Excel pour rapport d\'audit',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Shield',
        content: `Quand quelque chose tourne mal (un prix changé par erreur, un dossier supprimé, une donnée bizarre), vous remontez la piste en quelques minutes. Vous identifiez la source, vous corrigez, vous formez la personne concernée. Plus de mystères.`,
      },
    },
    {
      id: 'audit-conformite',
      title: 'Préparer un audit (RGPD, ISO, financier)',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Award',
        content: `Onglet « Rapports de conformité ». Choisissez le type d\'audit : RGPD, ISO 27001, contrôle fiscal, audit qualité. Le système rassemble automatiquement les éléments nécessaires : journaux d\'accès, registre des traitements, politique de sécurité, traces des sauvegardes. Vous obtenez un dossier prêt à présenter en quelques minutes.`,
        bullets: [
          'Rapports pré-formatés selon le type d\'audit',
          'Périmètre temporel ajustable',
          'Inclusion automatique des journaux pertinents',
          'Annexes : politique sécurité, droits utilisateurs, exports',
          'Export PDF prêt à transmettre',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Heart',
        content: `Un audit qui prenait des semaines de préparation prend désormais des heures. Vous montrez votre sérieux en arrivant avec un dossier propre, daté, complet. Les auditeurs (et les clients qui auditent leurs fournisseurs) apprécient.`,
      },
    },
    {
      id: 'audit-rgpd',
      title: 'Répondre à une demande RGPD',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Lock',
        content: `Un client demande l\'accès, la rectification ou la suppression de ses données personnelles ? Onglet « Demandes RGPD » → « Nouvelle demande ». Saisir nom et email du demandeur, type de demande. Le système identifie automatiquement toutes les traces de ce client (CRM, factures, support…). Vous produisez l\'export ou la suppression en respect des règles (avec exceptions légales : obligations comptables, etc.).`,
        bullets: [
          'Identification automatique de toutes les données du demandeur',
          'Choix : accès (export), rectification, suppression, portabilité',
          'Respect des exceptions légales (compta = 10 ans obligatoire)',
          'Trace de la demande et de votre réponse',
          'Délai légal de 30 jours suivi automatiquement',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'CheckCircle',
        content: `Les demandes RGPD peuvent paralyser une PME qui ne sait pas où sont stockées les données. Avec ce module, c\'est l\'affaire d\'une heure. Vous restez en conformité, vous évitez les amendes lourdes de la CNIL.`,
      },
    },
  ],

  faq: [
    {
      q: 'Combien de temps les journaux sont-ils conservés ?',
      a: 'Selon votre configuration et les obligations légales : 1 an minimum, jusqu\'à 10 ans pour les opérations à valeur fiscale ou comptable. Paramétrage par type de log dans Administration.',
    },
    {
      q: 'Qui peut consulter les journaux d\'audit ?',
      a: 'Strictement les rôles habilités : audit interne, responsable conformité, DSI, direction générale. Pas le manager opérationnel, pas le commercial. Définissable dans Administration → Rôles.',
    },
    {
      q: 'Quelqu\'un a effacé un document, peut-on le récupérer ?',
      a: 'La plupart des suppressions sont des « suppressions logiques » : le document est masqué mais existe encore. L\'administrateur peut le restaurer depuis le journal. Au-delà de 30 jours, possibilité de restauration depuis les sauvegardes (sous 24h).',
    },
    {
      q: 'L\'app envoie-t-elle des données à l\'étranger ?',
      a: 'Selon la configuration de votre instance. La plupart sont hébergées en Europe (RGPD). Le détail est dans Paramètres → Confidentialité → « Localisation des données ».',
    },
    {
      q: 'Un employé peut-il consulter son propre journal d\'audit ?',
      a: 'Oui, sur ses propres actions. Dans son profil → « Mon activité ». Pas sur les actions d\'autres utilisateurs (sauf manager direct sur son équipe, selon les paramètres).',
    },
  ],
};
