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
  },

  /**
   * 🔄 CONVERSION DEVIS -> COMMANDE
   * Déclenche automatiquement la réservation des stocks.
   */
  async convertQuoteToOrder(quoteId, quoteData) {
    try {
      const { InventoryService } = await import('./inventory.service');
      
      // 1. Création de la commande
      const order = await this.createOrder({
        client: quoteData.client,
        items: quoteData.items,
        montant: quoteData.totalHT,
        quoteId: quoteId,
        statut: 'Confirmé'
      });

      // 2. Réservation automatique des stocks pour chaque item
      if (quoteData.items && quoteData.items.length > 0) {
        await Promise.all(quoteData.items.map(item => 
          InventoryService.reserveStock(item.productId || item.ref, item.quantity, order.id)
        ));
      }

      // 3. Mise à jour du statut du devis
      await FirestoreService.updateDocument('sales_quotes', quoteId, {
        statut: 'Accepté',
        orderId: order.id,
        acceptedAt: new Date().toISOString()
      });

      logger.info('Sales', `Devis ${quoteId} converti en Commande ${order.id}`);
      return order;
    } catch (error) {
      logger.error('Sales', 'Échec conversion devis', error);
      throw error;
    }
  }
};
