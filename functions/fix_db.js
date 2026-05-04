import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

initializeApp({
  credential: applicationDefault(),
  projectId: 'ipc-erp'
});

async function run() {
  const listUsersResult = await getAuth().listUsers(1000);
  listUsersResult.users.forEach((userRecord) => {
    console.log(userRecord.uid, userRecord.email);
  });
}
run();
