
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkData() {
  console.log('--- USERS ---');
  const usersSnap = await db.collection('users').limit(5).get();
  usersSnap.forEach(doc => {
    console.log(doc.id, doc.data());
  });

  console.log('\n--- HR ---');
  const hrSnap = await db.collection('hr').limit(5).get();
  hrSnap.forEach(doc => {
    console.log(doc.id, doc.data());
  });
}

checkData().catch(console.error);
