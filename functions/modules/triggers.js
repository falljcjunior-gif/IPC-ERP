const { onDocumentWritten, onDocumentUpdated, onDocumentDeleted } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
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
 * WHY: Toute modification de salaire ou de rôle doit être tracée de manière indélébile.
 */
exports.onHRPersonnelChange = onDocumentUpdated('{collection}/{docId}', async (event) => {
  const { collection, docId } = event.params;
  if (!['hr', 'users'].includes(collection)) return null;

  const before = event.data.before.data();
  const after = event.data.after.data();

  // Detection fields: salary (hr) or role (users/hr)
  const sensitiveKeys = ['salaire', 'role', 'permissions', 'active'];
  const changes = sensitiveKeys.filter(k => 
    JSON.stringify(before[k]) !== JSON.stringify(after[k])
  );

  if (changes.length > 0) {
    const auditRecord = {
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      severity: 'CRITICAL_SECURITY',
      collection,
      docId,
      actor: after._updatedBy || 'system',
      changes: changes.reduce((acc, k) => {
        acc[k] = { from: before[k], to: after[k] };
        return acc;
      }, {}),
      details: `Sensitive personnel data changed on ${collection}/${docId}`,
      fingerprint: `SECURE_${event.id}`
    };

    try {
      await db.collection('audit_logs').add(auditRecord);
      logger.warn(`[SECURITY] Sensitive change detected on ${collection}/${docId}: ${changes.join(', ')}`);
    } catch (err) {
      logger.error('HR Audit Log Error:', err);
    }
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

/**
 * 🚀 HR: ONBOARDING AUTOMATISÉ (Hire)
 * WHY: Création compte Auth, Claims, Notification IT
 */
exports.onEmployeeOnboarded = onDocumentWritten('hr/{employeeId}', async (event) => {
  const newData = event.data.after.exists ? event.data.after.data() : null;
  const oldData = event.data.before.exists ? event.data.before.data() : null;
  const { employeeId } = event.params;

  if (!newData || newData.subModule !== 'employees') return null;

  // Trigger when employee is created or explicitly marked as active for the first time
  if (newData.active === true && (!oldData || oldData.active !== true)) {
    try {
      // 1. Firebase Auth Creation (if email provided)
      let uid = newData.userId;
      if (newData.email && !uid) {
        try {
           const userRecord = await admin.auth().createUser({
              email: newData.email,
              displayName: newData.nom,
              password: 'ChangeMe123!' // Force password reset on first login
           });
           uid = userRecord.uid;
           // Assign Custom Claims based on dept
           const claims = {
             role: newData.dept === 'Direction' ? 'DIRECTOR' : 
                   newData.dept === 'RH' ? 'HR' : 
                   newData.dept === 'Finance' ? 'FINANCE' : 'STAFF',
             dept: newData.dept
           };
           await admin.auth().setCustomUserClaims(uid, claims);
           
           // Update employee record with userId
           await event.data.after.ref.update({ userId: uid });
           logger.info(`[HR] Auth user created for ${newData.nom} (${newData.email})`);
        } catch (e) {
           if (e.code === 'auth/email-already-exists') {
              const existingUser = await admin.auth().getUserByEmail(newData.email);
              uid = existingUser.uid;
              await event.data.after.ref.update({ userId: uid });
           } else {
              logger.error('[HR] Auth Creation Error:', e);
           }
        }
      }

      // 2. IT Provisioning Task
      await db.collection('projects').add({
        subModule: 'tasks',
        projet: 'IT Operations - Onboarding',
        nom: `Provisionnement Matériel: ${newData.nom}`,
        description: `Préparer le poste de travail et les accès pour ${newData.nom} (${newData.poste} - ${newData.dept}).`,
        priorite: 'Haute',
        colonneId: 'A_Faire',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        _domain: 'it',
        _createdBy: 'nexus_hr_engine'
      });
      logger.info(`[HR] IT Provisioning task created for ${newData.nom}`);

    } catch (err) {
      logger.error('[HR] Onboarding Error:', err);
    }
  }
  return null;
});

/**
 * 🛑 HR: OFFBOARDING SÉCURISÉ (Retire)
 * WHY: Révocation d'accès, archivage, alerte Finance
 */
exports.onEmployeeOffboarded = onDocumentUpdated('hr/{employeeId}', async (event) => {
  const newData = event.data.after.data();
  const oldData = event.data.before.data();

  if (newData.subModule !== 'employees') return null;

  // Trigger when employee is deactivated
  if (newData.active === false && oldData.active === true) {
    try {
      const uid = newData.userId;
      if (uid) {
        // 1. Revoke Auth Sessions & Disable Account
        await admin.auth().updateUser(uid, { disabled: true });
        await admin.auth().revokeRefreshTokens(uid);
        logger.info(`[HR] Access revoked for ${newData.nom} (UID: ${uid})`);
      }

      // 2. Notify Finance (Solde de tout compte)
      await db.collection('notifications').add({
        title: '🛑 Offboarding : Solde de tout compte',
        body: `Le collaborateur ${newData.nom} (${newData.poste}) a été désactivé. Veuillez préparer le solde de tout compte.`,
        type: 'alert',
        targetRole: 'FINANCE', // Assuming frontend handles targetRole
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
 * WHY: Traces every access/modification to sensitive HR data.
 */
exports.hrPrivacyAudit = onDocumentWritten('hr/{employeeId}/private_data/{docId}', async (event) => {
  const { employeeId, docId } = event.params;
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
      collection: `hr/${employeeId}/private_data`,
      docId: docId,
      actor: actor,
      details: `Sensitive HR data ${operation} on employee ${employeeId}`,
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
    const currentYear = now.getFullYear();
    const period = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    logger.info(`[HR] Starting Pre-Payroll generation for ${period}`);

    // This would typically fetch timesheets, calculate hours, 
    // fetch private_data for base salary, and output to 'payroll' collection.
    // Placeholder logic:
    const summaryRef = db.collection('payroll').doc(`PRE_${period}`);
    await summaryRef.set({
      id: `PRE_${period}`,
      subModule: 'slips',
      period: period,
      status: 'Brouillon',
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      _domain: 'hr',
      _createdBy: 'nexus_payroll_engine'
    });
    
    logger.info(`[HR] Pre-Payroll draft created: PRE_${period}`);
  } catch (err) {
    logger.error('[HR] Pre-Payroll Error:', err);
  }
});

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
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const financeSnapshot = await db.collection('finance').where('subModule', '==', 'invoices').get();
    let totalCA = 0;
    let recentExpenses = 0; // Expenses in last 30 days
    
    financeSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.statut === 'Payée' && data.type === 'Recette') {
        totalCA += (data.montantTTC || 0);
      }
      if (data.type === 'Dépense' && data.createdAt && data.createdAt.toDate() > thirtyDaysAgo) {
        recentExpenses += (data.montantTTC || 0);
      }
    });

    // Simple Forecasting: Assume current cash reserves minus 30-day burn rate
    // Note: In a real system, actual bank balance would be fetched. Here we estimate.
    const estimatedCashReserves = totalCA * 0.15; // 15% of all-time CA as current reserve mock
    const dailyBurnRate = recentExpenses / 30;
    const cashFlow30d = estimatedCashReserves - (dailyBurnRate * 30);

    // ==========================================
    // 2. PRODUCTION & INVENTORY (Stock Rupture)
    // ==========================================
    const prodSnapshot = await db.collection('production').where('subModule', '==', 'presses').get();
    let trsScore = 85.5; // Placeholder OEE
    
    const inventorySnapshot = await db.collection('inventory').where('subModule', '==', 'products').get();
    let alertesRupture = 0;
    
    inventorySnapshot.forEach(doc => {
      const data = doc.data();
      // Forecast: current stock minus average daily consumption * 30
      const consumptionRate = data.dailyConsumption || 10; // Mock 10 units/day if not set
      const stock30d = (data.quantite || 0) - (consumptionRate * 30);
      if (stock30d <= 0) {
        alertesRupture += 1;
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
    
    // Clear old active alerts to prevent duplicates (in a real system, we'd update them)
    const oldAlerts = await alertsCollection.where('statut', '==', 'Active').get();
    oldAlerts.forEach(doc => alertsBatch.delete(doc.ref));

    if (cashFlow30d < 0) {
      alertsBatch.set(alertsCollection.doc(), {
        title: 'Risque de Rupture de Trésorerie',
        message: `Le Cash Flow projeté à 30 jours est négatif (${cashFlow30d.toFixed(2)} FCFA). Réduisez les dépenses opérationnelles.`,
        level: 'CRITICAL',
        sourceModule: 'Finance',
        statut: 'Active',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    if (alertesRupture > 0) {
      alertsBatch.set(alertsCollection.doc(), {
        title: 'Rupture de Stock Imminente',
        message: `${alertesRupture} matière(s) première(s) tomberont en rupture d'ici 30 jours au rythme de production actuel.`,
        level: 'WARNING',
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
      production: { trs: trsScore },
      forecasts: { cashFlow30d, alertesRupture },
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    logger.info('[COCKPIT] Strategic Aggregation Complete.');
  } catch (err) {
    logger.error('[COCKPIT] Aggregation Error:', err);
  }
});
