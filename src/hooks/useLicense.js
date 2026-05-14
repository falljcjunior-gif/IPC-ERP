/**
 * useLicense — React hook for license-gated features
 *
 * Provides reactive access to the current entity's license state.
 * Wraps LicenseService with React's useSyncExternalStore for safe
 * concurrent-mode rendering.
 *
 * @example
 * const { isModuleEnabled, isFeatureEnabled, getQuota } = useLicense();
 *
 * if (!isModuleEnabled('bi')) return <UpgradePrompt module="BI" />;
 * if (!isFeatureEnabled('automations')) return null;
 *
 * const { pct, status } = getQuota('users');
 * <QuotaBar pct={pct} status={status} />
 */

import { useSyncExternalStore, useCallback } from 'react';
import { LicenseService } from '../services/LicenseService';
import { getTenantContext } from '../services/TenantContext';

export function useLicense(entityId) {

  // Subscribe to license cache
  const subscribe   = useCallback((cb) => LicenseService.subscribe(cb), []);
  const getSnapshot = useCallback(() => LicenseService.getAllLicenses(), []);
  const getServer   = useCallback(() => ({}), []);

  useSyncExternalStore(subscribe, getSnapshot, getServer);

  const resolvedEntityId = entityId || getTenantContext().entity_id;

  return {
    /** Full license plan object (null if not loaded) */
    license: LicenseService.getLicense(resolvedEntityId),

    /** Check if a module is enabled */
    isModuleEnabled: (moduleId) => LicenseService.isModuleEnabled(moduleId, resolvedEntityId),

    /** Check if an advanced feature is enabled */
    isFeatureEnabled: (featureKey) => LicenseService.isFeatureEnabled(featureKey, resolvedEntityId),

    /** Get quota info for a resource type */
    getQuota: (quotaKey) => LicenseService.getQuotaStatus(quotaKey, resolvedEntityId),

    /** Returns true if a new resource of this type can be created */
    canCreate: (resourceType) => LicenseService.canCreate(resourceType, resolvedEntityId),

    /** Returns true if entity is suspended */
    isSuspended: LicenseService.isEntitySuspended(resolvedEntityId),
  };
}

/**
 * Gate component — renders children only if module is enabled.
 * Shows upgrade prompt or null otherwise.
 *
 * @example
 * <LicenseGate module="bi" fallback={<UpgradePrompt />}>
 *   <BIHub />
 * </LicenseGate>
 */
export function LicenseGate({ module: moduleId, feature, entityId, fallback = null, children }) {
  const { isModuleEnabled, isFeatureEnabled } = useLicense(entityId);

  if (moduleId  && !isModuleEnabled(moduleId))   return fallback;
  if (feature   && !isFeatureEnabled(feature))    return fallback;
  return children;
}

export default useLicense;
