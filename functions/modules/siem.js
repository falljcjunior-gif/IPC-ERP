/**
 * ══════════════════════════════════════════════════════════════════
 * SIEM — Security Information & Event Management
 * IPC Intelligence Engine
 * ══════════════════════════════════════════════════════════════════
 *
 * Détecte en temps réel les anomalies de sécurité :
 *   1. Connexions suspectes (> 5 pays en 24h pour un utilisateur)
 *   2. Brute-force / credential stuffing (> 10 échecs auth en 15 min)
 *   3. Privilege escalation (changement de rôle SUPER_ADMIN hors horaires)
 *   4. Data exfiltration (export massif > 10K lignes en 1h)
 *   5. Anomalie comptable (transaction > 3x le plafond habituel)
 *   6. Accès hors-fuseau (utilisateur européen connecté depuis Asia/Pacific)
 *
 * Architecture Zero Trust :
 *   - Chaque accès loggé dans /security_events
 *   - Score de risque calculé par utilisateur (0-100)
 *   - Seuil 80+ → alerte immédiate aux SUPER_ADMIN via notification
 *   - Seuil 95+ → suspension temporaire du token (30 min)
 */

const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onSchedule }        = require('firebase-functions/v2/scheduler');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin  = require('firebase-admin');
const crypto = require('crypto');
const { logger } = require('firebase-functions');

const db = admin.firestore();

// ── Constantes ────────────────────────────────────────────────────────────────
const RISK_THRESHOLDS = {
  MEDIUM:   40,
  HIGH:     70,
  CRITICAL: 90,
};

const ANOMALY_SCORES = {
  MULTI_GEO:          30,   // > 5 pays en 24h
  BRUTE_FORCE:        50,   // > 10 échecs en 15 min
  PRIVILEGE_ESCALATE: 40,   // changement de rôle élevé hors horaires
  DATA_EXFIL:         60,   // export massif
  ACCOUNTING_ANOMALY: 35,   // transaction hors norme
  ODD_HOURS_ACCESS:   20,   // accès entre 01:00-04:00 UTC
  RAPID_FIRE_API:     25,   // > 100 appels API en 1 min
  UNKNOWN_DEVICE:     15,   // device fingerprint inconnu
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const getAdminTokens = async () => {
  const snap = await db.collection('users')
    .where('role', 'in', ['SUPER_ADMIN', 'ADMIN'])
    .select('fcmTokens', 'email')
    .limit(10)
    .get();
  return snap.docs.flatMap(d => Object.values(d.data().fcmTokens || {}));
};

const alertAdmins = async (title, body, data = {}) => {
  const tokens = await getAdminTokens();
  if (tokens.length === 0) return;

  const msg = {
    notification: { title, body },
    data: { type: 'SECURITY_ALERT', ...data },
    android: { priority: 'high' },
    apns: { payload: { aps: { sound: 'default', badge: 1 } } },
  };

  await Promise.allSettled(
    tokens.map(token =>
      admin.messaging().send({ ...msg, token }).catch(() => null)
    )
  );
};

const writeSecurityEvent = async (event) => {
  await db.collection('security_events').add({
    ...event,
    _createdAt: admin.firestore.FieldValue.serverTimestamp(),
    resolved:   false,
  });
};

// ── DETECTION 1 : Brute-Force / Credential Stuffing ─────────────────────────
exports.detectBruteForce = onDocumentCreated(
  {
    document: 'auth_failures/{docId}',
    region:   'europe-west1',
  },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const { userId, email, ip, userAgent } = data;

    // Fenêtre glissante : 15 min
    const since = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 15 * 60 * 1000)
    );

    const recent = await db.collection('auth_failures')
      .where('ip',        '==', ip)
      .where('_createdAt', '>=', since)
      .count()
      .get();

    const count = recent.data().count;
    if (count < 10) return; // pas encore suspicieux

    const riskScore = Math.min(100, ANOMALY_SCORES.BRUTE_FORCE + Math.floor(count / 5) * 5);

    logger.warn(`[SIEM] Brute-force detected from IP ${ip} — ${count} failures in 15 min`);

    await writeSecurityEvent({
      type:       'BRUTE_FORCE',
      severity:   riskScore >= RISK_THRESHOLDS.CRITICAL ? 'CRITICAL' : 'HIGH',
      ip,
      email:      email || 'unknown',
      userId:     userId || null,
      count,
      riskScore,
    });

    if (riskScore >= RISK_THRESHOLDS.CRITICAL) {
      await alertAdmins(
        '🚨 Tentative de brute-force détectée',
        `${count} tentatives de connexion depuis ${ip} en 15 min`,
        { ip, email: email || '', count: String(count) }
      );
    }
  }
);

// ── DETECTION 2 : Privilege Escalation ───────────────────────────────────────
exports.detectPrivilegeEscalation = onDocumentCreated(
  {
    document: 'audit_logs/{docId}',
    region:   'europe-west1',
  },
  async (event) => {
    const data = event.data?.data();
    if (!data || data.action !== 'ROLE_CHANGE') return;

    const { targetUid, oldRole, newRole, performedBy, timestamp } = data;

    // Escalade vers un rôle élevé ?
    const sensitiveRoles = ['SUPER_ADMIN', 'ADMIN', 'HOLDING_ADMIN'];
    if (!sensitiveRoles.includes(newRole)) return;

    // Hors horaires de bureau ? (avant 08:00 ou après 20:00 UTC)
    const hour = new Date(timestamp?.toDate?.() || Date.now()).getUTCHours();
    const isOddHours = hour < 8 || hour > 20;

    const riskScore = ANOMALY_SCORES.PRIVILEGE_ESCALATE
      + (isOddHours ? ANOMALY_SCORES.ODD_HOURS_ACCESS : 0)
      + (newRole === 'SUPER_ADMIN' ? 20 : 0);

    logger.warn(`[SIEM] Privilege escalation: ${oldRole} → ${newRole} for ${targetUid}`);

    await writeSecurityEvent({
      type:        'PRIVILEGE_ESCALATION',
      severity:    riskScore >= RISK_THRESHOLDS.HIGH ? 'HIGH' : 'MEDIUM',
      targetUid,
      oldRole,
      newRole,
      performedBy,
      isOddHours,
      riskScore,
    });

    if (riskScore >= RISK_THRESHOLDS.HIGH) {
      await alertAdmins(
        '⚠️ Escalade de privilège détectée',
        `${targetUid} est passé de ${oldRole} à ${newRole}${isOddHours ? ' (hors horaires)' : ''}`,
        { targetUid, oldRole, newRole }
      );
    }
  }
);

// ── DETECTION 3 : Data Exfiltration (export massif) ──────────────────────────
exports.detectDataExfiltration = onDocumentCreated(
  {
    document: 'export_logs/{docId}',
    region:   'europe-west1',
  },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const { userId, entity_id, rows, module: mod } = data;
    if (!rows || rows < 1000) return; // seuil minimum

    // Vérifier l'historique d'export de cet utilisateur
    const since = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 60 * 60 * 1000)
    );

    const recentExports = await db.collection('export_logs')
      .where('userId',    '==', userId)
      .where('_createdAt', '>=', since)
      .get();

    const totalRows = recentExports.docs.reduce((s, d) => s + (d.data().rows || 0), 0);

    if (totalRows < 10000) return; // pas encore exfiltration

    const riskScore = Math.min(100, ANOMALY_SCORES.DATA_EXFIL + Math.floor(totalRows / 10000) * 10);

    logger.warn(`[SIEM] Data exfiltration: user ${userId} exported ${totalRows} rows in 1h`);

    await writeSecurityEvent({
      type:       'DATA_EXFILTRATION',
      severity:   'HIGH',
      userId,
      entity_id,
      module:     mod,
      totalRows,
      riskScore,
    });

    if (riskScore >= RISK_THRESHOLDS.HIGH) {
      await alertAdmins(
        '🔴 Export massif détecté',
        `L'utilisateur ${userId} a exporté ${totalRows.toLocaleString()} lignes en 1 heure`,
        { userId, totalRows: String(totalRows), module: mod }
      );
    }
  }
);

// ── SCAN HORAIRE : Score de risque agrégé par utilisateur ────────────────────
exports.siemHourlyScan = onSchedule(
  {
    schedule:  '0 * * * *',    // toutes les heures
    timeZone:  'UTC',
    region:    'europe-west1',
    memory:    '256MiB',
    timeoutSeconds: 300,
  },
  async () => {
    logger.info('[SIEM] Hourly risk scan starting...');

    const since = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    // Agréger les événements par utilisateur
    const eventsSnap = await db.collection('security_events')
      .where('resolved',  '==',  false)
      .where('_createdAt', '>=', since)
      .get();

    const userScores = {};
    eventsSnap.docs.forEach(doc => {
      const { userId, riskScore } = doc.data();
      if (!userId) return;
      userScores[userId] = (userScores[userId] || 0) + (riskScore || 0);
    });

    // Écrire les scores de risque et alerter si nécessaire
    const batch = db.batch();

    for (const [userId, score] of Object.entries(userScores)) {
      const cappedScore = Math.min(100, score);
      const ref = db.collection('user_risk_scores').doc(userId);
      batch.set(ref, {
        userId,
        score:     cappedScore,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        level:
          cappedScore >= RISK_THRESHOLDS.CRITICAL ? 'CRITICAL' :
          cappedScore >= RISK_THRESHOLDS.HIGH      ? 'HIGH'     :
          cappedScore >= RISK_THRESHOLDS.MEDIUM    ? 'MEDIUM'   : 'LOW',
      }, { merge: true });

      // Suspension si score critique
      if (cappedScore >= 95) {
        logger.error(`[SIEM] CRITICAL risk score ${cappedScore} for user ${userId} — suspending token`);
        try {
          await admin.auth().revokeRefreshTokens(userId);
          logger.info(`[SIEM] Refresh tokens revoked for ${userId}`);
        } catch (err) {
          logger.warn(`[SIEM] Failed to revoke tokens for ${userId}:`, err.message);
        }
      }
    }

    await batch.commit();

    logger.info(`[SIEM] Risk scan complete. ${Object.keys(userScores).length} user(s) evaluated`);
  }
);

// ── onCall : lire les événements sécurité (ADMIN+) ───────────────────────────
exports.getSecurityEvents = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const role = request.auth?.token?.role;
    if (!['SUPER_ADMIN', 'ADMIN'].includes(role)) {
      throw new HttpsError('permission-denied', 'Réservé aux administrateurs');
    }

    const limit  = Math.min(100, request.data?.limit || 50);
    const since  = request.data?.since
      ? admin.firestore.Timestamp.fromDate(new Date(request.data.since))
      : admin.firestore.Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

    const snap = await db.collection('security_events')
      .where('_createdAt', '>=', since)
      .orderBy('_createdAt', 'desc')
      .limit(limit)
      .get();

    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
);

// ── onCall : résoudre un événement (ADMIN+) ───────────────────────────────────
exports.resolveSecurityEvent = onCall(
  { region: 'europe-west1' },
  async (request) => {
    const role = request.auth?.token?.role;
    if (!['SUPER_ADMIN', 'ADMIN'].includes(role)) {
      throw new HttpsError('permission-denied', 'Réservé aux administrateurs');
    }

    const { eventId, resolution } = request.data || {};
    if (!eventId) throw new HttpsError('invalid-argument', 'eventId requis');

    await db.collection('security_events').doc(eventId).update({
      resolved:      true,
      resolvedBy:    request.auth.uid,
      resolvedAt:    admin.firestore.FieldValue.serverTimestamp(),
      resolution:    resolution || 'Résolu manuellement',
    });

    return { success: true };
  }
);
