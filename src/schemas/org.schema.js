/**
 * ════════════════════════════════════════════════════════════════════════════
 * IPC GROUP — ORGANISATIONAL HIERARCHY SCHEMA v2.0
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Defines the 3-level group governance model:
 *
 *   LEVEL 1 ── HOLDING     (IPC Holding)          → supervises all
 *   LEVEL 2 ── SUBSIDIARY  (IPC Green Blocks, …)  → operational entities
 *   LEVEL 3 ── FOUNDATION  (IPC Foundation)       → non-profit / CSR / ESG
 *
 * Every Firestore document MUST carry the entity fields defined in
 * ENTITY_FIELDS_SCHEMA. FirestoreService auto-injects them via TenantContext.
 */

// ── Entity Types ─────────────────────────────────────────────────────────────

export const ENTITY_TYPES = Object.freeze({
  HOLDING:    'HOLDING',
  SUBSIDIARY: 'SUBSIDIARY',
  FOUNDATION: 'FOUNDATION',
});

// ── Organizational Roles ──────────────────────────────────────────────────────
// Hierarchy: HOLDING > SUBSIDIARY > FOUNDATION
// Scoping rules:
//   - HOLDING roles: full group visibility
//   - SUBSIDIARY roles: scoped to their entity_id
//   - FOUNDATION roles: scoped to FOUNDATION entities only
//   - Cross-entity: SUPER_ADMIN (all), GROUP_AUDITOR (read-only, all)

export const ORG_ROLES = Object.freeze({
  // ── Global ─────────────────────────────
  SUPER_ADMIN:         'SUPER_ADMIN',         // God mode
  GROUP_AUDITOR:       'GROUP_AUDITOR',       // Read-only, all entities

  // ── Holding roles ────────────────────────
  HOLDING_CEO:         'HOLDING_CEO',         // Full group control
  HOLDING_CFO:         'HOLDING_CFO',         // Group financial consolidation
  HOLDING_CSO:         'HOLDING_CSO',         // Chief Strategy Officer
  HOLDING_CHRO:        'HOLDING_CHRO',        // Group HR Director
  HOLDING_CTO:         'HOLDING_CTO',         // Group IT/Tech
  HOLDING_AUDITOR:     'HOLDING_AUDITOR',     // Internal audit group-wide
  HOLDING_LEGAL:       'HOLDING_LEGAL',       // Group legal

  // ── Subsidiary roles ─────────────────────
  SUBSIDIARY_DG:       'SUBSIDIARY_DG',       // Directeur Général filiale
  SUBSIDIARY_CFO:      'SUBSIDIARY_CFO',      // Directeur Financier filiale
  SUBSIDIARY_RH:       'SUBSIDIARY_RH',       // Responsable RH filiale
  SUBSIDIARY_MANAGER:  'SUBSIDIARY_MANAGER',  // Manager opérationnel
  SUBSIDIARY_STAFF:    'SUBSIDIARY_STAFF',    // Employé standard

  // ── Foundation roles ─────────────────────
  FOUNDATION_DG:       'FOUNDATION_DG',       // Directeur Foundation
  FOUNDATION_MANAGER:  'FOUNDATION_MANAGER',  // Manager programmes
  FOUNDATION_STAFF:    'FOUNDATION_STAFF',    // Coordinateur terrain
  FOUNDATION_AUDITOR:  'FOUNDATION_AUDITOR',  // Auditeur ESG Foundation

  // ── Country roles (v3.0 — country governance) ────────────────────────
  // Pilotes pays bornés à un country_id, créés par la Holding
  // lors du provisioning d'un Country Scope.
  COUNTRY_DIRECTOR_SUBSIDIARY: 'COUNTRY_DIRECTOR_SUBSIDIARY',  // DG filiale pays
  COUNTRY_DIRECTOR_FOUNDATION: 'COUNTRY_DIRECTOR_FOUNDATION',  // DG foundation pays
  COUNTRY_HR:                  'COUNTRY_HR',                   // RH pays (filiale ou foundation)
  COUNTRY_FINANCE:             'COUNTRY_FINANCE',              // Finance pays
  COUNTRY_OPERATIONS:          'COUNTRY_OPERATIONS',           // Opérations pays
  COUNTRY_AUDITOR:             'COUNTRY_AUDITOR',              // Audit pays read-only

  // ── Legacy (backward compat) ─────────────
  ADMIN:               'ADMIN',
  MANAGER:             'MANAGER',
  STAFF:               'STAFF',
  FINANCE:             'FINANCE',
  HR:                  'HR',
  HR_MANAGER:          'HR_MANAGER',
  SALES:               'SALES',
  CRM:                 'CRM',
  LOGISTICS:           'LOGISTICS',
  PRODUCTION:          'PRODUCTION',
  MARKETING:           'MARKETING',
  LEGAL:               'LEGAL',
  AUDIT:               'AUDIT',
});

// ── Role → Entity Type mapping ───────────────────────────────────────────────

export const ROLE_ENTITY_SCOPE = {
  [ORG_ROLES.SUPER_ADMIN]:        null,               // all entities
  [ORG_ROLES.GROUP_AUDITOR]:      null,               // read-only all
  [ORG_ROLES.HOLDING_CEO]:        ENTITY_TYPES.HOLDING,
  [ORG_ROLES.HOLDING_CFO]:        ENTITY_TYPES.HOLDING,
  [ORG_ROLES.HOLDING_CSO]:        ENTITY_TYPES.HOLDING,
  [ORG_ROLES.HOLDING_CHRO]:       ENTITY_TYPES.HOLDING,
  [ORG_ROLES.HOLDING_CTO]:        ENTITY_TYPES.HOLDING,
  [ORG_ROLES.HOLDING_AUDITOR]:    ENTITY_TYPES.HOLDING,
  [ORG_ROLES.HOLDING_LEGAL]:      ENTITY_TYPES.HOLDING,
  [ORG_ROLES.SUBSIDIARY_DG]:      ENTITY_TYPES.SUBSIDIARY,
  [ORG_ROLES.SUBSIDIARY_CFO]:     ENTITY_TYPES.SUBSIDIARY,
  [ORG_ROLES.SUBSIDIARY_RH]:      ENTITY_TYPES.SUBSIDIARY,
  [ORG_ROLES.SUBSIDIARY_MANAGER]: ENTITY_TYPES.SUBSIDIARY,
  [ORG_ROLES.SUBSIDIARY_STAFF]:   ENTITY_TYPES.SUBSIDIARY,
  [ORG_ROLES.FOUNDATION_DG]:      ENTITY_TYPES.FOUNDATION,
  [ORG_ROLES.FOUNDATION_MANAGER]: ENTITY_TYPES.FOUNDATION,
  [ORG_ROLES.FOUNDATION_STAFF]:   ENTITY_TYPES.FOUNDATION,
  [ORG_ROLES.FOUNDATION_AUDITOR]: ENTITY_TYPES.FOUNDATION,
  // Country roles — bornés à un country_id, voir country.schema.js
  [ORG_ROLES.COUNTRY_DIRECTOR_SUBSIDIARY]: ENTITY_TYPES.SUBSIDIARY,
  [ORG_ROLES.COUNTRY_DIRECTOR_FOUNDATION]: ENTITY_TYPES.FOUNDATION,
  [ORG_ROLES.COUNTRY_HR]:                  null,  // SUBSIDIARY ou FOUNDATION selon affectation
  [ORG_ROLES.COUNTRY_FINANCE]:             null,
  [ORG_ROLES.COUNTRY_OPERATIONS]:          null,
  [ORG_ROLES.COUNTRY_AUDITOR]:             null,
};

// ── Country role helpers ─────────────────────────────────────────────────────

/** Roles country-scoped (bornés à un country_id, jamais cross-pays) */
export function isCountryRole(role) {
  return [
    ORG_ROLES.COUNTRY_DIRECTOR_SUBSIDIARY,
    ORG_ROLES.COUNTRY_DIRECTOR_FOUNDATION,
    ORG_ROLES.COUNTRY_HR,
    ORG_ROLES.COUNTRY_FINANCE,
    ORG_ROLES.COUNTRY_OPERATIONS,
    ORG_ROLES.COUNTRY_AUDITOR,
  ].includes(role);
}

// ── Registered Group Entities ─────────────────────────────────────────────────

export const GROUP_ENTITIES = [
  // Level 1 — Holding
  {
    id:           'ipc_holding',
    type:         ENTITY_TYPES.HOLDING,
    name:         'IPC Holding',
    shortName:    'Holding',
    parentId:     null,
    industry:     'Conglomérat',
    currency:     'XOF',
    country:      'CI',
    color:        '#2ecc71',
    icon:         '',
    active:       true,
  },

  // Level 2 — Subsidiaries
  {
    id:           'ipc_green_blocks',
    type:         ENTITY_TYPES.SUBSIDIARY,
    name:         'IPC Green Blocks',
    shortName:    'Green Blocks',
    parentId:     'ipc_holding',
    industry:     'Fabrication / Construction',
    currency:     'XOF',
    country:      'CI',
    color:        '#27ae60',
    icon:         '',
    active:       true,
    modules:      ['crm', 'sales', 'inventory', 'production', 'logistics', 'finance', 'hr', 'projects'],
  },
  {
    id:           'nexus_academy',
    type:         ENTITY_TYPES.SUBSIDIARY,
    name:         'Nexus Academy',
    shortName:    'Academy',
    parentId:     'ipc_holding',
    industry:     'Formation & Éducation',
    currency:     'XOF',
    country:      'CI',
    color:        '#8e44ad',
    icon:         '',
    active:       true,
    modules:      ['crm', 'sales', 'hr', 'projects', 'finance'],
  },
  {
    id:           'connect_plus',
    type:         ENTITY_TYPES.SUBSIDIARY,
    name:         'Connect Plus',
    shortName:    'Connect+',
    parentId:     'ipc_holding',
    industry:     'Technologie & Communication',
    currency:     'XOF',
    country:      'CI',
    color:        '#2980b9',
    icon:         '',
    active:       true,
    modules:      ['crm', 'sales', 'marketing', 'finance', 'hr', 'projects'],
  },
  {
    id:           'ysee',
    type:         ENTITY_TYPES.SUBSIDIARY,
    name:         'YSEE',
    shortName:    'YSEE',
    parentId:     'ipc_holding',
    industry:     'Services',
    currency:     'XOF',
    country:      'CI',
    color:        '#e67e22',
    icon:         '',
    active:       true,
    modules:      ['crm', 'sales', 'finance', 'hr'],
  },
  {
    id:           'hotel_sana',
    type:         ENTITY_TYPES.SUBSIDIARY,
    name:         'Hôtel Sana',
    shortName:    'Hôtel Sana',
    parentId:     'ipc_holding',
    industry:     'Hôtellerie & Restauration',
    currency:     'XOF',
    country:      'CI',
    color:        '#c0392b',
    icon:         '',
    active:       true,
    modules:      ['crm', 'sales', 'inventory', 'finance', 'hr', 'planning'],
  },
  {
    id:           'select',
    type:         ENTITY_TYPES.SUBSIDIARY,
    name:         'Select',
    shortName:    'Select',
    parentId:     'ipc_holding',
    industry:     'Commerce & Distribution',
    currency:     'XOF',
    country:      'CI',
    color:        '#16a085',
    icon:         '',
    active:       true,
    modules:      ['crm', 'sales', 'inventory', 'logistics', 'finance', 'hr'],
  },
  {
    id:           'prod_logistique',
    type:         ENTITY_TYPES.SUBSIDIARY,
    name:         'Production & Logistique',
    shortName:    'Prod & Log',
    parentId:     'ipc_holding',
    industry:     'Industrie & Logistique',
    currency:     'XOF',
    country:      'CI',
    color:        '#d35400',
    icon:         '',
    active:       true,
    modules:      ['production', 'logistics', 'inventory', 'finance', 'hr'],
  },

  // Level 3 — Foundation
  {
    id:           'ipc_foundation',
    type:         ENTITY_TYPES.FOUNDATION,
    name:         'IPC Foundation',
    shortName:    'Foundation',
    parentId:     'ipc_holding',
    industry:     'ONG / Social / ESG',
    currency:     'XOF',
    country:      'CI',
    color:        '#f39c12',
    icon:         '',
    active:       true,
    isNonProfit:  true,
    modules:      ['foundation_impact', 'foundation_donations', 'foundation_campaigns'],
  },
];

// ── Permission Levels ─────────────────────────────────────────────────────────

/**
 * Returns true if the given role has group-wide (Holding-level) visibility.
 * These users can see consolidated data across all entities.
 */
export function isHoldingRole(role) {
  return [
    ORG_ROLES.SUPER_ADMIN,
    ORG_ROLES.GROUP_AUDITOR,
    ORG_ROLES.HOLDING_CEO,
    ORG_ROLES.HOLDING_CFO,
    ORG_ROLES.HOLDING_CSO,
    ORG_ROLES.HOLDING_CHRO,
    ORG_ROLES.HOLDING_CTO,
    ORG_ROLES.HOLDING_AUDITOR,
    ORG_ROLES.HOLDING_LEGAL,
  ].includes(role);
}

export function isSubsidiaryRole(role) {
  return [
    ORG_ROLES.SUBSIDIARY_DG,
    ORG_ROLES.SUBSIDIARY_CFO,
    ORG_ROLES.SUBSIDIARY_RH,
    ORG_ROLES.SUBSIDIARY_MANAGER,
    ORG_ROLES.SUBSIDIARY_STAFF,
    // Legacy
    ORG_ROLES.ADMIN,
    ORG_ROLES.MANAGER,
    ORG_ROLES.STAFF,
  ].includes(role);
}

export function isFoundationRole(role) {
  return [
    ORG_ROLES.FOUNDATION_DG,
    ORG_ROLES.FOUNDATION_MANAGER,
    ORG_ROLES.FOUNDATION_STAFF,
    ORG_ROLES.FOUNDATION_AUDITOR,
  ].includes(role);
}

// ── Entity lookup helpers ─────────────────────────────────────────────────────

export function getEntityById(id) {
  return GROUP_ENTITIES.find(e => e.id === id) || null;
}

export function getSubsidiaries() {
  return GROUP_ENTITIES.filter(e => e.type === ENTITY_TYPES.SUBSIDIARY && e.active);
}

export function getFoundation() {
  return GROUP_ENTITIES.find(e => e.type === ENTITY_TYPES.FOUNDATION);
}

export function getHolding() {
  return GROUP_ENTITIES.find(e => e.type === ENTITY_TYPES.HOLDING);
}

// ── Firestore Document Entity Fields Schema ───────────────────────────────────
// Every document in a multi-entity collection MUST have these fields.

export const ENTITY_FIELDS_SCHEMA = {
  tenant_id:    String,   // Group tenant (ipc_group)
  entity_type:  String,   // HOLDING | SUBSIDIARY | FOUNDATION
  entity_id:    String,   // Matches GROUP_ENTITIES[].id
  company_id:   String,   // Alias for entity_id (backward compat)
  branch_id:    String,   // Optional sub-branch
  // ── v3.0 — Country governance ──────────────────────────────────────────
  country_id:    String,  // ISO 3166-1 alpha-2 (ex: 'CI', 'SN', 'FR')
  department_id: String,  // Optional department within the entity
};

// ── KPI Definitions by entity type ───────────────────────────────────────────

export const HOLDING_KPIS = [
  { id: 'revenue_consolidated',   label: 'CA Consolidé',         unit: 'XOF', icon: '', trend: 'up' },
  { id: 'ebitda_group',           label: 'EBITDA Groupe',        unit: 'XOF', icon: '', trend: 'up' },
  { id: 'headcount_total',        label: 'Effectif Total',       unit: 'emp', icon: '', trend: 'up' },
  { id: 'subsidiaries_count',     label: 'Filiales Actives',     unit: '',    icon: '', trend: 'stable' },
  { id: 'esg_score',              label: 'Score ESG Groupe',     unit: '/100',icon: '', trend: 'up' },
  { id: 'intercompany_volume',    label: 'Flux Interco',         unit: 'XOF', icon: '', trend: 'stable' },
  { id: 'budget_variance',        label: 'Variance Budget',      unit: '%',   icon: '', trend: 'stable' },
  { id: 'cash_consolidated',      label: 'Trésorerie Conso.',    unit: 'XOF', icon: '', trend: 'up' },
];

export const SUBSIDIARY_KPIS = [
  { id: 'revenue',       label: 'Chiffre d\'Affaires', unit: 'XOF', icon: '' },
  { id: 'gross_margin',  label: 'Marge Brute',          unit: '%',   icon: '' },
  { id: 'headcount',     label: 'Effectif',             unit: 'emp', icon: '' },
  { id: 'orders',        label: 'Commandes',            unit: '',    icon: '' },
  { id: 'overdue_ar',    label: 'Créances Échues',      unit: 'XOF', icon: '' },
];

export const FOUNDATION_KPIS = [
  { id: 'donations_total',     label: 'Dons Collectés',      unit: 'XOF', icon: '' },
  { id: 'beneficiaries',       label: 'Bénéficiaires',       unit: '',    icon: '' },
  { id: 'campaigns_active',    label: 'Campagnes Actives',   unit: '',    icon: '' },
  { id: 'esg_impact_score',    label: 'Impact Score',        unit: '/100',icon: '' },
  { id: 'programs_completed',  label: 'Programmes Clôturés', unit: '',    icon: '' },
  { id: 'co2_offset',          label: 'CO₂ Compensé',        unit: 'T',   icon: '' },
];
