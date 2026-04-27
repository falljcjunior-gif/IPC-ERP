/* ══════════════════════════════════════════════════════════════════════════
   🚀 IPC ORCHESTRATOR: REAL-TIME DATA & ENGINE
   ══════════════════════════════════════════════════════════════════════════ */

import React, { useEffect, useRef, useCallback } from 'react';
import { 
  collection, query, onSnapshot, orderBy, where, limit
} from 'firebase/firestore';
import { auth, db } from './firebase/config';
import { useStore } from './store';

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
        const updatedModuleState = { ...currentModuleState, ...grouped };

        if (JSON.stringify(currentModuleState) !== JSON.stringify(updatedModuleState)) {
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

    // A. Business Modules Sync
    const collections_to_sync = [
      'crm', 'sales', 'inventory', 'production', 'purchase',
      'accounting', 'finance', 'hr', 'base', 'activities', 'legal', 'signature'
    ];
    
    const unsubscribes = collections_to_sync.map(colName => {
      const q = query(collection(db, colName), orderBy('createdAt', 'desc'), limit(200));
      return onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
        scheduleUpdate(colName, docs);
      });
    });

    // B. BPM Workflows
    const unsubWorkflows = onSnapshot(collection(db, 'workflows'), (snap) => {
      const wfs = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      useStore.getState().setWorkflows(wfs);
    });

    // C. Global Notifications
    const unsubNotify = onSnapshot(query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(50)), (snap) => {
      const ns = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      useStore.getState().setNotifications(ns);
    });

    // D. User Permissions
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const userPermissions = {};
      snap.docs.forEach(d => {
        const data = d.data();
        if (data.permissions) userPermissions[d.id] = data.permissions;
      });
      useStore.getState().setPermissions(userPermissions);
    });

    // E. Call Listener (IPC CONNECT)
    const unsubCalls = onSnapshot(query(collection(db, 'calls'), where('receiverId', '==', userId), where('status', '==', 'ringing'), limit(1)), (snap) => {
        const currentCall = useStore.getState().activeCall;
        
        if (snap.empty) {
          // If we had a ringing call as receiver, and now it's gone (cancelled/timed out), clear it
          if (currentCall?.status === 'ringing' && currentCall?.role === 'receiver') {
            useStore.getState().setActiveCall(null);
          }
          return;
        }

        const callDoc = snap.docs[0];
        const callData = callDoc.data();
        
        if (currentCall?.id === callDoc.id) return;

        useStore.getState().setActiveCall({ 
          id: callDoc.id, 
          roomId: callData.roomId || callDoc.id,
          role: 'receiver', 
          type: callData.type, 
          contactName: callData.callerName || 'Collègue',
          status: 'ringing'
        });
    });

    // 0. Auth Identity Bridge
    const unsubAuth = auth.onAuthStateChanged(fbUser => {
      if (fbUser) {
        setUser({
          id: fbUser.uid,
          email: fbUser.email,
          nom: fbUser.displayName || 'Utilisateur',
          role: fbUser.email === 'fall.jcjunior@gmail.com' ? 'SUPER_ADMIN' : 'STAFF'
        });
      }
    });

    return () => {
      unsubAuth();
      unsubscribes.forEach(unsub => unsub());
      unsubWorkflows();
      unsubNotify();
      unsubUsers();
      unsubCalls();
    };
  }, [userId, scheduleUpdate]); // Minimum dependencies

  return <>{children}</>;
};

export const useBusiness = () => useStore();
