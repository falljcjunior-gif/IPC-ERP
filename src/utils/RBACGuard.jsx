import React from 'react';
import { useStore } from '../store';

/**
 * ══════════════════════════════════════════════════════════════════
 * RBAC GUARD COMPONENT
 * ══════════════════════════════════════════════════════════════════
 * 
 * WHY: Centralisation de la logique de permission UI.
 * Permet de masquer dynamiquement des composants en fonction du rôle.
 */
/**
 * ══════════════════════════════════════════════════════════════════
 * PERMISSIONS DICTIONARY
 * ══════════════════════════════════════════════════════════════════
 */
export const PERMISSIONS = {
  MANAGE_FINANCE: ['FINANCE', 'MANAGER'],
  MANAGE_HR: ['HR', 'MANAGER'],
  MANAGE_PRODUCTION: ['PRODUCTION', 'MANAGER'],
  MANAGE_SALES: ['SALES', 'MANAGER'],
  MANAGE_LOGISTICS: ['LOGISTICS', 'MANAGER'],
  VIEW_AUDIT_LOGS: ['AUDIT', 'SECURITY']
};

export const RBACGuard = ({ roles = [], permission = null, children, fallback = null }) => {
  const userRole = useStore(state => state.userRole);

  // ADMIN et SUPER_ADMIN ont toujours accès
  if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
    return <>{children}</>;
  }

  const authorizedRoles = permission ? (PERMISSIONS[permission] || []) : roles;

  // Vérification de l'inclusion dans les rôles autorisés
  if (authorizedRoles.includes(userRole)) {
    return <>{children}</>;
  }

  return fallback;
};

/**
 * Hook pour vérification programmatique
 */
export const useRBAC = () => {
  const userRole = useStore(state => state.userRole);
  
  const hasAccess = (roles = []) => {
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') return true;
    return roles.includes(userRole);
  };

  return { userRole, hasAccess };
};
