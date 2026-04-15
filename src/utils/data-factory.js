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
    products: [
      { id: 'MAT-CIMENT', num: 'MAT-CIMENT', designation: 'Ciment 42.5 Portland', categorie: 'Matières Premières', unite: 'Tonne', qteStock: 4, seuilAlerte: 10, prixUnitaire: 85000 },
      { id: 'MAT-GRAVIER', num: 'MAT-GRAVIER', designation: 'Gravier 5/15', categorie: 'Matières Premières', unite: 'Tonne', qteStock: 85, seuilAlerte: 20, prixUnitaire: 8000 },
      { id: 'MAT-SABLE', num: 'MAT-SABLE', designation: 'Sable de carrière', categorie: 'Matières Premières', unite: 'M3', qteStock: 120, seuilAlerte: 30, prixUnitaire: 12000 },
      { id: 'MAT-ACIER', num: 'MAT-ACIER', designation: 'Acier HA 12mm', categorie: 'Matières Premières', unite: 'Tonne', qteStock: 2.5, seuilAlerte: 5, prixUnitaire: 450000 },
      { id: 'PF-BLOC15', num: 'PF-BLOC15', designation: 'Bloc Béton 15cm', categorie: 'Produits Finis', unite: 'Pièce', qteStock: 5200, seuilAlerte: 1000, prixUnitaire: 1500 },
      { id: 'PF-DALLE', num: 'PF-DALLE', designation: 'Dalle Préfabriquée 50x50', categorie: 'Produits Finis', unite: 'M2', qteStock: 320, seuilAlerte: 100, prixUnitaire: 18000 }
    ],
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
    employees: [
      { id: 'EMP-001', num: 'EMP-001', nom: 'Jean Dupont', poste: 'Ingénieur Production', dept: 'Production', email: 'j.dupont@ipc.com', salaire: 1200000, active: true, createdAt: '2026-01-10T10:00:00.000Z' },
      { id: 'EMP-002', num: 'EMP-002', nom: 'Aminata Touré', poste: 'Directrice Financière', dept: 'Finance', email: 'a.toure@ipc.com', salaire: 2500000, active: true, createdAt: '2025-11-05T09:30:00.000Z' },
      { id: 'EMP-003', num: 'EMP-003', nom: 'Marc Koffi', poste: 'Commercial B2B', dept: 'Ventes', email: 'm.koffi@ipc.com', salaire: 850000, active: true, createdAt: '2026-02-15T14:20:00.000Z' }
    ],
    leaves: [],
    expenses: []
  },
  production: {
    boms: [
      {
        id: 'BOM-001', num: 'BOM-001', produit: 'Bloc Béton 15cm', produitId: 'PF-BLOC15', coutEstime: 950,
        composants: [
          { articleId: 'MAT-CIMENT', article: 'Ciment 42.5 Portland', qte: 0.012, unite: 'Tonne' },
          { articleId: 'MAT-GRAVIER', article: 'Gravier 5/15', qte: 0.025, unite: 'Tonne' },
          { articleId: 'MAT-SABLE', article: 'Sable de carrière', qte: 0.030, unite: 'M3' }
        ]
      },
      {
        id: 'BOM-002', num: 'BOM-002', produit: 'Dalle Préfabriquée 50x50', produitId: 'PF-DALLE', coutEstime: 14500,
        composants: [
          { articleId: 'MAT-CIMENT', article: 'Ciment 42.5 Portland', qte: 0.08, unite: 'Tonne' },
          { articleId: 'MAT-SABLE', article: 'Sable de carrière', qte: 0.05, unite: 'M3' },
          { articleId: 'MAT-ACIER', article: 'Acier HA 12mm', qte: 0.015, unite: 'Tonne' }
        ]
      }
    ],
    workOrders: [
      { id: 'OF-2026-041', num: 'OF-2026-041', produit: 'Bloc Béton 15cm', produitId: 'PF-BLOC15', bomId: 'BOM-001', qte: 5000, echeance: '2026-04-20', statut: 'En cours', priority: 'Haute', progression: 65 },
      { id: 'OF-2026-042', num: 'OF-2026-042', produit: 'Dalle Préfabriquée 50x50', produitId: 'PF-DALLE', bomId: 'BOM-002', qte: 200, echeance: '2026-04-25', statut: 'Planifié', priority: 'Normale', progression: 0 },
      { id: 'OF-2026-043', num: 'OF-2026-043', produit: 'Bloc Béton 15cm', produitId: 'PF-BLOC15', bomId: 'BOM-001', qte: 10000, echeance: '2026-05-10', statut: 'Planifié', priority: 'Urgente', progression: 0 }
    ]
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
    campaigns: [
      { id: 'CAM-001', num: 'CAM-001', nom: 'Lancement Bloc Béton Q2', objectif: 'Notoriété', canal: 'Facebook', budget: 500000, depense: 342000, reach: 84200, clics: 3120, conversions: 48, statut: 'Active', dateDebut: '2026-04-01', dateFin: '2026-04-30' },
      { id: 'CAM-002', num: 'CAM-002', nom: 'Promo Dalle Préfabriquée', objectif: 'Conversion', canal: 'Instagram', budget: 300000, depense: 300000, reach: 52400, clics: 2890, conversions: 61, statut: 'Terminée', dateDebut: '2026-03-15', dateFin: '2026-03-31' },
      { id: 'CAM-003', num: 'CAM-003', nom: 'B2B Construction Partners', objectif: 'Génération de leads', canal: 'LinkedIn', budget: 750000, depense: 125000, reach: 18600, clics: 945, conversions: 12, statut: 'Active', dateDebut: '2026-04-10', dateFin: '2026-05-10' }
    ],
    posts: [
      { id: 'POST-001', titre: 'Nouveaux Blocs Béton', contenu: 'Découvrez notre nouvelle gamme de blocs haute résistance !', plateforme: 'Facebook', statut: 'Publié', date_publication: '2026-04-12T10:00', likes: 142, partages: 34 },
      { id: 'POST-002', titre: 'Chantier Référence Abidjan', contenu: 'Fiers d\'avoir contribué au chantier de la résidence Les Palmiers à Abidjan', plateforme: 'Instagram', statut: 'Publié', date_publication: '2026-04-14T18:00', likes: 289, partages: 61 },
      { id: 'POST-003', titre: 'Offre Partenaires BTP', contenu: 'Vous êtes entrepreneur BTP ? Contactez-nous pour des tarifs préférentiels', plateforme: 'LinkedIn', statut: 'Programmé', date_publication: '2026-04-20T09:00', likes: 0, partages: 0 },
      { id: 'POST-004', titre: 'Promo Fin de Mois', contenu: '-15% sur toutes les dalles en stock. Offre limitée !', plateforme: 'Facebook', statut: 'Brouillon', date_publication: '2026-04-28T12:00', likes: 0, partages: 0 }
    ],
    messages: [
      { id: 'm1', sender: 'Moussa Diakité', source: 'WhatsApp', content: 'Bonjour, je souhaite un devis pour 50 blocs.', statut: 'Nouveau', time: '10:15' },
      { id: 'm2', sender: 'Sarah Kone', source: 'Facebook', content: 'Quels sont vos tarifs pour la livraison à Yamoussoukro ?', statut: 'Répondu', time: '09:30' },
      { id: 'm3', sender: 'BTP International', source: 'LinkedIn', content: 'Nous serions intéressés par un partenariat long terme.', statut: 'Nouveau', time: 'Aujourd\'hui' }
    ]
  },
  dms: {
    folders: [
      { name: 'Racine', count: 0, size: '0 KB', type: 'system' },
      { name: 'Paies', count: 0, size: '0 KB', type: 'system' }
    ],
    files: []
  }
};
