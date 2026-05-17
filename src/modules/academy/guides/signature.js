export default {
  id: 'signature',
  label: 'Signature Électronique',
  icon: 'PenTool',
  color: '#7C3AED',
  tagline: 'Faire signer un document en quelques minutes, depuis n\'importe où',

  overview: `Le module Signature Électronique permet d'envoyer n'importe quel document PDF à une ou plusieurs personnes pour signature. Les signataires reçoivent un lien par email, signent en quelques clics depuis leur téléphone ou ordinateur, et le document signé est archivé automatiquement. Valable légalement comme une signature manuscrite.`,

  articles: [
    {
      id: 'signature-envoyer',
      title: 'Envoyer un document à signer',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Send',
        content: `Bouton « Nouvelle demande de signature ». Choisissez ou téléversez le PDF à signer. Ajoutez les signataires : nom + adresse email. Placez les zones de signature sur le document en cliquant à l'endroit souhaité (bas de page, case dédiée…). Ajoutez des zones de paraphe si nécessaire. Rédigez un message court pour le signataire. Cliquez « Envoyer » : chaque signataire reçoit un email avec lien sécurisé.`,
        bullets: [
          'Bouton « Nouvelle demande »',
          'Téléverser le PDF ou le choisir depuis Documents Cloud',
          'Ajouter un ou plusieurs signataires (email + nom)',
          'Placer les zones de signature à la souris',
          'Envoyer — notification immédiate aux signataires',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Zap',
        content: `Plus d'impression, de scan, d'aller-retour postal. Un contrat signé en quelques heures au lieu de plusieurs jours. Vos clients et fournisseurs signent depuis leur téléphone, même s'ils sont à l'étranger.`,
      },
    },
    {
      id: 'signature-suivre',
      title: 'Suivre l\'avancement des signatures',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Activity',
        content: `Onglet « En attente ». Chaque demande affiche son statut : envoyé, ouvert, signé, refusé. Vous voyez qui a signé et qui ne l'a pas encore fait. Bouton « Relancer » pour envoyer un rappel email au signataire en retard, sans avoir à rédiger quoi que ce soit. Une fois tous les signataires passés, le statut passe automatiquement à « Complété ».`,
        bullets: [
          'Liste des demandes avec statut en temps réel',
          'Voir qui a signé, qui est en attente',
          'Bouton « Relancer » en un clic',
          'Notification automatique à la dernière signature',
          'Document finalisé archivé automatiquement',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Eye',
        content: `Vous savez à tout moment où en est la signature sans avoir à appeler ou envoyer des emails de relance. Plus de contrat bloqué parce qu'un signataire a oublié.`,
      },
    },
    {
      id: 'signature-recuperer',
      title: 'Récupérer le document signé',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Download',
        content: `Dès que toutes les signatures sont recueillies, vous recevez une notification. Cliquez sur la demande → bouton « Télécharger le document signé ». Le PDF contient les signatures, les dates, et un certificat d'authenticité intégré. Il est aussi automatiquement archivé dans le module Documents Cloud, lié à la fiche client ou fournisseur si vous l'avez précisé.`,
        bullets: [
          'Notification dès la dernière signature',
          'Téléchargement du PDF signé + certificat',
          'Archivage automatique dans Documents Cloud',
          'Liaison avec la fiche client/fournisseur/contrat',
          'Valeur légale : conforme eIDAS (règlement européen)',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Award',
        content: `Le document est signé, archivé, et traçable en quelques minutes. En cas de litige, vous avez la preuve de qui a signé, quand, et depuis quelle adresse IP. Valable devant les tribunaux.`,
      },
    },
  ],

  faq: [
    {
      q: 'La signature électronique est-elle légalement valide ?',
      a: 'Oui. Le module utilise une signature conforme au règlement eIDAS (Union Européenne). Elle est reconnue juridiquement en France et dans toute l\'UE pour la grande majorité des contrats commerciaux.',
    },
    {
      q: 'Le signataire doit-il avoir un compte sur la plateforme ?',
      a: 'Non. Il reçoit un lien par email et signe directement dans son navigateur, sans créer de compte. C\'est volontaire pour faciliter la signature avec des partenaires externes.',
    },
    {
      q: 'Un signataire peut-il refuser de signer ?',
      a: 'Oui. Il peut cliquer sur « Refuser » avec un motif. Vous êtes notifié immédiatement. La demande passe en statut « Refusée » et vous pouvez soit corriger le document, soit en discuter.',
    },
    {
      q: 'Peut-on définir un ordre de signature (ex : manager signe avant employé) ?',
      a: 'Oui. Lors de la création, activez « Ordre de signature » et numérotez les signataires. Le suivant ne reçoit son invitation qu\'une fois le précédent ayant signé.',
    },
    {
      q: 'Combien de temps les documents signés sont-ils conservés ?',
      a: 'Indéfiniment, tant que votre compte est actif. Les documents sont conservés avec leur certificat de preuve, archivés dans Documents Cloud.',
    },
  ],
};
