export const createAuthSlice = (set, get) => ({
  user: { id: 'admin', nom: 'Administrateur', role: 'SUPER_ADMIN' },
  permissions: {},
  
  setUser: (user) => set({ user }),
  setPermissions: (permissions) => set({ permissions }),
  
  hasPermission: (module, action) => {
    const { user, permissions } = get();
    if (user.role === 'SUPER_ADMIN') return true;
    return !!permissions[module]?.[action];
  }
});
