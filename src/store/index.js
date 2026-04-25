import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createAuthSlice } from './slices/createAuthSlice';
import { createUiSlice } from './slices/createUiSlice';
import { createFinanceStore } from './slices/createFinanceStore';
import { createInventorySlice } from './slices/createInventorySlice';
import { createOperationsSlice } from './slices/createOperationsSlice';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';

// ══════════════════════════════════════════════════════════════════════════
// 🚀 IPC INTELLIGENCE ENGINE: CENTRAL STORE
// ══════════════════════════════════════════════════════════════════════════

export const useStore = create(
  persist(
    (set, get, ...args) => ({
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      ...createAuthSlice(set, get, ...args),
      ...createUiSlice(set, get, ...args),
      ...createFinanceStore(set, get, ...args),
      ...createInventorySlice(set, get, ...args),
      ...createOperationsSlice(set, get, ...args),
      
      
      hints: [],
      setHints: (val) => set(typeof val === 'function' ? (state) => ({ hints: val(state.hints) }) : { hints: val }),
      searchResults: [],
      setSearchResults: (val) => set(typeof val === 'function' ? (state) => ({ searchResults: val(state.searchResults) }) : { searchResults: val }),
      workflows: [],
      setWorkflows: (val) => set(typeof val === 'function' ? (state) => ({ workflows: val(state.workflows) }) : { workflows: val }),
      activeCall: null,
      setActiveCall: (val) => set(typeof val === 'function' ? (state) => ({ activeCall: val(state.activeCall) }) : { activeCall: val }),
      notifications: [],
      setNotifications: (val) => set(typeof val === 'function' ? (state) => ({ notifications: val(state.notifications) }) : { notifications: val }),
      navigationIntent: null,
      setNavigationIntent: (val) => set(typeof val === 'function' ? (state) => ({ navigationIntent: val(state.navigationIntent) }) : { navigationIntent: val }),
      schemaOverrides: {},
      setSchemaOverrides: (val) => set(typeof val === 'function' ? (state) => ({ schemaOverrides: val(state.schemaOverrides) }) : { schemaOverrides: val }),
      config: { modules: [], workflows: [], theme: { primary: '#529990', accent: '#3d7870', mode: 'light' }, customFields: {} },
      setConfig: (val) => set(typeof val === 'function' ? (state) => ({ config: val(state.config) }) : { config: val }),
      permissions: {},
      setPermissions: (val) => set(typeof val === 'function' ? (state) => ({ permissions: val(state.permissions) }) : { permissions: val }),

      data: {
        base: {},
        hr: { employees: [], payroll: [] },
        crm: { leads: [], customers: [] },
        activities: [],
        marketing: { campaigns: [] }
      },
      
      setData: (fn) => set((state) => {
        const newData = typeof fn === 'function' ? fn(state.data) : fn;
        return { data: { ...state.data, ...newData } };
      }),

      // ── Brand / Multi-entity ─────────────────────────────────────────────
      BRANDS: [
        { id: 'ALL', name: 'Vue Globale (Admin)', short: 'ALL' },
        { id: 'IPC_CORE', name: 'IPC Core Service', short: 'IPC' },
        { id: 'B2B_LOG', name: 'B2B Logistics', short: 'B2B' }
      ],
      get activeBrand() { return this.globalSettings?.brand || 'ALL'; },
      setActiveBrand: (brand) => set((state) => ({ globalSettings: { ...state.globalSettings, brand } })),

      // ── Auth helpers ─────────────────────────────────────────────────────
      // Alias: currentUser mirrors the auth slice 'user' for backward compatibility
      get currentUser() { return get().user; },
      userRole: undefined, // resolved dynamically in components via currentUser?.role

      logout: async () => {
        try {
          await signOut(auth);
        } catch (e) {
          console.warn('Logout error:', e);
        }
        localStorage.removeItem('ipc_erp_current_user');
        localStorage.removeItem('daxcelor_data');
        set({ user: { id: 'guest', nom: 'Utilisateur', role: 'GUEST' } });
      },

      // ── Navigation ───────────────────────────────────────────────────────
      navigateTo: (appId) => set({ activeApp: appId }),
    }),
    {
      name: 'ipc-intelligence-store',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHasHydrated(true);
      },
      partialize: (state) => ({ 
        user: state.user, 
        globalSettings: state.globalSettings,
        activeApp: state.activeApp
      }),
    }
  )
);
