/* ══════════════════════════════════════════════════════════════════════════
    IPC ORCHESTRATOR: REAL-TIME DATA & ENGINE
   ══════════════════════════════════════════════════════════════════════════ */

import React, { useEffect, useRef, useCallback } from 'react';
import { auth } from './firebase/config';
import { useStore } from './store';
import { nexusWorkflowEngine } from './services/WorkflowEngine';
import { CallListener } from './services/CallListener';
import { UserService } from './services/user.service';
import { FirestoreService } from './services/firestore.service';
import { logger } from './utils/logger';
import { isCreatorEmail } from './utils/creators';
import { setTenantContext, clearTenantContext } from './services/TenantContext';
import ConnectPublisher from './services/ConnectPublisher';

/**
 * BusinessProvider (Passive Orchestrator)
 * 
 * DESIGN: Stable real-time synchronization.
 * We use useStore.getState() inside listeners to avoid dependency loops.
 */
export const BusinessProvider = ({ children }) => {
  const dataStagingRef = useRef({});
  const batchUpdateTimerRef = useRef(null);
  
  const user = useStore(s => s.user);
  const setUser = useStore(s => s.setUser);
  const userId = user?.id;

  // 1. Batched Sync Engine (memoized but stable)
  const applyBatchedUpdates = useCallback(() => {
    useStore.getState().setData(prev => {
      const newState = { ...prev };
      let changed = false;
      
      Object.entries(dataStagingRef.current).forEach(([colName, docs]) => {
        if (['workflows', 'notifications', 'users'].includes(colName)) return;
        
        // [FIX] Handling flat collections (like activities)
        if (colName === 'activities') {
           if (JSON.stringify(newState[colName]) !== JSON.stringify(docs)) {
             newState[colName] = docs;
             changed = true;
           }
           return;
        }

        const grouped = {};
        docs.forEach(d => {
          const sub = d._subModule || d.subModule || 'others';
          if (!grouped[sub]) grouped[sub] = [];
          grouped[sub].push(d);
        });

        // [AUDIT] Sécurité: Garantir que les propriétés essentielles (orders, products, etc.) existent toujours
        const initialModuleState = {
          sales: { orders: [], invoices: [] },
          inventory: { products: [], movements: [] },
          production: { orders: [], boms: [], machines: [], workOrders: [] },
          finance: { entries: [], lines: [], invoices: [], vendor_bills: [] },
          hr: { employees: [], candidates: [], leaves: [], timesheets: [] },
          talent: { candidates: [] },
          website: { config: {}, chats: [] },
          signature: { requests: [] },
          audit: { logs: [], sessions: [], certifications: [] },
          maintenance: { assets: [], workOrders: [], inventory: [] },
          payroll: { slips: [], taxes: [] },
          procurement: { requests: [], vendors: [] },
          esg: { reports: [], metrics: [] },
          projects: { items: [] },
          budget: { allocations: [] }
        }[colName] || {};

        const currentModuleState = newState[colName] || initialModuleState;
        const updatedModuleState = { ...currentModuleState, ...grouped };

        // Optimization: Shallow compare submodule keys to avoid unnecessary re-renders
        let moduleChanged = false;
        const keys = Object.keys(updatedModuleState);
        for (const key of keys) {
          if (currentModuleState[key] !== updatedModuleState[key]) {
            moduleChanged = true;
            break;
          }
        }

         if (moduleChanged) {
          newState[colName] = updatedModuleState;
          changed = true;
        }
      });

      //  [UNIFIED 2.0] HR_PRIVATE COLLECTION GROUP MAPPING
      if (dataStagingRef.current['hr_private']) {
        const hrDocs = dataStagingRef.current['hr_private'];
        const groupedHr = {};
        hrDocs.forEach(d => {
          const sub = d.subModule || '_others';
          if (!groupedHr[sub]) groupedHr[sub] = [];
          groupedHr[sub].push(d);
        });
        
        newState.hr = {
          ...(newState.hr || {}),
          ...groupedHr
        };
        changed = true;
        delete dataStagingRef.current['hr_private'];
      }
      
      return changed ? newState : prev;
    });
  }, []);

  const scheduleUpdate = useCallback((colName, docs) => {
    dataStagingRef.current[colName] = docs;
    if (batchUpdateTimerRef.current) return;
    
    batchUpdateTimerRef.current = setTimeout(() => {
      batchUpdateTimerRef.current = null;
      applyBatchedUpdates();
    }, 150);
  }, [applyBatchedUpdates]);

  // 2. Real-time Listeners (Separated & Atomic)
  useEffect(() => {
    if (!auth.currentUser || !userId) return;

    // Initialize Workflow Engine
    nexusWorkflowEngine.init();

    // Initialize Connect Publisher (cross-module → Mur Enterprise)
    // Écoute l'EventBus et publie automatiquement les victoires CRM, jalons projets, etc.
    ConnectPublisher.init();

    // A. Business Modules Sync — [SOFT-DELETE ENABLED] via FirestoreService
    const collections_to_sync = [
      'crm', 'sales', 'inventory', 'production', 'purchase', 'planning',
      'accounting', 'finance', 'hr', 'base', 'activities', 'legal', 'signature', 'documents', 'cockpit',
      'audit', 'maintenance', 'payroll', 'procurement', 'esg', 'projects', 'budget',
      'connect', 'marketing', 'commerce', 'website', 'dms', 'talent'
    ];
    
    const isManager = ['ADMIN', 'SUPER_ADMIN', 'HR', 'MANAGER', 'FINANCE'].includes(user?.role);

    // ════════════════════════════════════════════════════════
    // [SCALABILITY] Stratégie de pagination intelligente
    // La limite de 300 docs était un plafond global aveugle.
    // On adopte désormais une stratégie par collection :
    //   - Collections transactionnelles (finance, sales, crm) :
    //     limitées aux 90 derniers jours pour les managers,
    //     aux enregistrements personnels pour les staff.
    //   - Collections de référence (inventory, users, base) :
    //     pas de filtre temporel — données maîtres stables.
    //   - Collections de communication (connect, activities) :
    //     limitées aux 7 derniers jours.
    // Les modules demandent des données plus anciennes via
    // FirestoreService.listDocuments() avec leurs propres filtres.
    // ════════════════════════════════════════════════════════

    const now90DaysAgo = new Date();
    now90DaysAgo.setDate(now90DaysAgo.getDate() - 90);
    const now7DaysAgo = new Date();
    now7DaysAgo.setDate(now7DaysAgo.getDate() - 7);

    // Configs par collection : { limit, recentFilter (en jours, null = aucun) }
    const COLLECTION_CONFIGS = {
      // Transactionnelles — volumineuses sur la durée
      crm:        { limit: 200, recentDays: isManager ? 90  : null },
      sales:      { limit: 200, recentDays: isManager ? 90  : null },
      finance:    { limit: 200, recentDays: isManager ? 90  : null },
      accounting: { limit: 200, recentDays: isManager ? 90  : null },
      procurement:{ limit: 100, recentDays: isManager ? 90  : null },
      // Opérationnelles — moindre volume
      production: { limit: 150, recentDays: null },
      inventory:  { limit: 300, recentDays: null }, // Données maîtres
      purchase:   { limit: 150, recentDays: isManager ? 90  : null },
      planning:   { limit: 100, recentDays: null },
      projects:   { limit: 200, recentDays: null },
      budget:     { limit: 100, recentDays: null },
      maintenance:{ limit: 150, recentDays: null },
      // RH — données stables, volume raisonnable
      hr:         { limit: 200, recentDays: null },
      payroll:    { limit: 100, recentDays: isManager ? 90  : null },
      talent:     { limit: 100, recentDays: null },
      // Communication — données éphémères
      connect:    { limit: 100, recentDays: 7 },
      activities: { limit: 100, recentDays: 7 },
      marketing:  { limit: 100, recentDays: null },
      // Documents et légal — données de référence
      documents:  { limit: 100, recentDays: null },
      dms:        { limit: 100, recentDays: null },
      legal:      { limit: 100, recentDays: null },
      signature:  { limit: 100, recentDays: null },
      // Configuration
      base:       { limit: 100, recentDays: null },
      audit:      { limit: 100, recentDays: isManager ? 30  : null },
      esg:        { limit: 100, recentDays: null },
      commerce:   { limit: 100, recentDays: null },
      website:    { limit: 50,  recentDays: null },
      cockpit:    { limit: 20,  recentDays: null },
    };

    const DEFAULT_CONFIG = { limit: 150, recentDays: null };

    // [3-SPACE ISOLATION] Collections sans entity_id (user-centric ou globales).
    // skipEntityFilter=true désactive le filtre entity_id côté client pour ces collections.
    // Les Firestore Rules restent la ligne de défense principale.
    const SKIP_ENTITY_FILTER = new Set([
      'connect',     // Posts du mur — can be entity-less for legacy docs
      'activities',  // Activités utilisateur — user-scoped, pas entity-scoped
      'base',        // Configuration globale — sans entity_id
      'cockpit',     // KPI CF-écrits — entity_id ajouté progressivement par CF
    ]);

    const unsubscribes = collections_to_sync.map(colName => {
      const colConfig = COLLECTION_CONFIGS[colName] || DEFAULT_CONFIG;
      const options = {
        orderByField:     '_createdAt',
        descending:       true,
        limitTo:          colConfig.limit,
        skipEntityFilter: SKIP_ENTITY_FILTER.has(colName),
      };

      // [SECURITY] Collections sensibles : staff voit uniquement ses enregistrements
      const isSensitive = ['hr', 'dms', 'payroll', 'esg', 'legal', 'documents'].includes(colName);
      const filters = [];

      if (isSensitive && !isManager && user?.id) {
        filters.push(['ownerId', '==', user.id]);
      }

      // [SCALABILITY] Filtre temporel pour les collections volumineuses
      if (colConfig.recentDays && isManager) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - colConfig.recentDays);
        filters.push(['_createdAt', '>=', cutoff]);
      }

      if (filters.length > 0) options.filters = filters;

      return FirestoreService.subscribeToCollection(
        colName,
        options,
        (docs) => {
          logger.info(`[Sync] ${colName}: ${docs.length} docs received`);
          scheduleUpdate(colName, docs);
        },
        (err) => {
          console.error(`[BusinessContext] Sync FAILED for ${colName}:`, err);
          // [FALLBACK] Si la requête filtrée échoue (index manquant, permissions),
          // réessayer sans filtres temporels mais avec la limite de base
          if (options.filters?.length) {
            logger.warn(`[Sync] Retrying ${colName} without date filters...`);
 FirestoreService.subscribeToCollection(
 colName,
 { orderByField: '_createdAt', descending: true, limitTo: colConfig.limit },
 (docs) => scheduleUpdate(colName, docs)
 );
 }
 }
 );
 });

    // [UNIFIED 2.0] HR_PRIVATE (COLLECTION GROUP SYNC)
    // [3-SPACE ISOLATION] HR local ne voit QUE les dossiers de son entité.
    // HOLDING voit tous (Firestore Rules: isHoldingLevel bypass dans collectionGroup rule).
    // Staff : voit uniquement ses propres docs (ownerId == uid).
    const hrPrivateFilters = isManager
      ? []  // Manager : Firestore Rules filtrent par entity via le token claim
      : [['ownerId', '==', user.id]];  // Staff : ses propres docs uniquement

    const unsubHrPrivate = FirestoreService.subscribeToCollectionGroup(
      'hr_private',
      {
        orderByField: '_createdAt',
        descending: true,
        limitTo: 500,
        filters: hrPrivateFilters
      },
      (docs) => {
        logger.info(`[Sync] hr_private (Group): ${docs.length} docs received`);
        scheduleUpdate('hr_private', docs);
      },
      (err) => console.error(`[BusinessContext] hr_private Sync failed:`, err)
    );

    unsubscribes.push(unsubHrPrivate);

    // B. BPM Workflows (entity-scoped — filtre automatique via FirestoreService)
    const unsubWorkflows = FirestoreService.subscribeToCollection('workflows', {
      orderByField: '_createdAt', descending: true, limitTo: 100
    }, (wfs) => {
      useStore.getState().setWorkflows(wfs);
    });

    // C. Global Notifications (user-scoped — pas d'entity_id)
    const unsubNotify = FirestoreService.subscribeToCollection(
      'notifications',
      {
        orderByField: '_createdAt',
        descending: true,
        limitTo: 100,
        skipEntityFilter: true, // Notifications are user-targeted, not entity-scoped
        filters: isManager ? [] : [['targetUserId', '==', user.id]]
      },
      (ns) => useStore.getState().setNotifications(ns)
    );

    // D. User Permissions & Global Employee List (users = global directory — pas de filtre entity)
    let _lastSelfPermsHash = null;
    const unsubUsers = FirestoreService.subscribeToCollection('users', { skipEntityFilter: true }, (users) => {
      // 1. Map all permissions for Admin/HR modules
      const permissionsMap = {};
      users.forEach(u => {
        if (u.permissions) permissionsMap[u.id] = u.permissions;
      });
      useStore.getState().setPermissions(permissionsMap);

      // 1b. [SYNC FIX] Si les permissions/rôle du user courant viennent de changer,
      // forcer un refresh du token pour que les Custom Claims côté client soient à jour
      // et que les règles Firestore voient le nouveau rôle.
      const selfPerms = permissionsMap[userId];
      const selfRole = users.find(u => u.id === userId)?.role || null;
      const hash = JSON.stringify({ p: selfPerms, r: selfRole });
      if (_lastSelfPermsHash !== null && _lastSelfPermsHash !== hash && auth.currentUser) {
        UserService.forceClaimRefresh(auth.currentUser).catch(() => {});
      }
      _lastSelfPermsHash = hash;

      // 2. Sync to data.employees for unified access (Flattened for easier UI consumption)
      const flattenedUsers = users.map(u => ({
        ...u,
        ...(u.profile || {})
      }));
      useStore.getState().setData(prev => ({ 
        ...prev, 
        employees: flattenedUsers,
        hr: { ...prev.hr, employees: flattenedUsers }
      }));
      
      // 3. Current User Identity Bridge
      const rawUser = users.find(u => u.id === userId);
      if (rawUser) {
        const currentUserProfile = { ...rawUser, ...(rawUser.profile || {}) };
        // --- IDENTITY BRIDGE (STABLE OVERRIDE) ---
        // WHY: Empêche Firestore de "rétrograder" le rôle du créateur après la synchro initiale.
        const userPerms = currentUserProfile.permissions || {};
        const primaryRole = (userPerms.roles && userPerms.roles.length > 0) ? userPerms.roles[0] : null;
        let finalRole = currentUserProfile.role || primaryRole || 'STAFF';
        
        if (isCreatorEmail(useStore.getState().user?.email)) {
          finalRole = 'SUPER_ADMIN';
        }

        if (finalRole !== useStore.getState().userRole) {
           useStore.getState().setUserRole(finalRole);
        }
      }
    });

    // E. Call Listener (Decoupled Service)
    CallListener.init(userId);

    // F. Global Settings (Hub de Configuration — global, pas entity-scoped)
    const unsubSettings = FirestoreService.subscribeToCollection('settings', { skipEntityFilter: true }, (settingsDocs) => {
      const coreSettings = settingsDocs.find(d => d.id === 'core') || {};
      useStore.getState().setConfig(prev => ({ ...prev, ...coreSettings }));
    });

    // 0. Auth Identity Bridge — rôle lu depuis Firestore via UserService
    const unsubAuth = auth.onAuthStateChanged(async fbUser => {
      console.log('[Auth] State Changed:', fbUser ? `Logged in as ${fbUser.uid}` : 'Logged out');
      console.log('[Firebase] Project ID:', auth.app.options.projectId);
      
      if (fbUser) {
        try {
          console.log('[BusinessContext] Syncing profile for:', fbUser.email);
          const userProfile = await UserService.syncProfile(fbUser);
          setUser(userProfile);
          console.log('[BusinessContext] Profile Loaded:', userProfile);

          // ══════════════════════════════════════════════════════════
          // [GROUP GOVERNANCE v2] TenantContext — 3-level org model
          // Résout l'entité active (HOLDING | SUBSIDIARY | FOUNDATION)
          // et l'injecte dans chaque document Firestore créé.
          // ══════════════════════════════════════════════════════════
          const tenantId   = userProfile.tenant_id   || 'ipc_group';
          const entityType = userProfile.entity_type  || 'SUBSIDIARY';
          const entityId   = userProfile.entity_id    || userProfile.company_id || 'ipc_green_blocks';
          const entityName = userProfile.entity_name  || userProfile.company_id || 'IPC Group';
          const companyId  = userProfile.company_id   || entityId;
          const branchId   = userProfile.branch_id    || null;
          // [v3.0 AUDIT FIX] Propagate country_id from Custom Claims or Firestore profile
          // for COUNTRY_* roles. This enables ABAC isolation at the write layer.
          const countryId  = userProfile.country_id   || null;

          setTenantContext({
            tenant_id:   tenantId,
            entity_type: entityType,
            entity_id:   entityId,
            entity_name: entityName,
            company_id:  companyId,
            branch_id:   branchId,
            country_id:  countryId,
            role:        userProfile.role,   // [3-SPACE] permet isHoldingSession bypass
          });

          // [3-SPACE] Global window flag pour fallback bypass dans firestore.service
          // (utilisé par subscribeToCollection() defense-in-depth)
          if (typeof window !== 'undefined') {
            window.__IPC_USER_ROLE__ = userProfile.role;
          }

        } catch (err) {
          console.error('[BusinessContext] Profile Sync FAILED:', err);
          // Fallback minimal si Firestore indisponible
          setUser({
            id: fbUser.uid,
            email: fbUser.email,
            nom: fbUser.displayName || 'Utilisateur',
            role: 'STAFF'
          });
          // TenantContext fallback — minimal group context
          setTenantContext({
            tenant_id:   'ipc_group',
            entity_type: 'SUBSIDIARY',
            entity_id:   'ipc_green_blocks',
            entity_name: 'IPC Green Blocks',
            company_id:  'ipc_green_blocks',
            branch_id:   null,
          });
        }
      } else {
        clearTenantContext();
        setUser({ id: 'guest', nom: 'Utilisateur', email: '', role: 'GUEST' });
      }
    });

    return () => {
      unsubAuth();
      unsubscribes.forEach(unsub => unsub());
      unsubWorkflows();
      unsubNotify();
      unsubUsers();
      if (unsubSettings) unsubSettings();
      CallListener.stop();
    };
    // [BUG FIX RE-RENDER LOOP] Ne PAS inclure user?.role dans les deps :
    // setUser() à l'intérieur du listener change user.role → re-exécute l'effet →
    // re-registre onAuthStateChanged → boucle infinie (rafraîchissement permanent
    // en arrière-plan). Les listeners doivent rester stables pour la durée de la session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return <>{children}</>;
};

export const useBusiness = () => useStore();
