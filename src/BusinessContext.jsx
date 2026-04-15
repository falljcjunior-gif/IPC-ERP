import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { mockData } from './utils/data-factory';
import { auth, db, firebaseConfig } from './firebase/config';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, orderBy, limit, deleteDoc, where } from 'firebase/firestore';
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
        if (!merged.inventory.products || merged.inventory.products.length === 0) {
          merged.inventory.products = merged.base.catalog.map(p => ({
            ...p,
            id: p.id || p.code,
            code: p.code || p.sku,
            stock: p.stock || 0,
            alerte: p.alerte || 5,
            coutUnit: p.prixAch || p.prix || 0
          }));
        }
        if (merged.inventory.moves && (!merged.inventory.movements || merged.inventory.movements.length === 0)) {
          merged.inventory.movements = merged.inventory.moves;
        }
        if (!merged.inventory.movements) merged.inventory.movements = [];
      }

      if (merged.production) {
        if (!merged.production.boms || merged.production.boms.length === 0) {
          merged.production.boms = [
            { id: 'BOM-BRICK-01', product: 'Bloc Béton 15x20x40', productId: 'PRD-001', components: JSON.stringify([
              { productId: 'MAT-CIMENT', qte: 0.5 },
              { productId: 'MAT-SABLE', qte: 1.2 },
              { productId: 'MAT-GRAVIER', qte: 2.0 }
            ]), coutEstime: 450 }
          ];
        }
        if (!merged.production.workOrders) merged.production.workOrders = [];
      }

      if (!merged.dms) merged.dms = { files: [], categories: ['Finances', 'RH', 'Technique', 'Légal'] };
      if (!merged.planning) merged.planning = { events: [] };
      const ohadaAccounts = [
        { code: '411100', label: 'Clients Locaux', type: 'Actif', nature: 'Bilan' },
        { code: '401100', label: 'Fournisseurs', type: 'Passif', nature: 'Bilan' },
        { code: '701100', label: 'Vente de Produits Finis', type: 'Produit', nature: 'Gestion' },
        { code: '601100', label: 'Achat de Matières Premières', type: 'Charge', nature: 'Gestion' },
        { code: '603100', label: 'Variations des stocks de MP', type: 'Charge', nature: 'Gestion' },
        { code: '713100', label: 'Variations des stocks de PF', type: 'Produit', nature: 'Gestion' },
        { code: '521100', label: 'Banques', type: 'Actif', nature: 'Bilan' },
        { code: '571100', label: 'Caisse', type: 'Actif', nature: 'Bilan' }
      ];

      if (!merged.finance.accounts || merged.finance.accounts.length === 0) merged.finance.accounts = ohadaAccounts;
      if (!merged.finance.journals) merged.finance.journals = mockData.finance.journals;
      if (!merged.finance.entries) merged.finance.entries = [];
      if (!merged.finance.lines) merged.finance.lines = [];
      if (!merged.activities) merged.activities = [];

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
      logoUrl: '/logo.png', logoWidth: 40, logoHeight: 40, companyName: 'IPC ERP', website: 'https://ipc-erp.web.app', currency: 'FCFA',
      pinnedModules: ['home', 'crm', 'hr', 'dms'] // Default pinned modules
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
  const [activeCall, setActiveCall] = useState(null); 
  const [notifications, setNotifications] = useState([]);
  
  // Platform Schema Overrides (for Studio)
  const [navigationIntent, setNavigationIntent] = useState(null);
  const [schemaOverrides, setSchemaOverrides] = useState(() => safeParse('ipc_erp_schemas', {}));

  
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
  useEffect(() => { localStorage.setItem('ipc_erp_schemas', JSON.stringify(schemaOverrides)); }, [schemaOverrides]);
  useEffect(() => { localStorage.setItem('daxcelor_data', JSON.stringify(data)); }, [data]);

  useEffect(() => {
    localStorage.setItem('ipc_erp_current_user', JSON.stringify(currentUser));
    localStorage.setItem('daxcelor_user_role', currentUser.role);
    
    // Cloud Sync for User settings
    if (auth.currentUser) {
      const userDoc = doc(db, 'users', auth.currentUser.uid);
      setDoc(userDoc, { config, permissions }, { merge: true }).catch(e => console.warn("Cloud Sync Error:", e.message));
    }
  }, [currentUser, config, permissions]);

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

  const logAction = useCallback((action, detail, appId = 'system', targetId = null) => {
    const activity = {
      id: Math.random().toString(36).substr(2, 9),
      action,
      detail,
      appId,
      targetId,
      user: currentUser.nom,
      timestamp: new Date().toISOString(),
      type: 'log'
    };
    
    setData(prev => ({
      ...prev,
      activities: [activity, ...(prev.activities || [])]
    }));

    if (auth.currentUser) {
      setDoc(doc(db, 'activities', activity.id), activity);
    }
  }, [currentUser.nom]);

  /* ══════════════════════════════════════════════════════════════════════════
     5. DATA MUTATION LOGIC (Topological Order)
     ══════════════════════════════════════════════════════════════════════════ */

  // A. Accounting Basics
  const addAccountingEntry = useCallback((entry, lines) => {
    const totalDebit = lines.reduce((s, l) => s + parseFloat(l.debit || 0), 0);
    const totalCredit = lines.reduce((s, l) => s + parseFloat(l.credit || 0), 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      addHint({ title: "Erreur d'équilibre", message: "Le total débit doit être égal au total crédit.", type: 'error' });
      return false;
    }

    const entryId = Date.now().toString();
    const newEntry = { ...entry, id: entryId, createdAt: new Date().toISOString(), total: totalDebit };
    const newLines = lines.map(l => ({ ...l, id: Math.random().toString(36).substr(2, 9), entryId, createdAt: new Date().toISOString() }));

    setData(prev => ({
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

    logAction('Écriture Comptable', entry.libelle, 'finance');
    return true;
  }, [logAction, addHint]);

  // B. Specialized Generators
  const generateInvoiceEntry = useCallback((invoice) => {
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

    addAccountingEntry(entry, lines);
  }, [addAccountingEntry]);

  const generateProductionEntry = useCallback((mo) => {
    const bom = data.production?.boms?.find(b => b.product === mo.produit || b.productId === mo.produitId);
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
    addAccountingEntry(entry, lines);
  }, [data.production?.boms, addAccountingEntry]);

  const generateExpenseEntry = useCallback((expense) => {
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
    addAccountingEntry(entry, lines);
  }, [addAccountingEntry]);


  // C. Physical Moves
  const applyStockMove = useCallback((movementData) => {
    const { productId, qte, type, ref, source, dest } = movementData;
    const qteNum = parseFloat(qte);
    setData(prev => {
      const products = prev.inventory?.products || [];
      const product = products.find(p => p.id === productId || p.code === productId);
      if (!product) {
        addHint({ title: "Produit non trouvé", message: `ID: ${productId}`, type: 'error' });
        return prev;
      }
      const isOut = ['Expédition', 'Consommation', 'Ajustement Sortie'].includes(type);
      const newStock = isOut ? (product.stock || 0) - qteNum : (product.stock || 0) + qteNum;
      const updatedProducts = products.map(p => (p.id === productId || p.code === productId) ? { ...p, stock: newStock } : p);
      const seqKey = 'inventory_movements';
      const mvtNum = getNextSequence(seqKey);
      const newMove = { id: Date.now().toString(), num: mvtNum, date: new Date().toISOString(), produit: product.nom, produitId: product.id, type, qte: qteNum, ref: ref || 'Interne', source: source || 'Entrepôt Principal', dest: dest || 'Client/Transit', createdAt: new Date().toISOString() };
      if (newStock <= (product.alerte || 0)) addHint({ title: "Alerte Stock Bas", message: `Le stock de "${product.nom}" est critique (${newStock} unités).`, type: 'warning', appId: 'inventory' });
      logAction(`Mouvement Stock (${type})`, `${product.nom} : ${qteNum} u.`, 'inventory');
      return { ...prev, inventory: { ...prev.inventory, products: updatedProducts, movements: [newMove, ...(prev.inventory?.movements || [])] } };
    });
  }, [getNextSequence, addHint, logAction]);

  const applyMOTransformation = useCallback((moId) => {
    setData(prev => {
      const mo = prev.production?.workOrders?.find(o => o.id === moId);
      if (!mo) return prev;
      const bom = prev.production?.boms?.find(b => b.product === mo.produit || b.productId === mo.produitId);
      if (!bom) {
        addHint({ title: "BOM Manquante", message: `Aucune nomenclature trouvée pour ${mo.produit}`, type: 'warning' });
        return prev;
      }
      let componentsList = [];
      try { componentsList = typeof bom.components === 'string' ? JSON.parse(bom.components) : (bom.components || []); } catch (e) { componentsList = []; }
      componentsList.forEach(comp => applyStockMove({ productId: comp.productId, qte: comp.qte * (mo.qte || 0), type: 'Consommation', ref: `OF-${mo.num || mo.id}` }));
      applyStockMove({ productId: bom.productId || mo.produitId, qte: mo.qte, type: 'Réception', ref: `OF-${mo.num || mo.id}` });
      addHint({ title: "Production Terminée", message: `Transformation réussie : ${mo.qte} unités produites. Stocks mis à jour.`, type: 'success', appId: 'production' });
      return prev;
    });
  }, [addHint, applyStockMove]);

  // D. Higher-level Workflows
  const processOrderValidation = useCallback((order) => {
    const invoiceNum = getNextSequence('finance_invoices');
    const newInvoice = { id: Date.now().toString(), num: invoiceNum, client: order.client, montant: order.montant, statut: 'À Payer', orderId: order.id, createdAt: new Date().toISOString() };
    setData(prev => ({ ...prev, finance: { ...prev.finance, invoices: [newInvoice, ...(prev.finance?.invoices || [])] } }));
    addHint({ title: "Flux Cascade Activé", message: `Facture ${invoiceNum} générée + Expédition de stock initiée.`, type: 'info', appId: 'finance' });
    logAction('Validation Commande', `Généré Facture ${invoiceNum} & Livraison pour ${order.num}`, 'system');
  }, [getNextSequence, addHint, logAction]);

  const convertOppToSalesOrder = useCallback((oppId) => {
    setData(prev => {
      const opp = prev.crm?.opportunities?.find(o => o.id === oppId);
      if (!opp) return prev;
      const orderNum = getNextSequence('sales_orders');
      const newOrder = { id: Date.now().toString(), num: orderNum, client: opp.client, clientContact: opp.nom || opp.titre, montant: opp.montant, statut: 'Brouillon', oppId: opp.id, createdAt: new Date().toISOString() };
      addHint({ title: "Commande Créée", message: `Le Bon de Commande ${orderNum} a été généré avec succès.`, type: 'success', appId: 'sales' });
      logAction('Conversion Opportunité', `Génération ${orderNum} depuis ${opp.id}`, 'sales');
      return { ...prev, sales: { ...prev.sales, orders: [newOrder, ...(prev.sales?.orders || [])] } };
    });
  }, [getNextSequence, addHint, logAction]);

  // E. Record Operations (Final Handlers)
  const addRecord = useCallback((appId, subModule, inputData) => {
    let processedRecord = { ...inputData };
    if (!processedRecord.num || processedRecord.num === "") {
      const seqKey = `${appId}__${subModule}`;
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
    if (appId === 'inventory' && subModule === 'movements') applyStockMove({ productId: processedRecord.produitId || processedRecord.produit, qte: processedRecord.qte, type: processedRecord.type, ref: processedRecord.ref, source: processedRecord.source, dest: processedRecord.dest });
  }, [data.base?.sequences, getNextSequence, applyStockMove, logAction]);

  const updateRecord = useCallback((appId, subModule, id, newData) => {
    setData(prev => {
      if (!prev[appId] || !prev[appId][subModule]) return prev;
      const oldRecord = prev[appId][subModule].find(i => i.id === id);
      if (!oldRecord) return prev;
      const changes = Object.keys(newData).filter(key => newData[key] !== oldRecord[key]).map(key => `${key}: ${oldRecord[key] || 'vide'} → ${newData[key]}`).join(', ');
      const updatedList = prev[appId][subModule].map(item => item.id === id ? { ...item, ...newData } : item);
      let nextState = { ...prev, [appId]: { ...prev[appId], [subModule]: updatedList } };
      const record = updatedList.find(o => o.id === id);
      logAction(`Modification ${subModule}`, changes ? `Changements sur ${record.num || id}: ${changes}` : `Mise à jour ${record.num || id}`, appId, id);
      if (auth.currentUser) setDoc(doc(db, appId, id), { ...record, subModule, updatedAt: new Date().toISOString() }, { merge: true });
      
      if (appId === 'production' && subModule === 'workOrders' && newData.statut === 'Terminé' && oldRecord.statut !== 'Terminé') {
        applyMOTransformation(id);
        generateProductionEntry(record);
      }
      if (appId === 'crm' && subModule === 'opportunities' && newData.etape === 'Gagné' && oldRecord.etape !== 'Gagné') {
        addHint({ title: "Affaire Gagnée !", message: `L'opportunité "${record.titre}" est gagnée. Prêt à lancer la vente ?`, type: 'success', appId: 'sales', actionLabel: "Générer Commande", onAction: () => convertOppToSalesOrder(id) });
      }
      if (appId === 'sales' && subModule === 'orders' && newData.statut === 'Confirmé' && oldRecord.statut !== 'Confirmé') {
        processOrderValidation(record);
      }
      if (appId === 'finance' && subModule === 'invoices' && newData.statut === 'Payé' && oldRecord.statut !== 'Payé') {
        generateInvoiceEntry(record);
      }
      if (appId === 'hr' && subModule === 'expenses' && newData.statut === 'Payé' && oldRecord.statut !== 'Payé') {
        generateExpenseEntry(record);
      }
      if (appId === 'purchase' && subModule === 'orders') {
        if (newData.statut === 'Réceptionné' && oldRecord.statut !== 'Réceptionné') {
          applyStockMove({ 
            productId: record.produitId, 
            qte: record.qte, 
            type: 'Réception', 
            ref: `ACHAT-${record.num || record.id}`,
            source: record.fournisseur,
            dest: 'Entrepôt Principal'
          });
          addHint({ title: "Marchandise Réceptionnée", message: `La commande ${record.num || record.id} a été réceptionnée dans le stock.`, type: 'success', appId: 'inventory' });
        }
        if (newData.statut === 'Facturé' && oldRecord.statut !== 'Facturé') {
           const billNum = getNextSequence('finance_vendor_bills') || `FF-${Date.now().toString().slice(-4)}`;
           const newBill = {
             id: Date.now().toString(),
             num: billNum,
             fournisseur: record.fournisseur,
             date: new Date().toISOString().split('T')[0],
             montant: record.total,
             statut: 'À payer',
             orderId: record.id,
             createdAt: new Date().toISOString()
           };
           nextState = { ...nextState, finance: { ...nextState.finance, vendor_bills: [newBill, ...(nextState.finance?.vendor_bills || [])] } };
           addHint({ title: "Facture Fournisseur Créée", message: `La facture ${newBill.num} est désormais à régler en finance.`, type: 'info', appId: 'finance' });
           logAction('Facturation Achat', `Facture ${newBill.num} générée pour ${record.num}`, 'finance');
        }
      }
      return nextState;
    });
  }, [logAction, addHint, generateInvoiceEntry, generateProductionEntry, generateExpenseEntry, convertOppToSalesOrder, processOrderValidation, applyMOTransformation, applyStockMove, getNextSequence]);

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

  const generatePayrollEntry = useCallback(() => {
    const activeEmployees = (data.hr?.employees || []).filter(e => e.active !== false && e.salaire);
    if (activeEmployees.length === 0) {
      addHint({ title: "Masse Salariale Nulle", message: "Aucun salaire à générer pour les collaborateurs actifs.", type: 'warning' });
      return;
    }

    const { leaves = [] } = data.hr || {};
    
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
    
    addAccountingEntry(entry, lines);

    const payrollExpense = {
      id: `EXP-PAYROLL-${Date.now()}`,
      title: `Paiement Mensuel: Salaires ${mois}`,
      amount: massTotal,
      date: new Date().toISOString().split('T')[0],
      type: 'Salaires',
      employee: 'Masse Salariale',
      statut: 'En attente'
    };

    addRecord('hr', 'expenses', payrollExpense);

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
      addRecord('dms', 'files', dmsFile);
    });

    addHint({ title: "Paie Exécutée", message: `La masse salariale de ${massTotal.toLocaleString('fr-FR')} a été comptabilisée et les fiches de paie ont été archivées.`, type: 'success', appId: 'hr' });
    logAction('Génération Paie', `Calcul de ${activeEmployees.length} salaires et fiches de paie pour ${mois}`, 'hr');
  }, [data.hr?.employees, data.hr?.leaves, addAccountingEntry, addRecord, addHint, logAction]);

  const launchProductionOrder = useCallback((order) => {
    const bom = (data.production?.boms || []).find(b => b.id === order.bomId || b.produitId === order.produitId);
    if (!bom) {
      addHint({ title: "Nomenclature Manquante", message: `Aucune BOM trouvée pour ${order.produit}. Créez d'abord la nomenclature.`, type: 'warning' });
      return;
    }

    const composants = bom.composants || [];
    const shortages = [];

    // Deduct components from stock
    setData(prev => {
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
    updateRecord('production', 'workOrders', order.id, { ...order, statut: 'En cours' });

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
      addRecord('purchase', 'orders', po);
    });

    if (shortages.length > 0) {
      addHint({ title: "⚠️ Rupture détectée", message: `${shortages.length} article(s) en dessous du seuil. Commandes brouillon créées dans les Achats.`, type: 'warning', appId: 'production' });
    } else {
      addHint({ title: "✅ OF Lancé", message: `L'Ordre de Fabrication ${order.num} a été lancé. Stock mis à jour.`, type: 'success', appId: 'production' });
    }
    logAction('Production', `Lancement OF ${order.num} — ${order.qte} × ${order.produit}`, 'production');
  }, [data.production?.boms, data.inventory?.products, updateRecord, addRecord, addHint, logAction]);


  /* ══════════════════════════════════════════════════════════════════════════
     6. GLOBAL LOGIC (Search & Config)
     ══════════════════════════════════════════════════════════════════════════ */


  const globalSearch = useCallback((query) => {
    if (!query || query.length < 2) return setSearchResults([]);
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
    if (data.base?.contacts) data.base.contacts.forEach(c => (c.nom.toLowerCase().includes(q)) && results.push({ type: 'Contact', name: c.nom, appId: 'base' }));
    
    // 3. HR
    if (data.hr?.employees) data.hr.employees.forEach(e => (e.nom.toLowerCase().includes(q)) && results.push({ type: 'Collaborateur', name: e.nom, appId: 'hr' }));
    
    // 4. CRM
    if (data.crm?.leads) data.crm.leads.forEach(l => (l.nom.toLowerCase().includes(q) || l.entreprise.toLowerCase().includes(q)) && results.push({ type: 'Lead', name: `${l.nom} (${l.entreprise})`, appId: 'crm' }));
    if (data.crm?.opportunities) data.crm.opportunities.forEach(o => (o.titre.toLowerCase().includes(q) || o.client.toLowerCase().includes(q)) && results.push({ type: 'Opportunité', name: o.titre, appId: 'crm' }));
    
    // 5. Finance/Sales
    if (data.finance?.invoices) data.finance.invoices.forEach(i => (i.num.toLowerCase().includes(q) || i.client.toLowerCase().includes(q)) && results.push({ type: 'Facture', name: `${i.num} - ${i.client}`, appId: 'finance' }));
    if (data.sales?.orders) data.sales.orders.forEach(o => (o.num.toLowerCase().includes(q) || o.client.toLowerCase().includes(q)) && results.push({ type: 'Bon de Commande', name: `${o.num} - ${o.client}`, appId: 'sales' }));
    
    // 6. Inventory
    if (data.inventory?.products) data.inventory.products.forEach(p => (p.nom.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) && results.push({ type: 'Article', name: p.nom, appId: 'inventory' }));

    setSearchResults(results.slice(0, 12));
  }, [data]);

  const updateConfig = useCallback((newConfig) => setConfig(prev => ({ ...prev, ...newConfig })), []);
  const addCustomField = useCallback((appId, field) => setConfig(prev => ({ ...prev, customFields: { ...prev.customFields, [appId]: [...(prev.customFields[appId] || []), field] } })), []);
  const updateGlobalSettings = useCallback(async (newGlobal) => {
    if (userRole !== 'SUPER_ADMIN') return;
    setGlobalSettings(prev => ({ ...prev, ...newGlobal }));
    if (auth.currentUser) setDoc(doc(db, 'settings', 'global'), { ...newGlobal }, { merge: true });
  }, [userRole]);

  const togglePinnedModule = useCallback((moduleId) => {
    if (userRole !== 'SUPER_ADMIN') return;
    setGlobalSettings(prev => {
      const currentPinned = prev.pinnedModules || [];
      const newPinned = currentPinned.includes(moduleId) ? currentPinned.filter(m => m !== moduleId) : [...currentPinned, moduleId];
      return { ...prev, pinnedModules: newPinned };
    });
  }, [userRole]);

  const sendNotification = useCallback(async (targetRole, title, message, type = 'info', actionApp = null) => {
    const notifyDoc = {
      id: Date.now().toString(),
      targetRole,
      title,
      message,
      type,
      actionApp,
      readBy: [],
      createdAt: new Date().toISOString()
    };
    try {
      if (auth.currentUser) await setDoc(doc(db, 'notifications', notifyDoc.id), notifyDoc);
    } catch (e) {
      console.error("sendNotification Error:", e);
    }
  }, []);


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

  const createFullUser = useCallback(async (userData, source = 'admin') => {
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
      };

      // 1. Create User Document
      await setDoc(doc(db, 'users', uid), { 
        profile: profileData, 
        permissions: { roles: [role], allowedModules: ['staff_portal'] }, 
        data: {} 
      });

      // 2. Create HR Record
      await setDoc(doc(db, 'hr', uid), { ...profileData, subModule: 'employees' });

      // 3. Send Notification
      if (source === 'hr') {
        await sendNotification('SUPER_ADMIN', 'Nouveau Collaborateur RH', `Un nouveau compte pour ${userData.nom} a été créé par les RH. Veuillez configurer ses accès.`, 'user', 'user_management');
      } else {
        await sendNotification('RH', 'Nouvel Utilisateur Provisionné', `Un compte pour ${userData.nom} a été créé par l'Admin. Veuillez compléter son profil RH.`, 'user', 'hr');
      }

      return { success: true, uid };
    } finally { if (secondaryApp) deleteApp(secondaryApp); }
  }, [sendNotification]);
 
  const toggleUserStatus = useCallback(async (userId, newStatus) => {
    const uid = String(userId);
    try {
      if (auth.currentUser) {
        await setDoc(doc(db, 'users', uid), { profile: { active: newStatus } }, { merge: true });
        await setDoc(doc(db, 'hr', uid), { active: newStatus }, { merge: true });
      }
      logAction(newStatus ? 'Réactivation Utilisateur' : 'Désactivation Utilisateur', `ID: ${uid}`, 'system');
      return { success: true };
    } catch (e) {
      console.error("toggleUserStatus error:", e);
      throw e;
    }
  }, [logAction]);


  const permanentlyDeleteUserRecord = useCallback(async (userId) => {
    const uid = String(userId);
    if (auth.currentUser) await deleteDoc(doc(db, 'users', uid));
    setData(prev => ({ ...prev, hr: { ...prev.hr, employees: (prev.hr?.employees || []).filter(e => String(e.id) !== uid) } }));
    setPermissions(prev => { const next = { ...prev }; delete next[uid]; return next; });
    logAction('Suppression Définitive Utilisateur', `ID: ${uid}`, 'system');
  }, [logAction]);

  const approveRequest = useCallback((appId, subModule, id) => {
    updateRecord(appId, subModule, id, { statut: 'Validé', validatedBy: currentUser.nom, validatedAt: new Date().toISOString() });
    addHint({ title: "Demande Approuvée", type: 'success', appId });
  }, [updateRecord, addHint, currentUser.nom]);

  const rejectRequest = useCallback((appId, subModule, id) => {
    updateRecord(appId, subModule, id, { statut: 'Refusé', validatedBy: currentUser.nom, validatedAt: new Date().toISOString() });
  }, [updateRecord, currentUser.nom]);
2: 
3:   // --- IPC CONNECT SOCIAL HELPERS ---
4:   const addConnectPost = useCallback((post) => {
5:     const newPost = { ...post, id: `f${Date.now()}`, date: 'À l\'instant', reactions: 0, liked: false, comments: [], createdAt: new Date().toISOString() };
6:     setData(prev => ({
7:       ...prev,
8:       connect: { ...prev?.connect, posts: [newPost, ...(prev?.connect?.posts || [])] }
9:     }));
10:     logAction('Publication Sociale', post.title, 'connect');
11:   }, [logAction]);
12: 
13:   const likeConnectPost = useCallback((postId) => {
14:     setData(prev => {
15:       const posts = prev?.connect?.posts || [];
16:       const updated = posts.map(p => p.id === postId ? { ...p, reactions: p.liked ? p.reactions - 1 : p.reactions + 1, liked: !p.liked } : p);
17:       return { ...prev, connect: { ...prev.connect, posts: updated } };
18:     });
19:   }, []);
20: 
21:   const addConnectComment = useCallback((postId, comment) => {
22:     setData(prev => {
23:       const posts = prev?.connect?.posts || [];
24:       const updated = posts.map(p => p.id === postId ? { ...p, comments: [...(p.comments || []), { ...comment, id: Date.now() }] } : p);
25:       return { ...prev, connect: { ...prev.connect, posts: updated } };
26:     });
27:   }, []);
28: 
29:   const participateInEvent = useCallback((eventId) => {
30:     setData(prev => {
31:       const events = prev?.connect?.events || [];
32:       const updated = events.map(e => e.id === eventId ? { ...e, attendees: (e.attendees || 0) + 1, participated: true } : e);
33:       return { ...prev, connect: { ...prev.connect, events: updated } };
34:     });
35:     addHint({ title: "Participation confirmée", message: "Vous êtes inscrit à cet événement !", type: 'success' });
36:   }, [addHint]);
37: 

  /* ══════════════════════════════════════════════════════════════════════════
     8. CLOUD LISTENERS
     ══════════════════════════════════════════════════════════════════════════ */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        let role = 'STAFF';
        if (['ra.yoman@ipcgreenblocks.com', 'fall.jcjunior@gmail.com', 'yoman.raphael@gmail.com'].includes(user.email)) role = 'SUPER_ADMIN';
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        
        let profile = { id: user.uid, nom: user.email.split('@')[0], email: user.email, role };

        if (docSnap.exists()) {
          const userData = docSnap.data();
          if (userData.data) setData(userData.data);
          profile = { ...profile, ...userData.profile, role: userData.profile?.role || role };
        }
        
        setCurrentUser(profile);

        // Auto landing logic
        const landingPages = {
            'SUPER_ADMIN': 'home',
            'ADMIN': 'home',
            'SALES': 'crm',
            'HR': 'hr',
            'FINANCE': 'accounting',
            'STAFF': 'staff_portal',
            'PRODUCTION': 'production'
        };
        setActiveApp(landingPages[profile.role] || 'home');

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
    const unsubscribes = ['crm', 'sales', 'inventory', 'production', 'accounting', 'projects', 'audit_logs', 'hr', 'base', 'workflows', 'notifications'].map(colName => {
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
          if (colName === 'notifications') setNotifications(docs);
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
      updateUserRole, toggleModuleAccess, approveRequest, rejectRequest, createFullUser, permanentlyDeleteUserRecord, toggleUserStatus, logout, activeApp,
      setActiveApp, navigationIntent, setNavigationIntent, navigateTo, formatCurrency, activeCall, setActiveCall, sendNotification, notifications, togglePinnedModule,
      addAccountingEntry, generateInvoiceEntry, generatePayrollEntry, launchProductionOrder, addConnectPost, likeConnectPost, addConnectComment, participateInEvent,
      schemaOverrides, updateSchemaOverride: (moduleId, modelId, newConfig) => {
        setSchemaOverrides(prev => ({
           ...prev,
           [`${moduleId}.${modelId}`]: {
             ...(prev[`${moduleId}.${modelId}`] || {}),
             ...newConfig
           }
        }));
     }
    }}>

      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => useContext(BusinessContext);
