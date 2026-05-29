#!/usr/bin/env node
/**
 * i18n-check.js — Locale completeness guard for the IPC / Antigravity project.
 *
 * Usage:
 *   node scripts/i18n-check.js           # check fr.json vs en.json
 *   node scripts/i18n-check.js --strict  # also fail on un-whitelisted same-value keys
 *
 * Exit codes:
 *   0  — all good (or only whitelisted same-value keys in non-strict mode)
 *   1  — structural mismatch (keys missing in either locale)
 *   2  — strict mode: new same-value keys detected (possible untranslated strings)
 *
 * CI integration (package.json):
 *   "i18n:check": "node scripts/i18n-check.js"
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root      = resolve(__dirname, '..');
const strictMode = process.argv.includes('--strict');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadJson(relPath) {
  const abs = resolve(root, relPath);
  try {
    return JSON.parse(readFileSync(abs, 'utf8'));
  } catch (e) {
    console.error(`❌  Could not read ${relPath}: ${e.message}`);
    process.exit(1);
  }
}

/**
 * Flatten a nested locale object to dot-notation key → value pairs.
 * e.g. { nav: { home: "Cockpit" } } → { "nav.home": "Cockpit" }
 */
function flatten(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    return typeof v === 'object' && v !== null
      ? flatten(v, key)
      : [[key, String(v)]];
  });
}

// ─── Known-same whitelist ─────────────────────────────────────────────────────
//
// These 33 keys have identical values in FR and EN because they are:
//   • Universal / international terms (Email, Date, Tags, Type, Description…)
//   • Accounting / business acronyms (FIFO, Net, Budget, Total, Taxes…)
//   • Proper product names / English loanwords in French (Cockpit, Missions,
//     Connect, Helpdesk, Pipeline, Machine, Prospect, Service…)
//
// Add new keys here ONLY when the same-value is genuinely intentional.
const KNOWN_SAME = new Set([
  'nav.home',
  'nav.missions',
  'nav.connect',
  'nav.helpdesk',
  'common.info',
  'common.notifications',
  'common.total',
  'common.taxes',
  'common.date',
  'common.actions',
  'common.description',
  'common.type',
  'common.notes',
  'common.tags',
  'finance.budgets',
  'finance.net',
  'finance.client',
  'hr.performance',
  'crm.pipeline',
  'crm.contacts',
  'crm.contact',
  'crm.source',
  'crm.email',
  'crm.note',
  'inventory.fifo',
  'production.machine',
  'project.budget',
  'project.client',
  'schema.Type',
  'schema.Email',
  'schema.Tags',
  'schema.Prospect',
  'schema.Service',
]);

// ─── Main ─────────────────────────────────────────────────────────────────────

const fr = Object.fromEntries(flatten(loadJson('src/locales/fr.json')));
const en = Object.fromEntries(flatten(loadJson('src/locales/en.json')));

const frKeys = Object.keys(fr);
const enKeys = Object.keys(en);

const missingInEn = frKeys.filter(k => !Object.prototype.hasOwnProperty.call(en, k));
const missingInFr = enKeys.filter(k => !Object.prototype.hasOwnProperty.call(fr, k));

const sameValue        = frKeys.filter(k => en[k] === fr[k]);
const knownSame        = sameValue.filter(k =>  KNOWN_SAME.has(k));
const unknownSame      = sameValue.filter(k => !KNOWN_SAME.has(k));

// ─── Report ───────────────────────────────────────────────────────────────────

const RESET  = '\x1b[0m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN  = '\x1b[32m';
const CYAN   = '\x1b[36m';
const BOLD   = '\x1b[1m';

console.log(`\n${BOLD}═══ i18n completeness check ═══${RESET}`);
console.log(`  Locales : fr.json (${frKeys.length} keys)  en.json (${enKeys.length} keys)`);
console.log(`  Mode    : ${strictMode ? 'strict' : 'standard'}\n`);

let exitCode = 0;

// 1. Structural gaps — always fatal
if (missingInEn.length > 0) {
  exitCode = 1;
  console.log(`${RED}${BOLD}✖  Keys in FR but missing in EN (${missingInEn.length}):${RESET}`);
  missingInEn.forEach(k => console.log(`     ${RED}${k}${RESET}`));
  console.log();
}

if (missingInFr.length > 0) {
  exitCode = 1;
  console.log(`${RED}${BOLD}✖  Keys in EN but missing in FR (${missingInFr.length}):${RESET}`);
  missingInFr.forEach(k => console.log(`     ${RED}${k}${RESET}`));
  console.log();
}

// 2. Unknown same-value keys — fatal in strict mode, warning otherwise
if (unknownSame.length > 0) {
  if (strictMode) {
    exitCode = Math.max(exitCode, 2);
    console.log(`${RED}${BOLD}✖  New same-value keys (possibly untranslated) — ${unknownSame.length}:${RESET}`);
  } else {
    console.log(`${YELLOW}${BOLD}⚠  Same-value keys not in whitelist (review needed) — ${unknownSame.length}:${RESET}`);
  }
  unknownSame.forEach(k =>
    console.log(`     ${YELLOW}${k}${RESET}  = ${JSON.stringify(fr[k])}`)
  );
  console.log(`  ${CYAN}Tip: add intentionally-same keys to KNOWN_SAME in scripts/i18n-check.js${RESET}\n`);
}

// 3. Known same-value summary (always info)
if (knownSame.length > 0) {
  console.log(`${CYAN}ℹ  Known same-value (whitelisted) — ${knownSame.length} keys${RESET}`);
  console.log(`  (universal terms, acronyms, branded names — see KNOWN_SAME list)\n`);
}

// 4. Final verdict
if (exitCode === 0) {
  console.log(`${GREEN}${BOLD}✔  All locale files are structurally complete.${RESET}`);
  if (!strictMode && unknownSame.length > 0) {
    console.log(`${YELLOW}   Run with --strict to fail on unwhitelisted same-value keys.${RESET}`);
  }
} else if (exitCode === 1) {
  console.log(`${RED}${BOLD}✖  Locale files have structural gaps — fix before shipping.${RESET}`);
} else {
  console.log(`${RED}${BOLD}✖  Strict mode: untranslated keys detected.${RESET}`);
}

console.log();
process.exit(exitCode);
