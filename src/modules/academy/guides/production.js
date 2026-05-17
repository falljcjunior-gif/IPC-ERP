export default {
  id: 'production',
  label: 'Production & Usine',
  icon: 'Factory',
  color: '#7C3AED',
  tagline: 'Piloter la fabrication, du lancement de l\'ordre à la sortie d\'usine',

  overview: `Le module Production & Usine gère tout ce qui se passe entre la commande client et la sortie du produit fini. Vous lancez des ordres de fabrication, suivez leur avancement étape par étape, contrôlez la qualité, et savez en permanence quelle quantité va sortir et quand. C'est l'outil du responsable production qui veut visualiser son atelier sans courir entre les postes.`,

  articles: [
    {
      id: 'production-lancer',
      title: 'Lancer un ordre de fabrication',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Rocket',
        content: `Onglet « Ordres » → bouton « Nouvel ordre ». Choisissez le produit à fabriquer dans le catalogue. Indiquez la quantité et la date de livraison souhaitée. Le système vérifie les matières premières nécessaires (s'affichent en rouge si manquantes). Si tout est OK, validez : l'ordre est lancé en production et apparaît sur le planning atelier.`,
        bullets: [
          'Choisir le produit fini → la recette/nomenclature est connue',
          'Quantité à fabriquer + date promise',
          'Vérification automatique des matières premières disponibles',
          'Alerte si une matière manque (commande à passer)',
          'L\'ordre apparaît sur le planning des postes de travail',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Zap',
        content: `Plus de production lancée à l'aveugle qui se bloque au milieu parce qu'il manque une pièce. Le système calcule à votre place ce dont vous avez besoin, vous prévient des manques, et vous évitez les arrêts de chaîne coûteux.`,
      },
    },
    {
      id: 'production-suivre',
      title: 'Suivre l\'avancement des ordres',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Activity',
        content: `Onglet « En cours » → vue planning des ordres en fabrication, regroupés par poste de travail (découpe, assemblage, conditionnement…). Une barre de progression indique le % d'avancement. Les opérateurs marquent les étapes terminées depuis leur poste (écran tactile ou app mobile). Vous voyez en direct l'état de l'atelier.`,
        bullets: [
          'Vue planning par poste de travail',
          'Barre de progression par ordre',
          'Validation des étapes par les opérateurs en quelques secondes',
          'Filtre par urgence, par date promise, par client',
          'Alerte rouge si un ordre risque d\'être en retard',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Eye',
        content: `Vous savez à tout moment où en est chaque commande sans avoir à descendre sur le terrain. Quand un client demande « ma commande, c'est pour quand ? », vous avez la réponse précise immédiatement.`,
      },
    },
    {
      id: 'production-cloturer',
      title: 'Clôturer un ordre et envoyer en stock',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'CheckCircle',
        content: `Quand toutes les étapes sont terminées, l'ordre passe en statut « À clôturer ». Le responsable contrôle qualité valide (oui/non avec commentaire). En validant, les produits finis entrent automatiquement en stock et les matières premières consommées sont déduites. Une fiche de production est générée avec les quantités réelles, durées, opérateurs.`,
        bullets: [
          'Statut « À clôturer » quand toutes les étapes sont OK',
          'Contrôle qualité final avant clôture',
          'Stock produit fini incrémenté automatiquement',
          'Stock matières premières décrémenté',
          'Fiche de production archivée (traçabilité totale)',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Award',
        content: `La traçabilité est totale : pour chaque produit fini, on sait qui l'a fabriqué, quand, avec quelles matières premières (lots), en combien de temps. Indispensable pour la conformité qualité et pour analyser la productivité.`,
      },
    },
  ],

  faq: [
    {
      q: 'Comment définir la recette d\'un nouveau produit ?',
      a: 'Catalogue produits → fiche produit → onglet « Nomenclature ». Ajoutez les composants (matières premières, sous-ensembles) avec quantités. Cette nomenclature sera utilisée à chaque lancement d\'ordre.',
    },
    {
      q: 'Un poste de travail est en panne, comment dévier les ordres ?',
      a: 'Planning → cliquer sur l\'ordre → « Replanifier sur autre poste ». Le système propose les postes capables de faire la même opération.',
    },
    {
      q: 'Comment mesurer la productivité par opérateur ?',
      a: 'Rapport Production → « Productivité ». Vous voyez par opérateur : nombre d\'ordres traités, temps moyen, taux de non-conformité. Comparaison sur la période choisie.',
    },
    {
      q: 'Un ordre doit être annulé après lancement, c\'est possible ?',
      a: 'Oui, bouton « Annuler ordre » avec motif obligatoire. Les matières déjà consommées restent décomptées (ne reviennent pas en stock automatiquement — décision manuelle pour éviter les erreurs).',
    },
    {
      q: 'Comment gérer la sous-traitance d\'une étape ?',
      a: 'Dans la nomenclature, marquer l\'étape comme « sous-traitée » et désigner le fournisseur. Le système génère le bon de sous-traitance, suit le retour, et reprend la production à la suite.',
    },
  ],
};
