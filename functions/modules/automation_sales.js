/**
 * ══════════════════════════════════════════════════════════════
 * AUTOMATION SALES — IPC Green Block
 * Automatisations commerciales : relances de devis, facturation
 * récurrente, alertes de réapprovisionnement stock.
 * ══════════════════════════════════════════════════════════════
 */
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

// ──────────────────────────────────────────────────────────────
// AUTOMATION #1 — RELANCE AUTOMATIQUE DE DEVIS
// Déclencheur: Cron toutes les 24h
// Action: Relance les opportunités CRM en étape "Proposition"
//         ou "Qualification" sans activité depuis N jours.
// ──────────────────────────────────────────────────────────────
const RELANCE_RULES = [
  { etape: 'Qualification', seuilJours: 5,  escalade: 'Proposition',  priorite: 'Normal' },
  { etape: 'Proposition',   seuilJours: 7,  escalade: null,            priorite: 'Urgent' },
  { etape: 'Négociation',   seuilJours: 10, escalade: null,            priorite: 'Critique' },
];

exports.devisRelanceAutomatic = onSchedule({
  schedule: 'every 24 hours',
  timeZone: 'Africa/Abidjan',
}, async (event) => {
  logger.info('[Automation Sales] Démarrage relance devis...');

  const now = new Date();
  let totalRelances = 0;

  try {
    for (const rule of RELANCE_RULES) {
      const seuil = new Date(now.getTime() - rule.seuilJours * 24 * 3600 * 1000);
      const seuilISO = seuil.toISOString();

      // Chercher les opportunités stagnantes
      const oppsSnap = await db.collection('crm_opportunities')
        .where('etape', '==', rule.etape)
        .get();

      const batch = db.batch();
      let batchCount = 0;

      for (const doc of oppsSnap.docs) {
        const opp = doc.data();
        
        // Vérifier la date de dernière mise à jour
        const lastUpdate = opp._updatedAt || opp.createdAt;
        if (!lastUpdate || lastUpdate > seuilISO) continue;

        // Éviter les doubles relances (cooldown de 3 jours)
        const lastRelance = opp._lastRelanceAt;
        if (lastRelance) {
          const cooldown = new Date(now.getTime() - 3 * 24 * 3600 * 1000).toISOString();
          if (lastRelance > cooldown) continue;
        }

        // Enregistrer la notification de relance
        const notifRef = db.collection('notifications_queue').doc();
        batch.set(notifRef, {
          type: 'DEVIS_RELANCE',
          priority: rule.priorite,
          targetId: doc.id,
          targetRef: `crm_opportunities/${doc.id}`,
          clientId: opp.clientId || opp.client,
          clientNom: opp.client || opp.entreprise,
          montant: opp.montant || 0,
          commercial: opp.responsable || null,
          etape: opp.etape,
          message: `⏰ Relance requise : L'opportunité "${opp.titre || opp.nom}" (${opp.etape}) est sans activité depuis ${rule.seuilJours} jours.`,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'pending',
          channel: ['in_app', 'push'],
        });

        // Mettre à jour la priorité de l'opportunité
        const updates = {
          priorite: rule.priorite,
          _lastRelanceAt: now.toISOString(),
          _autoRelance: true,
          _relanceCount: admin.firestore.FieldValue.increment(1),
          _updatedAt: now.toISOString(),
        };

        // Escalade vers l'étape suivante si configurée
        if (rule.escalade && opp._relanceCount >= 1) {
          updates.etape = rule.escalade;
          updates._autoEscalade = true;
        }

        batch.update(doc.ref, updates);
        batchCount++;
        totalRelances++;

        if (batchCount >= 450) {
          await batch.commit();
          batchCount = 0;
        }
      }

      if (batchCount > 0) await batch.commit();
    }

    // Mettre à jour le cache analytics
    await db.collection('analytics_cache').doc('automations').set({
      lastRelanceRun: admin.firestore.FieldValue.serverTimestamp(),
      totalRelancesToday: totalRelances,
    }, { merge: true });

    logger.info(`[Automation Sales] ✅ ${totalRelances} relances de devis planifiées.`);
  } catch (err) {
    logger.error('[Automation Sales] Erreur relance devis:', err);
  }
});


// ──────────────────────────────────────────────────────────────
// AUTOMATION #2 — ALERTE RÉAPPROVISIONNEMENT STOCK
// Déclencheur: Mise à jour d'un produit en Firestore
// Action: Crée un bon de commande en brouillon si stock < seuil
// ──────────────────────────────────────────────────────────────
exports.stockReorderAlert = onDocumentUpdated('inventory_products/{productId}', async (event) => {
  const newData = event.data.after.data();
  const oldData = event.data.before.data();
  const { productId } = event.params;

  const stockActuel = parseFloat(newData.stockActuel || 0);
  const stockMinimum = parseFloat(newData.stockMinimum || newData.seuilAlerte || 10);

  // Déclencher seulement si le stock vient de passer sous le seuil
  const stockAvant = parseFloat(oldData.stockActuel || 0);
  const venaitDePasser = stockAvant > stockMinimum && stockActuel <= stockMinimum;

  if (!venaitDePasser || newData._reorderInProgress) return null;

  // Éviter les doublons (idempotency)
  const existingOrder = await db.collection('purchase_orders')
    .where('productId', '==', productId)
    .where('statut', '==', 'Brouillon')
    .where('_autoGenerated', '==', true)
    .get();

  if (!existingOrder.empty) {
    logger.info(`[Stock Reorder] Bon de commande brouillon déjà existant pour ${productId}.`);
    return null;
  }

  const quantiteACommander = parseFloat(newData.stockCible || stockMinimum * 3) - stockActuel;

  try {
    const batch = db.batch();

    // 1. Créer le bon de commande en brouillon
    const poRef = db.collection('purchase_orders').doc();
    batch.set(poRef, {
      num: `PO-AUTO-${Date.now()}`,
      produit: newData.nom || newData.name,
      productId,
      quantite: Math.ceil(quantiteACommander),
      prixUnitaire: newData.prixAchat || 0,
      fournisseur: newData.fournisseurPrincipal || null,
      statut: 'Brouillon',
      urgence: stockActuel === 0 ? 'CRITIQUE' : 'Normal',
      _autoGenerated: true,
      _reason: 'Seuil de réapprovisionnement atteint',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      _domain: 'purchase',
    });

    // 2. Créer la notification pour l'acheteur
    const notifRef = db.collection('notifications_queue').doc();
    batch.set(notifRef, {
      type: 'STOCK_REORDER',
      priority: stockActuel === 0 ? 'Critique' : 'Urgent',
      productId,
      productNom: newData.nom || newData.name,
      stockActuel,
      stockMinimum,
      poRef: poRef.id,
      message: `📦 Réassort auto : "${newData.nom}" est sous le seuil (${stockActuel} / ${stockMinimum} unités). Bon de commande brouillon créé.`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
      channel: ['in_app', 'push'],
    });

    // 3. Marquer le produit pour éviter les doublons
    batch.update(event.data.after.ref, {
      _reorderInProgress: true,
      _lastReorderAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();
    logger.info(`[Stock Reorder] ✅ Bon de commande créé pour ${newData.nom} (${productId}), qté: ${Math.ceil(quantiteACommander)}`);
  } catch (err) {
    logger.error(`[Stock Reorder] Erreur pour ${productId}:`, err);
  }

  return null;
});


// ──────────────────────────────────────────────────────────────
// AUTOMATION #3 — FACTURATION RÉCURRENTE
// Déclencheur: Cron tous les jours à 06:00
// Action: Génère automatiquement les factures pour les contrats
//         avec typeFacturation = 'mensuel' | 'trimestriel'
// ──────────────────────────────────────────────────────────────
exports.generateRecurringInvoices = onSchedule({
  schedule: '0 6 * * *',  // Chaque jour à 6h00
  timeZone: 'Africa/Abidjan',
}, async (event) => {
  logger.info('[Facturation Récurrente] Démarrage...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString().split('T')[0];

  try {
    const contrats = await db.collection('legal_contracts')
      .where('typeFacturation', 'in', ['mensuel', 'trimestriel', 'annuel'])
      .where('statut', '==', 'Actif')
      .get();

    let generated = 0;
    const batch = db.batch();

    for (const doc of contrats.docs) {
      const contrat = doc.data();
      const prochaine = contrat.prochaineDateFacture;

      if (!prochaine || prochaine > todayISO) continue;

      // Calcul de la prochaine date de facturation
      const dateRef = new Date(prochaine);
      let prochaineDateFacture;
      if (contrat.typeFacturation === 'mensuel') {
        prochaineDateFacture = new Date(dateRef.setMonth(dateRef.getMonth() + 1)).toISOString().split('T')[0];
      } else if (contrat.typeFacturation === 'trimestriel') {
        prochaineDateFacture = new Date(dateRef.setMonth(dateRef.getMonth() + 3)).toISOString().split('T')[0];
      } else {
        prochaineDateFacture = new Date(dateRef.setFullYear(dateRef.getFullYear() + 1)).toISOString().split('T')[0];
      }

      // Créer la facture
      const invoiceRef = db.collection('finance_invoices').doc();
      batch.set(invoiceRef, {
        num: `INV-REC-${Date.now()}-${generated}`,
        client: contrat.client,
        clientId: contrat.clientId,
        contratId: doc.id,
        montant: contrat.montantMensuel || contrat.montantContrat || 0,
        statut: 'À envoyer',
        dateEmission: todayISO,
        dateEcheance: new Date(today.getTime() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        _autoGenerated: true,
        _type: 'recurrente',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        _domain: 'finance',
      });

      // Mettre à jour la prochaine date sur le contrat
      batch.update(doc.ref, { prochaineDateFacture });
      generated++;
    }

    if (generated > 0) await batch.commit();

    await db.collection('analytics_cache').doc('automations').set({
      lastInvoiceRun: admin.firestore.FieldValue.serverTimestamp(),
      recurringInvoicesToday: generated,
    }, { merge: true });

    logger.info(`[Facturation Récurrente] ✅ ${generated} factures auto-générées.`);
  } catch (err) {
    logger.error('[Facturation Récurrente] Erreur:', err);
  }
});


// ──────────────────────────────────────────────────────────────
// AUTOMATION #4 — ANNIVERSAIRE CLIENT & INACTIVITÉ
// Déclencheur: Cron journalier à 08:00
// Action: Notification au commercial si un client VIP n'a pas
//         commandé depuis 90 jours ou si c'est son anniversaire
// ──────────────────────────────────────────────────────────────
exports.clientEngagementAlerts = onSchedule({
  schedule: '0 8 * * *',
  timeZone: 'Africa/Abidjan',
}, async (event) => {
  const now = new Date();
  const today = `${now.getMonth() + 1}-${now.getDate()}`; // MM-DD sans année

  try {
    const clientsSnap = await db.collection('crm_clients').get();
    const batch = db.batch();
    let alertCount = 0;

    for (const doc of clientsSnap.docs) {
      const client = doc.data();
      
      // Alerte anniversaire (ignorer l'année)
      if (client.dateNaissance) {
        const bday = new Date(client.dateNaissance);
        const bdayStr = `${bday.getMonth() + 1}-${bday.getDate()}`;
        if (bdayStr === today) {
          const notifRef = db.collection('notifications_queue').doc();
          batch.set(notifRef, {
            type: 'CLIENT_ANNIVERSARY',
            clientId: doc.id,
            clientNom: client.nom,
            message: `🎂 Anniversaire : ${client.nom} fête son anniversaire aujourd'hui. Envoyez un message personnalisé !`,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'pending', channel: ['in_app'],
          });
          alertCount++;
        }
      }

      // Alerte inactivité pour clients Gold/Platinum
      const rfmSegment = client.rfm?.segment;
      if (['VIP_PLATINUM', 'VIP_GOLD'].includes(rfmSegment)) {
        const recence = client.rfm?.recenceJours || 0;
        if (recence >= 90) {
          const notifRef = db.collection('notifications_queue').doc();
          batch.set(notifRef, {
            type: 'CLIENT_INACTIF_VIP',
            clientId: doc.id,
            clientNom: client.nom,
            segment: rfmSegment,
            recenceJours: Math.round(recence),
            message: `⚠️ Client ${rfmSegment === 'VIP_PLATINUM' ? '🥇 Platine' : '🥈 Or'} inactif : ${client.nom} n'a pas commandé depuis ${Math.round(recence)} jours.`,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'pending', channel: ['in_app', 'push'],
          });
          alertCount++;
        }
      }
    }

    if (alertCount > 0) await batch.commit();
    logger.info(`[Client Engagement] ✅ ${alertCount} alertes générées.`);
  } catch (err) {
    logger.error('[Client Engagement] Erreur:', err);
  }
});
