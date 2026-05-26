/**
 * ══════════════════════════════════════════════════════════════════
 * IMMOBILISATIONS & AMORTISSEMENTS — SCHEMA
 * ══════════════════════════════════════════════════════════════════
 *
 * WHY: Registre des immobilisations corporelles et incorporelles.
 *       Calculs d'amortissement linéaire et dégressif conformes au
 *       Plan Comptable Général (PCG) et au droit fiscal français.
 *
 * COLLECTIONS FIRESTORE:
 *   - immobilisations        : registre des actifs
 *   - immobilisations_dotations : écritures annuelles calculées (snapshot)
 */

// ── Coefficients dégressifs (CGI art. 39A) ──────────────────────────────────
// Durée < 3 ans   : pas de dégressif (retour linéaire imposé)
// Durée 3–4 ans   : coefficient 1,25
// Durée 5–6 ans   : coefficient 1,75
// Durée ≥ 7 ans   : coefficient 2,25
export const COEFFICIENT_DEGRESSIF = (dureeAns) => {
  if (dureeAns < 3) return 1;       // linéaire uniquement
  if (dureeAns <= 4) return 1.25;
  if (dureeAns <= 6) return 1.75;
  return 2.25;
};

// ── Catégories standard PCG ──────────────────────────────────────────────────
export const CATEGORIES_IMMOBILISATIONS = [
  { value: 'terrain',         label: 'Terrains',                 compte: '211' },
  { value: 'constructions',   label: 'Constructions',            compte: '213' },
  { value: 'installations',   label: 'Install. techniques',      compte: '215' },
  { value: 'materiel',        label: 'Matériel & outillage',     compte: '215' },
  { value: 'transport',       label: 'Matériel de transport',    compte: '2182' },
  { value: 'mobilier',        label: 'Mobilier & agencements',   compte: '2183' },
  { value: 'informatique',    label: 'Matériel informatique',    compte: '2183' },
  { value: 'brevets',         label: 'Brevets & licences',       compte: '205' },
  { value: 'logiciels',       label: 'Logiciels',                compte: '205' },
  { value: 'fonds_commerce',  label: 'Fonds de commerce',        compte: '207' },
  { value: 'autre',           label: 'Autre',                    compte: '218' },
];

// ── Schema RecordModal ────────────────────────────────────────────────────────
export const immobilisationsSchema = {
  models: {
    actifs: {
      fields: {
        designation:           { type: 'text',     label: 'Désignation',           required: true,  placeholder: 'Ex: Serveur Dell PowerEdge' },
        categorie:             { type: 'select',   label: 'Catégorie',             required: true,  options: CATEGORIES_IMMOBILISATIONS.map(c => ({ value: c.value, label: c.label })) },
        date_acquisition:      { type: 'date',     label: "Date d'acquisition",    required: true },
        valeur_brute:          { type: 'number',   label: 'Valeur brute (FCFA)',   required: true,  placeholder: '0' },
        duree_amortissement:   { type: 'number',   label: 'Durée (années)',        required: true,  placeholder: '5' },
        methode:               { type: 'select',   label: "Méthode d'amortis.",    required: true,  options: [{ value: 'lineaire', label: 'Linéaire' }, { value: 'degressif', label: 'Dégressif (CGI art.39A)' }] },
        valeur_residuelle:     { type: 'number',   label: 'Valeur résiduelle',     required: false, placeholder: '0' },
        numero_compte:         { type: 'text',     label: 'N° de compte PCG',      required: false, placeholder: 'Ex: 2183' },
        fournisseur:           { type: 'text',     label: 'Fournisseur',           required: false },
        reference:             { type: 'text',     label: 'Référence / N° série',  required: false },
        localisation:          { type: 'text',     label: 'Localisation',          required: false, placeholder: 'Ex: Siège – Salle serveurs' },
        notes:                 { type: 'textarea', label: 'Notes',                 required: false },
      }
    },
    cessions: {
      fields: {
        actif_id:              { type: 'text',   label: 'ID Actif',              required: true },
        date_cession:          { type: 'date',   label: 'Date de cession',       required: true },
        valeur_cession:        { type: 'number', label: 'Prix de cession (FCFA)', required: true, placeholder: '0' },
        motif:                 { type: 'select', label: 'Motif',                 required: true, options: [{ value: 'vente', label: 'Vente' }, { value: 'rebut', label: 'Mise au rebut' }, { value: 'donation', label: 'Donation' }, { value: 'vol', label: 'Vol / Sinistre' }] },
        notes:                 { type: 'textarea', label: 'Notes',               required: false },
      }
    }
  }
};

// ── Moteur de calcul ──────────────────────────────────────────────────────────

/**
 * Calcule le plan d'amortissement complet d'un actif.
 * @param {Object} actif
 * @returns {Array<{annee, dotation, amortissementCumule, vncDebut, vncFin}>}
 */
export function calculerPlanAmortissement(actif) {
  const {
    valeur_brute = 0,
    valeur_residuelle = 0,
    duree_amortissement = 1,
    methode = 'lineaire',
    date_acquisition,
  } = actif;

  const valeurAmortissable = Math.max(0, Number(valeur_brute) - Number(valeur_residuelle));
  const dureeAns = Math.max(1, Number(duree_amortissement));
  const anneeDebut = date_acquisition
    ? new Date(date_acquisition).getFullYear()
    : new Date().getFullYear();

  const lignes = [];
  let vncDebut = Number(valeur_brute);
  let cumule = 0;

  if (methode === 'degressif') {
    const tauxLineaire = 1 / dureeAns;
    const coeff = COEFFICIENT_DEGRESSIF(dureeAns);
    const tauxDegressif = tauxLineaire * coeff;

    for (let i = 1; i <= dureeAns; i++) {
      const anneesRestantes = dureeAns - i + 1;
      const tauxLineaireRestant = anneesRestantes > 0 ? 1 / anneesRestantes : 0;
      // Bascule vers linéaire si taux linéaire sur valeur résiduelle > taux dégressif
      const dotation = tauxLineaireRestant > tauxDegressif
        ? vncDebut * tauxLineaireRestant
        : vncDebut * tauxDegressif;

      const dotationArrondie = Math.min(Math.round(dotation), valeurAmortissable - cumule);
      const effectiveDotation = Math.max(0, dotationArrondie);
      cumule += effectiveDotation;
      const vncFin = Math.max(Number(valeur_residuelle), vncDebut - effectiveDotation);

      lignes.push({
        annee: anneeDebut + i - 1,
        dotation: effectiveDotation,
        amortissementCumule: cumule,
        vncDebut: Math.round(vncDebut),
        vncFin: Math.round(vncFin),
        taux: `${(tauxDegressif * 100).toFixed(2)}%`,
      });

      vncDebut = vncFin;
      if (vncFin <= Number(valeur_residuelle)) break;
    }
  } else {
    // Linéaire
    const dotationAnnuelle = Math.round(valeurAmortissable / dureeAns);
    for (let i = 1; i <= dureeAns; i++) {
      const isLast = i === dureeAns;
      const dotation = isLast ? valeurAmortissable - cumule : dotationAnnuelle;
      cumule += dotation;
      const vncFin = Math.max(Number(valeur_residuelle), vncDebut - dotation);

      lignes.push({
        annee: anneeDebut + i - 1,
        dotation,
        amortissementCumule: cumule,
        vncDebut: Math.round(vncDebut),
        vncFin: Math.round(vncFin),
        taux: `${((1 / dureeAns) * 100).toFixed(2)}%`,
      });
      vncDebut = vncFin;
    }
  }

  return lignes;
}

/**
 * Calcule la VNC (Valeur Nette Comptable) à une date donnée.
 */
export function calculerVNC(actif, dateRef = new Date()) {
  const plan = calculerPlanAmortissement(actif);
  const anneeRef = dateRef.getFullYear();
  const ligne = plan.filter(l => l.annee <= anneeRef).pop();
  return ligne ? ligne.vncFin : Number(actif.valeur_brute);
}

/**
 * Calcule la plus/moins-value de cession.
 */
export function calculerResultatCession(actif, valeurCession, dateCession = new Date()) {
  const vnc = calculerVNC(actif, new Date(dateCession));
  const prixCession = Number(valeurCession);
  return {
    vnc,
    prixCession,
    resultat: prixCession - vnc,
    type: prixCession >= vnc ? 'plus_value' : 'moins_value',
  };
}

/**
 * Retourne toutes les dotations d'un exercice fiscal (par année).
 */
export function dotationsDuExercice(actifs, annee) {
  return actifs
    .filter(a => a.etat !== 'cede' && a.etat !== 'mis_au_rebut')
    .map(a => {
      const plan = calculerPlanAmortissement(a);
      const ligne = plan.find(l => l.annee === annee);
      return ligne
        ? { actifId: a.id, designation: a.designation, categorie: a.categorie, dotation: ligne.dotation, vnc: ligne.vncFin }
        : null;
    })
    .filter(Boolean);
}
