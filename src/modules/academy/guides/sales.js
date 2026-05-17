export default {
  id: 'sales',
  label: 'Ventes & Devis',
  icon: 'ShoppingCart',
  color: '#F97316',
  tagline: 'Créer un devis, le faire signer, le transformer en commande',

  overview: `Le module Ventes & Devis vous aide à créer des devis professionnels, les envoyer aux clients, suivre leur acceptation et les transformer automatiquement en bons de commande. Plus besoin de jongler entre Word, Excel et la signature scannée : tout se fait dans un seul endroit, avec une trace propre pour la comptabilité.`,

  articles: [
    {
      id: 'sales-creer-devis',
      title: 'Créer un devis en 3 minutes',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'FileText',
        content: `Cliquez sur « Nouveau devis ». Choisissez le client dans votre CRM (ou créez-le à la volée). Ajoutez les produits ou services : tapez les premières lettres, la liste s'auto-complète depuis votre catalogue. Indiquez la quantité, le prix se calcule automatiquement. Ajoutez une remise si besoin. La TVA, le sous-total et le total se mettent à jour en direct.`,
        bullets: [
          'Bouton « Nouveau devis »',
          'Choisir le client → ses coordonnées se remplissent',
          'Ajouter des lignes : produit, quantité, prix unitaire',
          'Remise globale ou par ligne',
          'TVA et totaux calculés automatiquement',
          'Aperçu PDF avant envoi pour vérifier la mise en page',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Zap',
        content: `Vous envoyez un devis pro 3x plus vite qu'avec Word. Aucun risque d'erreur de calcul. Le client reçoit un document propre avec votre logo et vos conditions. Et tout reste retrouvable dans 6 mois sans chercher dans des dossiers.`,
      },
    },
    {
      id: 'sales-envoyer-suivre',
      title: 'Envoyer le devis et suivre la réponse',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'MessageSquare',
        content: `Une fois le devis prêt, bouton « Envoyer par email ». Le client reçoit un lien sécurisé pour consulter le PDF en ligne (ou le télécharger). Il peut signer électroniquement d'un clic. Vous voyez en temps réel : devis ouvert, vu, signé. Si pas de réponse au bout de 7 jours, le système vous propose une relance automatique.`,
        bullets: [
          'Envoi par email avec un lien sécurisé',
          'Signature électronique sans imprimer ni scanner',
          'Statut en direct : envoyé / ouvert / signé / refusé',
          'Relance automatique programmable (7 jours, 14 jours…)',
          'Notification quand le client ouvre ou signe',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Eye',
        content: `Vous savez précisément où en est chaque devis. Plus de relances inutiles à un client qui a déjà signé. Plus d'oubli d'un devis envoyé il y a 3 semaines. Le taux de signature augmente parce que vous relancez au bon moment.`,
      },
    },
    {
      id: 'sales-vers-commande',
      title: 'Transformer un devis signé en commande',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'CheckCircle',
        content: `Dès qu'un devis est signé, un bouton « Convertir en commande » apparaît sur la fiche. Cliquez : le bon de commande est créé en un instant, avec exactement les mêmes lignes. Selon vos produits, cela déclenche aussi : sortie de stock, planification production, demande de livraison. Tout part en cascade automatiquement.`,
        bullets: [
          'Bouton « Convertir en commande » sur les devis signés',
          'Aucune ressaisie : tout est repris du devis',
          'Sortie de stock automatique si produits physiques',
          'Notification au service Production / Logistique selon le cas',
          'Facture proforma générée si demandée par le client',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Rocket',
        content: `Le commercial passe au client suivant pendant que la suite (stock, production, facturation) se met en route toute seule. Aucun risque d'oubli, de double saisie, ou d'incohérence entre devis et commande.`,
      },
    },
  ],

  faq: [
    {
      q: 'Le client a demandé une modification après signature, comment faire ?',
      a: 'Ouvrir le devis → bouton « Avenant ». Vous créez un avenant qui remplace ou complète le devis initial. Le client signe à nouveau. L\'historique des versions est conservé.',
    },
    {
      q: 'Puis-je personnaliser le modèle PDF du devis ?',
      a: 'Oui. Paramètres → Modèles → Devis. Vous pouvez changer le logo, les couleurs, les mentions légales en bas de page. Plusieurs modèles possibles (ex : devis B2B, devis particulier).',
    },
    {
      q: 'Comment appliquer une remise réservée à un seul client ?',
      a: 'Dans la fiche du client (CRM), saisissez sa remise négociée. Lors de la création d\'un devis pour lui, la remise s\'applique automatiquement à toutes les lignes (modifiable).',
    },
    {
      q: 'Que se passe-t-il si le client refuse le devis ?',
      a: 'Statut passe à « refusé », avec motif si vous le saisissez. Le devis reste consultable. Vous pouvez le dupliquer pour en faire un nouveau avec des conditions modifiées.',
    },
    {
      q: 'Les devis sont-ils visibles par mes collègues commerciaux ?',
      a: 'Selon les paramètres : généralement vous voyez les vôtres + ceux de votre équipe. Le manager voit tous ceux de la filiale. Les autres filiales ne voient pas vos devis (confidentialité).',
    },
  ],
};
