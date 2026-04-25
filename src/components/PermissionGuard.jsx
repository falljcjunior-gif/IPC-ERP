import React from 'react';
import { useStore } from '../store';

/**
 * 🔒 IPC PERMISSION GUARD
 * Wraps content to ensure users only see what they are authorized for.
 * 
 * Usage:
 * <PermissionGuard module="finance" level="write" fallback={<ReadOnlyMessage />}>
 *    <Button>Save Ledger</Button>
 * </PermissionGuard>
 */
const PermissionGuard = ({ 
  module, 
  level = 'read', 
  fallback = null, 
  children 
}) => {
  const hasPermission = useStore(state => state.hasPermission);
  const userRole = useStore(state => state.userRole);

  // Super Admins bypass all guards
  if (userRole === 'SUPER_ADMIN') {
    return <>{children}</>;
  }

  const allowed = hasPermission(module, level);

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default PermissionGuard;
