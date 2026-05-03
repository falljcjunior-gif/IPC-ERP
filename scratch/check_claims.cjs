const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'ipc-erp' });

async function check() {
  try {
    const user = await admin.auth().getUserByEmail('fall.jcjunior@gmail.com');
    console.log("User Claims:", user.customClaims);
  } catch(e) {
    console.error(e.message);
  }
}
check();
