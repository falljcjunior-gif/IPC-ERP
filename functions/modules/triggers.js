const { onDocumentWritten, onDocumentUpdated, onDocumentDeleted } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const axelor = require('./axelor');

const db = admin.firestore();

// ... (Audit, Finance, Production triggers unchanged)

/**
 * 🧹 CLEANUP: WEBRTC SIGNALS — Hourly Cleanup
 * WHY: Les signaux WebRTC s'accumulent dans rooms/{id}/signals et ne sont plus utiles après l'appel.
 * Évite l'inflation de la base de données et les coûts de lecture inutiles.
 */
exports.cleanupOldWebRTCSignals = onSchedule('every 1 hours', async (event) => {
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);
  const cutoff = admin.firestore.Timestamp.fromDate(oneHourAgo);

  try {
    const roomsSnap = await db.collection('rooms').get();
    let totalDeleted = 0;

    for (const roomDoc of roomsSnap.docs) {
      const signalsRef = roomDoc.ref.collection('signals');
      const oldSignalsSnap = await signalsRef.where('createdAt', '<', cutoff).get();
      
      if (oldSignalsSnap.empty) continue;

      const batch = db.batch();
      oldSignalsSnap.docs.forEach(doc => {
        batch.delete(doc.ref);
        totalDeleted++;
      });
      await batch.commit();
    }

    logger.info(`[Cleanup] WebRTC Signals: ${totalDeleted} documents supprimés.`);
  } catch (err) {
    logger.error('[Cleanup] WebRTC Signals Error:', err);
  }
});

/**
 * 🧹 CLEANUP: ROOM DELETION — Recursive sub-collection cleanup
 */
exports.onRoomDeleted = onDocumentDeleted('rooms/{roomId}', async (event) => {
  const { roomId } = event.params;
  const roomRef = event.data.ref;

  try {
    // Nettoyage des participants
    const participantsSnap = await roomRef.collection('participants').get();
    const pBatch = db.batch();
    participantsSnap.docs.forEach(d => pBatch.delete(d.ref));
    await pBatch.commit();

    // Nettoyage des signaux
    const signalsSnap = await roomRef.collection('signals').get();
    const sBatch = db.batch();
    signalsSnap.docs.forEach(d => sBatch.delete(d.ref));
    await sBatch.commit();

    logger.info(`[Cleanup] Room ${roomId} sub-collections puritées.`);
  } catch (err) {
    logger.error(`[Cleanup] Room ${roomId} Error:`, err);
  }
});

/**
 * ══════════════════════════════════════════════════════════════
 * SECURITY: GLOBAL AUDIT TRAIL — Hardened
 * ══════════════════════════════════════════════════════════════
 */
const SENSITIVE_COLLECTIONS = ['finance', 'inventory', 'users', 'hr', 'sales_leads', 'production_orders'];

exports.globalAuditTrigger = onDocumentWritten('{collection}/{docId}', async (event) => {
  const { collection, docId } = event.params;
  
  // Hardened check: matches both base names and domain-prefixed collections (e.g., finance, finance_invoices)
  const isSensitive = SENSITIVE_COLLECTIONS.some(domain => 
    collection === domain || collection.startsWith(`${domain}_`)
  );

  if (!isSensitive) return null;

  const beforeData = event.data.before.exists ? event.data.before.data() : null;
  const afterData = event.data.after.exists ? event.data.after.data() : null;
  
  let operation = 'UPDATE';
  if (!beforeData) operation = 'CREATE';
  if (!afterData) operation = 'DELETE';

  const auditRecord = {
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    appId: collection.split('_')[0], // Normalize (e.g., finance_invoices -> finance)
    docId,
    action: operation,
    userName: afterData?._updatedBy || afterData?._createdBy || 'system_trigger',
    details: `${operation} on ${collection}/${docId}`,
    metadata: {
      eventId: event.id,
      traceId: event.traceparent || null,
      originalCollection: collection
    }
  };

  try {
    await db.collection('audit_logs').add(auditRecord);
    logger.info(`Audit log created for ${collection}/${docId}`);
  } catch (err) {
    logger.error('Audit Log Error:', err);
  }
  return null;
});

/**
 * 💹 FINANCE: AUTOMATED ACCOUNTING — Hardened with Idempotency
 */
exports.syncAccountingOnInvoicePaid = onDocumentUpdated('finance_invoices/{invoiceId}', async (event) => {
  const newData = event.data.after.data();
  const oldData = event.data.before.data();
  const { invoiceId } = event.params;

  // Trigger only on status change to 'paid'
  if (newData.status === 'paid' && oldData.status !== 'paid') {
    const amount = newData.amountTTC || newData.amount || 0;
    
    // Idempotency check: use a deterministic ID based on invoiceId
    const accountingId = `ACC_INV_${invoiceId}`;
    const accountingRef = db.collection('finance_accounting').doc(accountingId);

    try {
      await db.runTransaction(async (t) => {
        const existingDoc = await t.get(accountingRef);
        if (existingDoc.exists) {
          logger.warn(`Accounting record ${accountingId} already exists. Skipping.`);
          return;
        }

        const entry = {
          num: newData.num || `INV-${invoiceId.substring(0, 8)}`,
          libelle: `Règlement Facture #${newData.num || invoiceId}`,
          date: admin.firestore.FieldValue.serverTimestamp(),
          debit: amount,
          credit: amount,
          invoiceId: invoiceId,
          _domain: 'finance',
          _createdBy: 'nexus_engine_trigger',
          _processedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        t.set(accountingRef, entry);
      });
      
      // SSOT Synchronization
      await axelor.syncRecord('com.axelor.apps.account.db.AccountMove', {
        name: `INV-${invoiceId}`,
        amount: amount,
        ref: invoiceId
      }, invoiceId);

      logger.info(`Accounting synced for invoice ${invoiceId}`);
    } catch (err) {
      logger.error('Accounting Sync Error:', err);
    }
  }
  return null;
});

/**
 * 🧱 PRODUCTION: INVENTORY AUTO-SYNC — Hardened with Transactions
 */
exports.updateStockOnProductionComplete = onDocumentUpdated('production_orders/{ofId}', async (event) => {
  const newData = event.data.after.data();
  const oldData = event.data.before.data();
  const { ofId } = event.params;

  if (newData.status === 'completed' && oldData.status !== 'completed') {
    const productId = newData.productId;
    const quantity = newData.quantityProduced || newData.quantity || 0;
    
    if (!productId) {
      logger.error(`Missing productId in production order ${ofId}`);
      return null;
    }

    const productRef = db.collection('inventory_products').doc(productId);

    try {
      await db.runTransaction(async (t) => {
        const doc = await t.get(productRef);
        if (!doc.exists) {
          logger.error(`Product ${productId} not found for OF ${ofId}`);
          return;
        }

        const currentStock = doc.data().stockActuel || 0;
        t.update(productRef, { 
          stockActuel: currentStock + quantity,
          lastRefillAt: admin.firestore.FieldValue.serverTimestamp(),
          lastOfProcessed: ofId
        });
      });

      // SSOT Synchronization
      await axelor.syncRecord('com.axelor.apps.stock.db.StockMove', {
        productId,
        quantity,
        origin: ofId,
        type: 'PRODUCTION'
      }, ofId);

      logger.info(`Stock updated for product ${productId} (+${quantity}) from OF ${ofId}`);
    } catch (err) {
      logger.error('Stock Update Error:', err);
    }
  }
  return null;
});

/**
 * 🤖 BUTLER: TASK ASSIGNMENT NOTIFICATIONS
 * WHY: Informe instantanément les collaborateurs quand une tâche leur est assignée.
 */
exports.onTaskAssigned = onDocumentWritten('projects/{taskId}', async (event) => {
  const newData = event.data.after.exists ? event.data.after.data() : null;
  const oldData = event.data.before.exists ? event.data.before.data() : null;

  if (!newData || newData.subModule !== 'tasks') return null;

  // Détection de nouveaux membres assignés
  const newMembres = newData.membresId || [];
  const oldMembres = oldData?.membresId || [];
  
  const addedMembres = newMembres.filter(m => !oldMembres.includes(m));

  if (addedMembres.length > 0) {
    try {
      for (const userName of addedMembres) {
        const userSnap = await db.collection('users').where('nom', '==', userName).limit(1).get();
        
        if (!userSnap.empty) {
          const userData = userSnap.docs[0].data();
          const fcmToken = userData.fcmToken;

          if (fcmToken) {
            const message = {
              notification: {
                title: '📌 Nouvelle tâche assignée',
                body: `Tâche : ${newData.titre || newData.nom} dans ${newData.projet}`
              },
              data: {
                appId: 'projects',
                taskId: event.params.taskId
              },
              token: fcmToken
            };

            await admin.messaging().send(message);
          }
        }
      }
    } catch (err) {
      logger.error('Task Notification Error:', err);
    }
  }

  // Détection de demande d'alerte Manager (Butler)
  if (newData._notifyManagerRequested && !oldData?._notifyManagerRequested) {
    try {
      // Le manager est le chef de projet du projet parent
      // On cherche le projet pour trouver le chef de projet
      const projectsSnap = await db.collection('projects')
        .where('subModule', '==', 'projects')
        .where('nom', '==', newData.projet)
        .limit(1)
        .get();

      if (!projectsSnap.empty) {
        const projectData = projectsSnap.docs[0].data();
        const managerName = projectData.chefProjet;

        if (managerName) {
          const userSnap = await db.collection('users').where('nom', '==', managerName).limit(1).get();
          if (!userSnap.empty) {
            const userData = userSnap.docs[0].data();
            const fcmToken = userData.fcmToken;

            if (fcmToken) {
              await admin.messaging().send({
                notification: {
                  title: '🤖 Alerte Butler : ' + newData.projet,
                  body: `Action requise sur : ${newData.nom} (Déplacé vers ${newData.colonneId})`
                },
                token: fcmToken
              });
            }
          }
        }
      }
      
      // On nettoie le flag pour éviter les boucles (optionnel si on compare avec oldData)
      // await event.data.after.ref.update({ _notifyManagerRequested: false });
    } catch (err) {
      logger.error('Manager Notification Error:', err);
    }
  }

  return null;
});


/**
 * 🤖 BUTLER: PROJECT AUTO-TAGGING
 * WHY: Catégorise automatiquement les chantiers selon leur envergure budgétaire.
 */
exports.onProjectAutoTag = onDocumentWritten('projects/{projectId}', async (event) => {
  const newData = event.data.after.exists ? event.data.after.data() : null;
  const oldData = event.data.before.exists ? event.data.before.data() : null;

  if (!newData || newData.subModule !== 'projects') return null;

  // Calcul des tags automatiques
  let tags = newData.tags || [];
  const initialTagsCount = tags.length;

  if (newData.budget > 50000000 && !tags.includes('Stratégique')) {
    tags.push('Stratégique');
  }
  if (newData.budget < 5000000 && !tags.includes('Maintenance')) {
    tags.push('Maintenance');
  }

  // Si des tags ont été ajoutés, on met à jour
  if (tags.length > initialTagsCount) {
    await event.data.after.ref.update({ tags });
    logger.info(`Auto-tags applied to project ${event.params.projectId}`);
  }

  return null;
});

/**
 * 🤖 BUTLER: DEADLINE MONITOR (Scheduled every 24h)
 * WHY: Relance les managers si des tâches critiques n'avancent pas.
 */
exports.checkTaskDeadlines = onSchedule('every 24 hours', async (event) => {
  const now = new Date();
  const threshold = new Date(now.getTime() - (48 * 60 * 60 * 1000)); // 48h

  try {
    const overdueTasks = await db.collection('projects')
      .where('subModule', '==', 'tasks')
      .where('priorite', '==', 'Critique')
      .where('_updatedAt', '<', threshold.toISOString())
      .get();

    for (const doc of overdueTasks.docs) {
      const task = doc.data();
      const projectsSnap = await db.collection('projects')
        .where('subModule', '==', 'projects')
        .where('nom', '==', task.projet)
        .limit(1)
        .get();

      if (!projectsSnap.empty) {
        const projectData = projectsSnap.docs[0].data();
        const managerName = projectData.chefProjet;

        if (managerName) {
          const userSnap = await db.collection('users').where('nom', '==', managerName).limit(1).get();
          if (!userSnap.empty) {
            const fcmToken = userSnap.docs[0].data().fcmToken;
            if (fcmToken) {
              await admin.messaging().send({
                notification: {
                  title: '🚨 Butler Alert: Retard Critique',
                  body: `La tâche "${task.nom}" (Projet ${task.projet}) n'a pas bougé depuis 48h.`
                },
                token: fcmToken
              });
            }
          }
        }
      }
    }
  } catch (err) {
    logger.error('Deadline Checker Error:', err);
  }
});

/**
 * 🤖 BUTLER: MESSENGER CLEANUP (Scheduled every 7 days)
 * WHY: Garde le Messenger fluide en archivant les discussions mortes.
 */
exports.archiveInactiveRooms = onSchedule({ schedule: '0 0 * * 0', timeZone: 'UTC' }, async (event) => {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - 30); // 30 jours

  try {
    const inactiveRooms = await db.collection('rooms')
      .where('status', '==', 'active')
      .where('_updatedAt', '<', threshold.toISOString())
      .get();

    const batch = db.batch();
    inactiveRooms.docs.forEach(doc => {
      batch.update(doc.ref, { status: 'archived' });
    });
    
    await batch.commit();
    logger.info(`Archived ${inactiveRooms.size} inactive rooms`);
  } catch (err) {
    logger.error('Cleanup Error:', err);
  }
});




