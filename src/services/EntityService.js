/**
 * ════════════════════════════════════════════════════════════════════════════
 * ENTITY SERVICE — Group Entity Lifecycle Management
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Manages the full lifecycle of group entities (Subsidiaries + Foundations):
 *   create → provision → activate → operate → suspend → archive → delete
 *
 * SECURITY: Heavy operations (create, provision, delete) go through Cloud
 * Functions (callable) to ensure server-side auth validation. Read operations
 * use FirestoreService directly for real-time UI updates.
 *
 * PATTERN: Service singleton — import as named import, never instantiate.
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../firebase/config';
import { FirestoreService } from './firestore.service';
import { ENTITY_STATES, ENTITY_STATE_META } from '../schemas/license.schema';
import { ENTITY_TYPES } from '../schemas/org.schema';

const _functions = () => getFunctions(auth.app, 'europe-west1');

// ── Read Operations (real-time, direct Firestore) ─────────────────────────────

export const EntityService = {

  /**
   * Subscribe to all group entities in real-time.
   * @param {Function} callback - (entities[]) => void
   * @returns {Function} unsubscribe
   */
  subscribeToAll(callback) {
    return FirestoreService.subscribeToCollection(
      'organizations',
      { orderBy: [{ field: '_createdAt', direction: 'asc' }], limit: 100 },
      callback
    );
  },

  /**
   * Subscribe to entities of a specific type.
   * @param {'HOLDING'|'SUBSIDIARY'|'FOUNDATION'} type
   * @param {Function} callback
   * @returns {Function} unsubscribe
   */
  subscribeByType(type, callback) {
    return FirestoreService.subscribeToCollection(
      'organizations',
      {
        filters: [['type', '==', type]],
        orderBy: [{ field: 'name', direction: 'asc' }],
        limit: 100,
      },
      callback
    );
  },

  /**
   * Get entity license + quota data in real-time.
   * @param {string} entityId
   * @param {Function} callback
   * @returns {Function} unsubscribe
   */
  subscribeToLicense(entityId, callback) {
    return FirestoreService.subscribeToCollection(
      'entity_licenses',
      { filters: [['entity_id', '==', entityId]], limit: 1 },
      (docs) => callback(docs[0] || null)
    );
  },

  /**
   * Get all entity licenses at once (for Holding cockpit).
   * @param {Function} callback
   */
  subscribeToAllLicenses(callback) {
    return FirestoreService.subscribeToCollection(
      'entity_licenses',
      { limit: 100 },
      callback
    );
  },

  /**
   * Get usage metrics for an entity.
   */
  subscribeToUsage(entityId, callback) {
    return FirestoreService.subscribeToCollection(
      'entity_usage',
      { filters: [['entity_id', '==', entityId]], limit: 12 },
      callback
    );
  },

  // ── Write Operations (via Cloud Functions) ──────────────────────────────────

  /**
   * Create a new entity (Subsidiary or Foundation).
   * Cloud Function validates Holding role, provisions structure.
   *
   * @param {object} entityData
   * @param {string} entityData.type          - SUBSIDIARY | FOUNDATION
   * @param {string} entityData.name          - Entity name
   * @param {string} entityData.industry      - Industry sector
   * @param {string} entityData.country       - ISO country code
   * @param {string} entityData.currency      - ISO currency code
   * @param {string} entityData.timezone      - IANA timezone
   * @param {string[]} entityData.modules     - Module IDs to activate
   * @param {string} entityData.licensePlanId - LICENSE_PLAN_IDS value
   * @param {object} entityData.director      - { email, nom, prenom }
   * @param {string} entityData.autonomyLevel - 'full' | 'supervised' | 'restricted'
   * @returns {Promise<{ entityId: string, provisioningJobId: string }>}
   */
  async createEntity(entityData) {
    const fn = httpsCallable(_functions(), 'createGroupEntity');
    const result = await fn(entityData);
    return result.data;
  },

  /**
   * Update entity metadata (name, settings, modules).
   * @param {string} entityId
   * @param {object} updates
   */
  async updateEntity(entityId, updates) {
    const fn = httpsCallable(_functions(), 'updateGroupEntity');
    const result = await fn({ entityId, updates });
    return result.data;
  },

  /**
   * Change entity lifecycle state.
   * @param {string} entityId
   * @param {'ACTIVE'|'SUSPENDED'|'ARCHIVED'|'DELETED'} newState
   * @param {string} [reason] - Audit reason
   */
  async changeEntityState(entityId, newState, reason = '') {
    const fn = httpsCallable(_functions(), 'changeEntityState');
    const result = await fn({ entityId, newState, reason });
    return result.data;
  },

  /**
   * Assign a license plan to an entity.
   * @param {string} entityId
   * @param {string} planId
   * @param {object} [customQuotas] - Overrides for CUSTOM plans
   */
  async assignLicense(entityId, planId, customQuotas = {}) {
    const fn = httpsCallable(_functions(), 'assignEntityLicense');
    const result = await fn({ entityId, planId, customQuotas });
    return result.data;
  },

  /**
   * Request a quota upgrade from a subsidiary.
   * Sends to Holding approval queue.
   */
  async requestUpgrade(entityId, requestType, details) {
    await FirestoreService.createDocument('upgrade_requests', {
      entity_id:   entityId,
      requestType,
      details,
      status:      'pending',
      _subModule:  'upgrade_requests',
    });
  },

  /**
   * Approve a quota upgrade (Holding only).
   */
  async approveUpgrade(requestId, newPlanId, customQuotas = {}) {
    const fn = httpsCallable(_functions(), 'approveEntityUpgrade');
    const result = await fn({ requestId, newPlanId, customQuotas });
    return result.data;
  },

  /**
   * Duplicate an entity's structure (template-based creation).
   */
  async duplicateEntity(sourceEntityId, newEntityData) {
    const fn = httpsCallable(_functions(), 'duplicateGroupEntity');
    const result = await fn({ sourceEntityId, ...newEntityData });
    return result.data;
  },

  // ── Computed helpers ────────────────────────────────────────────────────────

  /**
   * Calculate a rough "health score" (0-100) for an entity based on:
   * - Configuration completeness
   * - License usage vs quota
   * - Recent activity
   * - Missing required setup
   */
  computeHealthScore(entity, license, usage) {
    let score = 100;
    // Missing director
    if (!entity.directorUid)      score -= 20;
    // Missing at least 1 employee
    if ((usage?.userCount || 0) < 2) score -= 10;
    // Missing logo
    if (!entity.logo)              score -= 5;
    // Approaching quota limits
    if (license && usage) {
      const userPct = license.maxUsers > 0
        ? (usage.userCount || 0) / license.maxUsers : 0;
      if (userPct > 0.9)           score -= 15;
      if (userPct > 1)             score -= 20;
    }
    // Suspended state
    if (entity.state === ENTITY_STATES.SUSPENDED) score -= 30;
    return Math.max(0, Math.min(100, score));
  },

  /**
   * Returns state metadata (color, label, icon) for display.
   */
  getStateMeta(state) {
    return ENTITY_STATE_META[state] || ENTITY_STATE_META[ENTITY_STATES.PENDING];
  },
};

export default EntityService;
