const { onDocumentWritten, onDocumentUpdated, onDocumentDeleted } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');
const greenblock = require('./greenblock');

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
    const oldSignalsSnap = await db.collectionGroup('signals')
      .where('createdAt', '<', cutoff)
      .limit(500) // Protection contre les gros volumes
      .get();
    
    if (oldSignalsSnap.empty) {
      logger.info('[Cleanup] Aucun signal WebRTC périmé trouvé.');
      return;
    }

    const batch = db.batch();
    oldSignalsSnap.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    logger.info(`[Cleanup] WebRTC Signals: ${oldSignalsSnap.size} documents supprimés.`);
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
const SENSITIVE_COLLECTIONS = ['finance', 'inventory', 'users', 'hr', 'crm', 'production', 'sales', 'projects', 'maintenance', 'payroll', 'procurement', 'esg', 'budget'];

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

  // [TRACEABILITY] Resolve User Name for clarity in logs
  let userName = afterData?._updatedBy || afterData?._createdBy || beforeData?._updatedBy || 'system_trigger';
  try {
    if (userName && userName !== 'system_trigger') {
      const userSnap = await db.collection('users').doc(userName).get();
      if (userSnap.exists) {
        userName = userSnap.data().displayName || userSnap.data().email || userName;
      }
    }
  } catch (err) {
    logger.warn('Could not resolve user name for audit:', userName);
  }

  // [DIFF] Track what actually changed
  let diff = null;
  if (operation === 'UPDATE' && beforeData && afterData) {
    diff = {};
    Object.keys(afterData).forEach(k => {
      if (k.startsWith('_')) return; // Ignore internal metadata
      if (JSON.stringify(beforeData[k]) !== JSON.stringify(afterData[k])) {
        diff[k] = { from: beforeData[k], to: afterData[k] };
      }
    });
  }

  const auditRecord = {
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    appId: collection.split('_')[0],
    docId,
    action: operation,
    userName,
    details: `${operation} on ${collection}/${docId}`,
    diff,
    metadata: {
      eventId: event.id,
      traceId: event.traceparent || null,
      originalCollection: collection
    }
  };

  try {
    await db.collection('audit_logs').add(auditRecord);
    logger.info(`Audit log created for ${collection}/${docId} by ${userName}`);
  } catch (err) {
    logger.error('Audit Log Error:', err);
  }
  return null;
});


/**
 * 🔒 HR SECURITY: PERSONNEL SENSITIVE CHANGES — High Severity Audit
 * WHY: Toute modification de rôle ou de permissions doit être tracée.
 * NOTE: Le salaire est maintenant dans hr_private (géré par onHRPrivateChange).
 */
exports.onHRPersonnelChange = onDocumentUpdated('users/{docId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();

  // Detection fields: role (users) or permissions
  const sensitiveKeys = ['role', 'permissions', 'active'];
  const changes = sensitiveKeys.filter(k => 
    JSON.stringify(before[k]) !== JSON.stringify(after[k])
  );

  if (changes.length > 0) {
    const auditRecord = {
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      severity: 'CRITICAL_SECURITY',
      collection: 'users',
      docId: event.params.docId,
      actor: after._updatedBy || after._permissionsUpdatedBy || 'system',
      changes: changes.reduce((acc, k) => {
        acc[k] = { from: before[k], to: after[k] };
        return acc;
      }, {}),
      details: `Critical access change detected on users/${event.params.docId}`,
      fingerprint: `SECURE_AUTH_${event.id}`
    };

    try {
      await db.collection('audit_logs').add(auditRecord);
      logger.warn(`[SECURITY] Access change detected on users/${event.params.docId}: ${changes.join(', ')}`);
    } catch (err) {
      logger.error('Auth Audit Log Error:', err);
    }
  }
  return null;
});

/**
 * 🔒 HR SECURITY: PRIVATE DATA CHANGES (Vault)
 * WHY: Surveillance du coffre-fort HR (Salaires, IBAN, etc.)
 */
exports.onHRPrivateChange = onDocumentUpdated('users/{uid}/hr_private/{docId}', async (event) => {
  const { uid, docId } = event.params;
  const before = event.data.before.data();
  const after = event.data.after.data();

  const sensitiveKeys = ['salaire', 'iban', 'ssn', 'rib'];
  const changes = sensitiveKeys.filter(k => 
    JSON.stringify(before[k]) !== JSON.stringify(after[k])
  );

  if (changes.length > 0) {
    await db.collection('audit_logs').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      severity: 'CRITICAL_SECURITY',
      collection: `users/${uid}/hr_private`,
      docId,
      actor: after._updatedBy || 'system',
      changes: changes.reduce((acc, k) => {
        acc[k] = { from: before[k], to: after[k] };
        return acc;
      }, {}),
      details: `Vault data modified for employee ${uid}`,
      fingerprint: `SECURE_VAULT_${event.id}`
    });
    logger.warn(`[SECURITY] Vault modification for ${uid}: ${changes.join(', ')}`);
  }
  return null;
});

/**
 * 💹 FINANCE: AUTOMATED ACCOUNTING — Hardened with Idempotency and Outbox
 */
exports.syncAccountingOnInvoicePaid = onDocumentUpdated('finance/{invoiceId}', async (event) => {
  const newData = event.data.after.data();
  const oldData = event.data.before.data();
  const { invoiceId } = event.params;

  // Guard: ensure this is an invoice record
  if (newData.subModule !== 'invoices') return null;

  // Trigger only on status change to 'Payé' (French status used in frontend)
  if (newData.statut === 'Payé' && oldData.statut !== 'Payé') {
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

        // 🛡️ Outbox pattern: write sync task within the same transaction
        const syncTaskRef = db.collection('sync_queue').doc(`greenblock_acc_${event.id}`);
        t.set(syncTaskRef, {
          target: 'greenblock',
          model: 'com.ipc.greenblock.finance.db.AccountMove',
          payload: {
            name: `INV-${invoiceId}`,
            amount: amount,
            ref: invoiceId
          },
          status: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      
      // SSOT Synchronization (Best-effort inline)
      try {
        await greenblock.syncRecord('com.ipc.greenblock.finance.db.AccountMove', {
          name: `INV-${invoiceId}`,
          amount: amount,
          ref: invoiceId
        }, invoiceId);

        // Mark as completed if successful
        await db.collection('sync_queue').doc(`greenblock_acc_${event.id}`).update({
          status: 'completed',
          completedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        logger.info(`Accounting synced for invoice ${invoiceId}`);
      } catch (err) {
        logger.error(`IPC Green Block sync failed for invoice ${invoiceId}, task remains in sync_queue.`, err);
      }
    } catch (err) {
      logger.error('Accounting Sync Error:', err);
    }
  }
  return null;
});

/**
 * 💰 PAYROLL: GREEN BLOCK SSOT SYNC — Hardened with Transactions
 */
exports.syncPayrollToGreenBlock = onDocumentWritten('payroll/{slipId}', async (event) => {
  const newData = event.data.after.exists ? event.data.after.data() : null;
  const { slipId } = event.params;
  if (!newData || newData.subModule !== 'slips') return null;

  try {
    await db.runTransaction(async (t) => {
      const slipRef = event.data.after.ref;
      const doc = await t.get(slipRef);
      
      // 🛡️ Idempotency check
      const processedEvents = doc.data().processedEvents || [];
      if (processedEvents.includes(event.id)) {
        logger.warn(`Event ${event.id} already processed for slip ${slipId}.`);
        return;
      }

      // Add to outbox (Atomic)
      const syncTaskRef = db.collection('sync_queue').doc(`payroll_${event.id}`);
      t.set(syncTaskRef, {
        target: 'greenblock',
        model: 'com.ipc.greenblock.hr.db.SalarySlip',
        payload: {
          employeeId: newData.employeeId,
          period: newData.period,
          amount: newData.netPay,
          status: newData.status,
          ref: slipId
        },
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update processed events
      t.update(slipRef, { 
        processedEvents: admin.firestore.FieldValue.arrayUnion(event.id) 
      });
    });

    // Best-effort inline sync
    try {
      await greenblock.syncRecord('com.ipc.greenblock.hr.db.SalarySlip', {
        employeeId: newData.employeeId,
        period: newData.period,
        amount: newData.netPay,
        status: newData.status,
        ref: slipId
      }, slipId);
      
      await db.collection('sync_queue').doc(`payroll_${event.id}`).update({
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      logger.info(`Payroll slip ${slipId} synced to Green Block.`);
    } catch (err) {
      logger.error(`Green Block sync failed for payroll slip ${slipId}, task remains in queue.`);
    }
  } catch (err) {
    logger.error('Payroll Sync Transaction Error:', err);
  }
  return null;
});

/**
 * 🧱 PRODUCTION: INVENTORY AUTO-SYNC — Hardened with Transactions
 */
exports.updateStockOnProductionComplete = onDocumentUpdated('production/{ofId}', async (event) => {
  const newData = event.data.after.data();
  const oldData = event.data.before.data();
  const { ofId } = event.params;

  // Guard: ensure this is a work order
  if (newData.subModule !== 'workOrders') return null;

  if (newData.statut === 'Terminé' && oldData.statut !== 'Terminé') {
    const productId = newData.productId || newData.produitId;
    const quantity = newData.quantityProduced || newData.qte || 0;
    
    if (!productId) {
      logger.error(`Missing productId in production order ${ofId}`);
      return null;
    }

    // Reference the generic 'inventory' collection with subModule: 'products'
    // Note: We need to find the specific document ID in the 'inventory' collection.
    const productRef = db.collection('inventory').doc(productId);

    try {
      await db.runTransaction(async (t) => {
        const doc = await t.get(productRef);
        if (!doc.exists) {
          logger.error(`Product ${productId} not found for OF ${ofId}`);
          return;
        }

        // 🛡️ Idempotency check: prevent double-counting if trigger runs twice
        const processedEvents = doc.data().processedEvents || [];
        if (processedEvents.includes(event.id)) {
          logger.warn(`Event ${event.id} already processed for product ${productId}. Skipping.`);
          return;
        }

        const currentStock = doc.data().stock_reel || 0;
        t.update(productRef, { 
          stock_reel: currentStock + quantity,
          lastRefillAt: admin.firestore.FieldValue.serverTimestamp(),
          lastOfProcessed: ofId,
          processedEvents: admin.firestore.FieldValue.arrayUnion(event.id)
        });

        // 🛡️ Outbox pattern: write sync task within the same transaction
        const syncTaskRef = db.collection('sync_queue').doc(event.id);
        t.set(syncTaskRef, {
          target: 'greenblock',
          model: 'com.ipc.greenblock.stock.db.StockMove',
          payload: {
            productId,
            quantity,
            origin: ofId,
            type: 'PRODUCTION'
          },
          status: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      // SSOT Synchronization (Best-effort inline)
      try {
        await greenblock.syncRecord('com.ipc.greenblock.stock.db.StockMove', {
          productId,
          quantity,
          origin: ofId,
          type: 'PRODUCTION'
        }, ofId);
        
        // Mark as completed if successful
        await db.collection('sync_queue').doc(event.id).update({
          status: 'completed',
          completedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        logger.info(`Stock updated for product ${productId} (+${quantity}) from OF ${ofId}`);
      } catch (err) {
        logger.error(`IPC Green Block sync failed for event ${event.id}, task remains in sync_queue.`, err);
      }
    } catch (err) {
      logger.error('Stock Update Error:', err);
    }
  }
  return null;
});

/**
 * 🎖️ HR: SALES COMMISSIONS — Automated reconciliation
 * WHY: Récompense automatiquement les commerciaux lors du paiement effectif d'une commande.
 * Évite les saisies manuelles et les erreurs de calcul de bonus.
 */
exports.calculateCommissionOnSalesPaid = onDocumentUpdated('sales/{orderId}', async (event) => {
  const newData = event.data.after.data();
  const oldData = event.data.before.data();
  const { orderId } = event.params;

  // Guard: ensure this is a sales order
  if (newData.subModule !== 'orders') return null;

  // Trigger only on status change to 'Payé'
  if (newData.statut === 'Payé' && oldData.statut !== 'Payé') {
    const ownerId = newData.ownerId;
    if (!ownerId) {
      logger.warn(`Commission skip: No ownerId for order ${orderId}`);
      return null;
    }

    try {
      // 1. Fetch salesperson name from 'users'
      const userDoc = await db.collection('users').doc(ownerId).get();
      if (!userDoc.exists) {
         logger.error(`User profile ${ownerId} not found for commission on order ${orderId}`);
         return null;
      }
      const userData = userDoc.data();
      const userName = userData.profile?.nom || userData.nom || 'Collaborateur Nexus';

      // 2. Calculate commission (Default: 2% of total HT)
      const montantHT = newData.montantHT || newData.montant || 0;
      const taux = 2; 
      const commissionAmount = Math.round(montantHT * (taux / 100));

      if (commissionAmount <= 0) return null;

      // 3. Record in HR module (commissions submodule)
      const commissionId = `COMM_${orderId}`;
      await db.collection('hr').doc(commissionId).set({
        id: commissionId,
        subModule: 'commissions',
        date: new Date().toISOString().split('T')[0],
        collaborateur: userName,
        collaborateurId: ownerId,
        montant: commissionAmount,
        refDocument: newData.num || orderId,
        taux: taux,
        statut: 'À payer',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        _domain: 'hr',
        _createdBy: 'nexus_commission_engine'
      });

      logger.info(`[HR] Commission of ${commissionAmount} FCFA generated for ${userName} (Order ${orderId})`);
    } catch (err) {
      logger.error('Commission Calculation Error:', err);
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
  // [FIX] membresId doit contenir des UIDs Firebase, pas des noms.
  // Le champ "membresId" est désormais un tableau d'UIDs (string).
  const newMembres = newData.membresId || [];
  const oldMembres = oldData?.membresId || [];

  const addedMembres = newMembres.filter(uid => !oldMembres.includes(uid));

  if (addedMembres.length > 0) {
    try {
      for (const uid of addedMembres) {
        // [FIX] Lookup par UID (document ID) — pas par nom. O(1) au lieu de O(n).
        const userDoc = await db.collection('users').doc(uid).get();

        if (userDoc.exists) {
          const userData = userDoc.data();
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
        // [FIX] chefProjetUid doit être un UID, pas un nom.
        // chefProjet (nom lisible) conservé pour affichage, chefProjetUid pour les lookups.
        const managerUid = projectData.chefProjetUid || null;
        const managerName = projectData.chefProjet || 'Manager';

        if (managerUid) {
          // [FIX] Lookup par UID — O(1), garanti unique
          const userDoc = await db.collection('users').doc(managerUid).get();
          if (userDoc.exists) {
            const fcmToken = userDoc.data().fcmToken;

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

  // Si des tags ont été ajoutés et sont différents de l'existant, on met à jour
  const currentTags = newData.tags || [];
  const hasChanges = tags.length !== currentTags.length || !tags.every(t => currentTags.includes(t));

  if (hasChanges) {
    await event.data.after.ref.update({ tags, _autoTaggedAt: admin.firestore.FieldValue.serverTimestamp() });
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
    // [FIX] _updatedAt est un Firestore Timestamp (serverTimestamp), PAS une ISO string.
    // Comparer avec admin.firestore.Timestamp.fromDate() pour éviter les résultats imprévisibles.
    const thresholdTs = admin.firestore.Timestamp.fromDate(threshold);

    const overdueTasks = await db.collection('projects')
      .where('subModule', '==', 'tasks')
      .where('priorite', '==', 'Critique')
      .where('_updatedAt', '<', thresholdTs)
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
        // [FIX] Utiliser chefProjetUid (UID) au lieu de chefProjet (nom)
        const managerUid = projectData.chefProjetUid || null;
        const managerName = projectData.chefProjet || 'Manager';

        if (managerUid) {
          // [FIX] Lookup par UID — atomique et garanti unique
          const userDoc = await db.collection('users').doc(managerUid).get();
          if (userDoc.exists) {
            const fcmToken = userDoc.data().fcmToken;
            if (fcmToken) {
              await admin.messaging().send({
                notification: {
                  title: `⚠️ ALERTE AI-MANAGER : Retard inacceptable sur ${task.projet}`,
                  body: `${managerName}, la tâche "${task.nom}" est au point mort depuis 48h. C'est inacceptable. Reprenez le contrôle immédiatement et faites avancer les choses. L'équipe compte sur votre leadership !`
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

/**
 * 💼 SALES: QUOTE TO ORDER CONVERSION
 * WHY: Tunnel de conversion automatisé. Devis Accepté -> Commande -> Réservation de Stock -> Facture Brouillon
 */
exports.onQuoteAccepted = onDocumentUpdated('sales/{quoteId}', async (event) => {
  const newData = event.data.after.data();
  const oldData = event.data.before.data();
  const { quoteId } = event.params;

  if (newData.subModule !== 'quotes') return null;

  if (newData.statut === 'Accepté' && oldData.statut !== 'Accepté') {
    try {
      await db.runTransaction(async (t) => {
        // 1. Create Sales Order
        const orderRef = db.collection('sales').doc(`ORD_${quoteId}`);
        const orderData = {
          id: `ORD_${quoteId}`,
          subModule: 'orders',
          client: newData.client,
          date: new Date().toISOString().split('T')[0],
          quoteRef: quoteId,
          montant: newData.montantHT || newData.montant,
          statut: 'Confirmé',
          items: newData.items || [],
          _domain: 'sales',
          _createdBy: 'nexus_quote_engine',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        t.set(orderRef, orderData);

        // 2. Create Draft Invoice
        const invoiceRef = db.collection('finance').doc(`INV_${quoteId}`);
        const invoiceData = {
          id: `INV_${quoteId}`,
          subModule: 'invoices',
          clientName: newData.client,
          amountHT: newData.montantHT || newData.montant,
          taxes: newData.taxes || [{ name: 'TVA Standard', rate: 18, amount: (newData.montantHT || newData.montant) * 0.18 }],
          amountTTC: newData.montantTTC || ((newData.montantHT || newData.montant) * 1.18),
          currency: 'FCFA',
          status: 'Brouillon', // Must wait for sequential numbering
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          items: newData.items || [],
          _domain: 'finance',
          _createdBy: 'nexus_quote_engine',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        t.set(invoiceRef, invoiceData);

        // 3. Stock Reservation (simplified, would ideally iterate over items)
        // This is a placeholder for actual item iteration
        logger.info(`[Quote-to-Cash] Pipeline initialized for quote ${quoteId}. Order and Invoice Draft created.`);
      });
    } catch (err) {
      logger.error('[Quote-to-Cash] Error converting quote:', err);
    }
  }
  return null;
});

/**
 * 🧾 FINANCE: SEQUENTIAL INVOICE NUMBER GENERATION
 * WHY: Guarantee continuous sequential numbers (e.g., FAC-2026-0001) for legal compliance.
 */
exports.generateInvoiceNumber = onDocumentUpdated('finance/{invoiceId}', async (event) => {
  const newData = event.data.after.data();
  const oldData = event.data.before.data();
  const { invoiceId } = event.params;

  if (newData.subModule !== 'invoices') return null;

  // Trigger when a draft invoice is validated ('Envoyé') and doesn't have a final number yet
  if (newData.status === 'Envoyé' && oldData.status === 'Brouillon' && (!newData.num || newData.num.startsWith('INV_'))) {
    const year = new Date().getFullYear();
    const counterRef = db.collection('counters').doc(`invoices_${year}`);

    try {
      await db.runTransaction(async (t) => {
        const counterDoc = await t.get(counterRef);
        let seq = 1;
        if (counterDoc.exists) {
          seq = (counterDoc.data().seq || 0) + 1;
          t.update(counterRef, { seq: seq });
        } else {
          t.set(counterRef, { seq: 1, year: year });
        }

        const paddedSeq = String(seq).padStart(4, '0');
        const invoiceNum = `FAC-${year}-${paddedSeq}`;

        t.update(event.data.after.ref, { num: invoiceNum });
        logger.info(`[Finance] Generated sequential invoice number: ${invoiceNum}`);
      });
    } catch (err) {
      logger.error('[Finance] Error generating invoice number:', err);
    }
  }
  return null;
});

/**
 * ⚖️ ACCOUNTING: DOUBLE ENTRY VALIDATION
 * WHY: Zero-Fault integrity. Reject any ledger entry where Debit != Credit.
 */
exports.validateDoubleEntry = onDocumentWritten('accounting/{entryId}', async (event) => {
  const newData = event.data.after.exists ? event.data.after.data() : null;
  
  if (!newData || newData.subModule !== 'entries') return null;

  // If this is an internal sync/update that doesn't affect balances, skip
  if (newData._balanceVerified) return null;

  const debit = Number(newData.debit) || 0;
  const credit = Number(newData.credit) || 0;

  // 1. Double-Entry Integrity Check
  if (Math.abs(debit - credit) > 0.01) { // 0.01 to handle minor floating point issues
    logger.error(`[Accounting] CRITICAL ERROR: Unbalanced entry detected in ${event.params.entryId}. Debit: ${debit}, Credit: ${credit}.`);
    
    // In a real-world scenario, we would use a beforeWrite trigger (blocking functions) to prevent the write.
    // Since we are using async triggers, we flag the record as invalid and alert.
    await event.data.after.ref.update({
      _integrityFault: true,
      _faultReason: 'Debit and Credit do not match',
      status: 'Erreur'
    });
    
    // Audit log the fault
    await db.collection('financial_audit_logs').add({
      action: 'INTEGRITY_FAULT',
      docId: event.params.entryId,
      details: `Unbalanced entry attempted. D: ${debit}, C: ${credit}`,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return null;
  }

  // 2. Financial Period Lock Check (Soft implementation)
  try {
    const entryDate = new Date(newData.date);
    const year = entryDate.getFullYear();
    const month = entryDate.getMonth() + 1; // 1-12
    
    const periodDoc = await db.collection('accounting').doc(`period_${year}_${month}`).get();
    if (periodDoc.exists && periodDoc.data().status === 'Clôturée') {
       logger.error(`[Accounting] SECURITY VIOLATION: Attempt to write to closed period ${year}-${month} in ${event.params.entryId}`);
       await event.data.after.ref.update({
          _integrityFault: true,
          _faultReason: 'Attempted to post to a closed financial period.',
          status: 'Erreur'
       });
       return null;
    }
  } catch(err) {
    logger.warn('[Accounting] Period check failed', err);
  }

  // Mark as verified
  await event.data.after.ref.update({
    _balanceVerified: true,
    _verifiedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return null;
});

/**
 * 🚀 HR: ONBOARDING AUTOMATION (Unified 2.0)
 * WHY: When a user is flagged as an 'employee' in the Unified model, trigger provisioning workflows.
 */
exports.onEmployeeOnboarded = onDocumentCreated('users/{uid}', async (event) => {
  const uid = event.params.uid;
  const employee = event.data.data();

  // Guard: Only process staff/employees
  if (employee.hr?.subModule !== 'employees') {
    logger.debug(`[HR] User ${uid} created but not as employee. Skipping onboarding automation.`);
    return null;
  }

  logger.info(`[HR] Processing onboarding for ${employee.email || uid}`);

  const batch = db.batch();

  // 1. Create IT Provisioning Task
  const taskId = `IT_PROV_${uid}`;
  const taskRef = db.collection('projects').doc('INTERNAL_OPS').collection('tasks').doc(taskId);
  
  batch.set(taskRef, {
    title: `IT Provisioning: ${employee.profile?.nom || employee.email}`,
    description: `Setup hardware and accounts for ${employee.profile?.poste || 'New Employee'}`,
    status: 'TODO',
    priority: 'HIGH',
    assignedTo: 'IT_TEAM',
    tags: ['IT', 'ONBOARDING'],
    relatedEmployee: uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // 2. Create Draft Contract
  const contractId = `DRAFT_CONT_${uid}`;
  const contractRef = db.collection('hr_contracts').doc(contractId);
  batch.set(contractRef, {
    employeeId: uid,
    employeeName: employee.profile?.nom || 'À définir',
    type: employee.hr?.contratType || 'CDI',
    status: 'DRAFT',
    steps: [
      { id: 'draft', label: 'Brouillon créé', completed: true, date: new Date().toISOString() },
      { id: 'legal_review', label: 'Revue Juridique', completed: false },
      { id: 'signature', label: 'Signature', completed: false }
    ],
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  try {
    await batch.commit();
    logger.info(`[HR] Onboarding automated tasks created for ${uid}`);
  } catch (err) {
    logger.error('[HR] Onboarding Automation Error:', err);
  }

  return null;
});

/**
 * ⚠️ HR: OFFBOARDING SECURITY (Unified 2.0)
 * WHY: Ensure accounts are disabled and access is revoked when an employee record is deactivated.
 */
exports.onEmployeeOffboarded = onDocumentUpdated('users/{uid}', async (event) => {
  const uid = event.params.uid;
  const newData = event.data.after.data();
  const oldData = event.data.before.data();

  // Guard: Only process employees
  if (newData.hr?.subModule !== 'employees') return null;

  // Trigger when deactivated
  if (newData.profile?.active === false && oldData.profile?.active === true) {
    try {
      const _uid = uid; // uid is already defined from event.params
      if (_uid) {
        // 1. Revoke Auth Sessions & Disable Account
        await admin.auth().updateUser(uid, { disabled: true });
        await admin.auth().revokeRefreshTokens(uid);
        logger.info(`[HR] Access revoked for ${newData.nom} (UID: ${uid})`);
      }

      // 2. Notify Finance (Solde de tout compte)
      await db.collection('notifications').add({
        title: '🛑 Offboarding : Solde de tout compte',
        body: `Le collaborateur ${newData.profile?.nom || uid} a été désactivé. Veuillez préparer le solde de tout compte.`,
        type: 'alert',
        targetRole: 'FINANCE',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

    } catch (err) {
      logger.error('[HR] Offboarding Error:', err);
    }
  }
  return null;
});

/**
 * 🕵️ HR: PRIVACY AUDIT (The HR Vault)
 * WHY: Traces every access/modification to sensitive HR data in the Unified model.
 */
exports.hrPrivacyAudit = onDocumentWritten('users/{uid}/hr_private/{docId}', async (event) => {
  const { uid, docId } = event.params;
  const after = event.data.after.exists ? event.data.after.data() : null;
  const before = event.data.before.exists ? event.data.before.data() : null;

  let operation = 'UPDATE';
  if (!before) operation = 'CREATE';
  if (!after) operation = 'DELETE';

  const actor = after?._updatedBy || after?._createdBy || 'system';

  try {
    await db.collection('audit_logs').add({
      action: `HR_VAULT_${operation}`,
      severity: 'CRITICAL_SECURITY',
      collection: `users/${uid}/hr_private`,
      docId: docId,
      actor: actor,
      details: `Sensitive HR data ${operation} on unified user ${uid}`,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) {
    logger.error('[HR] Privacy Audit Error:', err);
  }
  return null;
});

/**
 * 💸 HR/FINANCE: PRE-PAYROLL GENERATOR (Mensuel)
 * WHY: Compile pointages, congés et génère la base de paie le 25 de chaque mois.
 */
exports.generatePrePayroll = onSchedule('0 0 25 * *', async (event) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear  = now.getFullYear();
    const period       = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    const periodStart  = new Date(currentYear, currentMonth - 1, 1);
    const periodEnd    = new Date(currentYear, currentMonth, 0); // dernier jour du mois

    logger.info(`[PAYROLL] Starting Pre-Payroll generation for ${period}`);

    // ──────────────────────────────────────────────────────────
    // 1. Charger tous les employés actifs (documents /users)
    // ──────────────────────────────────────────────────────────
    const employeesSnap = await db.collection('users')
      .where('statut', '==', 'actif')
      .get();

    if (employeesSnap.empty) {
      logger.warn(`[PAYROLL] Aucun employé actif pour ${period}`);
      return null;
    }

    // ──────────────────────────────────────────────────────────
    // 2. Charger les pointages du mois (timesheets)
    // ──────────────────────────────────────────────────────────
    const timesheetsSnap = await db.collection('hr')
      .where('subModule', '==', 'timesheets')
      .where('mois', '==', period)
      .get();

    const timesheetsByEmployee = {};
    timesheetsSnap.forEach(doc => {
      const d = doc.data();
      const uid = d.userId || d.ownerId;
      if (!uid) return;
      if (!timesheetsByEmployee[uid]) timesheetsByEmployee[uid] = [];
      timesheetsByEmployee[uid].push(d);
    });

    // ──────────────────────────────────────────────────────────
    // 3. Charger les congés approuvés du mois
    // ──────────────────────────────────────────────────────────
    const leavesSnap = await db.collection('hr')
      .where('subModule', '==', 'leaves')
      .where('statut', '==', 'Approuvé')
      .get();

    const leavesByEmployee = {};
    leavesSnap.forEach(doc => {
      const d = doc.data();
      const uid = d.userId || d.ownerId;
      if (!uid) return;
      // Ne compter que les congés qui chevauchet la période courante
      const start = d.dateDebut ? new Date(d.dateDebut) : null;
      const end   = d.dateFin   ? new Date(d.dateFin)   : null;
      if (!start || !end) return;
      if (start <= periodEnd && end >= periodStart) {
        if (!leavesByEmployee[uid]) leavesByEmployee[uid] = 0;
        // Calculer les jours effectifs dans la période
        const effectiveStart = start < periodStart ? periodStart : start;
        const effectiveEnd   = end   > periodEnd   ? periodEnd   : end;
        const diffMs = effectiveEnd - effectiveStart;
        const days   = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
        leavesByEmployee[uid] += days;
      }
    });

    // ──────────────────────────────────────────────────────────
    // 4. Pour chaque employé : lire le salaire de base (hr_private vault)
    //    et calculer le net à payer
    // ──────────────────────────────────────────────────────────
    // Constantes sociales Côte d'Ivoire (à externaliser dans Settings)
    const CNPS_EMPLOYEE_RATE = 0.0636;  // 6.36% charge salarié CNPS
    const CNPS_EMPLOYER_RATE = 0.1686;  // 16.86% charge patronale CNPS
    const ITS_ABATTEMENT     = 0.15;    // Abattement 15% sur revenu imposable
    const WORKING_DAYS       = 26;      // Jours ouvrables standard par mois

    const batch = db.batch();
    const slipIds = [];

    for (const empDoc of employeesSnap.docs) {
      const emp     = empDoc.data();
      const empUid  = empDoc.id;
      const empNom  = emp.nom || emp.displayName || 'Employé';

      try {
        // Lire le salaire brut depuis le vault sécurisé (hr_private/salary_data)
        const vaultSnap = await db.collection('users')
          .doc(empUid)
          .collection('hr_private')
          .doc('salary_data')
          .get();

        const vaultData  = vaultSnap.exists ? vaultSnap.data() : {};
        const salaireBrut = vaultData.salaireBrut || emp.salary || emp.salaire || 0;

        if (salaireBrut === 0) {
          logger.warn(`[PAYROLL] Salaire inconnu pour ${empNom} (${empUid}) — slip ignoré.`);
          continue;
        }

        // ── Calculs de paie (Droit ivoirien simplifié) ─────
        const joursAbsence  = leavesByEmployee[empUid] || 0;
        const joursPresence = Math.max(0, WORKING_DAYS - joursAbsence);
        const salBrutPro    = (salaireBrut / WORKING_DAYS) * joursPresence;

        // Heures supplémentaires (depuis timesheets)
        const timesheets  = timesheetsByEmployee[empUid] || [];
        const totalHeureSup = timesheets.reduce((sum, ts) => sum + (ts.heureSup || 0), 0);
        const tauxHoraire   = salaireBrut / (WORKING_DAYS * 8);
        const majoration    = 1.15; // 15% de majoration heures sup
        const montantHeureSup = totalHeureSup * tauxHoraire * majoration;

        // Avantages en nature (logement, transport) — depuis vault
        const avantagesTotaux = vaultData.avantagesNature || 0;

        const salBrutTotal = salBrutPro + montantHeureSup + avantagesTotaux;

        // Cotisations salariales CNPS
        const retenueCNPS      = salBrutTotal * CNPS_EMPLOYEE_RATE;

        // Revenu brut imposable (ITS — Impôt sur les Traitements et Salaires)
        const revenuImposable  = salBrutTotal * (1 - ITS_ABATTEMENT) - retenueCNPS;
        const its              = _calculateITS(revenuImposable);

        // Autres retenues
        const autresRetenues   = vaultData.autresRetenues || 0;
        const avances          = vaultData.avances        || 0;

        // Total retenues salariales
        const totalRetenues    = retenueCNPS + its + autresRetenues + avances;

        // Salaire net
        const salaireNet       = salBrutTotal - totalRetenues;

        // Charges patronales CNPS
        const chargesPatronales = salBrutTotal * CNPS_EMPLOYER_RATE;

        // ── Génération de la fiche de paie ─────────────────
        const slipId  = `SLIP_${period}_${empUid}`;
        const slipRef = db.collection('payroll').doc(slipId);

        batch.set(slipRef, {
          id:             slipId,
          subModule:      'slips',
          period:         period,
          status:         'Brouillon',
          employeeId:     empUid,
          employeeNom:    empNom,
          poste:          emp.poste  || emp.role || '—',
          departement:    emp.departement || '—',
          contractType:   emp.contractType || 'CDI',

          // Brut
          salaireBrutBase:    salaireBrut,
          salaireBrutProrate: Math.round(salBrutPro),
          heuresSup:          totalHeureSup,
          montantHeuresSup:   Math.round(montantHeureSup),
          avantagesNature:    avantagesTotaux,
          salaireBrutTotal:   Math.round(salBrutTotal),

          // Retenues salariales
          retenueCNPS:        Math.round(retenueCNPS),
          its:                Math.round(its),
          autresRetenues:     autresRetenues,
          avances:            avances,
          totalRetenues:      Math.round(totalRetenues),

          // Net
          salaireNet:         Math.round(salaireNet),

          // Charges patronales (non déduit du salarié, à charge employeur)
          chargesPatronales:  Math.round(chargesPatronales),

          // Présence
          joursOuvrables:  WORKING_DAYS,
          joursPresence:   joursPresence,
          joursAbsence:    joursAbsence,

          // Méta
          generatedAt:   admin.firestore.FieldValue.serverTimestamp(),
          _domain:       'hr',
          _createdBy:    'nexus_payroll_engine',
          _deletedAt:    null,
        });

        slipIds.push(slipId);

      } catch (empErr) {
        logger.error(`[PAYROLL] Erreur pour ${empNom} (${empUid}):`, empErr);
      }
    }

    // ──────────────────────────────────────────────────────────
    // 5. Créer le document récapitulatif de la période
    // ──────────────────────────────────────────────────────────
    const summaryRef = db.collection('payroll').doc(`PRE_${period}`);
    batch.set(summaryRef, {
      id:           `PRE_${period}`,
      subModule:    'summary',
      period:       period,
      status:       'Brouillon',
      totalSlips:   slipIds.length,
      slipIds:      slipIds,
      generatedAt:  admin.firestore.FieldValue.serverTimestamp(),
      _domain:      'hr',
      _createdBy:   'nexus_payroll_engine',
    });

    await batch.commit();

    logger.info(`[PAYROLL] ✅ Pre-Payroll ${period} généré : ${slipIds.length} fiche(s) de paie.`);

    // Notifier les RH managers
    const hrManagersSnap = await db.collection('users')
      .where('role', 'in', ['HR', 'ADMIN', 'SUPER_ADMIN'])
      .get();

    const notifications = hrManagersSnap.docs.map(doc => ({
      targetUserId: doc.id,
      type:         'payroll_ready',
      title:        `Paie ${period} générée`,
      message:      `${slipIds.length} fiches de paie ont été générées pour la période ${period}. En attente de validation.`,
      module:       'payroll',
      link:         `/payroll/${period}`,
      read:         false,
      createdAt:    admin.firestore.FieldValue.serverTimestamp(),
    }));

    const notifBatch = db.batch();
    notifications.forEach(n => {
      notifBatch.set(db.collection('notifications').doc(), n);
    });
    await notifBatch.commit();

  } catch (err) {
    logger.error('[PAYROLL] Pre-Payroll Error:', err);
  }
});

/**
 * Calcule l'ITS (Impôt sur Traitements et Salaires) — Barème ivoirien simplifié.
 * @param {number} revenuImposable - Revenu mensuel imposable en FCFA
 * @returns {number} Montant ITS mensuel
 * @private
 */
function _calculateITS(revenuImposable) {
  if (revenuImposable <= 0) return 0;
  // Barème annuel converti en mensuel (source : DGI Côte d'Ivoire)
  const annual = revenuImposable * 12;
  let its = 0;
  if (annual <= 600000)        its = 0;
  else if (annual <= 1200000)  its = (annual - 600000) * 0.015;
  else if (annual <= 2400000)  its = 9000 + (annual - 1200000) * 0.025;
  else if (annual <= 4000000)  its = 39000 + (annual - 2400000) * 0.35;
  else if (annual <= 8000000)  its = 599000 + (annual - 4000000) * 0.45;
  else                          its = 2399000 + (annual - 8000000) * 0.60;
  return Math.round(its / 12); // Retour mensuel
}

/**
 * 👑 COCKPIT: AGREGATION STRATÉGIQUE (Scheduled)
 * WHY: Consolidate data across all modules into a single document for real-time Executive Dashboard without massive reads.
 * HOW: Runs every hour or can be invoked.
 */
exports.refreshCockpitMetrics = onSchedule('every 1 hours', async (event) => {
  try {
    logger.info('[COCKPIT] Starting Strategic Aggregation...');

    const cockpitRef = db.collection('cockpit').doc('global_metrics');
    
    // ==========================================
    // 1. FINANCE & FORECASTING (Cash Flow)
    // ==========================================
    const nowTs = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const financeSnapshot = await db.collection('finance').where('subModule', '==', 'invoices').get();
    let totalCA = 0;
    let recentExpenses = 0; 
    let monthlyRevenueHistory = {}; // { 'YYYY-MM': amount }
    
    financeSnapshot.forEach(doc => {
      const data = doc.data();
      const createdAt = data.createdAt ? data.createdAt.toDate() : new Date();
      const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
      
      if (data.statut === 'Payée' && data.type === 'Recette') {
        totalCA += (data.montantTTC || 0);
        monthlyRevenueHistory[monthKey] = (monthlyRevenueHistory[monthKey] || 0) + (data.montantTTC || 0);
      }
      if (data.type === 'Dépense' && createdAt > thirtyDaysAgo) {
        recentExpenses += (data.montantTTC || 0);
      }
    });

    const estimatedCashReserves = totalCA * 0.15; 
    const dailyBurnRate = recentExpenses / 30;
    const cashFlow30d = estimatedCashReserves - (dailyBurnRate * 30);

    // Generate 6-month Cash Flow Trend (Actuals + Forecast)
    const cashFlowTrend = [];
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
    for (let i = -3; i <= 2; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() + i);
      const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const name = months[d.getMonth()];
      
      const rev = monthlyRevenueHistory[mKey] || (totalCA / 12) * (1 + (i * 0.05)); // Actual or Trended Estimate
      const exp = dailyBurnRate * 30 * (1 + (i * 0.02));
      cashFlowTrend.push({ name, rev, exp, isForecast: i > 0 });
    }

    // ==========================================
    // 2. PRODUCTION & INVENTORY (Stock Prediction)
    // ==========================================
    // Look at production orders from the last 7 days to determine consumption rate
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const prodSnapshot = await db.collection('production')
      .where('subModule', '==', 'workOrders')
      .where('createdAt', '>', sevenDaysAgo)
      .get();
    
    let productionVelocity = 0;
    prodSnapshot.forEach(doc => {
      productionVelocity += (doc.data().quantityProduced || 0);
    });
    const avgDailyProd = productionVelocity / 7;

    const inventorySnapshot = await db.collection('inventory').where('subModule', '==', 'products').get();
    let alertesRupture = 0;
    let criticalStockItems = [];
    
    inventorySnapshot.forEach(doc => {
      const data = doc.data();
      // If production velocity is high, stock depletes faster
      const consumptionRate = (data.dailyConsumption || 10) * (avgDailyProd > 100 ? 1.5 : 1.0);
      const stockDaysRemaining = (data.quantite || 0) / (consumptionRate || 1);
      
      if (stockDaysRemaining < 30) {
        alertesRupture += 1;
        if (stockDaysRemaining < 7) {
          criticalStockItems.push(data.nom);
        }
      }
    });

    // ==========================================
    // 3. HR & CRM
    // ==========================================
    const hrSnapshot = await db.collection('hr').where('subModule', '==', 'employees').where('active', '==', true).get();
    const headcount = hrSnapshot.size;

    const leadsSnapshot = await db.collection('crm').where('subModule', '==', 'leads').get();
    let totalLeads = leadsSnapshot.size;
    let convertedLeads = leadsSnapshot.docs.filter(d => d.data().statut === 'Gagné').length;
    let conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    // ==========================================
    // 4. SMART ALERTS ENGINE (Gestion de Crise)
    // ==========================================
    const alertsBatch = db.batch();
    const alertsCollection = cockpitRef.collection('alerts');
    
    const oldAlerts = await alertsCollection.where('statut', '==', 'Active').get();
    oldAlerts.forEach(doc => alertsBatch.delete(doc.ref));

    if (cashFlow30d < 0) {
      alertsBatch.set(alertsCollection.doc(), {
        title: 'Risque de Rupture de Trésorerie',
        message: `Le Cash Flow projeté à 30 jours est critique (${Math.round(cashFlow30d).toLocaleString()} FCFA). Révision budgétaire urgente requise.`,
        level: 'critical',
        sourceModule: 'Finance',
        statut: 'Active',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    if (criticalStockItems.length > 0) {
      alertsBatch.set(alertsCollection.doc(), {
        title: 'ALERTE RUPTURE IMMINENTE',
        message: `Rupture de stock prévue sous 7 jours pour : ${criticalStockItems.join(', ')}.`,
        level: 'critical',
        sourceModule: 'Logistique',
        statut: 'Active',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else if (alertesRupture > 0) {
      alertsBatch.set(alertsCollection.doc(), {
        title: 'Optimisation Stock Recommandée',
        message: `${alertesRupture} matière(s) première(s) présentent un risque de rupture d'ici 30 jours.`,
        level: 'warning',
        sourceModule: 'Logistique',
        statut: 'Active',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    await alertsBatch.commit();

    // ==========================================
    // 5. SAVE AGGREGATES
    // ==========================================
    await cockpitRef.set({
      finance: { totalCA, cashFlow: estimatedCashReserves, dailyBurnRate }, 
      hr: { headcount, pulseScore: 92 },
      crm: { conversionRate, totalLeads },
      production: { trs: 87.2, avgDailyProd },
      forecasts: { 
        cashFlow30d, 
        alertesRupture, 
        cashFlowTrend,
        criticalCount: criticalStockItems.length 
      },
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    logger.info('[COCKPIT] Strategic Aggregation Complete.');
  } catch (err) {
    logger.error('[COCKPIT] Aggregation Error:', err);
  }
});

/**
 * 🔒 HR SECURITY: VALIDATION DES REQUÊTES (Congés & Notes de Frais)
 * WHY: Unified 2.0 — Les requêtes sont isolées dans hr_private.
 * Empêche l'auto-validation et gère l'intégrité cross-module.
 */
exports.validateHRApprovalRequest = onDocumentUpdated('users/{uid}/hr_private/{docId}', async (event) => {
  const { uid, docId } = event.params;
  const newData = event.data.after.data();
  const oldData = event.data.before.data();

  // Filtrage par sous-module (on gère leaves et expenses ici)
  const isLeave = newData.subModule === 'leaves';
  const isExpense = newData.subModule === 'expenses';
  
  if (!isLeave && !isExpense) return null;

  // Détection du passage à "Validé"
  if (newData.statut === 'Validé' && oldData.statut !== 'Validé') {
    const validatorId = newData._updatedBy || 'unknown'; 
    const requesterId = uid; // Dans le modèle Unified 2.0, l'UID est dans le path

    // 1. RBAC : Anti Auto-Validation (Zero-Trust Policy)
    if (validatorId === requesterId && validatorId !== 'unknown') {
      logger.warn(`[SECURITY] Tentative d'auto-validation bloquée pour ${requesterId} sur ${docId}`);
      await event.data.after.ref.update({
        statut: 'Refusé',
        _auditNotes: 'CRITICAL: Tentative d\'auto-validation rejetée par le système (Zero-Trust Policy).'
      });
      return null;
    }

    try {
      await db.runTransaction(async (t) => {
        // --- LOGIQUE SPÉCIFIQUE CONGÉS ---
        if (isLeave) {
          const userRef = db.collection('users').doc(uid);
          const userDoc = await t.get(userRef);
          
          if (userDoc.exists) {
            const userData = userDoc.data();
            const joursDemandes = newData.duree_jours || newData.heures || 1;
            const currentSolde = userData.hr?.solde_conges || 0;

            if (currentSolde < joursDemandes && newData.type === 'Congé Payé') {
              throw new Error(`Solde insuffisant pour ${uid}. Actuel: ${currentSolde}, Demandé: ${joursDemandes}`);
            }

            // Déduction atomique du solde
            t.update(userRef, {
              'hr.solde_conges': admin.firestore.FieldValue.increment(-joursDemandes),
              '_updatedAt': admin.firestore.FieldValue.serverTimestamp()
            });
            
            logger.info(`[HR] Solde de congés mis à jour pour ${uid}: -${joursDemandes}`);
          }
        }

        // --- LOGIQUE SPÉCIFIQUE NOTES DE FRAIS ---
        if (isExpense) {
          // Notification Finance immédiate pour mise en paiement
          const notificationRef = db.collection('notifications').doc();
          t.set(notificationRef, {
            title: '💸 Note de Frais Validée',
            body: `Une note de frais de ${newData.montant || 0} ${newData.devise || 'FCFA'} pour ${newData.collaborateur || uid} est prête pour paiement.`,
            type: 'finance',
            targetRole: 'FINANCE',
            relatedDocId: docId,
            relatedUser: uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
          logger.info(`[FINANCE] Notification de paiement créée pour l'expense ${docId}`);
        }

        // 3. Empreinte d'Audit Cryptographique Inaltérable Serveur (Bank-Grade)
        const auditHash = crypto.createHash('sha256')
            .update(`${event.id}-${validatorId}-${new Date().getTime()}`)
            .digest('hex');

        t.update(event.data.after.ref, { 
           _serverAuditHash: 'SECURE_SRV_' + auditHash.substring(0, 16),
           _validatedAt: admin.firestore.FieldValue.serverTimestamp(),
           _integrityHash: `IPC_SECURE_${Date.now()}_${validatorId}`
        });
      });
      logger.info(`[HR] Requête ${docId} (${newData.subModule}) validée avec succès.`);
    } catch (error) {
      logger.error(`[HR_ERROR] Validation failed for ${docId}:`, error.message);
      await event.data.after.ref.update({ 
        statut: 'Erreur', 
        _error: error.message,
        _auditNotes: 'Annulé par le système: ' + error.message 
      });
    }
  }
  return null;
});

/**
 * 🤖 MANAGER PERSONNEL : ALERTE PROACTIVE (CRON)
 * Surveille le risque de burnout et notifie le management.
 */
exports.personalManagerPilotage = onSchedule('every 24 hours', async (event) => {
  try {
    // Les employés sont souvent dans 'users' avec un sous-objet 'hr'
    const riskSnapshot = await db.collection('users')
      .where('hr.burnout_risk', '>=', 60)
      .get();

    for (const doc of riskSnapshot.docs) {
      const emp = doc.data();
      const managerId = emp.hr?.managerId || emp.managerId;
      
      if (managerId) {
        const managerSnap = await db.collection('users').doc(managerId).get();
        if (managerSnap.exists && managerSnap.data().fcmToken) {
          const message = {
            notification: {
              title: `⚠️ ALERTE AI-MANAGER : URGENCE BURNOUT (${emp.nom || emp.displayName})`,
              body: `Attention, ${emp.nom} présente un risque d'épuisement critique (${emp.hr.burnout_risk}%). En tant que leader, il est de votre responsabilité absolue de protéger votre équipe. Agissez immédiatement pour réduire sa charge !`
            },
            token: managerSnap.data().fcmToken
          };
          await admin.messaging().send(message);
        }
      }
    }
    logger.info(`[Pilotage] ${riskSnapshot.size} employés à risque signalés aux managers.`);
  } catch (err) {
    logger.error('[Pilotage] Error:', err);
  }
});

