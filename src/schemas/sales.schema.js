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
  quote: (data, tvaRate = 18) => ({
    num: data.num || `QT-${Date.now()}`,
    client: data.client || '',
    items: data.items || [],
    totalHT: data.totalHT || 0,
    tva: tvaRate,
    totalTTC: (data.totalHT || 0) * (1 + tvaRate / 100),
    valideJusquau: data.valideJusquau || '',
    statut: 'en_attente', // en_attente | accepté | refusé | expiré
    _domain: 'sales'
  }),
  /**
   * BACKWARD COMPATIBILITY & REGISTRY MODELS
   */
  models: {
    invoices: {
      label: 'Factures Clients',
      fields: {
        client: { label: 'Client', type: 'text', required: true, search: true, placeholder: 'Nom du client...' },
        date: { label: 'Date d\'Émission', type: 'date', required: true },
        dateEcheance: { label: 'Date d\'Échéance', type: 'date' },
        montant: { label: 'Montant Total TTC', type: 'money', currency: 'FCFA', search: true },
        statut: { label: 'Statut', type: 'selection', options: ['Brouillon', 'Envoyé', 'Payé', 'En attente', 'En retard', 'Annulé'], default: 'Brouillon' }
      }
    },
    quotes: {
      label: 'Devis & Propositions',
      fields: {
        client: { label: 'Client', type: 'text', required: true, search: true, placeholder: 'Nom du prospect/client...' },
        date: { label: 'Date de Création', type: 'date', required: true },
        valideJusquau: { label: 'Valable jusqu\'au', type: 'date' },
        pricingModel: { label: 'Modèle de Tarification', type: 'selection', options: ['Standard', 'Volume Discount (Matériaux)', 'Fixed Premium (Luxe)'], default: 'Standard' },
        montantHT: { label: 'Montant Total HT', type: 'money', currency: 'FCFA', search: true },
        discountRate: { label: 'Remise Globale (%)', type: 'number', default: 0 },
        discountApproval: { label: 'Validation Remise', type: 'selection', options: ['Non Requise', 'En Attente (Directeur)', 'Approuvée (Directeur)', 'Refusée'], default: 'Non Requise', readonly: true },
        approvedBy: { label: 'Approuvé Par', type: 'text', readonly: true },
        montantTTC: { label: 'Montant Total TTC', type: 'money', currency: 'FCFA', search: true },
        statut: { label: 'Statut', type: 'selection', options: ['Brouillon', 'En Révision', 'Envoyé', 'Accepté', 'Refusé', 'Expiré'], default: 'Brouillon' }
      }
    },
    orders: {
      label: 'Commandes & Contrats Vente',
      fields: {
        client: { label: 'Tiers Partenaire', type: 'text', required: true, search: true, placeholder: 'Sélectionner le client...' },
        date: { label: 'Date de la Transaction', type: 'date', required: true },
        quoteRef: { label: 'Référence Devis', type: 'text', readonly: true },
        montant: { label: 'Valeur Totale HT', type: 'money', currency: 'FCFA', search: true },
        statut: { label: 'État de la Commande', type: 'selection', options: ['Brouillon', 'Confirmé', 'En Préparation', 'Expédié', 'Facturé', 'Payé', 'Annulé'], default: 'Brouillon' },
        items: { label: 'Articles', type: 'json' }
      },
      views: {
        list: ['client', 'date', 'montant', 'statut'],
        search: {
          filters: [
            { id: 'confirmed', label: 'Confirmées', domain: [['statut', '==', 'Confirmé']] },
            { id: 'to_ship', label: 'À expédier', domain: [['statut', '==', 'En Préparation']] },
            { id: 'to_invoice', label: 'À facturer', domain: [['statut', '==', 'Expédié']] }
          ],
          groups: [
            { id: 'statut', label: 'Par Statut' },
            { id: 'client', label: 'Par Client' }
          ]
        }
      }
    },
    products: {
      label: 'Catalogue Articles & Services',
      fields: {
        nom: { label: 'Désignation Commerciale', type: 'text', required: true, search: true, placeholder: 'Ex: Brique G-Block 20x20' },
        ref: { label: 'Référence Catalogue', type: 'text', required: true, search: true, placeholder: 'Ex: GB-2020-01' },
        prix: { label: 'Tarif Unitaire HT', type: 'money', currency: 'FCFA' },
        stock_reel: { label: 'Disponibilité Réelle', type: 'number' },
        categorie: { label: 'Famille d\'Articles', type: 'selection', options: ['Briques', 'Pavets', 'Bordures', 'Autre'] }
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
