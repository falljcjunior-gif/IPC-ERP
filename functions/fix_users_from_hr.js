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
    const hrData = hrDoc.data();
    const uid = hrData.id;
    if (!uid) continue;

    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.log(`Creating missing users doc for: ${hrData.email} (${uid})`);
      
      const permissions = hrData.permissions || {
        roles: hrData.role === 'SUPER_ADMIN' ? ['SUPER_ADMIN'] : [hrData.role || 'GUEST'],
        moduleAccess: hrData.permissions?.moduleAccess || {}
      };
      
      await userRef.set({
        _createdAt: new Date(),
        _deletedAt: null,
        role: hrData.role || 'GUEST',
        permissions: permissions,
        profile: {
          id: uid,
          email: hrData.email,
          nom: hrData.nom || '',
          avatar: hrData.avatar || ''
        }
      });
    } else {
       console.log(`User doc already exists for: ${hrData.email} (${uid})`);
       // Ensure role and permissions are synced
       const userData = userDoc.data();
       if (!userData.role && hrData.role) {
         console.log(`Syncing role ${hrData.role} to users doc for ${hrData.email}`);
         await userRef.update({ role: hrData.role, permissions: hrData.permissions });
       }
    }
  }
  console.log('Sync complete.');
}
run();
