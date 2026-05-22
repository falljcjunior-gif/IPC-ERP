import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth, firebaseConfig, db as firestoreDb, app } from '../../firebase/config';
import { FirestoreService, serverTimestamp } from '../../services/firestore.service';
import {
  ACTIONS, hasAction as rbacHasAction,
  getAccessLevelFromPermissions, getDefaultPermissionsForRole,
} from '../../schemas/permissions.schema';

import { registry } from '../../services/Registry';

export const createAdminSlice = (set, get) => ({

  // ─────────────────────────────────────────────────────────────────────────
  // ENTITY CONTEXT RESET
  // Vide toutes les données métier du store quand le contexte d'entité change.
  // Appelé par BusinessContext après setTenantContext().
  // ─────────────────────────────────────────────────────────────────────────
  resetEntityData: () => {
    set(state => ({
      data: {
        ...state.data,
        // Collections métier — vidées pour forcer le rechargement depuis Firestore
        employees: [],
        hr:         { employees: [], candidates: [], leaves: [], timesheets: [] },
        finance:    { invoices: [], transactions: [], budgets: [] },
        accounting: { entries: [], accounts: [] },
        sales:      { quotes: [], orders: [], invoices: [] },
        crm:        { contacts: [], deals: [], activities: [] },
        inventory:  { products: [], movements: [], warehouses: [] },
        production: { orders: [], bom: [] },
        projects:   { projects: [], tasks: [] },
        fleet:      { vehicles: [], trips: [] },
        payroll:    { runs: [], bulletins: [] },
        // KPIs & dashboards consolidés
        kpis:       {},
        dashboards: {},
        // Notifications — rechargées avec entity_id correct
        notifications: [],
      },
      // Vider le cache de permissions chargé pour cette entité
      permissions: {},
    }));
  },

  // ─────────────────────────────────────────────────────────────────────────
  // hasAction — Vérification d'action granulaire (9 types)
  // ─────────────────────────────────────────────────────────────────────────
  /**
   * Vérifie si l'utilisateur courant peut effectuer une action précise sur un module.
   * Exemple : hasAction('hr', ACTIONS.DELETE) → false pour un Manager
   *
   * @param {string} moduleId
   * @param {string} action   — ACTIONS.VIEW | ACTIONS.CREATE | ACTIONS.EDIT | ...
   * @returns {boolean}
   */
  hasAction: (moduleId, action) => {
    const { user, userRole, permissions } = get();
    if (!moduleId || !action) return false;

    // Super Admin — accès absolu
    if (userRole === 'SUPER_ADMIN') return true;

    // [3-SPACE ISOLATION] vérifier compatibilité module / entity_type
    try {
      const mod = registry?.getModule?.(moduleId);
      if (mod?.entityTypes?.length > 0) {
        const userEntityType = user?.entity_type || 'SUBSIDIARY';
        if (!mod.entityTypes.includes(userEntityType)) return false;
      }
    } catch { /* registry pas prêt */ }

    const userPerms = permissions[user?.id];

    // 1. Nouveau schéma permissions.schema.js
    if (userPerms?.modules?.[moduleId]) {
      return rbacHasAction(userPerms, moduleId, action);
    }

    // 2. Fallback : dériver depuis le niveau legacy read/write
    const legacyAccess = _legacyGetAccess(get, user?.id, moduleId);
    if (legacyAccess === 'none') return false;
    if (legacyAccess === 'read') {
      return action === ACTIONS.VIEW || action === ACTIONS.EXPORT;
    }
    if (legacyAccess === 'write') {
      // write = tous sauf APPROVE / ADMIN (réservés aux Directeurs)
      const hierarchyLevel = userPerms?.hierarchy_level || 'Employee';
      const restrictedForEmployee = [ACTIONS.APPROVE, ACTIONS.ADMIN, ACTIONS.SUPERVISE];
      if (hierarchyLevel === 'Employee' && restrictedForEmployee.includes(action)) return false;
      return true;
    }
    return false;
  },


  updateUserPermissions: async (userId, permissions, role) => {
    try {
      const functions = getFunctions(app, 'europe-west1');
      const updateFn = httpsCallable(functions, 'updateUserPermissions');
      await updateFn({
        uid: userId,
        permissions,
        role: role || (Array.isArray(permissions?.roles) ? permissions.roles[0] : undefined),
        hierarchy_level: permissions?.hierarchy_level
      });

      set(state => ({
        permissions: { ...state.permissions, [userId]: permissions }
      }));

      // Si l'utilisateur modifie ses propres permissions, force le refresh des claims
      if (auth.currentUser?.uid === userId) {
        const { UserService } = await import('../../services/user.service');
        await UserService.forceClaimRefresh(auth.currentUser);
      }

      get().addHint({
        title: "Permissions Mises à Jour",
        message: "Les nouveaux droits ont été appliqués avec succès.",
        type: 'success'
      });
    } catch (err) {
      console.error("Erreur updatePermissions:", err);
      get().addHint({
        title: "Erreur Gouvernance",
        message: err.message || "Impossible de mettre à jour les droits.",
        type: 'danger'
      });
      throw err;
    }
  },

  updateUserRole: async (userId, newRole) => {
    const userPerms = get().permissions[userId] || { roles: [], moduleAccess: {} };
    const newPerms = { ...userPerms, roles: [newRole] };
    try {
      const functions = getFunctions(app, 'europe-west1');
      const updateFn = httpsCallable(functions, 'updateUserPermissions');
      await updateFn({ uid: userId, role: newRole, permissions: newPerms });
      set(state => ({ permissions: { ...state.permissions, [userId]: newPerms } }));
      if (auth.currentUser?.uid === userId) {
        const { UserService } = await import('../../services/user.service');
        await UserService.forceClaimRefresh(auth.currentUser);
      }
    } catch (err) {
      console.error("Erreur save role:", err);
      get().addHint({
        title: "Échec mise à jour rôle",
        message: err.message || "Impossible de modifier le rôle.",
        type: 'danger'
      });
      throw err;
    }
  },

  setModuleAccessLevel: async (userId, moduleId, level) => {
    const userPerms = get().permissions[userId] || { roles: [], moduleAccess: {} };
    const newModuleAccess = { ...(userPerms.moduleAccess || {}) };
    if (level === 'none') delete newModuleAccess[moduleId];
    else newModuleAccess[moduleId] = level;
    const newPerms = { ...userPerms, moduleAccess: newModuleAccess };
    if (newPerms.allowedModules) delete newPerms.allowedModules;

    try {
      const functions = getFunctions(app, 'europe-west1');
      const updateFn = httpsCallable(functions, 'updateUserPermissions');
      await updateFn({ uid: userId, permissions: newPerms });
      set(state => ({ permissions: { ...state.permissions, [userId]: newPerms } }));
      if (auth.currentUser?.uid === userId) {
        const { UserService } = await import('../../services/user.service');
        await UserService.forceClaimRefresh(auth.currentUser);
      }
    } catch (err) {
      console.error("Erreur save permissions:", err);
      get().addHint({
        title: "Échec mise à jour accès",
        message: err.message || "Impossible de modifier l'accès au module.",
        type: 'danger'
      });
      throw err;
    }
  },

  getModuleAccess: (userId, moduleId) => {
    return _legacyGetAccess(get, userId, moduleId);
  },

  /** 
   * NEW: Check if a specific sub-tab of a module is visible to the user.
   * If the module access is 'write' and no specific subTab restriction exists, return true.
   */
  canSeeSubTab: (moduleId, tabId) => {
    const { user, permissions, getModuleAccess } = get();
    if (user?.role === 'SUPER_ADMIN') return true;

    const access = getModuleAccess(user?.id, moduleId);
    if (access === 'none') return false;

    const userPerms = permissions[user?.id];
    if (userPerms?.modules?.[moduleId]?.subTabs) {
      const tabAccess = userPerms.modules[moduleId].subTabs[tabId];
      // If explicitly set to false, deny. If true, allow.
      if (tabAccess === false) return false;
      if (tabAccess === true) return true;
    }

    // Default: if you can see the module, you see all tabs unless restricted
    return true;
  },

  canSeeField: (appId, fieldName) => {
    const { user, userRole, getModuleAccess } = get();
    if (userRole === 'SUPER_ADMIN') return true;

    const schema = registry.getSchema(appId);
    const modelKeys = Object.keys(schema?.models || {});
    
    // Find field def in any model of this app
    let fieldDef = null;
    for (const mk of modelKeys) {
      if (schema.models[mk].fields[fieldName]) {
        fieldDef = schema.models[mk].fields[fieldName];
        break;
      }
    }

    if (!fieldDef?.sensitive) return true;

    // Sensitive field: Must have 'write' (ADMIN level) access to the module
    const access = getModuleAccess(user?.id, appId);
    return access === 'write';
  },

  /**
   * HR 2.0: Atomic Provisioning via Cloud Function
   * Replaces legacy secondaryApp + manual document creation
   */
  createFullUser: async (userData) => {
    try {
      const functions = getFunctions(app, 'europe-west1');
      const provisionFunc = httpsCallable(functions, 'provisionUser');
      
      const result = await provisionFunc({
        email: userData.email,
        password: userData.password,
        nom: userData.nom,
        // [ROLE SIMPLIFICATION] Default to EMPLOYEE (GUEST role retired)
        role: userData.role || 'EMPLOYEE',
        poste: userData.poste,
        dept: userData.dept,
        salaire: userData.salaire,
        contratType: userData.contratType,
        date_entree: userData.date_entree,
        permissions: userData.permissions || {
          roles: [userData.role || 'EMPLOYEE'],
          allowedModules: ['home'],
          moduleAccess: { home: 'write' }
        }
      });

      get().addHint({ 
        title: "Compte Créé", 
        message: `L'utilisateur ${userData.email} a été provisionné avec succès.`, 
        type: 'success' 
      });

      return result.data;
    } catch (err) {
      console.error("Erreur provisioning:", err);
      get().addHint({ 
        title: "Échec Création", 
        message: err.message || "Une erreur est survenue lors du provisionnement.", 
        type: 'danger' 
      });
      throw err;
    }
  },


  toggleUserStatus: async (userId, activeStatus) => {
    const uid = String(userId);
    try {
      if (auth.currentUser) {
        // [P0 FIX 2026-05-22] Stop writing to legacy /hr collection — only /users is canonical.
        // The /hr collection is fed by deprecated migration scripts (fix_users_from_hr.js,
        // final_fix.js) that reverse-sync stale data into /users with role='GUEST',
        // silently reverting role migrations and creating phantom user records.
        await FirestoreService.setDocument('users', uid, { profile: { active: activeStatus } }, true);
      }
      get().logAction(activeStatus ? 'Réactivation Utilisateur' : 'Désactivation Utilisateur', `ID: ${uid}`, 'system');
      return { success: true };
    } catch (e) {
      console.error("toggleUserStatus error:", e);
      throw e;
    }
  },

  permanentlyDeleteUserRecord: async (userId) => {
    const uid = String(userId);
    try {
      // Force-refresh the Firebase ID token so the CF receives up-to-date
      // custom claims (role, entity_type, entity_id) — avoids stale-token
      // permission-denied errors after a role change without re-login.
      const currentUser = auth.currentUser;
      if (currentUser) await currentUser.getIdToken(true);

      const functions = getFunctions(app, 'europe-west1');
      const deleteUserFunc = httpsCallable(functions, 'deleteUserAccount');

      // The Cloud Function performs a HARD delete on Auth + Firestore.
      // If the CF succeeds, the Firestore document is already gone.
      // If the CF partially fails (Auth deleted but Firestore batch failed),
      // the client-side soft-delete below acts as a safety net.
      let cfSuccess = false;
      try {
        await deleteUserFunc({ uid });
        cfSuccess = true;
      } catch (cfErr) {
        // Re-throw non-permission errors (internal errors, etc.)
        if (cfErr?.code !== 'functions/permission-denied') throw cfErr;
        // permission-denied: CF can't delete Auth token — fall through to
        // Firestore-only soft-delete so the ghost doesn't linger in the UI.
        console.warn(`[permanentlyDeleteUserRecord] CF permission-denied for ${uid} — applying Firestore soft-delete only.`);
      }

      // Firestore safety net: soft-delete the users/{uid} document so it
      // disappears from all active subscriptions even if the CF couldn't run.
      if (!cfSuccess) {
        try {
          await FirestoreService.updateDocument('users', uid, {
            _deletedAt: serverTimestamp(),
            _deletedBy: auth.currentUser?.uid || 'client',
          });
        } catch (fsErr) {
          console.error('[permanentlyDeleteUserRecord] Firestore soft-delete failed:', fsErr.message);
          // Best-effort: if this also fails, at least clear the local store below.
        }
      }

      // Immediate UI update: remove from every store slice
      set(state => ({
        data: {
          ...state.data,
          employees: (state.data.employees || []).filter(e => String(e.id) !== uid),
          hr: { ...state.data.hr, employees: (state.data.hr?.employees || []).filter(e => String(e.id) !== uid) },
          base: { ...state.data.base, users: (state.data.base?.users || []).filter(u => String(u.id) !== uid) }
        },
        permissions: (() => { const next = { ...state.permissions }; delete next[uid]; return next; })()
      }));

      get().addHint({
        title: cfSuccess ? "Compte Supprimé" : "Compte masqué",
        message: cfSuccess
          ? "L'utilisateur a été définitivement supprimé d'Auth et de la base de données."
          : "L'utilisateur a été masqué de l'application. La suppression Auth sera finalisée par un administrateur.",
        type: 'success',
      });

      get().logAction('Suppression Définitive Utilisateur', `ID: ${uid} — CF: ${cfSuccess}`, 'system');
      return { success: true };

    } catch (err) {
      console.error("Erreur suppression complète:", err);
      get().addHint({
        title: "Suppression Échouée",
        message: err.message || "Une erreur est survenue lors de la suppression définitive.",
        type: 'danger'
      });
      throw err;
    }
  },

  triggerManualBackup: async () => {
    try {
      const functions = getFunctions(app, 'europe-west1');
      const backupFunc = httpsCallable(functions, 'manualFirestoreExport');
      const result = await backupFunc();
      
      get().addHint({ 
        title: "Sauvegarde Lancée", 
        message: `L'opération de backup ${result.data.operationName} a démarré sur le bucket ${result.data.bucket}.`, 
        type: 'success' 
      });
      return result.data;
    } catch (err) {
      console.error("Erreur déclenchement Backup:", err);
      get().addHint({ 
        title: "Échec du Backup", 
        message: err.message || "Une erreur est survenue lors du lancement de la sauvegarde.", 
        type: 'danger' 
      });
      throw err;
    }
  },

  syncAllAccounts: async () => {
    try {
      const functions = getFunctions(app, 'europe-west1');
      const backfillFunc = httpsCallable(functions, 'backfillUsers');
      const result = await backfillFunc();
      
      const msg = result.data.message || "La synchronisation des comptes a été effectuée.";
      get().addHint({ 
        title: "Synchronisation Terminée", 
        message: `${msg} (${result.data.createdUsers || 0} créés, ${result.data.patched || 0} mis à jour).`, 
        type: 'success' 
      });
      return result.data;
    } catch (err) {
      console.error("Erreur Synchronisation:", err);
      get().addHint({ 
        title: "Échec de Synchronisation",
        message: err.message || "Une erreur est survenue lors de la synchronisation des comptes.",
        type: 'danger'
      });
      throw err;
    }
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPER — résolution d'accès multi-schéma
// Supporte le nouveau schéma permissions.schema.js ET les 3 formats legacy.
// Appelé par getModuleAccess() et hasAction().
// ─────────────────────────────────────────────────────────────────────────────
function _legacyGetAccess(get, userId, moduleId) {
  const { user, userRole, permissions } = get();

  if (userRole === 'SUPER_ADMIN') return 'write';
  if (moduleId === 'home') return 'write';

  try {
    const mod = registry?.getModule?.(moduleId);
    if (mod?.entityTypes?.length > 0) {
      const userEntityType = user?.entity_type || 'SUBSIDIARY';
      if (!mod.entityTypes.includes(userEntityType)) return 'none';
    }
  } catch { /* registry pas prêt */ }

  const userPerms = permissions[userId];

  // ── 1. Nouveau schéma enterprise (permissions.schema.js) ────────────────
  if (userPerms?.modules?.[moduleId]) {
    return getAccessLevelFromPermissions(userPerms, moduleId);
  }

  // ── 2. Schéma intermédiaire (modules[id].access string) ─────────────────
  if (userPerms?.modules?.[moduleId]?.access) {
    return userPerms.modules[moduleId].access;
  }

  // ── 3. Legacy flat (moduleAccess[id]) ───────────────────────────────────
  if (userPerms?.moduleAccess?.[moduleId]) {
    return userPerms.moduleAccess[moduleId];
  }

  // ── 4. Legacy list (allowedModules[]) ───────────────────────────────────
  if (Array.isArray(userPerms?.allowedModules) && userPerms.allowedModules.includes(moduleId)) {
    return 'write';
  }

  // ── 5. Fallback rôle → permissions par défaut du schéma enterprise ───────
  const roleFromState = userRole || user?.role;
  const rolesArr = Array.isArray(userPerms?.roles) ? userPerms.roles : [];
  const effectiveRoles = new Set([roleFromState, ...rolesArr].filter(Boolean));

  for (const role of effectiveRoles) {
    const defaults = getDefaultPermissionsForRole(role);
    if (defaults?.modules?.[moduleId]) {
      return getAccessLevelFromPermissions(defaults, moduleId);
    }
  }

  return 'none';
}


