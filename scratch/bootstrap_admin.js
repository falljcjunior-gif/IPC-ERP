/**
 * Bootstrap SUPER_ADMIN Custom Claim
 * ────────────────────────────────────
 * Ce script attribue le Custom Claim { role: 'SUPER_ADMIN' } au compte
 * fall.jcjunior@gmail.com via le SDK Admin Firebase.
 *
 * Utilisation : node scratch/bootstrap_admin.js
 * Pré-requis  : GOOGLE_APPLICATION_CREDENTIALS configuré (firebase login)
 */

const admin = require('firebase-admin');

// Initialisation avec les credentials Firebase par défaut (firebase login)
admin.initializeApp({
  projectId: 'ipc-erp',
});

const db = admin.firestore();
const auth = admin.auth();

const SUPER_ADMIN_EMAIL = 'fall.jcjunior@gmail.com';

async function bootstrap() {
  console.log('🔐 Bootstrap SUPER_ADMIN Custom Claim');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // 1. Récupérer l'utilisateur par email
    const user = await auth.getUserByEmail(SUPER_ADMIN_EMAIL);
    console.log(`✅ Utilisateur trouvé: ${user.uid} (${user.email})`);

    // 2. Vérifier si un SUPER_ADMIN existe déjà (idempotence)
    const existingToken = await auth.getUser(user.uid);
    if (existingToken.customClaims?.role === 'SUPER_ADMIN') {
      console.log('⚠️  Custom Claim SUPER_ADMIN déjà configuré. Aucune action nécessaire.');
      console.log(`   Claims actuels: ${JSON.stringify(existingToken.customClaims)}`);
      process.exit(0);
    }

    // 3. Attribuer le Custom Claim SUPER_ADMIN
    await auth.setCustomUserClaims(user.uid, { role: 'SUPER_ADMIN' });
    console.log(`✅ Custom Claim { role: 'SUPER_ADMIN' } attribué à ${user.uid}`);

    // 4. Synchroniser dans Firestore (pour l'affichage UI)
    await db.collection('users').doc(user.uid).set({
      role: 'SUPER_ADMIN',
      departement: 'DIRECTION',
      _claimsBootstrappedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log('✅ Profil Firestore synchronisé');

    // 5. Révoquer les tokens existants (force reconnexion pour appliquer les claims)
    await auth.revokeRefreshTokens(user.uid);
    console.log('✅ Tokens révoqués — reconnexion requise pour appliquer les nouveaux claims');

    // 6. Audit log
    await db.collection('audit_logs').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      operation: 'BOOTSTRAP_SUPER_ADMIN',
      uid: user.uid,
      email: SUPER_ADMIN_EMAIL,
      changedBy: 'bootstrap_script',
      summary: 'Custom Claim SUPER_ADMIN bootstrappé via script d\'initialisation sécurisé',
    });

    console.log('\n🎉 Bootstrap terminé avec succès !');
    console.log('   ➜ Reconnectez-vous dans l\'application pour activer les nouveaux droits.');
    process.exit(0);

  } catch (err) {
    console.error('❌ Erreur bootstrap:', err.message);
    process.exit(1);
  }
}

bootstrap();
