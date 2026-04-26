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
  })
};

// [COMPAT] Alias pour compatibilité avec l'existant
export const salesSchema = SalesSchemas;
