import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth, firebaseConfig, db as firestoreDb, app } from '../../firebase/config';
import { FirestoreService, serverTimestamp } from '../../services/firestore.service';

import { registry } from '../../services/Registry';

export const createAdminSlice = (set, get) => ({
  updateUserPermissions: async (userId, permissions, role) => {
    try {
      const functions = getFunctions(app, 'us-central1');
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
      const functions = getFunctions(app, 'us-central1');
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
      const functions = getFunctions(app, 'us-central1');
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
    const { user, userRole, permissions } = get();
    // SUPER_ADMIN (creator) has absolute bypass
    if (userRole === 'SUPER_ADMIN') return 'write';

    // Always allow access to Personal Space
    if (moduleId === 'home') return 'write';

    const userPerms = permissions[userId];

    // 1. Check New Nested Structure (modules[id].access)
    if (userPerms?.modules && userPerms.modules[moduleId]) {
      return userPerms.modules[moduleId].access || 'none';
    }

    // 2. Fallback to Legacy Flat Structure (moduleAccess[id])
    if (userPerms?.moduleAccess && userPerms.moduleAccess[moduleId]) {
      return userPerms.moduleAccess[moduleId];
    }

    // 3. Fallback to Legacy List (allowedModules)
    if (Array.isArray(userPerms?.allowedModules) && userPerms.allowedModules.includes(moduleId)) {
      return 'write';
    }

    // 4. Role-based default fallback (when permissions doc is empty/sparse but role is set).
    // Évite que les nouveaux comptes "Directeur"/"HR_MANAGER" ne voient que Home parce que
    // le wizard n'a pas câblé `allowedModules`.
    const roleFromState = userRole || user?.role;
    const rolesArr = Array.isArray(userPerms?.roles) ? userPerms.roles : [];
    const effectiveRoles = new Set([roleFromState, ...rolesArr].filter(Boolean));

    const ROLE_MODULE_DEFAULTS = {
      ADMIN:        { all: 'write' },
      MANAGER:      { all: 'write' },
      DIRECTOR:     { all: 'write' },
      HR_MANAGER:   { hr: 'write', talent: 'write', payroll: 'write', signature: 'write', dms: 'write' },
      HR:           { hr: 'write', talent: 'read', payroll: 'read' },
      FINANCE:      { finance: 'write', accounting: 'write', budget: 'write', sales: 'read' },
      SALES:        { crm: 'write', sales: 'write', commerce: 'write', marketing: 'read' },
      CRM:          { crm: 'write', sales: 'read' },
      PRODUCTION:   { production: 'write', inventory: 'write', planning: 'read' },
      LOGISTICS:    { inventory: 'write', logistics: 'write', purchase: 'write', projects: 'read' },
      LEGAL:        { legal: 'write', signature: 'write', dms: 'write' },
      STAFF:        { connect: 'read', dms: 'read' },
      GUEST:        {}
    };
    for (const role of effectiveRoles) {
      const map = ROLE_MODULE_DEFAULTS[role];
      if (!map) continue;
      if (map.all) return map.all;
      if (map[moduleId]) return map[moduleId];
    }

    return 'none';
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
        role: userData.role || 'GUEST',
        poste: userData.poste,
        dept: userData.dept,
        salaire: userData.salaire,
        contratType: userData.contratType,
        date_entree: userData.date_entree,
        permissions: userData.permissions || {
          roles: [userData.role || 'GUEST'],
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
        await FirestoreService.setDocument('users', uid, { profile: { active: activeStatus } }, true);
        await FirestoreService.setDocument('hr', uid, { active: activeStatus }, true);
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
      const functions = getFunctions(app, 'europe-west1');
      const deleteUserFunc = httpsCallable(functions, 'deleteUserAccount');
      
      // The Cloud Function now performs a HARD delete on Auth + Firestore
      await deleteUserFunc({ uid });

      // Immediate UI update: remove from local store
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
        title: "Compte Supprimé", 
        message: "L'utilisateur a été définitivement supprimé d'Auth et de la Base de données.", 
        type: 'success' 
      });

      get().logAction('Suppression Définitive Utilisateur', `ID: ${uid}`, 'system');
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


