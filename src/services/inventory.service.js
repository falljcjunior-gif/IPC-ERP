/**
 * ══════════════════════════════════════════════════════════════════
 * INVENTORY DOMAIN SERVICE
 * ══════════════════════════════════════════════════════════════════
 */

import { FirestoreService } from './firestore.service';
import { InventorySchemas } from '../schemas/inventory.schema';
import logger from '../utils/logger';

export const InventoryService = {
  
  /**
   * Enregistre un mouvement de stock avec mise à jour atomique du produit.
   */
  async registerMovement(data) {
    try {
      const validated = InventorySchemas.movement(data);
      
      // Workflow : Mouvement -> Update Stock Produit
      const productId = validated.productId;
      const product = await FirestoreService.getDocument('inventory_products', productId);
      
      if (!product) throw new Error('Produit introuvable');

      const delta = validated.type === 'in' ? validated.quantity : -validated.quantity;
      const newStock = product.stockActuel + delta;

      if (newStock < 0) throw new Error('Stock insuffisant pour cette opération');

      // Mise à jour atomique simulée via batch (dans un cas réel on utiliserait transaction)
      const operations = [
         { op: 'set', collection: 'inventory_movements', id: `MOV-${Date.now()}`, data: validated },
         { op: 'update', collection: 'inventory_products', id: productId, data: { stockActuel: newStock } }
      ];

      await FirestoreService.batchWrite(operations);
      return true;
    } catch (err) {
      logger.error('InventoryService:registerMovement', err);
      throw err;
    }
  }
};
