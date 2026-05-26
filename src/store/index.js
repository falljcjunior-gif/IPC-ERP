import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthService } from '../services/auth.service';
import { createAuthSlice } from './slices/createAuthSlice';
import { createUiSlice } from './slices/createUiSlice';
import { createFinanceSlice } from './slices/finance/createFinanceSlice';
import { createInventorySlice } from './slices/inventory/createInventorySlice';
import { createSalesSlice } from './slices/sales/createSalesSlice';
import { createHrSlice } from './slices/hr/createHrSlice';
import { createProductionSlice } from './slices/production/createProductionSlice';
import { createLogisticsSlice } from './slices/logistics/createLogisticsSlice';
import { createMarketingSlice } from './slices/marketing/createMarketingSlice';
import { createAdminSlice } from './slices/createAdminSlice';
import { createCallSlice } from './slices/createCallSlice';
import { createOperationsSlice } from './slices/createOperationsSlice';
import { createFoundationSlice } from './slices/foundation/createFoundationSlice';
import logger from '../utils/logger';

// ══════════════════════════════════════════════════════════════════════════
//  IPC INTELLIGENCE ENGINE: CENTRAL STORE
// ══════════════════════════════════════════════════════════════════════════

// ── [SECURITY FIX] AES-256-GCM via Web Crypto API ────────────────────────
// AVANT : XOR trivial (reversible en O(n), aucun secret réel)
// APRÈS : AES-256-GCM authenticated encryption — standard NIST FIPS 197
//
// Clé dérivée via PBKDF2 (100 000 itérations, SHA-256) depuis une seed
// générée par crypto.getRandomValues() et stockée en sessionStorage.
// Chaque écriture génère un IV aléatoire unique (nonce 12 octets).
// Le tag d'authentification GCM (16 octets) détecte toute altération.

const _AES_ALGO = 'AES-GCM';
const _PBKDF2_ITER = 100_000;

/** Génère ou récupère la seed de session (32 hex chars) */
const _getSessionSeed = () => {
  const KEY = '_ipc_aes_seed';
  let seed = sessionStorage.getItem(KEY);
  if (!seed) {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    seed = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    sessionStorage.setItem(KEY, seed);
  }
  return seed;
};

/** Dérive une CryptoKey AES-256-GCM depuis la seed via PBKDF2 */
const _deriveKey = async (seed) => {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(seed), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('ipc-erp-salt-v2'), iterations: _PBKDF2_ITER, hash: 'SHA-256' },
    keyMaterial,
    { name: _AES_ALGO, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

// Singleton de clé (évite re-dériver à chaque read/write)
let _cachedKey = null;
const _getKey = async () => {
  if (!_cachedKey) {
    const envSeed = import.meta.env.VITE_STORE_KEY || _getSessionSeed();
    _cachedKey = await _deriveKey(envSeed);
  }
  return _cachedKey;
};

const _buf2b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const _b642buf = (b64) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));

const _aesEncrypt = async (plaintext) => {
  const key = await _getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit nonce
  const enc = new TextEncoder();
  const cipherBuf = await crypto.subtle.encrypt(
    { name: _AES_ALGO, iv },
    key,
    enc.encode(plaintext)
  );
  // Stocker : iv (12 octets) + ciphertext+tag (N+16 octets) en base64
  const combined = new Uint8Array(iv.byteLength + cipherBuf.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipherBuf), iv.byteLength);
  return _buf2b64(combined.buffer);
};

const _aesDecrypt = async (b64) => {
  try {
    const key = await _getKey();
    const combined = _b642buf(b64);
    const iv = combined.slice(0, 12);
    const cipherBuf = combined.slice(12);
    const plainBuf = await crypto.subtle.decrypt(
      { name: _AES_ALGO, iv },
      key,
      cipherBuf
    );
    return new TextDecoder().decode(plainBuf);
  } catch {
    // Données corrompues ou clé changée → nettoyer proprement
    return null;
  }
};

// Async storage compatible avec Zustand persist middleware
const secureStorage = {
  getItem: async (name) => {
    try {
      const encrypted = localStorage.getItem(name);
      if (!encrypted) return null;
      // Rétrocompatibilité : si l'ancienne donnée XOR existe, la supprimer
      if (!encrypted.startsWith('AESGCM:')) {
        localStorage.removeItem(name);
        return null;
      }
      const decrypted = await _aesDecrypt(encrypted.slice(7));
      return decrypted ? JSON.parse(decrypted) : null;
    } catch (e) {
      logger.error('[SecureStorage] Erreur déchiffrement AES-GCM:', e);
      return null;
    }
  },
  setItem: async (name, value) => {
    try {
      const encrypted = await _aesEncrypt(JSON.stringify(value));
      localStorage.setItem(name, 'AESGCM:' + encrypted);
    } catch (e) {
      logger.error('[SecureStorage] Erreur chiffrement AES-GCM:', e);
    }
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
      ...createAdminSlice(set, get, ...args),
      ...createCallSlice(set, get, ...args),
      ...createOperationsSlice(set, get, ...args),
      ...createFoundationSlice(set, get, ...args),
      
      
      hints: [],
      setHints: (val) => set(typeof val === 'function' ? (state) => ({ hints: val(state.hints) }) : { hints: val }),
      searchResults: [],
      setSearchResults: (val) => set(typeof val === 'function' ? (state) => ({ searchResults: val(state.searchResults) }) : { searchResults: val }),
      workflows: [],
      setWorkflows: (val) => set(typeof val === 'function' ? (state) => ({ workflows: val(state.workflows) }) : { workflows: val }),
      notifications: [],
      setNotifications: (val) => set(typeof val === 'function' ? (state) => ({ notifications: val(state.notifications) }) : { notifications: val }),
      navigationIntent: null,
      setNavigationIntent: (val) => set(typeof val === 'function' ? (state) => ({ navigationIntent: val(state.navigationIntent) }) : { navigationIntent: val }),
      schemaOverrides: {},
      setSchemaOverrides: (val) => set(typeof val === 'function' ? (state) => ({ schemaOverrides: val(state.schemaOverrides) }) : { schemaOverrides: val }),
      config: { 
        modules: [], 
        workflows: [], 
        theme: { primary: '#529990', accent: '#3d7870', mode: 'light' }, 
        finance: { tvaRate: 18, currency: 'FCFA' },
        customFields: {} 
      },
      setConfig: (val) => set(typeof val === 'function' ? (state) => ({ config: val(state.config) }) : { config: val }),
      permissions: {},
      setPermissions: (val) => set(typeof val === 'function' ? (state) => ({ permissions: val(state.permissions) }) : { permissions: val }),

      data: {
        base: {},
        hr: { employees: [] },
        crm: { leads: [], customers: [] },
        sales: { orders: [], invoices: [] },
        inventory: { products: [], movements: [] },
        production: { orders: [], boms: [], machines: [], workOrders: [] },
        finance: { entries: [], lines: [], invoices: [], vendor_bills: [] },
        purchase: { orders: [] },
        logistics: { shipments: [] },
        legal: { contracts: [], litigations: [] },
        signature: { requests: [] },
        activities: [],
        marketing: { campaigns: [] },
        audit: { logs: [], sessions: [], certifications: [] },
        payroll: { slips: [], taxes: [] },
        projects: { items: [] },
        budget: { allocations: [] },
        planning: { events: [] },
        cockpit: { global_metrics: {}, alerts: [] }
      },
      
      setData: (next) => set((state) => {
        const nextData = typeof next === 'function' ? next(state.data) : next;
        
        // [AUDIT] Optimisation: Vérification d'égalité superficielle pour éviter les re-renders inutiles
        let hasChanges = false;
        for (const key in nextData) {
          if (state.data[key] !== nextData[key]) {
            hasChanges = true;
            break;
          }
        }
        
        if (!hasChanges) return state;
        return { data: { ...state.data, ...nextData } };
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
      setCurrentUser: (u) => {
        // Role is always sourced from Firestore /users/{uid}.role
        // No client-side role override — server is the source of truth
        set({ 
          currentUser: u, 
          user: u,
          userRole: u?.role || 'GUEST' 
        });
      },
      userRole: 'GUEST',
      setUserRole: (role) => set({ userRole: role }),

      logout: async () => {
        try {
          await AuthService.logout();
        } catch (e) {
          logger.warn('Logout error:', e);
        }
        localStorage.removeItem('ipc_erp_current_user');
        localStorage.removeItem('daxcelor_data');
        sessionStorage.clear();
        // Clear Firestore IndexedDB to prevent cross-session data leaks
        try {
          if (window.indexedDB?.databases) {
            const dbs = await window.indexedDB.databases();
            for (const db of dbs) {
              if (db.name) window.indexedDB.deleteDatabase(db.name);
            }
          }
        } catch (_e) { /* non-fatal */ }
        set({
          user: { id: 'guest', nom: 'Utilisateur', role: 'GUEST' },
          currentUser: null,
          userRole: 'GUEST',
          permissions: {},
          activeApp: 'home',
          dashboardPreferences: ['finance', 'crm', 'production', 'hr', 'supply'],
          hints: [],
          searchResults: [],
          workflows: [],
          notifications: [],
          navigationIntent: null,
          schemaOverrides: {},
          shellView: { sidebar: true, mobile: false, profile: false, ai: false, notifs: false, chat: false },
          data: {
            base: {},
            hr: { employees: [] },
            crm: { leads: [], customers: [] },
            sales: { orders: [], invoices: [] },
            inventory: { products: [], movements: [] },
            production: { orders: [], boms: [], machines: [], workOrders: [] },
            finance: { entries: [], lines: [], invoices: [], vendor_bills: [] },
            purchase: { orders: [] },
            logistics: { shipments: [] },
            legal: { contracts: [], litigations: [] },
            signature: { requests: [] },
            activities: [],
            marketing: { campaigns: [] },
            audit: { logs: [], sessions: [], certifications: [] },
            payroll: { slips: [], taxes: [] },
            projects: { items: [] },
            budget: { allocations: [] },
            planning: { events: [] },
            cockpit: { global_metrics: {}, alerts: [] },
          },
        });
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
        const currency = get().config?.currency || get().globalSettings?.currency || 'FCFA';
        if (compact && num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M ${currency}`;
        if (compact && num >= 1_000) return `${(num / 1_000).toFixed(0)}k ${currency}`;
        return num.toLocaleString('fr-FR').replace(/\u00a0/g, ' ') + ' ' + currency;
      },

      // ── Demo Data Seeder & Reset are implemented in createOperationsSlice ──
      // seedDemoData and resetAllData are provided by the operations slice spread below.

    }),
    {
      name: 'ipc-intelligence-store',
      storage: createJSONStorage(() => secureStorage), // [SÉCURISÉ] Chiffrement AES-256-GCM actif
      onRehydrateStorage: () => (state) => {
        if (state) {
          // [HYDRATION GUARD] : State is sourced from encrypted localStorage
          // Role consistency is verified during BusinessContext sync with UserService
          state.setHasHydrated(true);
        }
      },
      partialize: (state) => ({ 
        user: state.user, 
        globalSettings: state.globalSettings,
        activeApp: state.activeApp,
        dashboardPreferences: state.dashboardPreferences
      }),
    }
  )
);

// ── PERSISTENCE SYNCHRONISÉE (HORS CYCLE REACT) ──────────────────────────────
// Les données métier (data) proviennent de Firestore en temps réel.
// Elles ne sont PAS persistées en localStorage (risque de fuite de données sensibles).
// La source de vérité est Firestore — au reload, BusinessContext re-écoute les collections.
// Seuls user, globalSettings, activeApp et dashboardPreferences sont persistés (via partialize).
useStore.subscribe(
  (state) => state.userRole,
  (role) => {
    // Audit: log les changements de rôle (dev uniquement)
    if (import.meta.env.DEV) {
      console.info('[Store] userRole changed:', role);
    }
  }
);
// ── DEV DIAGNOSTIC TOOLS ──────────────────────────────────────────────────
if (import.meta.env.DEV) {
  window.__IPC_DEV_LOGIN__ = (role = 'SUPER_ADMIN') => {
    const mockUser = {
      id: 'dev-id',
      email: 'dev@ipc.com',
      nom: 'Dev Inspector',
      role: role,
      permissions: { roles: [role], allowedModules: ['hr'], moduleAccess: { hr: 'write' } }
    };
    useStore.getState().setCurrentUser(mockUser);
    console.info('[DEV] Mock login active:', role);
  };
}
