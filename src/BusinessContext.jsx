import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockData } from './utils/data-factory';
import { auth, db, firebaseConfig } from './firebase/config';
import { doc, getDoc, setDoc, onSnapshot, updateDoc, collection, query, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, createUserWithEmailAndPassword, updatePassword, signOut, getAuth } from 'firebase/auth';
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
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem('daxcelor_data');
      if (!saved) return mockData;
      
      const parsed = JSON.parse(saved);
      if (!parsed || typeof parsed !== 'object') return mockData;

      // Recursive deep merge to preserve mockData structure while applying user data
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
      
      // MIGRATION & SAFETY: Fix legacy data structures
      if (!merged.base) merged.base = mockData.base;
      if (!merged.base.taxes || merged.base.taxes.length === 0) {
        merged.base.taxes = mockData.base.taxes;
      }
      if (!merged.base.sequences) merged.base.sequences = mockData.base.sequences;

      if (merged.inventory) {
        // Rename 'moves' to 'movements' if it exists and 'movements' is missing
        if (merged.inventory.moves && (!merged.inventory.movements || merged.inventory.movements.length === 0)) {
          merged.inventory.movements = merged.inventory.moves;
        }
        // Ensure movements is always an array
        if (!merged.inventory.movements) merged.inventory.movements = [];
      }

      // Ensure basic Enterprise structures exist
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
      theme: {
        primary: '#1F363D',
        accent: '#529990',
        borderRadius: '1.25rem',
        isCompact: false,
        logoUrl: '/logo.png',
        logoWidth: 40,
        logoHeight: 40
      },
      company: {
        name: 'IPC ERP',
        website: 'https://ipc-erp.web.app',
        address: '',
        taxId: ''
      },
      localization: {
        currency: 'FCFA',
        dateFormat: 'DD/MM/YYYY',
        timezone: 'UTC+1',
        language: 'FR'
      },
      security: {
        tfaEnabled: false,
        sessionTimeout: 60
      },
      notifications: {
        systemAlerts: true,
        emailDigest: false,
        chatSound: true
      },
      customFields: {},
      aiPreference: 'floating',
      aiName: 'IPC Intelligence'
    });
  });

  const [globalSettings, setGlobalSettings] = useState(() => {
    return safeParse('ipc_erp_global_settings', {
      logoUrl: '/logo.png',
      logoWidth: 40,
      logoHeight: 40,
      companyName: 'IPC ERP',
      website: 'https://ipc-erp.web.app',
      currency: 'FCFA'
    });
  });

  const [permissions, setPermissions] = useState(() => {
    return safeParse('ipc_erp_permissions', {});
  });

  useEffect(() => {
    localStorage.setItem('ipc_erp_permissions', JSON.stringify(permissions));
  }, [permissions]);

  const updateUserRole = (userId, newRole) => {
    setPermissions(prev => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || { allowedModules: [] }),
        roles: [newRole]
      }
    }));
  };

  const toggleModuleAccess = (userId, moduleId) => {
    setPermissions(prev => {
      const userPerms = prev[userId] || { roles: [], allowedModules: [] };
      const hasAccess = userPerms.allowedModules.includes(moduleId);
      const newModules = hasAccess 
        ? userPerms.allowedModules.filter(m => m !== moduleId)
        : [...userPerms.allowedModules, moduleId];
      
      return {
        ...prev,
        [userId]: { ...userPerms, allowedModules: newModules }
      };
    });
  };

  useEffect(() => {
    localStorage.setItem('ipc_erp_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('ipc_erp_global_settings', JSON.stringify(globalSettings));
  }, [globalSettings]);

  const updateConfig = (newConfig) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  const updateGlobalSettings = async (newGlobal) => {
    if (userRole !== 'SUPER_ADMIN') return;
    
    setGlobalSettings(prev => ({ ...prev, ...newGlobal }));
    
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'settings', 'global'), { ...globalSettings, ...newGlobal }, { merge: true });
      } catch (e) {
        console.error("Erreur updateGlobalSettings Cloud:", e);
      }
    }
  };

  const addCustomField = (appId, field) => {
    setConfig(prev => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        [appId]: [...(prev.customFields[appId] || []), field]
      }
    }));
  };

  const [hints, setHints] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  const getNextSequence = (key) => {
    const seq = data.base?.sequences?.[key];
    if (!seq) return "";
    
    const numStr = seq.next.toString().padStart(seq.padding, '0');
    const nextNum = `${seq.prefix}${new Date().getFullYear()}-${numStr}`;
    
    setData(prev => {
      const s = prev.base?.sequences?.[key];
      if (!s) return prev;
      return {
        ...prev,
        base: {
          ...prev.base,
          sequences: {
            ...prev.base.sequences,
            [key]: { ...s, next: s.next + 1 }
          }
        }
      };
    });
    
    return nextNum;
  };

  const addHint = (hint) => {
    const id = Date.now().toString();
    setHints(prev => [{ ...hint, id }, ...prev]);
  };

  const logAction = async (action, details, appId = 'system') => {
    const logEntry = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.nom,
      action,
      details,
      appId,
      timestamp: new Date().toISOString()
    };

    // 1. Local Update
    setData(prev => ({
      ...prev,
      audit: {
        ...prev.audit,
        logs: [logEntry, ...(prev.audit?.logs || [])]
      }
    }));

    // 2. Cloud Sync
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'audit_logs', logEntry.id), logEntry);
      } catch (e) {
        console.error("Erreur logAction Cloud:", e);
      }
    }
  };

  const [workflows, setWorkflows] = useState([]);

  const runWorkflows = async (trigger, triggerData, context = {}) => {
    const activeWorkflows = workflows.filter(w => w.trigger === trigger && w.active);
    
    for (const wf of activeWorkflows) {
      // 1. Check Condition (Simple eval)
      let conditionMet = true;
      if (wf.conditionField && wf.conditionValue) {
        conditionMet = String(triggerData[wf.conditionField]) === String(wf.conditionValue);
      }

      if (conditionMet) {
        console.log(`Exécution du Workflow: ${wf.name}`);
        
        // 2. Execute Action
        switch (wf.actionType) {
          case 'notification':
            addHint({
              title: wf.actionTitle || "Automatisation",
              message: wf.actionMessage || "Une action automatique a été déclenchée.",
              type: 'info',
              appId: context.appId
            });
            break;
          case 'statusUpdate':
            if (context.appId && context.subModule) {
              updateRecord(context.appId, context.subModule, triggerData.id, { [wf.targetField]: wf.targetValue });
            }
            break;
          default:
            break;
        }
      }
    }
  };

  const dismissHint = (id) => {
    setHints(prev => prev.filter(h => h.id !== id));
  };

  const globalSearch = (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    const q = query.toLowerCase();
    const results = [];

    // Search Base Contacts
    if (data.base?.contacts) {
      data.base.contacts.forEach(c => {
        if (c.nom.toLowerCase().includes(q) || (c.email && c.email.toLowerCase().includes(q))) {
          results.push({ type: 'Contact', name: c.nom, detail: c.type, appId: 'base' });
        }
      });
    }

    // Search Base Catalog
    if (data.base?.catalog) {
      data.base.catalog.forEach(p => {
        if (p.nom.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)) {
          results.push({ type: 'Produit (Global)', name: p.nom, detail: p.code, appId: 'base' });
        }
      });
    }

    // Search CRM Leads
    if (data.crm?.leads) {
      data.crm.leads.forEach(l => {
        if (l.nom.toLowerCase().includes(q) || l.entreprise.toLowerCase().includes(q)) {
          results.push({ type: 'CRM Lead', name: `${l.prenom} ${l.nom}`, detail: l.entreprise, appId: 'crm' });
        }
      });
    }

    // Search CRM Opportunities
    if (data.crm?.opportunities) {
      data.crm.opportunities.forEach(o => {
        if (o.titre.toLowerCase().includes(q) || o.client.toLowerCase().includes(q)) {
          results.push({ type: 'CRM Opportunité', name: o.titre, detail: o.client, appId: 'crm' });
        }
      });
    }

    // Search HR Employees
    if (data.hr?.employees) {
      data.hr.employees.forEach(e => {
        if (e.nom.toLowerCase().includes(q) || e.dept.toLowerCase().includes(q)) {
          results.push({ type: 'Employé', name: e.nom, detail: e.poste, appId: 'hr' });
        }
      });
    }

    // Search Products
    if (data.sales?.products) {
      data.sales.products.forEach(p => {
        if (p.nom.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)) {
          results.push({ type: 'Produit', name: p.nom, detail: p.code, appId: 'sales' });
        }
      });
    }

    // Search Projects
    if (data.projects?.projects) {
      data.projects.projects.forEach(p => {
        if (p.nom.toLowerCase().includes(q) || p.client.toLowerCase().includes(q)) {
          results.push({ type: 'Projet', name: p.nom, detail: p.client, appId: 'projects' });
        }
      });
    }

    // Search Marketing Campaigns
    if (data.marketing?.campaigns) {
      data.marketing.campaigns.forEach(c => {
        if (c.nom.toLowerCase().includes(q) || c.type.toLowerCase().includes(q)) {
          results.push({ type: 'Campagne', name: c.nom, detail: c.type, appId: 'marketing' });
        }
      });
    }

    // Search Contracts
    if (data.contracts?.subscriptions) {
      data.contracts.subscriptions.forEach(s => {
        if (s.titre.toLowerCase().includes(q) || s.client.toLowerCase().includes(q)) {
          results.push({ type: 'Contrat', name: s.titre, detail: s.client, appId: 'contracts' });
        }
      });
    }

    // Search Work Orders
    if (data.manufacturing?.workOrders) {
      data.manufacturing.workOrders.forEach(w => {
        if (w.num.toLowerCase().includes(q) || w.produit.toLowerCase().includes(q)) {
          results.push({ type: 'Ordre Fab.', name: w.num, detail: w.produit, appId: 'manufacturing' });
        }
      });
    }

    setSearchResults(results.slice(0, 10));
  };

  const createFullUser = async (userData) => {
    console.log("Données reçues pour création utilisateur:", userData);
    let secondaryApp;
    try {
      if (!userData.email) {
        throw new Error("L'adresse e-mail est manquante ou invalide.");
      }
      if (!userData.password) {
        throw new Error("Le mot de passe initial est requis.");
      }

      // 1. Initialize secondary app to avoid admin logout
      secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
      const secondaryAuth = getAuth(secondaryApp);
      
      // 2. Create in Auth
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth, 
        userData.email, 
        userData.password
      );
      const uid = userCredential.user.uid;
      
      // 3. Create profile in Firestore
      const userDoc = doc(db, 'users', uid);
      const profileData = {
        nom: userData.nom,
        email: userData.email,
        poste: userData.poste,
        dept: userData.dept,
        avatar: userData.avatar,
        id: uid,
        mustChangePassword: true,
        createdAt: new Date().toISOString()
      };
      
      await setDoc(userDoc, {
        profile: profileData,
        permissions: { roles: [userData.role || 'STAFF'], allowedModules: ['staff_portal'] },
        data: {}
      });

      // 4. Update HR employees
      addRecord('hr', 'employees', profileData);
      
      return { success: true, uid };
    } catch (error) {
      console.error("Erreur createFullUser:", error);
      
      // Mappage des erreurs Firebase pour plus de clarté
      if (error.code === 'auth/admin-restricted-operation') {
        throw new Error("Action restreinte par la console Firebase. Vérifiez que la 'Création de compte utilisateur' est autorisée dans les paramètres d'Authentication.");
      }
      if (error.code === 'auth/email-already-in-use') {
        throw new Error("Cet e-mail est déjà utilisé par un autre compte.");
      }
      if (error.code === 'auth/weak-password') {
        throw new Error("Le mot de passe est trop faible (6 caractères min).");
      }
      
      throw error;
    } finally {
      // 5. Cleanup secondary app (toujours exécuté)
      if (secondaryApp) {
        try {
          await deleteApp(secondaryApp);
        } catch (e) {
          console.warn("Erreur lors du nettoyage de SecondaryApp:", e);
        }
      }
    }
  };

  const deleteFullUser = async (userId) => {
    console.log("Tentative de suppression de l'utilisateur:", userId);
    if (!userId) return;
    const uid = String(userId);
    
    try {
      // 1. Suppression Firestore (Uniquement si connecté)
      if (auth.currentUser) {
        console.log("Suppression du document Firestore: users/", uid);
        const userRef = doc(db, 'users', uid);
        await deleteDoc(userRef);
      }

      // 2. Mise à jour locale du personnel RH
      setData(prev => {
        if (!prev || !prev.hr) return prev;
        return {
          ...prev,
          hr: {
            ...prev.hr,
            employees: (prev.hr.employees || []).filter(e => String(e.id) !== uid)
          }
        };
      });

      // 3. Mise à jour locale des permissions
      setPermissions(prev => {
        if (!prev) return {};
        const next = { ...prev };
        delete next[uid];
        return next;
      });

      // 4. Trace Audit
      try {
        await logAction('Suppression Utilisateur', `ID: ${uid}`, 'system');
      } catch (logErr) {
        console.warn("Erreur logAction lors de la suppression:", logErr);
      }

      return { success: true };
    } catch (error) {
      console.error("Erreur critique deleteFullUser:", error);
      throw new Error(error.message || "Erreur inconnue lors de la suppression");
    }
  };

  const addRecord = (appId, subModule, inputData) => {
    // Sequence & Tax Calculation Logic
    let processedRecord = { ...inputData };
    
    // Auto-generate number
    if (!processedRecord.num || processedRecord.num === "") {
      const seqKey = `${appId}_${subModule}`;
      if (data.base?.sequences?.[seqKey]) {
        processedRecord.num = getNextSequence(seqKey);
      }
    }

    // Auto-calculate Taxes if applicable
    if (appId === 'sales' && subModule === 'orders') {
      const taxRate = processedRecord.taxRate || 0.20;
      if (processedRecord.totalHT && !processedRecord.totalTTC) {
        processedRecord.totalTTC = processedRecord.totalHT * (1 + taxRate);
      }
    }

    const newRecord = { 
      ...processedRecord, 
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    setData(prev => {
      const moduleData = prev[appId] || {};
      const subModuleData = moduleData[subModule] || [];
      
      const nextState = {
        ...prev,
        [appId]: {
          ...moduleData,
          [subModule]: [newRecord, ...subModuleData]
        }
      };

      // LOG ACTION
      logAction(`Création ${subModule}`, `${processedRecord.num || newRecord.id}`, appId);

      // Cloud Sync for Shared Collections
      if (auth.currentUser) {
        setDoc(doc(db, appId, newRecord.id), { ...newRecord, subModule, ownerId: auth.currentUser.uid }, { merge: true });
      }

      // TRIGGER WORKFLOWS
      runWorkflows('onRecordCreated', newRecord, { appId, subModule });

      // TRACE FLOW: Lead -> Opportunity hint
      if (appId === 'crm' && subModule === 'leads') {
        setTimeout(() => {
          addHint({
            title: "Nouveau Lead détecté",
            message: `Voulez-vous créer une opportunité commerciale pour ${inputData.prenom} ${inputData.nom} ?`,
            appId: 'crm',
            actionLabel: "Créer l'opportunité",
            redirectTo: 'crm',
            onAction: () => {
               addRecord('crm', 'opportunities', {
                 titre: `Opportunité - ${inputData.entreprise}`,
                 client: inputData.entreprise,
                 montant: inputData.valeur || 5000,
                 probabilite: 10,
                 etape: 'Qualification',
                 dateCloture: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
               });
               addHint({
                 title: "Opportunité créée",
                 message: `Le dossier pour ${inputData.entreprise} est maintenant dans votre pipeline.`,
                 appId: 'crm',
                 type: 'info'
               });
            }
          });
        }, 1000);
      }

      return nextState;
    });
  };

  const updateRecord = (appId, subModule, id, newData) => {
    setData(prev => {
      if (!prev[appId] || !prev[appId][subModule]) return prev;

      const updatedList = prev[appId][subModule].map(item => 
        item.id === id ? { ...item, ...newData } : item
      );

      let nextState = {
        ...prev,
        [appId]: {
          ...prev[appId],
          [subModule]: updatedList
        }
      };

      // LOG ACTION
      const record = updatedList.find(o => o.id === id);
      logAction(`Mise à jour ${subModule}`, `${record.num || id} (Valeurs: ${Object.keys(newData).join(', ')})`, appId);

      // Cloud Sync for Shared Collections
      if (auth.currentUser) {
        setDoc(doc(db, appId, id), { ...record, subModule, updatedAt: new Date().toISOString() }, { merge: true });
      }

      // TRIGGER WORKFLOWS
      runWorkflows('onRecordUpdated', record, { appId, subModule });

      // WORKFLOW LOGIC: Reelles consequences
      
      // 1. CRM Opportunity Won -> Sales Quote Hint
      if (appId === 'crm' && subModule === 'opportunities' && newData.etape === 'Gagné' && record.prevEtape !== 'Gagné') {
        addHint({
          title: "Affaire Gagnée !",
          message: `L'opportunité "${record.titre}" est gagnée. Souhaitez-vous générer le devis de vente ?`,
          appId: 'sales',
          actionLabel: "Générer Devis",
          redirectTo: 'sales',
          onAction: () => {
             addRecord('sales', 'orders', {
               num: `DEV-${record.id.slice(-4)}`,
               client: record.client,
               date: new Date().toISOString().split('T')[0],
               totalHT: record.montant,
               totalTTC: record.montant * 1.2,
               statut: 'Brouillon',
               devise: 'EUR'
             });
          }
        });
      }

      // 2. Sales Order Confirmed -> Stock Move Hint
      if (appId === 'sales' && subModule === 'orders' && newData.statut === 'Confirmé') {
         addHint({
          title: "Commande Confirmée",
          message: `La commande ${record.num} est validée. Créer le bon de préparation de stock ?`,
          appId: 'inventory',
          actionLabel: "Préparer Stock",
          redirectTo: 'inventory',
          onAction: () => {
             addRecord('inventory', 'movements', {
               date: new Date().toISOString().split('T')[0],
               produit: "Article de commande", // Should ideally map line items
               type: 'Expédition',
               qte: -1,
               ref: record.num
             });
          }
        });
      }
      
      // 3. Purchase Order Validation -> Treasury Impact (Still automatic but with hint)
      if (appId === 'purchase' && subModule === 'orders' && (newData.statut === 'Réceptionné' || newData.statut === 'Facturé')) {
        const transactionId = `TRANS-PURCH-${id}`;
        const alreadyExists = prev.finance?.treasury?.some(t => t.id === transactionId);
        
        if (!alreadyExists && nextState.finance?.treasury) {
          const newTransaction = {
            id: transactionId,
            libelle: `Paiement ${record.num} - ${record.fournisseur}`,
            montant: -record.total,
            date: new Date().toISOString().split('T')[0],
            type: 'Décaissement'
          };
          nextState.finance.treasury = [newTransaction, ...nextState.finance.treasury];
          
          addHint({
            title: "Trésorerie mise à jour",
            message: `L'achat ${record.num} a été impacté en comptabilité.`,
            appId: 'accounting',
            type: 'info'
          });
        }
      }

      return nextState;
    });
  };

  const [currentUser, setCurrentUser] = useState(() => {
    return safeParse('ipc_erp_current_user', { id: 'superadmin', nom: 'Super Admin', role: 'SUPER_ADMIN' });
  });

  useEffect(() => {
    localStorage.setItem('ipc_erp_current_user', JSON.stringify(currentUser));
    localStorage.setItem('daxcelor_user_role', currentUser.role);

    // Sync with Firestore if logged in
    const syncUserToCloud = async () => {
      if (auth.currentUser) {
        try {
          console.log("Synchronisation du profil Admin vers le Cloud...");
          const userDoc = doc(db, 'users', auth.currentUser.uid);
          await setDoc(userDoc, { config, permissions, data }, { merge: true });
          console.log("Profil Admin synchronisé avec succès.");
        } catch (e) {
          console.warn("Erreur synchronisation Cloud (attendu lors du bootstrap):", e.message);
        }
      }
    };
    syncUserToCloud();
  }, [currentUser, config, permissions, data]);

  // Firebase Auth Listener
  useEffect(() => {
    console.log("Initialisation Firebase Auth...");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("Utilisateur Firebase connecté:", user.email);
        // Logged in
        // Role Logic with Bootstrap fallback for Super Admin
        let userRole = 'STAFF';
        const superAdmins = ['ra.yoman@ipcgreenblocks.com', 'fall.jcjunior@gmail.com'];
        if (superAdmins.includes(user.email)) {
          userRole = 'SUPER_ADMIN';
        }

        if (docSnap.exists()) {
          const userData = docSnap.data();
          if (userData.data) setData(userData.data);
          if (userData.config) setConfig(userData.config);
          
          setCurrentUser({
            id: user.uid,
            nom: userData.profile?.nom || user.displayName || user.email.split('@')[0],
            email: user.email,
            poste: userData.profile?.poste || (userRole === 'SUPER_ADMIN' ? 'Admin Suprême' : 'Utilisateur'),
            dept: userData.profile?.dept || 'Direction',
            role: userData.profile?.role || userRole
          });
          
          if (userData.permissions) {
            setPermissions(prev => ({
              ...prev,
              [user.uid]: userData.permissions
            }));
          }
        } else {
          // Bootstrap mode for first installation
          const initialUser = {
            id: user.uid,
            nom: user.displayName || user.email.split('@')[0],
            email: user.email,
            poste: userRole === 'SUPER_ADMIN' ? 'Admin Suprême' : 'Utilisateur',
            dept: 'Direction',
            role: userRole
          };
          setCurrentUser(initialUser);
          
          if (userRole === 'SUPER_ADMIN') {
            setPermissions(prev => ({
              ...prev,
              [user.uid]: {
                roles: ['SUPER_ADMIN'],
                allowedModules: ['home', 'crm', 'sales', 'inventory', 'accounting', 'hr', 'production', 'projects', 'purchase', 'marketing', 'bi', 'masterdata', 'calendar', 'helpdesk', 'timesheets', 'fleet', 'quality', 'expenses', 'budget', 'dms', 'contracts', 'manufacturing', 'planning', 'analytics', 'settings', 'studio', 'user_management']
              }
            }));
          }
        }
      } else {
        // Logged out - Reset to default
        setData(mockData);
        setCurrentUser({ id: 'guest', nom: 'Invité', role: 'GUEST' });
      }
    });
    return () => unsubscribe();
  }, []);

  // Shared Data Listeners (Real-time Team Sync)
  useEffect(() => {
    if (!auth.currentUser) return;

    const collectionsToSync = ['crm', 'sales', 'inventory', 'accounting', 'projects', 'audit_logs'];
    const unsubscribes = collectionsToSync.map(colName => {
      const q = query(collection(db, colName), orderBy('createdAt', 'desc'), limit(100));
      return onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
        
        setData(prev => {
          const newState = { ...prev };
          if (colName === 'audit_logs') {
             newState.audit = { ...newState.audit, logs: docs };
          } else {
            // Group docs by subModule (e.g., 'leads', 'opportunities')
            const grouped = {};
            docs.forEach(doc => {
              const sub = doc.subModule || 'others';
              if (!grouped[sub]) grouped[sub] = [];
              grouped[sub].push(doc);
            });
            newState[colName] = { ...prev[colName], ...grouped };
          }
          return newState;
        });
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [auth.currentUser]);

  // Workflow Listener
  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'workflows'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setWorkflows(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
    });
    return () => unsubscribe();
  }, [auth.currentUser]);

  // Global Settings Listener
  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribe = onSnapshot(doc(db, 'settings', 'global'), (doc) => {
      if (doc.exists()) {
        setGlobalSettings(doc.data());
      }
    });
    return () => unsubscribe();
  }, [auth.currentUser]);

  const logout = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem('ipc_erp_current_user');
      localStorage.removeItem('daxcelor_data');
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
    }
  };

  const switchUser = null;

  const approveRequest = (appId, subModule, id) => {
    updateRecord(appId, subModule, id, { statut: 'Validé', validatedBy: currentUser.nom, validatedAt: new Date().toISOString() });
    addHint({
      title: "Demande Approuvée",
      message: `La demande a été validée avec succès.`,
      type: 'success',
      appId: appId
    });
  };

  const rejectRequest = (appId, subModule, id) => {
    updateRecord(appId, subModule, id, { statut: 'Refusé', validatedBy: currentUser.nom, validatedAt: new Date().toISOString() });
  };

  const userRole = currentUser.role;
  const switchRole = null;

  const [activeApp, setActiveApp] = useState('home');

  const navigateTo = (appId) => {
    setActiveApp(appId);
  };

  return (
    <BusinessContext.Provider value={{ 
      data, 
      userRole, 
      switchRole, 
      addRecord, 
      updateRecord, 
      globalSearch, 
      searchResults,
      hints,
      dismissHint,
      config,
      updateConfig,
      globalSettings,
      updateGlobalSettings,
      addCustomField,
      currentUser,
      switchUser,
      permissions,
      updateUserRole,
      toggleModuleAccess,
      approveRequest, 
      rejectRequest,
      createFullUser,
      deleteFullUser,
      logout,
      activeApp,
      setActiveApp,
      navigateTo,
      formatCurrency: (val, compact = false) => {
        if (typeof val !== 'number') return val;
        
        if (compact) {
          const formatter = new Intl.NumberFormat('fr-FR', {
            notation: 'compact',
            compactDisplay: 'short',
            maximumFractionDigits: 1
          });
          return formatter.format(val).replace('B', 'Md') + ' ' + (globalSettings.currency || 'FCFA');
        }
        
        return val.toLocaleString('fr-FR').replace(/\u00a0/g, ' ') + ' ' + (globalSettings.currency || 'FCFA');
      }
    }}>
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => useContext(BusinessContext);
