import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  credential: applicationDefault(),
  projectId: 'ipc-erp'
});

const db = getFirestore();

async function run() {
  const hrSnap = await db.collection('hr').get();
  
  for (const hrDoc of hrSnap.docs) {
    const correctUid = hrDoc.id;
    const hrData = hrDoc.data();
    
    // 1. Fix HR doc internal id
    if (hrData.id !== correctUid) {
      console.log(`Fixing HR doc internal id for ${hrData.email}: ${hrData.id} -> ${correctUid}`);
      await hrDoc.ref.update({ id: correctUid });
    }

    // 2. Create/Update USERS doc with correct UID
    const userRef = db.collection('users').doc(correctUid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.log(`Creating missing USERS doc for ${hrData.email} at correct UID: ${correctUid}`);
      await userRef.set({
        _createdAt: new Date(),
        _deletedAt: null,
        role: hrData.role || 'GUEST',
        permissions: hrData.permissions || { roles: [hrData.role || 'GUEST'], moduleAccess: {} },
        profile: {
          id: correctUid,
          email: hrData.email,
          nom: hrData.nom || '',
          avatar: hrData.avatar || ''
        }
      });
    } else {
      console.log(`USERS doc already exists for ${hrData.email} at ${correctUid}. Ensuring _deletedAt is null.`);
      await userRef.update({ _deletedAt: null });
    }
  }

  // 3. Cleanup old/wrong user docs if they exist
  const wrongUids = ['QvRyHdsK8mWZRt8X4hvTY0htWfz1', 'AFZt8HSsQWW5pKfPe7eDm4A5Pyk1'];
  for (const uid of wrongUids) {
    const doc = await db.collection('users').doc(uid).get();
    if (doc.exists) {
      console.log(`Deleting wrong USERS doc: ${uid}`);
      await db.collection('users').doc(uid).delete();
    }
  }

  console.log('Final fix complete.');
}
run();
