const admin = require('firebase-admin');

admin.initializeApp({
  projectId: 'ipc-erp'
});

const auth = admin.auth();

async function reset() {
  try {
    const user = await auth.getUserByEmail('fall.jcjunior@gmail.com');
    await auth.updateUser(user.uid, {
      password: 'password123'
    });
    console.log('Successfully updated user password');
  } catch (error) {
    console.error('Error updating user password:', error);
  }
}

reset();
