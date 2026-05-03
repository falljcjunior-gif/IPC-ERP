import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

initializeApp({ projectId: 'ipc-erp' });

async function check() {
  try {
    const user = await getAuth().getUserByEmail('fall.jcjunior@gmail.com');
    console.log("User Claims:", user.customClaims);
  } catch(e) {
    console.error(e.message);
  }
}
check();
