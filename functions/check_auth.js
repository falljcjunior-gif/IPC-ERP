import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

initializeApp({
  credential: applicationDefault(),
  projectId: 'ipc-erp'
});

const auth = getAuth();

async function run() {
  const list = await auth.listUsers();
  list.users.forEach(u => {
    console.log(u.uid, u.email);
  });
}

run();
