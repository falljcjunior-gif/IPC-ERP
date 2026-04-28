export const createUiSlice = (set, get) => ({
  activeApp: 'home',
  globalSettings: {
    theme: 'light',
    brand: 'ALL',
    currency: 'FCFA',
    companyName: 'IPC Intelligence',
    pinnedModules: ['home', 'crm', 'hr', 'dms']
  },
  
  // Préférences du tableau de bord (ordre et visibilité des widgets)
  dashboardPreferences: ['finance', 'crm', 'production', 'hr', 'supply'],
  
  setActiveApp: (appId) => set({ activeApp: appId }),
  setGlobalSettings: (settings) => set((state) => ({ 
    globalSettings: { ...state.globalSettings, ...settings } 
  })),
  setDashboardPreferences: (preferences) => set({ dashboardPreferences: preferences })
});
