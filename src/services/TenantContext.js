/**
 * ════════════════════════════════════════════════════════════════
 * TENANT CONTEXT — Singleton d'isolation multi-tenant
 * ════════════════════════════════════════════════════════════════
 *
 * PROBLÈME RÉSOLU :
 * FirestoreService est un module statique sans accès au store Zustand.
 * Ce singleton agit comme un pont : BusinessContext le peuple après auth,
 * FirestoreService le lit pour injecter tenant_id + company_id dans
 * chaque document créé/modifié.
 *
 * PATTERN : Module Singleton (safe en ESM — initialisé une seule fois
 * au chargement, muté par setTenantContext).
 *
 * UTILISATION :
 *   // Dans BusinessContext, après auth :
 *   import { setTenantContext } from './services/TenantContext';
 *   setTenantContext({ tenant_id: 'ipc_group', company_id: 'IPC_CORE', branch_id: 'HQ' });
 *
 *   // Dans FirestoreService, automatiquement :
 *   import { getTenantContext } from './TenantContext';
 *   const ctx = getTenantContext(); // { tenant_id, company_id, branch_id }
 */

// ── Contexte interne (mutable, jamais exposé directement) ───────────────
let _tenantContext = {
  tenant_id:  'ipc_default',   // fallback sécurisé — pas de données partagées sans tenant
  company_id: null,
  branch_id:  null,
};

let _listeners = [];

// ── API publique ────────────────────────────────────────────────────────

/**
 * Peuple le contexte tenant après une auth réussie.
 * Appelé une seule fois par BusinessContext au login.
 * @param {{ tenant_id: string, company_id: string|null, branch_id: string|null }} ctx
 */
export function setTenantContext(ctx) {
  if (!ctx?.tenant_id) {
    console.warn('[TenantContext] tenant_id manquant — vérifier la configuration utilisateur.');
    return;
  }

  _tenantContext = {
    tenant_id:  ctx.tenant_id  || 'ipc_default',
    company_id: ctx.company_id || null,
    branch_id:  ctx.branch_id  || null,
  };

  // Notifier tous les listeners (ex: services qui cachent le contexte)
  _listeners.forEach(fn => fn(_tenantContext));

  if (import.meta.env.DEV) {
    console.info('[TenantContext] ✅ Contexte tenant défini :', _tenantContext);
  }
}

/**
 * Récupère le contexte tenant courant.
 * Retourne un objet snapshot (immuable pour l'appelant).
 * @returns {{ tenant_id: string, company_id: string|null, branch_id: string|null }}
 */
export function getTenantContext() {
  return { ..._tenantContext };
}

/**
 * Réinitialise le contexte à la déconnexion.
 */
export function clearTenantContext() {
  _tenantContext = {
    tenant_id:  'ipc_default',
    company_id: null,
    branch_id:  null,
  };
  _listeners.forEach(fn => fn(_tenantContext));
  if (import.meta.env.DEV) {
    console.info('[TenantContext] 🔒 Contexte tenant réinitialisé.');
  }
}

/**
 * S'abonne aux changements de contexte tenant.
 * @param {Function} fn
 * @returns {Function} unsubscribe
 */
export function onTenantContextChange(fn) {
  _listeners.push(fn);
  return () => {
    _listeners = _listeners.filter(l => l !== fn);
  };
}

/**
 * Retourne l'objet de champs tenant à injecter dans un document Firestore.
 * Filtre les valeurs null pour ne pas polluer les docs si company/branch non défini.
 * @returns {Object}
 */
export function getTenantFields() {
  const ctx = getTenantContext();
  const fields = { tenant_id: ctx.tenant_id };
  if (ctx.company_id) fields.company_id = ctx.company_id;
  if (ctx.branch_id)  fields.branch_id  = ctx.branch_id;
  return fields;
}
