/**
 * useEntityContext — React hook for group entity awareness
 *
 * Reads the current entity context from TenantContext + user store
 * and exposes helper booleans / accessors for components to branch
 * their UI/logic by entity type and role.
 *
 * @example
 * const { isHolding, isFoundation, entityName, canSeeAllEntities } = useEntityContext();
 * if (isHolding) return <HoldingCockpit />;
 */

import { useMemo } from 'react';
import { useStore } from '../store';
import {
  ENTITY_TYPES,
  isHoldingRole,
  isFoundationRole,
  getEntityById,
  getSubsidiaries,
} from '../schemas/org.schema';
import { getTenantContext } from '../services/TenantContext';

export function useEntityContext() {
  const role       = useStore(s => s.userRole || s.user?.role);
  const userId     = useStore(s => s.user?.uid || s.user?.id);
  const userProfile = useStore(s => s.user);

  return useMemo(() => {
    const ctx     = getTenantContext();
    const entityId   = userProfile?.entity_id   || ctx.entity_id;
    const entityType = userProfile?.entity_type  || ctx.entity_type;
    const entityName = userProfile?.entity_name  || ctx.entity_name || 'IPC Group';

    const isHolding    = entityType === ENTITY_TYPES.HOLDING    || isHoldingRole(role);
    const isSubsidiary = entityType === ENTITY_TYPES.SUBSIDIARY && !isHoldingRole(role);
    const isFoundation = entityType === ENTITY_TYPES.FOUNDATION || isFoundationRole(role);

    // A user can "see all entities" if they have a Holding-level role
    const canSeeAllEntities = isHolding;

    // The entity object from the registry
    const entity = getEntityById(entityId);

    // Subsidiaries visible to this user
    const visibleSubsidiaries = isHolding ? getSubsidiaries() : (
      entity?.type === ENTITY_TYPES.SUBSIDIARY ? [entity] : []
    );

    return {
      // Type booleans
      isHolding,
      isSubsidiary,
      isFoundation,

      // Entity metadata
      entityId,
      entityType,
      entityName,
      entity,
      entityColor: entity?.color || '#2ecc71',
      entityIcon:  entity?.icon  || '🏢',

      // Permission helpers
      canSeeAllEntities,
      canConsolidate: isHolding,
      canApproveIntercompany: isHolding || role === 'HOLDING_CFO' || role === 'SUPER_ADMIN',

      // Visible entities
      visibleSubsidiaries,

      // Raw context
      tenantId: ctx.tenant_id,
      userId,
      role,
    };
  }, [role, userId, userProfile]);
}

export default useEntityContext;
