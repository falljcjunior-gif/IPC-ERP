/**
 * ══════════════════════════════════════════════════════════════════
 * INVENTORY & PRODUCTION SCHEMAS
 * ══════════════════════════════════════════════════════════════════
 */

export const InventorySchemas = {
  
  /**
   * PRODUCT (Briques, Plastique, etc.)
   */
  product: (data) => ({
    sku: data.sku || `PROD-${Date.now()}`,
    label: data.label || '',
    type: data.type || 'finis', // matieres_premieres | finis | semi_finis
    category: data.category || 'standard',
    stockActuel: Number(data.stockActuel) || 0,
    stockAlerte: Number(data.stockAlerte) || 50,
    unite: data.unite || 'unité',
    prixUnitaire: Number(data.prixUnitaire) || 0,
    _domain: 'inventory'
  }),

  /**
   * STOCK MOVEMENT
   */
  movement: (data) => ({
    productId: data.productId || '',
    type: data.type || 'in', // in | out | adjustment
    quantity: Number(data.quantity) || 0,
    reason: data.reason || 'Saisie manuelle',
    source: data.source || 'warehouse_default',
    _domain: 'inventory',
    _timestamp: new Date().toISOString()
  })
};
