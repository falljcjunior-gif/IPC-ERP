/**
 * ══════════════════════════════════════════════════════════════════
 * PRODUCTION DOMAIN SLICE (ZUSTAND)
 * ══════════════════════════════════════════════════════════════════
 */

import { ProductionService } from '../../../services/production.service';
import { FirestoreService } from '../../../services/firestore.service';
import logger from '../../../utils/logger';

export const createProductionSlice = (set, get) => ({
  production: {
    data: {
      orders: [],
      boms: [],
      machines: [],
      incidents: []
    },
    loading: false,
    error: null
  },

  // Actions
  fetchProductionOrders: async () => {
    set(state => ({ production: { ...state.production, loading: true } }));
    try {
      const orders = await FirestoreService.getCollection('production_orders');
      set(state => ({ 
        production: { 
          ...state.production, 
          data: { ...state.production.data, orders }, 
          loading: false 
        } 
      }));
    } catch (error) {
      set(state => ({ production: { ...state.production, error, loading: false } }));
    }
  },

  startNewOF: async (orderData) => {
    try {
      const newOrder = await ProductionService.startProductionOrder(orderData);
      set(state => ({
        production: {
          ...state.production,
          data: {
            ...state.production.data,
            orders: [newOrder, ...state.production.data.orders]
          }
        }
      }));
      return newOrder;
    } catch (error) {
      logger.error('ProductionSlice', 'Échec création OF', error);
      throw error;
    }
  }
});
