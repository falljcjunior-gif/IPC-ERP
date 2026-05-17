export default {
  id: 'payroll',
  label: 'Paie & Social',
  icon: 'Wallet',
  color: '#7C2D12',
  tagline: 'Faire la paie chaque mois en évitant erreurs et retards',

  overview: `Le module Paie & Social calcule chaque mois les bulletins de salaire à partir des éléments saisis pendant le mois (heures, absences, primes, notes de frais). Il génère les bulletins, les déclarations sociales (DSN), et prépare les virements. Conçu pour fonctionner avec votre expert-comptable ou en autonomie selon votre organisation.`,

  articles: [
    {
      id: 'payroll-elements',
      title: 'Préparer les éléments variables du mois',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'FileText',
        content: `Tout au long du mois, les heures, absences, notes de frais sont collectées automatiquement (depuis Planning, RH, Notes de Frais). Quelques jours avant la clôture, vous ouvrez la « Préparation paie » : la liste des collaborateurs s'affiche avec leurs éléments du mois. Vous ajoutez les éléments exceptionnels (prime, commission, avance). Vous validez collaborateur par collaborateur ou en lot.`,
        bullets: [
          'Pré-remplissage automatique depuis les autres modules',
          'Ajout manuel des primes, commissions, avances',
          'Vue par collaborateur ou tableau récap',
          'Alerte si un élément semble incohérent (heures = 0, absence injustifiée…)',
          'Validation à deux niveaux possible (manager + RH)',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Zap',
        content: `Vous ne ressaisissez rien manuellement. Les heures viennent du pointage, les absences du module Congés, les frais de Notes de Frais. Le risque d'erreur est divisé par 10.`,
      },
    },
    {
      id: 'payroll-bulletins',
      title: 'Générer les bulletins de paie',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Calculator',
        content: `Une fois les éléments validés, bouton « Calculer les bulletins ». Le système calcule cotisations salariales et patronales selon la convention collective, le statut, les particularités (handicap, exonérations…). Les bulletins sont prévisualisés. Vous vérifiez quelques-uns au hasard pour contrôle. Si OK, bouton « Diffuser » : chaque salarié reçoit son bulletin par email avec lien sécurisé vers son coffre numérique.`,
        bullets: [
          'Calcul automatique selon convention collective',
          'Prévisualisation avant diffusion',
          'Contrôles automatiques (totaux, plafonds)',
          'Diffusion email avec coffre numérique',
          'Conservation 50 ans légalement obligée',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Award',
        content: `Faire la paie d'une dizaine de personnes peut prendre une journée à la main. Avec ce module, c'est l'affaire de 2 heures, avec moins d'erreurs. Vos collaborateurs reçoivent leur bulletin sans délai.`,
      },
    },
    {
      id: 'payroll-dsn',
      title: 'Envoyer la déclaration sociale (DSN)',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'CheckCircle',
        content: `Après diffusion des bulletins, onglet « DSN ». Le fichier au format DSN (Déclaration Sociale Nominative) est généré automatiquement avec tous les éléments à transmettre (cotisations, salaires, mouvements de personnel). Vérification automatique des erreurs courantes. Envoi direct vers net-entreprises.fr en un clic. Accusé de réception archivé.`,
        bullets: [
          'Fichier DSN généré automatiquement',
          'Contrôles préalables intégrés',
          'Envoi direct vers net-entreprises',
          'Accusé de réception conservé',
          'Suivi des éventuels rejets et corrections',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Compass',
        content: `La DSN doit être envoyée chaque mois. Si elle est oubliée ou erronée, c'est l'URSSAF qui rappelle (avec pénalités). Avec ce module, c'est automatique, daté, archivé. Vous dormez tranquille.`,
      },
    },
  ],

  faq: [
    {
      q: 'Et si mon expert-comptable fait la paie ?',
      a: 'Vous lui donnez accès au module en mode « comptable externe ». Il voit les éléments et calcule. Vous restez en visibilité. Tout le monde travaille sur les mêmes données — plus d\'allers-retours par email.',
    },
    {
      q: 'Comment gérer un rappel de paie (oubli d\'une prime) ?',
      a: 'Fiche du salarié → « Rappel sur paie » → indiquer mois concerné, motif, montant. Le rappel est intégré sur la prochaine paie avec une mention claire sur le bulletin.',
    },
    {
      q: 'Les bulletins sont-ils consultables par le salarié plus tard ?',
      a: 'Oui, à vie, dans son coffre numérique. Même après avoir quitté l\'entreprise. Légalement, l\'employeur doit aussi les conserver 50 ans.',
    },
    {
      q: 'Comment gérer un changement de convention collective ?',
      a: 'Paramètres paie → « Convention ». Sélectionner la nouvelle convention à partir d\'une date donnée. Les calculs s\'adaptent automatiquement. À valider avec votre expert RH/social pour les implications.',
    },
    {
      q: 'Mon salarié dit qu\'il y a une erreur sur son bulletin, que faire ?',
      a: 'Vérifier dans la fiche du mois : éléments saisis vs résultat. Si erreur, faire un rectificatif sur le mois suivant. Garder une trace écrite de la demande et de la résolution.',
    },
  ],
};
