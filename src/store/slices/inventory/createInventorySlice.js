/**
 * ══════════════════════════════════════════════════════════════════
 * INVENTORY STATE SLICE (ZUSTAND)
 * ══════════════════════════════════════════════════════════════════
 */

import { InventoryService } from '../../../services/inventory.service';

export const createInventorySlice = (set, get) => ({
  inventory: {
    products: [],
    movements: [],
    lowStockAlerts: [],
    loading: false
  },

  inventoryActions: {
    initInventory: () => {
      FirestoreService.subscribeToCollection('inventory_products', (docs) => {
        set(state => ({ inventory: { ...state.inventory, products: docs } }));
      });
      FirestoreService.subscribeToCollection('inventory_movements', (docs) => {
        set(state => ({ inventory: { ...state.inventory, movements: docs } }));
      });
    },

    adjustStock: async (productId, quantity, type, reason) => {
      set(state => ({ inventory: { ...state.inventory, loading: true } }));
      try {
        await InventoryService.registerMovement({ productId, quantity, type, reason });
        get().logAction?.('Stock', `Ajustement ${type}: ${quantity} unités`, 'inventory');
      } finally {
        set(state => ({ inventory: { ...state.inventory, loading: false } }));
      }
    }
  }
});
