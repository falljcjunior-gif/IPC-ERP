const generateLeads = () => [
  { id: 1, prenom: "Jean", nom: "Dupont", entreprise: "TechnoFrance", email: "j.dupont@techno.fr", source: "Site Web", statut: "Nouveau", valeur: 5000000 },
  { id: 2, prenom: "Sarah", nom: "Miller", entreprise: "GlobalConnect", email: "sarah@global.com", source: "Conférence", statut: "En cours", valeur: 12000000 },
  { id: 3, prenom: "Pierre", nom: "Lemaire", entreprise: "ImmoLux", email: "p.lemaire@immolux.lu", source: "Appel entrant", statut: "Assigné", valeur: 8500000 },
  { id: 4, prenom: "Elena", nom: "Petrova", entreprise: "EuroVision Tech", email: "elena@eurov.ru", source: "E-mail", statut: "Terminé", valeur: 15000000 },
  { id: 5, prenom: "Marc", nom: "Dubois", entreprise: "EcoLogic", email: "m.dubois@eco.fr", source: "Partenaire", statut: "Nouveau", valeur: 3000000 }
];

const generateProducts = () => [
  { id: 101, code: "PROD-001", nom: "Module ERP Cloud", type: "Service", categorie: "Software", prixMoyen: 1200 },
  { id: 102, code: "HW-45", nom: "Serveur Pro GenX", type: "Bien", categorie: "Matériel", prixMoyen: 4500 },
  { id: 103, code: "TRAIN-AI", nom: "Formation IA Générative", type: "Service", categorie: "Formation", prixMoyen: 800 },
  { id: 104, code: "LIC-CRM", nom: "Licence CRM Annuelle", type: "Service", categorie: "Software", prixMoyen: 350 },
  { id: 105, code: "SUPPORT-GOLD", nom: "Support Premium 24/7", type: "Service", categorie: "Support", prixMoyen: 2000 }
];

const generateSales = () => [
  { id: 1, num: "CMD-2026-001", client: "TechnoFrance", date: "2026-04-01", devise: "EUR", totalHT: 4500000, totalTTC: 5400000, statut: "Confirmé" },
  { id: 2, num: "CMD-2026-002", client: "GlobalConnect", date: "2026-04-05", devise: "USD", totalHT: 18000000, totalTTC: 21600000, statut: "Brouillon" },
  { id: 3, num: "CMD-2026-003", client: "EcoLogic", date: "2026-04-08", devise: "EUR", totalHT: 1200000, totalTTC: 1440000, statut: "Confirmé" }
];

const generateInvoices = () => [
  { id: 1, num: "FACT-2026-01", client: "TechnoFrance", echeance: "2026-05-01", montant: 5400, statut: "Payé" },
  { id: 2, num: "FACT-2026-02", client: "EuroVision Tech", echeance: "2026-05-10", montant: 18000, statut: "En attente" }
];

export const mockData = {
  // MASTER DATA (Core of the ERP)
  base: {
    contacts: [
      { id: 'C1', nom: "Jean Dupont", ref: "PART-1001", email: "j.dupont@techno.fr", tel: "+33 1 23 45 67 89", type: "Client", tags: ["TechnoFrance"] },
      { id: 'C2', nom: "Sarah Miller", ref: "PART-1002", email: "sarah@global.com", tel: "+1 555 0199", type: "Client", tags: ["GlobalConnect"] },
      { id: 'C3', nom: "Intel Europe", ref: "PART-2001", email: "contact@intel.eu", tel: "+49 123 456", type: "Fournisseur", tags: ["Matériel"] },
      { id: 'C4', nom: "Amazon Web Services", ref: "PART-2002", email: "billing@aws.com", tel: "+1 800 234", type: "Fournisseur", tags: ["Cloud"] },
      { id: 'C5', prenom: "Marc", nom: "Dubois", email: "m.dubois@eco.fr", type: "Prospect", tags: ["EcoLogic"] }
    ],
    catalog: [
      { id: 'P1', code: "PROD-001", nom: "Module ERP Cloud", type: "Service", categorie: "Software", prixMoyen: 1200, unit: "Licence" },
      { id: 'P2', code: "HW-45", nom: "Serveur Pro GenX", type: "Bien", categorie: "Matériel", prixMoyen: 4500, unit: "Unité" },
      { id: 'P3', code: "TRAIN-AI", nom: "Formation IA Générative", type: "Service", categorie: "Formation", prixMoyen: 800, unit: "Jour" },
      { id: 'P4', code: "LIC-CRM", nom: "Licence CRM Annuelle", type: "Service", categorie: "Software", prixMoyen: 350, unit: "Licence" },
      { id: 'P5', code: "SUPPORT-GOLD", nom: "Support Premium 24/7", type: "Service", categorie: "Support", prixMoyen: 2000, unit: "Forfait" }
    ],
    taxes: [
      { id: 'VAT-20', label: 'TVA 20%', rate: 0.20, default: true },
      { id: 'VAT-5.5', label: 'TVA 5.5%', rate: 0.055, default: false },
      { id: 'VAT-0', label: 'Exonéré', rate: 0.0, default: false }
    ],
    sequences: {
      sales_orders: { prefix: "CMD-", next: 4, padding: 3 },
      crm_leads: { prefix: "LEAD-", next: 6, padding: 4 },
      finance_invoices: { prefix: "FACT-", next: 3, padding: 2 },
      inventory_movements: { prefix: "MVT-", next: 3, padding: 3 }
    }
  },
  crm: {
    leads: generateLeads(),
    opportunities: [
      { id: 1, titre: "Expertise ERP", client: "GlobalConnect", montant: 25000000, probabilite: 75, etape: "Négociation", dateCloture: "2026-06-15" },
      { id: 2, titre: "Migration Cloud", client: "TechnoFrance", montant: 120000000, probabilite: 40, etape: "Proposition", dateCloture: "2026-05-30" }
    ]
  },
  sales: {
    orders: generateSales()
  },
  inventory: {
    products: generateProducts(),
    movements: [
      { id: 1, num: "MVT-001", produit: "Serveur Pro GenX", date: "2026-04-05", type: "Réception", qte: 50, ref: "BL-2026-01" },
      { id: 2, num: "MVT-002", produit: "Module ERP Cloud", date: "2026-04-08", type: "Expédition", qte: -5, ref: "BL-2026-05" }
    ]
  },
  finance: {
    invoices: generateInvoices(),
    treasury: [
      { id: 1, libelle: "Paiement Facture 01", montant: 5400, date: "2026-04-10", type: "Encaissement" },
      { id: 2, libelle: "Achat Matériel", montant: -2500, date: "2026-04-12", type: "Décaissement" }
    ]
  },
  hr: {
    employees: [
      { id: 1, nom: "Jean Dupont", poste: "Directeur Technique", dept: "IT", manager: "Lui-même", dateEntree: "2022-01-01", avatar: "JD" },
      { id: 2, nom: "Sarah Miller", poste: "Sales Manager", dept: "Ventes", manager: "Jean Dupont", dateEntree: "2023-05-15", avatar: "SM" },
      { id: 3, nom: "Marie Lefebvre", poste: "RH Specialist", dept: "RH", manager: "Jean Dupont", dateEntree: "2024-02-10", avatar: "ML" },
      { id: 4, nom: "Paul Brunet", poste: "Développeur FullStack", dept: "IT", manager: "Jean Dupont", dateEntree: "2024-06-01", avatar: "PB" }
    ],
    leaves: [
      { id: 1, employe: "Jean Dupont", type: "Congés Payés", du: "2026-07-01", au: "2026-07-15", statut: "Validé" },
      { id: 2, employe: "Sarah Miller", type: "Maladie", du: "2026-04-10", au: "2026-04-12", statut: "En attente" }
    ],
    expenses: [
      { id: 1, employe: "Jean Dupont", objet: "Déplacement Paris", montant: 450, date: "2026-04-05", statut: "Approuvé" },
      { id: 2, employe: "Sarah Miller", objet: "Déjeuner Client", montant: 85, date: "2026-04-08", statut: "En attente" }
    ]
  },
  production: {
    boms: [
      { id: 1, produit: "Serveur Pro GenX", composants: ["CPU Intel", "RAM 64GB", "Châssis Alu", "Alim 850W"], coutEstime: 3200 },
      { id: 2, produit: "Module ERP Cloud", composants: ["Infrastructure AWS", "Base de données", "Licence Sécurité"], coutEstime: 450 }
    ],
    orders: [
      { id: 1, num: "OF-2026-001", produit: "Serveur Pro GenX", qte: 10, echeance: "2026-05-15", statut: "En cours", progression: 65 },
      { id: 2, num: "OF-2026-002", produit: "Serveur Pro GenX", qte: 5, echeance: "2026-05-20", statut: "Planifié", progression: 0 }
    ]
  },
  projects: {
    projects: [
      { id: 1, nom: "IPC ERP v2.0", client: "Interne", budget: "500M FCFA", debut: "2026-01-01", fin: "2026-12-31", statut: "En cours" },
      { id: 2, nom: "Migration Cloud Partner", client: "GlobalConnect", budget: "1.2Md FCFA", debut: "2026-03-15", fin: "2026-06-30", statut: "Démarrage" }
    ],
    tasks: [
      { 
        id: 1, 
        titre: "Interface Dashboard", 
        projet: "IPC ERP v2.0", 
        assigne: "Jean Dupont", 
        equipe: "IT",
        priorite: "Haute", 
        statut: "En cours",
        checklists: [
          { id: 101, label: "Design System", completed: true },
          { id: 102, label: "Composants Charts", completed: true },
          { id: 103, label: "Optimisation Mobile", completed: false }
        ]
      },
      { 
        id: 2, 
        titre: "Module Production", 
        projet: "IPC ERP v2.0", 
        assigne: "Paul Brunet", 
        equipe: "Production",
        priorite: "Moyenne", 
        statut: "À faire",
        checklists: [
          { id: 201, label: "Spécifications techniques", completed: true },
          { id: 202, label: "Base de données", completed: false }
        ]
      },
      { 
        id: 3, 
        titre: "Audit Sécurité Cloud", 
        projet: "Migration Cloud Partner", 
        assigne: "Sarah Miller", 
        equipe: "IT",
        priorite: "Haute", 
        statut: "Terminé",
        checklists: [
          { id: 301, label: "Audit Firewall", completed: true },
          { id: 302, label: "Gestion accès S3", completed: true }
        ]
      }
    ]
  },
  purchase: {
    orders: [
      { id: 1, num: "ACH-2026-001", fournisseur: "Intel Europe", date: "2026-04-02", total: 15600, statut: "Réceptionné" },
      { id: 2, num: "ACH-2026-002", fournisseur: "Amazon Web Services", date: "2026-04-05", total: 2400, statut: "Commandé" }
    ]
  },
  marketing: {
    campaigns: [
      { id: 1, nom: "Lancement IPC ERP v2", type: "Emailing", debut: "2026-05-01", budget: 5000, revenu: 25000, statut: "Planifié", vues: 15000, clics: 3200, roi: 5 },
      { id: 2, nom: "Webinar IA & ERP", type: "Événement", debut: "2026-04-15", budget: 1200, revenu: 8500, statut: "En cours", vues: 8500, clics: 1100, roi: 7 }
    ]
  }
};
