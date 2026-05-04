import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  credential: applicationDefault(),
  projectId: 'ipc-erp'
});

const db = getFirestore();

async function run() {
  const uid = 'Ii8G2Ad6GyUxaS63ecrzeaE6l883'; 
  const doc = await db.collection('users').doc(uid).get();
  console.log('User exists:', doc.exists);
  if (doc.exists) {
    console.log(doc.data());
  }
}
run();
