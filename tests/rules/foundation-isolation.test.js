/**
 * ════════════════════════════════════════════════════════════════════════════
 * FIRESTORE RULES — 3-SPACE MULTI-TENANT ISOLATION (Foundations + Organizations)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * P0 security regression suite. Proves that the tightened firestore.rules
 * enforce strict per-entity isolation for every `foundation_*` collection and
 * for `organizations`, while preserving:
 *   - Holding read-only supervision (NO write bypass on operational data)
 *   - Append-only immutability (financial / personal-data collections)
 *   - The organizations field-name fix (entity_id / parent_id, not id / parentId)
 *
 * Runs against the Firestore Emulator:
 *   npm run test:rules
 *
 * Actors (custom claims === request.auth.token):
 *   founderA       FOUNDATION_DG    entity_id=found_a   country=CIV
 *   founderAStaff  FOUNDATION_STAFF entity_id=found_a   country=CIV
 *   founderB       FOUNDATION_DG    entity_id=found_b   country=CIV
 *   holding        HOLDING_CEO      entity_id=holding_root
 *   subsidiary     SUBSIDIARY_DG    entity_id=sub_x     country=CIV
 *   countryUser    COUNTRY_DIRECTOR_FOUNDATION  entity_id=found_a  country=CIV
 *   superAdmin     SUPER_ADMIN      entity_id=holding_root
 */

import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

const PROJECT_ID = 'demo-ipc-rules';
const [EMU_HOST, EMU_PORT] = (process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080').split(':');

/** The 7 operational Foundation collections.
 *  appendOnly === true  → delete is ALWAYS denied (`allow delete: if false`).
 *  appendOnly === false → owner FOUNDATION_DG may delete own doc; cross-entity denied.
 */
const FOUNDATION_COLLECTIONS = [
  { name: 'foundation_donations', appendOnly: true },
  { name: 'foundation_programs', appendOnly: true },
  { name: 'foundation_beneficiaries', appendOnly: true },
  { name: 'foundation_campaigns', appendOnly: false },
  { name: 'foundation_finance', appendOnly: true },
  { name: 'foundation_partners', appendOnly: false },
  { name: 'foundation_governance', appendOnly: true },
];

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: EMU_HOST,
      port: Number(EMU_PORT),
    },
  });
});

afterAll(async () => {
  if (testEnv) await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

// ── Actor helpers ───────────────────────────────────────────────────────────
const founderA = () => testEnv.authenticatedContext('uid_a', { role: 'FOUNDATION_DG', entity_id: 'found_a', country_id: 'CIV' }).firestore();
const founderAStaff = () => testEnv.authenticatedContext('uid_a_staff', { role: 'FOUNDATION_STAFF', entity_id: 'found_a', country_id: 'CIV' }).firestore();
const founderB = () => testEnv.authenticatedContext('uid_b', { role: 'FOUNDATION_DG', entity_id: 'found_b', country_id: 'CIV' }).firestore();
const holding = () => testEnv.authenticatedContext('uid_h', { role: 'HOLDING_CEO', entity_id: 'holding_root' }).firestore();
const subsidiary = () => testEnv.authenticatedContext('uid_s', { role: 'SUBSIDIARY_DG', entity_id: 'sub_x', country_id: 'CIV' }).firestore();
const countryUser = () => testEnv.authenticatedContext('uid_c', { role: 'COUNTRY_DIRECTOR_FOUNDATION', entity_id: 'found_a', country_id: 'CIV' }).firestore();
const superAdmin = () => testEnv.authenticatedContext('uid_root', { role: 'SUPER_ADMIN', entity_id: 'holding_root' }).firestore();
const anon = () => testEnv.unauthenticatedContext().firestore();

/** Seed two docs (one per foundation) in `coll`, bypassing rules. */
async function seedPair(coll) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const adminDb = ctx.firestore();
    await setDoc(doc(adminDb, coll, 'ownA'), { entity_id: 'found_a', _createdBy: 'uid_a', label: 'A', amount: 100 });
    await setDoc(doc(adminDb, coll, 'ownB'), { entity_id: 'found_b', _createdBy: 'uid_b', label: 'B', amount: 200 });
  });
}

// ════════════════════════════════════════════════════════════════════════════
// FOUNDATION COLLECTIONS — parametrized isolation battery
// ════════════════════════════════════════════════════════════════════════════
describe.each(FOUNDATION_COLLECTIONS)('$name — 3-SPACE isolation', ({ name, appendOnly }) => {
  beforeEach(() => seedPair(name));

  // (1) Fondation A reads its OWN doc → ALLOW
  it('A reads own → ALLOW', async () => {
    await assertSucceeds(getDoc(doc(founderA(), name, 'ownA')));
  });

  // (2) Fondation A reads Fondation B's doc → DENY
  it("A reads B's doc → DENY", async () => {
    await assertFails(getDoc(doc(founderA(), name, 'ownB')));
  });

  // (3a) A creates a doc attributed to B → DENY
  it("A creates doc with B's entity_id → DENY", async () => {
    await assertFails(setDoc(doc(founderA(), name, 'newForB'), { entity_id: 'found_b', label: 'x' }));
  });

  // (3b) A updates B's existing doc → DENY
  it("A updates B's doc → DENY", async () => {
    await assertFails(updateDoc(doc(founderA(), name, 'ownB'), { label: 'hacked' }));
  });

  // (4) A re-attributes its OWN doc to B's entity_id → DENY
  it('A re-attributes own doc to B → DENY', async () => {
    await assertFails(updateDoc(doc(founderA(), name, 'ownA'), { entity_id: 'found_b' }));
  });

  // Sanity: legitimate own create + own update still WORK (not over-tightened)
  it('A creates own doc → ALLOW', async () => {
    await assertSucceeds(setDoc(doc(founderA(), name, 'newOwnA'), { entity_id: 'found_a', _createdBy: 'uid_a', label: 'fresh' }));
  });
  it('A updates own doc (entity_id unchanged) → ALLOW', async () => {
    await assertSucceeds(updateDoc(doc(founderA(), name, 'ownA'), { label: 'edited' }));
  });

  // (5) Holding reads ANY foundation doc → ALLOW (read-only supervision)
  it('Holding reads A and B → ALLOW', async () => {
    await assertSucceeds(getDoc(doc(holding(), name, 'ownA')));
    await assertSucceeds(getDoc(doc(holding(), name, 'ownB')));
  });

  // (6) Holding WRITES a foundation operational doc → DENY (no write bypass)
  it('Holding creates foundation doc → DENY', async () => {
    await assertFails(setDoc(doc(holding(), name, 'newByHolding'), { entity_id: 'found_a', label: 'x' }));
  });
  it('Holding updates foundation doc → DENY', async () => {
    await assertFails(updateDoc(doc(holding(), name, 'ownA'), { label: 'x' }));
  });

  // (7) Subsidiary reads a foundation doc → DENY (commercial/non-profit firewall)
  it('Subsidiary reads foundation doc → DENY', async () => {
    await assertFails(getDoc(doc(subsidiary(), name, 'ownA')));
  });

  // (8) Delete policy
  if (appendOnly) {
    it('delete is append-only → DENY (owner)', async () => {
      await assertFails(deleteDoc(doc(founderA(), name, 'ownA')));
    });
    it('delete is append-only → DENY (Holding)', async () => {
      await assertFails(deleteDoc(doc(holding(), name, 'ownA')));
    });
  } else {
    it('owner FOUNDATION_DG deletes own → ALLOW', async () => {
      await assertSucceeds(deleteDoc(doc(founderA(), name, 'ownA')));
    });
    it("FOUNDATION_DG deletes B's doc → DENY (cross-entity)", async () => {
      await assertFails(deleteDoc(doc(founderA(), name, 'ownB')));
    });
    it('non-admin staff deletes own → DENY', async () => {
      await assertFails(deleteDoc(doc(founderAStaff(), name, 'ownA')));
    });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// FOUNDATION CAMPAIGNS — explicit proof the public-read leak is closed
// ════════════════════════════════════════════════════════════════════════════
describe('foundation_campaigns — public-read leak closed', () => {
  beforeEach(() => seedPair('foundation_campaigns'));

  it('unauthenticated read → DENY', async () => {
    await assertFails(getDoc(doc(anon(), 'foundation_campaigns', 'ownA')));
  });
  it('subsidiary read → DENY (previously allowed via isAuthenticated)', async () => {
    await assertFails(getDoc(doc(subsidiary(), 'foundation_campaigns', 'ownA')));
  });
  it('cross-foundation read → DENY', async () => {
    await assertFails(getDoc(doc(founderB(), 'foundation_campaigns', 'ownA')));
  });
});

// ════════════════════════════════════════════════════════════════════════════
// ORGANIZATIONS — field-name fix (entity_id / parent_id) + entity isolation
// ════════════════════════════════════════════════════════════════════════════
describe('organizations — entity_id/parent_id scoping (field-name fix)', () => {
  beforeEach(async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const adminDb = ctx.firestore();
      await setDoc(doc(adminDb, 'organizations', 'orgA'), { entity_id: 'found_a', parent_id: 'holding_root', country_id: 'CIV' });
      await setDoc(doc(adminDb, 'organizations', 'orgB'), { entity_id: 'found_b', parent_id: 'holding_root', country_id: 'CIV' });
      await setDoc(doc(adminDb, 'organizations', 'childOfA'), { entity_id: 'sub_a1', parent_id: 'found_a', country_id: 'CIV' });
    });
  });

  // (9) own → ALLOW. This FAILS if the rule still reads resource.data.id (the bug).
  it('A reads own org (entity_id match) → ALLOW', async () => {
    await assertSucceeds(getDoc(doc(founderA(), 'organizations', 'orgA')));
  });
  it('A reads child org (parent_id match) → ALLOW', async () => {
    await assertSucceeds(getDoc(doc(founderA(), 'organizations', 'childOfA')));
  });

  // (9) other entity → DENY
  it("A reads another entity's org → DENY", async () => {
    await assertFails(getDoc(doc(founderA(), 'organizations', 'orgB')));
  });

  // Holding sees all
  it('Holding reads any org → ALLOW', async () => {
    await assertSucceeds(getDoc(doc(holding(), 'organizations', 'orgB')));
  });

  // Country-scoped user sees same-country orgs
  it('country user reads same-country org → ALLOW', async () => {
    await assertSucceeds(getDoc(doc(countryUser(), 'organizations', 'orgB')));
  });

  // Writes restricted to Holding; delete to SUPER_ADMIN
  it('A creates/updates org → DENY (Holding-only)', async () => {
    await assertFails(setDoc(doc(founderA(), 'organizations', 'newOrg'), { entity_id: 'found_a', parent_id: 'holding_root' }));
    await assertFails(updateDoc(doc(founderA(), 'organizations', 'orgA'), { label: 'x' }));
  });
  it('Holding creates org → ALLOW', async () => {
    await assertSucceeds(setDoc(doc(holding(), 'organizations', 'newOrg'), { entity_id: 'found_z', parent_id: 'holding_root' }));
  });
  it('A deletes org → DENY; SUPER_ADMIN deletes → ALLOW', async () => {
    await assertFails(deleteDoc(doc(founderA(), 'organizations', 'orgA')));
    await assertSucceeds(deleteDoc(doc(superAdmin(), 'organizations', 'orgA')));
  });
});

// ════════════════════════════════════════════════════════════════════════════
// CROSS-CUTTING INVARIANT — accounting & audit_logs stay write-locked
// (defense-in-depth sanity: these must remain CF-only / immutable)
// ════════════════════════════════════════════════════════════════════════════
describe('immutable ledgers — client writes always denied', () => {
  it('client cannot write /accounting', async () => {
    await assertFails(setDoc(doc(superAdmin(), 'accounting', 'x'), { entity_id: 'holding_root', amount: 1 }));
  });
  it('client cannot write /audit_logs', async () => {
    await assertFails(setDoc(doc(superAdmin(), 'audit_logs', 'x'), { entity_id: 'holding_root', op: 'x' }));
  });
});

// Quick guard so the file fails loudly if the collection list drifts.
it('covers exactly the 7 foundation collections', () => {
  expect(FOUNDATION_COLLECTIONS).toHaveLength(7);
});
