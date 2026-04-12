import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { mockData } from './utils/data-factory';
import { auth, db, firebaseConfig } from './firebase/config';
import { doc, getDoc, setDoc, onSnapshot, collection, query, orderBy, limit, deleteDoc, where } from 'firebase/firestore';
import { onAuthStateChanged, createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';

const BusinessContext = createContext();

// Utility for safe localStorage parsing
const safeParse = (key, defaultValue) => {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return defaultValue;
    return JSON.parse(saved);
  } catch (error) {
    console.error(`Erreur lors de la lecture de ${key} dans localStorage:`, error);
    return defaultValue;
  }
};

export const BusinessProvider = ({ children }) => {
  /* ══════════════════════════════════════════════════════════════════════════
     1. SHARED STATE (Declarations Must Be First to Avoid TDZ Errors)
     ══════════════════════════════════════════════════════════════════════════ */
  
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem('daxcelor_data');
      if (!saved) return mockData;
      
      const parsed = JSON.parse(saved);
      if (!parsed || typeof parsed !== 'object') return mockData;

      const deepMerge = (target, source) => {
        const result = { ...target };
        if (!source || typeof source !== 'object') return result;

        Object.keys(source).forEach(key => {
          if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(target[key] || {}, source[key]);
          } else {
            result[key] = source[key];
          }
        });
        return result;
      };

      const merged = deepMerge(mockData, parsed);
      if (!merged.base) merged.base = mockData.base;
      if (!merged.base.taxes || merged.base.taxes.length === 0) merged.base.taxes = mockData.base.taxes;
      if (!merged.base.sequences) merged.base.sequences = mockData.base.sequences;

      if (merged.inventory) {
        if (merged.inventory.moves && (!merged.inventory.movements || merged.inventory.movements.length === 0)) {
          merged.inventory.movements = merged.inventory.moves;
        }
        if (!merged.inventory.movements) merged.inventory.movements = [];
      }

      if (!merged.dms) merged.dms = { files: [], categories: ['Finances', 'RH', 'Technique', 'Légal'] };
      if (!merged.contracts) merged.contracts = { subscriptions: [] };
      if (!merged.manufacturing) merged.manufacturing = { workOrders: [], boms: [] };
      if (!merged.planning) merged.planning = { events: [] };

      return merged;
    } catch (e) {
      console.error("Erreur critique daxcelor_data, retour aux mockData:", e);
      return mockData;
    }
  });

  const [config, setConfig] = useState(() => {
    return safeParse('ipc_erp_config', {
      theme: { primary: '#1F363D', accent: '#529990', borderRadius: '1.25rem', isCompact: false, logoUrl: '/logo.png', logoWidth: 40, logoHeight: 40 },
      company: { name: 'IPC ERP', website: 'https://ipc-erp.web.app', address: '', taxId: '' },
      localization: { currency: 'FCFA', dateFormat: 'DD/MM/YYYY', timezone: 'UTC+1', language: 'FR' },
      security: { tfaEnabled: false, sessionTimeout: 60 },
      notifications: { systemAlerts: true, emailDigest: false, chatSound: true },
      customFields: {},
      aiPreference: 'floating',
      aiName: 'IPC Intelligence'
    });
  });

  const [globalSettings, setGlobalSettings] = useState(() => {
    return safeParse('ipc_erp_global_settings', {
      logoUrl: '/logo.png', logoWidth: 40, logoHeight: 40, companyName: 'IPC ERP', website: 'https://ipc-erp.web.app', currency: 'FCFA'
    });
  });

  const [permissions, setPermissions] = useState(() => safeParse('ipc_erp_permissions', {}));
  
  const [currentUser, setCurrentUser] = useState(() => {
    return safeParse('ipc_erp_current_user', { id: 'admin', nom: 'Administrateur', role: 'SUPER_ADMIN' });
  });

  const [activeApp, setActiveApp] = useState('home');
  const [hints, setHints] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [activeCall, setActiveCall] = useState(null); // { id, role, type, contactName }
  
  // Derived State
  const userRole = currentUser?.role || 'GUEST';
  const switchRole = null;
  const switchUser = null;

  /* ══════════════════════════════════════════════════════════════════════════
     2. PERSISTENCE EFFECTS
     ══════════════════════════════════════════════════════════════════════════ */

  useEffect(() => { localStorage.setItem('ipc_erp_permissions', JSON.stringify(permissions)); }, [permissions]);
  useEffect(() => { localStorage.setItem('ipc_erp_config', JSON.stringify(config)); }, [config]);
  useEffect(() => { localStorage.setItem('ipc_erp_global_settings', JSON.stringify(globalSettings)); }, [globalSettings]);
  useEffect(() => {
    localStorage.setItem('ipc_erp_current_user', JSON.stringify(currentUser));
    localStorage.setItem('daxcelor_user_role', currentUser.role);
    
    // Cloud Sync for Admin
    if (auth.currentUser) {
      const userDoc = doc(db, 'users', auth.currentUser.uid);
      setDoc(userDoc, { config, permissions, data }, { merge: true }).catch(e => console.warn("Cloud Sync Error:", e.message));
    }
  }, [currentUser, config, permissions, data]);

  /* ══════════════════════════════════════════════════════════════════════════
     3. UTILITY LOGIC (Stable Helpers)
     ══════════════════════════════════════════════════════════════════════════ */

  const formatCurrency = useCallback((val, compact = false) => {
    if (typeof val !== 'number') return val;
    if (compact) {
      const formatter = new Intl.NumberFormat('fr-FR', { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 });
      return formatter.format(val).replace('B', 'Md') + ' ' + (globalSettings.currency || 'FCFA');
    }
    return val.toLocaleString('fr-FR').replace(/\u00a0/g, ' ') + ' ' + (globalSettings.currency || 'FCFA');
  }, [globalSettings.currency]);

  const getNextSequence = useCallback((key) => {
    const seq = data.base?.sequences?.[key];
    if (!seq) return "";
    const numStr = seq.next.toString().padStart(seq.padding, '0');
    const nextNum = `${seq.prefix}${new Date().getFullYear()}-${numStr}`;
    
    setData(prev => {
      const s = prev.base?.sequences?.[key];
      if (!s) return prev;
      return { ...prev, base: { ...prev.base, sequences: { ...prev.base.sequences, [key]: { ...s, next: s.next + 1 } } } };
    });
    return nextNum;
  }, [data.base?.sequences]);

  /* ══════════════════════════════════════════════════════════════════════════
     4. CORE ACTIONS (Low-level hooks)
     ══════════════════════════════════════════════════════════════════════════ */

  const addHint = useCallback((hint) => {
    const id = Date.now().toString();
    setHints(prev => [{ ...hint, id }, ...prev]);
  }, []);

  const dismissHint = useCallback((id) => {
    setHints(prev => prev.filter(h => h.id !== id));
  }, []);

  const logAction = useCallback(async (action, details, appId = 'system') => {
    const logEntry = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.nom,
      action, details, appId,
      timestamp: new Date().toISOString()
    };
    setData(prev => ({ ...prev, audit: { ...prev.audit, logs: [logEntry, ...(prev.audit?.logs || [])] } }));
    if (auth.currentUser) {
      setDoc(doc(db, 'audit_logs', logEntry.id), logEntry).catch(e => console.error("logAction Cloud Error:", e));
    }
  }, [currentUser.id, currentUser.nom]);

  /* ══════════════════════════════════════════════════════════════════════════
     5. DATA MUTATION LOGIC (Business Logic)
     ══════════════════════════════════════════════════════════════════════════ */

  const deleteRecord = useCallback((appId, subModule, id) => {
    setData(prev => {
      const moduleData = prev[appId] || {};
      const subModuleData = moduleData[subModule] || [];
      const updatedList = subModuleData.filter(item => item.id !== id);
      const nextState = { ...prev, [appId]: { ...moduleData, [subModule]: updatedList } };
      logAction(`Suppression ${subModule}`, `ID: ${id}`, appId);
      if (auth.currentUser) deleteDoc(doc(db, appId, id));
      return nextState;
    });
  }, [logAction]);

  const updateRecord = useCallback((appId, subModule, id, newData) => {
    setData(prev => {
      if (!prev[appId] || !prev[appId][subModule]) return prev;
      const updatedList = prev[appId][subModule].map(item => item.id === id ? { ...item, ...newData } : item);
      let nextState = { ...prev, [appId]: { ...prev[appId], [subModule]: updatedList } };
      const record = updatedList.find(o => o.id === id);
      logAction(`Mise à jour ${subModule}`, `${record.num || id}`, appId);
      if (auth.currentUser) setDoc(doc(db, appId, id), { ...record, subModule, updatedAt: new Date().toISOString() }, { merge: true });
      
      // CRM/Sales specific logic (preserved)
      if (appId === 'crm' && subModule === 'opportunities' && newData.etape === 'Gagné') {
        addHint({ title: "Affaire Gagnée !", message: `Opportunité "${record.titre}" gagnée. Générer le devis ?`, appId: 'sales', actionLabel: "Générer", onAction: () => {} });
      }
      return nextState;
    });
  }, [logAction, addHint]);

  const addRecord = useCallback((appId, subModule, inputData) => {
    let processedRecord = { ...inputData };
    if (!processedRecord.num || processedRecord.num === "") {
      const seqKey = `${appId}_${subModule}`;
      if (data.base?.sequences?.[seqKey]) processedRecord.num = getNextSequence(seqKey);
    }
    const newRecord = { ...processedRecord, id: Date.now().toString(), createdAt: new Date().toISOString() };
    setData(prev => {
      const moduleData = prev[appId] || {};
      const subModuleData = moduleData[subModule] || [];
      const nextState = { ...prev, [appId]: { ...moduleData, [subModule]: [newRecord, ...subModuleData] } };
      logAction(`Création ${subModule}`, `${processedRecord.num || newRecord.id}`, appId);
      if (auth.currentUser) setDoc(doc(db, appId, newRecord.id), { ...newRecord, subModule, ownerId: auth.currentUser.uid }, { merge: true });
      return nextState;
    });
  }, [data.base?.sequences, logAction, getNextSequence]);

  /* ══════════════════════════════════════════════════════════════════════════
     6. GLOBAL LOGIC (Search & Config)
     ══════════════════════════════════════════════════════════════════════════ */

  const globalSearch = useCallback((query) => {
    if (!query || query.length < 2) return setSearchResults([]);
    const q = query.toLowerCase();
    const results = [];
    if (data.base?.contacts) data.base.contacts.forEach(c => (c.nom.toLowerCase().includes(q)) && results.push({ type: 'Contact', name: c.nom, appId: 'base' }));
    if (data.hr?.employees) data.hr.employees.forEach(e => (e.nom.toLowerCase().includes(q)) && results.push({ type: 'Employé', name: e.nom, appId: 'hr' }));
    setSearchResults(results.slice(0, 10));
  }, [data]);

  const updateConfig = useCallback((newConfig) => setConfig(prev => ({ ...prev, ...newConfig })), []);
  const addCustomField = useCallback((appId, field) => setConfig(prev => ({ ...prev, customFields: { ...prev.customFields, [appId]: [...(prev.customFields[appId] || []), field] } })), []);
  const updateGlobalSettings = useCallback(async (newGlobal) => {
    if (userRole !== 'SUPER_ADMIN') return;
    setGlobalSettings(prev => ({ ...prev, ...newGlobal }));
    if (auth.currentUser) setDoc(doc(db, 'settings', 'global'), { ...newGlobal }, { merge: true });
  }, [userRole]);

  /* ══════════════════════════════════════════════════════════════════════════
     7. ADMIN LOGIC (User Management)
     ══════════════════════════════════════════════════════════════════════════ */

  const updateUserRole = useCallback((userId, newRole) => {
    setPermissions(prev => ({ ...prev, [userId]: { ...(prev[userId] || { allowedModules: [] }), roles: [newRole] } }));
  }, []);

  const toggleModuleAccess = useCallback((userId, moduleId) => {
    setPermissions(prev => {
      const userPerms = prev[userId] || { roles: [], allowedModules: [] };
      const newModules = userPerms.allowedModules.includes(moduleId) ? userPerms.allowedModules.filter(m => m !== moduleId) : [...userPerms.allowedModules, moduleId];
      return { ...prev, [userId]: { ...userPerms, allowedModules: newModules } };
    });
  }, []);

  const createFullUser = useCallback(async (userData) => {
    let secondaryApp;
    try {
      secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
      const userCredential = await createUserWithEmailAndPassword(getAuth(secondaryApp), userData.email, userData.password);
      const uid = userCredential.user.uid;
      const profileData = { nom: userData.nom, email: userData.email, poste: userData.poste, id: uid, createdAt: new Date().toISOString() };
      await setDoc(doc(db, 'users', uid), { profile: profileData, permissions: { roles: [userData.role || 'STAFF'], allowedModules: ['staff_portal'] }, data: {} });
      addRecord('hr', 'employees', profileData);
      return { success: true, uid };
    } finally { if (secondaryApp) deleteApp(secondaryApp); }
  }, [addRecord]);

  const deleteFullUser = useCallback(async (userId) => {
    const uid = String(userId);
    if (auth.currentUser) await deleteDoc(doc(db, 'users', uid));
    setData(prev => ({ ...prev, hr: { ...prev.hr, employees: (prev.hr?.employees || []).filter(e => String(e.id) !== uid) } }));
    setPermissions(prev => { const next = { ...prev }; delete next[uid]; return next; });
    logAction('Suppression Utilisateur', `ID: ${uid}`, 'system');
  }, [logAction]);

  const approveRequest = useCallback((appId, subModule, id) => {
    updateRecord(appId, subModule, id, { statut: 'Validé', validatedBy: currentUser.nom, validatedAt: new Date().toISOString() });
    addHint({ title: "Demande Approuvée", type: 'success', appId });
  }, [updateRecord, addHint, currentUser.nom]);

  const rejectRequest = useCallback((appId, subModule, id) => {
    updateRecord(appId, subModule, id, { statut: 'Refusé', validatedBy: currentUser.nom, validatedAt: new Date().toISOString() });
  }, [updateRecord, currentUser.nom]);

  /* ══════════════════════════════════════════════════════════════════════════
     8. CLOUD LISTENERS
     ══════════════════════════════════════════════════════════════════════════ */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        let userRole = 'STAFF';
        if (['ra.yoman@ipcgreenblocks.com', 'fall.jcjunior@gmail.com'].includes(user.email)) userRole = 'SUPER_ADMIN';
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (docSnap.exists()) {
          const userData = docSnap.data();
          if (userData.data) setData(userData.data);
          setCurrentUser({ id: user.uid, nom: userData.profile?.nom || user.email.split('@')[0], email: user.email, role: userRole });
        }
      } else {
        setData(mockData);
        setCurrentUser({ id: 'guest', nom: 'Utilisateur', role: 'GUEST' });
      }
    });
    return () => unsubscribe();
  }, []);

  // WebRTC Call Listener
  useEffect(() => {
    if (!currentUser) return; 
    if (currentUser.id === 'guest') return;

    const q = query(
      collection(db, 'calls'), 
      where('receiverId', '==', currentUser.id), 
      where('status', '==', 'ringing'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const callDoc = snapshot.docs[0];
        const callData = callDoc.data();
        // Automatically trigger incoming call UI
        setActiveCall({ 
          id: callDoc.id, 
          role: 'receiver', 
          type: callData.type, 
          contactName: callData.callerName || 'Collègue'
        });
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribes = ['crm', 'sales', 'inventory', 'accounting', 'projects', 'audit_logs', 'hr'].map(colName => {
      const q = query(collection(db, colName), orderBy('createdAt', 'desc'), limit(100));
      return onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
        setData(prev => {
          const newState = { ...prev };
          if (colName === 'audit_logs') newState.audit = { ...newState.audit, logs: docs };
          else {
            const grouped = {};
            docs.forEach(doc => { const sub = doc.subModule || 'others'; if (!grouped[sub]) grouped[sub] = []; grouped[sub].push(doc); });
            newState[colName] = { ...prev[colName], ...grouped };
          }
          return newState;
        });
      });
    });
    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  /* ══════════════════════════════════════════════════════════════════════════
     9. EXPORTS & NAVIGATION
     ══════════════════════════════════════════════════════════════════════════ */

  const logout = useCallback(async () => {
    await auth.signOut();
    localStorage.removeItem('ipc_erp_current_user');
    localStorage.removeItem('daxcelor_data');
  }, []);

  const navigateTo = useCallback((appId) => setActiveApp(appId), []);

  return (
    <BusinessContext.Provider value={{
      data, userRole, switchRole, addRecord, updateRecord, deleteRecord, globalSearch, searchResults, hints, dismissHint,
      config, updateConfig, globalSettings, updateGlobalSettings, addCustomField, currentUser, switchUser, permissions,
      updateUserRole, toggleModuleAccess, approveRequest, rejectRequest, createFullUser, deleteFullUser, logout, activeApp,
      setActiveApp, navigateTo, formatCurrency, activeCall, setActiveCall
    }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => useContext(BusinessContext);
