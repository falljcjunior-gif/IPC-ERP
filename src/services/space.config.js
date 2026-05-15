/**
 * ════════════════════════════════════════════════════════════════════════════
 * SPACE CONFIG — 3-Space Multi-Tenant Architecture
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Définit pour chaque type d'entité (HOLDING / SUBSIDIARY / FOUNDATION) :
 *   - SPACE_NAV   : modules visibles dans la sidebar (whitelist par espace)
 *   - SPACE_THEME : palette d'accent CSS différenciante
 *   - SPACE_META  : label, route racine, icône, description
 *
 * Cette configuration est consommée par :
 *   - PlatformShell (sidebar dynamique + thème)
 *   - BusinessContext (auto-routing post-login)
 *   - Registry.getModulesByEntityType()
 *
 * RÈGLE : un module SANS attribut `entityTypes` est GLOBAL (visible partout).
 *         Un module AVEC `entityTypes: ['HOLDING']` est strictement réservé.
 */

import { ENTITY_TYPES } from '../schemas/org.schema';

// ── Routes racines par espace ────────────────────────────────────────────────
export const SPACE_ROUTES = {
  [ENTITY_TYPES.HOLDING]:    '/holding',
  [ENTITY_TYPES.SUBSIDIARY]: '/subsidiary',
  [ENTITY_TYPES.FOUNDATION]: '/foundation',
};

// ── Modules racine par espace (homepage par défaut) ──────────────────────────
export const SPACE_HOME = {
  [ENTITY_TYPES.HOLDING]:    'holding',       // → HoldingCockpit
  [ENTITY_TYPES.SUBSIDIARY]: 'subsidiary',    // → SubsidiaryCockpit
  [ENTITY_TYPES.FOUNDATION]: 'foundation',    // → FoundationCockpit
};

// ── Modules visibles dans chaque espace (whitelist explicite) ───────────────
// Les modules GLOBAUX (home, profile, settings, connect, missions, academy)
// sont automatiquement ajoutés en plus de la whitelist.
export const SPACE_NAV = {
  [ENTITY_TYPES.HOLDING]: [
    // Cockpit + gouvernance groupe
    'holding',
    'holding-governance',
    'holding-consolidation',
    'holding-bi',
    'holding-audit',
    'holding-risk',
    'holding-compliance',
    'holding-licensing',
    'holding-entities',
    'holding-hr',
    'holding-budget',
    'holding-ai',
    'holding-analytics',
    'holding-security',
    'holding-countries',
    'holding-workflows',
    'holding-approvals',
    'holding-strategic-intel',
  ],
  [ENTITY_TYPES.SUBSIDIARY]: [
    // Opérationnel local
    'subsidiary',
    'crm',
    'sales',
    'inventory',
    'production',
    'manufacturing',
    'logistics',
    'purchase',
    'finance',
    'accounting',
    'hr',
    'talent',
    'payroll',
    'projects',
    'maintenance',
    'fleet',
    'quality',
    'marketing',
    'website',
    'bi',
    'shipping',
    'helpdesk',
  ],
  [ENTITY_TYPES.FOUNDATION]: [
    // Mission / impact / ESG
    'foundation',
    'foundation-programs',
    'foundation-esg',
    'foundation-beneficiaries',
    'foundation-donations',
    'foundation-campaigns',
    'foundation-field',
    'foundation-impact-report',
    'foundation-dms',
    'foundation-compliance',
    'foundation-hr-field',
    'foundation-projects',
    'foundation-communication',
    'foundation-audit-impact',
    'foundation-ai-esg',
  ],
};

// ── Modules GLOBAUX (toujours visibles, quel que soit l'espace) ─────────────
export const GLOBAL_MODULES = [
  'home',
  'profile',
  'settings',
  'connect',
  'missions',
  'academy',
  'signature',
  'documents',
];

// ── Thèmes visuels par espace (CSS variables) ───────────────────────────────
export const SPACE_THEME = {
  [ENTITY_TYPES.HOLDING]: {
    label:        'Espace Holding',
    description:  'Gouvernance & supervision groupe',
    accent:       '#0F172A',   // slate-900 — autorité, executive
    accentSoft:   '#F1F5F9',
    badgeBg:      '#0F172A',
    badgeFg:      '#FFFFFF',
  },
  [ENTITY_TYPES.SUBSIDIARY]: {
    label:        'Espace Filiale',
    description:  'Opérations & performance locale',
    accent:       '#10B981',   // emerald — opérationnel, croissance
    accentSoft:   '#ECFDF5',
    badgeBg:      '#10B981',
    badgeFg:      '#FFFFFF',
  },
  [ENTITY_TYPES.FOUNDATION]: {
    label:        'Espace Foundation',
    description:  'Mission, impact & ESG',
    accent:       '#8B5CF6',   // violet — mission, humain, ESG
    accentSoft:   '#F5F3FF',
    badgeBg:      '#8B5CF6',
    badgeFg:      '#FFFFFF',
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Résout l'espace actif d'un utilisateur à partir de son profil.
 * Fallback sur SUBSIDIARY si entity_type manquant (cas legacy).
 */
export function resolveSpace(user) {
  const t = user?.entity_type || user?.entityType;
  if (t === ENTITY_TYPES.HOLDING)    return ENTITY_TYPES.HOLDING;
  if (t === ENTITY_TYPES.FOUNDATION) return ENTITY_TYPES.FOUNDATION;
  return ENTITY_TYPES.SUBSIDIARY;
}

/**
 * Retourne la liste des module IDs visibles pour un espace donné.
 * Inclut whitelist espace + modules globaux.
 */
export function getModuleIdsForSpace(entityType) {
  const space = entityType || ENTITY_TYPES.SUBSIDIARY;
  return [...(SPACE_NAV[space] || []), ...GLOBAL_MODULES];
}

/**
 * Retourne le thème CSS d'un espace.
 */
export function getSpaceTheme(entityType) {
  return SPACE_THEME[entityType] || SPACE_THEME[ENTITY_TYPES.SUBSIDIARY];
}

/**
 * Retourne la route racine d'un espace.
 */
export function getSpaceRoute(entityType) {
  return SPACE_ROUTES[entityType] || SPACE_ROUTES[ENTITY_TYPES.SUBSIDIARY];
}

/**
 * Retourne l'ID du module "home" d'un espace.
 */
export function getSpaceHome(entityType) {
  return SPACE_HOME[entityType] || SPACE_HOME[ENTITY_TYPES.SUBSIDIARY];
}

export default {
  SPACE_NAV,
  SPACE_THEME,
  SPACE_ROUTES,
  SPACE_HOME,
  GLOBAL_MODULES,
  resolveSpace,
  getModuleIdsForSpace,
  getSpaceTheme,
  getSpaceRoute,
  getSpaceHome,
};
