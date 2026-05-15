/**
 * ════════════════════════════════════════════════════════════════════════════
 * CRÉATION DE 3 COMPTES TEST — Visualisation des 3 espaces (HOLDING/FILIALE/FOUNDATION)
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Exécution : cd functions && node ../scripts/create_3_test_users.cjs
 * (le `cd functions` garantit l'accès à firebase-admin déjà installé)
 *
 * Pré-requis : Application Default Credentials
 *   → gcloud auth application-default login    (une seule fois)
 *
 * Comptes créés (mot de passe identique : Test1234!) :
 *   1. holding@ipc.test     — Espace HOLDING
 *   2. filiale@ipc.test     — Espace FILIALE Sénégal
 *   3. foundation@ipc.test  — Espace FOUNDATION Sénégal
 */

const path  = require('path');
const admin = require(path.join(__dirname, '..', 'functions', 'node_modules', 'firebase-admin'));

admin.initializeApp({ projectId: 'ipc-erp' });

const auth = admin.auth();
const db   = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

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
      roles:          ['HOLDING_CEO'],
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
      allowedModules: ['home', 'foundation', 'connect', 'missions', 'profile', 'settings'],
      moduleAccess:   { home: 'write', foundation: 'write', connect: 'write' },
    },
  },
];

async function provisionPersona(p) {
  console.log(`\n──────────── [${p.label}] ${p.email} ────────────`);

  // 1. Auth — créer ou récupérer
  let uid;
  try {
    const u = await auth.getUserByEmail(p.email);
    uid = u.uid;
    console.log(`  [Auth] User existant (UID: ${uid}) — reset password`);
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

  // 2. Custom Claims
  const claims = {
    role:        p.role,
    entity_type: p.entity_type,
    entity_id:   p.entity_id,
  };
  if (p.country_id) claims.country_id = p.country_id;

  await auth.setCustomUserClaims(uid, claims);
  console.log(`  [Claims] Posés :`, claims);

  // 3. Firestore
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
    _createdAt: FieldValue.serverTimestamp(),
    _updatedAt: FieldValue.serverTimestamp(),
    _deletedAt: null,
    _provisioned_by_script: true,
  };

  await db.collection('users').doc(uid).set(userDoc, { merge: true });
  console.log(`  [Firestore] Document users/${uid} écrit`);

  return { uid, ...p };
}

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
    }
  }

  console.log('\n\n════════════════════════════════════════════════════════════');
  console.log('  COMPTES TEST PRÊTS — Identifiants :');
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
