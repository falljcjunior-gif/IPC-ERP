/**
 * ══════════════════════════════════════════════════════════════════
 * NEXUS ACADEMY — BASE DE CONNAISSANCE STRATÉGIQUE
 * ══════════════════════════════════════════════════════════════════
 *
 * Structure par module :
 *   id          — identifiant unique
 *   label       — nom affiché dans la sidenav
 *   icon        — nom lucide-react (string, résolu dans le composant)
 *   color       — couleur accent du module
 *   tagline     — phrase-clé du module
 *   overview    — texte d'introduction
 *   articles[]  — liste d'articles (logique + finalité)
 *   faq[]       — questions / réponses
 */

export const NEXUS_GUIDE_DATA = [
  // ─────────────────────────────────────────────────────────────
  // MODULE 1 : MISSIONS
  // ─────────────────────────────────────────────────────────────
  {
    id: 'missions',
    label: 'Missions & Projets',
    icon: 'Kanban',
    color: '#6366f1',
    tagline: 'Orchestration polymorphe de tâches à l\'échelle de l\'entreprise',
    overview: `Missions est le cœur opérationnel de Nexus OS. Il dépasse le simple gestionnaire de tâches : c'est un moteur d'exécution stratégique basé sur LexoRank, un algorithme de tri O(1) qui permet des réorganisations Drag-and-Drop instantanées sur des milliers de cartes sans jamais réécrire l'ensemble de la collection.`,

    articles: [
      {
        id: 'missions-lexorank',
        title: 'LexoRank : le moteur de tri O(1)',
        logic: {
          heading: 'Comment ça fonctionne',
          icon: 'Cpu',
          content: `LexoRank attribue à chaque carte une clé lexicographique (ex. "0|hzzzzz:"). Lors d'un déplacement, seule la carte bougée reçoit une nouvelle clé calculée entre ses deux voisines — aucune renumérotation globale. Quand l'espace s'épuise (après des milliers de mouvements), un "rebalancing" silencieux redistribue les clés en arrière-plan sans bloquer l'UI.\n\nLe store Zustand (useMissionsStore) maintient une Map<boardId, Card[]> triée par rank. Firestore n'est écrit que pour la carte déplacée → coût réseau minimal.`,
          bullets: [
            'Insertion entre deux cartes : O(1) — une seule écriture Firestore',
            'Rebalancing automatique : déclenché en worker background quand l\'espace < 20 %',
            'Stabilité garantie : les ids de carte ne changent jamais, seul le champ `rank` évolue',
            'Pas de verrouillage pessimiste : deux utilisateurs peuvent déplacer des cartes simultanément sans conflit',
          ],
        },
        finality: {
          heading: 'Pourquoi c\'est stratégique',
          icon: 'Target',
          content: `Dans un ERP multi-utilisateurs, la fluidité du Kanban est un indicateur direct de la vélocité opérationnelle. Chaque milliseconde gagnée sur le tri se multiplie par le nombre de cartes et d'utilisateurs. LexoRank transforme un Kanban en outil de pilotage temps réel : les managers voient l'état exact de chaque projet sans délai de synchronisation.`,
        },
      },
      {
        id: 'missions-polymorphism',
        title: 'Polymorphisme des vues',
        logic: {
          heading: 'Comment ça fonctionne',
          icon: 'Layers',
          content: `MissionEngine est un pipeline pur (sans effets de bord) qui transforme rawCards → vue active via 4 étapes : normalizeCard(), applyFilters(), applySort(), applyGrouping(). Le résultat est passé à la vue active (Kanban, Table, Timeline, Galerie) via MissionsKanbanView / MissionsTableView.\n\nChaque vue est un composant React.lazy() chargé à la demande. Le moteur ne connaît pas la vue — il produit un tableau de cartes normalisées, les vues les consomment.`,
          bullets: [
            'Vue Kanban : groupement par liste, DnD LexoRank',
            'Vue Table : colonnes configurables, tri multi-critères',
            'Vue Timeline : Gantt avec dépendances inter-cartes',
            'Vue Galerie : cartes avec aperçu image, idéal pour assets créatifs',
          ],
        },
        finality: {
          heading: 'Pourquoi c\'est stratégique',
          icon: 'BarChart2',
          content: `Chaque département a un mode de pensée différent : la production pense en flux (Kanban), la finance en lignes (Table), le marketing en planning (Timeline). Missions s'adapte au cerveau de l'utilisateur, pas l'inverse. Le même pipeline de données alimente 4 représentations — zéro duplication de logique, zéro désynchronisation.`,
        },
      },
      {
        id: 'missions-workspaces',
        title: 'Workspaces départementaux',
        logic: {
          heading: 'Comment ça fonctionne',
          icon: 'Building2',
          content: `Au premier accès, seedDefaultWorkspaces() crée 9 workspaces (un par département) via un flag localStorage anti-double-exécution. Chaque workspace contient au moins un tableau "Tableau de bord" prêt à l'emploi.\n\nLes droits d'accès sont contrôlés par useWorkspaceAuth : lecture des claims Firebase (rôle + allowedModules) pour filtrer les workspaces visibles. Un STAFF ne voit que les workspaces de son département.`,
          bullets: [
            'Direction Générale, CRM & Ventes, Finance, RH, Opérations, Production, Marketing, IT, Juridique',
            'Création atomique : workspace + premier tableau en une transaction',
            'Flag localStorage missions_bootstrapped_{uid} évite la re-création au rechargement',
            'SUPER_ADMIN voit tous les workspaces, les autres rôles voient les leurs',
          ],
        },
        finality: {
          heading: 'Pourquoi c\'est stratégique',
          icon: 'Compass',
          content: `Un ERP sans structure de travail préétablie génère de l'entropie organisationnelle. En provisionnant les 9 workspaces dès le premier login, Nexus OS impose une architecture de travail alignée sur l'organigramme — les données sont rangées là où elles appartiennent, dès le jour 1.`,
        },
      },
    ],

    faq: [
      {
        q: 'Pourquoi mes cartes ne s\'affichent pas après un rechargement ?',
        a: 'Vérifiez que subscribeBoard() est bien appelé par MissionsHub (un seul useEffect avec boardId en dépendance). MissionsBoard ne doit pas appeler subscribeBoard — cela crée une double-souscription qui annule les listeners Firestore.',
      },
      {
        q: 'La boucle infinie React #185 s\'est déclenchée. Que faire ?',
        a: 'La cause la plus fréquente est un sélecteur Zustand qui retourne `|| []` (nouvelle référence à chaque render). Remplacez par `?? EMPTY_ARR` avec `const EMPTY_ARR = Object.freeze([])` au niveau du module. React 18 + useSyncExternalStore est strict sur la stabilité des snapshots.',
      },
      {
        q: 'Comment ajouter une nouvelle vue (ex : vue Calendrier) ?',
        a: 'Créez `MissionsCalendarView.jsx` qui consomme le prop `cards` de MissionEngine. Ajoutez l\'entrée dans le ViewSelector. Le moteur passe déjà les cartes normalisées — la vue n\'a qu\'à les afficher.',
      },
      {
        q: 'Le Drag-and-Drop ne fonctionne pas entre deux listes différentes ?',
        a: 'Vérifiez que useDragDrop.js utilise bien onDragEnd avec la logique de transfert cross-liste (sourceList !== destinationList). Le rank de la carte doit être recalculé par rapport aux cartes de la liste destination, pas la source.',
      },
      {
        q: 'Comment créer un workspace programmatiquement ?',
        a: 'Utilisez `MissionsFS.createWorkspace({ name, description }, uid)` qui retourne le wsId. Puis `MissionsFS.createBoard(wsId, { name, background, visibility }, uid)` pour le premier tableau. Voyez seedDefaultWorkspaces() comme référence.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // MODULE 2 : FINANCE & WAR ROOM
  // ─────────────────────────────────────────────────────────────
  {
    id: 'finance',
    label: 'Finance & War Room',
    icon: 'TrendingUp',
    color: '#10b981',
    tagline: 'Intelligence financière temps réel avec Monte-Carlo intégré',
    overview: `Finance & War Room est le centre de commandement financier de Nexus OS. Il combine comptabilité en partie double, simulation Monte-Carlo probabiliste, et authentification WebAuthn biométrique pour les opérations sensibles. Toute transaction génère automatiquement une écriture comptable via les Cloud Functions — zéro saisie manuelle.`,

    articles: [
      {
        id: 'finance-montecarlo',
        title: 'Simulation Monte-Carlo probabiliste',
        logic: {
          heading: 'Comment ça fonctionne',
          icon: 'Activity',
          content: `Pour chaque budget prévisionnel, le War Room lance N simulations (par défaut 10 000) en faisant varier les paramètres d'entrée selon leurs distributions historiques (sigma extrait des données Firestore des 12 derniers mois). Chaque simulation produit un cash-flow à 90 jours.\n\nLe percentile P10 (pessimiste), P50 (médiane), P90 (optimiste) sont affichés sous forme de cône de confiance. La visualisation est rendue via Recharts avec une zone de gradient entre P10 et P90.`,
          bullets: [
            '10 000 simulations exécutées en Web Worker (non-bloquant)',
            'Paramètres : taux de conversion, délai de paiement clients, variation des charges',
            'Outputs : cône P10-P50-P90, VaR (Value at Risk) à 5%, Expected Shortfall',
            'Recalcul automatique quand les données Firestore changent (listener onSnapshot)',
          ],
        },
        finality: {
          heading: 'Pourquoi c\'est stratégique',
          icon: 'Shield',
          content: `Les budgets déterministes mentent. Un prévisionnel unique masque l'incertitude inhérente aux affaires. Monte-Carlo expose la distribution réelle des outcomes : le CFO voit non pas "nous ferons 1M€" mais "nous avons 80% de chances de dépasser 850K€ et 20% de finir sous 700K€". C'est la différence entre une prévision et une décision éclairée.`,
        },
      },
      {
        id: 'finance-webauthn',
        title: 'WebAuthn biométrique pour opérations sensibles',
        logic: {
          heading: 'Comment ça fonctionne',
          icon: 'Fingerprint',
          content: `Les virements > 10 000€ et les clôtures comptables déclenchent un challenge WebAuthn. Le navigateur sollicite l'authentificateur local (Touch ID, Windows Hello, YubiKey). L'assertion cryptographique est envoyée au backend Firebase (Cloud Function verifyWebAuthn) qui valide la signature avant d'autoriser l'écriture dans accounting/.\n\nPas de token transmis sur le réseau — WebAuthn est phishing-proof par design.`,
          bullets: [
            'Déclenchement automatique pour : virements > seuil configurable, clôtures, suppressions',
            'Challenge unique par opération (nonce Firestore)',
            'Fallback PIN chiffré pour les environnements sans authenticator hardware',
            'Journal d\'audit immuable dans audit_logs/ pour chaque opération biométrique',
          ],
        },
        finality: {
          heading: 'Pourquoi c\'est stratégique',
          icon: 'Lock',
          content: `La fraude interne représente 5-7% du chiffre d'affaires dans les PME non protégées. WebAuthn transforme chaque opération financière en acte biométriquement attesté. Un dirigeant ne peut plus prétendre "je ne savais pas" — l'empreinte digitale ou le visage est le registre.`,
        },
      },
      {
        id: 'finance-doubleentry',
        title: 'Comptabilité automatique en partie double',
        logic: {
          heading: 'Comment ça fonctionne',
          icon: 'Scale',
          content: `Chaque facture payée déclenche le trigger syncAccountingOnInvoicePaid (Cloud Function). Ce trigger crée automatiquement deux écritures dans accounting/ : débit Clients (4100) et crédit Ventes (7000), avec le montant, la date, et la référence de facture.\n\nvalidateBalance() vérifie que Σ débits = Σ crédits avant chaque clôture — si l'équation n'est pas vérifiée, la clôture est bloquée avec le détail des comptes déséquilibrés.`,
          bullets: [
            'Plan comptable configurable (PCG français par défaut, OHADA en option)',
            'Génération automatique : factures, avoirs, OD de salaires, provisions',
            'Grand Livre temps réel : account → entries[] synchronisées via onSnapshot',
            'Export FEC (Fichier des Écritures Comptables) pour la DGFiP',
          ],
        },
        finality: {
          heading: 'Pourquoi c\'est stratégique',
          icon: 'Landmark',
          content: `Séparer la gestion commerciale de la comptabilité génère invariablement des écarts de réconciliation coûteux (2-4 jours/mois d'audit manuel). En faisant de la comptabilité une conséquence automatique des événements métier, Nexus OS élimine la ressaisie et produit une comptabilité toujours à jour — clôture en quelques heures plutôt que quelques semaines.`,
        },
      },
    ],

    faq: [
      {
        q: 'Comment configurer le seuil de déclenchement WebAuthn ?',
        a: 'Dans Administration → Paramètres Financiers, modifiez `security.webauthn_threshold`. La valeur est lue par FinanceControlCenter et appliquée à toutes les opérations de type "transfer" ou "close_period".',
      },
      {
        q: 'La simulation Monte-Carlo ne démarre pas. Que vérifier ?',
        a: 'Assurez-vous que le Web Worker est activé dans le build (vite.config.js → worker.format = "es"). Vérifiez aussi que les données historiques couvrent au moins 3 mois pour que les sigma soient significatifs.',
      },
      {
        q: 'Comment exporter le Grand Livre en format FEC ?',
        a: 'Finance → Grand Livre → Exporter → FEC. Le format est conforme à l\'article A47 A-1 du Code Général des Impôts. Les colonnes JournalCode, JournalLib, EcritureNum, EcritureDate, CompteNum sont générées automatiquement.',
      },
      {
        q: 'Une facture est payée mais l\'écriture comptable n\'apparaît pas ?',
        a: 'Vérifiez les logs Firebase Cloud Functions pour syncAccountingOnInvoicePaid. L\'écriture peut avoir échoué si le plan de comptes ne contient pas les comptes 4100/7000. Ajoutez-les dans MasterData → Plan Comptable.',
      },
      {
        q: 'Comment activer OHADA à la place du PCG français ?',
        a: 'Dans Administration → Paramètres Société, changez `accounting.standard` de "PCG" à "OHADA". Le plan de comptes sera rechargé depuis la collection masterdata/accounting_plans/OHADA.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // MODULE 3 : PRODUCTION
  // ─────────────────────────────────────────────────────────────
  {
    id: 'production',
    label: 'Production',
    icon: 'Factory',
    color: '#f59e0b',
    tagline: 'Digital Twin temps réel de vos lignes de fabrication',
    overview: `Le module Production transforme chaque atelier en jumeau numérique. Les ordres de fabrication (OF) déclenchent des cascades automatiques : mise à jour des stocks (trigger updateStockOnProductionComplete), calcul des coûts de revient, et alertes qualité en temps réel. La connexion IoT (MQTT → Firebase) permet de lire les capteurs d'atelier directement dans l'ERP.`,

    articles: [
      {
        id: 'production-digitaltwin',
        title: 'Digital Twin : le jumeau numérique de l\'atelier',
        logic: {
          heading: 'Comment ça fonctionne',
          icon: 'Cpu',
          content: `Chaque machine est représentée par un document Firestore dans machines/{machineId}. Les capteurs IoT publient via MQTT → Cloud Function → écriture Firestore toutes les 5 secondes. Le tableau de bord Production lit ces données via onSnapshot et affiche l'état machine (actif/arrêt/maintenance) avec un délai < 1 seconde.\n\nLes OF en cours sont liés à une machine via productionOrders/{ofId}.machineId. Quand l'OF passe à "terminé", updateStockOnProductionComplete incrémente inventory.stock_reel du produit fini et décrémente les matières premières consommées.`,
          bullets: [
            'Topologie atelier : zones → lignes → postes → machines (hiérarchie Firestore)',
            'OEE (Overall Equipment Effectiveness) calculé en temps réel : disponibilité × performance × qualité',
            'Alertes : température hors plage, cadence sous seuil, arrêt non planifié',
            'Historique : time-series dans subcollection machines/{id}/metrics (rétention 90 jours)',
          ],
        },
        finality: {
          heading: 'Pourquoi c\'est stratégique',
          icon: 'Zap',
          content: `Dans l'industrie, 20-30% des pertes de productivité proviennent de données collectées en retard (relevés papier, saisie manuelle). Le Digital Twin supprime ce délai : les décisions de réaffectation de ressources se prennent sur des données à 5 secondes, pas à 24 heures. L'OEE temps réel expose immédiatement les goulets d'étranglement.`,
        },
      },
      {
        id: 'production-quality',
        title: 'Contrôle qualité intégré',
        logic: {
          heading: 'Comment ça fonctionne',
          icon: 'CheckCircle',
          content: `Chaque OF contient un plan de contrôle qualité (QC Plan) défini dans les Gammes de fabrication. À chaque étape critique, l'opérateur saisit les mesures dans l'interface mobile (MobileCompanion). Si une mesure sort de la plage acceptable, une non-conformité est automatiquement créée dans quality/NC_{id}.\n\nLe déclencheur onQualityNonConformity alerte le Responsable Qualité et bloque l'OF si la sévérité est "critique".`,
          bullets: [
            'Plans de contrôle : dimensions, poids, résistance, aspect visuel',
            'Carte de contrôle SPC (Cp, Cpk) calculée sur les 30 dernières mesures',
            'Non-conformités → workflow : détection → analyse cause → action corrective → clôture',
            'Traçabilité complète : lot matière → OF → produit fini → client',
          ],
        },
        finality: {
          heading: 'Pourquoi c\'est stratégique',
          icon: 'Award',
          content: `Un défaut détecté en fin de chaîne coûte 10× plus cher qu'un défaut détecté à la source. En intégrant le contrôle qualité dans le flux de production (pas dans un système séparé), Nexus OS permet la détection à la source. La traçabilité lot-à-produit final est aussi la clé des certifications ISO 9001 et des audits clients.`,
        },
      },
    ],

    faq: [
      {
        q: 'Comment connecter une machine via MQTT ?',
        a: 'La machine publie sur le topic nexus/{businessId}/machines/{machineId}/metrics. La Cloud Function mqttBridge (déployée sur Cloud Run) reçoit, valide, et écrit dans Firestore. Voir la documentation d\'intégration dans IT Operations → Connecteurs.',
      },
      {
        q: 'L\'OEE affiché est à 0% alors que les machines tournent ?',
        a: 'Vérifiez que les machines ont un `plannedUptime` renseigné (heures d\'ouverture planifiées par jour). Sans cette valeur, le calcul de disponibilité retourne 0. Configurez-le dans Production → Gammes → Machines.',
      },
      {
        q: 'Le stock n\'est pas mis à jour après clôture d\'un OF ?',
        a: 'Vérifiez que l\'OF est bien passé au statut "COMPLETED" (pas "CLOSED" ou "DONE"). Le trigger updateStockOnProductionComplete écoute uniquement le changement vers "COMPLETED". Si le statut est différent, modifiez-le dans Production → Paramètres → Statuts OF.',
      },
      {
        q: 'Comment créer une gamme de fabrication avec des étapes de contrôle ?',
        a: 'Production → Gammes → Nouvelle Gamme → Ajouter Étape → Type "Contrôle Qualité". Définissez les caractéristiques mesurées, les limites (LSL/USL), et la fréquence de contrôle. La gamme est ensuite attachable aux produits finis.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // MODULE 4 : RH & COCKPIT
  // ─────────────────────────────────────────────────────────────
  {
    id: 'hr',
    label: 'RH & Cockpit',
    icon: 'Users',
    color: '#8b5cf6',
    tagline: 'Nexus Score : intelligence RH prédictive et pilotage humain',
    overview: `TalentHub est la plateforme RH complète de Nexus OS. Son innovation centrale est le Nexus Score — un indice composite mesurant l'engagement, la performance et l'alignement stratégique de chaque collaborateur. Le Cockpit RH offre une vue exécutive temps réel : turnover prédit, risques de départ, et opportunités de développement.`,

    articles: [
      {
        id: 'hr-nexusscore',
        title: 'Nexus Score : l\'indice RH composite',
        logic: {
          heading: 'Comment ça fonctionne',
          icon: 'BarChart2',
          content: `Le Nexus Score est calculé quotidiennement par la Cloud Function computeNexusScore pour chaque collaborateur. Il agrège 5 dimensions pondérées :\n\n1. Performance (30%) : atteinte des objectifs OKR\n2. Engagement (25%) : participation aux événements, utilisation de l'ERP, feedback 360°\n3. Compétences (20%) : certifications complétées, formations suivies\n4. Assiduité (15%) : ponctualité, absences justifiées vs injustifiées\n5. Alignement stratégique (10%) : contribution aux projets prioritaires de l\'entreprise\n\nLe score est normalisé entre 0 et 100 et stocké dans users/{uid}/hr_private/nexus_score.`,
          bullets: [
            'Recalcul : quotidien à 02h00 UTC via Cloud Scheduler',
            'Historique : time-series sur 24 mois pour identifier les tendances',
            'Alertes : score < 40 → alerte manager, score < 25 → escalade RH',
            'Prédiction de départ : ML model (Vertex AI) entraîné sur 18 mois de données',
          ],
        },
        finality: {
          heading: 'Pourquoi c\'est stratégique',
          icon: 'Heart',
          content: `Le turnover volontaire coûte en moyenne 1 à 2 salaires annuels par départ (recrutement + formation + perte de productivité). Prédire un départ 60-90 jours à l'avance donne au management une fenêtre d'action réelle. Le Nexus Score transforme la RH réactive ("l'employé est parti") en RH prédictive ("l'employé est à risque, agissons").`,
        },
      },
      {
        id: 'hr-onboarding',
        title: 'Onboarding automatisé',
        logic: {
          heading: 'Comment ça fonctionne',
          icon: 'UserPlus',
          content: `Le wizard OnboardingTab crée un nouvel employé en 4 étapes : identité → contrat → accès système → équipements. À la soumission, la Cloud Function provisionUser est appelée. Elle crée : un compte Firebase Auth, un document Firestore users/{uid} avec le profil complet, des custom claims (role, allowedModules), et une notification Slack dans #rh-onboarding.\n\nL'accès aux modules Nexus OS est accordé immédiatement via les claims Firebase — pas de délai, pas de ticket IT séparé.`,
          bullets: [
            'Création simultanée : Auth + Firestore + claims en transaction atomique',
            'Email de bienvenue automatique avec lien de changement de mot de passe',
            'Checklist onboarding : accès ERP, remise matériel, formations obligatoires',
            'Intégration Payroll : le profil salarial est pré-rempli dans PayrollHub',
          ],
        },
        finality: {
          heading: 'Pourquoi c\'est stratégique',
          icon: 'Rocket',
          content: `Un onboarding défaillant augmente de 50% le risque de départ dans les 6 premiers mois. En automatisant la création des accès, l'envoi des documents et la checklist d'intégration, Nexus OS garantit que chaque nouvel arrivant est opérationnel dès le jour 1 — sans dépendre de la mémoire du manager ou du service IT.`,
        },
      },
      {
        id: 'hr-cockpit',
        title: 'Cockpit Dirigeant : vue exécutive RH',
        logic: {
          heading: 'Comment ça fonctionne',
          icon: 'Gauge',
          content: `Le Cockpit agrège les KPIs RH critiques en temps réel depuis Firestore : effectif total, turnover (30/90/365 jours glissants), masse salariale, coût moyen par embauche, taux d'absentéisme, satisfaction (NPS interne).\n\nLa "Heat Map des risques" colore chaque département en fonction du Nexus Score moyen de ses membres. Rouge = département à risque, vert = stable.`,
          bullets: [
            'KPIs actualisés en temps réel via onSnapshot sur hr_analytics/',
            'Comparatif N vs N-1 pour chaque indicateur',
            'Export PowerPoint automatique pour le CODIR mensuel',
            'Drill-down : cliquer sur un département → liste des collaborateurs et leur score',
          ],
        },
        finality: {
          heading: 'Pourquoi c\'est stratégique',
          icon: 'Eye',
          content: `Un DRH sans données temps réel pilote à l'aveugle. Le Cockpit transforme la réunion mensuelle de direction en décision basée sur des faits. Quand le Nexus Score du département Commercial chute de 10 points en 3 semaines, le signal est visible avant que le premier commercial ne pose sa démission.`,
        },
      },
    ],

    faq: [
      {
        q: 'Pourquoi le Nexus Score d\'un collaborateur ne se met pas à jour ?',
        a: 'Vérifiez que la Cloud Function computeNexusScore tourne correctement (Logs Firebase → Functions). Le recalcul quotidien peut échouer si les données OKR sont manquantes. Assurez-vous que l\'employé a des objectifs définis dans Missions (board RH de son workspace).',
      },
      {
        q: 'Un nouvel employé créé dans OnboardingTab ne peut pas se connecter ?',
        a: 'La Cloud Function provisionUser doit avoir terminé son exécution. Vérifiez les logs (généralement < 3 secondes). Si le compte Auth existe mais que les claims sont absents, appelez manuellement la fonction updateUserPermissions avec l\'uid depuis l\'Admin Panel.',
      },
      {
        q: 'Comment configurer les poids du Nexus Score ?',
        a: 'Administration → Paramètres RH → Nexus Score → Pondérations. Les 5 dimensions (Performance, Engagement, Compétences, Assiduité, Alignement) sont ajustables. La somme doit être égale à 100%. Le recalcul du lendemain appliquera les nouveaux poids.',
      },
      {
        q: 'La sous-collection hr_private est-elle accessible aux managers ?',
        a: 'Non. Les règles Firestore (firestore.rules:78) n\'autorisent que l\'accès au RH, à l\'ADMIN, et à l\'employé lui-même. Le manager voit uniquement le Nexus Score agrégé de son équipe via hr_analytics/ — jamais les données individuelles brutes.',
      },
      {
        q: 'Comment générer le bilan social annuel ?',
        a: 'RH → Rapports → Bilan Social → Période → Générer. Le document est produit en PDF et Excel depuis les données Firestore. Il inclut les indicateurs obligatoires (article L2312-28 du Code du Travail pour les entreprises > 300 salariés).',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // MODULE 5 : IPC COLLECT (FOUNDATION)
  // ─────────────────────────────────────────────────────────────
  {
    id: 'foundation',
    label: 'IPC Collect Foundation',
    icon: 'Database',
    color: '#06b6d4',
    tagline: 'La couche fondationnelle de collecte et de gouvernance des données',
    overview: `IPC Collect Foundation est la colonne vertébrale invisible de Nexus OS. Elle définit la gouvernance des données : qui crée quoi, comment les données transitent entre modules, comment elles sont validées et auditées. Sans Foundation, chaque module serait une île — avec Foundation, ils forment un écosystème cohérent.`,

    articles: [
      {
        id: 'foundation-registry',
        title: 'Registry Pattern : le système de modules',
        logic: {
          heading: 'Comment ça fonctionne',
          icon: 'Grid',
          content: `registry_init.jsx centralise tous les modules via registry.register(). Chaque entrée définit : id unique, label, icon, catégorie, rôles autorisés, et composant React.lazy(). Au démarrage, le router lit le registry et génère dynamiquement les routes et la navigation.\n\nLes modules non autorisés (rôle insuffisant) sont invisibles dans la sidenav — ils ne sont pas cachés CSS mais absents du DOM. Le composant n'est pas chargé du tout (React.lazy ne se déclenche pas).`,
          bullets: [
            'Catégories : cockpit, operations, finance, hr, admin',
            'Rôles : SUPER_ADMIN, ADMIN, MANAGER, HR, FINANCE, SALES, PRODUCTION, STAFF',
            'Priority : ordre d\'affichage dans la sidenav (plus petit = plus haut)',
            'Schema : schéma Zod optionnel pour les formulaires DetailOverlay',
          ],
        },
        finality: {
          heading: 'Pourquoi c\'est stratégique',
          icon: 'Shield',
          content: `Un ERP sans gouvernance de modules est un risque de sécurité. Le Registry Pattern garantit que l'accès à un module est une décision architecturale (au niveau du code et des claims Firebase), pas une décision UI (cacher un bouton). Un attaquant ne peut pas accéder à un module en modifiant le DOM — la route n'existe pas.`,
        },
      },
      {
        id: 'foundation-audit',
        title: 'Audit trail immuable',
        logic: {
          heading: 'Comment ça fonctionne',
          icon: 'FileText',
          content: `Chaque action sensible (création, modification, suppression d'un document Firestore métier) déclenche le trigger globalAuditTrigger (Cloud Function). Il écrit dans audit_logs/{logId} : l'uid de l'auteur, le timestamp, la collection, le document, les champs modifiés (before/after), l'IP (si disponible via AppCheck).\n\nLes règles Firestore interdisent toute écriture directe dans audit_logs/ — seules les Cloud Functions peuvent y écrire. L'audit est inaltérable depuis le client.`,
          bullets: [
            'Couverture : users/, finance_invoices/, hr/, productionOrders/, accounting/',
            'Rétention : 7 ans (conformité légale française)',
            'Recherche : audit_logs filtrable par uid, collection, date, type d\'action',
            'Export : CSV pour les auditeurs externes',
          ],
        },
        finality: {
          heading: 'Pourquoi c\'est stratégique',
          icon: 'Scale',
          content: `En cas de litige, fraude, ou audit fiscal, l'absence de traçabilité est la pire position. L'audit trail immuable de Nexus OS constitue une preuve juridique : qui a fait quoi, quand, et depuis quel compte. C'est aussi l'outil de détection des anomalies internes (un employé modifie des factures à 23h un dimanche → alerte automatique).`,
        },
      },
      {
        id: 'foundation-realtime',
        title: 'Architecture temps réel : Firestore + Zustand',
        logic: {
          heading: 'Comment ça fonctionne',
          icon: 'Wifi',
          content: `Nexus OS utilise une architecture "Push First" : les données ne sont jamais fetchées manuellement. FirestoreService.subscribeToCollection() établit des listeners onSnapshot qui pushent les mises à jour directement dans le store Zustand.\n\nLe store est découpé en slices par domaine (createAdminSlice, createMissionsSlice, etc.) et composé dans le store global. Chaque composant souscrit uniquement aux données dont il a besoin via des sélecteurs précis — jamais à l'objet store entier.`,
          bullets: [
            'latence d\'affichage < 200ms après un changement Firestore (réseau normal)',
            'Reconnexion automatique : Firebase SDK gère les reconnexions transparentes',
            'Cache offline : Firestore persistence activée → l\'ERP fonctionne sans réseau (lecture)',
            'Optimistic updates : l\'UI reflète les changements avant la confirmation Firestore',
          ],
        },
        finality: {
          heading: 'Pourquoi c\'est stratégique',
          icon: 'Globe',
          content: `Dans une PME avec 20 utilisateurs simultanés, les données changent constamment. Une architecture "Pull" (requêtes manuelles) génère des désynchronisations et des conflits. L'architecture Push de Nexus OS garantit que tous les utilisateurs voient la même réalité en < 200ms — un commercial voit immédiatement qu'un collègue vient de marquer un prospect comme "gagné".`,
        },
      },
    ],

    faq: [
      {
        q: 'Comment enregistrer un nouveau module dans le système ?',
        a: 'Dans registry_init.jsx : 1) Créez le composant avec `const MonModule = lazy(() => import(\'./modules/mon-module/MonModule\'))`. 2) Appelez `registry.register({ id: \'mon_module\', label: \'Mon Module\', icon: <Icon />, category: \'operations\', roles: [...], component: MonModule })`. 3) npm run build + firebase deploy --only hosting.',
      },
      {
        q: 'Les données Firestore ne se mettent pas à jour en temps réel ?',
        a: 'Vérifiez que subscribeToCollection est appelé avec le bon chemin de collection. Si le listener est désabonné (unsubscribeAll), les mises à jour s\'arrêtent. Inspectez le store Zustand dans DevTools → onglet "Zustand" pour voir l\'état des listeners actifs.',
      },
      {
        q: 'Comment chercher dans les logs d\'audit ?',
        a: 'Administration → Audit → Rechercher. Filtres disponibles : utilisateur, collection, date de début/fin, type d\'action (create/update/delete). Pour les exports massifs, utilisez l\'API Firebase Admin depuis un environnement serveur (les quotas Firestore s\'appliquent côté client).',
      },
      {
        q: 'Peut-on désactiver l\'audit trail pour une collection ?',
        a: 'Non. Le globalAuditTrigger est un onWrite Firebase universel. Il peut être configuré pour ignorer certaines collections via son whitelist/blacklist dans functions/modules/triggers.js, mais cette modification nécessite un redéploiement des functions et une décision architecturale documentée.',
      },
      {
        q: 'Comment fonctionne le mode hors-ligne ?',
        a: 'Firestore persistence est activée (enableMultiTabIndexedDbPersistence). En mode hors-ligne, les lectures servent le cache IndexedDB local. Les écritures sont mises en queue et synchronisées à la reconnexion. Les modules Missions, CRM et Finance fonctionnent en lecture hors-ligne. Les modules nécessitant des Cloud Functions (Paie, WebAuthn) nécessitent une connexion.',
      },
    ],
  },
];

/**
 * Recherche sémantique dans toute la base de connaissance
 * @param {string} query
 * @returns {{ moduleId, articleId, type, title, excerpt, score }[]}
 */
export function searchGuide(query) {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();
  const results = [];

  for (const mod of NEXUS_GUIDE_DATA) {
    // Recherche dans les articles
    for (const article of mod.articles) {
      let score = 0;
      const titleMatch = article.title.toLowerCase().includes(q);
      const logicMatch = article.logic.content.toLowerCase().includes(q);
      const finalityMatch = article.finality.content.toLowerCase().includes(q);
      const bulletMatch = article.logic.bullets?.some(b => b.toLowerCase().includes(q));

      if (titleMatch) score += 10;
      if (logicMatch) score += 5;
      if (finalityMatch) score += 5;
      if (bulletMatch) score += 3;

      if (score > 0) {
        results.push({
          moduleId: mod.id,
          moduleLabel: mod.label,
          articleId: article.id,
          type: 'article',
          title: article.title,
          excerpt: titleMatch
            ? article.logic.content.slice(0, 120) + '…'
            : (logicMatch ? article.logic.content.slice(0, 120) + '…' : article.finality.content.slice(0, 120) + '…'),
          score,
          color: mod.color,
        });
      }
    }

    // Recherche dans les FAQ
    for (const item of mod.faq) {
      let score = 0;
      if (item.q.toLowerCase().includes(q)) score += 8;
      if (item.a.toLowerCase().includes(q)) score += 4;
      if (score > 0) {
        results.push({
          moduleId: mod.id,
          moduleLabel: mod.label,
          articleId: null,
          type: 'faq',
          title: item.q,
          excerpt: item.a.slice(0, 120) + '…',
          score,
          color: mod.color,
        });
      }
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 12);
}
