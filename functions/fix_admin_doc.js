import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  credential: applicationDefault(),
  projectId: 'ipc-erp'
});

const db = getFirestore();

async function run() {
  const adminUid = 'Ii8G2Ad6GyUxaS63ecrzeaE6l883'; // fall.jcjunior@gmail.com
  
  const userDoc = await db.collection('users').doc(adminUid).get();
  console.log('Admin user doc exists:', userDoc.exists);
  
  if (!userDoc.exists) {
    console.log('Creating admin user doc...');
    await db.collection('users').doc(adminUid).set({
      _createdAt: new Date(),
      _deletedAt: null,
      role: 'SUPER_ADMIN',
      permissions: { roles: ['SUPER_ADMIN'], allowedModules: ['home'] },
      profile: {
        id: adminUid,
        email: 'fall.jcjunior@gmail.com',
        nom: 'Utilisateur',
        createdAt: new Date().toISOString()
      }
    });
  }

  const hrDoc = await db.collection('hr').doc(adminUid).get();
  console.log('Admin hr doc exists:', hrDoc.exists);

  if (!hrDoc.exists) {
    console.log('Creating admin hr doc...');
    await db.collection('hr').doc(adminUid).set({
      _createdAt: new Date(),
      _deletedAt: null,
      id: adminUid,
      email: 'fall.jcjunior@gmail.com',
      nom: 'Utilisateur',
      subModule: 'employees'
    });
  }
}
run();
