/**
 * ══════════════════════════════════════════════════════════════════
 * INVENTORY DOMAIN SLICE (ZUSTAND)
 * ══════════════════════════════════════════════════════════════════
 */

import { InventoryService } from '../../../services/inventory.service';
import { FirestoreService } from '../../../services/firestore.service';
import logger from '../../../utils/logger';

export const createInventorySlice = (set, get) => ({
  inventory: {
    data: {
      stock: [],
      movements: [],
      warehouses: []
    },
    loading: false,
    error: null
  },

  // Actions
  fetchInventory: async () => {
    set(state => ({ inventory: { ...state.inventory, loading: true } }));
    try {
      const stock = await FirestoreService.getCollection('inventory');
      set(state => ({ 
        inventory: { 
          ...state.inventory, 
          data: { ...state.inventory.data, stock }, 
          loading: false 
        } 
      }));
    } catch (error) {
      set(state => ({ inventory: { ...state.inventory, error, loading: false } }));
    }
  },

  recordStockMovement: async (movementData) => {
    try {
      const newMovement = await InventoryService.recordMovement(movementData);
      // Mise à jour optimiste ou re-fetch
      set(state => ({
        inventory: {
          ...state.inventory,
          data: {
            ...state.inventory.data,
            movements: [newMovement, ...state.inventory.data.movements]
          }
        }
      }));
      return newMovement;
    } catch (error) {
      logger.error('InventorySlice', 'Échec enregistrement mouvement', error);
      throw error;
    }
  }
});
