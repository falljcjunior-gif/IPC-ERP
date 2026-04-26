const { onDocumentWritten, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const axelor = require('./axelor');

const db = admin.firestore();

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
