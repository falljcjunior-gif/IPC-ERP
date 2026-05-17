/**
 * ════════════════════════════════════════════════════════════════
 * JARVIS PROACTIVE MONITOR — Surveillance autonome de l'ERP
 * ════════════════════════════════════════════════════════════════
 *
 * Tourne toutes les 2h. Scanne les collections critiques et publie
 * des alertes dans notifications_queue si des anomalies sont détectées.
 *
 * Anomalies surveillées :
 *   1. Factures en retard de paiement
 *   2. Produits sous le seuil de stock minimum
 *   3. Demandes de congé sans réponse depuis +48h
 *   4. Leads CRM sans activité depuis +14 jours
 */

const { onSchedule } = require('firebase-functions/v2/scheduler');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

exports.jarvisMonitor = onSchedule({
  schedule: 'every 2 hours',
  region: 'us-central1',
  timeoutSeconds: 120,
}, async () => {
  logger.info('[JARVIS Monitor] Scan proactif démarré');
  const alerts = [];
  const now = new Date();

  try {
    // 1. Factures en retard
    const overdueSnap = await db.collection('finance')
      .where('subModule', '==', 'invoices')
      .where('statut', '==', 'En retard')
      .get();
    if (overdueSnap.size > 0) {
      alerts.push({
        message: `⚠️ JARVIS : ${overdueSnap.size} facture(s) en retard de paiement détectée(s).`,
        priority: 'warning',
        module: 'finance',
        type: 'JARVIS_PROACTIVE',
      });
    }

    // 2. Stock sous seuil minimum
    const stockSnap = await db.collection('inventory')
      .where('subModule', '==', 'products')
      .get();
    const lowStock = stockSnap.docs.filter(d => {
      const data = d.data();
      const stock = data.stockReel ?? data.stock_reel ?? 0;
      const seuil = data.stockMinimum ?? data.seuil_alerte ?? 0;
      return stock <= seuil && seuil > 0;
    });
    if (lowStock.length > 0) {
      alerts.push({
        message: `🔴 JARVIS : ${lowStock.length} produit(s) sous le seuil de stock minimum.`,
        priority: 'critical',
        module: 'inventory',
        type: 'JARVIS_PROACTIVE',
      });
    }

    // 3. Congés en attente depuis +48h
    const cutoff48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const pendingLeaves = await db.collection('hr')
      .where('subModule', '==', 'leaves')
      .where('statut', '==', 'En attente')
      .get();
    const staleLeaves = pendingLeaves.docs.filter(d => {
      const ts = d.data()._createdAt?.toDate?.();
      return ts && ts < cutoff48h;
    });
    if (staleLeaves.length > 0) {
      alerts.push({
        message: `📋 JARVIS : ${staleLeaves.length} demande(s) de congé sans réponse depuis +48h.`,
        priority: 'warning',
        module: 'hr',
        type: 'JARVIS_PROACTIVE',
      });
    }

    // 4. Leads CRM stagnants depuis +14 jours
    const cutoff14d = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const crmSnap = await db.collection('crm')
      .where('statut', 'not-in', ['Gagné', 'Perdu'])
      .get();
    const stagnant = crmSnap.docs.filter(d => {
      const data = d.data();
      const ts = data._updatedAt?.toDate?.() || data._createdAt?.toDate?.();
      return ts && ts < cutoff14d;
    });
    if (stagnant.length >= 3) {
      alerts.push({
        message: `📉 JARVIS : ${stagnant.length} opportunités CRM sans activité depuis 14 jours.`,
        priority: 'info',
        module: 'crm',
        type: 'JARVIS_PROACTIVE',
      });
    }

    // Écrire toutes les alertes en batch atomique
    if (alerts.length > 0) {
      const batch = db.batch();
      for (const alert of alerts) {
        const ref = db.collection('notifications_queue').doc();
        batch.set(ref, { ...alert, createdAt: admin.firestore.FieldValue.serverTimestamp() });
      }
      await batch.commit();
      logger.info(`[JARVIS Monitor] ${alerts.length} alerte(s) publiée(s)`);
    } else {
      logger.info('[JARVIS Monitor] Aucune anomalie détectée');
    }
  } catch (err) {
    logger.error('[JARVIS Monitor] Erreur lors du scan:', err);
  }
});
