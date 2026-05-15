const generateLeads = () => [];
const generateProducts = () => [];
const generateSales = () => [];
const generateInvoices = () => [];

export const mockData = {
  // MASTER DATA (Core of the ERP)
  base: {
    contacts: [],
    catalog: [],
    // [GO-LIVE] Taux de TVA vides — chaque client configure sa propre fiscalité
    // (France, OHADA, IFRS, etc.) depuis le module Settings.
    taxes: [],
    // Préfixes de numérotation — config TECHNIQUE (pas de la donnée métier).
    // Conservés pour garantir l'unicité des références dès le premier write.
    sequences: {
      sales_orders: { prefix: "CMD-", next: 1, padding: 3 },
      crm_leads: { prefix: "LEAD-", next: 1, padding: 4 },
      finance_invoices: { prefix: "FACT-", next: 1, padding: 2 },
      inventory_movements: { prefix: "MVT-", next: 1, padding: 3 }
    }
  },
  crm: {
    leads: [],
    opportunities: []
  },
  sales: {
    orders: []
  },
  inventory: {
    products: [],
    movements: []
  },
  finance: {
    invoices: [],
    treasury: [],
    // [GO-LIVE] Journaux comptables vides — chaque client crée ses propres
    // journaux selon son référentiel (Plan Comptable français, OHADA, IFRS, etc.).
    journals: [],
    // [GO-LIVE] Plan comptable vide — import à la charge du client via
    // le module Comptabilité (CSV / Excel).
    accounts: [],
    entries: [],
    lines: []
  },
  hr: {
    employees: [],
    leaves: [],
    expenses: []
  },
  production: {
    boms: [],
    workOrders: []
  },
  projects: {
    projects: [],
    tasks: []
  },
  purchase: {
    orders: []
  },
  marketing: {
    campaigns: [],
    posts: [],
    messages: []
  },
  dms: {
    // [GO-LIVE] Arborescence DMS construite à la demande depuis Storage.
    folders: [],
    files: []
  },
  legal: {
    contracts: [],
    ip: [],
    litigations: [],
    corporate: []
  },
  signature: {
    requests: [],
    templates: []
  },
  workflows: [],
  website: {
    // [GO-LIVE] Config vide — sera renseignée depuis le module Website.
    config: {},
    pages: [],
    chats: []
  },
  shipping: {
    shipments: [],
    carriers: [],
    fleet: []
  }
};
