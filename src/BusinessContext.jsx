import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { mockData } from './utils/data-factory';
import { auth, db, storage } from './firebase/config';
import { doc, getDoc, getDocs, setDoc, updateDoc, onSnapshot, collection, query, orderBy, limit, deleteDoc, where, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
      
      if (!merged.connect) merged.connect = {};
      if (!merged.connect.events || merged.connect.events.length === 0) {
        merged.connect.events = [
          {
            id: 'ev-1', title: "Town Hall : Vision 2026",
            date: "24 Avril", time: "10:00 - 11:30", type: "Remote",
            category: "Stratégie", attendees: 120, color: "#8B5CF6",
            participated: false
          },
          {
            id: 'ev-2', title: "Afterwork : Équipe Industrial",
            date: "18 Avril", time: "18:30 - 20:30", type: "On-site",
            category: "Détente", attendees: 25, color: "#F59E0B",
            participated: false
          },
          {
            id: 'ev-3', title: "Lancement Hub Supply Chain",
            date: "20 Avril", time: "09:00 - 10:00", type: "Hybrid",
            category: "Opérations", attendees: 45, color: "#10B981",
            participated: false
          }
        ];
      }

      return merged;
    } catch (e) {
      console.error("Erreur critique daxcelor_data, retour aux mockData:", e);
      return mockData;
    }
  });

  const [config, setConfig] = useState(() => {
    return safeParse('ipc_erp_config', {
      theme: { primary: '#1F363D', accent: '#529990', borderRadius: '1.25rem', isCompact: false, logoUrl: '/logo.png', logoWidth: 40, logoHeight: 40 },
      company: { name: 'I.P.C', website: 'https://ipc-erp.web.app', address: '', taxId: '' },
      localization: { currency: 'FCFA', dateFormat: 'DD/MM/YYYY', timezone: 'UTC+1', language: 'FR' },
      security: { tfaEnabled: false, sessionTimeout: 60 },
      notifications: { systemAlerts: true, emailDigest: false, chatSound: true },
      customFields: {},
      aiPreference: 'floating',
      aiName: 'Smart Intelligence'
    });
  });

  const [globalSettings, setGlobalSettings] = useState(() => {
    return safeParse('ipc_erp_global_settings', {
      logoUrl: '/logo.png', logoWidth: 40, logoHeight: 40, companyName: 'GREEN BLOCKS', website: 'https://ipc-erp.web.app', currency: 'FCFA',
      pinnedModules: ['home', 'crm', 'hr', 'dms'] // Default pinned modules
    });
  });

  const [permissions, setPermissions] = useState(() => safeParse('ipc_erp_permissions', {}));
  
  const [currentUser, setCurrentUser] = useState(() => {
    return safeParse('ipc_erp_current_user', { id: 'admin', nom: 'Administrateur', role: 'SUPER_ADMIN' });
  });

  const [activeApp, setActiveApp] = useState('home');
  const BRANDS = [
    { id: 'ALL', name: 'Vue Globale (Admin)', short: 'ALL' },
    { id: 'IPC_CORE', name: 'IPC Core Service', short: 'IPC' },
    { id: 'B2B_LOG', name: 'B2B Logistics', short: 'B2B' }
  ];
  const [activeBrand, setActiveBrand] = useState(() => localStorage.getItem('ipc_erp_active_brand') || 'ALL');
  
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
  useEffect(() => { localStorage.setItem('ipc_erp_active_brand', activeBrand); }, [activeBrand]);
  useEffect(() => { localStorage.setItem('daxcelor_data', JSON.stringify(data)); }, [data]);


  useEffect(() => {
    localStorage.setItem('ipc_erp_current_user', JSON.stringify(currentUser));
    localStorage.setItem('daxcelor_user_role', currentUser.role);
    
    // Cloud Sync for User settings (ONLY sync config/theme, NEVER permissions which are admin-controlled)
    if (auth.currentUser) {
      const userDoc = doc(db, 'users', auth.currentUser.uid);
      setDoc(userDoc, { config }, { merge: true }).catch(e => console.warn("Cloud Sync Error:", e.message));
    }
  }, [currentUser, config]);

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
    setTimeout(() => {
      const id = Date.now().toString();
      setHints(prev => [{ ...hint, id }, ...prev]);
    }, 0);
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
      type: 'log',
      brandId: activeBrand !== 'ALL' ? activeBrand : 'IPC_CORE'
    };
    
    setTimeout(() => {
      setData(prev => ({
        ...prev,
        activities: [activity, ...(prev.activities || [])]
      }));

      if (auth.currentUser) {
        setDoc(doc(db, 'activities', activity.id), activity);
      }
    }, 0);
  }, [currentUser.nom, activeBrand]);

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

  const generateLitigationEntry = useCallback((litigation, isProvision = true) => {
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
            };
            addHint({ title: "Réassort Automatique", message: `Stock projeté critique (${stockProjete}). Brouillon d'achat ${poNum} généré pour ${qteACommander} unitées.`, type: 'warning', appId: 'purchase' });
         } else if (newStock <= pointDeCommande) {
            addHint({ title: "Alerte Stock Bas", message: `Stock critique (${newStock}) mais réassort déjà en cours (Projeté: ${stockProjete}).`, type: 'info', appId: 'inventory' });
         }
      } else if (newStock <= (product.alerte || 0)) {
         addHint({ title: "Alerte Stock Bas", message: `Le stock de "${product.nom}" est critique (${newStock} unités).`, type: 'warning', appId: 'inventory' });
      }

      logAction(`Mouvement Stock (${type})`, `${product.nom} : ${qteNum} u.`, 'inventory');
      
      const nextState = { ...prev, inventory: { ...prev.inventory, products: updatedProducts, movements: [newMove, ...(prev.inventory?.movements || [])] } };
      if (newPoDraft) {
         nextState.purchase = { ...prev.purchase, orders: [newPoDraft, ...(prev.purchase?.orders || [])] };
      }
      return nextState;
    });
  }, [getNextSequence, addHint, logAction]);

  const applyMOTransformation = useCallback((moId) => {
    setData(prev => {
      const mo = prev.production?.workOrders?.find(o => o.id === moId);
      if (!mo) return prev;
      const bom = prev.production?.boms?.find(b => b.produit === mo.produit || b.product === mo.produit || b.productId === mo.produitId);
      if (!bom) {
        addHint({ title: "BOM Manquante", message: `Aucune nomenclature trouvée pour ${mo.produit}`, type: 'warning' });
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
    const newRecord = { 
      ...processedRecord, 
      id: processedRecord.id || Date.now().toString() + Math.random().toString(36).substr(2, 5), 
      createdAt: processedRecord.createdAt || new Date().toISOString(),
      brandId: activeBrand !== 'ALL' ? activeBrand : 'IPC_CORE'
    };
    setData(prev => {
      const moduleData = prev[appId] || {};
      const subModuleData = moduleData[subModule] || [];
      const nextState = { ...prev, [appId]: { ...moduleData, [subModule]: [newRecord, ...subModuleData] } };
      
      setTimeout(() => {
         logAction(`Création ${subModule}`, `${processedRecord.num || newRecord.id}`, appId);
         if (auth.currentUser) setDoc(doc(db, appId, newRecord.id), { ...newRecord, subModule, ownerId: auth.currentUser.uid }, { merge: true });
      }, 0);

      return nextState;
    });

    // Workflow: Legal ↔ Finance (Provisions)
    if (appId === 'legal' && subModule === 'litigations' && processedRecord.risqueFinancier > 0) {
      generateLitigationEntry(newRecord, true);
    }

    if (appId === 'inventory' && subModule === 'movements') applyStockMove({ productId: processedRecord.produitId || processedRecord.produit, qte: processedRecord.qte, type: processedRecord.type, ref: processedRecord.ref, source: processedRecord.source, dest: processedRecord.dest });

    // --- I.P.C. Automator (BPM Engine) onCreate ---
    const safeWorkflowsCreate = Array.isArray(data.workflows) ? data.workflows : (data.workflows?.[''] || data.workflows?.workflows || []);
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
               sendNotification(wf.actionTargetRole, `Auto: ${wf.name}`, msg, 'info', appId);
           } else if (wf.actionType === 'LOG_ACTION') {
               logAction('I.P.C. Automator', wf.actionPayload, appId, newRecord.id);
           }
           addHint({ title: "💡 Règle Exécutée", message: `La règle "${wf.name}" a été déclenchée.`, type: 'info', appId });
       }
    });
  }, [data.base?.sequences, getNextSequence, applyStockMove, logAction, activeBrand, generateLitigationEntry]);

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

  const updateRecord = useCallback((appId, subModule, id, newData) => {
    setData(prev => {
      if (!prev[appId] || !prev[appId][subModule]) return prev;
      const oldRecord = prev[appId][subModule].find(i => i.id === id);
      if (!oldRecord) return prev;
      const changes = Object.keys(newData).filter(key => newData[key] !== oldRecord[key]).map(key => `${key}: ${oldRecord[key] || 'vide'} → ${newData[key]}`).join(', ');
      const updatedList = prev[appId][subModule].map(item => item.id === id ? { ...item, ...newData } : item);
      let nextState = { ...prev, [appId]: { ...prev[appId], [subModule]: updatedList } };
      const record = updatedList.find(o => o.id === id);
      setTimeout(() => {
         logAction(`Modification ${subModule}`, changes ? `Changements sur ${record.num || id}: ${changes}` : `Mise à jour ${record.num || id}`, appId, id);
         if (auth.currentUser) setDoc(doc(db, appId, id), { ...record, subModule, updatedAt: new Date().toISOString() }, { merge: true });
      }, 0);
      
      if (appId === 'production' && subModule === 'workOrders' && newData.statut === 'Terminé' && oldRecord.statut !== 'Terminé') {
        applyMOTransformation(id);
        generateProductionEntry(record);
      }
      if (appId === 'crm' && subModule === 'opportunities' && newData.etape === 'Gagné' && oldRecord.etape !== 'Gagné') {
        addHint({ title: "Affaire Gagnée !", message: `L'opportunité "${record.titre}" est gagnée. Prêt à lancer la vente ?`, type: 'success', appId: 'sales', actionLabel: "Générer Commande", onAction: () => convertOppToSalesOrder(id) });
      }
      if (appId === 'sales' && subModule === 'orders' && newData.statut === 'Confirmé' && oldRecord.statut !== 'Confirmé') {
        // Workflow: Sales ↔ Legal (Lock if modified)
        if (record.modifieHorsTemplate) {
           addHint({ 
             title: "Visa Juridique Manquant", 
             message: "Ce contrat a été modifié hors template. Le statut est bloqué en attente de visa.", 
             type: 'error', 
             appId: 'legal' 
           });
           // Revert Confirmé to 'Attente Visa'
           const revertedList = updatedList.map(item => item.id === id ? { ...item, statut: 'Attente Visa Juridique' } : item);
           nextState = { ...prev, [appId]: { ...prev[appId], [subModule]: revertedList } };
           sendNotification('Juridique', 'Visa requis pour commande modifiée', 'warning', 'legal');
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
         addHint({ title: "Visa Juridique Requis", message: "Le contrat de travail nécessite le visa du pôle juridique avant signature finale.", type: 'warning', appId: 'legal' });
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
         };
         nextState = { ...nextState, legal: { ...nextState.legal, contracts: [legalContract, ...(nextState.legal?.contracts || [])] } };
         addHint({ title: "Archivage Souverain", message: "Le document scellé a été archivé en sécurité dans le module juridique.", type: 'success', appId: 'legal' });
         
         // Domino 2: Validation du Devis (Sales)
         if (record.sourceId) {
             const salesList = nextState.sales?.orders || [];
             const saleIndex = salesList.findIndex(o => o.id === record.sourceId);
             if (saleIndex !== -1) {
                 const saleOld = salesList[saleIndex];
                 const updatedSalesList = [...salesList];
                 updatedSalesList[saleIndex] = { ...saleOld, statut: 'Confirmé' };
                 nextState = { ...nextState, sales: { ...nextState.sales, orders: updatedSalesList } };
                 addHint({ title: "Contrat Confirmé", message: `Le devis ${saleOld.num} a été automatiquement confirmé suite à la signature P.K.I.`, type: 'success', appId: 'sales' });
                 logAction('Effet Domino', `Devis ${saleOld.num} validé par signature P.K.I.`, 'sales', saleOld.id);
                 processOrderValidation(saleOld);
             }
         }
      }

      if (appId === 'finance' && subModule === 'invoices' && newData.statut === 'Payé' && oldRecord.statut !== 'Payé') {
        generateInvoiceEntry(record);
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
         
         const entryNum = getNextSequence('finance_entries');
         const analyticalEntry = {
            num: entryNum,
            date: new Date().toISOString().split('T')[0],
            libelle: `Imputation Analytique - ${record.collaborateur} (${heures}h sur ${record.projet})`,
            journal: 'OD',
            statut: 'Brouillon',
         };
         const lines = [
            { accountId: '641100', label: 'Frais de Personnel', debit: coutTotal, credit: 0, profitCenter: record.projet || 'Général' },
            { accountId: '421000', label: 'Personnel - Rémunérations dues', debit: 0, credit: coutTotal, profitCenter: 'Administration' }
         ];
         addAccountingEntry(analyticalEntry, lines);
         addHint({ title: "Comptabilité Analytique", message: `Pointage validé. Coût affecté: ${coutTotal} FCFA sur [${record.projet}].`, type: 'success', appId: 'finance' });
         logAction('Imputation Analytique', `${coutTotal} FCFA pour ${heures}h affectés à ${record.projet}`, 'hr');
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
          addHint({ title: "Marchandise Réceptionnée", message: `La commande ${record.num || record.id} a été réceptionnée dans le stock (${actualQte} unités).`, type: 'success', appId: 'inventory' });
        }
        if (newData.statut === 'Facturé' && oldRecord.statut !== 'Facturé') {
           const billNum = getNextSequence('finance_vendor_bills') || `FF-${Date.now().toString().slice(-4)}`;
           
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
           };
           nextState = { ...nextState, finance: { ...nextState.finance, vendor_bills: [newBill, ...(nextState.finance?.vendor_bills || [])] } };
           
           if (!threeWayMatch) {
             addHint({ title: "Alerte Fraude (3-Way Match)", message: `Facture bloquée ! Divergence QTE: Cmd(${qteCommandee}) ≠ Reçue(${qteRecue}) ≠ Fact(${qteFacturee})`, type: 'error', appId: 'finance' });
             logAction('Alerte Financière', `Blocage Facture ${newBill.num} (Anomalie 3-Way Match)`, 'finance');
           } else {
             addHint({ title: "Facture Fournisseur Créée", message: `La facture ${newBill.num} est validée (Match Parfait).`, type: 'success', appId: 'finance' });
             logAction('Facturation Achat', `Facture ${newBill.num} générée pour ${record.num}`, 'finance');
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
                 sendNotification(wf.actionTargetRole, `Auto: ${wf.name}`, msg, 'info', appId);
             } else if (wf.actionType === 'UPDATE_STATUS') {
                 // Apply the status change on top of nextState directly
                 const finalUpdatedList = nextState[appId][subModule].map(item => item.id === id ? { ...item, statut: wf.actionPayload } : item);
                 nextState = { ...nextState, [appId]: { ...nextState[appId], [subModule]: finalUpdatedList } };
             } else if (wf.actionType === 'LOG_ACTION') {
                 logAction('I.P.C. Automator', wf.actionPayload, appId, id);
             }
             addHint({ title: "💡 Règle Exécutée", message: `La règle "${wf.name}" a été déclenchée avec succès.`, type: 'info', appId });
         }
      });
    return nextState;
    });
  }, [logAction, addHint, generateInvoiceEntry, generateProductionEntry, generateExpenseEntry, convertOppToSalesOrder, processOrderValidation, applyMOTransformation, applyStockMove, getNextSequence, generateLitigationEntry, sendNotification]);

  const deleteRecord = useCallback((appId, subModule, id) => {
    setData(prev => {
      const moduleData = prev[appId] || {};
      const subModuleData = moduleData[subModule] || [];
      const updatedList = subModuleData.filter(item => item.id !== id);
      const nextState = { ...prev, [appId]: { ...moduleData, [subModule]: updatedList } };
      setTimeout(() => {
         logAction(`Suppression ${subModule}`, `ID: ${id}`, appId);
         if (auth.currentUser) deleteDoc(doc(db, appId, id));
      }, 0);
      return nextState;
    });
  }, [logAction]);

  const processPOSOrder = useCallback((order) => {
    const newId = `POS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const dateStr = new Date().toISOString().split('T')[0];

    addRecord('commerce', 'posOrders', {
      id: newId,
      client: order.customer || 'Passager',
      montant: order.totalAmount,
      items: `Ticket avec ${order.cart.length} ligne(s)`,
      statut: 'Payé',
      date: dateStr,
      type: order.type || 'boutique'
    });

    addRecord('finance', 'incomes', {
      id: `FAC-${newId}`,
      description: `Vente Caisse (${order.type}) - ${order.customer || 'Passager'}`,
      montant: order.totalAmount,
      categorie: 'Ventes',
      statut: 'Payé',
      date: dateStr
    });

    // Decrement stock for each item in the cart
    setData(prev => {
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

    addHint({
       title: 'Vente Enregistrée',
       message: `Ticket ${newId} encaissé avec succès. Stock mis à jour.`,
       type: 'success'
    });
  }, [addRecord, addHint]);

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

  const uploadLogo = useCallback(async (file) => {
    if (userRole !== 'SUPER_ADMIN') throw new Error("Accès refusé");
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
  }, [userRole, updateGlobalSettings]);




  /* ══════════════════════════════════════════════════════════════════════════
     7. ADMIN LOGIC (User Management)
     ══════════════════════════════════════════════════════════════════════════ */

  const updateUserRole = useCallback((userId, newRole) => {
    setPermissions(prev => {
      const userPerms = prev[userId] || { allowedModules: [] };
      const newPerms = { ...userPerms, roles: [newRole] };
      
      if (auth.currentUser) {
        setDoc(doc(db, 'users', userId), { permissions: newPerms }, { merge: true })
          .catch(e => console.error("Erreur save role:", e));
      }
      return { ...prev, [userId]: newPerms };
    });
  }, []);

  const toggleModuleAccess = useCallback((userId, moduleId) => {
    setPermissions(prev => {
      const userPerms = prev[userId] || { roles: [], allowedModules: [] };
      const newModules = userPerms.allowedModules.includes(moduleId) 
        ? userPerms.allowedModules.filter(m => m !== moduleId) 
        : [...userPerms.allowedModules, moduleId];
      const newPerms = { ...userPerms, allowedModules: newModules };

      if (auth.currentUser) {
        setDoc(doc(db, 'users', userId), { permissions: newPerms }, { merge: true })
          .catch(e => console.error("Erreur save permissions:", e));
      }
      return { ...prev, [userId]: newPerms };
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

      const permissionsData = {
        roles: userData.roles || [role],
        allowedModules: userData.allowedModules || ['home']
      };

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
        await sendNotification('SUPER_ADMIN', 'Onboarding Finalisé', `Le compte de ${userData.nom} a été généré via Onboarding RH.`, 'user', 'hr');
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


  // --- IPC CONNECT SOCIAL HELPERS ---
  const addConnectPost = useCallback((post) => {
    const newPost = { ...post, id: `f${Date.now()}`, date: 'À l\'instant', reactions: 0, liked: false, comments: [], createdAt: new Date().toISOString() };
    setData(prev => ({
      ...prev,
      connect: { ...prev?.connect, posts: [newPost, ...(prev?.connect?.posts || [])] }
    }));
    logAction('Publication Sociale', post.title, 'connect');
  }, [logAction]);

  const likeConnectPost = useCallback((postId) => {
    setData(prev => {
      const posts = prev?.connect?.posts || [];
      const updated = posts.map(p => p.id === postId ? { ...p, reactions: p.liked ? p.reactions - 1 : p.reactions + 1, liked: !p.liked } : p);
      return { ...prev, connect: { ...prev.connect, posts: updated } };
    });
  }, []);

  const addConnectComment = useCallback((postId, comment) => {
    setData(prev => {
      const posts = prev?.connect?.posts || [];
      const updated = posts.map(p => p.id === postId ? { ...p, comments: [...(p.comments || []), { ...comment, id: Date.now() }] } : p);
      return { ...prev, connect: { ...prev.connect, posts: updated } };
    });
  }, []);

  const participateInEvent = useCallback((eventId) => {
    setData(prev => {
      const events = prev?.connect?.events || [];
      const updated = events.map(e => e.id === eventId ? { ...e, attendees: (e.attendees || 0) + 1, participated: true } : e);
      return { ...prev, connect: { ...prev.connect, events: updated } };
    });
    addHint({ title: "Participation confirmée", message: "Vous êtes inscrit à cet événement !", type: 'success' });
  }, [addHint]);

  /* ══════════════════════════════════════════════════════════════════════════
     7. CALLING & REALTIME NOTIFICATIONS
     ══════════════════════════════════════════════════════════════════════════ */
  
  const playRingtone = () => {
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
    };

    // "Classic but soft" sequence
    for (let i = 0; i < 4; i++) {
        const offset = i * 2;
        playNote(660, startTime + offset, 0.4);      
        playNote(660, startTime + offset + 0.5, 0.4); 
        playNote(660, startTime + offset + 1.2, 0.6); 
    }
  };

  const acceptCall = async () => {
    if (!activeCall) return;
    try {
      setActiveCall(prev => ({ ...prev, accepted: true }));
      await updateDoc(doc(db, 'calls', activeCall.id), { status: 'accepted' });
    } catch (err) { console.error("Accept Error:", err); }
  };

  const rejectCall = async () => {
    if (!activeCall) return;
    try {
      await updateDoc(doc(db, 'calls', activeCall.id), { status: 'rejected' });
      setActiveCall(null);
    } catch (err) { console.error("Reject Error:", err); }
  };


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
          // NOTE: Ne pas écraser data avec userData.data — les collections Firestore
          // ('hr', 'crm', etc.) sont la source de vérité, et le listener cloud
          // les charge via onSnapshot. Écraser ici causerait des données obsolètes.

          let fetchedRole = role;
          if (userData.permissions && userData.permissions.roles && userData.permissions.roles.length > 0) {
             fetchedRole = userData.permissions.roles.includes('SUPER_ADMIN') ? 'SUPER_ADMIN' : userData.permissions.roles[0];
          }
          profile = { ...profile, ...userData.profile, role: fetchedRole };

          if (userData.permissions) {
             setPermissions(prev => ({ ...prev, [user.uid]: userData.permissions }));
          }
        }
        
        setCurrentUser(profile);

        // Auto landing logic: Everybody lands on their intelligent Personal Workspace ('home')
        setActiveApp('home');

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
        
        // Prevent re-triggering if we already have an active call for this ID
        if (activeCall?.id === callDoc.id) return;

        // Automatically trigger incoming call UI
        setActiveCall({ 
          id: callDoc.id, 
          roomId: callData.roomId || callDoc.id,
          role: 'receiver', 
          type: callData.type, 
          contactName: callData.callerName || 'Collègue',
          status: 'ringing'
        });

        // "Classique mais douce" Ringtone
        playRingtone();
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    // Déclencher les listeners uniquement quand un vrai utilisateur est authentifié
    if (!currentUser || currentUser.id === 'guest' || !auth.currentUser) return;

    const COLLECTIONS = [
      'crm', 'sales', 'inventory', 'production',
      'accounting', 'projects', 'audit_logs', 'hr',
      'base', 'workflows', 'notifications', 'users', 'activities'
    ];

    const unsubscribes = COLLECTIONS.map(colName => {
      const q = query(collection(db, colName), orderBy('createdAt', 'desc'), limit(200));
      return onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs
          .map(d => ({ ...d.data(), id: d.id }))
          .filter(d => activeBrand === 'ALL' || !d.brandId || d.brandId === activeBrand);
        setData(prev => {
          const newState = { ...prev };
          if (colName === 'audit_logs') {
            newState.audit = { ...newState.audit, logs: docs };
          } else if (colName === 'users') {
            // Synchroniser les profils utilisateurs dans la liste RH
            const employeeProfiles = docs
              .filter(u => u.profile)
              .map(u => ({ ...u.profile, id: u.id || u.profile?.id, subModule: 'employees' }));
            if (employeeProfiles.length > 0) {
              const existingIds = new Set((prev.hr?.employees || []).map(e => e.id));
              const newEmployees = employeeProfiles.filter(e => !existingIds.has(e.id));
              if (newEmployees.length > 0) {
                newState.hr = { ...prev.hr, employees: [...(prev.hr?.employees || []), ...newEmployees] };
              }
            }
          } else if (colName === 'activities') {
            newState.activities = docs;
          } else {
            const grouped = {};
            docs.forEach(d => {
              const sub = d.subModule || 'others';
              if (!grouped[sub]) grouped[sub] = [];
              grouped[sub].push(d);
            });
            // Fusionner pour ne pas écraser les données locales non encore sync
            Object.keys(grouped).forEach(sub => {
              const firestoreIds = new Set(grouped[sub].map(d => d.id));
              const localOnly = (prev[colName]?.[sub] || []).filter(d => !firestoreIds.has(d.id));
              grouped[sub] = [...grouped[sub], ...localOnly];
            });
            newState[colName] = { ...prev[colName], ...grouped };
          }
          if (colName === 'notifications') setNotifications(docs);
          return newState;
        });
      });
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [currentUser.id, activeBrand]); // Re-run quand l'utilisateur ou la marque courante change

  /* ══════════════════════════════════════════════════════════════════════════
     9. EXPORTS & NAVIGATION
     ══════════════════════════════════════════════════════════════════════════ */

  const logout = useCallback(async () => {
    await auth.signOut();
    localStorage.removeItem('ipc_erp_current_user');
    localStorage.removeItem('daxcelor_data');
  }, []);

  const resetAllData = useCallback(async () => {
    // Collections métier à purger dans Firestore
    const businessCollections = [
      'crm', 'sales', 'inventory', 'finance', 'hr',
      'production', 'purchase', 'marketing', 'activities',
      'notifications', 'connect'
    ];

    addHint({ title: "Purge en cours...", message: "Suppression des données Firestore et locales...", type: 'info' });

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
    addHint({ title: "✅ ERP Vierge", message: "Toutes les données (Firestore + Local) ont été effacées. L'ERP repart de zéro.", type: 'success' });
  }, [addHint]);

  const seedDemoData = useCallback(async () => {
    const months = 6;
    const now = new Date();
    
    addHint({ title: "🌱 Seeding...", message: "Génération de 6 mois d'historique métier...", type: 'info' });

    // 1. Clients & Fournisseurs (Base)
    const clientNoms = ["Industries Ouest", "TechCorp Plus", "BTP Alpha", "Giga Mart", "Auto Pro"];
    const clients = clientNoms.map((nom, i) => ({ id: `CLI-00${i+1}`, nom, type: 'Client', email: `contact@${nom.toLowerCase().replace(' ', '')}.com`, categorie: 'B2B' }));
    clients.forEach(c => addRecord('base', 'contacts', c));

    // 2. Factures & Ventes (Finance)
    for (let m = 0; m < months; m++) {
      const dateM = new Date(now.getFullYear(), now.getMonth() - m, 15);
      const isPast = m > 0;
      
      // 5-8 Factures par mois
      const count = 5 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i++) {
        const montant = 500000 + Math.floor(Math.random() * 2500000);
        addRecord('finance', 'invoices', {
          client: clientNoms[i % 5],
          montant,
          statut: isPast ? 'Payé' : 'Envoyé',
          createdAt: dateM.toISOString(),
          type: 'vente'
        });

        // Achats correspondants (40% du CA)
        addRecord('finance', 'vendor_bills', {
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
    hrData.forEach(t => addRecord('talent', 'candidates', t));

    // Évaluations 360
    const skills = [
       { name: 'Technique', alice: 9, bob: 4, claire: 6 },
       { name: 'Com', alice: 7, bob: 10, claire: 9 },
       { name: 'Leadership', alice: 6, bob: 9, claire: 5 }
    ];
    addRecord('talent', 'appraisals', { empId: 'E001', nom: 'Jean Kouassi', period: 'Q1 2026', scores: skills.map(s => ({ key: s.name, val: s.alice })) });

    addHint({ title: "✅ Seeding Terminé", message: "Les données analytiques sont prêtes.", type: 'success' });
  }, [addRecord, addHint]);

  const navigateTo = useCallback((appId) => setActiveApp(appId), []);

  return (
    <BusinessContext.Provider value={{
      data, userRole, switchRole, addRecord, updateRecord, deleteRecord, globalSearch, searchResults, hints, dismissHint,
      config, updateConfig, globalSettings, updateGlobalSettings, addCustomField, currentUser, switchUser, permissions, setPermissions,
      updateUserRole, toggleModuleAccess, approveRequest, rejectRequest, createFullUser, permanentlyDeleteUserRecord, toggleUserStatus, logout, activeApp,
      setActiveApp, activeBrand, setActiveBrand, BRANDS, navigationIntent, setNavigationIntent, navigateTo, formatCurrency, activeCall, setActiveCall, acceptCall, rejectCall, sendNotification, notifications, togglePinnedModule, logAction,
      addAccountingEntry, generateInvoiceEntry, generatePayrollEntry, launchProductionOrder, addConnectPost, likeConnectPost, addConnectComment, participateInEvent, resetAllData, seedDemoData,
      processPOSOrder, uploadLogo,
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
