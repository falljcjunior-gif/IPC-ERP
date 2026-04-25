export const createFinanceStore = (set, get) => ({
  finance: {
    accounts: [],
    entries: [],
    lines: [],
    journals: []
  },
  
  setAccounts: (accounts) => set((state) => ({ 
    finance: { ...state.finance, accounts } 
  })),
  
  addEntry: (entry) => set((state) => {
    const newEntry = {
      ...entry,
      id: entry.id || Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    return {
      finance: {
        ...state.finance,
        entries: [newEntry, ...state.finance.entries]
      }
    };
  }),

  // Advanced financial balancing check
  checkBalance: () => {
    const { finance } = get();
    const debits = finance.lines.filter(l => l.type === 'debit').reduce((sum, l) => sum + l.amount, 0);
    const credits = finance.lines.filter(l => l.type === 'credit').reduce((sum, l) => sum + l.amount, 0);
    return Math.abs(debits - credits) < 0.001; // Precision for currency
  }
});
