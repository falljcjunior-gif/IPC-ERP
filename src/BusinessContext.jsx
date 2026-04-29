/* ══════════════════════════════════════════════════════════════════════════
   🚀 IPC ORCHESTRATOR: REAL-TIME DATA & ENGINE
   ══════════════════════════════════════════════════════════════════════════ */

import React, { useEffect, useRef, useCallback } from 'react';
import { auth } from './firebase/config';
import { useStore } from './store';
import { nexusWorkflowEngine } from './services/WorkflowEngine';
import { CallListener } from './services/CallListener';
import { UserService } from './services/user.service';
import { FirestoreService } from './services/firestore.service';
import { logger } from './utils/logger';

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
        
        const grouped = {};
        docs.forEach(d => {
          const sub = d.subModule || 'others';
          if (!grouped[sub]) grouped[sub] = [];
          grouped[sub].push(d);
        });

        // [AUDIT] Sécurité: Garantir que les propriétés essentielles (orders, products, etc.) existent toujours
        const initialModuleState = {
          sales: { orders: [], invoices: [] },
          inventory: { products: [], movements: [] },
          production: { orders: [], boms: [], machines: [], workOrders: [] },
          finance: { entries: [], lines: [], invoices: [], vendor_bills: [] },
          website: { config: {}, chats: [] },
          signature: { requests: [] }
        }[colName] || {};

        const currentModuleState = newState[colName] || initialModuleState;
        const updatedModuleState = { ...initialModuleState, ...grouped };

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

    // A. Business Modules Sync — [SOFT-DELETE ENABLED] via FirestoreService
    const collections_to_sync = [
      'crm', 'sales', 'inventory', 'production', 'purchase',
      'accounting', 'finance', 'hr', 'base', 'activities', 'legal', 'signature', 'documents'
    ];
    
    const unsubscribes = collections_to_sync.map(colName => {
      return FirestoreService.subscribeToCollection(
        colName, 
        { orderByField: '_createdAt', descending: true, limitTo: 300 },
        (docs) => scheduleUpdate(colName, docs),
        (err) => logger.error(`[BusinessContext] Sync failed for ${colName}`, err)
      );
    });

    // B. BPM Workflows
    const unsubWorkflows = FirestoreService.subscribeToCollection('workflows', {}, (wfs) => {
      useStore.getState().setWorkflows(wfs);
    });

    // C. Global Notifications
    const unsubNotify = FirestoreService.subscribeToCollection(
      'notifications', 
      { orderByField: '_createdAt', descending: true, limitTo: 100 },
      (ns) => useStore.getState().setNotifications(ns)
    );

    // D. User Permissions
    const unsubUsers = FirestoreService.subscribeToCollection('users', {}, (users) => {
      const currentUserProfile = users.find(u => u.id === userId);
      if (currentUserProfile) {
        useStore.getState().setPermissions(currentUserProfile.permissions || {});
        
        // --- IDENTITY BRIDGE (STABLE OVERRIDE) ---
        // WHY: Empêche Firestore de "rétrograder" le rôle du créateur après la synchro initiale.
        let finalRole = currentUserProfile.role || 'STAFF';
        const currentEmail = useStore.getState().user?.email;
        const isCreator = currentEmail?.toLowerCase().includes('falljcjunior');

        if (isCreator) {
          finalRole = 'SUPER_ADMIN';
        }

        if (finalRole !== useStore.getState().userRole) {
           useStore.getState().setUserRole(finalRole);
        }
      }
    });

    // E. Call Listener (Decoupled Service)
    CallListener.init(userId);

    // 0. Auth Identity Bridge — rôle lu depuis Firestore via UserService
    const unsubAuth = auth.onAuthStateChanged(async fbUser => {
      if (fbUser) {
        try {
          const userProfile = await UserService.syncProfile(fbUser);
          setUser(userProfile);
          logger.info('[BusinessContext] Profil synchronisé', { uid: fbUser.uid, role: userProfile.role });
        } catch (err) {
          logger.error('[BusinessContext] Erreur sync profil', err);
          // Fallback minimal si Firestore indisponible
          setUser({
            id: fbUser.uid,
            email: fbUser.email,
            nom: fbUser.displayName || 'Utilisateur',
            role: 'STAFF'
          });
        }
      } else {
        setUser({ id: 'guest', nom: 'Utilisateur', email: '', role: 'GUEST' });
      }
    });

    return () => {
      unsubAuth();
      unsubscribes.forEach(unsub => unsub());
      unsubWorkflows();
      unsubNotify();
      unsubUsers();
      CallListener.stop();
    };
  }, [userId, scheduleUpdate]); // Minimum dependencies

  return <>{children}</>;
};

export const useBusiness = () => useStore();
