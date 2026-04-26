/**
 * ══════════════════════════════════════════════════════════════════
 * PRODUCTION DOMAIN SERVICE
 * ══════════════════════════════════════════════════════════════════
 */

import { FirestoreService } from './firestore.service';
import { InventoryService } from './inventory.service';
import logger from '../utils/logger';

export const ProductionService = {
  
  /**
   * Lance un Ordre de Fabrication (OF)
   */
  async startProduction(ofData) {
    try {
      // 1. Validation de l'OF
      // 2. Consommation des matières premières via InventoryService
      // 3. Mise à jour statut OF
      return await FirestoreService.createDocument('production_orders', {
        ...ofData,
        status: 'in_progress',
        startedAt: new Date().toISOString()
      });
    } catch (err) {
      logger.error('ProductionService:startProduction', err);
      throw err;
    }
  }
};
