/**
 * ══════════════════════════════════════════════════════════════════
 * SALES & CRM DOMAIN SCHEMAS
 * ══════════════════════════════════════════════════════════════════
 */

export const SalesSchemas = {
  
  /**
   * LEAD / CLIENT
   */
  lead: (data) => ({
    nom: data.nom || '',
    entreprise: data.entreprise || '',
    email: data.email || '',
    tel: data.tel || '',
    source: data.source || 'direct', 
    statut: data.statut || 'prospect', // prospect | qualifié | client | perdu
    score: Number(data.score) || 0,
    history: [],
    _domain: 'sales'
  }),

  /**
   * QUOTE (Devis)
   */
  quote: (data) => ({
    num: data.num || `DEV-${Date.now()}`,
    clientId: data.clientId || '',
    items: data.items || [],
    totalHT: Number(data.totalHT) || 0,
    remise: Number(data.remise) || 0,
    valideJusquau: data.valideJusquau || '',
    statut: 'en_attente', // en_attente | accepté | refusé | expiré
    _domain: 'sales'
  })
};
