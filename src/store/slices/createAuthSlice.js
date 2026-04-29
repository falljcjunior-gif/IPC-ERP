export const createAuthSlice = (set, get) => ({
  // Default guest state — real user loaded from Firestore after Firebase Auth
  user: { id: 'guest', nom: 'Utilisateur', email: '', role: 'GUEST' },
  permissions: {},
  
  setUser: (user) => {
    // [SECURITY] Role is sourced exclusively from Firestore /users/{uid}.role
    // No client-side email-based role override — server is the source of truth
    set({ 
      user, 
      userRole: user?.role || 'GUEST',
      currentUser: user
    });
  },
  setPermissions: (permissions) => set({ permissions }),
  
  hasPermission: (module, action) => {
    const { user, permissions } = get();
    if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') return true;
    return !!permissions[module]?.[action];
  }
});
