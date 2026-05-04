/**
 * ══════════════════════════════════════════════════════════════
 * RFM ENGINE — IPC Green Block
 * Calcule les scores RFM (Récence, Fréquence, Montant) pour chaque
 * client et met à jour leur segment automatiquement toutes les 24h.
 * ══════════════════════════════════════════════════════════════
 */
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

// ── Segments et leurs libellés métier ──
const SEGMENTS = {
  VIP_PLATINUM: { label: 'VIP Platine',  minScore: 13, color: '#7C3AED', priority: 1 },
  VIP_GOLD:     { label: 'VIP Or',       minScore: 10, color: '#F59E0B', priority: 2 },
  ACTIF:        { label: 'Client Actif', minScore: 7,  color: '#10B981', priority: 3 },
  A_RISQUE:     { label: 'À Risque',     minScore: 4,  color: '#EF4444', priority: 4 },
  INACTIF:      { label: 'Inactif',      minScore: 0,  color: '#9CA3AF', priority: 5 },
};

/**
 * Calcule le score RFM d'un client à partir de son historique de factures.
 */
function computeRFM(invoices) {
  if (!invoices || invoices.length === 0) {
    return { rScore: 1, fScore: 1, mScore: 1, total: 3, segment: 'INACTIF', ltv: 0, avgOrderValue: 0 };
  }

  const now = Date.now();
  const montants = invoices.map(i => parseFloat(i.montant || 0));
  const dates = invoices.map(i => {
    const d = i.createdAt;
    if (!d) return 0;
    if (typeof d.toMillis === 'function') return d.toMillis();
    return new Date(d).getTime();
  }).filter(d => d > 0);

  const recenceJours = dates.length > 0
    ? (now - Math.max(...dates)) / (1000 * 3600 * 24)
    : 999;
  const frequence = invoices.length;
  const ltv = montants.reduce((a, b) => a + b, 0);
  const avgOrderValue = frequence > 0 ? ltv / frequence : 0;

  // Scoring Récence (1-5)
  const rScore = recenceJours < 30 ? 5
    : recenceJours < 60  ? 4
    : recenceJours < 120 ? 3
    : recenceJours < 180 ? 2 : 1;

  // Scoring Fréquence (1-5)
  const fScore = frequence >= 10 ? 5
    : frequence >= 6 ? 4
    : frequence >= 3 ? 3
    : frequence >= 1 ? 2 : 1;

  // Scoring Montant (1-5) — seuils en FCFA
  const mScore = ltv >= 5_000_000 ? 5
    : ltv >= 1_000_000 ? 4
    : ltv >= 200_000   ? 3
    : ltv >= 50_000    ? 2 : 1;

  const total = rScore + fScore + mScore;

  let segment = 'INACTIF';
  if (total >= 13) segment = 'VIP_PLATINUM';
  else if (total >= 10) segment = 'VIP_GOLD';
  else if (total >= 7)  segment = 'ACTIF';
  else if (total >= 4)  segment = 'A_RISQUE';

  return { rScore, fScore, mScore, total, segment, ltv, avgOrderValue, recenceJours, frequence };
}

/**
 * CRON: Recalcul complet des scores RFM toutes les 24h.
 * Lit toutes les factures, groupe par client, calcule et écrit les scores.
 */
exports.computeRFMScores = onSchedule({
  schedule: 'every 24 hours',
  timeZone: 'Africa/Abidjan',
}, async (event) => {
  logger.info('[RFM Engine] Démarrage du recalcul RFM...');

  try {
    // 1. Lire toutes les factures
    const invoicesSnap = await db.collection('finance').get();
    const clientInvoiceMap = {};

    for (const moduleDoc of invoicesSnap.docs) {
      const subSnap = await moduleDoc.ref.collection('invoices').get();
      subSnap.forEach(doc => {
        const inv = doc.data();
        const clientId = inv.clientId || inv.client;
        if (!clientId) return;
        if (!clientInvoiceMap[clientId]) clientInvoiceMap[clientId] = [];
        clientInvoiceMap[clientId].push(inv);
      });
    }

    // Fallback: collection plate finance_invoices
    const flatInvoicesSnap = await db.collection('finance_invoices').get();
    flatInvoicesSnap.forEach(doc => {
      const inv = doc.data();
      const clientId = inv.clientId || inv.client;
      if (!clientId) return;
      if (!clientInvoiceMap[clientId]) clientInvoiceMap[clientId] = [];
      clientInvoiceMap[clientId].push(inv);
    });

    if (Object.keys(clientInvoiceMap).length === 0) {
      logger.info('[RFM Engine] Aucun client avec des factures trouvé. Fin.');
      return;
    }

    // 2. Calculer les scores et écrire en batch
    const BATCH_SIZE = 450; // Firestore limit: 500
    let batch = db.batch();
    let opCount = 0;
    let clientsProcessed = 0;

    // Agrégats pour le cache analytics
    const segmentCounts = { VIP_PLATINUM: 0, VIP_GOLD: 0, ACTIF: 0, A_RISQUE: 0, INACTIF: 0 };
    let totalLTV = 0;

    for (const [clientId, invoices] of Object.entries(clientInvoiceMap)) {
      const rfm = computeRFM(invoices);
      segmentCounts[rfm.segment] = (segmentCounts[rfm.segment] || 0) + 1;
      totalLTV += rfm.ltv;

      // Chercher le client dans crm.clients ou crm_clients
      const clientRef = db.collection('crm').doc('clients').collection('records').doc(clientId);
      const flatClientRef = db.collection('crm_clients').doc(clientId);

      const rfmData = {
        rfm: {
          ...rfm,
          segmentLabel: SEGMENTS[rfm.segment]?.label || rfm.segment,
          segmentColor: SEGMENTS[rfm.segment]?.color || '#9CA3AF',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }
      };

      batch.set(clientRef, rfmData, { merge: true });
      batch.set(flatClientRef, rfmData, { merge: true });
      opCount += 2;
      clientsProcessed++;

      if (opCount >= BATCH_SIZE) {
        await batch.commit();
        batch = db.batch();
        opCount = 0;
      }
    }

    if (opCount > 0) await batch.commit();

    // 3. Mettre à jour le cache analytics global
    const avgLTV = clientsProcessed > 0 ? totalLTV / clientsProcessed : 0;
    await db.collection('analytics_cache').doc('rfm').set({
      segments: segmentCounts,
      totalClients: clientsProcessed,
      avgLTV,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info(`[RFM Engine] ✅ ${clientsProcessed} clients mis à jour. Segments:`, segmentCounts);
  } catch (err) {
    logger.error('[RFM Engine] Erreur critique:', err);
  }
});

/**
 * TRIGGER: Recalcul RFM instantané quand une facture est créée/modifiée.
 * Garantit que le segment d'un client est toujours à jour après un achat.
 */
exports.recomputeClientRFMOnInvoice = onDocumentWritten('finance_invoices/{invoiceId}', async (event) => {
  const afterData = event.data.after.exists ? event.data.after.data() : null;
  if (!afterData) return null;

  const clientId = afterData.clientId || afterData.client;
  if (!clientId) return null;

  try {
    // Charger toutes les factures de ce client
    const clientInvoicesSnap = await db.collection('finance_invoices')
      .where('clientId', '==', clientId)
      .get();

    const invoices = clientInvoicesSnap.docs.map(d => d.data());
    const rfm = computeRFM(invoices);

    const rfmData = {
      rfm: {
        ...rfm,
        segmentLabel: SEGMENTS[rfm.segment]?.label || rfm.segment,
        segmentColor: SEGMENTS[rfm.segment]?.color || '#9CA3AF',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }
    };

    await db.collection('crm_clients').doc(clientId).set(rfmData, { merge: true });
    logger.info(`[RFM Engine] Score recalculé pour client ${clientId}: ${rfm.segment} (${rfm.total}/15)`);
  } catch (err) {
    logger.error(`[RFM Engine] Erreur recalcul client ${clientId}:`, err);
  }

  return null;
});
