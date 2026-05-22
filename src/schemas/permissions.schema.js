/**
 * ══════════════════════════════════════════════════════════════════════════════
 * NEXUS OS — ENTERPRISE RBAC SCHEMA
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Source de vérité pour :
 *   - Tous les modules & sous-modules
 *   - Les 9 types d'actions granulaires
 *   - Les permissions par défaut par rôle
 *   - Les helpers de vérification
 *
 * RULE: Toute vérification d'accès doit passer par hasAction() ou getModuleAccess().
 *       Les Custom Claims Firebase restent la source d'autorité ultime (entity_id, role).
 */

// ─────────────────────────────────────────────────────────────────────────────
// ACTIONS — 9 niveaux de granularité
// ─────────────────────────────────────────────────────────────────────────────
export const ACTIONS = {
  VIEW:       'view',       // Consulter les données
  CREATE:     'create',     // Créer de nouveaux enregistrements
  EDIT:       'edit',       // Modifier les enregistrements existants
  DELETE:     'delete',     // Supprimer des enregistrements
  EXPORT:     'export',     // Exporter les données (CSV, PDF, Excel)
  VALIDATE:   'validate',   // Valider des flux / documents
  APPROVE:    'approve',    // Approuver des demandes
  SUPERVISE:  'supervise',  // Voir les données de l'équipe / subalterne
  ADMIN:      'admin',      // Configurer le module (paramètres)
};

export const ALL_ACTIONS = Object.values(ACTIONS);

/** Actions incluses dans un preset */
export const ACTION_PRESETS = {
  none:     [],
  view:     [ACTIONS.VIEW],
  standard: [ACTIONS.VIEW, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.EXPORT],
  full:     ALL_ACTIONS,
};

// ─────────────────────────────────────────────────────────────────────────────
// MODULES REGISTRY — 35 modules + sous-modules
// ─────────────────────────────────────────────────────────────────────────────
export const MODULES_REGISTRY = [
  // ── COCKPIT ─────────────────────────────────────────────────────────────
  {
    id: 'holding', label: 'Cockpit Groupe', category: 'Cockpit',
    entityTypes: ['HOLDING'],
    submodules: [
      { id: 'kpis',        label: 'KPIs Consolidés' },
      { id: 'alerts',      label: 'Alertes Groupe' },
      { id: 'governance',  label: 'Gouvernance' },
      { id: 'interco',     label: 'Intercompany' },
    ],
  },
  {
    id: 'subsidiary', label: 'Cockpit Filiale', category: 'Cockpit',
    entityTypes: ['SUBSIDIARY'],
    submodules: [
      { id: 'dashboard',   label: 'Tableau de bord' },
      { id: 'kpis',        label: 'KPIs Filiale' },
      { id: 'alerts',      label: 'Alertes Locales' },
    ],
  },
  {
    id: 'foundation', label: 'Cockpit Fondation', category: 'Cockpit',
    entityTypes: ['FOUNDATION'],
    submodules: [
      { id: 'programs',    label: 'Programmes' },
      { id: 'donations',   label: 'Dons & Collectes' },
      { id: 'impact',      label: 'Indicateurs Impact' },
    ],
  },
  {
    id: 'missions', label: 'Missions', category: 'Cockpit',
    submodules: [
      { id: 'board',       label: 'Tableau Kanban' },
      { id: 'calendar',    label: 'Calendrier Missions' },
      { id: 'reports',     label: 'Rapports Missions' },
    ],
  },
  {
    id: 'connect', label: 'Connect Plus', category: 'Cockpit',
    submodules: [
      { id: 'messages',    label: 'Messagerie' },
      { id: 'rooms',       label: 'Salles Virtuelles' },
      { id: 'directory',   label: 'Annuaire' },
      { id: 'feed',        label: 'Mur Social' },
    ],
  },
  {
    id: 'academy', label: 'Nexus Academy', category: 'Cockpit',
    submodules: [
      { id: 'guides',      label: 'Guides Utilisateurs' },
      { id: 'search',      label: 'Recherche' },
    ],
  },

  // ── CRM & COMMERCIAL ────────────────────────────────────────────────────
  {
    id: 'crm', label: 'CRM & Ventes', category: 'CRM & Commercial',
    submodules: [
      { id: 'contacts',    label: 'Contacts & Comptes' },
      { id: 'leads',       label: 'Leads & Pipeline' },
      { id: 'deals',       label: 'Opportunités' },
      { id: 'activities',  label: 'Activités Commerciales' },
    ],
  },
  {
    id: 'sales', label: 'Ventes & Devis', category: 'CRM & Commercial',
    submodules: [
      { id: 'quotes',      label: 'Devis' },
      { id: 'orders',      label: 'Commandes' },
      { id: 'invoices',    label: 'Factures Vente' },
      { id: 'catalog',     label: 'Catalogue Produits' },
    ],
  },
  {
    id: 'marketing', label: 'Marketing Digital', category: 'CRM & Commercial',
    submodules: [
      { id: 'campaigns',   label: 'Campagnes' },
      { id: 'emails',      label: 'Emailing' },
      { id: 'analytics',   label: 'Analytics Marketing' },
    ],
  },

  // ── OPÉRATIONS ──────────────────────────────────────────────────────────
  {
    id: 'inventory', label: 'Stocks & Logistique', category: 'Opérations',
    submodules: [
      { id: 'products',    label: 'Produits & Articles' },
      { id: 'warehouses',  label: 'Entrepôts' },
      { id: 'movements',   label: 'Mouvements de Stock' },
      { id: 'suppliers',   label: 'Fournisseurs' },
    ],
  },
  {
    id: 'shipping', label: 'Expéditions', category: 'Opérations',
    submodules: [
      { id: 'orders',      label: 'Bons de Livraison' },
      { id: 'tracking',    label: 'Suivi Colis' },
      { id: 'carriers',    label: 'Transporteurs' },
    ],
  },
  {
    id: 'production', label: 'Production & Usine', category: 'Opérations',
    submodules: [
      { id: 'orders',      label: 'Ordres de Fabrication' },
      { id: 'planning',    label: 'Planning Atelier' },
      { id: 'bom',         label: 'Nomenclatures' },
      { id: 'quality',     label: 'Contrôle Qualité' },
    ],
  },
  {
    id: 'quality', label: 'Qualité & HSE', category: 'Opérations',
    submodules: [
      { id: 'controls',    label: 'Contrôles Qualité' },
      { id: 'incidents',   label: 'Incidents HSE' },
      { id: 'audits',      label: 'Audits Internes' },
      { id: 'standards',   label: 'Normes & Référentiels' },
    ],
  },
  {
    id: 'projects', label: 'Projets', category: 'Opérations',
    submodules: [
      { id: 'overview',    label: 'Vue Projets' },
      { id: 'tasks',       label: 'Tâches' },
      { id: 'gantt',       label: 'Gantt & Planning' },
      { id: 'resources',   label: 'Ressources' },
      { id: 'budget',      label: 'Budget Projet' },
    ],
  },
  {
    id: 'fleet', label: 'Flotte', category: 'Opérations',
    submodules: [
      { id: 'vehicles',    label: 'Véhicules' },
      { id: 'maintenance', label: 'Maintenance' },
      { id: 'tracking',    label: 'GPS & Traçabilité' },
      { id: 'fuel',        label: 'Carburant' },
    ],
  },

  // ── FINANCE & STRATÉGIE ─────────────────────────────────────────────────
  {
    id: 'finance', label: 'Finance & Stratégie', category: 'Finance',
    submodules: [
      { id: 'dashboard',   label: 'Tableau de Bord Finance' },
      { id: 'cashflow',    label: 'Trésorerie' },
      { id: 'budgets',     label: 'Budgets' },
      { id: 'forecasts',   label: 'Prévisions' },
    ],
  },
  {
    id: 'accounting', label: 'Comptabilité', category: 'Finance',
    submodules: [
      { id: 'journal',     label: 'Journal Comptable' },
      { id: 'invoices',    label: 'Factures' },
      { id: 'payments',    label: 'Règlements' },
      { id: 'bank',        label: 'Rapprochement Bancaire' },
      { id: 'tva',         label: 'Déclarations TVA' },
    ],
  },
  {
    id: 'expenses', label: 'Notes de Frais', category: 'Finance',
    submodules: [
      { id: 'submit',      label: 'Soumettre une Dépense' },
      { id: 'validate',    label: 'Validation (Manager)' },
      { id: 'reimburse',   label: 'Remboursements' },
      { id: 'reports',     label: 'Rapports Frais' },
    ],
  },
  {
    id: 'legal', label: 'Juridique', category: 'Finance',
    submodules: [
      { id: 'contracts',   label: 'Contrats' },
      { id: 'deadlines',   label: 'Échéances' },
      { id: 'templates',   label: 'Modèles Juridiques' },
    ],
  },
  {
    id: 'bi', label: 'Business Intelligence', category: 'Finance',
    submodules: [
      { id: 'dashboards',  label: 'Tableaux de Bord' },
      { id: 'reports',     label: 'Rapports' },
      { id: 'alerts',      label: 'Alertes KPI' },
    ],
  },
  {
    id: 'analytics', label: 'Analyses Avancées', category: 'Finance',
    submodules: [
      { id: 'explorer',    label: 'Explorateur de Données' },
      { id: 'custom',      label: 'Rapports Personnalisés' },
      { id: 'exports',     label: 'Exports Programmés' },
    ],
  },
  {
    id: 'audit_hub', label: 'Audit & Conformité', category: 'Finance',
    submodules: [
      { id: 'logs',        label: 'Journal d\'Audit' },
      { id: 'compliance',  label: 'Conformité Réglementaire' },
      { id: 'risks',       label: 'Risques' },
    ],
  },

  // ── RH & COLLABORATION ──────────────────────────────────────────────────
  {
    id: 'hr', label: 'Ressources Humaines', category: 'RH & Collaboration',
    submodules: [
      { id: 'employees',   label: 'Employés' },
      { id: 'onboarding',  label: 'Onboarding' },
      { id: 'contracts',   label: 'Contrats RH' },
      { id: 'leaves',      label: 'Congés & Absences' },
      { id: 'timesheets',  label: 'Pointage & Temps' },
      { id: 'permissions', label: 'Droits & Accès (Gestion)' },
    ],
  },
  {
    id: 'talent', label: 'People & Culture', category: 'RH & Collaboration',
    submodules: [
      { id: 'recruitment', label: 'Recrutement' },
      { id: 'performance', label: 'Évaluations Performance' },
      { id: 'training',    label: 'Formations' },
      { id: 'succession',  label: 'Plans de Succession' },
    ],
  },
  {
    id: 'payroll', label: 'Paie & Social', category: 'RH & Collaboration',
    submodules: [
      { id: 'elements',    label: 'Éléments Variables' },
      { id: 'bulletins',   label: 'Bulletins de Paie' },
      { id: 'dsn',         label: 'DSN & Déclarations' },
      { id: 'reports',     label: 'Rapports Paie' },
    ],
  },
  {
    id: 'planning', label: 'Planning & Événements', category: 'RH & Collaboration',
    submodules: [
      { id: 'calendar',    label: 'Calendrier' },
      { id: 'team',        label: 'Planning Équipe' },
      { id: 'events',      label: 'Événements' },
      { id: 'rooms',       label: 'Salles & Ressources' },
    ],
  },
  {
    id: 'helpdesk', label: 'Support & Helpdesk', category: 'RH & Collaboration',
    submodules: [
      { id: 'tickets',     label: 'Tickets' },
      { id: 'categories',  label: 'Catégories' },
      { id: 'stats',       label: 'Statistiques Support' },
    ],
  },

  // ── DOCUMENTS & SERVICES ────────────────────────────────────────────────
  {
    id: 'dms', label: 'Documents Cloud', category: 'Documents & Services',
    submodules: [
      { id: 'files',       label: 'Fichiers & Dossiers' },
      { id: 'sharing',     label: 'Partages' },
      { id: 'archive',     label: 'Archives' },
    ],
  },
  {
    id: 'signature', label: 'Signature Électronique', category: 'Documents & Services',
    submodules: [
      { id: 'requests',    label: 'Demandes de Signature' },
      { id: 'templates',   label: 'Modèles de Documents' },
      { id: 'archive',     label: 'Archives Signées' },
    ],
  },
  {
    id: 'office_admin', label: 'Services Généraux', category: 'Documents & Services',
    submodules: [
      { id: 'requests',    label: 'Demandes de Service' },
      { id: 'rooms',       label: 'Réservation Salles' },
      { id: 'inventory',   label: 'Inventaire Matériel' },
    ],
  },

  // ── ADMINISTRATION & IT ─────────────────────────────────────────────────
  {
    id: 'control_hub', label: 'Administration', category: 'Administration & IT',
    submodules: [
      { id: 'users',       label: 'Utilisateurs & Rôles' },
      { id: 'entities',    label: 'Entités' },
      { id: 'modules',     label: 'Modules & Licences' },
      { id: 'settings',    label: 'Paramètres Globaux' },
      { id: 'audit',       label: 'Journal d\'Administration' },
    ],
  },
  {
    id: 'it', label: 'IT Operations', category: 'Administration & IT',
    submodules: [
      { id: 'assets',      label: 'Parc Informatique' },
      { id: 'incidents',   label: 'Incidents IT' },
      { id: 'security',    label: 'Sécurité & Accès' },
      { id: 'licenses',    label: 'Licences Logicielles' },
    ],
  },
  {
    id: 'mobile', label: 'Application Mobile', category: 'Administration & IT',
    submodules: [
      { id: 'config',      label: 'Configuration Mobile' },
      { id: 'users',       label: 'Utilisateurs Mobile' },
    ],
  },
];

/** Toutes les catégories dans l'ordre d'affichage */
export const MODULE_CATEGORIES = [
  'Cockpit',
  'CRM & Commercial',
  'Opérations',
  'Finance',
  'RH & Collaboration',
  'Documents & Services',
  'Administration & IT',
];

/** Map id → module pour accès O(1) */
export const MODULES_MAP = Object.fromEntries(MODULES_REGISTRY.map(m => [m.id, m]));

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSIONS PAR DÉFAUT PAR RÔLE
// ─────────────────────────────────────────────────────────────────────────────

/** Construit un objet permissions complet pour un ensemble de modules + actions */
function makePerms(moduleMap) {
  const modules = {};
  for (const [moduleId, actions] of Object.entries(moduleMap)) {
    if (moduleId === '__all__') {
      // Appliquer à tous les modules
      for (const mod of MODULES_REGISTRY) {
        modules[mod.id] = {
          enabled: actions.length > 0,
          actions: Object.fromEntries(ALL_ACTIONS.map(a => [a, actions.includes(a)])),
          submodules: Object.fromEntries(
            (mod.submodules || []).map(s => [
              s.id,
              { enabled: actions.length > 0, actions: Object.fromEntries(ALL_ACTIONS.map(a => [a, actions.includes(a)])) },
            ])
          ),
        };
      }
    } else {
      const mod = MODULES_MAP[moduleId];
      modules[moduleId] = {
        enabled: actions.length > 0,
        actions: Object.fromEntries(ALL_ACTIONS.map(a => [a, actions.includes(a)])),
        submodules: Object.fromEntries(
          (mod?.submodules || []).map(s => [
            s.id,
            { enabled: actions.length > 0, actions: Object.fromEntries(ALL_ACTIONS.map(a => [a, actions.includes(a)])) },
          ])
        ),
      };
    }
  }
  return { hierarchy_level: 'Employee', modules };
}

const FULL = ALL_ACTIONS;
const READ_ONLY = [ACTIONS.VIEW, ACTIONS.EXPORT];
const STANDARD = [ACTIONS.VIEW, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.EXPORT];
const MANAGER_ACTIONS = [ACTIONS.VIEW, ACTIONS.CREATE, ACTIONS.EDIT, ACTIONS.DELETE, ACTIONS.EXPORT, ACTIONS.VALIDATE, ACTIONS.SUPERVISE];

export const ROLE_DEFAULT_PERMISSIONS = {
  // ── Super Admin — accès absolu ──────────────────────────────────────────
  SUPER_ADMIN: makePerms({ __all__: FULL }),

  // ── Holding — supervision groupe ────────────────────────────────────────
  HOLDING_CEO:     makePerms({ __all__: FULL }),
  HOLDING_CFO:     makePerms({
    __all__: READ_ONLY,
    finance: FULL, accounting: FULL, bi: FULL, analytics: FULL,
    audit_hub: MANAGER_ACTIONS, legal: MANAGER_ACTIONS,
    control_hub: [ACTIONS.VIEW, ACTIONS.SUPERVISE],
  }),
  HOLDING_CSO:     makePerms({
    __all__: READ_ONLY,
    crm: MANAGER_ACTIONS, sales: MANAGER_ACTIONS, marketing: MANAGER_ACTIONS,
    bi: FULL, analytics: FULL, projects: MANAGER_ACTIONS,
  }),
  HOLDING_CHRO:    makePerms({
    __all__: READ_ONLY,
    hr: FULL, talent: FULL, payroll: FULL, planning: MANAGER_ACTIONS,
    helpdesk: MANAGER_ACTIONS, dms: MANAGER_ACTIONS,
  }),
  HOLDING_CTO:     makePerms({
    __all__: READ_ONLY,
    control_hub: FULL, it: FULL, mobile: FULL,
    audit_hub: MANAGER_ACTIONS, dms: MANAGER_ACTIONS,
  }),
  HOLDING_AUDITOR: makePerms({ __all__: READ_ONLY }),
  HOLDING_LEGAL:   makePerms({
    legal: FULL, signature: FULL, dms: FULL,
    finance: READ_ONLY, audit_hub: READ_ONLY,
  }),
  GROUP_AUDITOR:   makePerms({ __all__: READ_ONLY }),

  // ── Admin & Manager génériques ──────────────────────────────────────────
  ADMIN:     makePerms({ __all__: FULL }),
  MANAGER:   makePerms({ __all__: MANAGER_ACTIONS }),
  DIRECTOR:  makePerms({ __all__: FULL }),

  // ── Filiale — rôles opérationnels ────────────────────────────────────────
  SUBSIDIARY_DG:       makePerms({ __all__: FULL }),
  SUBSIDIARY_CFO:      makePerms({
    __all__: [ACTIONS.VIEW],
    finance: FULL, accounting: FULL, expenses: FULL,
    bi: MANAGER_ACTIONS, analytics: MANAGER_ACTIONS, legal: MANAGER_ACTIONS,
  }),
  SUBSIDIARY_RH:       makePerms({
    hr: FULL, talent: FULL, payroll: FULL, planning: MANAGER_ACTIONS,
    helpdesk: MANAGER_ACTIONS, dms: STANDARD,
    expenses: [ACTIONS.VIEW, ACTIONS.APPROVE],
  }),
  SUBSIDIARY_MANAGER:  makePerms({ __all__: MANAGER_ACTIONS }),
  SUBSIDIARY_STAFF:    makePerms({
    missions: STANDARD, connect: STANDARD, academy: READ_ONLY,
    helpdesk: STANDARD, dms: [ACTIONS.VIEW, ACTIONS.CREATE], expenses: STANDARD,
    planning: [ACTIONS.VIEW, ACTIONS.CREATE],
  }),

  // ── Fondation ────────────────────────────────────────────────────────────
  FOUNDATION_DG:       makePerms({ __all__: FULL }),
  FOUNDATION_MANAGER:  makePerms({ __all__: MANAGER_ACTIONS }),
  FOUNDATION_STAFF:    makePerms({
    missions: STANDARD, connect: STANDARD, projects: STANDARD,
    helpdesk: STANDARD, dms: [ACTIONS.VIEW, ACTIONS.CREATE],
    planning: [ACTIONS.VIEW, ACTIONS.CREATE],
  }),
  FOUNDATION_AUDITOR:  makePerms({ __all__: READ_ONLY }),

  // ── Country-scoped roles (v3.0) ─────────────────────────────────────────
  COUNTRY_DIRECTOR_SUBSIDIARY: makePerms({ __all__: FULL }),
  COUNTRY_DIRECTOR_FOUNDATION: makePerms({ __all__: FULL }),
  COUNTRY_HR: makePerms({
    hr: FULL, talent: FULL, payroll: FULL,
    planning: MANAGER_ACTIONS, dms: STANDARD, connect: STANDARD,
    helpdesk: MANAGER_ACTIONS,
  }),
  COUNTRY_FINANCE: makePerms({
    finance: FULL, accounting: FULL, expenses: FULL,
    bi: MANAGER_ACTIONS, analytics: READ_ONLY, legal: READ_ONLY,
  }),
  COUNTRY_OPERATIONS: makePerms({
    production: FULL, inventory: FULL, fleet: FULL,
    shipping: FULL, quality: FULL, projects: MANAGER_ACTIONS,
    planning: MANAGER_ACTIONS,
  }),
  COUNTRY_AUDITOR: makePerms({ __all__: READ_ONLY }),

  // ── Rôles fonctionnels ──────────────────────────────────────────────────
  HR_MANAGER:  makePerms({ hr: FULL, talent: FULL, payroll: FULL, dms: STANDARD, signature: STANDARD }),
  HR:          makePerms({ hr: STANDARD, talent: READ_ONLY, payroll: READ_ONLY }),
  FINANCE:     makePerms({ finance: FULL, accounting: FULL, expenses: FULL, bi: READ_ONLY }),
  SALES:       makePerms({ crm: FULL, sales: FULL, marketing: STANDARD }),
  CRM:         makePerms({ crm: FULL, sales: READ_ONLY }),
  PRODUCTION:  makePerms({ production: FULL, inventory: MANAGER_ACTIONS, quality: MANAGER_ACTIONS, planning: READ_ONLY }),
  LOGISTICS:   makePerms({ inventory: FULL, shipping: FULL, fleet: MANAGER_ACTIONS, projects: READ_ONLY }),
  LEGAL:       makePerms({ legal: FULL, signature: FULL, dms: FULL }),
  AUDIT:       makePerms({ __all__: READ_ONLY }),
  STAFF:       makePerms({ connect: STANDARD, dms: [ACTIONS.VIEW], missions: STANDARD, academy: READ_ONLY, helpdesk: STANDARD }),
  // [ROLE SIMPLIFICATION 2026-05-22] GUEST removed from public role surface — only ADMIN & EMPLOYEE remain.
  // EMPLOYEE = base authenticated user (Connect, DMS read, Missions, Helpdesk, Academy read).
  EMPLOYEE:    makePerms({ connect: STANDARD, dms: [ACTIONS.VIEW], missions: STANDARD, academy: READ_ONLY, helpdesk: STANDARD }),
  // GUEST kept as alias for backward compat with legacy users — maps to EMPLOYEE permissions.
  GUEST:       makePerms({ connect: STANDARD, dms: [ACTIONS.VIEW], missions: STANDARD, academy: READ_ONLY, helpdesk: STANDARD }),
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS RBAC
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Vérifie si un utilisateur a une action précise sur un module.
 * @param {object} userPermissions  — permissions Firestore de l'utilisateur
 * @param {string} moduleId
 * @param {string} action           — ACTIONS.VIEW | ACTIONS.EDIT | etc.
 * @returns {boolean}
 */
export function hasAction(userPermissions, moduleId, action) {
  if (!userPermissions || !moduleId || !action) return false;
  const modPerms = userPermissions.modules?.[moduleId];
  if (!modPerms?.enabled) return false;
  return modPerms.actions?.[action] === true;
}

/**
 * Retourne le niveau d'accès legacy (read|write|none) à partir des nouvelles permissions.
 * Assure la rétrocompatibilité avec l'existant.
 */
export function getAccessLevelFromPermissions(userPermissions, moduleId) {
  const modPerms = userPermissions?.modules?.[moduleId];
  if (!modPerms?.enabled) return 'none';
  if (modPerms.actions?.[ACTIONS.EDIT] || modPerms.actions?.[ACTIONS.CREATE]) return 'write';
  if (modPerms.actions?.[ACTIONS.VIEW]) return 'read';
  return 'none';
}

/**
 * Construit les permissions par défaut pour un rôle donné.
 * Retourne une structure prête à stocker dans Firestore.
 */
export function getDefaultPermissionsForRole(role) {
  return ROLE_DEFAULT_PERMISSIONS[role] || ROLE_DEFAULT_PERMISSIONS.STAFF;
}

/**
 * Applique un preset d'actions sur un module.
 * preset: 'none' | 'view' | 'standard' | 'full'
 */
export function applyPreset(currentPerms, moduleId, preset) {
  const actions = ACTION_PRESETS[preset] || [];
  const mod = MODULES_MAP[moduleId];
  const newModPerms = {
    enabled: actions.length > 0,
    actions: Object.fromEntries(ALL_ACTIONS.map(a => [a, actions.includes(a)])),
    submodules: Object.fromEntries(
      (mod?.submodules || []).map(s => [
        s.id,
        { enabled: actions.length > 0, actions: Object.fromEntries(ALL_ACTIONS.map(a => [a, actions.includes(a)])) },
      ])
    ),
  };
  return {
    ...currentPerms,
    modules: { ...(currentPerms?.modules || {}), [moduleId]: newModPerms },
  };
}

/**
 * Applique les permissions par défaut d'un rôle, en préservant les overrides manuels.
 */
export function applyRolePreset(currentPerms, role) {
  const defaults = getDefaultPermissionsForRole(role);
  return {
    ...defaults,
    // Préserver les overrides manuels (modules explicitement configurés)
    modules: { ...defaults.modules, ...(currentPerms?.modules || {}) },
  };
}

/**
 * Liste les modules actifs (enabled) pour un utilisateur.
 */
export function getEnabledModules(userPermissions) {
  if (!userPermissions?.modules) return [];
  return Object.entries(userPermissions.modules)
    .filter(([, v]) => v.enabled)
    .map(([id]) => id);
}
