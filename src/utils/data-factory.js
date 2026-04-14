const generateLeads = () => [];
const generateProducts = () => [];
const generateSales = () => [];
const generateInvoices = () => [];

export const mockData = {
  // MASTER DATA (Core of the ERP)
  base: {
    contacts: [
      { id: 'C-001', nom: 'Cimentafric SA', email: 'contact@cimentafric.com', pays: 'Maroc', ville: 'Casablanca', type: 'Fournisseur', categories: 'Matières Premières' },
      { id: 'C-002', nom: 'GravierPro', email: 'achats@gravierpro.com', pays: 'Maroc', ville: 'Tanger', type: 'Fournisseur', categories: 'Matières Premières' }
    ],
    catalog: [],
    taxes: [
      { id: 'VAT-20', label: 'TVA 20%', rate: 0.20, default: true },
      { id: 'VAT-5.5', label: 'TVA 5.5%', rate: 0.055, default: false },
      { id: 'VAT-0', label: 'Exonéré', rate: 0.0, default: false }
    ],
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
    journals: [
      { id: 'J-VT', code: 'VT', label: 'Journal des Ventes', type: 'sales' },
      { id: 'J-AC', code: 'AC', label: 'Journal des Achats', type: 'purchase' },
      { id: 'J-BQ', code: 'BQ', label: 'Journal de Banque', type: 'cash' },
      { id: 'J-OD', code: 'OD', label: 'Opérations Diverses', type: 'general' }
    ],
    accounts: [
      // Classe 1: Capitaux
      { code: '101000', label: 'Capital social', type: 'equity', nature: 'Bilan' },
      { code: '120000', label: 'Résultat de l\'exercice (Bénéfice)', type: 'equity', nature: 'Bilan' },
      // Classe 2: Immobilisations
      { code: '211000', label: 'Terrains', type: 'asset', nature: 'Bilan' },
      { code: '218200', label: 'Matériel de transport', type: 'asset', nature: 'Bilan' },
      { code: '218300', label: 'Matériel de bureau et informatique', type: 'asset', nature: 'Bilan' },
      // Classe 3: Stocks
      { code: '311000', label: 'Stocks de marchandises', type: 'asset', nature: 'Bilan' },
      // Classe 4: Tiers
      { code: '401100', label: 'Fournisseurs d\'exploitation', type: 'liability', nature: 'Bilan' },
      { code: '411100', label: 'Clients - Ventes de marchandises', type: 'asset', nature: 'Bilan' },
      { code: '445660', label: 'TVA déductible sur ABS', type: 'asset', nature: 'Bilan' },
      { code: '445710', label: 'TVA collectée', type: 'liability', nature: 'Bilan' },
      // Classe 5: Trésorerie
      { code: '521100', label: 'Banque - Compte Principal', type: 'asset', nature: 'Bilan' },
      { code: '571100', label: 'Caisse Siège', type: 'asset', nature: 'Bilan' },
      // Classe 6: Charges
      { code: '601100', label: 'Achats de marchandises', type: 'expense', nature: 'Gestion' },
      { code: '611000', label: 'Sous-traitance générale', type: 'expense', nature: 'Gestion' },
      { code: '625000', label: 'Déplacements, missions et réceptions', type: 'expense', nature: 'Gestion' },
      { code: '641100', label: 'Salaires et appointements', type: 'expense', nature: 'Gestion' },
      // Classe 7: Produits
      { code: '701100', label: 'Ventes de marchandises', type: 'revenue', nature: 'Gestion' },
      { code: '706000', label: 'Prestations de services', type: 'revenue', nature: 'Gestion' }
    ],
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
    orders: []
  },
  projects: {
    projects: [],
    tasks: []
  },
  purchase: {
    orders: [
      { id: 'PO-001', num: 'CMD-ACH-2026-01', fournisseur: 'Cimentafric SA', produitId: 'MAT-CIMENT', qte: 50, date: '2026-04-10', echeance: '2026-04-15', total: 2500000, statut: 'Commandé' },
      { id: 'PO-002', num: 'CMD-ACH-2026-02', fournisseur: 'GravierPro', produitId: 'MAT-GRAVIER', qte: 200, date: '2026-04-12', echeance: '2026-04-14', total: 1200000, statut: 'Brouillon' }
    ]
  },
  marketing: {
    campaigns: []
  }
};
