/**
 * ══════════════════════════════════════════════════════════════════
 * FEC EXPORT — Fichier des Écritures Comptables
 * ══════════════════════════════════════════════════════════════════
 *
 * FIX AUDIT P3 — Conformité fiscale française
 * Le FEC est obligatoire en cas de contrôle fiscal (DGFiP).
 * Format : CSV pipe-séparé, encodage UTF-8 sans BOM, CRLF
 *
 * Spécification : Arrêté du 29 juillet 2013 (art. A.47 A-1 du LPF)
 * Colonnes obligatoires (18) :
 *   JournalCode | JournalLib | EcritureNum | EcritureDate |
 *   CompteNum | CompteLib | CompAuxNum | CompAuxLib |
 *   PieceRef | PieceDate | EcritureLib | Debit | Credit |
 *   EcritureLet | DateLet | ValidDate | Montantdevise | Idevise
 *
 * Référence : https://www.bofip.impots.gouv.fr/bofip/1890-PGP.html
 */

// ── Constantes ───────────────────────────────────────────────────────────────
const FEC_SEPARATOR  = '|';
const FEC_CRLF       = '\r\n';
const FEC_DATE_REGEX = /^\d{8}$/; // YYYYMMDD

const FEC_COLUMNS = [
  'JournalCode',
  'JournalLib',
  'EcritureNum',
  'EcritureDate',
  'CompteNum',
  'CompteLib',
  'CompAuxNum',
  'CompAuxLib',
  'PieceRef',
  'PieceDate',
  'EcritureLib',
  'Debit',
  'Credit',
  'EcritureLet',
  'DateLet',
  'ValidDate',
  'Montantdevise',
  'Idevise',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formater une date en YYYYMMDD (format FEC obligatoire).
 * @param {Date|string|null} date
 * @returns {string}
 */
export function formatFecDate(date) {
  if (!date) return '';
  let d;
  if (date instanceof Date) {
    d = date;
  } else if (typeof date === 'string') {
    // Accepter ISO, DD/MM/YYYY, YYYY-MM-DD
    if (FEC_DATE_REGEX.test(date)) return date; // déjà au format FEC
    d = new Date(date.includes('/') ? date.split('/').reverse().join('-') : date);
  } else if (date?.toDate) {
    d = date.toDate(); // Firestore Timestamp
  } else {
    return '';
  }
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

/**
 * Formater un montant en chaîne FEC (2 décimales, virgule décimale).
 * @param {number|string|null} amount
 * @returns {string}
 */
export function formatFecAmount(amount) {
  if (amount === null || amount === undefined || amount === '') return '0,00';
  const n = Number(amount);
  if (!Number.isFinite(n)) return '0,00';
  return n.toFixed(2).replace('.', ',');
}

/**
 * Nettoyer un champ texte pour le FEC (supprimer les pipes, CRLF, quotes).
 * @param {string|null} str
 * @returns {string}
 */
export function cleanFecField(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/\|/g, '-')        // Remplacer les pipes (séparateur de colonne)
    .replace(/[\r\n]+/g, ' ')   // Supprimer les sauts de ligne
    .replace(/"/g, "'")         // Remplacer les guillemets
    .trim();
}

/**
 * Mapper une écriture comptable IPC ERP vers une ligne FEC.
 *
 * @param {Object} entry - Écriture depuis Firestore (finance.lines)
 * @param {Object} [accounts] - Map compteNum → compteLib pour enrichir
 * @returns {Object} Objet avec les 18 champs FEC
 */
export function mapEntryToFecRow(entry, accounts = {}) {
  const debit  = Number(entry.debit  || entry.montantDebit  || 0);
  const credit = Number(entry.credit || entry.montantCredit || 0);

  // Déterminer le compte auxiliaire (tiers : client/fournisseur)
  const compAuxNum = entry.compteAuxNum || entry.partnerAccountNum || '';
  const compAuxLib = entry.compteAuxLib || entry.partnerName       || '';

  // Numéro d'écriture : préférer le champ explicite, sinon construire
  const ecritureNum = entry.ecritureNum ||
    entry.reference   ||
    entry.piece       ||
    `EC-${entry.id || Date.now()}`;

  const compteNum = entry.compteNum || entry.accountCode || '';
  const compteLib = accounts[compteNum] || entry.compteLib || entry.accountLabel || '';

  return {
    JournalCode:    cleanFecField(entry.journalCode  || entry.codeJournal || 'OD'),
    JournalLib:     cleanFecField(entry.journalLib   || entry.libelleJournal || 'Opérations Diverses'),
    EcritureNum:    cleanFecField(ecritureNum),
    EcritureDate:   formatFecDate(entry.date         || entry.dateEcriture),
    CompteNum:      cleanFecField(compteNum),
    CompteLib:      cleanFecField(compteLib),
    CompAuxNum:     cleanFecField(compAuxNum),
    CompAuxLib:     cleanFecField(compAuxLib),
    PieceRef:       cleanFecField(entry.piece        || entry.pieceRef || entry.reference || ''),
    PieceDate:      formatFecDate(entry.pieceDate    || entry.date),
    EcritureLib:    cleanFecField(entry.libelle      || entry.description || ''),
    Debit:          formatFecAmount(debit  > 0 ? debit  : 0),
    Credit:         formatFecAmount(credit > 0 ? credit : 0),
    EcritureLet:    cleanFecField(entry.lettrage     || entry.ecritureLet || ''),
    DateLet:        formatFecDate(entry.dateLettrage || entry.dateLet),
    ValidDate:      formatFecDate(entry.validDate    || entry.dateValidation || entry.date),
    Montantdevise:  formatFecAmount(entry.montantdevise || 0),
    Idevise:        cleanFecField(entry.devise        || entry.currency || 'XOF'),
  };
}

/**
 * Générer le contenu CSV d'un fichier FEC.
 *
 * @param {Array}  entries    - Liste des écritures comptables
 * @param {Object} [opts]
 * @param {Object} [opts.accounts]  - Map { compteNum: compteLib }
 * @param {string} [opts.siren]     - SIREN de l'entreprise (pour en-tête fichier)
 * @param {string} [opts.startDate] - Date début période YYYYMMDD
 * @param {string} [opts.endDate]   - Date fin période YYYYMMDD
 * @returns {{ content: string, filename: string, rowCount: number, errors: Array }}
 */
export function generateFecContent(entries, opts = {}) {
  const { accounts = {}, siren = '', startDate = '', endDate = '' } = opts;

  const errors  = [];
  const rows    = [];
  let   rowNum  = 0;

  // En-tête CSV
  rows.push(FEC_COLUMNS.join(FEC_SEPARATOR));

  for (const entry of entries) {
    rowNum++;
    try {
      const row = mapEntryToFecRow(entry, accounts);

      // Validation : EcritureDate obligatoire
      if (!row.EcritureDate) {
        errors.push({ row: rowNum, id: entry.id, error: 'EcritureDate manquante' });
        continue; // Exclure du FEC (risque de rejet DGFiP)
      }

      // Validation : CompteNum obligatoire
      if (!row.CompteNum) {
        errors.push({ row: rowNum, id: entry.id, error: 'CompteNum manquant' });
        continue;
      }

      // Validation : Débit + Crédit non tous les deux à 0
      if (row.Debit === '0,00' && row.Credit === '0,00') {
        errors.push({ row: rowNum, id: entry.id, error: 'Débit et Crédit tous deux à zéro' });
        // On inclut quand même (peut être légal dans certains cas)
      }

      rows.push(Object.values(row).join(FEC_SEPARATOR));
    } catch (err) {
      errors.push({ row: rowNum, id: entry.id, error: err.message });
    }
  }

  // Nom de fichier FEC normalisé : SIREN + FEC + YYYYMMDD
  const dateSuffix = endDate || formatFecDate(new Date());
  const filename = siren
    ? `${siren}FEC${dateSuffix}.txt`
    : `FEC${dateSuffix}.txt`;

  return {
    content:  rows.join(FEC_CRLF) + FEC_CRLF,
    filename,
    rowCount: rows.length - 1, // Hors en-tête
    errors,
  };
}

/**
 * Télécharger le fichier FEC dans le navigateur.
 *
 * @param {Array}  entries
 * @param {Object} opts - Voir generateFecContent()
 */
export function downloadFec(entries, opts = {}) {
  const { content, filename, rowCount, errors } = generateFecContent(entries, opts);

  // UTF-8 sans BOM (la DGFiP exige UTF-8 sans BOM depuis 2022)
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return { filename, rowCount, errors };
}

/**
 * Valider un FEC déjà généré (vérifications de base).
 * Retourne un rapport de validation.
 *
 * @param {string} fecContent - Contenu texte du FEC
 * @returns {{ valid: boolean, warnings: string[], errors: string[] }}
 */
export function validateFec(fecContent) {
  const warnings = [];
  const errors   = [];

  if (!fecContent || typeof fecContent !== 'string') {
    return { valid: false, warnings, errors: ['Contenu vide ou invalide'] };
  }

  const lines = fecContent.split(/\r\n|\n/).filter(Boolean);
  if (lines.length < 2) {
    return { valid: false, warnings, errors: ['FEC vide (aucune écriture)'] };
  }

  // Vérifier l'en-tête
  const header = lines[0].split(FEC_SEPARATOR);
  if (header.length !== 18) {
    errors.push(`En-tête : ${header.length} colonnes au lieu de 18`);
  }
  FEC_COLUMNS.forEach((col, i) => {
    if (header[i] !== col) {
      errors.push(`Colonne ${i + 1} : attendu "${col}", trouvé "${header[i]}"`);
    }
  });

  // Vérifier quelques lignes
  let debitTotal  = 0;
  let creditTotal = 0;
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(FEC_SEPARATOR);
    if (cols.length !== 18) {
      errors.push(`Ligne ${i + 1} : ${cols.length} colonnes au lieu de 18`);
      continue;
    }

    const debit  = parseFloat((cols[11] || '0').replace(',', '.'));
    const credit = parseFloat((cols[12] || '0').replace(',', '.'));
    debitTotal  += debit;
    creditTotal += credit;

    // EcritureDate
    if (!FEC_DATE_REGEX.test(cols[3])) {
      warnings.push(`Ligne ${i + 1} : EcritureDate invalide "${cols[3]}"`);
    }
  }

  // Vérifier l'équilibre débit/crédit (écart tolérance 0.01 centimes)
  if (Math.abs(debitTotal - creditTotal) > 0.01) {
    warnings.push(
      `Déséquilibre débit/crédit : D=${debitTotal.toFixed(2)} C=${creditTotal.toFixed(2)}`
    );
  }

  return {
    valid:  errors.length === 0,
    warnings,
    errors,
    stats: {
      lines:       lines.length - 1,
      debitTotal:  debitTotal.toFixed(2),
      creditTotal: creditTotal.toFixed(2),
      balanced:    Math.abs(debitTotal - creditTotal) <= 0.01,
    },
  };
}
