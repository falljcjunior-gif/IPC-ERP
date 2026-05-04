const admin = require('firebase-admin');

// Trying to initialize without explicit credentials
try {
  admin.initializeApp();
} catch (e) {
  console.log("Failed to initialize admin SDK", e);
  process.exit(1);
}

const db = admin.firestore();

async function run() {
  const docRef = db.collection('settings').doc('core');
  await docRef.set({
    currency: "FCFA",
    taxRates: { standard: 0.18 },
    companyName: "IPC Corp",
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log("Settings seeded!");
}

run().catch(e => console.error(e));
