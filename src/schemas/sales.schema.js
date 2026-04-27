/**
 * ══════════════════════════════════════════════════════════════════
 * SALES DOMAIN SCHEMAS
 * ══════════════════════════════════════════════════════════════════
 */
export const SalesSchemas = {
  
  /**
   * LEAD / PROSPECT
   */
  lead: (data) => ({
    nom: data.nom || '',
    entreprise: data.entreprise || '',
    email: data.email || '',
    telephone: data.telephone || '',
    source: data.source || 'direct',
    statut: data.statut || 'nouveau', // nouveau | qualifié | proposition | gagné | perdu
    priorite: data.priorite || 'moyenne',
    observations: data.observations || '',
    _domain: 'sales'
  }),

  /**
   * QUOTE / DEVIS
   */
  quote: (data) => ({
    num: data.num || `QT-${Date.now()}`,
    client: data.client || '',
    items: data.items || [],
    totalHT: data.totalHT || 0,
    tva: data.tva || 18,
    totalTTC: (data.totalHT || 0) * 1.18,
    valideJusquau: data.valideJusquau || '',
    statut: 'en_attente', // en_attente | accepté | refusé | expiré
    _domain: 'sales'
  }),
  /**
   * BACKWARD COMPATIBILITY & REGISTRY MODELS
   */
  models: {
    orders: {
      fields: {
        client: { label: 'Client', type: 'text', required: true },
        montant: { label: 'Montant Total', type: 'number', required: true },
        date: { label: 'Date Commande', type: 'date', required: true },
        statut: { label: 'Statut', type: 'select', options: ['En cours', 'Livré', 'Annulé'], default: 'En cours' }
      }
    },
    products: {
      fields: {
        nom: { label: 'Nom du Produit', type: 'text', required: true },
        categorie: { label: 'Catégorie', type: 'text', required: true },
        prix: { label: 'Prix Unitaire', type: 'number', required: true },
        stock: { label: 'Stock Initial', type: 'number', default: 0 }
      }
    }
  }
};

// [COMPAT] Alias pour compatibilité avec l'existant
export const salesSchema = SalesSchemas;
