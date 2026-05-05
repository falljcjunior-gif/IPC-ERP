const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const { logger } = require("firebase-functions");
const greenblock = require("./greenblock");
const mail = require("./mail");

const db = admin.firestore();

/**
 * ══════════════════════════════════════════════════════════════
 * OUTBOX WORKER (CRON) — RÉSILENCE & RETRY
 * ══════════════════════════════════════════════════════════════
 * Scanne la file d'attente (sync_queue) toutes les 5 minutes 
 * pour relancer les synchronisations IPC Green Block en échec ou en attente.
 */
exports.processOutboxQueue = onSchedule("every 5 minutes", async (event) => {
  logger.info("[Outbox Worker] Démarrage du traitement de la file de synchronisation...");

  try {
    // On limite à 50 documents pour éviter les TimeOut de la fonction
    // On prend aussi les "failed" pour faire du retry (max attempts < 5)
    const pendingTasks = await db.collection("sync_queue")
      .where("status", "in", ["pending", "failed"])
      .where("attempts", "<", 5) // Garde-fou pour ne pas boucler à l'infini
      .limit(50)
      .get();

    if (pendingTasks.empty) {
      logger.info("[Outbox Worker] File vide, aucune tâche en attente.");
      return;
    }

    logger.info(`[Outbox Worker] ${pendingTasks.size} tâches trouvées.`);
    const now = admin.firestore.FieldValue.serverTimestamp();

    for (const doc of pendingTasks.docs) {
      const task = doc.data();
      
      // 🛡️ [SECURITY FIX AUD-003] Atomicity: Mark as processing immediately
      await doc.ref.update({ 
        status: "processing", 
        lastAttemptAt: admin.firestore.FieldValue.serverTimestamp() 
      });

      if (task.target === "greenblock") {
        logger.info(`[Outbox Worker] Traitement tâche IPC Green Block: ${doc.id}`);
        
        try {
          const result = await greenblock.syncRecord(task.model, task.payload, doc.id);
          
          if (result.success) {
            await doc.ref.update({
              status: "completed",
              completedAt: admin.firestore.FieldValue.serverTimestamp(),
              attempts: admin.firestore.FieldValue.increment(1)
            });
            logger.info(`[Outbox Worker] Succès pour ${doc.id}`);
          } else {
            await doc.ref.update({
              status: "failed",
              error: result.error || result.status || "Erreur Inconnue",
              attempts: admin.firestore.FieldValue.increment(1)
            });
            logger.warn(`[Outbox Worker] Échec pour ${doc.id}`);
          }
        } catch (err) {
          await doc.ref.update({
            status: "failed",
            error: err.message,
            attempts: admin.firestore.FieldValue.increment(1)
          });
          logger.error(`[Outbox Worker] Erreur d'exécution pour ${doc.id}: ${err.message}`);
        }
      }
    }
    // 📧 2. Traitement de la file Mail Outbox
    logger.info("[Outbox Worker] Démarrage du traitement de la file Mail...");
    await mail.processMailOutbox();

    logger.info("[Outbox Worker] Traitement terminé avec succès.");
    
  } catch (error) {
    logger.error("[Outbox Worker] Erreur globale du Cron:", error);
  }
});
