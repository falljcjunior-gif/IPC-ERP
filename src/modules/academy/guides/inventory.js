export default {
  id: 'inventory',
  label: 'Stocks & Logistique',
  icon: 'Package',
  color: '#84CC16',
  tagline: 'Savoir en temps réel ce que vous avez, où, et quand recommander',

  overview: `Le module Stocks & Logistique vous permet de savoir à tout moment quels produits vous avez en stock, dans quel entrepôt, en quelle quantité. Vous êtes alerté quand un stock devient bas, vous recommandez en un clic, et chaque sortie de marchandise est tracée. Fini les ruptures de stock qui font perdre des ventes et les sur-stockages qui coûtent cher.`,

  articles: [
    {
      id: 'inventory-consulter',
      title: 'Consulter votre stock en temps réel',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Eye',
        content: `Ouvrez le module. La liste de tous vos produits s'affiche : référence, désignation, quantité disponible, valeur. Un voyant coloré indique l'état : vert (stock OK), orange (proche du seuil mini), rouge (rupture imminente). Cliquez sur un produit pour voir son historique de mouvements (entrées et sorties des 30 derniers jours).`,
        bullets: [
          'Liste complète avec recherche par référence ou nom',
          'Voyant vert / orange / rouge selon le seuil',
          'Filtres : par entrepôt, par catégorie, par fournisseur',
          'Cliquer sur un produit → historique des mouvements',
          'Export Excel pour analyses ou inventaires physiques',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Compass',
        content: `Plus de coup de fil au magasinier pour savoir s'il reste du produit X. Plus de promesse au client sans vérifier. Vous prenez des décisions commerciales avec une info à jour à la minute. Fini les ventes annulées parce que « finalement, on n'en a plus ».`,
      },
    },
    {
      id: 'inventory-mouvement',
      title: 'Enregistrer une entrée ou sortie',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'TrendingUp',
        content: `Pour une entrée (livraison fournisseur) : bouton « Entrée » → choisir le produit → quantité → bon de livraison → valider. Pour une sortie (vente, prélèvement) : bouton « Sortie » → produit → quantité → motif (vente, casse, transfert vers autre entrepôt). Le stock se met à jour immédiatement et l'historique conserve qui a fait quoi.`,
        bullets: [
          'Bouton « Entrée » pour les arrivages fournisseur',
          'Bouton « Sortie » pour les ventes, transferts, casses',
          'Motif obligatoire pour les sorties (traçabilité)',
          'Scan code-barres possible avec l\'app mobile',
          'Validation à deux niveaux pour les gros mouvements',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'CheckCircle',
        content: `La traçabilité est totale : qui a sorti combien, quand, et pourquoi. En cas d'écart à l'inventaire physique, vous remontez la piste en quelques clics. C'est aussi essentiel pour la conformité (audit, expertise comptable, certifications).`,
      },
    },
    {
      id: 'inventory-recommande',
      title: 'Recommander quand le stock baisse',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Zap',
        content: `Le système surveille en permanence vos stocks. Quand un produit passe sous le seuil minimum que vous avez défini, une alerte apparaît avec une proposition de commande (quantité calculée selon vos ventes des 90 derniers jours). Vous validez, ajustez si besoin, et la commande part au fournisseur (par email automatique ou bon de commande PDF).`,
        bullets: [
          'Seuil minimum à définir produit par produit',
          'Alerte en haut de l\'écran dès qu\'un produit passe sous le seuil',
          'Proposition de quantité basée sur les ventes récentes',
          'Bon de commande au fournisseur en un clic',
          'Suivi de la commande jusqu\'à la réception',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Rocket',
        content: `Vous arrêtez de naviguer entre rupture (qui fait perdre des ventes) et sur-stockage (qui immobilise de la trésorerie). Le système calcule pour vous, vous validez. Vos stocks restent au plus juste, tout le temps.`,
      },
    },
  ],

  faq: [
    {
      q: 'Comment faire un inventaire physique (comptage annuel) ?',
      a: 'Bouton « Lancer inventaire ». Le système gèle les stocks pour la session. Vous comptez et saisissez les quantités réelles (manuellement ou via l\'app mobile avec scan). Les écarts apparaissent en fin d\'inventaire pour validation.',
    },
    {
      q: 'Que se passe-t-il si un client commande plus que mon stock ?',
      a: 'Le système bloque la commande et propose : (1) partager la commande en deux livraisons, (2) attendre un réapprovisionnement, (3) refuser. Vous décidez selon la relation client.',
    },
    {
      q: 'J\'ai plusieurs entrepôts, comment transférer entre eux ?',
      a: 'Bouton « Transfert inter-entrepôts ». Choisir produit, quantité, entrepôt source et destination. Le mouvement est tracé des deux côtés. Génère un bon de transfert PDF.',
    },
    {
      q: 'Comment gérer les produits périssables (DLC) ?',
      a: 'Activer le suivi par lot. Chaque entrée crée un lot avec une DLC. Les sorties se font en priorité sur le lot le plus ancien (FIFO). Alerte 30 jours avant péremption.',
    },
    {
      q: 'Le coût de revient affiché correspond-il au coût réel ?',
      a: 'Oui, calculé en PMP (prix moyen pondéré) automatiquement à chaque entrée. Visible dans la fiche produit, repris dans les marges des devis et factures.',
    },
  ],
};
