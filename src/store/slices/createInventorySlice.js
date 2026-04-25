export const createInventorySlice = (set, get) => ({
  inventory: {
    products: [],
    movements: [],
    warehouses: []
  },
  
  setProducts: (products) => set((state) => ({
    inventory: { ...state.inventory, products }
  })),

  addMovement: (movement) => set((state) => {
    const newMove = {
      ...movement,
      id: movement.id || `MOVE-${Date.now()}`,
      timestamp: new Date().toISOString()
    };

    // Auto-update product stock logic
    const updatedProducts = state.inventory.products.map(p => {
      if (p.id === movement.productId) {
        const qty = movement.type === 'in' ? p.stock + movement.quantity : p.stock - movement.quantity;
        return { ...p, stock: qty };
      }
      return p;
    });

    return {
      inventory: {
        ...state.inventory,
        products: updatedProducts,
        movements: [newMove, ...state.inventory.movements]
      }
    };
  }),

  getProductStock: (productId) => {
    return get().inventory.products.find(p => p.id === productId)?.stock || 0;
  }
});
