/**
 * Finance helpers — single source of truth for cross-tab finance logic.
 *
 * Why this exists: prior to 2026-05-22, NaN/Infinity propagation, status
 * string drift (`Payé` vs `Payée`, `status` vs `statut`), timezone
 * mismatches and float-cents loss were silently corrupting Treasury,
 * Analytics and Invoicing tabs. Use these helpers — do not reinvent them.
 */

// ─────────────────────────────────────────────────────────────────────
// safeRatio — division that never returns NaN or Infinity.
// ─────────────────────────────────────────────────────────────────────
/**
 * @param {number|string} num
 * @param {number|string} den
 * @param {number} fallback — value returned when `den` is 0/null/NaN
 * @returns {number}
 */
export function safeRatio(num, den, fallback = 0) {
  const n = Number(num);
  const d = Number(den);
  if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return fallback;
  return n / d;
}

/**
 * safePercent(num, den) → integer percent, never NaN/Infinity.
 * Use for burn rates, conversion rates, performance %, etc.
 */
export function safePercent(num, den, fallback = 0) {
  return Math.round(safeRatio(num, den, fallback / 100) * 100);
}

// ─────────────────────────────────────────────────────────────────────
// isPaid — normalize all `status`/`statut` × `Payé`/`Payée` variants.
// ─────────────────────────────────────────────────────────────────────
const PAID_TOKENS = new Set([
  'paye', 'payee', 'payé', 'payée',
  'paid', 'settled', 'regle', 'reglé', 'réglé', 'reglee', 'réglée',
]);

/**
 * @param {object} invoice
 * @returns {boolean}
 */
export function isPaid(invoice) {
  if (!invoice) return false;
  const raw = invoice.statut ?? invoice.status ?? invoice.state ?? '';
  if (!raw) return false;
  return PAID_TOKENS.has(
    String(raw).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, '')
  );
}

/**
 * isOverdue — invoice is unpaid AND due date is past.
 */
export function isOverdue(invoice, now = new Date()) {
  if (!invoice || isPaid(invoice)) return false;
  const due = parseDate(invoice.dueDate || invoice.echeance);
  return due ? due < now : false;
}

// ─────────────────────────────────────────────────────────────────────
// Dates — UTC-safe parse + ISO-day normalisation.
// ─────────────────────────────────────────────────────────────────────
/**
 * Returns a Date or null. Accepts Date, ISO string, YYYY-MM-DD, timestamp.
 */
export function parseDate(x) {
  if (!x) return null;
  if (x instanceof Date) return Number.isNaN(x.getTime()) ? null : x;
  // Firestore Timestamp shape
  if (typeof x === 'object' && typeof x.toDate === 'function') {
    try { return x.toDate(); } catch { return null; }
  }
  const d = new Date(x);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * normalizeDate(x) → 'YYYY-MM-DD' (UTC) or null. Use for date-equality
 * comparisons — never compare raw timestamps with strings.
 */
export function normalizeDate(x) {
  const d = parseDate(x);
  return d ? d.toISOString().slice(0, 10) : null;
}

/**
 * monthKeyUTC(x) → 'YYYY-MM' (UTC) — for grouping cashflow without
 * timezone drift at month boundaries.
 */
export function monthKeyUTC(x) {
  const d = parseDate(x);
  if (!d) return null;
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────
// Money — cent-accurate sums (avoids float drift after many ops).
// ─────────────────────────────────────────────────────────────────────
/** Round to 2 decimals (banker's not used — XOF/FCFA has no centime). */
export function roundCents(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

/**
 * sumMoney(items, accessor) — adds Numbers without float-drift.
 * Internally accumulates in cents (integer) and divides at the end.
 */
export function sumMoney(items, accessor = (x) => x) {
  if (!Array.isArray(items)) return 0;
  let cents = 0;
  for (const item of items) {
    const v = Number(accessor(item)) || 0;
    cents += Math.round(v * 100);
  }
  return cents / 100;
}

// ─────────────────────────────────────────────────────────────────────
// Period helpers — current quarter / fiscal year.
// ─────────────────────────────────────────────────────────────────────
/**
 * currentQuarterLabel() → e.g. 'Q2 2026' (UTC).
 */
export function currentQuarterLabel(now = new Date()) {
  const month = now.getUTCMonth() + 1;
  const quarter = Math.ceil(month / 3);
  return `Q${quarter} ${now.getUTCFullYear()}`;
}

/**
 * fiscalYearLabel() → e.g. 'Exercice 2026'.
 */
export function fiscalYearLabel(now = new Date()) {
  return `Exercice ${now.getUTCFullYear()}`;
}

/**
 * isInPeriod(date, { from, to }) — inclusive range check, UTC.
 */
export function isInPeriod(date, { from, to } = {}) {
  const d = parseDate(date);
  if (!d) return false;
  if (from) {
    const f = parseDate(from);
    if (f && d < f) return false;
  }
  if (to) {
    const t = parseDate(to);
    if (t && d > t) return false;
  }
  return true;
}
