export default {
  id: 'expenses',
  label: 'Notes de Frais',
  icon: 'Receipt',
  color: '#D97706',
  tagline: 'Déclarer ses frais avec une photo, se faire rembourser en quelques jours',

  overview: `Le module Notes de Frais simplifie la vie des collaborateurs et du service compta. Vous photographiez vos tickets et factures, le système reconnaît automatiquement le montant et la date. Votre manager valide en un clic. Le remboursement part avec la paie suivante. Plus d\'enveloppes pleines de tickets froissés, plus de tableurs Excel à rendre en retard.`,

  articles: [
    {
      id: 'expenses-saisir',
      title: 'Déclarer une dépense en 1 minute',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Camera',
        content: `Depuis l\'app mobile, bouton « + Note de frais ». Prenez en photo le ticket ou la facture. Le système lit automatiquement le montant, la TVA, la date et le nom du commerçant. Vérifiez, choisissez la catégorie (repas, transport, hébergement…), ajoutez un commentaire si besoin (« Déjeuner client X »), validez. La note part en validation chez votre manager.`,
        bullets: [
          'Photo du ticket avec l\'app mobile',
          'Reconnaissance automatique montant + date + commerçant',
          'Choisir la catégorie de dépense',
          'Commentaire pour contextualiser (client, projet, mission)',
          'Une note de frais peut contenir plusieurs dépenses (un déplacement entier)',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Zap',
        content: `Plus de tickets accumulés au fond du portefeuille qui partent à la machine à laver. Plus de notes de frais bouclées le dimanche soir. Vous saisissez en sortant du resto, c\'est fait.`,
      },
    },
    {
      id: 'expenses-valider',
      title: 'Valider les notes de son équipe (manager)',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'CheckCircle',
        content: `En tant que manager, vous recevez une notification dès qu\'un collaborateur soumet une note. Onglet « À valider ». Cliquez sur la note → vérifiez la photo, la catégorie, le montant. Si tout est OK, bouton « Valider ». Si quelque chose cloche (justificatif illisible, dépense hors politique), bouton « Refuser » avec motif. Le collaborateur reçoit la décision immédiatement.`,
        bullets: [
          'Notification dès qu\'une note arrive en validation',
          'Vérification de la photo en plein écran',
          'Bouton « Valider » ou « Refuser avec motif »',
          'Décision notifiée au collaborateur instantanément',
          'Vue d\'ensemble : combien de notes en attente, depuis combien de temps',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Heart',
        content: `Vous validez en 30 secondes par note, depuis n\'importe où. Plus de pile de notes à signer en bas de votre bureau. Vos collaborateurs sont remboursés plus vite, ils sont contents.`,
      },
    },
    {
      id: 'expenses-rembourser',
      title: 'Suivre les remboursements',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'TrendingUp',
        content: `Onglet « Remboursements ». La compta voit les notes validées en attente de remboursement. Tous les vendredis (ou autre cadence définie), elle exporte les montants vers la paie ou prépare un virement direct. Les collaborateurs voient le statut « Remboursé » sur leur note avec date et montant. Tout reste tracé pour la comptabilité.`,
        bullets: [
          'Liste des notes validées à rembourser',
          'Export vers la paie ou virement direct',
          'Statut visible par le collaborateur',
          'Écriture comptable créée automatiquement',
          'Justificatifs archivés pour le contrôle fiscal',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Award',
        content: `Le circuit est court et propre. Le collaborateur est remboursé sous 7 à 15 jours selon le rythme. La compta a tous les justificatifs au format numérique pour les contrôles. Tout le monde y gagne.`,
      },
    },
  ],

  faq: [
    {
      q: 'J\'ai perdu un ticket, que faire ?',
      a: 'Indiquez « Pas de justificatif » avec un commentaire explicatif. La validation se fait au cas par cas (montant raisonnable, contexte). Au-delà d\'un certain montant (souvent 25 €), le remboursement peut être refusé sans justificatif.',
    },
    {
      q: 'Comment gérer les frais kilométriques (utilisation voiture perso) ?',
      a: 'Catégorie « Indemnités kilométriques ». Saisir nombre de km, le montant est calculé selon le barème fiscal en vigueur. Le module Flotte peut aussi tracer automatiquement les trajets pro.',
    },
    {
      q: 'Y a-t-il des plafonds par catégorie ?',
      a: 'Selon la politique de l\'entreprise. Configurés dans Paramètres → Notes de frais. Une dépense au-dessus du plafond est marquée orange — au manager de décider s\'il valide quand même.',
    },
    {
      q: 'Pourquoi mon manager refuse ma note ?',
      a: 'Toujours avec un motif écrit (lisible, justificatif manquant, hors politique…). Si vous n\'êtes pas d\'accord, parlez-en directement ou demandez l\'arbitrage des RH.',
    },
    {
      q: 'Comment exporter mes notes pour ma déclaration fiscale personnelle ?',
      a: 'Onglet « Mes notes » → bouton « Export annuel ». PDF récapitulatif de toutes vos notes de l\'année avec montants et catégories.',
    },
  ],
};
