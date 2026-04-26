import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db, auth, firebaseConfig } from '../../firebase/config';

export const createAdminSlice = (set, get) => ({
  updateUserRole: (userId, newRole) => {
    set(state => {
      const userPerms = state.permissions[userId] || { roles: [], moduleAccess: {} };
      const newPerms = { ...userPerms, roles: [newRole] };
      
      if (auth.currentUser) {
        setDoc(doc(db, 'users', userId), { permissions: newPerms }, { merge: true })
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
        setDoc(doc(db, 'users', userId), { permissions: newPerms }, { merge: true })
          .catch(e => console.error("Erreur save permissions:", e));
      }
      return { permissions: { ...state.permissions, [userId]: newPerms } };
    });
  },

  getModuleAccess: (userId, moduleId) => {
    const { user, permissions } = get();
    if (user?.role === 'SUPER_ADMIN') return 'write';

    const userPerms = permissions[userId];
    if (!userPerms) return 'none';
    
    if (userPerms.roles?.includes('SUPER_ADMIN')) return 'write';
    if (moduleId === 'home') return 'write';

    if (userPerms.moduleAccess && userPerms.moduleAccess[moduleId]) {
      return userPerms.moduleAccess[moduleId];
    }
    
    if (Array.isArray(userPerms.allowedModules) && userPerms.allowedModules.includes(moduleId)) {
      return 'write';
    }
    
    return 'none';
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

      const permissionsData = {
        roles: userData.roles || [role],
        moduleAccess: userData.moduleAccess || { home: 'write' },
        allowedModules: userData.allowedModules || Object.keys(userData.moduleAccess || { home: 'write' })
      };

      await setDoc(doc(db, 'users', uid), { 
        profile: profileData, 
        permissions: permissionsData, 
        data: {} 
      });

      await setDoc(doc(db, 'hr', uid), { 
         ...profileData, 
         subModule: 'employees',
         salaire: userData.salaire || 0,
         contratType: userData.contratType || 'CDI',
         contratDuree: userData.contratDuree || '',
      });

      return { success: true, uid };
    } finally { if (secondaryApp) deleteApp(secondaryApp); }
  },

  toggleUserStatus: async (userId, activeStatus) => {
    const uid = String(userId);
    try {
      if (auth.currentUser) {
        await setDoc(doc(db, 'users', uid), { profile: { active: activeStatus } }, { merge: true });
        await setDoc(doc(db, 'hr', uid), { active: activeStatus }, { merge: true });
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
      await deleteDoc(doc(db, 'users', uid));
      await deleteDoc(doc(db, 'hr', uid));
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
  }
});
