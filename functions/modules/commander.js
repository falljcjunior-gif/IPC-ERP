/**
 * ════════════════════════════════════════════════════════════════════
 *  LE COMMANDANT — Agent de Management Proactif (Nexus OS)
 *
 *  Exports :
 *    commanderScan        CRON toutes les 4h — détecte retards, stagnation,
 *                         chute de score, urgences non-assignées
 *    commanderChat        Callable — l'utilisateur répond à un alert, l'IA
 *                         décide : accepter / escalader IT ou RH / recadrer
 *
 *  Collections Firestore :
 *    ai_management_logs/{logId}           audit complet pour les directeurs
 *    commander_alerts/{uid}/messages/{id} fil de discussion IA ↔ utilisateur
 *    commander_status/{uid}               niveau de couleur + score courant
 * ════════════════════════════════════════════════════════════════════
 */

const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const db = admin.firestore();
const FS = admin.firestore;

// ─────────────────────────────────────────────────────────────────────
// SYSTEM PROMPT — Le Commandant (Gemini personnalisé)
// ─────────────────────────────────────────────────────────────────────

const COMMANDER_SYSTEM_PROMPT = `
Tu es Le Commandant, l'agent de management proactif de Nexus OS pour l'entreprise IPC Green Blocks.

Ta philosophie fondamentale : "La discipline est le pont entre les objectifs et l'accomplissement."

TON RÔLE :
Analyser les données de performance d'un collaborateur et générer un message d'intervention
personnalisé. Tu es ferme sur les faits, jamais insultant envers la personne. Tu es un leader
d'élite : ton autorité vient de la clarté de ton analyse, pas de l'agressivité.

STRUCTURE OBLIGATOIRE EN 4 BLOCS (toujours dans cet ordre) :

🔴 CONSTAT
Commence par un titre court entre crochets (ex: [RETARD CRITIQUE / 36H]).
Énonce les faits bruts, chiffrés, sans émotion. Cite le nom exact de la tâche.
Exemple : "Mission [Rapport Financier Q2] : Délai dépassé de 36 heures."

⚠️ IMPACT
Explique la conséquence concrète sur l'équipe, le département ou la production d'IPC Green Blocks.
Ne dis jamais "c'est problématique". Dis exactement quel processus est bloqué et par qui.
Exemple : "Ce retard bloque la validation des comptes de l'équipe Finance et retarde la facturation
client de la semaine 20."

⚡ ACTION IMMÉDIATE
Donne UNE seule directive, claire, avec un délai précis (en heures, pas en jours).
Utilise le mode impératif. Pas de conditionnel, pas de "si tu peux".
Exemple : "Tu as 3 heures pour mettre à jour le statut de la tâche OU soumettre un blocage
documenté dans le chat IA. Passé ce délai, le dossier remonte au directeur."

💪 MOTIVATION
Termine par un push personnel. Cite le score actuel et appelle le potentiel du collaborateur.
Ne dis jamais "c'est bien". Dis pourquoi cette personne EST capable de régler ça maintenant.
Exemple : "Ton score d'efficacité actuel est de 78/100. Une seule clôture ce soir le ramène à 85.
Je sais que tu as fermé des dossiers plus complexes que celui-là. Exécute."

RÈGLES ABSOLUES :
1. Tu NE JUGES JAMAIS la personne, seulement les faits et les délais.
2. Zéro mot vague (bientôt, peut-être, essaie). Tout est précis et daté.
3. Quand tu analyses une RÉPONSE du collaborateur, évalue honnêtement :
   - Vrai blocage technique/organisationnel → signale l'escalade (IT ou RH) dans ta réponse.
   - Justification floue ou excuse → recadre fermement, ne cède pas.
4. Tu parles toujours en français, directement à la personne (tutoiement).
5. Maximum 250 mots par intervention. Chaque mot compte.
6. Termine TOUJOURS par une question fermée ou une directive, jamais par une affirmation ouverte.
`.trim();

// ─────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────

const DONE_PATTERNS = ['terminé', 'done', 'completed', 'fermé', 'clôturé', 'livré', 'closed', 'archivé'];
const isDoneList = (name = '') => DONE_PATTERNS.some(p => name.toLowerCase().includes(p));

function weekId(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay() + 1); // Lundi
  return d.toISOString().split('T')[0];
}

async function getGemini(apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: COMMANDER_SYSTEM_PROMPT,
    generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
  });
}

async function generateIntervention(model, userContext, triggers) {
  const triggerLines = triggers.map(t => {
    if (t.type === 'overdue_card')
      return `• RETARD: "${t.cardTitle}" (board: ${t.boardName}) — ${t.daysLate}j de retard. Membres assignés: ${t.assigneeNames || 'cet utilisateur'}.`;
    if (t.type === 'stagnant_card')
      return `• STAGNATION: "${t.cardTitle}" (board: ${t.boardName}) — Aucun mouvement depuis ${t.staleDays}j.`;
    if (t.type === 'score_drop')
      return `• CHUTE DE SCORE: Score cette semaine: ${t.currentScore}/100 vs ${t.prevScore}/100 la semaine dernière (−${t.drop}pts).`;
    if (t.type === 'urgent_unassigned')
      return `• URGENCE NON ASSIGNÉE: "${t.cardTitle}" (board: ${t.boardName}) — Marquée urgente, personne n'est assigné.`;
    return `• ${t.type}: ${t.cardTitle}`;
  }).join('\n');

  const prompt = `
CONTEXTE UTILISATEUR :
- Nom : ${userContext.name}
- Rôle : ${userContext.role}
- Département : ${userContext.dept || 'Non précisé'}
- Score d'efficacité actuel : ${userContext.score}/100
- Dernière activité enregistrée : ${userContext.lastActivity || 'Inconnue'}

DÉCLENCHEURS DÉTECTÉS :
${triggerLines}

Génère l'intervention du Commandant pour cet utilisateur. Sois précis, direct, orienté solution.
  `.trim();

  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function pushCommanderAlert(uid, { message, triggers, severity, logId, entityId, entityType, countryId }) {
  await db.collection('commander_alerts').doc(uid)
    .collection('messages').add({
      type: 'commander',
      content: message,
      triggerTypes: triggers.map(t => t.type),
      severity,
      status: 'new',
      logId,
      entity_id:   entityId   || null,
      entity_type: entityType || null,
      country_id:  countryId  || null,
      createdAt: FS.FieldValue.serverTimestamp(),
    });
}

async function computeUserScore(uid, cards) {
  const activeCards = cards.filter(c => !c.isArchived);
  if (activeCards.length === 0) return 100;
  const completed = activeCards.filter(c => c.dueDateComplete).length;
  const overdue   = activeCards.filter(c => c.dueDate && !c.dueDateComplete && c.dueDate.toDate?.() < new Date()).length;
  const base = Math.round((completed / activeCards.length) * 100);
  const penalty = Math.min(overdue * 5, 30); // max -30pts for overdue
  return Math.max(0, base - penalty);
}

// ─────────────────────────────────────────────────────────────────────
// COMMANDER SCAN — Toutes les 4 heures
// ─────────────────────────────────────────────────────────────────────

exports.commanderScan = onSchedule({
  schedule: '0 */4 * * *',
  timeZone: 'Africa/Abidjan',
  secrets: ['GEMINI_API_KEY'],
  region: 'us-central1',
  memory: '512MiB',
  timeoutSeconds: 540,
}, async () => {
  logger.info('[Commander] Scan démarré');
  const now = new Date();
  const h48  = new Date(now - 48 * 60 * 60 * 1000);
  const h4   = new Date(now -  4 * 60 * 60 * 1000); // fenêtre scan (évite doublons)

  const model = await getGemini(process.env.GEMINI_API_KEY);

  // ── 1. Récupère tous les utilisateurs actifs ─────────────────────
  const usersSnap = await db.collection('users')
    .where('isActive', '!=', false)
    .get();

  if (usersSnap.empty) {
    logger.info('[Commander] Aucun utilisateur actif.');
    return;
  }

  // ── 2. Récupère toutes les cartes non-archivées en une seule requête
  const cardsSnap = await db.collection('missions_cards')
    .where('isArchived', '==', false)
    .get();

  // ── 3. Récupère tous les boards pour avoir les noms de listes
  const boardsSnap = await db.collection('missions_boards').get();
  const boardMap = {};
  boardsSnap.forEach(d => { boardMap[d.id] = d.data(); });

  const listsSnap = await db.collection('missions_lists').get();
  const listMap = {};
  listsSnap.forEach(d => { listMap[d.id] = d.data(); });

  // ── 4. Cartes urgentes non-assignées (toutes, pas par user) ──────
  const urgentUnassigned = [];
  cardsSnap.forEach(doc => {
    const c = { id: doc.id, ...doc.data() };
    const list = listMap[c.listId] || {};
    if (isDoneList(list.name || '')) return;
    const isUrgent = (c.labelIds || []).some(lid => {
      const board = boardMap[c.boardId] || {};
      const labels = board.labels || [];
      const label = labels.find(l => l.id === lid);
      return label && /urgent/i.test(label.name || label.color || '');
    });
    if (isUrgent && (!c.members || c.members.length === 0)) {
      urgentUnassigned.push(c);
    }
  });

  // ── 5. Index cartes par membre ───────────────────────────────────
  const cardsByUser = {}; // uid → CardDoc[]
  cardsSnap.forEach(doc => {
    const c = { id: doc.id, ...doc.data(), _ref: doc };
    (c.members || []).forEach(uid => {
      if (!cardsByUser[uid]) cardsByUser[uid] = [];
      cardsByUser[uid].push(c);
    });
  });

  // ── 6. Scan par utilisateur ──────────────────────────────────────
  const batch = [];

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const user = userDoc.data();
    const userCards = cardsByUser[uid] || [];

    const triggers = [];

    // Retard critique
    userCards.forEach(c => {
      if (!c.dueDate || c.dueDateComplete) return;
      const due = c.dueDate.toDate ? c.dueDate.toDate() : new Date(c.dueDate);
      if (due >= now) return;
      const daysLate = Math.round((now - due) / (24 * 60 * 60 * 1000));
      const board = boardMap[c.boardId] || {};
      const list = listMap[c.listId] || {};
      if (isDoneList(list.name || '')) return;
      triggers.push({
        type: 'overdue_card',
        cardId: c.id,
        cardTitle: c.title,
        boardId: c.boardId,
        boardName: board.name || c.boardId,
        daysLate,
        assigneeNames: user.nom || user.displayName,
      });
    });

    // Stagnation (updateTime de Firestore)
    userCards.forEach(c => {
      const updateTime = c._ref.updateTime?.toDate?.() || null;
      if (!updateTime) return;
      if (updateTime >= h48) return;
      const list = listMap[c.listId] || {};
      if (isDoneList(list.name || '')) return;
      const staleDays = Math.round((now - updateTime) / (24 * 60 * 60 * 1000));
      const board = boardMap[c.boardId] || {};
      triggers.push({
        type: 'stagnant_card',
        cardId: c.id,
        cardTitle: c.title,
        boardId: c.boardId,
        boardName: board.name || c.boardId,
        staleDays,
      });
    });

    // Urgences non-assignées sur les boards de cet user (admin du workspace)
    // On notifie l'admin des workspaces où cet user est ADMIN
    const userWorkspaceIds = user.missionWorkspaces || [];
    urgentUnassigned.forEach(c => {
      if (userWorkspaceIds.includes(c.workspaceId) || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        const board = boardMap[c.boardId] || {};
        triggers.push({
          type: 'urgent_unassigned',
          cardId: c.id,
          cardTitle: c.title,
          boardId: c.boardId,
          boardName: board.name || c.boardId,
        });
      }
    });

    // Score et chute de score
    const currentScore = await computeUserScore(uid, userCards);
    const prevWeek = weekId(new Date(now - 7 * 24 * 60 * 60 * 1000));
    const statusRef = db.collection('commander_status').doc(uid);
    const statusDoc = await statusRef.get();
    const statusData = statusDoc.exists ? statusDoc.data() : {};
    const scoreHistory = statusData.scoreHistory || [];
    const prevEntry = scoreHistory.find(e => e.week === prevWeek);
    if (prevEntry && (prevEntry.score - currentScore) >= 15) {
      triggers.push({
        type: 'score_drop',
        currentScore,
        prevScore: prevEntry.score,
        drop: prevEntry.score - currentScore,
      });
    }

    if (triggers.length === 0) {
      // Utilisateur OK : met à jour le statut vert et continue
      await statusRef.set({
        level: 'green',
        score: currentScore,
        openAlerts: 0,
        lastScan: FS.FieldValue.serverTimestamp(),
        scoreHistory: [
          ...scoreHistory.filter(e => e.week !== weekId(now)).slice(-7),
          { week: weekId(now), score: currentScore },
        ],
      }, { merge: true });
      continue;
    }

    // Détermine la sévérité
    const hasCritical = triggers.some(t => t.type === 'overdue_card' && t.daysLate >= 2);
    const severity = hasCritical ? 'critical' : triggers.length >= 2 ? 'warning' : 'info';
    const level = severity === 'critical' ? 'red' : severity === 'warning' ? 'orange' : 'orange';

    // Génère le message IA
    const userContext = {
      name: user.nom || user.displayName || 'Collaborateur',
      role: user.role || user.permissions?.roles?.[0] || 'STAFF',
      dept: user.dept || user.department,
      score: currentScore,
      lastActivity: statusData.lastScan?.toDate?.()?.toLocaleDateString('fr-FR') || null,
    };

    let aiMessage;
    try {
      aiMessage = await generateIntervention(model, userContext, triggers);
    } catch (err) {
      logger.error(`[Commander] Gemini error for ${uid}:`, err);
      aiMessage = `[ALERTE SYSTÈME] ${triggers.length} anomalie(s) détectée(s) sur vos missions. Consultez la liste des urgences.`;
    }

    // Sauvegarde dans ai_management_logs
    const logRef = await db.collection('ai_management_logs').add({
      uid,
      userName:     userContext.name,
      userRole:     userContext.role,
      triggerCount: triggers.length,
      triggers:     triggers.map(t => ({ ...t, cardId: t.cardId || null })),
      generatedMessage: aiMessage,
      severity,
      scoreAtTime: currentScore,
      isRead:      false,
      responded:   false,
      entity_id:   user.entity_id   || null,
      entity_type: user.entity_type || null,
      country_id:  user.country_id  || null,
      sentAt: FS.FieldValue.serverTimestamp(),
    });

    // Pousse l'alerte dans le fil privé de l'utilisateur
    await pushCommanderAlert(uid, {
      message: aiMessage,
      triggers,
      severity,
      logId:      logRef.id,
      entityId:   user.entity_id   || null,
      entityType: user.entity_type || null,
      countryId:  user.country_id  || null,
    });

    // Met à jour le statut de l'utilisateur
    await statusRef.set({
      level,
      score: currentScore,
      openAlerts: FS.FieldValue.increment(1),
      lastScan: FS.FieldValue.serverTimestamp(),
      scoreHistory: [
        ...scoreHistory.filter(e => e.week !== weekId(now)).slice(-7),
        { week: weekId(now), score: currentScore },
      ],
    }, { merge: true });

    logger.info(`[Commander] Intervention envoyée à ${uid} (${severity}, ${triggers.length} triggers)`);
    batch.push(uid);
  }

  logger.info(`[Commander] Scan terminé. ${batch.length} interventions envoyées.`);
});

// ─────────────────────────────────────────────────────────────────────
// COMMANDER CHAT — Réponse de l'utilisateur
// ─────────────────────────────────────────────────────────────────────

exports.commanderChat = onCall({
  secrets: ['GEMINI_API_KEY'],
  region: 'us-central1',
  maxInstances: 10,
}, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Authentification requise.');

  const { messageId, reply, logId } = request.data || {};
  if (!reply || typeof reply !== 'string' || reply.trim().length < 3) {
    throw new HttpsError('invalid-argument', 'Réponse trop courte.');
  }
  if (reply.length > 1500) throw new HttpsError('invalid-argument', 'Réponse trop longue (max 1500 caractères).');

  const uid = request.auth.uid;

  // Récupère le contexte du log original
  const logRef = db.collection('ai_management_logs').doc(logId);
  const logDoc = await logRef.get();
  if (!logDoc.exists || logDoc.data().uid !== uid) {
    throw new HttpsError('not-found', 'Alerte introuvable.');
  }
  const log = logDoc.data();

  // Enregistre la réponse utilisateur
  await db.collection('commander_alerts').doc(uid)
    .collection('messages').add({
      type: 'user',
      content: reply.trim(),
      logId,
      status: 'sent',
      createdAt: FS.FieldValue.serverTimestamp(),
    });

  // Analyse la réponse avec Gemini
  const model = await getGemini(process.env.GEMINI_API_KEY);
  const analysisPrompt = `
CONTEXTE :
- Collaborateur : ${log.userName} (${log.userRole})
- Score actuel : ${log.scoreAtTime}/100
- Déclencheurs originaux : ${log.triggers.map(t => t.type + ': ' + (t.cardTitle || '')).join(', ')}
- Message que tu lui as envoyé : "${log.generatedMessage.slice(0, 400)}..."

RÉPONSE DU COLLABORATEUR :
"${reply.trim()}"

INSTRUCTIONS :
1. Analyse cette réponse. Est-ce un vrai blocage (technique, organisationnel, ressource manquante) ou une excuse ?
2. Si VRAI BLOCAGE → indique clairement dans ta réponse que tu escalades vers le module concerné (IT ou RH).
   Commence ta réponse par le tag [ESCALADE_IT] ou [ESCALADE_RH] selon le cas.
3. Si EXCUSE ou justification floue → recadre fermement sans agressivité. Maintiens la directive originale.
   Commence ta réponse par le tag [RECADRAGE].
4. Si le collaborateur annonce que c'est résolu → confirme, félicite brièvement, mets à jour le statut.
   Commence ta réponse par le tag [RÉSOLU].
5. Génère ta réponse en suivant le format du Commandant.
  `.trim();

  let aiResponse;
  try {
    const result = await model.generateContent(analysisPrompt);
    aiResponse = result.response.text();
  } catch (err) {
    logger.error('[Commander] Gemini chat error:', err);
    aiResponse = 'Analyse en cours. Je reviens vers toi dans les prochaines heures.';
  }

  // Détecte le tag d'escalade
  const escalation = aiResponse.startsWith('[ESCALADE_IT]')  ? 'IT'
                   : aiResponse.startsWith('[ESCALADE_RH]')  ? 'RH'
                   : aiResponse.startsWith('[RÉSOLU]')       ? 'resolved'
                   : null;

  // Enregistre la réponse IA dans le fil
  await db.collection('commander_alerts').doc(uid)
    .collection('messages').add({
      type: 'commander',
      content: aiResponse,
      logId,
      escalation: escalation || null,
      status: 'new',
      createdAt: FS.FieldValue.serverTimestamp(),
    });

  // Actions selon le tag
  if (escalation === 'IT' || escalation === 'RH') {
    const targetModule = escalation === 'IT' ? 'it' : 'hr';
    await db.collection('notifications').add({
      targetModule,
      type: 'commander_escalation',
      title: `Escalade Commander : ${log.userName}`,
      body: `Blocage signalé par ${log.userName} sur "${log.triggers[0]?.cardTitle || 'une mission'}". Intervention requise.`,
      sourceUid: uid,
      logId,
      isRead: false,
      createdAt: FS.FieldValue.serverTimestamp(),
    });
    logger.info(`[Commander] Escalade ${escalation} pour ${uid}`);
  }

  if (escalation === 'resolved') {
    await logRef.update({ responded: true, resolvedAt: FS.FieldValue.serverTimestamp() });
    await db.collection('commander_status').doc(uid).set({
      openAlerts: FS.FieldValue.increment(-1),
    }, { merge: true });
  }

  await logRef.update({ responded: true });

  return { response: aiResponse, escalation };
});
