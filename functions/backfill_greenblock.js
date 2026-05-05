/**
 * ══════════════════════════════════════════════════════════════
 * IPC GREEN BLOCK — BACKFILL SCRIPT
 * Synchronisation massive de l'historique Firestore vers PostgreSQL
 * ══════════════════════════════════════════════════════════════
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import axios from 'axios';

// --- CONFIGURATION ---
const GREENBLOCK_URL = process.env.GREENBLOCK_API_URL || 'https://greenblock.ipc-platform.com/rest';
const GREENBLOCK_KEY = process.env.GREENBLOCK_API_KEY;

if (!GREENBLOCK_KEY) {
  console.error('❌ ERREUR : GREENBLOCK_API_KEY non définie.');
  process.exit(1);
}

initializeApp({
  credential: applicationDefault(),
  projectId: 'ipc-erp'
});

const db = getFirestore();

// --- MAPPING DES COLLECTIONS ---
const COLLECTIONS_TO_SYNC = [
  { collection: 'users',            model: 'com.ipc.greenblock.base.db.Partner' },
  { collection: 'crm_clients',      model: 'com.ipc.greenblock.base.db.Partner' },
  { collection: 'finance_invoices',  model: 'com.ipc.greenblock.finance.db.Invoice' },
  { collection: 'hr_expenses',      model: 'com.ipc.greenblock.hr.db.Expense' },
  { collection: 'inventory_products', model: 'com.ipc.greenblock.product.db.ProductTemplate' }
];

async function backfill() {
  console.log('🚀 Démarrage du Backfill Green Block...');
  
  for (const item of COLLECTIONS_TO_SYNC) {
    console.log(`\n📂 Traitement de la collection : ${item.collection} -> ${item.model}`);
    
    const snap = await db.collection(item.collection).get();
    console.log(`📊 ${snap.size} documents trouvés.`);

    let successCount = 0;
    let errorCount = 0;

    for (const doc of snap.docs) {
      const data = doc.data();
      const id = doc.id;

      try {
        // Envoi vers Green Block
        const response = await axios.post(`${GREENBLOCK_URL}/${item.model}`, data, {
          headers: { 
            'X-API-KEY': GREENBLOCK_KEY,
            'Content-Type': 'application/json',
            'X-Source-ID': id,
            'X-Backfill': 'true'
          },
          timeout: 10000
        });

        // Log de succès dans Firestore
        await db.collection('system_sync_logs').add({
          timestamp: FieldValue.serverTimestamp(),
          sourceId: id,
          model: item.model,
          status: 'BACKFILL_SUCCESS',
          statusCode: response.status,
          type: 'backfill'
        });

        successCount++;
        process.stdout.write('.'); // Progrès visuel
      } catch (error) {
        const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
        
        await db.collection('system_sync_logs').add({
          timestamp: FieldValue.serverTimestamp(),
          sourceId: id,
          model: item.model,
          status: 'BACKFILL_ERROR',
          errorMessage: errorMsg,
          type: 'backfill'
        });

        errorCount++;
        console.error(`\n❌ Erreur sur ${id} : ${errorMsg}`);
      }
    }

    console.log(`\n✅ Terminé pour ${item.collection} : ${successCount} succès, ${errorCount} erreurs.`);
  }

  console.log('\n🏁 Backfill global terminé.');
}

backfill().catch(err => {
  console.error('💥 Erreur fatale lors du backfill :', err);
  process.exit(1);
});
