/**
 * ════════════════════════════════════════════════════════════════════════════
 * IPC GROUP — ENTERPRISE LICENSE SCHEMA v1.0
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Defines the SaaS licensing model piloted by IPC Holding :
 *
 * HOLDING → GROUP license (controls all entities)
 * SUBSIDIARY → Entity license (STARTER / BUSINESS / ENTERPRISE / INDUSTRIAL / CUSTOM)
 * FOUNDATION → Non-profit license (FOUNDATION plan)
 * USER → Per-seat user types (ADMIN / MANAGER / STANDARD / READONLY / AUDITOR)
 *
 * Each license controls :
 * • Modules enabled (what the entity can use)
 * • User quota (max seats)
 * • Storage quota (MB)
 * • AI tokens monthly (Nexus intelligence calls)
 * • API calls monthly
 * • Advanced feature flags (BI, automations, SSO, exports…)
 * • Operational quotas (projects, workflows, campaigns…)
 */

// ── License Plan IDs ──────────────────────────────────────────────────────────

export const LICENSE_PLAN_IDS = Object.freeze({
  // Holding
  GROUP: 'GROUP',
  // Subsidiaries
  STARTER: 'STARTER',
  BUSINESS: 'BUSINESS',
  ENTERPRISE: 'ENTERPRISE',
  INDUSTRIAL: 'INDUSTRIAL',
  ACADEMY: 'ACADEMY',
  // Foundation
  FOUNDATION: 'FOUNDATION',
  // Special
  TRIAL: 'TRIAL',
  CUSTOM: 'CUSTOM',
  SUSPENDED: 'SUSPENDED',
});

// ── All Possible Modules ──────────────────────────────────────────────────────

export const ALL_MODULES = [
  // Commercial
  { id: 'crm', label: 'CRM & Prospects', category: 'Commercial', icon: '' },
  { id: 'sales', label: 'Ventes & Commandes', category: 'Commercial', icon: '' },
  { id: 'marketing', label: 'Marketing', category: 'Commercial', icon: '' },
  // Finance
  { id: 'finance', label: 'Finance & Comptabilité', category: 'Finance', icon: '' },
  { id: 'budget', label: 'Budget', category: 'Finance', icon: '' },
  { id: 'payroll', label: 'Paie & Social', category: 'Finance', icon: '' },
  // Operations
  { id: 'inventory', label: 'Stocks & Inventaire', category: 'Opérations', icon: '' },
  { id: 'production', label: 'Production', category: 'Opérations', icon: '' },
  { id: 'logistics', label: 'Logistique', category: 'Opérations', icon: '' },
  { id: 'purchase', label: 'Achats', category: 'Opérations', icon: '' },
  { id: 'fleet', label: 'Flotte & Mobilité', category: 'Opérations', icon: '' },
  // HR
  { id: 'hr', label: 'Ressources Humaines', category: 'RH', icon: '' },
  { id: 'recruitment', label: 'Recrutement', category: 'RH', icon: '' },
  { id: 'timesheets', label: 'Temps & Présences', category: 'RH', icon: '⏱' },
  // Projects
  { id: 'projects', label: 'Gestion de Projets', category: 'Projets', icon: '' },
  { id: 'missions', label: 'Missions Kanban', category: 'Projets', icon: '' },
  { id: 'planning', label: 'Planning', category: 'Projets', icon: '' },
  // Intelligence
  { id: 'bi', label: 'BI & Analytics', category: 'Intelligence',icon: '' },
  { id: 'ai', label: 'Nexus IA', category: 'Intelligence',icon: '' },
  // Collaboration
  { id: 'connect', label: 'Connect Plus (Social)', category: 'Collab.', icon: '' },
  { id: 'dms', label: 'Documents Cloud', category: 'Collab.', icon: '' },
  { id: 'signature', label: 'Signature Électronique', category: 'Collab.', icon: '' },
  { id: 'helpdesk', label: 'Helpdesk & Support', category: 'Collab.', icon: '' },
  // Compliance
  { id: 'legal', label: 'Juridique', category: 'Conformité', icon: '' },
  { id: 'audit', label: 'Audit & Conformité', category: 'Conformité', icon: '' },
  // Foundation
  { id: 'foundation_donations', label: 'Dons & Financement', category: 'Foundation', icon: '' },
  { id: 'foundation_programs', label: 'Programmes Sociaux', category: 'Foundation', icon: '' },
  { id: 'foundation_beneficiaries',label: 'Bénéficiaires', category: 'Foundation', icon: '' },
  { id: 'foundation_campaigns', label: 'Campagnes', category: 'Foundation', icon: '' },
  // Admin
  { id: 'academy', label: 'Nexus Academy (LMS)', category: 'Spécial', icon: '' },
];

// ── License Plan Definitions ──────────────────────────────────────────────────

export const LICENSE_PLANS = {

  [LICENSE_PLAN_IDS.TRIAL]: {
    id: 'TRIAL',
    name: 'Essai Gratuit',
    description: '14 jours pour découvrir l\'ERP',
    color: '#6b7280',
    icon: '',
    durationDays: 14,
    // Quotas
    maxUsers: 5,
    maxStorageMB: 1024, // 1 GB
    maxProjects: 5,
    maxWorkflows: 3,
    aiTokensMonthly: 10000,
    apiCallsMonthly: 5000,
    maxCampaigns: 2,
    maxBeneficiaries: 0,
    maxBranches: 1,
    maxDocuments: 100,
    // Modules
    modules: ['crm', 'sales', 'finance', 'hr', 'connect', 'dms'],
    // Features
    features: {
      bi: false,
      advancedAnalytics:false,
      aiCopilot: true,
      exportPDF: true,
      exportExcel: false,
      automations: false,
      sso: false,
      apiAccess: false,
      customReports: false,
      multiCurrency: false,
      consolidation: false,
    },
  },

  [LICENSE_PLAN_IDS.STARTER]: {
    id: 'STARTER',
    name: 'Starter',
    description: 'Pour démarrer — TPE & jeunes entreprises',
    color: '#3b82f6',
    icon: '',
    durationDays: null, // ongoing
    maxUsers: 10,
    maxStorageMB: 10240, // 10 GB
    maxProjects: 20,
    maxWorkflows: 10,
    aiTokensMonthly: 50000,
    apiCallsMonthly: 20000,
    maxCampaigns: 5,
    maxBeneficiaries: 0,
    maxBranches: 1,
    maxDocuments: 500,
    modules: ['crm', 'sales', 'finance', 'hr', 'inventory', 'connect', 'dms', 'planning', 'projects'],
    features: {
      bi: false,
      advancedAnalytics:false,
      aiCopilot: true,
      exportPDF: true,
      exportExcel: true,
      automations: false,
      sso: false,
      apiAccess: false,
      customReports: false,
      multiCurrency: false,
      consolidation: false,
    },
  },

  [LICENSE_PLAN_IDS.BUSINESS]: {
    id: 'BUSINESS',
    name: 'Business',
    description: 'Pour les PME en croissance',
    color: '#8b5cf6',
    icon: '',
    durationDays: null,
    maxUsers: 50,
    maxStorageMB: 102400, // 100 GB
    maxProjects: 100,
    maxWorkflows: 50,
    aiTokensMonthly: 200000,
    apiCallsMonthly: 100000,
    maxCampaigns: 20,
    maxBeneficiaries: 0,
    maxBranches: 3,
    maxDocuments: 5000,
    modules: [
      'crm', 'sales', 'marketing', 'finance', 'budget', 'payroll',
      'hr', 'recruitment', 'timesheets',
      'inventory', 'production', 'logistics', 'purchase', 'planning',
      'projects', 'missions', 'connect', 'dms', 'signature', 'helpdesk',
      'legal', 'audit', 'bi', 'ai',
    ],
    features: {
      bi: true,
      advancedAnalytics:true,
      aiCopilot: true,
      exportPDF: true,
      exportExcel: true,
      automations: true,
      sso: false,
      apiAccess: true,
      customReports: false,
      multiCurrency: true,
      consolidation: false,
    },
  },

  [LICENSE_PLAN_IDS.ENTERPRISE]: {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    description: 'Pour les grandes organisations',
    color: '#2ecc71',
    icon: '',
    durationDays: null,
    maxUsers: -1, // unlimited
    maxStorageMB: 1048576, // 1 TB
    maxProjects: -1,
    maxWorkflows: -1,
    aiTokensMonthly: 2000000,
    apiCallsMonthly: -1,
    maxCampaigns: -1,
    maxBeneficiaries: -1,
    maxBranches: -1,
    maxDocuments: -1,
    modules: ['all'], // all modules
    features: {
      bi: true,
      advancedAnalytics:true,
      aiCopilot: true,
      exportPDF: true,
      exportExcel: true,
      automations: true,
      sso: true,
      apiAccess: true,
      customReports: true,
      multiCurrency: true,
      consolidation: true,
    },
  },

  [LICENSE_PLAN_IDS.INDUSTRIAL]: {
    id: 'INDUSTRIAL',
    name: 'Industrial',
    description: 'Optimisé pour l\'industrie & production',
    color: '#f39c12',
    icon: '',
    durationDays: null,
    maxUsers: 200,
    maxStorageMB: 512000, // 500 GB
    maxProjects: 500,
    maxWorkflows: -1,
    aiTokensMonthly: 1000000,
    apiCallsMonthly: 500000,
    maxCampaigns: 10,
    maxBeneficiaries: 0,
    maxBranches: 10,
    maxDocuments: -1,
    modules: [
      'crm', 'sales', 'finance', 'budget', 'payroll',
      'hr', 'recruitment', 'timesheets',
      'inventory', 'production', 'logistics', 'purchase', 'fleet', 'planning',
      'projects', 'missions', 'connect', 'dms', 'signature', 'helpdesk',
      'legal', 'audit', 'bi', 'ai',
    ],
    features: {
      bi: true,
      advancedAnalytics:true,
      aiCopilot: true,
      exportPDF: true,
      exportExcel: true,
      automations: true,
      sso: true,
      apiAccess: true,
      customReports: true,
      multiCurrency: true,
      consolidation: false,
    },
  },

  [LICENSE_PLAN_IDS.ACADEMY]: {
    id: 'ACADEMY',
    name: 'Academy',
    description: 'Formation & éducation',
    color: '#e74c3c',
    icon: '',
    durationDays: null,
    maxUsers: 100,
    maxStorageMB: 204800, // 200 GB
    maxProjects: 200,
    maxWorkflows: 50,
    aiTokensMonthly: 500000,
    apiCallsMonthly: 100000,
    maxCampaigns: 30,
    maxBeneficiaries: 5000,
    maxBranches: 5,
    maxDocuments: -1,
    modules: [
      'crm', 'sales', 'marketing', 'finance', 'hr', 'recruitment',
      'projects', 'missions', 'planning', 'connect', 'dms', 'signature',
      'academy', 'bi', 'ai',
    ],
    features: {
      bi: true,
      advancedAnalytics:true,
      aiCopilot: true,
      exportPDF: true,
      exportExcel: true,
      automations: true,
      sso: false,
      apiAccess: true,
      customReports: false,
      multiCurrency: false,
      consolidation: false,
    },
  },

  [LICENSE_PLAN_IDS.FOUNDATION]: {
    id: 'FOUNDATION',
    name: 'Foundation',
    description: 'Entité non-lucrative / ONG',
    color: '#27ae60',
    icon: '',
    durationDays: null,
    maxUsers: 30,
    maxStorageMB: 51200, // 50 GB
    maxProjects: 50,
    maxWorkflows: 20,
    aiTokensMonthly: 100000,
    apiCallsMonthly: 50000,
    maxCampaigns: 20,
    maxBeneficiaries: 50000,
    maxBranches: 3,
    maxDocuments: 5000,
    modules: [
      'hr', 'finance', 'budget', 'projects', 'connect', 'dms', 'signature',
      'legal', 'audit',
      'foundation_donations', 'foundation_programs', 'foundation_beneficiaries',
      'foundation_campaigns',
    ],
    features: {
      bi: true,
      advancedAnalytics:false,
      aiCopilot: true,
      exportPDF: true,
      exportExcel: true,
      automations: true,
      sso: false,
      apiAccess: false,
      customReports: false,
      multiCurrency: true,
      consolidation: false,
    },
  },

  [LICENSE_PLAN_IDS.GROUP]: {
    id: 'GROUP',
    name: 'Groupe (Holding)',
    description: 'Licence mère — contrôle total groupe',
    color: '#2ecc71',
    icon: '',
    durationDays: null,
    maxSubsidiaries: -1,
    maxFoundations: -1,
    maxUsers: -1,
    maxStorageMB: -1,
    aiTokensMonthly: -1,
    apiCallsMonthly: -1,
    modules: ['all'],
    features: {
      bi: true,
      advancedAnalytics:true,
      aiCopilot: true,
      exportPDF: true,
      exportExcel: true,
      automations: true,
      sso: true,
      apiAccess: true,
      customReports: true,
      multiCurrency: true,
      consolidation: true,
      groupGovernance: true,
      licenseManagement:true,
    },
  },

  [LICENSE_PLAN_IDS.SUSPENDED]: {
    id: 'SUSPENDED',
    name: 'Suspendu',
    description: 'Accès suspendu par la Holding',
    color: '#e74c3c',
    icon: '',
    durationDays: null,
    maxUsers: 0,
    modules: [],
    features: {},
  },
};

// ── User Seat Types ───────────────────────────────────────────────────────────

export const USER_SEAT_TYPES = {
  ADMIN: { id: 'ADMIN', label: 'Administrateur', cost: 3, description: 'Accès complet à l\'entité' },
  MANAGER: { id: 'MANAGER', label: 'Manager', cost: 2, description: 'Gestion opérationnelle' },
  STANDARD: { id: 'STANDARD', label: 'Standard', cost: 1, description: 'Utilisateur standard' },
  READONLY: { id: 'READONLY', label: 'Lecture seule', cost: 0.5, description: 'Consultation uniquement' },
  AUDITOR: { id: 'AUDITOR', label: 'Auditeur', cost: 1, description: 'Accès audit + conformité' },
  EXECUTIVE: { id: 'EXECUTIVE', label: 'Exécutif', cost: 2, description: 'Tableau de bord exécutif' },
  EXTERNAL: { id: 'EXTERNAL', label: 'Externe', cost: 0.5, description: 'Partenaire / Prestataire' },
};

// ── Entity Lifecycle States ───────────────────────────────────────────────────

export const ENTITY_STATES = Object.freeze({
  PROVISIONING: 'PROVISIONING', // Being set up (just created)
  ACTIVE: 'ACTIVE', // Fully operational
  TRIAL: 'TRIAL', // On trial license
  SUSPENDED: 'SUSPENDED', // Temporarily frozen
  ARCHIVED: 'ARCHIVED', // Read-only, historical
  DELETED: 'DELETED', // Soft-deleted (legal retention)
  PENDING: 'PENDING', // Awaiting director activation
});

export const ENTITY_STATE_META = {
  [ENTITY_STATES.PROVISIONING]: { color: '#3498db', label: 'Provisioning', icon: '' },
  [ENTITY_STATES.ACTIVE]: { color: '#2ecc71', label: 'Actif', icon: '' },
  [ENTITY_STATES.TRIAL]: { color: '#f39c12', label: 'Essai', icon: '' },
  [ENTITY_STATES.SUSPENDED]: { color: '#e74c3c', label: 'Suspendu', icon: '⏸' },
  [ENTITY_STATES.ARCHIVED]: { color: '#6b7280', label: 'Archivé', icon: '' },
  [ENTITY_STATES.DELETED]: { color: '#374151', label: 'Supprimé', icon: '' },
  [ENTITY_STATES.PENDING]: { color: '#8b5cf6', label: 'En attente', icon: '⏳' },
};

// ── Internal Billing Rates (XOF / month) ─────────────────────────────────────
// For group-level refacturation to each entity

export const INTERNAL_BILLING = {
  perUserAdmin: 15000,
  perUserManager: 10000,
  perUserStandard: 5000,
  perUserReadOnly: 2500,
  storagePerGB: 500,
  aiTokensPer1k: 50,
  apiCallsPer1k: 25,
  moduleCostMap: {
    bi: 20000,
    ai: 30000,
    sso: 25000,
    consolidation: 40000,
    automations: 15000,
    apiAccess: 10000,
  },
};

// ── Quota Usage Thresholds ────────────────────────────────────────────────────
export const QUOTA_THRESHOLDS = {
  WARNING: 0.8, // 80% — show warning
  CRITICAL: 0.95, // 95% — show critical alert
  EXCEEDED: 1.0, // 100% — block creation
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getPlanById(planId) {
  return LICENSE_PLANS[planId] || null;
}

export function isModuleEnabled(plan, moduleId) {
  if (!plan) return false;
  if (plan.modules.includes('all')) return true;
  return plan.modules.includes(moduleId);
}

export function isFeatureEnabled(plan, featureKey) {
  if (!plan) return false;
  return !!plan.features[featureKey];
}

export function getQuotaStatus(used, max) {
  if (max === -1) return { pct: 0, status: 'unlimited' };
  const pct = used / max;
  const status = pct >= QUOTA_THRESHOLDS.EXCEEDED ? 'exceeded'
               : pct >= QUOTA_THRESHOLDS.CRITICAL ? 'critical'
               : pct >= QUOTA_THRESHOLDS.WARNING ? 'warning'
               : 'ok';
  return { pct, status };
}

export function calculateMonthlyBill(entityUsage) {
  const { users = {}, storageGB = 0, aiTokens = 0, apiCalls = 0, enabledFeatures = [] } = entityUsage;
  let total = 0;
  total += (users.admin || 0) * INTERNAL_BILLING.perUserAdmin;
  total += (users.manager || 0) * INTERNAL_BILLING.perUserManager;
  total += (users.standard || 0) * INTERNAL_BILLING.perUserStandard;
  total += (users.readonly || 0) * INTERNAL_BILLING.perUserReadOnly;
  total += storageGB * INTERNAL_BILLING.storagePerGB;
  total += Math.ceil(aiTokens / 1000) * INTERNAL_BILLING.aiTokensPer1k;
  total += Math.ceil(apiCalls / 1000) * INTERNAL_BILLING.apiCallsPer1k;
  enabledFeatures.forEach(f => {
    if (INTERNAL_BILLING.moduleCostMap[f]) total += INTERNAL_BILLING.moduleCostMap[f];
  });
  return total;
}
