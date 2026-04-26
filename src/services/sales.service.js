/**
 * ══════════════════════════════════════════════════════════════════
 * SALES DOMAIN SERVICE
 * ══════════════════════════════════════════════════════════════════
 */

import { FirestoreService } from './firestore.service';
import { SalesSchemas } from '../schemas/sales.schema';
import logger from '../utils/logger';

export const SalesService = {
  
  async createLead(data) {
    try {
      const validated = SalesSchemas.lead(data);
      return await FirestoreService.addDocument('sales_leads', validated);
    } catch (err) {
      logger.error('SalesService:createLead', err);
      throw err;
    }
  },

  async createOrder(orderData) {
    try {
      const order = {
        ...orderData,
        status: 'DRAFT',
        createdAt: new Date().toISOString(),
        totalAmount: orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      };
      
      const doc = await FirestoreService.addDocument('sales_orders', order);
      logger.info('Sales', 'Nouvelle commande créée', doc.id);
      return { id: doc.id, ...order };
    } catch (error) {
      logger.error('Sales', 'Échec création commande', error);
      throw error;
    }
  },

  async convertToClient(leadId) {
    try {
      await FirestoreService.updateDocument('sales_leads', leadId, {
        statut: 'client',
        conversionDate: new Date().toISOString()
      });
      logger.info('Sales', 'Lead converti en client', leadId);
      return true;
    } catch (error) {
      logger.error('Sales', 'Échec conversion lead', error);
      throw error;
    }
  }
};
