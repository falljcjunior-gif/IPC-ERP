/**
 * ══════════════════════════════════════════════════════════════════
 * INVENTORY DOMAIN SERVICE
 * ══════════════════════════════════════════════════════════════════
 * 
 * WHY: Isolation de la logique complexe de gestion des stocks,
 * mouvements de stock et traçabilité.
 */

import { FirestoreService } from './firestore.service';
import logger from '../utils/logger';

export const InventoryService = {
  /**
   * Enregistre un mouvement de stock avec traçabilité.
   */
  async recordMovement(movementData) {
    const { productId, type, quantity, reason, referenceId } = movementData;
    
    try {
      // 1. Logique métier : Un mouvement sortant ne peut pas être négatif
      if (quantity <= 0) {
        throw new Error('La quantité doit être positive');
      }

      // 2. Préparation du mouvement
      const movement = {
        productId,
        type, // 'IN', 'OUT'
        quantity,
        reason,
        referenceId,
        timestamp: new Date().toISOString(),
        status: 'COMPLETED'
      };

      // 3. Persistance (La mise à jour du stock physique est gérée par Nexus Trigger via Cloud Functions)
      const doc = await FirestoreService.addDocument('stock_movements', movement);
      
      logger.info('Inventory', `Mouvement ${type} enregistré pour produit ${productId}`, doc.id);
      return { id: doc.id, ...movement };
    } catch (error) {
      logger.error('Inventory', 'Échec enregistrement mouvement', error);
      throw error;
    }
  },

  /**
   * Vérifie la disponibilité d'un produit.
   */
  async checkAvailability(productId, requestedQuantity) {
    try {
      const stock = await FirestoreService.getDocument('inventory', productId);
      if (!stock) return false;
      return stock.quantity >= requestedQuantity;
    } catch (error) {
      logger.error('Inventory', 'Échec vérification disponibilité', error);
      return false;
    }
  },

  /**
   * Effectue un inventaire physique (ajustement).
   */
  async performStockTake(productId, actualQuantity, reason) {
    try {
      const currentStock = await FirestoreService.getDocument('inventory', productId);
      const adjustment = actualQuantity - (currentStock?.quantity || 0);
      
      return await this.recordMovement({
        productId,
        type: adjustment >= 0 ? 'IN' : 'OUT',
        quantity: Math.abs(adjustment),
        reason: `Inventaire Physique: ${reason}`,
        referenceId: `STOCKTAKE_${Date.now()}`
      });
    } catch (error) {
      logger.error('Inventory', 'Échec inventaire physique', error);
      throw error;
    }
  }
};
