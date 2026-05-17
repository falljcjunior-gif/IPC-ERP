export default {
  id: 'legal',
  label: 'Juridique',
  icon: 'Scale',
  color: '#4338CA',
  tagline: 'Garder le contrôle sur contrats, échéances et obligations légales',

  overview: `Le module Juridique centralise tous vos documents légaux : contrats clients et fournisseurs, statuts, baux, assurances, NDA. Vous savez quand chaque contrat se renouvelle, quand chaque obligation arrive à échéance, et vous gardez la trace de toutes les signatures. C'est l'outil du juriste, mais aussi du DG d'une PME qui veut éviter de réveiller son avocat à 22h.`,

  articles: [
    {
      id: 'legal-contrats',
      title: 'Stocker et retrouver un contrat',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'FileText',
        content: `Bouton « Nouveau contrat ». Choisissez le type (client, fournisseur, bail, NDA, autre). Téléversez le PDF signé. Saisissez les infos clés : parties, date de signature, date de fin, montant, conditions de renouvellement. Ajoutez des étiquettes pour le retrouver. Tous les champs sont recherchables — vous retrouvez un contrat en tapant 3 mots-clés.`,
        bullets: [
          'Catégorie : client / fournisseur / bail / NDA / autre',
          'PDF signé téléversé et conservé',
          'Dates clés : signature, prise d\'effet, fin, renouvellement',
          'Recherche par mot-clé dans tous les contrats',
          'Liaison avec la fiche client ou fournisseur (CRM)',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Compass',
        content: `Plus jamais de « où est passé le contrat avec X ? » qui mobilise 3 personnes pendant 2 heures. Tout est dans le module, accessible 24/7, en quelques clics. Et seuls les bons profils y ont accès (confidentialité juridique).`,
      },
    },
    {
      id: 'legal-echeances',
      title: 'Suivre les échéances et renouvellements',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Activity',
        content: `Onglet « Échéances ». La liste des contrats qui arrivent à terme ou se renouvellent dans les 90 jours s'affiche, triée par urgence. Vous décidez pour chacun : renouveler, renégocier, résilier. Le système envoie des rappels automatiques 60 et 30 jours avant la date de tacite reconduction (très utile pour ne pas se retrouver coincé un an de plus).`,
        bullets: [
          'Liste triée par date d\'échéance',
          'Rappels automatiques à 60 et 30 jours',
          'Note d\'action : à renouveler / négocier / résilier',
          'Lien direct vers le contrat pour relire les clauses',
          'Notification email aux personnes concernées',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Heart',
        content: `Plus de contrat qui se reconduit tacitement parce que personne n'a regardé la date. Plus de bail commercial oublié qui pose problème au mauvais moment. Vous gardez la main sur tous vos engagements.`,
      },
    },
    {
      id: 'legal-signature',
      title: 'Faire signer un nouveau contrat',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'CheckCircle',
        content: `Préparez le PDF du contrat (Word puis export PDF, ou directement depuis un modèle). Bouton « Envoyer pour signature ». Renseignez les signataires (email + nom). Placez les zones de signature et paraphe sur le document avec la souris. Validez : chaque signataire reçoit un lien sécurisé pour signer électroniquement. Une fois tous les signataires passés, le contrat signé est automatiquement archivé.`,
        bullets: [
          'Envoi pour signature en quelques clics (voir module Signature)',
          'Placement des zones de signature/paraphe à la souris',
          'Chaque signataire signe à son rythme depuis son ordi ou téléphone',
          'Notification quand tous les signataires ont signé',
          'Archivage automatique du contrat finalisé',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Zap',
        content: `Plus de contrat à imprimer, signer, scanner, envoyer, attendre le retour du client, scanner sa version… Tout se fait en quelques heures au lieu de plusieurs semaines. Et la signature électronique a la même valeur juridique qu'une signature manuscrite.`,
      },
    },
  ],

  faq: [
    {
      q: 'La signature électronique est-elle reconnue ?',
      a: 'Oui. Le module utilise des certificats conformes au règlement européen eIDAS (signature électronique avancée). Valable devant les tribunaux français et européens pour la grande majorité des contrats.',
    },
    {
      q: 'Comment limiter l\'accès aux contrats sensibles ?',
      a: 'Sur chaque contrat → onglet « Accès ». Restreindre à certains rôles (DG, juriste) ou personnes nommées. Les autres ne le verront pas dans la liste, même en cherchant.',
    },
    {
      q: 'Mon avocat veut consulter un dossier, comment lui donner accès ?',
      a: 'Bouton « Partager temporairement » sur le contrat → email de l\'avocat + durée d\'accès (ex : 30 jours). Lien sécurisé, accès en lecture seule, traçabilité totale.',
    },
    {
      q: 'Un contrat est en cours de négociation avec plusieurs versions, comment suivre ?',
      a: 'Onglet « Versions » sur le contrat. À chaque dépôt d\'une nouvelle version, elle est conservée avec date et auteur. Pratique pour comparer ou revenir en arrière.',
    },
    {
      q: 'Comment générer un contrat à partir d\'un modèle ?',
      a: 'Onglet « Modèles ». Choisir le modèle (NDA, CDI, contrat de prestation…). Remplir les champs spécifiques (parties, montants, dates). Le PDF final est généré, prêt à envoyer en signature.',
    },
  ],
};
