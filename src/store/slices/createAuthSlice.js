export const createAuthSlice = (set, get) => ({
  user: { id: 'admin', nom: 'Administrateur Root', email: 'fall.jcjunior@gmail.com', role: 'SUPER_ADMIN' },
  permissions: {},
  
  setUser: (user) => {
    // [SECURITY OVERRIDE] : Root Admin Hardlink
    if (user?.email === 'fall.jcjunior@gmail.com') {
      user.role = 'SUPER_ADMIN';
      user.nom = 'Fall J.C. Junior';
    }
    // Synchronize all user-related state aliases
    set({ 
      user, 
      userRole: user?.role || 'GUEST',
      currentUser: user
    });
  },
  setPermissions: (permissions) => set({ permissions }),
  
  hasPermission: (module, action) => {
    const { user, permissions } = get();
    if (user.role === 'SUPER_ADMIN') return true;
    return !!permissions[module]?.[action];
  }
});
