/**
 * ══════════════════════════════════════════════════════════════
 * ROLE GUARD — Enterprise RBAC Enforcement Layer
 * ══════════════════════════════════════════════════════════════
 *
 * Single source of truth for role hierarchy and mutation rules.
 * All Cloud Functions that touch user roles MUST go through this module.
 *
 * Zero-Trust principle: deny by default, allow explicitly.
 */

const { HttpsError } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');

// ── Role hierarchy (higher index = more privilege) ───────────────────────────
const ROLE_RANK = {
  GUEST:                    0,
  EMPLOYEE:                 1,
  STAFF:                    1,
  SALES:                    2,
  LOGISTICS:                2,
  PRODUCTION:               2,
  LEGAL:                    2,
  AUDIT:                    2,
  CRM:                      2,
  FINANCE:                  3,
  HR:                       3,
  MANAGER:                  4,
  HR_MANAGER:               4,
  DIRECTOR:                 5,
  FOUNDATION_STAFF:         2,
  FOUNDATION_MANAGER:       4,
  FOUNDATION_DG:            5,
  FOUNDATION_AUDITOR:       3,
  SUBSIDIARY_STAFF:         2,
  SUBSIDIARY_MANAGER:       4,
  SUBSIDIARY_RH:            4,
  SUBSIDIARY_CFO:           5,
  SUBSIDIARY_DG:            5,
  COUNTRY_HR:               3,
  COUNTRY_FINANCE:          3,
  COUNTRY_OPERATIONS:       3,
  COUNTRY_AUDITOR:          3,
  COUNTRY_DIRECTOR_SUBSIDIARY: 5,
  COUNTRY_DIRECTOR_FOUNDATION: 5,
  HOLDING_LEGAL:            6,
  HOLDING_AUDITOR:          6,
  HOLDING_CHRO:             7,
  HOLDING_CSO:              7,
  HOLDING_CTO:              7,
  HOLDING_CFO:              8,
  GROUP_AUDITOR:            8,
  ADMIN:                    8,
  HOLDING_CEO:              9,
  SUPER_ADMIN:              10,
};

// Roles that require SUPER_ADMIN to modify (cannot be touched by ADMIN or below)
const IMMUTABLE_ROLES = new Set(['SUPER_ADMIN', 'HOLDING_CEO', 'GROUP_AUDITOR']);

// Roles that can perform role assignment operations
const ROLE_ASSIGNERS = new Set(['SUPER_ADMIN', 'ADMIN', 'HOLDING_CEO']);

/**
 * Verify that `callerRole` is allowed to assign `targetNewRole` to a user
 * whose current role is `targetCurrentRole`.
 *
 * Rules:
 *  1. Caller must be in ROLE_ASSIGNERS.
 *  2. Caller cannot assign a role of higher rank than their own.
 *  3. Only SUPER_ADMIN can modify a user whose current role is in IMMUTABLE_ROLES.
 *  4. Caller cannot demote a user from IMMUTABLE_ROLES via updateUserPermissions —
 *     must use setUserRole (which has additional safety checks).
 *
 * @param {string} callerRole
 * @param {string} targetCurrentRole  Current role of the user being modified
 * @param {string|null} targetNewRole New role to assign (null = no change)
 * @param {string} callerUid          For audit logging
 * @param {string} targetUid          For audit logging
 * @throws {HttpsError} if the operation is not permitted
 */
function assertCanModifyRole(callerRole, targetCurrentRole, targetNewRole, callerUid = '?', targetUid = '?') {
  if (!ROLE_ASSIGNERS.has(callerRole)) {
    logger.warn(`[RoleGuard] ${callerUid} (${callerRole}) not in ROLE_ASSIGNERS — blocked`);
    throw new HttpsError('permission-denied',
      `Le rôle ${callerRole} n'est pas autorisé à modifier les rôles utilisateurs.`);
  }

  const callerRank = ROLE_RANK[callerRole] ?? -1;
  const targetCurrentRank = ROLE_RANK[targetCurrentRole] ?? 0;

  // Rule 3: Only SUPER_ADMIN can touch IMMUTABLE_ROLES holders
  if (IMMUTABLE_ROLES.has(targetCurrentRole) && callerRole !== 'SUPER_ADMIN') {
    logger.warn(`[RoleGuard] ${callerUid} (${callerRole}) attempted to modify ${targetUid} (${targetCurrentRole}) — blocked`);
    throw new HttpsError('permission-denied',
      `Le rôle ${targetCurrentRole} est protégé. Seul un SUPER_ADMIN peut le modifier.`);
  }

  if (targetNewRole) {
    const targetNewRank = ROLE_RANK[targetNewRole] ?? 0;

    // Rule 2: Cannot assign a role higher than your own
    if (targetNewRank > callerRank) {
      logger.warn(`[RoleGuard] ${callerUid} (rank ${callerRank}) attempted to assign ${targetNewRole} (rank ${targetNewRank}) — blocked`);
      throw new HttpsError('permission-denied',
        `Vous ne pouvez pas attribuer un rôle de niveau supérieur au vôtre (${callerRole}).`);
    }

    // Rule 4: Use setUserRole for changes involving IMMUTABLE_ROLES
    if (IMMUTABLE_ROLES.has(targetCurrentRole) && targetNewRole !== targetCurrentRole) {
      logger.warn(`[RoleGuard] Demotion of ${targetCurrentRole} → ${targetNewRole} must go through setUserRole — blocked`);
      throw new HttpsError('permission-denied',
        `La modification du rôle ${targetCurrentRole} doit passer par setUserRole, pas updateUserPermissions.`);
    }
  }
}

/**
 * Validate that a role string is in the known enterprise roles list.
 * Returns the role unchanged if valid, throws otherwise.
 */
function assertValidRole(role) {
  if (!Object.prototype.hasOwnProperty.call(ROLE_RANK, role)) {
    throw new HttpsError('invalid-argument', `Rôle inconnu : "${role}". Utilisez un rôle valide.`);
  }
  return role;
}

/**
 * Returns true if the given role is immutable (requires SUPER_ADMIN for any change).
 */
function isImmutableRole(role) {
  return IMMUTABLE_ROLES.has(role);
}

/**
 * Returns the numeric rank of a role (useful for hierarchy comparisons).
 */
function getRoleRank(role) {
  return ROLE_RANK[role] ?? -1;
}

module.exports = {
  ROLE_RANK,
  IMMUTABLE_ROLES,
  ROLE_ASSIGNERS,
  assertCanModifyRole,
  assertValidRole,
  isImmutableRole,
  getRoleRank,
};
