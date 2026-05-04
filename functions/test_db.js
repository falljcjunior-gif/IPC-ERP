import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  credential: applicationDefault(),
  projectId: 'ipc-erp'
});

const db = getFirestore();

async function run() {
  const hrSnap = await db.collection('hr').where('_deletedAt', '==', null).get();
  console.log('HR docs with _deletedAt == null:', hrSnap.size);

  const hrSnap2 = await db.collection('hr').get();
  let countMissing = 0;
  hrSnap2.forEach(d => {
    if (d.data()._deletedAt === undefined) countMissing++;
  });
  console.log('HR docs with _deletedAt missing:', countMissing);
}

run();
