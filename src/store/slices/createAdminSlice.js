import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth, firebaseConfig } from '../../firebase/config';
import { FirestoreService } from '../../services/firestore.service';

import { registry } from '../../services/Registry';

export const createAdminSlice = (set, get) => ({
  updateUserRole: (userId, newRole) => {
    set(state => {
      const userPerms = state.permissions[userId] || { roles: [], moduleAccess: {} };
      const newPerms = { ...userPerms, roles: [newRole] };
      
      if (auth.currentUser) {
        FirestoreService.setDocument('users', userId, { permissions: newPerms }, true)
          .catch(e => console.error("Erreur save role:", e));
      }
      return { permissions: { ...state.permissions, [userId]: newPerms } };
    });
  },

  setModuleAccessLevel: (userId, moduleId, level) => {
    set(state => {
      const userPerms = state.permissions[userId] || { roles: [], moduleAccess: {} };
      const newModuleAccess = { ...(userPerms.moduleAccess || {}) };
      
      if (level === 'none') {
        delete newModuleAccess[moduleId];
      } else {
        newModuleAccess[moduleId] = level;
      }
      
      const newPerms = { ...userPerms, moduleAccess: newModuleAccess };
      if (newPerms.allowedModules) delete newPerms.allowedModules;

      if (auth.currentUser) {
        FirestoreService.setDocument('users', userId, { permissions: newPerms }, true)
          .catch(e => console.error("Erreur save permissions:", e));
      }
      return { permissions: { ...state.permissions, [userId]: newPerms } };
    });
  },

  getModuleAccess: (userId, moduleId) => {
    const { user, permissions } = get();
    // SUPER_ADMIN (creator) has absolute bypass
    if (user?.role === 'SUPER_ADMIN') return 'write';

    const userPerms = permissions[userId];
    if (!userPerms) return 'none';
    
    // Legacy / Roles based bypass
    if (userPerms.roles?.includes('SUPER_ADMIN')) return 'write';
    if (moduleId === 'home') return 'write';

    // 1. Check New Nested Structure (modules[id].access)
    if (userPerms.modules && userPerms.modules[moduleId]) {
      return userPerms.modules[moduleId].access || 'none';
    }

    // 2. Fallback to Legacy Flat Structure (moduleAccess[id])
    if (userPerms.moduleAccess && userPerms.moduleAccess[moduleId]) {
      return userPerms.moduleAccess[moduleId];
    }
    
    // 3. Fallback to Legacy List (allowedModules)
    if (Array.isArray(userPerms.allowedModules) && userPerms.allowedModules.includes(moduleId)) {
      return 'write';
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

  createFullUser: async (userData, initialRole = 'ADMIN') => {
    let secondaryApp;
    try {
      secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
      const userCredential = await createUserWithEmailAndPassword(getAuth(secondaryApp), userData.email, userData.password);
      const uid = userCredential.user.uid;
      
      const role = userData.role || initialRole;
      const profileData = { 
        nom: userData.nom, 
        email: userData.email, 
        poste: userData.poste, 
        id: uid, 
        dept: userData.dept || '',
        avatar: userData.avatar || userData.nom[0],
        statut: 'Actif',
        active: true,
        createdAt: new Date().toISOString() 
      };

      const permissionsData = userData.permissions || {
        hierarchy_level: userData.hierarchy_level || 'Employee',
        modules: userData.modules || { home: { access: 'write', subTabs: {} } },
        roles: userData.roles || [role],
        // Backward compatibility
        moduleAccess: { home: 'write' },
        allowedModules: ['home']
      };

      await FirestoreService.setDocument('users', uid, { 
        profile: profileData, 
        permissions: permissionsData,
        role: permissionsData.roles[0],
        hierarchy_level: permissionsData.hierarchy_level,
        data: {} 
      }, false);

      await FirestoreService.setDocument('hr', uid, { 
         ...profileData, 
         subModule: 'employees',
         salaire: userData.salaire || 0,
         contratType: userData.contratType || 'CDI',
         contratDuree: userData.contratDuree || '',
      }, false);

      return { success: true, uid };
    } finally { if (secondaryApp) deleteApp(secondaryApp); }
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
      const functions = getFunctions();
      const deleteUserFunc = httpsCallable(functions, 'deleteUserAccount');
      await deleteUserFunc({ uid });
    } catch (err) {
      console.error("Erreur suppression Auth:", err);
      get().addHint({ 
        title: "Suppression Auth Échouée", 
        message: "Le compte n'a pas pu être supprimé de Firebase Authentication.", 
        type: 'warning' 
      });
    }

    if (auth.currentUser) {
      await FirestoreService.deleteDocument('users', uid);
      await FirestoreService.deleteDocument('hr', uid);
    }
    
    set(state => ({ 
      data: { 
        ...state.data,
        hr: { ...state.data.hr, employees: (state.data.hr?.employees || []).filter(e => String(e.id) !== uid) },
        base: { ...state.data.base, users: (state.data.base?.users || []).filter(u => String(u.id) !== uid) }
      },
      permissions: (() => { const next = { ...state.permissions }; delete next[uid]; return next; })()
    }));
    
    get().logAction('Suppression Définitive Utilisateur', `ID: ${uid}`, 'system');
  },

  triggerManualBackup: async () => {
    try {
      const functions = getFunctions();
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
  }
});

