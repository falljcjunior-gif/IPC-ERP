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
  }),
  /**
   * MODELS FOR REGISTRY
   */
  models: {
    products: {
      label: 'Référentiel Articles',
      fields: {
        nom: { label: 'Désignation Commerciale', type: 'text', required: true, search: true, placeholder: 'Ex: Brique G-Block' },
        ref: { label: 'Code SKU / Réf.', type: 'text', required: true, search: true, placeholder: 'Ex: SK-BR-2024' },
        stock_reel: { label: 'Disponibilité Physique', type: 'number', required: true },
        unite: { label: 'Unité de Gestion', type: 'selection', options: ['Unités', 'Tonnes', 'm²', 'm³'], default: 'Unités' },
        categorie: { label: 'Catégorie', type: 'selection', options: ['Matières Premières', 'Produits Finis', 'Consommables'] }
      },
      views: {
        list: ['ref', 'nom', 'stock_reel', 'unite', 'categorie'],
        search: {
          filters: [
            { id: 'low_stock', label: 'Rupture de Stock', domain: [['stock_reel', '<=', 10]] }
          ],
          groups: [
            { id: 'categorie', label: 'Par Catégorie' }
          ]
        }
      }
    },
    movements: {
      label: 'Registre des Flux de Stock',
      fields: {
        date: { label: 'Date', type: 'date', required: true },
        produit: { label: 'Article Concerné', type: 'text', required: true, search: true, placeholder: 'Rechercher un article...' },
        quantite: { label: 'Quantité Mouvementée', type: 'number', required: true },
        type: { label: 'Type de Flux', type: 'selection', options: ['Entrée', 'Sortie', 'Ajustement'], default: 'Sortie' },
        reference: { label: 'Réf. Document Source', type: 'text', search: true, placeholder: 'Ex: BL-2024-001' }
      },
      views: {
        list: ['date', 'produit', 'quantite', 'type', 'reference'],
        search: {
          filters: [
            { id: 'in', label: 'Entrées', domain: [['type', '==', 'Entrée']] },
            { id: 'out', label: 'Sorties', domain: [['type', '==', 'Sortie']] }
          ],
          groups: [
            { id: 'produit', label: 'Par Article' },
            { id: 'type', label: 'Par Type' }
          ]
        }
      }
    }
  }
};

// [COMPAT] Alias pour compatibilité avec l'existant
export const inventorySchema = InventorySchemas;
