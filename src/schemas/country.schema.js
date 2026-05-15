/**
 * ════════════════════════════════════════════════════════════════════════════
 * IPC GROUP — COUNTRY GOVERNANCE SCHEMA v1.0
 * ════════════════════════════════════════════════════════════════════════════
 *
 *  CONTEXTE
 *  ─────────
 *  Dans l'architecture cible Holding → Country → {Subsidiary, Foundation},
 *  un "Country Scope" est un CONTENEUR de gouvernance qui :
 *    1. Regroupe une Filiale (SUBSIDIARY) et une Foundation (FOUNDATION)
 *       partageant le même pays.
 *    2. Sert d'unité d'isolation des données (country_id propagé partout).
 *    3. Sert d'unité de licensing parente (umbrella licence par pays).
 *    4. Sert de scope RBAC/ABAC pour les rôles COUNTRY_DIRECTOR_*.
 *
 *  RÈGLE FONDAMENTALE
 *  ──────────────────
 *  Un pays ne peut PAS exister sans une filiale et une foundation jumelles.
 *  La création d'un Country Scope est atomique (Cloud Function transaction).
 *
 *  ISOLATION
 *  ─────────
 *  - HOLDING voit tous les country_scopes
 *  - Country_Director_Subsidiary voit UNIQUEMENT son country_scope ET sa
 *    filiale (jamais la foundation soeur).
 *  - Country_Director_Foundation voit UNIQUEMENT son country_scope ET sa
 *    foundation (jamais la filiale soeur).
 *
 *  Firestore : collection top-level `country_scopes/{country_id}`.
 *  Custom Claims propagés : { role, entity_type, entity_id, country_id }.
 * ════════════════════════════════════════════════════════════════════════════
 */

import { ENTITY_TYPES } from './org.schema';

// ── Catalogue des pays supportés ────────────────────────────────────────────
// Codes ISO 3166-1 alpha-2. Étendre librement.

export const SUPPORTED_COUNTRIES = Object.freeze([
  { code: 'CI',  name: 'Côte d\'Ivoire',     currency: 'XOF', timezone: 'Africa/Abidjan',      flag: '', dial: '+225' },
  { code: 'SN',  name: 'Sénégal',            currency: 'XOF', timezone: 'Africa/Dakar',        flag: '', dial: '+221' },
  { code: 'BF',  name: 'Burkina Faso',       currency: 'XOF', timezone: 'Africa/Ouagadougou',  flag: '', dial: '+226' },
  { code: 'ML',  name: 'Mali',               currency: 'XOF', timezone: 'Africa/Bamako',       flag: '', dial: '+223' },
  { code: 'TG',  name: 'Togo',               currency: 'XOF', timezone: 'Africa/Lome',         flag: '', dial: '+228' },
  { code: 'BJ',  name: 'Bénin',              currency: 'XOF', timezone: 'Africa/Porto-Novo',   flag: '', dial: '+229' },
  { code: 'GH',  name: 'Ghana',              currency: 'GHS', timezone: 'Africa/Accra',        flag: '', dial: '+233' },
  { code: 'NG',  name: 'Nigeria',            currency: 'NGN', timezone: 'Africa/Lagos',        flag: '', dial: '+234' },
  { code: 'CM',  name: 'Cameroun',           currency: 'XAF', timezone: 'Africa/Douala',       flag: '', dial: '+237' },
  { code: 'GA',  name: 'Gabon',              currency: 'XAF', timezone: 'Africa/Libreville',   flag: '', dial: '+241' },
  { code: 'MA',  name: 'Maroc',              currency: 'MAD', timezone: 'Africa/Casablanca',   flag: '', dial: '+212' },
  { code: 'TN',  name: 'Tunisie',            currency: 'TND', timezone: 'Africa/Tunis',        flag: '', dial: '+216' },
  { code: 'DZ',  name: 'Algérie',            currency: 'DZD', timezone: 'Africa/Algiers',      flag: '', dial: '+213' },
  { code: 'FR',  name: 'France',             currency: 'EUR', timezone: 'Europe/Paris',        flag: '', dial: '+33'  },
  { code: 'BE',  name: 'Belgique',           currency: 'EUR', timezone: 'Europe/Brussels',     flag: '', dial: '+32'  },
  { code: 'CH',  name: 'Suisse',             currency: 'CHF', timezone: 'Europe/Zurich',       flag: '', dial: '+41'  },
  { code: 'CA',  name: 'Canada',             currency: 'CAD', timezone: 'America/Toronto',     flag: '', dial: '+1'   },
  { code: 'US',  name: 'États-Unis',         currency: 'USD', timezone: 'America/New_York',    flag: '', dial: '+1'   },
  { code: 'AE',  name: 'Émirats Arabes Unis', currency: 'AED', timezone: 'Asia/Dubai',         flag: '', dial: '+971' },
]);

// ── États possibles d'un Country Scope ──────────────────────────────────────

export const COUNTRY_SCOPE_STATES = Object.freeze({
  DRAFT:       'DRAFT',        // créé par la Holding, pas encore provisioné
  PROVISIONING:'PROVISIONING', // CF en cours d'exécution
  ACTIVE:      'ACTIVE',       // filiale + foundation provisionnées
  SUSPENDED:   'SUSPENDED',    // gel temporaire (licence expirée, audit)
  ARCHIVED:    'ARCHIVED',     // décommissionné (lecture seule)
});

// ── Schéma d'un document country_scope ──────────────────────────────────────
//
// Firestore path : country_scopes/{country_code}
//
// {
//   country_id:       'SN',                              // PK (ISO 3166-1)
//   country_name:     'Sénégal',
//   currency:         'XOF',
//   timezone:         'Africa/Dakar',
//   flag:             '',
//   state:            'ACTIVE',
//   tenant_id:        'ipc_group',
//   holding_id:       'ipc_holding',
//   subsidiary_id:    'ipc_senegal',                     // entity_id de la filiale jumelle
//   foundation_id:    'ipc_foundation_senegal',          // entity_id de la foundation jumelle
//   licenses: {
//     subsidiary_plan: 'BUSINESS',
//     foundation_plan: 'FOUNDATION',
//   },
//   directors: {
//     subsidiary_uid: 'auth_uid_xxx',
//     foundation_uid: 'auth_uid_yyy',
//   },
//   provisioned_at:   Timestamp,
//   created_by:       'auth_uid_holding_admin',
//   activated_at:     Timestamp,
//   _audit: {
//     last_updated_at: Timestamp,
//     last_updated_by: 'auth_uid_xxx',
//   }
// }

export const COUNTRY_SCOPE_FIELDS_SCHEMA = Object.freeze({
  country_id:     String,
  country_name:   String,
  currency:       String,
  timezone:       String,
  flag:           String,
  state:          String,
  tenant_id:      String,
  holding_id:     String,
  subsidiary_id:  String,
  foundation_id:  String,
});

// ── Champs Firestore propagés sur TOUTES les ressources scope-aware ─────────
// Étend ENTITY_FIELDS_SCHEMA de org.schema.js. À utiliser par
// FirestoreService.setDocument() / TenantContext pour l'auto-injection.

export const SCOPE_FIELDS_SCHEMA = Object.freeze({
  tenant_id:     String,   // 'ipc_group'
  entity_type:   String,   // HOLDING | SUBSIDIARY | FOUNDATION
  entity_id:     String,   // ID de l'entité propriétaire
  country_id:    String,   // NEW — ISO 3166-1 alpha-2 (ex: 'CI', 'SN')
  branch_id:     String,   // sous-branche optionnelle
  department_id: String,   // département optionnel
});

// ── Helpers ─────────────────────────────────────────────────────────────────

export function getCountryByCode(code) {
  return SUPPORTED_COUNTRIES.find(c => c.code === code) || null;
}

export function isSupportedCountry(code) {
  return SUPPORTED_COUNTRIES.some(c => c.code === code);
}

/**
 * Construit les entity_id canoniques d'un nouveau Country Scope.
 * Convention : "ipc_<role>_<country_code_lower>"
 *
 * @example
 * buildEntityIds('SN') →
 *   { subsidiary_id: 'ipc_senegal', foundation_id: 'ipc_foundation_senegal' }
 */
export function buildEntityIds(countryCode) {
  const country = getCountryByCode(countryCode);
  if (!country) throw new Error(`Pays non supporté: ${countryCode}`);

  // Slug normalisé du nom du pays (sans accents, lowercase, underscores)
  const slug = country.name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  return {
    subsidiary_id: `ipc_${slug}`,
    foundation_id: `ipc_foundation_${slug}`,
  };
}

/**
 * Construit le nom human-readable des entités jumelles.
 */
export function buildEntityNames(countryCode) {
  const country = getCountryByCode(countryCode);
  if (!country) throw new Error(`Pays non supporté: ${countryCode}`);
  return {
    subsidiary_name: `IPC ${country.name}`,
    foundation_name: `IPC Foundation ${country.name}`,
  };
}

/**
 * Détermine si un user a la visibilité sur un country_scope donné.
 *
 *  - HOLDING / SUPER_ADMIN : voit tous les pays
 *  - COUNTRY_DIRECTOR_*    : voit uniquement son country_id
 *  - Subsidiary/Foundation roles : voit uniquement son country_id (via entity)
 *
 * @param {Object} user          - { role, entity_type, country_id }
 * @param {String} targetCountryId
 */
export function canSeeCountry(user, targetCountryId) {
  if (!user) return false;
  // Holding-level → tout voir
  if (user.entity_type === ENTITY_TYPES.HOLDING) return true;
  if (user.role === 'SUPER_ADMIN' || user.role === 'GROUP_AUDITOR') return true;
  // Local-level → uniquement son pays
  return user.country_id === targetCountryId;
}
