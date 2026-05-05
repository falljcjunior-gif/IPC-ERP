const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // I'll check if this exists or use default

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(), // Try application default first
    projectId: 'ipc-erp'
  });
}

const db = admin.firestore();

async function checkHR() {
  const snapshot = await db.collection('hr').limit(10).get();
  console.log('HR Docs Count:', snapshot.size);
  snapshot.forEach(doc => {
    console.log(doc.id, '=>', doc.data());
  });
}

checkHR().catch(console.error);
