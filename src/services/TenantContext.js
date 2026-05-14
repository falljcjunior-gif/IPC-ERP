/**
 * ════════════════════════════════════════════════════════════════════════════
 * TENANT CONTEXT v2.0 — Group-Aware Entity Singleton
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Extended from v1 to support the 3-level group governance model:
 *   LEVEL 1 — HOLDING    (full group visibility)
 *   LEVEL 2 — SUBSIDIARY (scoped to one entity)
 *   LEVEL 3 — FOUNDATION (scoped to foundation entity)
 *
 * PATTERN : Module Singleton — safe in ESM, initialized once per session.
 * BusinessContext populates it after auth; FirestoreService reads from it
 * to auto-inject entity fields on every document write.
 *
 * USAGE:
 *   // BusinessContext — after auth:
 *   setTenantContext({
 *     tenant_id: 'ipc_group',
 *     entity_type: 'SUBSIDIARY',
 *     entity_id: 'ipc_green_blocks',
 *     entity_name: 'IPC Green Blocks',
 *     company_id: 'ipc_green_blocks',
 *     branch_id: null,
 *   });
 *
 *   // FirestoreService — auto-injected on createDocument/setDocument:
 *   const fields = getTenantFields();
 *   // → { tenant_id, entity_type, entity_id, company_id }
 */

import { ENTITY_TYPES } from '../schemas/org.schema';

// ── Internal state ────────────────────────────────────────────────────────────

let _ctx = {
  tenant_id:    'ipc_group',          // Group-level tenant ID
  entity_type:  ENTITY_TYPES.SUBSIDIARY, // Default — overridden post-auth
  entity_id:    'ipc_default',        // Overridden post-auth
  entity_name:  'IPC Group',          // Human-readable entity name
  company_id:   null,                 // Alias for entity_id (backward compat)
  branch_id:    null,                 // Optional sub-branch
};

let _listeners = [];

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Set the full tenant + entity context after successful auth.
 * Called by BusinessContext, never by components directly.
 *
 * @param {object} ctx
 * @param {string} ctx.tenant_id    - Group tenant ('ipc_group')
 * @param {string} ctx.entity_type  - HOLDING | SUBSIDIARY | FOUNDATION
 * @param {string} ctx.entity_id    - Entity ID from GROUP_ENTITIES
 * @param {string} ctx.entity_name  - Human-readable entity name
 * @param {string} [ctx.company_id] - Alias for entity_id
 * @param {string} [ctx.branch_id]  - Optional sub-branch
 */
export function setTenantContext(ctx) {
  if (!ctx?.tenant_id) {
    console.warn('[TenantContext] tenant_id manquant — vérifier la configuration utilisateur.');
    return;
  }

  _ctx = {
    tenant_id:   ctx.tenant_id   || 'ipc_group',
    entity_type: ctx.entity_type || ENTITY_TYPES.SUBSIDIARY,
    entity_id:   ctx.entity_id   || 'ipc_default',
    entity_name: ctx.entity_name || 'IPC Group',
    company_id:  ctx.company_id  || ctx.entity_id || null,
    branch_id:   ctx.branch_id   || null,
  };

  _listeners.forEach(fn => fn({ ..._ctx }));

  if (import.meta.env.DEV) {
    console.info('[TenantContext] ✅ Contexte groupe défini :', _ctx);
  }
}

/**
 * Get the current tenant + entity context.
 * Returns a snapshot (safe to spread).
 */
export function getTenantContext() {
  return { ..._ctx };
}

/**
 * Reset context on logout.
 */
export function clearTenantContext() {
  _ctx = {
    tenant_id:   'ipc_group',
    entity_type: ENTITY_TYPES.SUBSIDIARY,
    entity_id:   'ipc_default',
    entity_name: 'IPC Group',
    company_id:  null,
    branch_id:   null,
  };
  _listeners.forEach(fn => fn({ ..._ctx }));
  if (import.meta.env.DEV) {
    console.info('[TenantContext] 🔒 Contexte réinitialisé.');
  }
}

/**
 * Subscribe to context changes.
 * @param {Function} fn - callback(ctx)
 * @returns {Function} unsubscribe
 */
export function onTenantContextChange(fn) {
  _listeners.push(fn);
  return () => {
    _listeners = _listeners.filter(l => l !== fn);
  };
}

/**
 * Returns the Firestore fields to inject into every new document.
 * Filters nulls so we don't pollute docs with empty branch_id.
 *
 * All 5 entity fields are included:
 *   tenant_id, entity_type, entity_id, company_id, branch_id
 */
export function getTenantFields() {
  const fields = {
    tenant_id:   _ctx.tenant_id,
    entity_type: _ctx.entity_type,
    entity_id:   _ctx.entity_id,
    company_id:  _ctx.company_id || _ctx.entity_id,
  };
  if (_ctx.branch_id) fields.branch_id = _ctx.branch_id;
  return fields;
}

/**
 * Returns true if the current user session is at Holding level.
 * Holding users can see all entities.
 */
export function isHoldingSession() {
  return _ctx.entity_type === ENTITY_TYPES.HOLDING;
}

/**
 * Returns true if current session is at Foundation level.
 */
export function isFoundationSession() {
  return _ctx.entity_type === ENTITY_TYPES.FOUNDATION;
}

/**
 * Returns current entity_id (used for Firestore query scoping).
 */
export function getCurrentEntityId() {
  return _ctx.entity_id;
}

/**
 * Returns current entity_type.
 */
export function getCurrentEntityType() {
  return _ctx.entity_type;
}
