import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

initializeApp({ projectId: 'ipc-erp' });

async function check() {
  try {
    const user = await getAuth().getUserByEmail('fall.jcjunior@gmail.com');
    const db = getFirestore();
    const doc = await db.collection('users').doc(user.uid).get();
    console.log("Firestore Role:", doc.data().role);
  } catch(e) {
    console.error(e.message);
  }
}
check();
