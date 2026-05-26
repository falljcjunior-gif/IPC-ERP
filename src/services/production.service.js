/**
 * ══════════════════════════════════════════════════════════════════
 * PRODUCTION DOMAIN SERVICE
 * ══════════════════════════════════════════════════════════════════
 * 
 * WHY: Gestion des ordres de fabrication, consommation de matières
 * premières et suivi de l'efficacité opérationnelle.
 */

import { FirestoreService } from './firestore.service';
import { InventoryService } from './inventory.service';
import logger from '../utils/logger';

/**
 * Vérifie que toutes les matières premières d'une nomenclature (BOM) sont disponibles
 * pour produire `quantity` unités du produit fini.
 *
 * Format attendu pour bom.composants : JSON.stringify([ { productId, quantiteParUnite }, ... ])
 * ou objet Array directement si déjà parsé.
 *
 * @returns {{ ok: boolean, manquants: Array<{ productId, requis, disponible? }> }}
 */
async function _verifierMatieresPremières(bom, quantity) {
  // Tenter de parser le champ composants (text → JSON ou déjà array)
  let composants = [];
  try {
    if (Array.isArray(bom.composants)) {
      composants = bom.composants;
    } else if (typeof bom.composants === 'string' && bom.composants.trim().startsWith('[')) {
      composants = JSON.parse(bom.composants);
    }
    // Si vide ou non structuré (texte libre), on passe — pas de blocage
  } catch {
    logger.warn('Production', 'BOM composants non parsable — vérification stock ignorée', bom.id);
    return { ok: true, manquants: [] };
  }

  if (!composants.length) return { ok: true, manquants: [] };

  const manquants = [];
  await Promise.all(
    composants.map(async ({ productId, quantiteParUnite = 1 }) => {
      const requis = quantiteParUnite * quantity;
      const disponible = await InventoryService.checkAvailability(productId, requis);
      if (!disponible) {
        manquants.push({ productId, requis });
      }
    })
  );

  return { ok: manquants.length === 0, manquants };
}

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

      // Vérification disponibilité matières premières via InventoryService
      if (recipesId) {
        const bom = await FirestoreService.getDocument('boms', recipesId);
        if (bom) {
          const { ok, manquants } = await _verifierMatieresPremières(bom, quantity);
          if (!ok) {
            const detail = manquants.map(m => `${m.productId} (${m.requis} requis)`).join(', ');
            throw new Error(`Stock insuffisant pour lancer l'OF. Matières manquantes : ${detail}`);
          }
          logger.info('Production', `Matières premières disponibles (BOM: ${recipesId})`);
        } else {
          logger.warn('Production', `BOM introuvable pour recipesId=${recipesId} — OF lancé sans vérification stock`);
        }
      }

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
