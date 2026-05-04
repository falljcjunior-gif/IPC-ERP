const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json'); // assuming it exists, or use default

if (!admin.apps.length) {
    // We assume the environment is set up. Let's try default credential
    try {
        admin.initializeApp({
           credential: admin.credential.applicationDefault()
        });
    } catch (e) {
        // Fallback
    }
}

async function seed() {
    const db = admin.firestore();
    const docRef = db.collection('settings').doc('core');
    const doc = await docRef.get();
    if (!doc.exists) {
        await docRef.set({
            currency: 'FCFA',
            taxRates: {
                standard: 0.18,
                reduced: 0.09
            },
            company: {
                name: 'IPC',
                address: 'Abidjan, Côte d\'Ivoire',
                registrationNumber: 'CI-ABJ-2024-B-XXXX'
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('Core settings seeded successfully.');
    } else {
        console.log('Core settings already exist.');
    }
}
seed().catch(console.error);
