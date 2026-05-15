/**
 * ════════════════════════════════════════════════════════════════════════════
 * CRÉATION DE 3 COMPTES TEST — Visualisation des 3 espaces
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Crée (ou met à jour) 3 utilisateurs Firebase Auth + Firestore pour permettre
 * de visualiser les 3 espaces de l'ERP :
 *   1. HOLDING    — Vue groupe complète (gouvernance, consolidation, licensing)
 *   2. FILIALE    — Vue opérationnelle scopée (CRM, ventes, prod, RH locale)
 *   3. FOUNDATION — Vue mission/impact (programmes, bénéficiaires, ESG)
 *
 * USAGE :
 *   1. Assurez-vous d'avoir Application Default Credentials configurées :
 *        gcloud auth application-default login
 *      OU placez un serviceAccountKey.json dans le dossier scripts/ et
 *      décommentez les lignes correspondantes ci-dessous.
 *
 *   2. Lancez le script :
 *        node scripts/create_3_test_users.js
 *
 *   3. Les 3 comptes sont affichés à l'écran avec leurs identifiants.
 *      Le mot de passe par défaut est `Test1234!` (modifiable ci-dessous).
 *
 * SÉCURITÉ :
 *   Ces comptes sont en `emailVerified: true` pour bypass l'écran de vérif.
 *   Les Custom Claims (`role`, `entity_type`, `entity_id`, `country_id`) sont
 *   posés directement via Admin SDK — les règles Firestore les utiliseront
 *   immédiatement.
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth }       from 'firebase-admin/auth';
import { getFirestore, FieldValue }  from 'firebase-admin/firestore';

// ── Options d'initialisation ────────────────────────────────────────────────
const appOptions = { projectId: 'ipc-erp' };

// Si vous utilisez un serviceAccountKey.json local, décommentez :
// import { readFileSync } from 'fs';
// const serviceAccount = JSON.parse(readFileSync('./scripts/serviceAccountKey.json'));
// appOptions.credential = cert(serviceAccount);

const app  = initializeApp(appOptions);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── Configuration des 3 personas ────────────────────────────────────────────
const DEFAULT_PASSWORD = 'Test1234!';

const PERSONAS = [
  {
    label:         'HOLDING',
    email:         'holding@ipc.test',
    displayName:   'DG Holding (Test)',
    role:          'HOLDING_CEO',
    entity_type:   'HOLDING',
    entity_id:     'ipc_holding',
    entity_name:   'IPC Holding',
    country_id:    null,
    hierarchy_level: 'CEO',
    permissions: {
      roles:         ['HOLDING_CEO'],
      allowedModules: ['home', 'holding', 'connect', 'missions', 'profile', 'settings'],
      moduleAccess:   { home: 'write', holding: 'write', connect: 'write' },
    },
  },
  {
    label:         'FILIALE',
    email:         'filiale@ipc.test',
    displayName:   'Directeur Filiale Sénégal (Test)',
    role:          'COUNTRY_DIRECTOR_SUBSIDIARY',
    entity_type:   'SUBSIDIARY',
    entity_id:     'ipc_senegal',
    entity_name:   'IPC Filiale Sénégal',
    country_id:    'SN',
    hierarchy_level: 'Director',
    permissions: {
      roles:          ['COUNTRY_DIRECTOR_SUBSIDIARY'],
      allowedModules: [
        'home', 'subsidiary', 'crm', 'sales', 'finance', 'hr', 'inventory',
        'production', 'logistics', 'projects', 'connect', 'missions', 'profile', 'settings',
      ],
      moduleAccess: {
        home: 'write', subsidiary: 'write', crm: 'write', sales: 'write',
        finance: 'write', hr: 'write', inventory: 'write', production: 'write',
        logistics: 'write', projects: 'write', connect: 'write',
      },
    },
  },
  {
    label:         'FOUNDATION',
    email:         'foundation@ipc.test',
    displayName:   'Directeur Foundation Sénégal (Test)',
    role:          'COUNTRY_DIRECTOR_FOUNDATION',
    entity_type:   'FOUNDATION',
    entity_id:     'ipc_foundation_senegal',
    entity_name:   'IPC Foundation Sénégal',
    country_id:    'SN',
    hierarchy_level: 'Director',
    permissions: {
      roles:          ['COUNTRY_DIRECTOR_FOUNDATION'],
      allowedModules: [
        'home', 'foundation', 'connect', 'missions', 'profile', 'settings',
      ],
      moduleAccess: {
        home: 'write', foundation: 'write', connect: 'write',
      },
    },
  },
];

// ── Création/mise à jour d'un user ──────────────────────────────────────────
async function provisionPersona(p) {
  console.log(`\n──────────── [${p.label}] ${p.email} ────────────`);

  // 1. Auth — créer ou récupérer
  let uid;
  try {
    const u = await auth.getUserByEmail(p.email);
    uid = u.uid;
    console.log(`  [Auth] User existant (UID: ${uid}) — reset password + displayName`);
    await auth.updateUser(uid, {
      password:      DEFAULT_PASSWORD,
      displayName:   p.displayName,
      emailVerified: true,
    });
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      console.log(`  [Auth] Création nouvel utilisateur…`);
      const newUser = await auth.createUser({
        email:         p.email,
        password:      DEFAULT_PASSWORD,
        displayName:   p.displayName,
        emailVerified: true,
      });
      uid = newUser.uid;
      console.log(`  [Auth] Créé avec UID ${uid}`);
    } else {
      throw e;
    }
  }

  // 2. Custom Claims — pose directe (immuable côté client)
  const claims = {
    role:        p.role,
    entity_type: p.entity_type,
    entity_id:   p.entity_id,
    country_id:  p.country_id,
  };
  // Nettoyer les nulls (Firebase exige des values définies)
  Object.keys(claims).forEach(k => claims[k] == null && delete claims[k]);

  await auth.setCustomUserClaims(uid, claims);
  console.log(`  [Claims] Posés :`, claims);

  // 3. Firestore — document users/{uid}
  const userDoc = {
    uid,
    email:           p.email,
    nom:             p.displayName,
    role:            p.role,
    entity_type:     p.entity_type,
    entity_id:       p.entity_id,
    entity_name:     p.entity_name,
    country_id:      p.country_id,
    hierarchy_level: p.hierarchy_level,
    permissions:     p.permissions,
    profile: {
      active:             true,
      mustChangePassword: false,
      createdAt:          new Date().toISOString(),
    },
    _createdAt:  FieldValue.serverTimestamp(),
    _updatedAt:  FieldValue.serverTimestamp(),
    _deletedAt:  null,
    _provisioned_by_script: true,
  };

  await db.collection('users').doc(uid).set(userDoc, { merge: true });
  console.log(`  [Firestore] Document users/${uid} écrit`);

  return { uid, ...p };
}

// ── Main ────────────────────────────────────────────────────────────────────
(async () => {
  console.log('════════════════════════════════════════════════════════════');
  console.log('  IPC-ERP — Création des 3 comptes test (3 espaces)');
  console.log('════════════════════════════════════════════════════════════');

  const results = [];
  for (const p of PERSONAS) {
    try {
      const r = await provisionPersona(p);
      results.push(r);
    } catch (err) {
      console.error(`\n[ERREUR] Provisioning ${p.email} échoué :`, err.message);
      console.error(err);
    }
  }

  // ── Résumé ────────────────────────────────────────────────────────────────
  console.log('\n\n════════════════════════════════════════════════════════════');
  console.log('  ✓ COMPTES TEST PRÊTS — Identifiants :');
  console.log('════════════════════════════════════════════════════════════\n');

  results.forEach(r => {
    console.log(`  ${r.label.padEnd(11)} │ ${r.email}`);
    console.log(`              │ Password : ${DEFAULT_PASSWORD}`);
    console.log(`              │ Role     : ${r.role}`);
    console.log(`              │ Scope    : entity_id=${r.entity_id}${r.country_id ? `, country_id=${r.country_id}` : ''}`);
    console.log('');
  });

  console.log('────────────────────────────────────────────────────────────');
  console.log('  Connectez-vous sur https://ipc-erp.web.app (ou localhost:5173)');
  console.log('  avec chaque email pour voir le rendu de chaque espace.');
  console.log('────────────────────────────────────────────────────────────\n');

  process.exit(0);
})().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
