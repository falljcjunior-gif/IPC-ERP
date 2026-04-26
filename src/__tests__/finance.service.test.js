import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinanceService } from '../services/finance.service';
import { FirestoreService } from '../services/firestore.service';

// On utilise le setup global de mocks
import './setup';

// On mock explicitement le FirestoreService qui est utilisé par FinanceService
vi.mock('../services/firestore.service', () => ({
  FirestoreService: {
    createDocument: vi.fn(),
    updateDocument: vi.fn()
  }
}));

describe('FinanceService - Audit d\'Intégrité Comptable', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('test_3waymatch_success_quand_quantites_identiques', async () => {
    // ARRANGE: Tout est cohérent (10 cmd, 10 reçues, 10 facturées)
    const po = { id: 'PO-001', quantity: 10 };
    const grn = { id: 'GRN-001', quantity: 10 };
    const bill = { num: 'BILL-001', quantity: 10, amount: 1000 };

    vi.mocked(FirestoreService.createDocument).mockResolvedValue({ id: 'INV-123' });

    // ACT
    const result = await FinanceService.validateVendorInvoice(bill, po, grn);

    // ASSERT
    expect(result).toBeDefined();
    expect(FirestoreService.createDocument).toHaveBeenCalled();
  });

  it('test_3waymatch_echec_quand_surfacturation_detectee', async () => {
    // ARRANGE: La facture (12) dépasse la livraison (10)
    const po = { id: 'PO-001', quantity: 10 };
    const grn = { id: 'GRN-001', quantity: 10 };
    const bill = { num: 'BILL-FRAUD', quantity: 12, amount: 1200 };

    // ACT & ASSERT
    await expect(FinanceService.validateVendorInvoice(bill, po, grn))
      .rejects.toThrow(/Divergence détectée/);
    
    // Vérification qu'aucune facture n'a été créée en base
    expect(FirestoreService.createDocument).not.toHaveBeenCalled();
  });

  it('test_3waymatch_echec_quand_commande_non_honoree', async () => {
    // ARRANGE: On facture ce qu'on a reçu (8), mais la commande initiale était de 10
    const po = { id: 'PO-001', quantity: 10 };
    const grn = { id: 'GRN-001', quantity: 8 };
    const bill = { num: 'BILL-001', quantity: 8, amount: 800 };

    // ACT & ASSERT
    await expect(FinanceService.validateVendorInvoice(bill, po, grn))
      .rejects.toThrow();
  });

  it('test_creation_facture_rejette_montant_absurde', async () => {
    // ARRANGE: Tentative d'injection d'un montant négatif (si le schéma le bloque)
    const badInvoice = { num: 'INVALID', amount: -5000, type: 'client' };

    // ACT & ASSERT
    // Ici on teste que le service lance une erreur de validation (via le schéma)
    await expect(FinanceService.createInvoice(badInvoice))
      .rejects.toThrow();
  });

});
