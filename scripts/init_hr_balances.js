import admin from 'firebase-admin';

// Remplacez par le chemin vers la clé de service Firebase si nécessaire
// const serviceAccount = require('./serviceAccountKey.json');
// admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
// OU si exécuté via le terminal avec l'authentification gcloud :
admin.initializeApp();

const db = admin.firestore();

async function initHRBalances() {
  console.log('🚀 Début de la migration : Initialisation des soldes de congés...');
  
  try {
    const usersSnap = await db.collection('users').get();
    let batch = db.batch();
    let count = 0;
    let totalUpdated = 0;

    for (const doc of usersSnap.docs) {
      const data = doc.data();
      
      // On initialise le solde uniquement si le user a un champ hr ou si on veut forcer
      // Ici, on initialise pour tout le monde avec 30 jours (solde standard par défaut)
      // et 0 RTT par défaut.
      if (data.hr && (data.hr.solde_conges === undefined || data.hr.solde_rtt === undefined)) {
        batch.update(doc.ref, {
          'hr.solde_conges': data.hr.solde_conges !== undefined ? data.hr.solde_conges : 30, // 30 jours initiaux
          'hr.solde_rtt': data.hr.solde_rtt !== undefined ? data.hr.solde_rtt : 0
        });

        count++;
        totalUpdated++;

        // Les batch Firebase sont limités à 500 opérations
        if (count === 450) {
          await batch.commit();
          console.log(`✅ ${totalUpdated} utilisateurs mis à jour...`);
          batch = db.batch(); // on recrée un batch
          count = 0;
        }
      }
    }

    if (count > 0) {
      await batch.commit();
      console.log(`✅ ${totalUpdated} utilisateurs mis à jour...`);
    }

    console.log('🎉 Migration terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  }
}

initHRBalances();
