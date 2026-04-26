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
      return await FirestoreService.createDocument('sales_leads', validated);
    } catch (err) {
      logger.error('SalesService:createLead', err);
      throw err;
    }
  },

  async convertToClient(leadId) {
    // Logique de conversion : statut prospect -> client + audit trail
    return await FirestoreService.updateDocument('sales_leads', leadId, {
      statut: 'client',
      conversionDate: new Date().toISOString()
    });
  }
};
