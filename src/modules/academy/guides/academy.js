export default {
  id: 'academy',
  label: 'Nexus Academy',
  icon: 'GraduationCap',
  color: '#8B5CF6',
  tagline: 'Le centre d\'aide intégré : apprendre à utiliser chaque module',

  overview: `Nexus Academy est le manuel d'utilisation de toute la plateforme. Chaque module a sa fiche : à quoi il sert, comment l'utiliser, les questions fréquentes. Pas besoin de chercher dans des PDF perdus ou d'envoyer un email au support : tout est ici, à jour, recherchable. Si vous débutez sur Nexus OS, commencez ici.`,

  articles: [
    {
      id: 'academy-naviguer',
      title: 'Trouver le bon guide en 10 secondes',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'Search',
        content: `Tapez ce que vous cherchez dans la barre de recherche en haut (« créer un devis », « valider un congé », « envoyer un reçu fiscal »…). Les résultats remontent les articles et FAQ correspondants, tous modules confondus. Vous pouvez aussi cliquer sur le nom d'un module dans la liste à gauche pour voir son guide complet.`,
        bullets: [
          'Barre de recherche tout en haut, accessible depuis n\'importe quel guide',
          'La recherche couvre articles ET questions fréquentes',
          'Liste des modules à gauche : cliquer pour ouvrir le guide complet',
          'Chaque guide a : introduction, articles pratiques, FAQ',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Rocket',
        content: `Vous trouvez l'information en quelques secondes au lieu de demander à un collègue ou d'attendre une réponse du support. Vous devenez autonome plus vite et vous évitez de bloquer des collègues pour des questions de base.`,
      },
    },
    {
      id: 'academy-suggerer',
      title: 'Suggérer une amélioration',
      logic: {
        heading: 'Comment faire au quotidien',
        icon: 'MessageSquare',
        content: `Si un guide manque de clarté, si une information vous semble fausse, ou si une question fréquente n'est pas couverte, vous pouvez nous le signaler. Cliquez sur le bouton « Suggérer » en bas de chaque guide, écrivez votre remarque, validez. L'équipe Nexus OS reçoit votre retour et améliorera le guide.`,
        bullets: [
          'Bouton « Suggérer une amélioration » en bas de chaque guide',
          'Décrivez en quelques mots ce qui devrait être ajouté ou corrigé',
          'Vous pouvez rester anonyme ou laisser votre nom',
          'Les meilleures suggestions intègrent l\'Academy sous quelques jours',
        ],
      },
      finality: {
        heading: 'À quoi ça vous sert',
        icon: 'Heart',
        content: `L'Academy s'améliore grâce à vos retours. Plus vous l'utilisez et plus vous signalez ce qui manque, plus elle devient utile pour vous et vos collègues. Personne ne connaît mieux que les utilisateurs ce qui mérite d'être documenté.`,
      },
    },
  ],

  faq: [
    {
      q: 'Je cherche un sujet mais rien ne remonte, pourquoi ?',
      a: 'Essayez d\'autres mots-clés (synonymes, termes plus simples). Si le sujet n\'existe vraiment pas, utilisez « Suggérer une amélioration » pour le proposer.',
    },
    {
      q: 'Les guides sont-ils à jour avec la dernière version de l\'app ?',
      a: 'Oui. À chaque évolution importante de la plateforme, les guides concernés sont mis à jour. La date de dernière mise à jour figure en bas de chaque guide.',
    },
    {
      q: 'Puis-je télécharger un guide en PDF pour le lire hors ligne ?',
      a: 'Bouton « Télécharger PDF » en haut de chaque guide. Pratique pour préparer une formation ou lire dans le train.',
    },
    {
      q: 'Y a-t-il des vidéos ou seulement du texte ?',
      a: 'Pour l\'instant uniquement du texte, conçu pour aller à l\'essentiel. Des vidéos seront ajoutées progressivement sur les modules les plus consultés.',
    },
    {
      q: 'Comment former une nouvelle recrue rapidement ?',
      a: 'Donnez-lui accès à l\'Academy dès son arrivée. Conseillez-lui de lire les guides des modules qu\'elle utilisera. C\'est conçu pour être lu en autonomie en 1-2 heures.',
    },
  ],
};
