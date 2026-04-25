import { doc, getDoc, getDocs, setDoc, updateDoc, onSnapshot, collection, query, orderBy, limit, deleteDoc, where, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db, storage, auth, firebaseConfig } from '../../firebase/config';

export const createOperationsSlice = (set, get) => ({
addHint: (hint) => {
    setTimeout(() => {
      const id = Date.now().toString();
      setHints(prev => [{ ...hint, id }, ...prev]);
    }, 0);
  },

  dismissHint: (id) => {
    setHints(prev => prev.filter(h => h.id !== id));
  },

  logAction: (action, detail, appId = 'system', targetId = null) => {
    const activity = {
      id: Math.random().toString(36).substr(2, 9),
      action,
      detail,
      appId,
      targetId,
      user: get().user.nom,
      timestamp: new Date().toISOString(),
      type: 'log',
      brandId: get().globalSettings.brand !== 'ALL' ? get().globalSettings.brand : 'IPC_CORE'
  },
    setTimeout(() => {
      set(prev => ({
        ...prev,
        activities: [activity, ...(prev.activities || [])]
      }));

      if (auth.currentUser) {
        setDoc(doc(db, 'activities', activity.id), activity);
      }
    }, 0);
  },


  sendNotification: async (targetRole, title, message, type = 'info', actionApp = null, targetUserId = null) => {
    const notifyDoc = {
      id: Date.now().toString(),
      targetRole,
      targetUserId,
      title,
      message,
      type,
      actionApp,
      readBy: [],
      createdAt: new Date().toISOString()
  },
    try {
      if (auth.currentUser) await setDoc(doc(db, 'notifications', notifyDoc.id), notifyDoc);
    } catch (e) {
      console.error("sendNotification Error:", e);
    }
  },

  /* ══════════════════════════════════════════════════════════════════════════
     ADMIN LOGIC (User Management)
     ══════════════════════════════════════════════════════════════════════════ */

  updateUserRole: (userId, newRole) => {
    setPermissions(prev => {
      const userPerms = prev[userId] || { roles: [], moduleAccess: {} };
      const newPerms = { ...userPerms, roles: [newRole] };
      
      if (auth.currentUser) {
        setDoc(doc(db, 'users', userId), { permissions: newPerms }, { merge: true })
          .catch(e => console.error("Erreur save role:", e));
      }
      return { ...prev, [userId]: newPerms };
    });
  },

  setModuleAccessLevel: (userId, moduleId, level) => {
    setPermissions(prev => {
      const userPerms = prev[userId] || { roles: [], moduleAccess: {} };
      const newModuleAccess = { ...(userPerms.moduleAccess || {}) };
      
      if (level === 'none') {
        delete newModuleAccess[moduleId];
      } else {
        newModuleAccess[moduleId] = level;
      }
      
      const newPerms = { ...userPerms, moduleAccess: newModuleAccess };
      
      // Clean up legacy allowedModules if present
      if (newPerms.allowedModules) delete newPerms.allowedModules;

      if (auth.currentUser) {
        setDoc(doc(db, 'users', userId), { permissions: newPerms }, { merge: true })
          .catch(e => console.error("Erreur save permissions:", e));
      }
      return { ...prev, [userId]: newPerms };
    });
  },

  getModuleAccess: (userId, moduleId) => {
    // 1. Super Admin Bypass
    if (currentUser?.role === 'SUPER_ADMIN') return 'write';

    const userPerms = permissions[userId];
    if (!userPerms) return 'none';
    
    // Check for explicit SUPER_ADMIN role in matrix (redundant but safe)
    if (userPerms.roles?.includes('SUPER_ADMIN')) return 'write';
    
    // Special case for 'home' - always write access for authenticated users
    if (moduleId === 'home') return 'write';

    // Check new structure
    if (userPerms.moduleAccess && userPerms.moduleAccess[moduleId]) {
      return userPerms.moduleAccess[moduleId];
    }
    
    // Check legacy structure
    if (Array.isArray(userPerms.allowedModules) && userPerms.allowedModules.includes(moduleId)) {
      return 'write';
    }
    
    return 'none';
  },

  createFullUser: async (userData, source = 'admin') => {
    let secondaryApp;
    try {
      secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
      const userCredential = await createUserWithEmailAndPassword(getAuth(secondaryApp), userData.email, userData.password);
      const uid = userCredential.user.uid;
      
      const role = userData.role || 'STAFF';
      const profileData = { 
        nom: userData.nom, 
        email: userData.email, 
        poste: userData.poste, 
        id: uid, 
        dept: userData.dept || '',
        avatar: userData.avatar || userData.nom[0],
        statut: source === 'admin' ? 'À compléter' : 'Actif',
        active: true,
        createdAt: new Date().toISOString() 
  },
      const permissionsData = {
        roles: userData.roles || [role],
        moduleAccess: userData.moduleAccess || { home: 'write' },
        // Legacy fallback
        allowedModules: userData.allowedModules || Object.keys(userData.moduleAccess || { home: 'write' })
  },
      // 1. Create User Document
      await setDoc(doc(db, 'users', uid), { 
        profile: profileData, 
        permissions: permissionsData, 
        data: {} 
      });

      // 2. Create HR Record with exact employee structure
      await setDoc(doc(db, 'hr', uid), { 
         ...profileData, 
         subModule: 'employees',
         salaire: userData.salaire || 0,
         contratType: userData.contratType || 'CDI',
         contratDuree: userData.contratDuree || '',
      });

      // 3. Send Notification
      if (source === 'hr') {
        await get().sendNotification('SUPER_ADMIN', 'Onboarding Finalisé', `Le compte de ${userData.nom} a été généré via Onboarding RH.`, 'user', 'hr');
      } else {
        await get().sendNotification('RH', 'Nouvel Utilisateur Provisionné', `Un compte pour ${userData.nom} a été créé par l'Admin. Veuillez compléter son profil RH.`, 'user', 'hr');
      }

      return { success: true, uid };
    } finally { if (secondaryApp) deleteApp(secondaryApp); }
  },
 
  toggleUserStatus: async (userId, newStatus) => {
    const uid = String(userId);
    try {
      if (auth.currentUser) {
        await setDoc(doc(db, 'users', uid), { profile: { active: newStatus } }, { merge: true });
        await setDoc(doc(db, 'hr', uid), { active: newStatus }, { merge: true });
      }
      get().logAction(newStatus ? 'Réactivation Utilisateur' : 'Désactivation Utilisateur', `ID: ${uid}`, 'system');
      return { success: true };
    } catch (e) {
      console.error("toggleUserStatus error:", e);
      throw e;
    }
  },


  permanentlyDeleteUserRecord: async (userId) => {
    const uid = String(userId);
    
    // Call Cloud Function to delete from Firebase Authentication
    try {
      const functions = getFunctions();
      const deleteUserFunc = httpsCallable(functions, 'deleteUserAccount');
      await deleteUserFunc({ uid });
    } catch (err) {
      console.error("Erreur suppression Auth:", err);
      if (addHint) {
        get().addHint({ 
          title: "Suppression Auth Échouée", 
          message: "Le compte n'a pas pu être supprimé de Firebase Authentication (vérifiez les logs functions).", 
          type: 'warning' 
        });
      }
    }

    if (auth.currentUser) {
      await deleteDoc(doc(db, 'users', uid));
      await deleteDoc(doc(db, 'hr', uid));
    }
    set(prev => ({ 
      ...prev, 
      hr: { ...prev.hr, employees: (prev.hr?.employees || []).filter(e => String(e.id) !== uid) },
      base: { ...prev.base, users: (prev.base?.users || []).filter(u => String(u.id) !== uid) }
    }));
    setPermissions(prev => { const next = { ...prev }; delete next[uid]; return next; });
    get().logAction('Suppression Définitive Utilisateur', `ID: ${uid}`, 'system');
  },

  /* ══════════════════════════════════════════════════════════════════════════
     5. DATA MUTATION LOGIC (Topological Order)
     ══════════════════════════════════════════════════════════════════════════ */

  // A. Accounting Basics
  addAccountingEntry: (entry, lines) => {
    const totalDebit = lines.reduce((s, l) => s + parseFloat(l.debit || 0), 0);
    const totalCredit = lines.reduce((s, l) => s + parseFloat(l.credit || 0), 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      get().addHint({ title: "Erreur d'équilibre", message: "Le total débit doit être égal au total crédit.", type: 'error' });
      return false;
    }

    const entryId = Date.now().toString();
    const newEntry = { ...entry, id: entryId, createdAt: new Date().toISOString(), total: totalDebit };
    const newLines = lines.map(l => ({ ...l, id: Math.random().toString(36).substr(2, 9), entryId, createdAt: new Date().toISOString() }));

    set(prev => ({
      ...prev,
      finance: {
        ...prev.finance,
        entries: [newEntry, ...(prev.finance.entries || [])],
        lines: [...newLines, ...(prev.finance.lines || [])]
      }
    }));

    if (auth.currentUser) {
      setDoc(doc(db, 'finance', entryId), { ...newEntry, subModule: 'entries' });
      newLines.forEach(l => setDoc(doc(db, 'finance', l.id), { ...l, subModule: 'lines' }));
    }

    get().logAction('Écriture Comptable', entry.libelle, 'finance');
    return true;
  },

  // B. Specialized Generators
  generateInvoiceEntry: (invoice) => {
    const entry = {
      libelle: `Facture Client ${invoice.num}`,
      date: invoice.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
      journalCode: 'J-VT',
      piece: invoice.num
  },
    const lines = [
      { accountId: '411100', label: invoice.client, debit: invoice.montant, credit: 0 },
      { accountId: '701100', label: 'Vente de marchandises', debit: 0, credit: invoice.montant }
    ];

    get().addAccountingEntry(entry, lines);
  },

  generateProductionEntry: (mo) => {
    const bom = get().data.production?.boms?.find(b => b.product === mo.produit || b.productId === mo.produitId);
    if (!bom) return;
    const totalCost = (bom.coutEstime || 500) * (mo.qte || 0);
    const entry = {
      libelle: `Production OF ${mo.num || mo.id}`,
      date: new Date().toISOString().split('T')[0],
      journalCode: 'J-PROD',
      piece: mo.num || mo.id
  },
    const lines = [
      { accountId: '713100', label: 'Entrée Stock PF', debit: totalCost, credit: 0, profitCenter: 'Usine' },
      { accountId: '603100', label: 'Consommation Stock MP', debit: 0, credit: totalCost, profitCenter: 'Usine' }
    ];
    get().addAccountingEntry(entry, lines);
  },

  generateExpenseEntry: (expense) => {
    const isPaie = expense.type === 'Salaires';
    const entry = {
      libelle: isPaie ? `Décaissement Salaires: ${expense.title || expense.libelle}` : `Règlement Achat: ${expense.title || expense.libelle || expense.fournisseur}`,
      date: expense.date || new Date().toISOString().split('T')[0],
      journalCode: isPaie ? 'J-BQ' : 'J-ACH',
      piece: expense.num || expense.id
  },
    const lines = [
      { accountId: isPaie ? '421000' : '601100', label: expense.title || expense.libelle, debit: expense.amount || expense.montant, credit: 0, profitCenter: expense.dept || 'Administration' },
      { accountId: '521100', label: 'Règlement Banque', debit: 0, credit: expense.amount || expense.montant, profitCenter: 'Administration' }
    ];
    get().addAccountingEntry(entry, lines);
  },

  generateLitigationEntry: (litigation, isProvision = true) => {
    const entry = {
      libelle: isProvision ? `Provision Risque : ${litigation.objet}` : `Annulation Provision : ${litigation.objet}`,
      date: new Date().toISOString().split('T')[0],
      journalCode: 'J-OD',
      piece: litigation.id
  },
    const amount = litigation.risqueFinancier || 0;
    const lines = [
      { accountId: '686000', label: 'Dotations aux provisions', debit: isProvision ? amount : 0, credit: isProvision ? 0 : amount },
      { accountId: '151000', label: 'Provisions pour litiges', debit: isProvision ? 0 : amount, credit: isProvision ? amount : 0 }
    ];
    get().addAccountingEntry(entry, lines);
  },


  // C. Physical Moves
  applyStockMove: (movementData) => {
    const { productId, qte, type, ref, source, dest } = movementData;
    const qteNum = parseFloat(qte);
    set(prev => {
      const products = prev.inventory?.products || [];
      const product = products.find(p => p.id === productId || p.code === productId);
      if (!product) {
        get().addHint({ title: "Produit non trouvé", message: `ID: ${productId}`, type: 'error' });
        return prev;
      }
      const isOut = ['Expédition', 'Consommation', 'Ajustement Sortie'].includes(type);
      const newStock = isOut ? (product.stock || 0) - qteNum : (product.stock || 0) + qteNum;
      const updatedProducts = products.map(p => (p.id === productId || p.code === productId) ? { ...p, stock: newStock } : p);
      const seqKey = 'inventory_movements';
      const mvtNum = get().getNextSequence(seqKey);
      const newMove = { id: Date.now().toString(), num: mvtNum, date: new Date().toISOString(), produit: product.nom, produitId: product.id, type, qte: qteNum, ref: ref || 'Interne', source: source || 'Entrepôt Principal', dest: dest || 'Client/Transit', createdAt: new Date().toISOString() };
      
      // Auto-Replenishment Logic (SSOT)
      const pointDeCommande = parseFloat(product.alerte || product.seuilAlerte || 0);
      let newPoDraft = null;

      if (pointDeCommande > 0) {
         const pendingPurchases = (prev.purchase?.orders || []).filter(o => (o.produitId === product.id || o.produitId === product.code) && o.statut !== 'Réceptionné' && o.statut !== 'Annulé').reduce((sum, o) => sum + parseFloat(o.qte || 0), 0);
         const pendingSales = (prev.sales?.orders || []).filter(o => (o.produitId === product.id || o.produitId === product.code) && o.statut !== 'Livré' && o.statut !== 'Annulé' && o.statut !== 'Gagné').reduce((sum, o) => sum + parseFloat(o.qte || 0), 0);
         const stockProjete = newStock + pendingPurchases - pendingSales;

         if (stockProjete <= pointDeCommande) {
            const qteACommander = Math.max((pointDeCommande * 2) - stockProjete, 10);
            const poNum = `CMD-AUTO-${Date.now().toString().slice(-4)}-${product.id.substring(0, 4)}`;
            
            newPoDraft = {
               id: `PO-AUTO-${Date.now()}`,
               num: poNum,
               fournisseur: product.fournisseur || 'FOURNISSEUR_AUTO',
               produitId: product.id,
               qte: qteACommander,
               qteRecue: 0,
               qteFacturee: 0,
               statut: 'Brouillon',
               date: new Date().toISOString().split('T')[0],
               createdAt: new Date().toISOString()
  },
            get().addHint({ title: "Réassort Automatique", message: `Stock projeté critique (${stockProjete}). Brouillon d'achat ${poNum} généré pour ${qteACommander} unitées.`, type: 'warning', appId: 'purchase' });
         } else if (newStock <= pointDeCommande) {
            get().addHint({ title: "Alerte Stock Bas", message: `Stock critique (${newStock}) mais réassort déjà en cours (Projeté: ${stockProjete}).`, type: 'info', appId: 'inventory' });
         }
      } else if (newStock <= (product.alerte || 0)) {
         get().addHint({ title: "Alerte Stock Bas", message: `Le stock de "${product.nom}" est critique (${newStock} unités).`, type: 'warning', appId: 'inventory' });
      }

      get().logAction(`Mouvement Stock (${type})`, `${product.nom} : ${qteNum} u.`, 'inventory');
      
      const nextState = { ...prev, inventory: { ...prev.inventory, products: updatedProducts, movements: [newMove, ...(prev.inventory?.movements || [])] } };
      if (newPoDraft) {
         nextState.purchase = { ...prev.purchase, orders: [newPoDraft, ...(prev.purchase?.orders || [])] };
      }
      return nextState;
    });
  },

  applyMOTransformation: (moId) => {
    set(prev => {
      const mo = prev.production?.workOrders?.find(o => o.id === moId);
      if (!mo) return prev;
      const bom = prev.production?.boms?.find(b => b.produit === mo.produit || b.product === mo.produit || b.productId === mo.produitId);
      if (!bom) {
        get().addHint({ title: "BOM Manquante", message: `Aucune nomenclature trouvée pour ${mo.produit}`, type: 'warning' });
        return prev;
      }
      let componentsList = [];
      try { componentsList = typeof bom.components === 'string' ? JSON.parse(bom.components) : (bom.components || []); } catch (e) { componentsList = []; }
      
      // Appliquer la décrémentation des stocks des matières premières (MRP)
      componentsList.forEach(comp => applyStockMove({ productId: comp.productId, qte: comp.qte * (mo.qte || 0), type: 'Consommation', ref: `OF-${mo.num || mo.id}` }));
      
      // Appliquer l'incrémentation du nouveau produit fini
      const finalProductId = bom.productId || mo.produitId || prev.inventory?.products?.find(p => p.nom === mo.produit)?.id;
      if (finalProductId) {
        applyStockMove({ productId: finalProductId, qte: mo.qte, type: 'Réception', ref: `OF-${mo.num || mo.id}` });
      }
      get().addHint({ title: "Production Terminée", message: `Transformation réussie : ${mo.qte} unités produites. Stocks mis à jour.`, type: 'success', appId: 'production' });
      return prev;
    });
  },

  // D. Higher-level Workflows
  processOrderValidation: (order) => {
    const invoiceNum = get().getNextSequence('finance_invoices');
    const newInvoice = { id: Date.now().toString(), num: invoiceNum, client: order.client, montant: order.montant, statut: 'À Payer', orderId: order.id, createdAt: new Date().toISOString() };
    set(prev => ({ ...prev, finance: { ...prev.finance, invoices: [newInvoice, ...(prev.finance?.invoices || [])] } }));
    get().addHint({ title: "Flux Cascade Activé", message: `Facture ${invoiceNum} générée + Expédition de stock initiée.`, type: 'info', appId: 'finance' });
    get().logAction('Validation Commande', `Généré Facture ${invoiceNum} & Livraison pour ${order.num}`, 'system');
  },

  convertOppToSalesOrder: (oppId) => {
    set(prev => {
      const opp = prev.crm?.opportunities?.find(o => o.id === oppId);
      if (!opp) return prev;
      const orderNum = get().getNextSequence('sales_orders');
      const newOrder = { id: Date.now().toString(), num: orderNum, client: opp.client, clientContact: opp.nom || opp.titre, montant: opp.montant, statut: 'Brouillon', oppId: opp.id, createdAt: new Date().toISOString() };
      get().addHint({ title: "Commande Créée", message: `Le Bon de Commande ${orderNum} a été généré avec succès.`, type: 'success', appId: 'sales' });
      get().logAction('Conversion Opportunité', `Génération ${orderNum} depuis ${opp.id}`, 'sales');
      return { ...prev, sales: { ...prev.sales, orders: [newOrder, ...(prev.sales?.orders || [])] } };
    });
  },

  // E. Record Operations (Final Handlers)
  addRecord: (appId, subModule, inputData) => {
    let processedRecord = { ...inputData };
    if (!processedRecord.num || processedRecord.num === "") {
      const seqKey = `${appId}__${subModule}`;
      if (get().data.base?.sequences?.[seqKey]) processedRecord.num = get().getNextSequence(seqKey);
    }
    const newRecord = { 
      ...processedRecord, 
      id: processedRecord.id || Date.now().toString() + Math.random().toString(36).substr(2, 5), 
      createdAt: processedRecord.createdAt || new Date().toISOString(),
      brandId: get().globalSettings.brand !== 'ALL' ? get().globalSettings.brand : 'IPC_CORE'
  },
    set(prev => {
      const moduleData = prev[appId] || {};
      const subModuleData = moduleData[subModule] || [];
      const nextState = { ...prev, [appId]: { ...moduleData, [subModule]: [newRecord, ...subModuleData] } };
      
      setTimeout(() => {
         get().logAction(`Création ${subModule}`, `${processedRecord.num || newRecord.id}`, appId);
         if (auth.currentUser) setDoc(doc(db, appId, newRecord.id), { ...newRecord, subModule, ownerId: auth.get().user.uid }, { merge: true });
      }, 0);

      return nextState;
    });

    // Workflow: Legal ↔ Finance (Provisions)
    if (appId === 'legal' && subModule === 'litigations' && processedRecord.risqueFinancier > 0) {
      generateLitigationEntry(newRecord, true);
    }

    if (appId === 'inventory' && subModule === 'movements') applyStockMove({ productId: processedRecord.produitId || processedRecord.produit, qte: processedRecord.qte, type: processedRecord.type, ref: processedRecord.ref, source: processedRecord.source, dest: processedRecord.dest });

    // --- I.P.C. Automator (BPM Engine) onCreate ---
    const safeWorkflowsCreate = Array.isArray(get().data.workflows) ? get().data.workflows : (get().data.workflows?.[''] || get().data.workflows?.workflows || []);
    const activeWorkflowsCreate = safeWorkflowsCreate.filter(w => w.active && w.targetModule === `${appId}.${subModule}` && w.triggerEvent === 'onCreate');
    activeWorkflowsCreate.forEach(wf => {
       const recordFieldVal = newRecord[wf.conditionField];
       let conditionMet = false;
       if (!wf.conditionField) conditionMet = true;
       else if (wf.operator === '==') conditionMet = recordFieldVal == wf.value;
       else if (wf.operator === '!=') conditionMet = recordFieldVal != wf.value;
       else if (wf.operator === '>') conditionMet = recordFieldVal > parseFloat(wf.value);
       else if (wf.operator === '<') conditionMet = recordFieldVal < parseFloat(wf.value);
       else if (wf.operator === 'contains') conditionMet = String(recordFieldVal || '').toLowerCase().includes(String(wf.value).toLowerCase());

       if (conditionMet) {
           if (wf.actionType === 'SEND_NOTIFICATION') {
               const msg = wf.actionPayload.replace('{statut}', newRecord.statut || '').replace('{num}', newRecord.num || newRecord.id);
               get().sendNotification(wf.actionTargetRole, `Auto: ${wf.name}`, msg, 'info', appId);
           } else if (wf.actionType === 'LOG_ACTION') {
               get().logAction('I.P.C. Automator', wf.actionPayload, appId, newRecord.id);
           }
           get().addHint({ title: "💡 Règle Exécutée", message: `La règle "${wf.name}" a été déclenchée.`, type: 'info', appId });
       }
    });
  },


  updateRecord: (appId, subModule, id, newData) => {
    set(prev => {
      if (!prev[appId] || !prev[appId][subModule]) return prev;
      const oldRecord = prev[appId][subModule].find(i => i.id === id);
      if (!oldRecord) return prev;
      const changes = Object.keys(newData).filter(key => newData[key] !== oldRecord[key]).map(key => `${key}: ${oldRecord[key] || 'vide'} → ${newData[key]}`).join(', ');
      const updatedList = prev[appId][subModule].map(item => item.id === id ? { ...item, ...newData } : item);
      let nextState = { ...prev, [appId]: { ...prev[appId], [subModule]: updatedList } };
      const record = updatedList.find(o => o.id === id);
      setTimeout(() => {
         get().logAction(`Modification ${subModule}`, changes ? `Changements sur ${record.num || id}: ${changes}` : `Mise à jour ${record.num || id}`, appId, id);
         if (auth.currentUser) setDoc(doc(db, appId, id), { ...record, subModule, updatedAt: new Date().toISOString() }, { merge: true });
      }, 0);
      
      if (appId === 'production' && subModule === 'workOrders' && newData.statut === 'Terminé' && oldRecord.statut !== 'Terminé') {
        applyMOTransformation(id);
        generateProductionEntry(record);
      }
      if (appId === 'crm' && subModule === 'opportunities' && newData.etape === 'Gagné' && oldRecord.etape !== 'Gagné') {
        get().addHint({ title: "Affaire Gagnée !", message: `L'opportunité "${record.titre}" est gagnée. Prêt à lancer la vente ?`, type: 'success', appId: 'sales', actionLabel: "Générer Commande", onAction: () => convertOppToSalesOrder(id) });
      }
      if (appId === 'sales' && subModule === 'orders' && newData.statut === 'Confirmé' && oldRecord.statut !== 'Confirmé') {
        // Workflow: Sales ↔ Legal (Lock if modified)
        if (record.modifieHorsTemplate) {
           get().addHint({ 
             title: "Visa Juridique Manquant", 
             message: "Ce contrat a été modifié hors template. Le statut est bloqué en attente de visa.", 
             type: 'error', 
             appId: 'legal' 
           });
           // Revert Confirmé to 'Attente Visa'
           const revertedList = updatedList.map(item => item.id === id ? { ...item, statut: 'Attente Visa Juridique' } : item);
           nextState = { ...prev, [appId]: { ...prev[appId], [subModule]: revertedList } };
           get().sendNotification('Juridique', 'Visa requis pour commande modifiée', 'warning', 'legal');
        } else {
           processOrderValidation(record);
        }
      }

      // Workflow: Legal ↔ Finance (Closing litigation)
      if (appId === 'legal' && subModule === 'litigations' && (newData.statut === 'Gagné' || newData.statut === 'Clos') && oldRecord.statut === 'En cours') {
         generateLitigationEntry(record, false);
      }

      // Workflow: RH ↔ Juridique (Visa final)
      if (appId === 'hr' && subModule === 'employees' && newData.statut === 'Signé' && !record.visaJuridique) {
         get().addHint({ title: "Visa Juridique Requis", message: "Le contrat de travail nécessite le visa du pôle juridique avant signature finale.", type: 'warning', appId: 'legal' });
         const revertedList = updatedList.map(item => item.id === id ? { ...item, statut: 'Validation Juridique' } : item);
         nextState = { ...prev, [appId]: { ...prev[appId], [subModule]: revertedList } };
      }

      // Workflow Signature (100% Souverain - Effet Domino)
      if (appId === 'signature' && subModule === 'requests' && newData.statut === 'Signé' && oldRecord.statut !== 'Signé') {
         // Domino 1: Archiver dans le module Juridique
         const legalContract = {
           id: `L-PKI-${Date.now().toString().slice(-4)}`,
           titre: record.titre,
           type: 'Contrat Scellé',
           partie: record.destinataires,
           dateEffet: record.dateSignature,
           statut: 'Signé',
           modifie: false,
           visaJuridique: true,
           hash: record.auditTrail?.hashDocument
  },
         nextState = { ...nextState, legal: { ...nextState.legal, contracts: [legalContract, ...(nextState.legal?.contracts || [])] } };
         get().addHint({ title: "Archivage Souverain", message: "Le document scellé a été archivé en sécurité dans le module juridique.", type: 'success', appId: 'legal' });
         
         // Domino 2: Validation du Devis (Sales)
         if (record.sourceId) {
             const salesList = nextState.sales?.orders || [];
             const saleIndex = salesList.findIndex(o => o.id === record.sourceId);
             if (saleIndex !== -1) {
                 const saleOld = salesList[saleIndex];
                 const updatedSalesList = [...salesList];
                 updatedSalesList[saleIndex] = { ...saleOld, statut: 'Confirmé' };
                 nextState = { ...nextState, sales: { ...nextState.sales, orders: updatedSalesList } };
                 get().addHint({ title: "Contrat Confirmé", message: `Le devis ${saleOld.num} a été automatiquement confirmé suite à la signature P.K.I.`, type: 'success', appId: 'sales' });
                 get().logAction('Effet Domino', `Devis ${saleOld.num} validé par signature P.K.I.`, 'sales', saleOld.id);
                 processOrderValidation(saleOld);
             }
         }
      }

      if (appId === 'finance' && subModule === 'invoices' && newData.statut === 'Payé' && oldRecord.statut !== 'Payé') {
        get().generateInvoiceEntry(record);
      }
      if (appId === 'hr' && subModule === 'expenses' && newData.statut === 'Payé' && oldRecord.statut !== 'Payé') {
        generateExpenseEntry(record);
      }
      if (appId === 'hr' && subModule === 'timesheets' && newData.statut === 'Validé' && oldRecord.statut !== 'Validé') {
         const employee = (prev.hr?.employees || []).find(e => e.nom === record.collaborateur);
         const salaireMensuel = parseFloat(employee?.salaire || 150000); // Estimation si non renseigné
         const tauxHoraire = parseFloat((salaireMensuel / 160).toFixed(2));
         const heures = parseFloat(record.heures || 0);
         const coutTotal = Math.round(heures * tauxHoraire);
         
         const entryNum = get().getNextSequence('finance_entries');
         const analyticalEntry = {
            num: entryNum,
            date: new Date().toISOString().split('T')[0],
            libelle: `Imputation Analytique - ${record.collaborateur} (${heures}h sur ${record.projet})`,
            journal: 'OD',
            statut: 'Brouillon',
  },
         const lines = [
            { accountId: '641100', label: 'Frais de Personnel', debit: coutTotal, credit: 0, profitCenter: record.projet || 'Général' },
            { accountId: '421000', label: 'Personnel - Rémunérations dues', debit: 0, credit: coutTotal, profitCenter: 'Administration' }
         ];
         get().addAccountingEntry(analyticalEntry, lines);
         get().addHint({ title: "Comptabilité Analytique", message: `Pointage validé. Coût affecté: ${coutTotal} FCFA sur [${record.projet}].`, type: 'success', appId: 'finance' });
         get().logAction('Imputation Analytique', `${coutTotal} FCFA pour ${heures}h affectés à ${record.projet}`, 'hr');
      }
      if (appId === 'purchase' && subModule === 'orders') {
        if (newData.statut === 'Réceptionné' && oldRecord.statut !== 'Réceptionné') {
          // Moteur SSOT: On incremente avec la qteRecue physiquement, pas celle de la commande théorique.
          const actualQte = parseFloat(record.qteRecue || record.qte || 0);
          applyStockMove({ 
            productId: record.produitId, 
            qte: actualQte, 
            type: 'Réception', 
            ref: `ACHAT-${record.num || record.id}`,
            source: record.fournisseur,
            dest: 'Entrepôt Principal'
          });
          get().addHint({ title: "Marchandise Réceptionnée", message: `La commande ${record.num || record.id} a été réceptionnée dans le stock (${actualQte} unités).`, type: 'success', appId: 'inventory' });
        }
        if (newData.statut === 'Facturé' && oldRecord.statut !== 'Facturé') {
           const billNum = get().getNextSequence('finance_vendor_bills') || `FF-${Date.now().toString().slice(-4)}`;
           
           // Three-Way Match Engine
           const qteCommandee = parseFloat(record.qte || 0);
           const qteRecue = parseFloat(record.qteRecue || qteCommandee);
           const qteFacturee = parseFloat(record.qteFacturee || qteCommandee);
           
           const threeWayMatch = (qteCommandee === qteRecue && qteRecue === qteFacturee);

           const newBill = {
             id: Date.now().toString(),
             num: billNum,
             fournisseur: record.fournisseur,
             date: new Date().toISOString().split('T')[0],
             montant: record.total,
             statut: threeWayMatch ? 'À payer' : 'Bloqué (Anomalie 3-Way Match)',
             orderId: record.id,
             qteCommandee,
             qteRecue,
             qteFacturee,
             anomalie: !threeWayMatch,
             createdAt: new Date().toISOString()
  },
           nextState = { ...nextState, finance: { ...nextState.finance, vendor_bills: [newBill, ...(nextState.finance?.vendor_bills || [])] } };
           
           if (!threeWayMatch) {
             get().addHint({ title: "Alerte Fraude (3-Way Match)", message: `Facture bloquée ! Divergence QTE: Cmd(${qteCommandee}) ≠ Reçue(${qteRecue}) ≠ Fact(${qteFacturee})`, type: 'error', appId: 'finance' });
             get().logAction('Alerte Financière', `Blocage Facture ${newBill.num} (Anomalie 3-Way Match)`, 'finance');
           } else {
             get().addHint({ title: "Facture Fournisseur Créée", message: `La facture ${newBill.num} est validée (Match Parfait).`, type: 'success', appId: 'finance' });
             get().logAction('Facturation Achat', `Facture ${newBill.num} générée pour ${record.num}`, 'finance');
           }
        }
      }

      // --- I.P.C. Automator (BPM Engine) onUpdate ---
      const safeWorkflowsUpdate = Array.isArray(prev.workflows) ? prev.workflows : (prev.workflows?.[''] || prev.workflows?.workflows || []);
      const activeWorkflowsUpdate = safeWorkflowsUpdate.filter(w => w.active && w.targetModule === `${appId}.${subModule}` && w.triggerEvent === 'onUpdate');
      activeWorkflowsUpdate.forEach(wf => {
         const recordFieldVal = newData[wf.conditionField] !== undefined ? newData[wf.conditionField] : oldRecord[wf.conditionField];
         let conditionMet = false;
         if (!wf.conditionField) conditionMet = true;
         else if (wf.operator === '==') conditionMet = recordFieldVal == wf.value;
         else if (wf.operator === '!=') conditionMet = recordFieldVal != wf.value;
         else if (wf.operator === '>') conditionMet = recordFieldVal > parseFloat(wf.value);
         else if (wf.operator === '<') conditionMet = recordFieldVal < parseFloat(wf.value);
         else if (wf.operator === 'contains') conditionMet = String(recordFieldVal || '').toLowerCase().includes(String(wf.value).toLowerCase());

         if (conditionMet) {
             if (wf.actionType === 'SEND_NOTIFICATION') {
                 const msg = wf.actionPayload.replace('{statut}', newData.statut || record.statut || '').replace('{num}', record.num || id);
                 get().sendNotification(wf.actionTargetRole, `Auto: ${wf.name}`, msg, 'info', appId);
             } else if (wf.actionType === 'UPDATE_STATUS') {
                 // Apply the status change on top of nextState directly
                 const finalUpdatedList = nextState[appId][subModule].map(item => item.id === id ? { ...item, statut: wf.actionPayload } : item);
                 nextState = { ...nextState, [appId]: { ...nextState[appId], [subModule]: finalUpdatedList } };
             } else if (wf.actionType === 'LOG_ACTION') {
                 get().logAction('I.P.C. Automator', wf.actionPayload, appId, id);
             }
             get().addHint({ title: "💡 Règle Exécutée", message: `La règle "${wf.name}" a été déclenchée avec succès.`, type: 'info', appId });
         }
      });
    return nextState;
    });
  },

  deleteRecord: (appId, subModule, id) => {
    // Special handling for user deletion to ensure Auth is also cleaned up
    if ((appId === 'admin' && subModule === 'users') || (appId === 'hr' && subModule === 'employees')) {
      permanentlyDeleteUserRecord(id);
      return;
    }

    set(prev => {
      const moduleData = prev[appId] || {};
      const subModuleData = moduleData[subModule] || [];
      const updatedList = subModuleData.filter(item => item.id !== id);
      const nextState = { ...prev, [appId]: { ...moduleData, [subModule]: updatedList } };
      setTimeout(() => {
         get().logAction(`Suppression ${subModule}`, `ID: ${id}`, appId);
         if (auth.currentUser) deleteDoc(doc(db, appId, id));
      }, 0);
      return nextState;
    });
  },

  processPOSOrder: (order) => {
    const newId = `POS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const dateStr = new Date().toISOString().split('T')[0];

    get().addRecord('commerce', 'posOrders', {
      id: newId,
      client: order.customer || 'Passager',
      montant: order.totalAmount,
      items: `Ticket avec ${order.cart.length} ligne(s)`,
      statut: 'Payé',
      date: dateStr,
      type: order.type || 'boutique'
    });

    get().addRecord('finance', 'incomes', {
      id: `FAC-${newId}`,
      description: `Vente Caisse (${order.type}) - ${order.customer || 'Passager'}`,
      montant: order.totalAmount,
      categorie: 'Ventes',
      statut: 'Payé',
      date: dateStr
    });

    // Decrement stock for each item in the cart
    set(prev => {
      const invProducts = prev.inventory?.products || [];
      const updatedProducts = invProducts.map(p => {
         const cartItem = order.cart.find(c => c.id === p.id);
         if (cartItem) {
            return { ...p, qte: Math.max(0, (p.qte || 0) - cartItem.qty) };
         }
         return p;
      });
      return { ...prev, inventory: { ...(prev.inventory || {}), products: updatedProducts } };
    });

    get().addHint({
       title: 'Vente Enregistrée',
       message: `Ticket ${newId} encaissé avec succès. Stock mis à jour.`,
       type: 'success'
    });
  },

  generatePayrollEntry: () => {
    const activeEmployees = (get().data.hr?.employees || []).filter(e => e.active !== false && e.salaire);
    if (activeEmployees.length === 0) {
      get().addHint({ title: "Masse Salariale Nulle", message: "Aucun salaire à générer pour les collaborateurs actifs.", type: 'warning' });
      return;
    }

    const { leaves = [] } = get().data.hr || {};
    
    // First, let's process each employee to find unpaid leave deductions
    const currentMonthPrefix = new Date().toISOString().substring(0, 7); // e.g. "2026-04"
    let massTotal = 0;
    
    const processedEmployees = activeEmployees.map(emp => {
      // Find valid Sans Solde leaves for this month
      const unpaidLeaves = leaves.filter(l => 
         (l.employe === emp.nom || l.collaborateur === emp.nom) && 
         (l.type === 'Sans Solde' || l.type === 'Congé Sans Solde') &&
         l.statut === 'Validé' &&
         l.du && l.du.startsWith(currentMonthPrefix)
      );
      
      let deductionSansSolde = 0;
      if (unpaidLeaves.length > 0) {
        // Simple calculation: each day is roughly salaire / 30
        const dailyRate = emp.salaire / 30;
        let unpaidDays = 0;
        unpaidLeaves.forEach(lv => {
           let d1 = new Date(lv.du);
           let d2 = new Date(lv.au);
           let diffTime = Math.abs(d2 - d1);
           let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
           unpaidDays += diffDays;
        });
        deductionSansSolde = dailyRate * unpaidDays;
      }
      
      const salaireFinale = Math.max(0, emp.salaire - deductionSansSolde);
      massTotal += salaireFinale;
      
      return {
        ...emp,
        salaireBaseBrut: emp.salaire,
        deductionSansSolde,
        salaireAjuste: salaireFinale
  },
    });

    const mois = new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
    
    const entry = {
      id: Date.now().toString(),
      libelle: `Masse Salariale - ${mois}`,
      date: new Date().toISOString().split('T')[0],
      journalCode: 'J-OD',
      piece: `PAIE-${mois.replace(' ', '-').toUpperCase()}`
  },
    const lines = [
      { accountId: '641100', label: `Salaires Bruts - ${mois}`, debit: massTotal, credit: 0, profitCenter: 'Administration' },
      { accountId: '421000', label: `Rémunérations Dues au Personnel`, debit: 0, credit: massTotal, profitCenter: 'Administration' }
    ];
    
    get().addAccountingEntry(entry, lines);

    const payrollExpense = {
      id: `EXP-PAYROLL-${Date.now()}`,
      title: `Paiement Mensuel: Salaires ${mois}`,
      amount: massTotal,
      date: new Date().toISOString().split('T')[0],
      type: 'Salaires',
      employee: 'Masse Salariale',
      statut: 'En attente'
  },
    get().addRecord('hr', 'expenses', payrollExpense);

    processedEmployees.forEach(emp => {
      const payslipRecord = {
        ...emp,
        salariesMois: mois,
        totalBrut: emp.salaireAjuste,
        absencesDeduites: emp.deductionSansSolde,
        netAPayer: emp.salaireAjuste * 0.78, // Simplified deduction roughly 22% social charges
        datePaiement: new Date().toISOString().split('T')[0]
  },
      const dmsFile = {
        id: `FP-${emp.id}-${Date.now()}`,
        name: `Fiche_Paie_${mois.replace(' ', '_')}_${emp.nom.replace(' ', '_')}.pdf`,
        type: 'PDF',
        owner: emp.nom,
        folder: 'Paies',
        size: '150 KB',
        metadata: {
           _appId: 'hr',
           _subModule: 'payslip',
           ...payslipRecord
        }
  },
      get().addRecord('dms', 'files', dmsFile);
    });

    get().addHint({ title: "Paie Exécutée", message: `La masse salariale de ${massTotal.toLocaleString('fr-FR')} a été comptabilisée et les fiches de paie ont été archivées.`, type: 'success', appId: 'hr' });
    get().logAction('Génération Paie', `Calcul de ${activeEmployees.length} salaires et fiches de paie pour ${mois}`, 'hr');
  },

  launchProductionOrder: (order) => {
    const bom = (get().data.production?.boms || []).find(b => b.id === order.bomId || b.produitId === order.produitId);
    if (!bom) {
      get().addHint({ title: "Nomenclature Manquante", message: `Aucune BOM trouvée pour ${order.produit}. Créez d'abord la nomenclature.`, type: 'warning' });
      return;
    }

    const composants = bom.composants || [];
    const shortages = [];

    // Deduct components from stock
    set(prev => {
      const nextProducts = (prev.inventory?.products || []).map(p => {
        const comp = composants.find(c => c.articleId === p.id);
        if (!comp) return p;
        const consumed = comp.qte * order.qte;
        const newQty = (p.qteStock || 0) - consumed;
        if (newQty < (p.seuilAlerte || 0)) {
          shortages.push({ article: p.designation, articleId: p.id, remaining: newQty, seuil: p.seuilAlerte });
        }
        return { ...p, qteStock: Math.max(0, newQty) };
      });
      return { ...prev, inventory: { ...prev.inventory, products: nextProducts } };
    });

    // Update OF status to En cours
    get().updateRecord('production', 'workOrders', order.id, { ...order, statut: 'En cours' });

    // Create draft purchase orders for shortages
    shortages.forEach(s => {
      const po = {
        id: `PO-AUTO-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        num: `CMD-AUTO-${new Date().toISOString().split('T')[0]}-${s.articleId}`,
        fournisseur: 'À définir (Auto)',
        produitId: s.articleId,
        qte: Math.ceil(s.seuil * 2),
        date: new Date().toISOString().split('T')[0],
        echeance: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        total: 0,
        statut: 'Brouillon',
        origine: `Auto-réappro OF ${order.num}`
  },
      get().addRecord('purchase', 'orders', po);
    });

    if (shortages.length > 0) {
      get().addHint({ title: "⚠️ Rupture détectée", message: `${shortages.length} article(s) en dessous du seuil. Commandes brouillon créées dans les Achats.`, type: 'warning', appId: 'production' });
    } else {
      get().addHint({ title: "✅ OF Lancé", message: `L'Ordre de Fabrication ${order.num} a été lancé. Stock mis à jour.`, type: 'success', appId: 'production' });
    }
    get().logAction('Production', `Lancement OF ${order.num} — ${order.qte} × ${order.produit}`, 'production');
  },


  /* ══════════════════════════════════════════════════════════════════════════
     6. GLOBAL LOGIC (Search & Config)
     ══════════════════════════════════════════════════════════════════════════ */


  globalSearch: (query) => {
    if (!query || query.length < 2) return get().setSearchResults([]);
    const q = query.toLowerCase();
    const results = [];
    
    // 1. Apps/Modules Navigation
    const apps = [
      { id: 'crm', label: 'CRM', type: 'Application' },
      { id: 'hr', label: 'RH', type: 'Application' },
      { id: 'finance', label: 'Finance', type: 'Application' },
      { id: 'inventory', label: 'Stocks', type: 'Application' },
      { id: 'accounting', label: 'Comptabilité', type: 'Application' },
      { id: 'dms', label: 'G.E.D', type: 'Application' }
    ];
    apps.filter(app => app.label.toLowerCase().includes(q)).forEach(app => results.push({ type: 'Module', name: app.label, appId: app.id }));

    // 2. Base Data
    if (get().data.base?.contacts) get().data.base.contacts.forEach(c => (c.nom.toLowerCase().includes(q)) && results.push({ type: 'Contact', name: c.nom, appId: 'base' }));
    
    // 3. HR
    if (get().data.hr?.employees) get().data.hr.employees.forEach(e => (e.nom.toLowerCase().includes(q)) && results.push({ type: 'Collaborateur', name: e.nom, appId: 'hr' }));
    
    // 4. CRM
    if (get().data.crm?.leads) get().data.crm.leads.forEach(l => (l.nom.toLowerCase().includes(q) || l.entreprise.toLowerCase().includes(q)) && results.push({ type: 'Lead', name: `${l.nom} (${l.entreprise})`, appId: 'crm' }));
    if (get().data.crm?.opportunities) get().data.crm.opportunities.forEach(o => (o.titre.toLowerCase().includes(q) || o.client.toLowerCase().includes(q)) && results.push({ type: 'Opportunité', name: o.titre, appId: 'crm' }));
    
    // 5. Finance/Sales
    if (get().data.finance?.invoices) get().data.finance.invoices.forEach(i => (i.num.toLowerCase().includes(q) || i.client.toLowerCase().includes(q)) && results.push({ type: 'Facture', name: `${i.num} - ${i.client}`, appId: 'finance' }));
    if (get().data.sales?.orders) get().data.sales.orders.forEach(o => (o.num.toLowerCase().includes(q) || o.client.toLowerCase().includes(q)) && results.push({ type: 'Bon de Commande', name: `${o.num} - ${o.client}`, appId: 'sales' }));
    
    // 6. Inventory
    if (get().data.inventory?.products) get().data.inventory.products.forEach(p => (p.nom.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) && results.push({ type: 'Article', name: p.nom, appId: 'inventory' }));

    get().setSearchResults(results.slice(0, 12));
  },

  updateConfig: (newConfig) => get().setConfig(prev => ({ ...prev, ...newConfig })),
  addCustomField: (appId, field) => get().setConfig(prev => ({ ...prev, customFields: { ...prev.customFields, [appId]: [...(prev.customFields?.[appId] || []), field] } })),
  updateGlobalSettings: async (newGlobal) => {
    if ((get().currentUser?.role) !== 'SUPER_ADMIN') return;
    get().setGlobalSettings(prev => ({ ...prev, ...newGlobal }));
    if (auth.currentUser) setDoc(doc(db, 'settings', 'global'), { ...newGlobal }, { merge: true });
  },

  togglePinnedModule: (moduleId) => {
    if ((get().currentUser?.role) !== 'SUPER_ADMIN') return;
    get().setGlobalSettings(prev => {
      const currentPinned = prev.pinnedModules || [];
      const newPinned = currentPinned.includes(moduleId) ? currentPinned.filter(m => m !== moduleId) : [...currentPinned, moduleId];
      return { ...prev, pinnedModules: newPinned };
    });
  },

  uploadLogo: async (file) => {
    if ((get().currentUser?.role) !== 'SUPER_ADMIN') throw new Error("Accès refusé");
    const storageRef = ref(storage, `brand/logos/master_logo_${Date.now()}`);
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      await updateGlobalSettings({ logoUrl: url });
      return url;
    } catch (error) {
      console.error("Erreur lors de l'upload du logo:", error);
      throw error;
    }
  },






  approveRequest: (appId, subModule, id) => {
    get().updateRecord(appId, subModule, id, { statut: 'Validé', validatedBy: get().user.nom, validatedAt: new Date().toISOString() });
    get().addHint({ title: "Demande Approuvée", type: 'success', appId });
  },

  rejectRequest: (appId, subModule, id) => {
    get().updateRecord(appId, subModule, id, { statut: 'Refusé', validatedBy: get().user.nom, validatedAt: new Date().toISOString() });
  },


  // --- IPC CONNECT SOCIAL HELPERS ---
  addConnectPost: (post) => {
    const newPost = { ...post, id: `f${Date.now()}`, date: 'À l\'instant', reactions: 0, liked: false, comments: [], createdAt: new Date().toISOString() };
    set(prev => ({
      ...prev,
      connect: { ...prev?.connect, posts: [newPost, ...(prev?.connect?.posts || [])] }
    }));
    get().logAction('Publication Sociale', post.title, 'connect');
  },

  likeConnectPost: (postId) => {
    set(prev => {
      const posts = prev?.connect?.posts || [];
      const updated = posts.map(p => p.id === postId ? { ...p, reactions: p.liked ? p.reactions - 1 : p.reactions + 1, liked: !p.liked } : p);
      return { ...prev, connect: { ...prev.connect, posts: updated } };
    });
  },

  addConnectComment: (postId, comment) => {
    set(prev => {
      const posts = prev?.connect?.posts || [];
      const updated = posts.map(p => p.id === postId ? { ...p, comments: [...(p.comments || []), { ...comment, id: Date.now() }] } : p);
      return { ...prev, connect: { ...prev.connect, posts: updated } };
    });
  },

  participateInEvent: (eventId) => {
    set(prev => {
      const events = prev?.connect?.events || [];
      const updated = events.map(e => e.id === eventId ? { ...e, attendees: (e.attendees || 0) + 1, participated: true } : e);
      return { ...prev, connect: { ...prev.connect, events: updated } };
    });
    get().addHint({ title: "Participation confirmée", message: "Vous êtes inscrit à cet événement !", type: 'success' });
  },

  /* ══════════════════════════════════════════════════════════════════════════
     7. CALLING & REALTIME NOTIFICATIONS
     ══════════════════════════════════════════════════════════════════════════ */
  playRingtone: () => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const startTime = audioCtx.currentTime;
    
    const playNote = (freq, time, duration) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine'; // Soft classic sound
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(time);
      osc.stop(time + duration);
  },
    // "Classic but soft" sequence
    for (let i = 0; i < 4; i++) {
        const offset = i * 2;
        playNote(660, startTime + offset, 0.4);      
        playNote(660, startTime + offset + 0.5, 0.4); 
        playNote(660, startTime + offset + 1.2, 0.6); 
    }
  },
  acceptCall: async () => {
    if (!get().activeCall) return;
    try {
      get().setActiveCall(prev => ({ ...prev, accepted: true }));
      await updateDoc(doc(db, 'calls', get().activeCall.id), { status: 'accepted' });
    } catch (err) { console.error("Accept Error:", err); }
  },
  rejectCall: async () => {
    if (!get().activeCall) return;
    try {
      await updateDoc(doc(db, 'calls', get().activeCall.id), { status: 'rejected' });
      get().setActiveCall(null);
    } catch (err) { console.error("Reject Error:", err); }
  },
  resetAllData: async () => {
    // Collections métier à purger dans Firestore
    const businessCollections = [
      'crm', 'sales', 'inventory', 'finance', 'hr',
      'production', 'purchase', 'marketing', 'activities',
      'notifications', 'connect'
    ];

    get().addHint({ title: "Purge en cours...", message: "Suppression des données Firestore et locales...", type: 'info' });

    try {
      if (auth.currentUser) {
        for (const col of businessCollections) {
          const snap = await getDocs(collection(db, col));
          // Firestore writeBatch = max 500 docs par batch
          const chunks = [];
          const docs = snap.docs;
          for (let i = 0; i < docs.length; i += 400) {
            chunks.push(docs.slice(i, i + 400));
          }
          for (const chunk of chunks) {
            const batch = writeBatch(db);
            chunk.forEach(d => batch.delete(d.ref));
            await batch.commit();
          }
        }
      }
    } catch (e) {
      console.error("Erreur purge Firestore:", e);
    }

    // Purge LocalStorage (données métier uniquement)
    const keysToKeep = ['ipc_erp_current_user', 'ipc_erp_config', 'ipc_erp_global_settings', 'ipc_erp_active_brand', 'ipc_erp_permissions'];
    Object.keys(localStorage).forEach(key => {
      if (!keysToKeep.includes(key)) localStorage.removeItem(key);
    });

    // Reset état React
    setData(mockData);
    get().addHint({ title: "✅ ERP Vierge", message: "Toutes les données (Firestore + Local) ont été effacées. L'ERP repart de zéro.", type: 'success' });
  },

  seedDemoData: async () => {
    const months = 6;
    const now = new Date();
    
    get().addHint({ title: "🌱 Seeding...", message: "Génération de 6 mois d'historique métier...", type: 'info' });

    // 1. Clients & Fournisseurs (Base)
    const clientNoms = ["Industries Ouest", "TechCorp Plus", "BTP Alpha", "Giga Mart", "Auto Pro"];
    const clients = clientNoms.map((nom, i) => ({ id: `CLI-00${i+1}`, nom, type: 'Client', email: `contact@${nom.toLowerCase().replace(' ', '')}.com`, categorie: 'B2B' }));
    clients.forEach(c => get().addRecord('base', 'contacts', c));

    // 2. Factures & Ventes (Finance)
    for (let m = 0; m < months; m++) {
      const dateM = new Date(now.getFullYear(), now.getMonth() - m, 15);
      const isPast = m > 0;
      
      // 5-8 Factures par mois
      const count = 5 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i++) {
        const montant = 500000 + Math.floor(Math.random() * 2500000);
        get().addRecord('finance', 'invoices', {
          client: clientNoms[i % 5],
          montant,
          statut: isPast ? 'Payé' : 'Envoyé',
          createdAt: dateM.toISOString(),
          type: 'vente'
        });

        // Achats correspondants (40% du CA)
        get().addRecord('finance', 'vendor_bills', {
          fournisseur: "Grossiste Global",
          montant: montant * 0.4,
          statut: 'Payé',
          createdAt: dateM.toISOString()
        });
      }
    }

    // 3. RH & Talent
    const hrData = [
      { id: 'T-001', nom: 'Alice Martin', poste: 'Dev React', source: 'LinkedIn', statut: 'Embauché', score: 85 },
      { id: 'T-002', nom: 'Bob Dupont', poste: 'Sales Manager', source: 'Indeed', statut: 'Offre', score: 92 },
      { id: 'T-003', nom: 'Claire Lefebvre', poste: 'UX Designer', source: 'Portfolio', statut: 'Test Technique', score: 78 }
    ];
    hrData.forEach(t => get().addRecord('talent', 'candidates', t));

    // Évaluations 360
    const skills = [
       { name: 'Technique', alice: 9, bob: 4, claire: 6 },
       { name: 'Com', alice: 7, bob: 10, claire: 9 },
       { name: 'Leadership', alice: 6, bob: 9, claire: 5 }
    ];
    get().addRecord('talent', 'appraisals', { empId: 'E001', nom: 'Jean Kouassi', period: 'Q1 2026', scores: skills.map(s => ({ key: s.name, val: s.alice })) });

    get().addHint({ title: "✅ Seeding Terminé", message: "Les données analytiques sont prêtes.", type: 'success' });
  },

  navigateTo: (appId) => get().setActiveApp(appId),

  // 10. Memoized Context Value to avoid redundant re-renders
  
});
