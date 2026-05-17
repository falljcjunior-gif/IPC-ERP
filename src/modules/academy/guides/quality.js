export default {
  id: 'quality',
  label: 'Qualité & HSE',
  icon: 'ShieldCheck',
  color: '#16A34A',
  tagline: 'Garantir la qualité produit et la sécurité des personnes',

  overview: `Le module Qualité & HSE (Hygiène, Sécurité, Environnement) couvre tout ce qui concerne la conformité, la sécurité au travail et la qualité des produits. Vous enregistrez les contrôles qualité, les incidents, les actions correctives. Vous gérez les audits, les certifications (ISO, etc.) et les obligations légales. C'est l'outil du responsable qualité qui veut une vision globale sans paperasse.`,

  articles: [
    {
      id: 'quality-controles',
      title: 'Enregistrer un contrôle qualité',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'CheckCircle',
        content: `Lors d'un contrôle (réception matière, sortie production, audit interne), cliquez sur « Nouveau contrôle ». Choisissez le type, le produit ou poste concerné. Cochez les points de la checklist préparée (conformité dimensions, aspect, étiquetage…). Photographiez avec le téléphone si besoin. Concluez « Conforme » ou « Non conforme ». Si non-conforme, créez immédiatement une action corrective.`,
        bullets: [
          'Checklists pré-configurées par type de contrôle',
          'Photos jointes pour preuve visuelle',
          'Conclusion claire : Conforme / Non conforme',
          'Si non conforme : action corrective créée à la volée',
          'Trace horodatée avec le nom du contrôleur',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Award',
        content: `Tous vos contrôles sont archivés et consultables en cas d'audit (client, certification, expert d'assurance). Plus de classeur papier qui se perd. La preuve est numérique, datée, signée par l'opérateur.`,
      },
    },
    {
      id: 'quality-incidents',
      title: 'Signaler un incident de sécurité',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Zap',
        content: `Tout salarié peut signaler un incident (presqu'accident, blessure, danger détecté) depuis l'app mobile ou bureau. Bouton rouge « Signaler incident » → choisir gravité (mineure, modérée, grave) → décrire ce qui s'est passé → ajouter photo si possible. Le responsable HSE est notifié immédiatement. Une enquête est ouverte si nécessaire.`,
        bullets: [
          'Bouton « Signaler incident » accessible partout',
          'Anonymat possible pour les signalements sensibles',
          'Notification au responsable HSE dans la minute',
          'Pour les incidents graves : ouverture d\'enquête formelle',
          'Statistiques mensuelles (taux de fréquence, gravité)',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Heart',
        content: `Vous créez une culture de prévention : remonter les presqu'accidents permet d'éviter les vrais accidents. Vous tenez aussi vos obligations légales (déclaration AT/MP, registre de sécurité). Et en cas de contrôle inspection du travail, tout est prêt.`,
      },
    },
    {
      id: 'quality-actions',
      title: 'Suivre les actions correctives',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Target',
        content: `Chaque non-conformité ou incident génère une « action corrective » à mener. Elle est assignée à un responsable avec une date limite. Onglet « Actions » → liste de toutes les actions ouvertes, avec leur statut. Le responsable décrit ce qui a été fait, joint des preuves (photos, documents) et clôture quand c'est résolu. Vous suivez la conformité dans le temps.`,
        bullets: [
          'Action = correction concrète à réaliser, avec responsable et délai',
          'Liste filtrable par statut, responsable, urgence',
          'Le responsable joint la preuve de résolution',
          'Validation finale par le responsable qualité',
          'Reporting mensuel : nombre d\'actions ouvertes / clôturées / en retard',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Compass',
        content: `La qualité ne se contente pas de constater les problèmes : elle les résout. Le suivi des actions correctives montre votre démarche d'amélioration continue, indispensable pour les certifications ISO 9001, 14001, 45001.`,
      },
    },
  ],

  faq: [
    {
      q: 'Comment préparer un audit de certification (ISO 9001) ?',
      a: 'Bouton « Préparer audit ». Le système rassemble automatiquement : politique qualité, indicateurs, non-conformités traitées, actions correctives, formations. Vous obtenez un dossier prêt à présenter en quelques heures.',
    },
    {
      q: 'Comment former mes équipes à la sécurité ?',
      a: 'Le module Planning permet de programmer les formations obligatoires (extincteurs, gestes de secours). Le suivi de l\'attestation par salarié est dans son dossier RH avec rappel quand l\'attestation expire.',
    },
    {
      q: 'Que faire d\'un produit non conforme en stock ?',
      a: 'Le bloquer dans Stocks & Logistique avec motif « Non conforme ». Décider : reprise (correction interne), retour fournisseur, destruction. Chaque décision est tracée.',
    },
    {
      q: 'Les contrôles sont-ils visibles par le client final ?',
      a: 'Non par défaut. Mais vous pouvez générer un « certificat de conformité » signé par le responsable qualité, à joindre au bon de livraison. Pratique pour les marchés exigeants.',
    },
    {
      q: 'Comment gérer une réclamation client qualité ?',
      a: 'CRM → fiche client → « Nouvelle réclamation ». Reliez-la au produit/lot concerné. Une enquête qualité s\'ouvre. Si non-conformité confirmée, action corrective sur la production + geste commercial au client.',
    },
  ],
};
