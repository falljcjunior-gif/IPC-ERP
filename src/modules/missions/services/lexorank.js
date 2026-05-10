/**
 * ═══════════════════════════════════════════════════════════════════
 *  LEXORANK — Algorithme de tri lexicographique pour Drag & Drop
 *
 *  POURQUOI pas des integers ?
 *  Avec des entiers (position: 0,1,2,3…) déplacer une carte entre
 *  la position 2 et 3 oblige à mettre à jour TOUTES les cartes
 *  qui suivent → O(n) writes Firestore → coûteux et conflictueux.
 *
 *  AVEC LexoRank :
 *  Déplacer une carte = 1 seul write (juste la carte déplacée).
 *  On calcule le "milieu lexicographique" entre deux ranks existants.
 *
 *  FORMAT : "bucket|body:" où bucket ∈ {0,1,2} (pour rebalancing),
 *  body est une string base-36 [0-9a-z].
 *
 *  EXEMPLE :
 *  Cards A="0|hzzzzz:" B="0|i00008:"
 *  Insérer entre A et B → midpoint("hzzzzz", "i00008") → "i00003:"
 *  Résultat : A="0|hzzzzz:" C="0|i00003:" B="0|i00008:"
 *  → 1 write pour C, A et B inchangés.
 *
 *  REBALANCING : quand le midpoint devient impossible (strings égales
 *  ou trop proches), on lance un rebalancement global qui rééspace
 *  toutes les cartes de la liste uniformément.
 * ═══════════════════════════════════════════════════════════════════
 */

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';
const BASE = ALPHABET.length; // 36

// Valeurs de départ (milieu de l'alphabet base-36)
const MIN_CHAR = '0';
const MAX_CHAR = 'z';
const INITIAL_RANK = '0|hzzzzz:';
const INITIAL_MIN  = '0|000000:';
const INITIAL_MAX  = '0|zzzzzz:';

// ── Conversion ─────────────────────────────────────────────────────

function charToInt(c) {
  const i = ALPHABET.indexOf(c);
  if (i === -1) throw new Error(`Invalid LexoRank char: ${c}`);
  return i;
}

function intToChar(n) {
  return ALPHABET[n];
}

// ── Extraction du body (sans le bucket prefix et le suffixe ':') ───

function extractBody(rank) {
  // Format: "0|body:"
  const pipeIdx = rank.indexOf('|');
  const colonIdx = rank.lastIndexOf(':');
  return rank.slice(pipeIdx + 1, colonIdx);
}

function getBucket(rank) {
  return rank[0];
}

function buildRank(bucket, body) {
  return `${bucket}|${body}:`;
}

// ── Midpoint entre deux body strings ──────────────────────────────

function midpoint(a, b) {
  // Normalise les longueurs en paddant avec '0' à droite
  const len = Math.max(a.length, b.length) + 1;
  const aArr = a.padEnd(len, '0').split('').map(charToInt);
  const bArr = b.padEnd(len, '0').split('').map(charToInt);

  let result = [];
  let carry = 0;

  // Somme des deux nombres base-36 / 2
  const sum = aArr.map((aVal, i) => aVal + bArr[i]);

  for (let i = sum.length - 1; i >= 0; i--) {
    let val = sum[i] + carry * BASE;
    carry = val % 2 === 1 && i < sum.length - 1 ? 1 : 0;
    result[i] = Math.floor(val / 2);
  }

  // Supprime les zéros trailing sauf si résultat = "0"
  let str = result.map(intToChar).join('');
  str = str.replace(/0+$/, '') || '0';

  // Vérifie qu'on a bien un milieu strict
  if (str === a || str === b) {
    // Strings trop proches → on allonge
    return a + intToChar(Math.floor(BASE / 2));
  }
  return str;
}

// ─────────────────────────────────────────────────────────────────
// API PUBLIQUE
// ─────────────────────────────────────────────────────────────────

/**
 * Génère le rank initial pour la première carte d'une liste.
 */
export function initialRank() {
  return INITIAL_RANK;
}

/**
 * Génère un rank pour une nouvelle carte insérée en FIN de liste.
 * @param {string} lastRank — rank de la dernière carte (ou null si liste vide)
 */
export function rankAfter(lastRank) {
  if (!lastRank) return INITIAL_RANK;
  const bucket = getBucket(lastRank);
  const body   = extractBody(lastRank);
  // Ajoute 'h' (milieu) au body pour espacer
  return buildRank(bucket, body + intToChar(Math.floor(BASE / 2)));
}

/**
 * Génère un rank pour une nouvelle carte insérée en DÉBUT de liste.
 * @param {string} firstRank — rank de la première carte (ou null si liste vide)
 */
export function rankBefore(firstRank) {
  if (!firstRank) return INITIAL_RANK;
  const bucket = getBucket(firstRank);
  const body   = extractBody(firstRank);
  // Insère avant : si le body commence par '0', on préfixe
  if (body[0] === MIN_CHAR) {
    return buildRank(bucket, MIN_CHAR + body);
  }
  const firstChar = charToInt(body[0]);
  return buildRank(bucket, intToChar(Math.floor(firstChar / 2)) + body.slice(1));
}

/**
 * Calcule le rank entre deux cartes existantes.
 * Cas principal du Drag & Drop.
 *
 * @param {string|null} prevRank — rank de la carte au-dessus (null = début)
 * @param {string|null} nextRank — rank de la carte en-dessous (null = fin)
 * @returns {string} — nouveau rank
 */
export function rankBetween(prevRank, nextRank) {
  if (!prevRank && !nextRank) return INITIAL_RANK;
  if (!prevRank) return rankBefore(nextRank);
  if (!nextRank) return rankAfter(prevRank);

  const bucket   = getBucket(prevRank);
  const prevBody = extractBody(prevRank);
  const nextBody = extractBody(nextRank);

  if (prevBody === nextBody) {
    // Cas pathologique : même rank. Déclenche rebalancing.
    console.warn('[LexoRank] Collision détectée. Rebalancing nécessaire.');
    return buildRank(bucket, prevBody + intToChar(Math.floor(BASE / 2)));
  }

  const mid = midpoint(prevBody, nextBody);
  return buildRank(bucket, mid);
}

/**
 * Vérifie si un rebalancing est nécessaire (strings trop longues).
 * À appeler après chaque rankBetween pour décider si on rebalance.
 *
 * @param {string} rank
 * @returns {boolean}
 */
export function needsRebalancing(rank) {
  const body = extractBody(rank);
  return body.length > 20; // seuil pragmatique
}

/**
 * Rebalance une liste entière de ranks.
 * Redistribue uniformément les cartes dans l'espace [000000..zzzzzz].
 * À appeler UNIQUEMENT si needsRebalancing() est true.
 * Coût : O(n) writes Firestore — acceptable car rare.
 *
 * @param {string[]} orderedIds — IDs des cartes dans l'ordre actuel
 * @returns {Record<string, string>} — map { cardId: newRank }
 */
export function rebalance(orderedIds) {
  const n = orderedIds.length;
  if (n === 0) return {};

  const result = {};
  // Distribue uniformément sur 6 caractères base-36
  const total = Math.pow(BASE, 6); // 2_176_782_336
  const step  = Math.floor(total / (n + 1));

  orderedIds.forEach((id, i) => {
    const pos    = (i + 1) * step;
    const body   = pos.toString(BASE).padStart(6, '0');
    result[id]   = buildRank('0', body);
  });

  return result;
}

/**
 * Trie un tableau de documents par leur champ `rank` (lexicographique).
 *
 * @param {Array<{rank: string}>} items
 * @returns {Array} — items triés
 */
export function sortByRank(items) {
  return [...items].sort((a, b) => {
    if (a.rank < b.rank) return -1;
    if (a.rank > b.rank) return 1;
    return 0;
  });
}

// ─────────────────────────────────────────────────────────────────
// TESTS (dev only, à exécuter avec `node lexorank.js`)
// ─────────────────────────────────────────────────────────────────
if (import.meta.env?.DEV) {
  const r1 = initialRank();                        // 0|hzzzzz:
  const r2 = rankAfter(r1);                        // 0|hzzzzzh:
  const r3 = rankBetween(r1, r2);                  // milieu
  const r4 = rankBefore(r1);                       // avant r1

  console.log('[LexoRank] initial:', r1);
  console.log('[LexoRank] after r1:', r2);
  console.log('[LexoRank] between r1&r2:', r3);
  console.log('[LexoRank] before r1:', r4);
  console.log('[LexoRank] needsRebalancing(r1):', needsRebalancing(r1));

  const rebalanced = rebalance(['c1', 'c2', 'c3', 'c4', 'c5']);
  console.log('[LexoRank] rebalanced:', rebalanced);
}
