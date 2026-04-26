/**
 * ══════════════════════════════════════════════════════════════════
 * PRODUCTION DOMAIN SERVICE
 * ══════════════════════════════════════════════════════════════════
 * 
 * WHY: Gestion des ordres de fabrication, consommation de matières
 * premières et suivi de l'efficacité opérationnelle.
 */

import { FirestoreService } from './firestore.service';
import logger from '../utils/logger';

export const ProductionService = {
  /**
   * Lance un nouvel ordre de fabrication (OF).
   */
  async startProductionOrder(orderData) {
    const { productId, quantity, recipesId } = orderData;
    
    try {
      const order = {
        productId,
        quantity,
        recipesId,
        status: 'IN_PROGRESS',
        startedAt: new Date().toISOString(),
        progress: 0
      };

      // TODO: Vérifier disponibilité matières premières via InventoryService
      
      const doc = await FirestoreService.addDocument('production_orders', order);
      logger.info('Production', 'Ordre de fabrication lancé', doc.id);
      return { id: doc.id, ...order };
    } catch (error) {
      logger.error('Production', 'Échec lancement OF', error);
      throw error;
    }
  },

  /**
   * Marque un OF comme terminé.
   * Déclenchera automatiquement la mise à jour des stocks via Cloud Function.
   */
  async completeProductionOrder(orderId, producedQuantity) {
    try {
      const update = {
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
        actualProduced: producedQuantity,
        progress: 100
      };

      await FirestoreService.updateDocument('production_orders', orderId, update);
      logger.info('Production', `OF ${orderId} terminé. Quantité: ${producedQuantity}`);
      return true;
    } catch (error) {
      logger.error('Production', `Échec clôture OF ${orderId}`, error);
      throw error;
    }
  },

  /**
   * Enregistre un incident de production ou une non-conformité.
   */
  async reportIncident(orderId, incident) {
    try {
      const report = {
        orderId,
        type: incident.type,
        description: incident.description,
        timestamp: new Date().toISOString(),
        severity: incident.severity // 'MINOR', 'MAJOR', 'CRITICAL'
      };

      await FirestoreService.addDocument('production_incidents', report);
      logger.warn('Production', 'Incident de production signalé', orderId);
      return true;
    } catch (error) {
      logger.error('Production', 'Échec signalement incident', error);
      throw error;
    }
  }
};
