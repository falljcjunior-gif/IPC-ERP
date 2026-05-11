/**
 * ══════════════════════════════════════════════════════════════════
 * FOUNDATION DOMAIN SCHEMAS — IPC Collect Foundation
 * ══════════════════════════════════════════════════════════════════
 *
 * ARCHITECTURE : Independent Subsidiary (Filiale Indépendante)
 *
 * Collections Firestore strictement isolées du Groupe IPC Green Blocks :
 *   - foundation_finance      (dons, décaissements, livre journal)
 *   - foundation_employees    (RH détachés, contrats, paie, congés)
 *   - foundation_collecteurs  (agents terrain, cartes de collecte)
 *   - foundation_centres      (centres de tri, capacités, stocks)
 *   - foundation_collectes    (tracking plastique par type/statut)
 *   - foundation_expenses     (notes de frais, workflow approbation)
 *
 * RBAC requis : FOUNDATION_ADMIN | FOUNDATION_STAFF | SUPER_ADMIN | ADMIN
 */

// ── Validation helpers ─────────────────────────────────────────────
const requirePositive = (val, field) => {
  const num = Number(val);
  if (isNaN(num) || num < 0) {
    throw new Error(`[FoundationSchema] Le champ '${field}' doit être un nombre ≥ 0.`);
  }
  return num;
};

const requireString = (val, field) => {
  if (!val || typeof val !== 'string' || !val.trim()) {
    throw new Error(`[FoundationSchema] Le champ '${field}' est obligatoire.`);
  }
  return val.trim();
};

const requireDate = (val, field) => {
  const d = val ? new Date(val) : null;
  if (!d || isNaN(d.getTime())) {
    throw new Error(`[FoundationSchema] Le champ '${field}' doit être une date valide.`);
  }
  return d.toISOString();
};

const generateId = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase()}`;

// ── FOUNDATION_ADMIN / FOUNDATION_STAFF role guard ─────────────────
const FOUNDATION_ROLES = ['FOUNDATION_ADMIN', 'FOUNDATION_STAFF', 'SUPER_ADMIN', 'ADMIN'];

export const isFoundationAuthorized = (userRole) => FOUNDATION_ROLES.includes(userRole);

// ══════════════════════════════════════════════════════════════════
// COLLECTION: foundation_finance
// Dons reçus, décaissements validés, livre journal
// ══════════════════════════════════════════════════════════════════
export const FoundationFinanceSchema = {
  /**
   * DON (Donation)
   * Chaque don génère automatiquement un certificat PDF.
   */
  don: (data) => {
    const montant = requirePositive(data.montant, 'montant');
    return {
      id: data.id || generateId('DON'),
      type: 'don',
      date: data.date || new Date().toISOString(),
      donateur: requireString(data.donateur, 'donateur'),
      montant,
      currency: 'FCFA',
      projet_cible: data.projet_cible || 'Fonds Général',
      mode_paiement: data.mode_paiement || 'Virement',
      reference_paiement: data.reference_paiement || '',
      certificat_genere: false,
      certificat_url: null,
      notes: data.notes || '',
      // Audit trail
      _domain: 'foundation',
      _collection: 'foundation_finance',
      _createdBy: data._createdBy || null,
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
    };
  },

  /**
   * DÉCAISSEMENT (Disbursement)
   * Workflow : Soumission → Validation FOUNDATION_ADMIN → Exécution
   * Contrainte : pièce justificative obligatoire.
   */
  decaissement: (data) => {
    const montant = requirePositive(data.montant, 'montant');
    if (!data.piece_jointe) {
      throw new Error('[FoundationSchema] Une pièce justificative est obligatoire pour tout décaissement.');
    }
    return {
      id: data.id || generateId('DEC'),
      type: 'decaissement',
      date: data.date || new Date().toISOString(),
      beneficiaire: requireString(data.beneficiaire, 'beneficiaire'),
      montant,
      currency: 'FCFA',
      motif: requireString(data.motif, 'motif'),
      categorie: data.categorie || 'Opérations',
      piece_jointe: data.piece_jointe, // URL or filename — REQUIRED
      statut: 'en_attente', // en_attente → approuve → execute | rejete
      approuve_par: null,
      approuve_le: null,
      commentaire_validation: '',
      notes: data.notes || '',
      // Audit trail
      _domain: 'foundation',
      _collection: 'foundation_finance',
      _createdBy: data._createdBy || null,
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
    };
  },

  /**
   * ÉCRITURE JOURNAL (Ledger Entry)
   * Générée automatiquement pour chaque don et décaissement validé.
   */
  ecritureJournal: (data) => ({
    id: data.id || generateId('JRN'),
    type: 'ecriture',
    date: data.date || new Date().toISOString(),
    libelle: requireString(data.libelle, 'libelle'),
    debit: requirePositive(data.debit || 0, 'debit'),
    credit: requirePositive(data.credit || 0, 'credit'),
    reference_source: data.reference_source || '', // DON-xxx or DEC-xxx
    _domain: 'foundation',
    _collection: 'foundation_finance',
    _createdAt: new Date().toISOString(),
  }),
};

// ══════════════════════════════════════════════════════════════════
// COLLECTION: foundation_employees
// Personnel détaché de la Fondation
// ══════════════════════════════════════════════════════════════════
export const FoundationEmployeeSchema = {
  employee: (data) => ({
    id: data.id || generateId('EMP-F'),
    nom: requireString(data.nom, 'nom'),
    poste: requireString(data.poste, 'poste'),
    departement: data.departement || 'Opérations',
    contrat: data.contrat || 'CDI', // CDI | CDD | Consultant
    salaire: requirePositive(data.salaire, 'salaire'),
    currency: 'FCFA',
    date_embauche: requireDate(data.date_embauche, 'date_embauche'),
    email: data.email || '',
    phone: data.phone || '',
    statut: data.statut || 'Actif', // Actif | Congé | Suspendu | Départ
    photo_url: data.photo_url || null,
    // Audit trail
    _domain: 'foundation',
    _collection: 'foundation_employees',
    _createdBy: data._createdBy || null,
    _createdAt: new Date().toISOString(),
    _updatedAt: new Date().toISOString(),
  }),

  conge: (data) => ({
    id: data.id || generateId('CG'),
    employe_id: requireString(data.employe_id, 'employe_id'),
    nom_employe: data.nom_employe || '',
    type: data.type || 'Congé annuel', // Congé annuel | Congé maladie | Formation | Congé exceptionnel
    debut: requireDate(data.debut, 'debut'),
    fin: requireDate(data.fin, 'fin'),
    jours: requirePositive(data.jours, 'jours'),
    motif: data.motif || '',
    statut: 'en_attente', // en_attente → approuve | rejete
    approuve_par: null,
    approuve_le: null,
    _domain: 'foundation',
    _collection: 'foundation_employees',
    _createdAt: new Date().toISOString(),
  }),

  fichePaie: (data) => ({
    id: data.id || generateId('PAY'),
    employe_id: requireString(data.employe_id, 'employe_id'),
    nom_employe: data.nom_employe || '',
    mois: requireString(data.mois, 'mois'), // "Mai 2025"
    brut: requirePositive(data.brut, 'brut'),
    net: requirePositive(data.net, 'net'),
    retenues: requirePositive(data.retenues || (data.brut - data.net), 'retenues'),
    statut: data.statut || 'en_attente', // en_attente | paye
    _domain: 'foundation',
    _collection: 'foundation_employees',
    _createdAt: new Date().toISOString(),
  }),
};

// ══════════════════════════════════════════════════════════════════
// COLLECTION: foundation_collecteurs
// Agents de terrain avec numéro de carte généré
// ══════════════════════════════════════════════════════════════════
export const FoundationCollecteurSchema = {
  collecteur: (data) => {
    const cardNumber = `FC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    return {
      id: data.id || generateId('COL'),
      nom: requireString(data.nom, 'nom'),
      zone: requireString(data.zone, 'zone'),
      quartier: data.quartier || '',
      telephone: data.telephone || '',
      numero_carte: data.numero_carte || cardNumber,
      date_inscription: data.date_inscription || new Date().toISOString(),
      statut: data.statut || 'Actif', // Actif | Inactif | Suspendu
      tonnage_cumule_kg: requirePositive(data.tonnage_cumule_kg || 0, 'tonnage_cumule_kg'),
      nombre_collectes: requirePositive(data.nombre_collectes || 0, 'nombre_collectes'),
      centre_rattachement: data.centre_rattachement || '',
      photo_url: data.photo_url || null,
      // Audit trail
      _domain: 'foundation',
      _collection: 'foundation_collecteurs',
      _createdBy: data._createdBy || null,
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
    };
  },
};

// ══════════════════════════════════════════════════════════════════
// COLLECTION: foundation_centres
// Centres de tri avec capacités et stocks en temps réel
// ══════════════════════════════════════════════════════════════════
export const FoundationCentreSchema = {
  centre: (data) => ({
    id: data.id || generateId('CTR'),
    nom: requireString(data.nom, 'nom'),
    localisation: data.localisation || '',
    coordonnees: data.coordonnees || { lat: null, lng: null },
    capacite_max_kg: requirePositive(data.capacite_max_kg || 0, 'capacite_max_kg'),
    stock_actuel_kg: requirePositive(data.stock_actuel_kg || 0, 'stock_actuel_kg'),
    responsable: data.responsable || '',
    statut: data.statut || 'Opérationnel', // Opérationnel | Maintenance | Fermé
    date_ouverture: data.date_ouverture || new Date().toISOString(),
    equipements: data.equipements || [], // [ 'Presse', 'Balance', 'Broyeur' ]
    // Audit trail
    _domain: 'foundation',
    _collection: 'foundation_centres',
    _createdBy: data._createdBy || null,
    _createdAt: new Date().toISOString(),
    _updatedAt: new Date().toISOString(),
  }),
};

// ══════════════════════════════════════════════════════════════════
// COLLECTION: foundation_collectes
// Tracking du plastique collecté : par type, poids, statut
// ══════════════════════════════════════════════════════════════════
export const FoundationCollecteSchema = {
  collecte: (data) => ({
    id: data.id || generateId('CLT'),
    date: data.date || new Date().toISOString(),
    collecteur_id: requireString(data.collecteur_id, 'collecteur_id'),
    centre_id: requireString(data.centre_id, 'centre_id'),
    type_plastique: data.type_plastique || 'PET', // PET | HDPE | PVC | LDPE | PP | PS | Autre
    poids_kg: requirePositive(data.poids_kg, 'poids_kg'),
    statut: data.statut || 'recu', // recu → pese → trie → recycle
    qualite: data.qualite || 'standard', // standard | premium | contamine
    prix_kg: requirePositive(data.prix_kg || 0, 'prix_kg'),
    montant_total: 0, // Calculated: poids_kg × prix_kg
    notes: data.notes || '',
    // Audit trail
    _domain: 'foundation',
    _collection: 'foundation_collectes',
    _createdBy: data._createdBy || null,
    _createdAt: new Date().toISOString(),
    _updatedAt: new Date().toISOString(),
  }),
};

// ══════════════════════════════════════════════════════════════════
// COLLECTION: foundation_expenses
// Notes de frais avec workflow d'approbation
// ══════════════════════════════════════════════════════════════════
export const FoundationExpenseSchema = {
  expense: (data) => {
    if (!data.justificatif) {
      throw new Error('[FoundationSchema] Un justificatif est obligatoire pour toute note de frais.');
    }
    return {
      id: data.id || generateId('EXP-F'),
      date: data.date || new Date().toISOString(),
      employe_id: requireString(data.employe_id, 'employe_id'),
      submittedBy: data.submittedBy || '',
      categorie: data.categorie || 'divers', // transport | restauration | hebergement | mission | materiel | divers
      description: requireString(data.description, 'description'),
      montant: requirePositive(data.montant, 'montant'),
      currency: 'FCFA',
      justificatif: data.justificatif, // URL or filename — REQUIRED
      statut: 'en_attente', // en_attente → approuve → rembourse | rejete
      commentaire: '',
      approuve_par: null,
      approuve_le: null,
      // Audit trail
      _domain: 'foundation',
      _collection: 'foundation_expenses',
      _createdBy: data._createdBy || null,
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
    };
  },
};

// ══════════════════════════════════════════════════════════════════
// REGISTRY MODELS (for dynamic form generation / list views)
// ══════════════════════════════════════════════════════════════════
export const FoundationSchemas = {
  id: 'foundation',
  label: 'IPC Collect Foundation',
  entity: 'Filiale Indépendante',

  models: {
    foundation_finance: {
      label: 'Finance & Dons Foundation',
      fields: {
        id:               { label: 'Référence',           type: 'text',      readonly: true },
        type:             { label: 'Type',                 type: 'selection', options: ['don', 'decaissement', 'ecriture'] },
        date:             { label: 'Date',                 type: 'date',      required: true },
        donateur:         { label: 'Donateur',             type: 'text',      search: true },
        beneficiaire:     { label: 'Bénéficiaire',         type: 'text',      search: true },
        montant:          { label: 'Montant',              type: 'money',     currency: 'FCFA', required: true },
        projet_cible:     { label: 'Projet Cible',         type: 'text' },
        statut:           { label: 'Statut',               type: 'selection', options: ['en_attente', 'approuve', 'execute', 'rejete'] },
        piece_jointe:     { label: 'Pièce Justificative',  type: 'file' },
      },
      views: {
        list: ['id', 'type', 'date', 'montant', 'statut'],
        search: {
          filters: [
            { id: 'dons',          label: 'Dons reçus',                domain: [['type', '==', 'don']] },
            { id: 'decaissements', label: 'Décaissements',             domain: [['type', '==', 'decaissement']] },
            { id: 'en_attente',    label: 'En attente de validation',  domain: [['statut', '==', 'en_attente']] },
          ],
          groups: [
            { id: 'type',   label: 'Par Type' },
            { id: 'statut', label: 'Par Statut' },
          ],
        },
      },
    },

    foundation_employees: {
      label: 'Effectifs Foundation',
      fields: {
        id:             { label: 'Matricule',        type: 'text',      readonly: true },
        nom:            { label: 'Nom Complet',      type: 'text',      required: true, search: true },
        poste:          { label: 'Poste',             type: 'text',      required: true, search: true },
        departement:    { label: 'Département',       type: 'selection', options: ['Opérations', 'Finance', 'Collecte', 'Impact', 'Administration'] },
        contrat:        { label: 'Type de Contrat',   type: 'selection', options: ['CDI', 'CDD', 'Consultant'] },
        salaire:        { label: 'Salaire Mensuel',   type: 'money',     currency: 'FCFA' },
        date_embauche:  { label: 'Date d\'Embauche',  type: 'date',      required: true },
        statut:         { label: 'Statut',            type: 'selection', options: ['Actif', 'Congé', 'Suspendu', 'Départ'] },
      },
      views: {
        list: ['id', 'nom', 'poste', 'contrat', 'statut'],
        search: {
          filters: [
            { id: 'actifs',  label: 'Employés Actifs',   domain: [['statut', '==', 'Actif']] },
            { id: 'cdi',     label: 'Contrats CDI',      domain: [['contrat', '==', 'CDI']] },
          ],
          groups: [
            { id: 'departement', label: 'Par Département' },
            { id: 'contrat',     label: 'Par Type de Contrat' },
          ],
        },
      },
    },

    foundation_collecteurs: {
      label: 'Collecteurs Terrain',
      fields: {
        id:              { label: 'Matricule',         type: 'text',   readonly: true },
        nom:             { label: 'Nom',               type: 'text',   required: true, search: true },
        zone:            { label: 'Zone',               type: 'text',   required: true, search: true },
        numero_carte:    { label: 'N° Carte',           type: 'text',   readonly: true },
        tonnage_cumule_kg: { label: 'Tonnage Cumulé (kg)', type: 'number' },
        statut:          { label: 'Statut',             type: 'selection', options: ['Actif', 'Inactif', 'Suspendu'] },
      },
      views: {
        list: ['id', 'nom', 'zone', 'numero_carte', 'tonnage_cumule_kg', 'statut'],
        search: {
          filters: [
            { id: 'actifs',  label: 'Collecteurs Actifs',  domain: [['statut', '==', 'Actif']] },
          ],
          groups: [
            { id: 'zone', label: 'Par Zone' },
          ],
        },
      },
    },

    foundation_centres: {
      label: 'Centres de Tri',
      fields: {
        id:               { label: 'Code Centre',     type: 'text',      readonly: true },
        nom:              { label: 'Nom',              type: 'text',      required: true, search: true },
        localisation:     { label: 'Localisation',     type: 'text',      search: true },
        capacite_max_kg:  { label: 'Capacité Max (kg)', type: 'number' },
        stock_actuel_kg:  { label: 'Stock Actuel (kg)', type: 'number' },
        statut:           { label: 'Statut',           type: 'selection', options: ['Opérationnel', 'Maintenance', 'Fermé'] },
      },
      views: {
        list: ['id', 'nom', 'localisation', 'capacite_max_kg', 'stock_actuel_kg', 'statut'],
        search: {
          filters: [
            { id: 'operationnel', label: 'En Fonctionnement', domain: [['statut', '==', 'Opérationnel']] },
          ],
          groups: [
            { id: 'statut', label: 'Par Statut' },
          ],
        },
      },
    },

    foundation_collectes: {
      label: 'Tracking Plastique',
      fields: {
        id:              { label: 'Référence',        type: 'text',      readonly: true },
        date:            { label: 'Date',              type: 'date',      required: true },
        type_plastique:  { label: 'Type',              type: 'selection', options: ['PET', 'HDPE', 'PVC', 'LDPE', 'PP', 'PS', 'Autre'] },
        poids_kg:        { label: 'Poids (kg)',        type: 'number',    required: true },
        statut:          { label: 'Statut',            type: 'selection', options: ['recu', 'pese', 'trie', 'recycle'] },
        qualite:         { label: 'Qualité',           type: 'selection', options: ['standard', 'premium', 'contamine'] },
      },
      views: {
        list: ['id', 'date', 'type_plastique', 'poids_kg', 'statut', 'qualite'],
        search: {
          filters: [
            { id: 'recu',    label: 'En Réception',  domain: [['statut', '==', 'recu']] },
            { id: 'recycle', label: 'Recyclé',        domain: [['statut', '==', 'recycle']] },
          ],
          groups: [
            { id: 'type_plastique', label: 'Par Type de Plastique' },
            { id: 'statut',         label: 'Par Statut' },
          ],
        },
      },
    },

    foundation_expenses: {
      label: 'Notes de Frais Foundation',
      fields: {
        id:            { label: 'Référence',     type: 'text',      readonly: true },
        date:          { label: 'Date',           type: 'date',      required: true },
        submittedBy:   { label: 'Soumis par',     type: 'text',      search: true },
        categorie:     { label: 'Catégorie',      type: 'selection', options: ['transport', 'restauration', 'hebergement', 'mission', 'materiel', 'divers'] },
        description:   { label: 'Description',    type: 'text',      required: true, search: true },
        montant:       { label: 'Montant',         type: 'money',     currency: 'FCFA', required: true },
        justificatif:  { label: 'Justificatif',    type: 'file',      required: true },
        statut:        { label: 'Statut',          type: 'selection', options: ['en_attente', 'approuve', 'rejete', 'rembourse'] },
      },
      views: {
        list: ['id', 'date', 'submittedBy', 'montant', 'statut'],
        search: {
          filters: [
            { id: 'en_attente', label: 'En attente',  domain: [['statut', '==', 'en_attente']] },
            { id: 'approuve',   label: 'Approuvées',   domain: [['statut', '==', 'approuve']] },
          ],
          groups: [
            { id: 'categorie', label: 'Par Catégorie' },
            { id: 'statut',    label: 'Par Statut' },
          ],
        },
      },
    },
  },
};

// [COMPAT] Alias pour compatibilité
export const foundationSchema = FoundationSchemas;
