export const createUiSlice = (set, get) => ({
  activeApp: 'home',
  globalSettings: {
    theme: 'light',
    brand: 'ALL',
    currency: 'FCFA',
    companyName: 'IPC Intelligence',
    pinnedModules: ['home', 'crm', 'hr', 'dms']
  },
  
  setActiveApp: (appId) => set({ activeApp: appId }),
  setGlobalSettings: (settings) => set((state) => ({ 
    globalSettings: { ...state.globalSettings, ...settings } 
  }))
});
