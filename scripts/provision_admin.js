import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Tente de trouver des identifiants (sinon utilise l'Application Default Credentials gcloud)
let appOptions = { projectId: 'ipc-erp' };

// Si vous avez un compte de service local (ex: serviceAccountKey.json), décommentez ceci :
// const serviceAccount = require('./serviceAccountKey.json');
// appOptions.credential = cert(serviceAccount);

const app = initializeApp(appOptions);
const auth = getAuth(app);
const db = getFirestore(app);

async function provisionAdmin() {
  const email = 'admin@ipc.com';
  const password = 'IPC-Admin-2024';
  const displayName = 'IPC System Admin';
  let uid;

  console.log(`[Provisioning] Démarrage pour ${email}...`);

  try {
    try {
      const userRecord = await auth.getUserByEmail(email);
      uid = userRecord.uid;
      console.log(`[Auth] Utilisateur trouvé (UID: ${uid}). Mise à jour du mot de passe...`);
      await auth.updateUser(uid, { password, displayName });
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        console.log(`[Auth] Utilisateur non trouvé. Création de ${email}...`);
        const newUser = await auth.createUser({ email, password, displayName, emailVerified: true });
        uid = newUser.uid;
      } else {
        throw e;
      }
    }

    console.log(`[Auth] Utilisateur ${email} prêt (UID: ${uid}). Mise à jour des claims (SuperAdmin)...`);
    
    // Définir les Custom Claims pour le bypass des Security Rules
    await auth.setCustomUserClaims(uid, { 
      admin: true,
      role: 'SuperAdmin',
      hierarchy_level: 'Director'
    });

    console.log(`[Firestore] Écriture du document utilisateur...`);
    const userRef = db.collection('users').doc(uid);
    await userRef.set({
      email,
      nom: displayName,
      role: 'SuperAdmin',
      permissions: {
        hierarchy_level: 'Director',
        modules: {
          hr: 'write',
          crm: 'write',
          sales: 'write',
          production: 'write',
          logistics: 'write',
          finance: 'write'
        }
      },
      createdAt: new Date().toISOString()
    }, { merge: true });

    console.log(`✅ [SUCCÈS] Utilisateur ${email} provisionné avec succès ! Vous pouvez maintenant lancer Playwright.`);
    process.exit(0);

  } catch (error) {
    console.error(`❌ [ERREUR] Impossible de provisionner l'utilisateur :`, error);
    process.exit(1);
  }
}

provisionAdmin();
