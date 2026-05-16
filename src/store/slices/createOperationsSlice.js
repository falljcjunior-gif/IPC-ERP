import { FirestoreService, StorageService } from '../../services/firestore.service';
import { AuthService } from '../../services/auth.service';
import { auth } from '../../firebase/config';
import {
  cascadeDevisToSaleOrder,
  cascadeBCToDelivery,
  runThreeWayMatch,
  applyThreeWayMatchResult,
  checkDocumentLock,
  imputerCoutAnalytique,
} from '../../services/IpcEngine';

export const createOperationsSlice = (set, get) => ({
  addHint: (hint) => {
    setTimeout(() => {
      const id = Date.now().toString();
      const currentSetHints = get().setHints;
      if (currentSetHints) {
        currentSetHints(prev => [{ ...hint, id }, ...prev]);
      }
    }, 0);
  },

  dismissHint: (id) => {
    const currentSetHints = get().setHints;
    if (currentSetHints) {
      currentSetHints(prev => prev.filter(h => h.id !== id));
    }
  },

  logAction: (action, detail, appId = 'system', targetId = null) => {
    const currentUser = get().user || {};
    const activity = {
      id: Math.random().toString(36).substr(2, 9),
      action,
      detail,
      appId,
      targetId,
      user: currentUser.nom || 'Système',
      timestamp: new Date().toISOString(),
      type: 'log',
      brandId: get().globalSettings?.brand !== 'ALL' ? (get().globalSettings?.brand || 'IPC_CORE') : 'IPC_CORE'
    };
    
    setTimeout(() => {
      set(prev => ({
        ...prev,
        data: {
          ...prev.data,
          activities: [activity, ...(prev.data?.activities || [])]
        }
      }));

      if (get().user) {
        FirestoreService.setDocument('activities', activity.id, {
          ...activity,
          _createdAt: FirestoreService.serverTimestamp(),
          _deletedAt: null
        });
      }
    }, 0);
  },

  addNote: (targetId, appId, text) => {
    const currentUser = get().user || {};
    const note = {
      id: Math.random().toString(36).substr(2, 9),
      action: 'Note',
      detail: text,
      appId,
      targetId,
      user: currentUser.nom || 'Système',
      timestamp: new Date().toISOString(),
      type: 'note',
      brandId: get().globalSettings?.brand !== 'ALL' ? (get().globalSettings?.brand || 'IPC_CORE') : 'IPC_CORE'
    };

    setTimeout(() => {
      set(prev => ({
        ...prev,
        data: {
          ...prev.data,
          activities: [note, ...(prev.data?.activities || [])]
        }
      }));

      if (get().user) {
        FirestoreService.setDocument('activities', note.id, {
          ...note,
          _createdAt: FirestoreService.serverTimestamp(),
          _deletedAt: null
        });
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
    };
    try {
      if (get().user) {
        await FirestoreService.setDocument('notifications', notifyDoc.id, {
          ...notifyDoc,
          _createdAt: FirestoreService.serverTimestamp(),
          _deletedAt: null
        });
      }
    } catch (e) {
      console.error("sendNotification Error:", e);
    }
  },

  /* ══════════════════════════════════════════════════════════════════════════
     5. DATA MUTATION LOGIC (Topological Order)
     ══════════════════════════════════════════════════════════════════════════ */

  getNextSequence: (key) => {
    const currentData = get().data;
    const seq = currentData.base?.sequences?.[key];
    if (!seq) return "";
    const numStr = seq.next.toString().padStart(seq.padding, '0');
    const nextNum = `${seq.prefix}${new Date().getFullYear()}-${numStr}`;
    
    set(prev => {
      const data = prev.data || {};
      const s = data.base?.sequences?.[key];
      if (!s) return prev;
      return { 
        ...prev, 
        data: {
          ...data,
          base: { 
            ...data.base, 
            sequences: { 
              ...(data.base?.sequences || {}), 
              [key]: { ...s, next: s.next + 1 } 
            } 
          }
        } 
      };
    });
    
    // Persist sequence update to Firestore to prevent collisions
    if (get().user) {
      FirestoreService.setDocument('base', 'sequences', { [key]: { ...seq, next: seq.next + 1 } }, true);
    }
    
    return nextNum;
  },

  addAccountingEntry: async (entry, lines) => {
    const totalDebit = lines.reduce((s, l) => s + parseFloat(l.debit || 0), 0);
    const totalCredit = lines.reduce((s, l) => s + parseFloat(l.credit || 0), 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      get().addHint({ title: "Erreur d'équilibre", message: "Le total débit doit être égal au total crédit.", type: 'error' });
      return false;
    }

    const entryId = Date.now().toString();
    const newEntry = { ...entry, id: entryId, createdAt: new Date().toISOString(), total: totalDebit };
    const newLines = lines.map(l => ({ ...l, id: Math.random().toString(36).substr(2, 9), entryId, createdAt: new Date().toISOString() }));

    try {
      // 1. Update local state immediately (Optimistic UI)
      set(prev => {
        const data = prev.data || {};
        const finance = data.finance || { entries: [], lines: [] };
        return {
          ...prev,
          data: {
            ...data,
            finance: {
              ...finance,
              entries: [newEntry, ...(finance.entries || [])],
              lines: [...newLines, ...(finance.lines || [])]
            }
          }
        };
      });

      // 2. Persist to Firestore (Source of Truth)
      if (get().user) {
        await Promise.all([
          FirestoreService.setDocument('finance', entryId, { ...newEntry, subModule: 'entries' }),
          ...newLines.map(l => FirestoreService.setDocument('finance', l.id, { ...l, subModule: 'lines' }))
        ]);
      }

      get().logAction('Écriture Comptable', entry.libelle, 'finance');
      return true;
    } catch (error) {
      console.error('[OperationsSlice] addAccountingEntry Error:', error);
      get().addHint({ title: "Échec de sauvegarde", message: "Impossible d'enregistrer l'écriture en base.", type: 'error' });
      return false;
    }
  },

  generateInvoiceEntry: (invoice) => {
    const entry = {
      libelle: `Facture Client ${invoice.num}`,
      date: invoice.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
      journalCode: 'J-VT',
      piece: invoice.num
    };

    const lines = [
      { accountId: '411100', label: invoice.client, debit: invoice.montant, credit: 0 },
      { accountId: '701100', label: 'Vente de marchandises', debit: 0, credit: invoice.montant }
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
    };
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
    };
    const amount = litigation.risqueFinancier || 0;
    const lines = [
      { accountId: '686000', label: 'Dotations aux provisions', debit: isProvision ? amount : 0, credit: isProvision ? 0 : amount },
      { accountId: '151000', label: 'Provisions pour litiges', debit: isProvision ? 0 : amount, credit: isProvision ? amount : 0 }
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
    };
    const lines = [
      { accountId: '713100', label: 'Entrée Stock PF', debit: totalCost, credit: 0, profitCenter: 'Usine' },
      { accountId: '603100', label: 'Consommation Stock MP', debit: 0, credit: totalCost, profitCenter: 'Usine' }
    ];
    get().addAccountingEntry(entry, lines);
  },


  // C. Physical Moves
  applyStockMove: (movementData) => {
    const { productId, qte, type, ref, source, dest } = movementData;
    const qteNum = parseFloat(qte);
    set(prev => {
      const data = prev.data || {};
      const products = data.inventory?.products || [];
      const product = products.find(p => p.id === productId || p.code === productId || p.ref === productId);
      if (!product) {
        get().addHint({ title: "Produit non trouvé", message: `ID: ${productId}`, type: 'error' });
        return prev;
      }
      const isOut = ['Expédition', 'Consommation', 'Ajustement Sortie'].includes(type);
      const newStock = isOut ? (product.stock_reel || 0) - qteNum : (product.stock_reel || 0) + qteNum;
      const updatedProducts = products.map(p => (p.id === productId || p.code === productId) ? { ...p, stock_reel: newStock } : p);
      const seqKey = 'inventory_movements';
      const mvtNum = get().getNextSequence(seqKey);
      const newMove = { id: Date.now().toString(), num: mvtNum, date: new Date().toISOString(), produit: product.nom, produitId: product.id, type, qte: qteNum, ref: ref || 'Interne', source: source || 'Entrepôt Principal', dest: dest || 'Client/Transit', createdAt: new Date().toISOString() };
      
      // Auto-Replenishment Logic (SSOT)
      const pointDeCommande = parseFloat(product.alerte || product.seuilAlerte || 0);
      let newPoDraft = null;

      if (pointDeCommande > 0) {
         const pendingPurchases = (data.purchase?.orders || []).filter(o => (o.produitId === product.id || o.produitId === product.code) && o.statut !== 'Réceptionné' && o.statut !== 'Annulé').reduce((sum, o) => sum + parseFloat(o.qte || 0), 0);
         const pendingSales = (data.sales?.orders || []).filter(o => (o.produitId === product.id || o.produitId === product.code) && o.statut !== 'Livré' && o.statut !== 'Annulé' && o.statut !== 'Gagné').reduce((sum, o) => sum + parseFloat(o.qte || 0), 0);
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
            };
            get().addHint({ title: "Réassort Automatique", message: `Stock projeté critique (${stockProjete}). Brouillon d'achat ${poNum} généré pour ${qteACommander} unitées.`, type: 'warning', appId: 'purchase' });
         } else if (newStock <= pointDeCommande) {
            get().addHint({ title: "Alerte Stock Bas", message: `Stock critique (${newStock}) mais réassort déjà en cours (Projeté: ${stockProjete}).`, type: 'info', appId: 'inventory' });
         }
      } else if (newStock <= (product.alerte || 0)) {
         get().addHint({ title: "Alerte Stock Bas", message: `Le stock de "${product.nom}" est critique (${newStock} unités).`, type: 'warning', appId: 'inventory' });
      }

      get().logAction(`Mouvement Stock (${type})`, `${product.nom} : ${qteNum} u.`, 'inventory');
      
      const nextState = { 
        ...prev, 
        data: {
          ...data,
          inventory: { ...data.inventory, products: updatedProducts, movements: [newMove, ...(data.inventory?.movements || [])] }
        }
      };
      if (newPoDraft) {
         nextState.data.purchase = { ...data.purchase, orders: [newPoDraft, ...(data.purchase?.orders || [])] };
      }
      return nextState;
    });
  },

  applyMOTransformation: (moId) => {
    set(prev => {
      const data = prev.data || {};
      const mo = data.production?.workOrders?.find(o => o.id === moId);
      if (!mo) return prev;
      const bom = data.production?.boms?.find(b => b.produit === mo.produit || b.product === mo.produit || b.productId === mo.produitId);
      if (!bom) {
        get().addHint({ title: "BOM Manquante", message: `Aucune nomenclature trouvée pour ${mo.produit}`, type: 'warning' });
        return prev;
      }
      let componentsList = [];
      try { componentsList = typeof bom.components === 'string' ? JSON.parse(bom.components) : (bom.components || []); } catch (e) { componentsList = []; }
      
      // Appliquer la décrémentation des stocks des matières premières (MRP)
      componentsList.forEach(comp => get().applyStockMove({ productId: comp.productId, qte: comp.qte * (mo.qte || 0), type: 'Consommation', ref: `OF-${mo.num || mo.id}` }));
      
      // Appliquer l'incrémentation du nouveau produit fini
      const finalProductId = bom.productId || mo.produitId || data.inventory?.products?.find(p => p.nom === mo.produit)?.id;
      if (finalProductId) {
        get().applyStockMove({ productId: finalProductId, qte: mo.qte, type: 'Réception', ref: `OF-${mo.num || mo.id}` });
      }
      get().addHint({ title: "Production Terminée", message: `Transformation réussie : ${mo.qte} unités produites. Stocks mis à jour.`, type: 'success', appId: 'production' });
      return prev;
    });
  },

  // D. Higher-level Workflows
  processOrderValidation: (order) => {
    const invoiceNum = get().getNextSequence('finance_invoices');
    const newInvoice = { id: Date.now().toString(), num: invoiceNum, client: order.client, montant: order.montant, statut: 'À Payer', orderId: order.id, createdAt: new Date().toISOString() };
    set(prev => {
      const data = prev.data || {};
      return { 
        ...prev, 
        data: {
          ...data,
          finance: { ...data.finance, invoices: [newInvoice, ...(data.finance?.invoices || [])] }
        }
      };
    });
    get().addHint({ title: "Flux Cascade Activé", message: `Facture ${invoiceNum} générée + Expédition de stock initiée.`, type: 'info', appId: 'finance' });
    get().logAction('Validation Commande', `Généré Facture ${invoiceNum} & Livraison pour ${order.num}`, 'system');
  },

  convertOppToSalesOrder: (oppId) => {
    set(prev => {
      const data = prev.data || {};
      const opp = data.crm?.opportunities?.find(o => o.id === oppId);
      if (!opp) return prev;
      const orderNum = get().getNextSequence('sales_orders');
      const newOrder = { id: Date.now().toString(), num: orderNum, client: opp.client, clientContact: opp.nom || opp.titre, montant: opp.montant, statut: 'Brouillon', oppId: opp.id, createdAt: new Date().toISOString() };
      get().addHint({ title: "Commande Créée", message: `Le Bon de Commande ${orderNum} a été généré avec succès.`, type: 'success', appId: 'sales' });
      get().logAction('Conversion Opportunité', `Génération ${orderNum} depuis ${opp.id}`, 'sales');
      return { 
        ...prev, 
        data: {
          ...data,
          sales: { ...data.sales, orders: [newOrder, ...(data.sales?.orders || [])] }
        }
      };
    });
  },

  // E. Record Operations (Final Handlers)
  addRecord: (appId, subModule, inputData) => {
    let processedRecord = { ...inputData };
    if (!processedRecord.num || processedRecord.num === "") {
      const seqKey = `${appId}__${subModule}`;
 if (get().data.base?.sequences?.[seqKey]) processedRecord.num = get().getNextSequence(seqKey);
 }
 const { user } = get();
 // [SECURITY] Fallback to Firebase Auth UID if store user is guest/stale
 const currentUid = (user?.id && user.id !== 'guest') ? user.id : (AuthService.getCurrentUser()?.uid);
 
 const newRecord = { 
 ...processedRecord, 
 id: processedRecord.id || Date.now().toString() + Math.random().toString(36).substr(2, 5), 
 createdAt: processedRecord.createdAt || new Date().toISOString(),
 subModule,
 _subModule: subModule,
 ownerId: currentUid,
 userId: currentUid,
 brandId: get().globalSettings.brand !== 'ALL' ? get().globalSettings.brand : 'IPC_CORE'
 };
 set(prev => {
 const data = prev.data || {};
 const moduleData = data[appId] || {};
 const subModuleData = moduleData[subModule] || [];
 const nextState = { 
 ...prev, 
 data: {
 ...data,
 [appId]: { ...moduleData, [subModule]: [newRecord, ...subModuleData] }
 }
 };
 
 setTimeout(() => {
 get().logAction(`Création ${subModule}`, `${processedRecord.num || newRecord.id}`, appId);
         // SOURCE OF TRUTH: Firebase Auth, pas le store. Évite que `ownerId`soit
 // 'guest' (state initial) quand le profile Firestore n'est pas encore synchro.
 const fbUser = auth.currentUser;
 if (fbUser) {
 // [UNIFIED 2.0] HR Data Isolation
 // Redirection vers users/{uid}/hr_private pour les données RH
 let targetCollection = appId;
 if (appId === 'hr' && (subModule === 'leaves' || subModule === 'expenses' || subModule === 'private_data' || subModule === 'requests')) {
 const targetUid = newRecord.collaborateurId || newRecord.employeId || newRecord.uid || fbUser.uid;
 targetCollection =`users/${targetUid}/hr_private`;
           }

           FirestoreService.setDocument(targetCollection, newRecord.id, {
             ...newRecord,
             subModule,
             ownerId: fbUser.uid,
             userId: fbUser.uid,
             _deletedAt: null,
             _createdAt: FirestoreService.serverTimestamp()
           }, true)
             .catch(err => {
               // Avant: l'écriture échouait silencieusement (permission-denied).
               // L'enregistrement apparaissait localement puis disparaissait au refresh.
               console.error(`[addRecord] Firestore write failed for ${appId}/${newRecord.id}:`, err);
               // Rollback du state local pour éviter le ghost record
               try {
                 set(prev => {
                   const data = prev.data || {};
                   const moduleData = data[appId] || {};
                   const subModuleData = moduleData[subModule] || [];
                   return {
                     ...prev,
                     data: {
                       ...data,
                       [appId]: { ...moduleData, [subModule]: subModuleData.filter(r => r.id !== newRecord.id) }
                     }
                   };
                 });
               } catch (_) { /* noop */ }
               try {
                 const message = err?.code === 'permission-denied'
                   ? "Vos droits ne permettent pas cette action. Contactez un administrateur."
                   : (err?.message || "Échec de l'enregistrement Firestore.");
                 get().addHint({ title: "Création échouée", message, type: 'danger', appId });
               } catch (_) { /* noop */ }
             });
         }
      }, 0);

      return nextState;
    });

    // Workflow: Legal ↔ Finance (Provisions)
    if (appId === 'legal' && subModule === 'litigations' && processedRecord.risqueFinancier > 0) {
      get().generateLitigationEntry(newRecord, true);
    }

    if (appId === 'inventory' && subModule === 'movements') {
      const productId = processedRecord.produitId || processedRecord.produit;
      get().applyStockMove({ 
        productId, 
        qte: processedRecord.qte, 
        type: processedRecord.type, 
        ref: processedRecord.ref || processedRecord.reference, 
        source: processedRecord.source, 
        dest: processedRecord.dest 
      });
    }

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
           get().addHint({ title: "Règle Exécutée", message: `La règle "${wf.name}" a été déclenchée.`, type: 'info', appId });
       }
    });
  },


  updateRecord: (appId, subModule, id, newData) => {
    // ── [IPC GREEN BLOCK] Verrouillage de Document ──────────────────────────────
    // Un document verrouillé (_locked) ne peut pas être modifié directement.
    // Seul un Avenant peut porter les modifications — logique IPC Green Block pure.
    const stateSnapshot = get();
    const existingRecord = (stateSnapshot.data?.[appId]?.[subModule] || stateSnapshot[appId]?.[subModule] || []).find(i => i.id === id);
    if (existingRecord?._locked) {
      const lockCheck = checkDocumentLock(existingRecord, stateSnapshot.userRole);
      if (lockCheck.blocked) {
        stateSnapshot.addHint({
          title: 'Document Verrouillé',
          message: lockCheck.reason,
          type: 'error',
        });
        return; // Annule la modification
      }
    }

    set(prev => {
      const data = prev.data || {};
      if (!data[appId] || !data[appId][subModule]) return prev;
      const oldRecord = data[appId][subModule].find(i => i.id === id);
      if (!oldRecord) return prev;

      // [SÉCURITÉ] Garde-fou contre les boucles infinies de dominos
      const hasActualChanges = Object.keys(newData).some(key => newData[key] !== oldRecord[key]);
      if (!hasActualChanges) return prev;

      const changes = Object.keys(newData).filter(key => newData[key] !== oldRecord[key]).map(key => `${key}: ${oldRecord[key] || 'vide'} → ${newData[key]}`).join(', ');
      const updatedList = data[appId][subModule].map(item => item.id === id ? { ...item, ...newData } : item);
      let nextState = { 
        ...prev, 
        data: {
          ...data,
          [appId]: { ...data[appId], [subModule]: updatedList }
        }
      };
      const record = updatedList.find(o => o.id === id);
      setTimeout(async () => {
         get().logAction(`Modification ${subModule}`, changes ? `Changements sur ${record.num || id}: ${changes}` : `Mise à jour ${record.num || id}`, appId, id);
 
 // [SECURITY HARDENING] Role updates MUST go through Cloud Functions for Custom Claims
 if (appId === 'admin' && subModule === 'users' && newData.role && newData.role !== oldRecord.role) {
 try {
 const { httpsCallable } = await import('firebase/functions');
 const { functions } = await import('../../firebase/config');
 const setUserRoleFn = httpsCallable(functions, 'setUserRole');
 await setUserRoleFn({ uid: id, role: newData.role });
 get().addHint({ title: "Accréditation Mise à Jour", message:`Le rôle de ${record.nom} a été scellé par Custom Claims.`, type: 'success' });
 } catch (err) {
 console.error('[Admin] setUserRole Error:', err);
 get().addHint({ title: "Échec RBAC", message: "Impossible de mettre à jour les droits d'accès via Custom Claims.", type: 'error' });
 // On ne rollback pas le state local ici car Firestore sera mis à jour par la fonction si elle réussit,
 // mais ici elle a échoué. On laisse le state local en attendant la prochaine synchro.
 }
 } else if (get().user) {
 // [UNIFIED 2.0] HR Data Isolation
 let targetCollection = appId;
 if (appId === 'hr' && (subModule === 'leaves' || subModule === 'expenses' || subModule === 'private_data' || subModule === 'requests')) {
 const targetUid = record.collaborateurId || record.employeId || record.uid || get().user.id;
 targetCollection =`users/${targetUid}/hr_private`;
            }
            FirestoreService.setDocument(targetCollection, id, { ...record, subModule, updatedAt: new Date().toISOString() }, true);
         }
      }, 0);
      
      if (appId === 'production' && subModule === 'workOrders' && newData.statut === 'Terminé' && oldRecord.statut !== 'Terminé') {
        get().applyMOTransformation(id);
        get().generateProductionEntry(record);
      }
      if (appId === 'crm' && subModule === 'opportunities' && newData.etape === 'Gagné' && oldRecord.etape !== 'Gagné') {
        get().addHint({ title: "Affaire Gagnée !", message: `L'opportunité "${record.titre}" est gagnée. Prêt à lancer la vente ?`, type: 'success', appId: 'sales', actionLabel: "Générer Commande", onAction: () => get().convertOppToSalesOrder(id) });
      }

      // ── [IPC GREEN BLOCK] Cascade Devis → BC ──────────────────────────────────────
      // Quand un devis passe à "Accepté" ou "Signé" → engrenage complet
      if (appId === 'sales' && subModule === 'quotes' && ['Accepté', 'Signé'].includes(newData.statut) && !['Accepté', 'Signé'].includes(oldRecord.statut)) {
        setTimeout(() => cascadeDevisToSaleOrder(record, get, set), 0);
      }

      // ── [IPC GREEN BLOCK] Cascade BC → Livraison ──────────────────────────────────
      // Quand un BC passe à "Expédié" → BL + Facture finale + stock physique
      if (appId === 'sales' && subModule === 'orders' && newData.statut === 'Expédié' && oldRecord.statut !== 'Expédié') {
        setTimeout(() => cascadeBCToDelivery(record, get, set), 0);
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
           const revertedList = updatedList.map(item => item.id === id ? { ...item, statut: 'Attente Visa Juridique' } : item);
           nextState = { 
             ...prev, 
             data: {
               ...data,
               [appId]: { ...data[appId], [subModule]: revertedList }
             }
           };
           get().sendNotification('Juridique', 'Visa requis pour commande', 'Une commande modifiée hors template nécessite un visa juridique.', 'warning', 'legal');
        } else {
           get().processOrderValidation(record);
        }
      }

      // Workflow: Legal ↔ Finance (Closing litigation)
      if (appId === 'legal' && subModule === 'litigations' && (newData.statut === 'Gagné' || newData.statut === 'Clos') && oldRecord.statut === 'En cours') {
         get().generateLitigationEntry(record, false);
      }

      // Workflow: RH ↔ Juridique (Visa final)
      if (appId === 'hr' && subModule === 'employees' && newData.statut === 'Signé' && !record.visaJuridique) {
         get().addHint({ title: "Visa Juridique Requis", message: "Le contrat de travail nécessite le visa du pôle juridique avant signature finale.", type: 'warning', appId: 'legal' });
         const revertedList = updatedList.map(item => item.id === id ? { ...item, statut: 'Validation Juridique' } : item);
         nextState = { 
           ...prev, 
           data: {
             ...data,
             [appId]: { ...data[appId], [subModule]: revertedList }
           }
         };
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
         };
         nextState = { 
           ...nextState, 
           data: {
             ...nextState.data,
             legal: { ...nextState.data.legal, contracts: [legalContract, ...(nextState.data.legal?.contracts || [])] }
           }
         };
         get().addHint({ title: "Archivage Souverain", message: "Le document scellé a été archivé en sécurité dans le module juridique.", type: 'success', appId: 'legal' });
         
         // Domino 2: Validation du Devis (Sales)
         if (record.sourceId) {
             const salesList = nextState.data.sales?.orders || [];
             const saleIndex = salesList.findIndex(o => o.id === record.sourceId);
             if (saleIndex !== -1) {
                 const saleOld = salesList[saleIndex];
                 const updatedSalesList = [...salesList];
                 updatedSalesList[saleIndex] = { ...saleOld, statut: 'Confirmé' };
                  nextState = { 
                    ...nextState, 
                    data: {
                      ...nextState.data,
                      sales: { ...nextState.data.sales, orders: updatedSalesList }
                    }
                  };
                 get().addHint({ title: "Contrat Confirmé", message: `Le devis ${saleOld.num} a été automatiquement confirmé suite à la signature P.K.I.`, type: 'success', appId: 'sales' });
                 get().logAction('Effet Domino', `Devis ${saleOld.num} validé par signature P.K.I.`, 'sales', saleOld.id);
                 get().processOrderValidation(saleOld);
             }
         }
      }

      if (appId === 'finance' && subModule === 'invoices' && newData.statut === 'Payé' && oldRecord.statut !== 'Payé') {
        get().generateInvoiceEntry(record);
      }
      if (appId === 'hr' && subModule === 'expenses' && newData.statut === 'Payé' && oldRecord.statut !== 'Payé') {
        get().generateExpenseEntry(record);
      }
      if (appId === 'hr' && subModule === 'timesheets' && newData.statut === 'Validé' && oldRecord.statut !== 'Validé') {
         // ── [IPC GREEN BLOCK] Comptabilité Analytique — Imputation par Centre de Coût
         imputerCoutAnalytique(record, get);
      }
      if (appId === 'purchase' && subModule === 'orders') {
        if (newData.statut === 'Réceptionné' && oldRecord.statut !== 'Réceptionné') {
          // Moteur SSOT: On incremente avec la qteRecue physiquement, pas celle de la commande théorique.
          const actualQte = parseFloat(record.qteRecue || record.qte || 0);
          get().applyStockMove({ 
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
           
           // ── [IPC GREEN BLOCK] Three-Way Match Engine (Anti-Fraude) ─────────────
           const receptionData = { qteRecue: record.qteRecue || record.qte };
           const invoiceData  = { qteFacturee: record.qteFacturee || record.qte, prixUnitaire: record.prixUnitaire };
           const matchResult  = runThreeWayMatch(record, receptionData, invoiceData);

           const newBill = {
             id: Date.now().toString(),
             num: billNum,
             fournisseur: record.fournisseur,
             date: new Date().toISOString().split('T')[0],
             montant: matchResult.montantPayable || record.total,
             statut: matchResult.statut,
             orderId: record.id,
             qteCommandee: parseFloat(record.qte || 0),
             qteRecue: parseFloat(record.qteRecue || record.qte || 0),
             qteFacturee: parseFloat(record.qteFacturee || record.qte || 0),
             anomalies: matchResult.anomalies,
             createdAt: new Date().toISOString(),
           };
           nextState = { 
             ...nextState, 
             data: {
               ...nextState.data,
               finance: { ...nextState.data.finance, vendor_bills: [newBill, ...(nextState.data.finance?.vendor_bills || [])] }
             }
           };

           // Notifier le résultat du match (via GreenBlockEngine)
           setTimeout(() => applyThreeWayMatchResult(record.id, matchResult, get, set), 0);
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
                 // [AUDIT] Sécurité: Empêcher les boucles infinies si le statut est déjà identique
                 const currentStatus = nextState.data[appId][subModule].find(item => item.id === id)?.statut;
                  if (currentStatus !== wf.actionPayload) {
                     const finalUpdatedList = nextState.data[appId][subModule].map(item => item.id === id ? { ...item, statut: wf.actionPayload } : item);
                     nextState = { 
                       ...nextState, 
                       data: {
                         ...nextState.data,
                         [appId]: { ...nextState.data[appId], [subModule]: finalUpdatedList }
                       }
                     };
                  }
             } else if (wf.actionType === 'LOG_ACTION') {
                 get().logAction('I.P.C. Automator', wf.actionPayload, appId, id);
             }
             get().addHint({ title: "Règle Exécutée", message: `La règle "${wf.name}" a été déclenchée avec succès.`, type: 'info', appId });
         }
      });
    return nextState;
    });
  },

  deleteRecord: (appId, subModule, id) => {
    // Special handling for user deletion to ensure Auth is also cleaned up
    if ((appId === 'admin' && subModule === 'users') || (appId === 'hr' && subModule === 'employees')) {
      get().permanentlyDeleteUserRecord(id);
      return;
    }

    set(prev => {
      const data = prev.data || {};
      const moduleData = data[appId] || {};
      const subModuleData = moduleData[subModule] || [];
      const updatedList = subModuleData.filter(item => item.id !== id);
      const nextState = { 
        ...prev, 
        data: {
          ...data,
          [appId]: { ...moduleData, [subModule]: updatedList }
        }
      };
      setTimeout(() => {
         get().logAction(`Suppression ${subModule}`, `ID: ${id}`, appId);
         if (get().user) FirestoreService.deleteDocument(appId, id);
      }, 0);
      return nextState;
    });
  },

  processPOSOrder: (order) => {
    const newId = `POS-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
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
      const data = prev.data || {};
      const invProducts = data.inventory?.products || [];
      const updatedProducts = invProducts.map(p => {
         const cartItem = order.cart.find(c => c.id === p.id);
         if (cartItem) {
            return { ...p, qte: Math.max(0, (p.qte || 0) - cartItem.qty) };
         }
         return p;
      });
      return { 
        ...prev, 
        data: {
          ...data,
          inventory: { ...(data.inventory || {}), products: updatedProducts }
        }
      };
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
         (l.du || l.date_debut) && (l.du || l.date_debut).startsWith(currentMonthPrefix)
      );
      
      let deductionSansSolde = 0;
      if (unpaidLeaves.length > 0) {
        // Simple calculation: each day is roughly salaire / 30
        const dailyRate = emp.salaire / 30;
        let unpaidDays = 0;
        unpaidLeaves.forEach(lv => {
           let d1 = new Date(lv.du || lv.date_debut);
           let d2 = new Date(lv.au || lv.date_fin);
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
      };
    });

    const mois = new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
    
    const entry = {
      id: Date.now().toString(),
      libelle: `Masse Salariale - ${mois}`,
      date: new Date().toISOString().split('T')[0],
      journalCode: 'J-OD',
      piece: `PAIE-${mois.replace(' ', '-').toUpperCase()}`
    };
    
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
    };

    get().addRecord('hr', 'expenses', payrollExpense);

    processedEmployees.forEach(emp => {
      const payslipRecord = {
        ...emp,
        salariesMois: mois,
        totalBrut: emp.salaireAjuste,
        absencesDeduites: emp.deductionSansSolde,
        netAPayer: emp.salaireAjuste * 0.78, // Simplified deduction roughly 22% social charges
        datePaiement: new Date().toISOString().split('T')[0]
      };

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
      };
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
      const data = prev.data || {};
      const nextProducts = (data.inventory?.products || []).map(p => {
        const comp = composants.find(c => c.articleId === p.id);
        if (!comp) return p;
        const consumed = comp.qte * order.qte;
        const newQty = (p.qteStock || 0) - consumed;
        if (newQty < (p.seuilAlerte || 0)) {
          shortages.push({ article: p.designation, articleId: p.id, remaining: newQty, seuil: p.seuilAlerte });
        }
        return { ...p, qteStock: Math.max(0, newQty) };
      });
      return { 
        ...prev, 
        data: {
          ...data,
          inventory: { ...data.inventory, products: nextProducts }
        }
      };
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
      };
      get().addRecord('purchase', 'orders', po);
    });

    if (shortages.length > 0) {
      get().addHint({ title: "Rupture détectée", message: `${shortages.length} article(s) en dessous du seuil. Commandes brouillon créées dans les Achats.`, type: 'warning', appId: 'production' });
    } else {
      get().addHint({ title: "OF Lancé", message: `L'Ordre de Fabrication ${order.num} a été lancé. Stock mis à jour.`, type: 'success', appId: 'production' });
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
    if (get().user) FirestoreService.setDocument('settings', 'global', { ...newGlobal }, true);
  },

  togglePinnedModule: (moduleId) => {
    if ((get().currentUser?.role) !== 'SUPER_ADMIN') return;
    let nextPinned;
    get().setGlobalSettings(prev => {
      const currentPinned = prev.pinnedModules || [];
      nextPinned = currentPinned.includes(moduleId)
        ? currentPinned.filter(m => m !== moduleId)
        : [...currentPinned, moduleId];
      return { ...prev, pinnedModules: nextPinned };
    });
    // Persist to Firestore so the change survives a page refresh.
    if (get().user) {
      FirestoreService.setDocument('settings', 'global', { pinnedModules: nextPinned }, true)
        .catch(err => console.error('[togglePinnedModule] persist failed', err));
    }
  },

  uploadLogo: async (file) => {
    if ((get().currentUser?.role) !== 'SUPER_ADMIN') throw new Error("Accès refusé");
    try {
      const path = `brand/logos/master_logo_${Date.now()}`;
      const url = await StorageService.uploadFile(file, path);
      await get().updateGlobalSettings({ logoUrl: url });
      return url;
    } catch (error) {
      console.error("Erreur lors de l'upload du logo:", error);
      throw error;
    }
  },






  approveRequest: async (appId, subModule, id) => {
    const role = get().userRole;
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN' && role !== 'FINANCE') {
      get().addHint({ title: "Accès Refusé", message: "Permissions insuffisantes pour valider.", type: 'danger' });
      return;
    }
    
    const userName = get().user?.nom || 'Admin';
    await get().updateRecord(appId, subModule, id, { 
      statut: 'Validé', 
      validatedBy: userName, 
      validatedAt: new Date().toISOString() 
    });
    get().addHint({ title: "Demande Approuvée", type: 'success', appId });
  },

  rejectRequest: async (appId, subModule, id) => {
    const role = get().userRole;
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN' && role !== 'FINANCE') return;

    const userName = get().user?.nom || 'Admin';
    await get().updateRecord(appId, subModule, id, { 
      statut: 'Refusé', 
      validatedBy: userName, 
      validatedAt: new Date().toISOString() 
    });
  },


  // --- IPC CONNECT SOCIAL HELPERS ---
  // Tous les helpers Connect délèguent à addRecord/updateRecord pour garantir
  // que les posts/likes/commentaires/participations soient écrits dans Firestore
  // et survivent au refresh.
  addConnectPost: (post) => {
    get().addRecord('connect', 'posts', {
      ...post,
      reactions: 0,
      liked: false,
      comments: [],
      date: 'À l\'instant'
    });
    get().logAction('Publication Sociale', post.title, 'connect');
  },

  likeConnectPost: (postId) => {
    const post = (get().data?.connect?.posts || []).find(p => p.id === postId);
    if (!post) return;
    const liked = !post.liked;
    const reactions = (post.reactions || 0) + (liked ? 1 : -1);
    get().updateRecord('connect', 'posts', postId, { liked, reactions });
  },

  addConnectComment: (postId, comment) => {
    const post = (get().data?.connect?.posts || []).find(p => p.id === postId);
    if (!post) return;
    const newComments = [...(post.comments || []), { ...comment, id: Date.now() }];
    get().updateRecord('connect', 'posts', postId, { comments: newComments });
  },

  participateInEvent: (eventId) => {
    const event = (get().data?.connect?.events || []).find(e => e.id === eventId);
    if (!event) {
      get().addHint({ title: "Événement introuvable", type: 'danger' });
      return;
    }
    const attendees = (event.attendees || 0) + 1;
    get().updateRecord('connect', 'events', eventId, { attendees, participated: true });
    get().addHint({ title: "Participation confirmée", message: "Vous êtes inscrit à cet événement !", type: 'success' });
  },


  resetAllData: async () => {
    get().addHint({ title: "Purge en cours", message: "Nettoyage complet du système...", type: "warning" });
    try {
      const business_collections = [
        "crm", "finance", "inventory", "sales", "purchase", "production", 
        "legal", "signature", "activities", "notifications", "connect", "website", 
        "shipping", "commerce", "dms", "helpdesk", "marketing", "messages", "workflows"
      ];
      
      for (const col of business_collections) {
        const docs = await FirestoreService.listDocuments(col);
        if (docs.length === 0) continue;
        const chunks = [];
        for (let i = 0; i < docs.length; i += 400) chunks.push(docs.slice(i, i + 400));
        for (const chunk of chunks) {
          const ops = chunk.map(d => ({ op: 'delete', collection: col, id: d.id }));
          await FirestoreService.batchWrite(ops);
        }
      }

      // --- SPECIAL HR PURGE (SKIP OWNER) ---
      const hrDocs = await FirestoreService.listDocuments('hr');
      const hrToDelete = hrDocs.filter(d => {
        const email = (d.email || d.profile?.email || "").toLowerCase();
        return !['ra.yoman@ipcgreenblocks.com', 'yomanraphael26@gmail.com'].includes(email);
      });
      if (hrToDelete.length > 0) {
        const hrChunks = [];
        for (let i = 0; i < hrToDelete.length; i += 400) hrChunks.push(hrToDelete.slice(i, i + 400));
        for (const chunk of hrChunks) {
          const ops = chunk.map(d => ({ op: 'delete', collection: 'hr', id: d.id }));
          await FirestoreService.batchWrite(ops);
        }
      }

      // --- SPECIAL USER PURGE (SKIP OWNER) ---
      const allUsers = await FirestoreService.listDocuments('users');
      const usersToDelete = allUsers.filter(u => {
        const email = (u.email || u.profile?.email || "").toLowerCase();
        return !['ra.yoman@ipcgreenblocks.com', 'yomanraphael26@gmail.com'].includes(email);
      });

      if (usersToDelete.length > 0) {
        const userChunks = [];
        for (let i = 0; i < usersToDelete.length; i += 400) userChunks.push(usersToDelete.slice(i, i + 400));
        for (const chunk of userChunks) {
          const ops = chunk.map(u => ({ op: 'delete', collection: 'users', id: u.id }));
          await FirestoreService.batchWrite(ops);
        }
      }

      set({
        data: {
          base: { sequences: get().data?.base?.sequences || {} },
          hr: { employees: [], payroll: [] },
          crm: { leads: [], customers: [] },
          sales: { orders: [], invoices: [] },
          inventory: { products: [], movements: [] },
          production: { orders: [], boms: [], machines: [], workOrders: [] },
          finance: { entries: [], lines: [], invoices: [], vendor_bills: [] },
          purchase: { orders: [] },
          logistics: { shipments: [] },
          legal: { contracts: [], litigations: [] },
          website: { config: {}, chats: [] },
          signature: { requests: [] },
          activities: [],
          marketing: { campaigns: [] }
        },
        activities: [],
        notifications: [],
        hints: []
      });
      get().addHint({ title: "Wipe Terminé", message: "Le système est maintenant propre.", type: "success" });
    } catch (e) {
      console.error("Erreur Nuclear Wipe:", e);
      get().addHint({ title: "Échec du Wipe", message: e.message, type: "danger" });
    }
  },

  // [GO-LIVE] seedDemoData() supprimé — l'ERP démarre vide.
  // Les données réelles arrivent par les modules Onboarding (RH, CRM, Finance).
  seedDemoData: async () => {
    get().addHint({
      title: "Démarrage à zéro",
      message: "Les données de démonstration ont été désactivées. Créez vos premières fiches via les modules.",
      type: "info",
    });
  },

  _logout: async () => {
    try {
      await AuthService.logout();
      set({ user: null, userRole: "GUEST", isAuthenticated: false });
      localStorage.clear();
      window.location.reload();
    } catch (err) {
      console.error("Logout error:", err);
    }
  }
});
