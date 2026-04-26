import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InventoryService } from '../services/inventory.service';
import { FirestoreService } from '../services/firestore.service';

// Mock radical des dépendances
vi.mock('../services/firestore.service');
vi.mock('../utils/logger');

describe('InventoryService - SDET Paranoid Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recordMovement()', () => {
    it('doit rejeter un mouvement avec une quantité négative (Protection Intégrité)', async () => {
      const movement = {
        productId: 'prod_123',
        type: 'OUT',
        quantity: -10,
        reason: 'Test Erreur'
      };

      await expect(InventoryService.recordMovement(movement))
        .rejects.toThrow('La quantité doit être positive');
      
      expect(FirestoreService.addDocument).not.toHaveBeenCalled();
    });

    it('doit enregistrer un mouvement valide et retourner le document complet', async () => {
      const movementData = {
        productId: 'prod_123',
        type: 'IN',
        quantity: 50,
        reason: 'Livraison fournisseur',
        referenceId: 'PO_456'
      };

      vi.mocked(FirestoreService.addDocument).mockResolvedValue({ id: 'mov_999' });

      const result = await InventoryService.recordMovement(movementData);

      expect(result.id).toBe('mov_999');
      expect(result.quantity).toBe(50);
      expect(result.status).toBe('COMPLETED');
      expect(FirestoreService.addDocument).toHaveBeenCalledWith('stock_movements', expect.objectContaining({
        productId: 'prod_123',
        type: 'IN'
      }));
    });
  });

  describe('checkAvailability()', () => {
    it('doit retourner false si le stock est insuffisant', async () => {
      vi.mocked(FirestoreService.getDocument).mockResolvedValue({ quantity: 5 });

      const available = await InventoryService.checkAvailability('prod_123', 10);
      expect(available).toBe(false);
    });

    it('doit retourner true si le stock est exactement égal à la demande', async () => {
      vi.mocked(FirestoreService.getDocument).mockResolvedValue({ quantity: 10 });

      const available = await InventoryService.checkAvailability('prod_123', 10);
      expect(available).toBe(true);
    });

    it('doit retourner false si le produit n\'existe pas (Null Safety)', async () => {
      vi.mocked(FirestoreService.getDocument).mockResolvedValue(null);

      const available = await InventoryService.checkAvailability('unknown', 1);
      expect(available).toBe(false);
    });
  });
});
