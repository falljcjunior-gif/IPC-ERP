const { adminDb } = require('../firebase-admin-local.js');

/**
 * Migration script for HR 2.0
 * Moves data from the legacy 'hr' root collection into the unified 'users' collection.
 */
async function migrateToHR2() {
  console.log('🚀 Starting HR 2.0 Migration...');
  
  const hrSnap = await adminDb.collection('hr').get();
  console.log(`Found ${hrSnap.size} legacy HR records.`);
  
  let count = 0;
  let batch = adminDb.batch();

  for (const doc of hrSnap.docs) {
    const hrData = doc.data();
    const uid = doc.id; 
    
    if (!uid) continue;

    console.log(`Migrating UID: ${uid} (${hrData.nom || 'Unknown'})`);

    const userRef = adminDb.collection('users').doc(uid);
    const userSnap = await userRef.get();
    
    // 1. Prepare Public Payload
    const publicFields = {
      poste: hrData.poste || '',
      dept: hrData.dept || '',
      contratType: hrData.contratType || '',
      date_entree: hrData.date_entree || null,
      updatedAt: new Date().toISOString(),
      _isMigratedHR2: true
    };

    if (!userSnap.exists) {
      publicFields.nom = hrData.nom || '';
      publicFields.email = hrData.email || '';
      publicFields.role = hrData.role || 'Employee';
      batch.set(userRef, publicFields, { merge: true });
    } else {
      batch.update(userRef, publicFields);
    }

    // 2. Prepare Private Payload
    const privateFields = {
      salaire: hrData.salaire || 0,
      iban: hrData.iban || '',
      ssn: hrData.ssn || '',
      rib: hrData.rib || '',
      lastModified: new Date().toISOString()
    };

    const privateRef = userRef.collection('hr_private').doc('main');
    batch.set(privateRef, privateFields, { merge: true });

    count++;
    
    if (count % 400 === 0) {
      await batch.commit();
      batch = adminDb.batch();
      console.log(`Committed ${count} records...`);
    }
  }

  await batch.commit();
  console.log(`✅ HR 2.0 Migration Complete. Migrated ${count} users.`);
}

migrateToHR2().catch(console.error);
