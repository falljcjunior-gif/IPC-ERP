/**
 * ════════════════════════════════════════════════════════════════════════════
 * LICENSE SERVICE — Client-Side License Enforcement
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Provides license-gating at the UI layer. Backend enforcement is handled by
 * Cloud Functions and Firestore Rules. This service ensures:
 *   • Menus/modules not shown if not licensed
 *   • Feature flags respected in components
 *   • Quota limits surfaced before write attempts
 *   • Upgrade prompts triggered at thresholds
 *
 * PATTERN: Singleton service + React hook (useLicense).
 */

import { FirestoreService } from './firestore.service';
import { getTenantContext } from './TenantContext';
import {
  LICENSE_PLANS,
  isModuleEnabled,
  isFeatureEnabled,
  getQuotaStatus,
  QUOTA_THRESHOLDS,
  ENTITY_STATES,
} from '../schemas/license.schema';

// ── In-memory license cache (refreshed on subscription) ──────────────────────

let _licenseCache = {};        // entityId → license doc
let _usageCache = {};          // entityId → usage doc
let _cacheListeners = [];

function _notifyListeners() {
  _cacheListeners.forEach(fn => fn({ ..._licenseCache }));
}

// ── LicenseService API ────────────────────────────────────────────────────────

export const LicenseService = {

  /**
   * Initialize license subscription for the current session entity.
   * Called by BusinessContext after auth.
   * @returns {Function} unsubscribe
   */
  init() {
    const { entity_id } = getTenantContext();
    if (!entity_id) return () => {};

    // Subscribe to this entity's license
    const unsubLicense = FirestoreService.subscribeToCollection(
      'entity_licenses',
      { filters: [['entity_id', '==', entity_id]], limit: 1 },
      (docs) => {
        _licenseCache[entity_id] = docs[0] || null;
        _notifyListeners();
      }
    );

    // Subscribe to usage metrics
    const unsubUsage = FirestoreService.subscribeToCollection(
      'entity_usage',
      { filters: [['entity_id', '==', entity_id]], limit: 1 },
      (docs) => {
        _usageCache[entity_id] = docs[0] || null;
        _notifyListeners();
      }
    );

    return () => {
      unsubLicense();
      unsubUsage();
    };
  },

  /**
   * Subscribe to license cache changes.
   * Used by the useLicense hook.
   */
  subscribe(fn) {
    _cacheListeners.push(fn);
    return () => {
      _cacheListeners = _cacheListeners.filter(l => l !== fn);
    };
  },

  /**
   * Get the license plan object for an entity.
   * Returns the full plan definition merged with entity-specific overrides.
   */
  getLicense(entityId) {
    const entityId_ = entityId || getTenantContext().entity_id;
    const licenseDoc = _licenseCache[entityId_];
    if (!licenseDoc) return null;
    const basePlan = LICENSE_PLANS[licenseDoc.planId] || null;
    if (!basePlan) return null;
    // Merge custom quota overrides
    return {
      ...basePlan,
      ...(licenseDoc.customQuotas || {}),
      planId:      licenseDoc.planId,
      entityId:    entityId_,
      assignedAt:  licenseDoc.assignedAt,
      expiresAt:   licenseDoc.expiresAt || null,
      state:       licenseDoc.state || ENTITY_STATES.ACTIVE,
    };
  },

  /**
   * Check if a module is enabled for the current entity.
   * Fast synchronous check using the cache.
   * @param {string} moduleId
   * @param {string} [entityId] - defaults to current entity
   */
  isModuleEnabled(moduleId, entityId) {
    const plan = this.getLicense(entityId);
    return isModuleEnabled(plan, moduleId);
  },

  /**
   * Check if a feature flag is enabled.
   * @param {string} featureKey - e.g. 'bi', 'automations', 'sso'
   * @param {string} [entityId]
   */
  isFeatureEnabled(featureKey, entityId) {
    const plan = this.getLicense(entityId);
    return isFeatureEnabled(plan, featureKey);
  },

  /**
   * Get quota status for a specific resource.
   * @param {string} quotaKey - 'users', 'projects', 'storage', etc.
   * @param {string} [entityId]
   * @returns {{ pct: number, status: 'ok'|'warning'|'critical'|'exceeded'|'unlimited', used: number, max: number }}
   */
  getQuotaStatus(quotaKey, entityId) {
    const entityId_ = entityId || getTenantContext().entity_id;
    const plan  = this.getLicense(entityId_);
    const usage = _usageCache[entityId_];

    if (!plan) return { pct: 0, status: 'ok', used: 0, max: 0 };

    const quotaMap = {
      users:     { used: usage?.userCount     || 0, max: plan.maxUsers     },
      storage:   { used: usage?.storageMB     || 0, max: plan.maxStorageMB },
      projects:  { used: usage?.projectCount  || 0, max: plan.maxProjects  },
      workflows: { used: usage?.workflowCount || 0, max: plan.maxWorkflows },
      aiTokens:  { used: usage?.aiTokensUsed  || 0, max: plan.aiTokensMonthly },
      apiCalls:  { used: usage?.apiCallsUsed  || 0, max: plan.apiCallsMonthly },
      campaigns: { used: usage?.campaignCount || 0, max: plan.maxCampaigns },
      documents: { used: usage?.documentCount || 0, max: plan.maxDocuments },
    };

    const q = quotaMap[quotaKey];
    if (!q) return { pct: 0, status: 'ok', used: 0, max: 0 };

    const { pct, status } = getQuotaStatus(q.used, q.max);
    return { pct, status, used: q.used, max: q.max };
  },

  /**
   * Returns true if the entity can create a new resource of the given type.
   * Use before any write operation to provide user-facing feedback.
   */
  canCreate(resourceType, entityId) {
    const quota = this.getQuotaStatus(resourceType, entityId);
    return quota.status !== 'exceeded';
  },

  /**
   * Returns the suspension status of an entity.
   * If suspended, all write operations should be blocked.
   */
  isEntitySuspended(entityId) {
    const plan = this.getLicense(entityId);
    return plan?.state === ENTITY_STATES.SUSPENDED;
  },

  /**
   * Get all licenses (Holding-level view).
   */
  getAllLicenses() {
    return { ..._licenseCache };
  },

  /**
   * Reset cache on logout.
   */
  reset() {
    _licenseCache = {};
    _usageCache = {};
    _notifyListeners();
  },
};

export default LicenseService;
