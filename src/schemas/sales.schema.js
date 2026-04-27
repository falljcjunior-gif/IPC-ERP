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
      label: 'Commandes Client',
      fields: {
        client: { label: 'Client', type: 'text', required: true, search: true },
        date: { label: 'Date', type: 'date', required: true },
        montant: { label: 'Montant Total', type: 'money', currency: 'FCFA', search: true },
        statut: { label: 'Statut', type: 'selection', options: ['Brouillon', 'Confirmé', 'Expédié', 'Payé', 'Annulé'], default: 'Brouillon' },
        items: { label: 'Articles', type: 'json' }
      },
      views: {
        list: ['client', 'date', 'montant', 'statut'],
        search: {
          filters: [
            { id: 'confirmed', label: 'Confirmées', domain: [['statut', '==', 'Confirmé']] },
            { id: 'to_ship', label: 'À expédier', domain: [['statut', '==', 'Confirmé']] }
          ],
          groups: [
            { id: 'statut', label: 'Par Statut' },
            { id: 'client', label: 'Par Client' }
          ]
        }
      }
    },
    products: {
      label: 'Produits',
      fields: {
        nom: { label: 'Nom du Produit', type: 'text', required: true, search: true },
        ref: { label: 'Référence', type: 'text', required: true, search: true },
        prix: { label: 'Prix de Vente', type: 'money', currency: 'FCFA' },
        stock: { label: 'Stock Physique', type: 'number' },
        categorie: { label: 'Catégorie', type: 'selection', options: ['Briques', 'Pavets', 'Bordures', 'Autre'] }
      },
      views: {
        list: ['ref', 'nom', 'prix', 'stock', 'categorie'],
        search: {
          filters: [
            { id: 'low_stock', label: 'Stock Faible', domain: [['stock', '<', 100]] }
          ],
          groups: [
            { id: 'categorie', label: 'Par Catégorie' }
          ]
        }
      }
    }
  }
};

// [COMPAT] Alias pour compatibilité avec l'existant
export const salesSchema = SalesSchemas;
