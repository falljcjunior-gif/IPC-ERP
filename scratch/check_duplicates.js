const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkDuplicates() {
  const hrSnap = await db.collection('hr').get();
  const employees = hrSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  console.log(`Total employees in 'hr': ${employees.length}`);
  employees.forEach(e => {
    console.log(`- ${e.nom || e.email} (ID: ${e.id})`);
  });
}

checkDuplicates().catch(console.error);
