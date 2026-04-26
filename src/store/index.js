import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createAuthSlice } from './slices/createAuthSlice';
import { createUiSlice } from './slices/createUiSlice';
import { createFinanceSlice } from './slices/finance/createFinanceSlice';
import { createInventorySlice } from './slices/inventory/createInventorySlice';
import { createSalesSlice } from './slices/sales/createSalesSlice';
import { createHrSlice } from './slices/hr/createHrSlice';
import { createProductionSlice } from './slices/production/createProductionSlice';
import { createLogisticsSlice } from './slices/logistics/createLogisticsSlice';
import { createMarketingSlice } from './slices/marketing/createMarketingSlice';
import { createOperationsSlice } from './slices/createOperationsSlice';

// ══════════════════════════════════════════════════════════════════════════
// 🚀 IPC INTELLIGENCE ENGINE: CENTRAL STORE
// ══════════════════════════════════════════════════════════════════════════

// 🔒 COUCHE DE SÉCURITÉ : CHIFFREMENT DU STOCKAGE LOCAL
const ENCRYPTION_KEY = 'ipc-erp-secure-v4-2026'; // À déplacer en variable d'env

const secureStorage = {
  getItem: (name) => {
    try {
      const encrypted = localStorage.getItem(name);
      if (!encrypted) return null;
      // Déchiffrement simple pour l'audit, à renforcer avec SubtleCrypto pour la prod
      const decrypted = atob(encrypted).split('').map((char, i) => 
        String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length))
      ).join('');
      return JSON.parse(decrypted);
    } catch (e) {
      console.error("Erreur de déchiffrement du store:", e);
      return null;
    }
  },
  setItem: (name, value) => {
    const stringValue = JSON.stringify(value);
    const encrypted = btoa(stringValue.split('').map((char, i) => 
      String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length))
    ).join(''));
    localStorage.setItem(name, encrypted);
  },
  removeItem: (name) => localStorage.removeItem(name),
};

export const useStore = create(
  persist(
    (set, get, ...args) => ({
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      ...createAuthSlice(set, get, ...args),
      ...createUiSlice(set, get, ...args),
      ...createFinanceSlice(set, get, ...args),
      ...createInventorySlice(set, get, ...args),
      ...createSalesSlice(set, get, ...args),
      ...createHrSlice(set, get, ...args),
      ...createProductionSlice(set, get, ...args),
      ...createLogisticsSlice(set, get, ...args),
      ...createMarketingSlice(set, get, ...args),
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
      setActiveBrand: (brand) => set((state) => ({ globalSettings: { ...state.globalSettings, brand } })),

      // ── Auth helpers ─────────────────────────────────────────────────────
      // currentUser: backward-compat alias for `user` — set via setUser (auth slice)
      // Exposed as a plain setter so BusinessContext can sync it after Firebase auth
      currentUser: null,
      setCurrentUser: (u) => set({ currentUser: u, userRole: u?.role || 'GUEST' }),
      userRole: 'GUEST',
      setUserRole: (role) => set({ userRole: role }),

      logout: async () => {
        try {
          await signOut(auth);
        } catch (e) {
          console.warn('Logout error:', e);
        }
        localStorage.removeItem('ipc_erp_current_user');
        localStorage.removeItem('daxcelor_data');
        set({ user: { id: 'guest', nom: 'Utilisateur', role: 'GUEST' }, currentUser: null, userRole: 'GUEST' });
      },

      // ── Navigation ───────────────────────────────────────────────────────
      navigateTo: (appId) => set({ activeApp: appId }),

      // ── UI Shell State (global, used by multiple modules) ─────────────────
      shellView: { sidebar: true, mobile: false, profile: false, ai: false, notifs: false, chat: false },
      setShellView: (val) => set((state) => ({ shellView: typeof val === 'function' ? val(state.shellView) : { ...state.shellView, ...val } })),

      // ── Currency Formatter ────────────────────────────────────────────────
      formatCurrency: (val, compact = false) => {
        if (val === null || val === undefined) return '—';
        const num = parseFloat(val) || 0;
        const currency = get().globalSettings?.currency || 'FCFA';
        if (compact && num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M ${currency}`;
        if (compact && num >= 1_000) return `${(num / 1_000).toFixed(0)}k ${currency}`;
        return num.toLocaleString('fr-FR').replace(/\u00a0/g, ' ') + ' ' + currency;
      },

      // ── Demo Data Seeder & Reset (delegated to operations slice if available) ─
      seedDemoData: async () => {
        const fn = get().seedDemoDataImpl;
        if (typeof fn === 'function') return fn();
        console.warn('[Store] seedDemoData not yet implemented');
      },
      resetAllData: async () => {
        const fn = get().resetAllDataImpl;
        if (typeof fn === 'function') return fn();
        // Fallback: clear local data
        set({ data: { base: {}, hr: { employees: [], payroll: [] }, crm: { leads: [], customers: [] }, activities: [], marketing: { campaigns: [] } } });
        get().addHint?.({ title: '✅ Données réinitialisées', message: 'Toutes les données locales ont été effacées.', type: 'success' });
      },
    }),
    {
      name: 'ipc-intelligence-store',
      storage: createJSONStorage(() => secureStorage), // [SÉCURISÉ] Chiffrement XOR actif
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
