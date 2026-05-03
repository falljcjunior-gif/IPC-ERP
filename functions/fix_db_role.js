import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

initializeApp({ projectId: 'ipc-erp' });

async function fix() {
  try {
    const user = await getAuth().getUserByEmail('fall.jcjunior@gmail.com');
    const db = getFirestore();
    await db.collection('users').doc(user.uid).set({ role: 'SUPER_ADMIN' }, { merge: true });
    console.log("Firestore Role successfully forced to SUPER_ADMIN.");
  } catch(e) {
    console.error(e.message);
  }
}
fix();
