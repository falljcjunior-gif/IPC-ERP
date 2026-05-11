/**
 * ════════════════════════════════════════════════════════════════════
 *  NEXUS SCORE ENGINE — Moteur d'Évaluation Pondérée Individu/Équipe
 *
 *  Formule : Score = (ω_indiv × P_indiv) + (ω_team × P_team) + B_bonus
 *
 *  Collections produites :
 *    evaluations/{evalId}          détail d'une évaluation
 *    user_scores/{uid}/weeks/{wId} score courant par semaine
 *    user_scores/{uid}/months/{mId}score courant par mois
 *    team_stats/{dept}/weeks/{wId} agrégat département
 *
 *  Sources lues :
 *    users/                        profils (dept, nom, role)
 *    missions_cards/               vélocité, taux de complétion
 *    missions_lists/               détection des colonnes "Done"
 *    missions_cards/{id}/activity  synergy (commentaires, déblocages)
 *    crm/                          deals gagnés (responsable = nom)
 *    production/ (work_orders)     ordres de fabrication terminés
 * ════════════════════════════════════════════════════════════════════
 */

const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();
const FS = admin.firestore;

// ─────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────

const DONE_PATTERNS = ['terminé', 'done', 'completed', 'fermé', 'clôturé', 'livré', 'closed'];
const isDoneList = (name = '') => DONE_PATTERNS.some(p => name.toLowerCase().includes(p));

// Pondérations par département (ω_indiv + ω_team = 1)
const DEPT_WEIGHTS = {
  COMMERCIAL:   { omega_indiv: 0.70, omega_team: 0.30, max_bonus: 25 },
  VENTES:       { omega_indiv: 0.70, omega_team: 0.30, max_bonus: 25 },
  PRODUCTION:   { omega_indiv: 0.40, omega_team: 0.60, max_bonus: 20 },
  LOGISTIQUE:   { omega_indiv: 0.40, omega_team: 0.60, max_bonus: 20 },
  MISSIONS:     { omega_indiv: 0.50, omega_team: 0.50, max_bonus: 30 },
  MARKETING:    { omega_indiv: 0.55, omega_team: 0.45, max_bonus: 25 },
  FINANCE:      { omega_indiv: 0.60, omega_team: 0.40, max_bonus: 20 },
  RH:           { omega_indiv: 0.50, omega_team: 0.50, max_bonus: 20 },
  IT:           { omega_indiv: 0.55, omega_team: 0.45, max_bonus: 25 },
  DIRECTION:    { omega_indiv: 0.50, omega_team: 0.50, max_bonus: 30 },
  DEFAULT:      { omega_indiv: 0.55, omega_team: 0.45, max_bonus: 20 },
};

const SYNERGY_POINTS = {
  comment_on_others: 1.5,    // commentaire sur une carte d'un autre
  unblock_stuck:     4.0,    // débloquer une carte stagnante (>48h)
  cross_dept_move:   2.0,    // interaction cross-département
};

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

function isoWeekId(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dow = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dow);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function monthId(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function clamp(v, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, v)); }
function normalize(val, min, max) { return max > min ? (val - min) / (max - min) : 0; }

function getDeptKey(dept = '') {
  const d = dept.toUpperCase().trim();
  return DEPT_WEIGHTS[d] ? d : 'DEFAULT';
}

// ─────────────────────────────────────────────────────────────────
// CORE ALGORITHM
// ─────────────────────────────────────────────────────────────────

/**
 * Calcule les indices comportementaux pour un ensemble de membres.
 * @returns { mule, ghost, bridge } pour chaque uid
 */
function computeBehavioralIndices({ userCards, userActivity, teamAvgCards }) {
  const cardCount = Object.fromEntries(
    Object.entries(userCards).map(([uid, cards]) => [uid, cards.length])
  );
  const activityCount = Object.fromEntries(
    Object.entries(userActivity).map(([uid, acts]) => [uid, acts.length])
  );
  const completionRates = Object.fromEntries(
    Object.entries(userCards).map(([uid, cards]) => {
      const total = cards.length;
      const done  = cards.filter(c => c._isDone).length;
      return [uid, total > 0 ? done / total : 0];
    })
  );

  const indices = {};
  for (const uid of Object.keys(userCards)) {
    const myCards    = cardCount[uid]    || 0;
    const myActivity = activityCount[uid]|| 0;
    const myRate     = completionRates[uid] || 0;
    const myCards2   = userCards[uid]    || [];

    // MULE : surcharge par rapport à la moyenne équipe
    const muleRaw = teamAvgCards > 0
      ? clamp((myCards / teamAvgCards - 0.8) / 1.2 * 100, 0, 100)
      : 0;

    // GHOST : peu de résultats ET peu d'activité
    const completionScore = myRate * 60;
    const activityScore   = Math.min(40, myActivity * 4);
    const ghostRaw = clamp(100 - completionScore - activityScore, 0, 100);

    // BRIDGE : combien de départements distincts dans les cartes touchées
    const depts = new Set(myCards2.map(c => c._boardDept || 'unknown').filter(d => d !== 'unknown'));
    const bridgeRaw = clamp((depts.size - 1) * 25, 0, 100);

    indices[uid] = {
      mule:   Math.round(muleRaw),
      ghost:  Math.round(ghostRaw),
      bridge: Math.round(bridgeRaw),
    };
  }
  return indices;
}

/**
 * Calcule P_indiv (0-100) pour un utilisateur.
 */
function computeIndividualScore(cards, activitySynergy, crmDealsWon) {
  const total    = cards.length;
  if (total === 0 && crmDealsWon === 0) return 50; // neutre si pas de données

  const done     = cards.filter(c => c._isDone).length;
  const onTime   = cards.filter(c => c._isDone && !c._overdue).length;
  const avgChecklist = total > 0
    ? cards.reduce((sum, c) => sum + (c._checklistPct || 0), 0) / total
    : 0;

  const completionRate   = total > 0 ? done / total : 0.5;
  const deadlineAdherence= done > 0 ? onTime / done : 0.5;
  const checklistScore   = avgChecklist;

  // Bonus CRM (pour les commerciaux)
  const crmBonus = Math.min(20, crmDealsWon * 5);

  const base = (
    completionRate    * 0.50 +
    deadlineAdherence * 0.30 +
    checklistScore    * 0.20
  ) * 100;

  return clamp(Math.round(base + crmBonus));
}

/**
 * Calcule P_team (0-100) pour un département.
 */
function computeTeamScore(allDeptCards) {
  const total = allDeptCards.length;
  if (total === 0) return 70; // neutre si pas de données

  const done  = allDeptCards.filter(c => c._isDone).length;
  const stuck = allDeptCards.filter(c => c._isStuck).length;
  const completionRate = done / total;
  const fluencyRate    = total > 0 ? 1 - (stuck / total) : 1;

  return clamp(Math.round((completionRate * 0.60 + fluencyRate * 0.40) * 100));
}

/**
 * Calcule B_bonus (synergy) à partir des events d'activité.
 */
function computeSynergyBonus(uid, activityEvents, allCards, maxBonus) {
  const myCardIds = new Set((allCards[uid] || []).map(c => c.id));
  let pts = 0;

  for (const ev of activityEvents) {
    if (ev.actorUid !== uid) continue;
    if (ev.type === 'comment' && !myCardIds.has(ev.cardId)) {
      pts += SYNERGY_POINTS.comment_on_others;
    }
    if (ev.type === 'card_moved' && ev.wasStuck) {
      pts += SYNERGY_POINTS.unblock_stuck;
    }
    if (ev.type === 'comment' && ev.isCrossDept) {
      pts += SYNERGY_POINTS.cross_dept_move;
    }
  }
  return clamp(Math.round(pts), 0, maxBonus);
}

// ─────────────────────────────────────────────────────────────────
// MAIN COMPUTATION
// ─────────────────────────────────────────────────────────────────

async function runScoreComputation(periodDays = 7) {
  const now    = new Date();
  const cutoff = new Date(now - periodDays * 24 * 60 * 60 * 1000);
  const period = periodDays <= 7 ? 'week' : 'month';
  const wId    = period === 'week' ? isoWeekId(now) : monthId(now);

  logger.info(`[NexusScore] Calcul ${period} ${wId} — cutoff: ${cutoff.toISOString()}`);

  // ── 1. Données sources en parallèle ────────────────────────────
  const [usersSnap, cardsSnap, listsSnap, actSnap, crmSnap, woSnap] =
    await Promise.all([
      db.collection('users').get(),
      db.collection('missions_cards').where('isArchived', '==', false).get(),
      db.collection('missions_lists').get(),
      // Collection group : tous les activity logs depuis le cutoff
      db.collectionGroup('activity')
        .where('createdAt', '>=', FS.Timestamp.fromDate(cutoff))
        .orderBy('createdAt', 'desc')
        .limit(5000)
        .get(),
      // CRM — leads gagnés
      db.collection('crm').where('subModule', '==', 'leads').get(),
      // Production — ordres de fabrication
      db.collection('production').get(),
    ]);

  const listMap = {};
  listsSnap.forEach(d => { listMap[d.id] = d.data(); });

  // ── 2. Enrichit chaque carte ────────────────────────────────────
  const enrichedCards = [];
  const h48 = new Date(now - 48 * 60 * 60 * 1000);

  cardsSnap.forEach(doc => {
    const c = { id: doc.id, ...doc.data() };
    const list = listMap[c.listId] || {};
    c._isDone     = isDoneList(list.name || '');
    c._overdue    = c.dueDate && !c.dueDateComplete && (c.dueDate.toDate ? c.dueDate.toDate() : new Date(c.dueDate)) < now;
    c._isStuck    = !c._isDone && (doc.updateTime?.toDate?.() || new Date(0)) < h48;
    c._checklistPct = c.checklistProgress?.total > 0
      ? c.checklistProgress.complete / c.checklistProgress.total
      : 0;
    c._boardDept  = 'MISSIONS'; // les cartes missions sont par défaut MISSIONS
    enrichedCards.push(c);
  });

  // ── 3. Activity events enrichis ─────────────────────────────────
  const activityEvents = [];
  actSnap.forEach(doc => {
    const data = doc.data();
    activityEvents.push({
      id:       doc.id,
      cardId:   doc.ref.parent.parent?.id || null,
      ...data,
      wasStuck: false, // calculé ci-dessous
      isCrossDept: false,
    });
  });

  // Marquer les déblocages (la carte était stuck avant l'action)
  for (const ev of activityEvents) {
    if (ev.type === 'card_moved') {
      const card = enrichedCards.find(c => c.id === ev.cardId);
      if (card && card._isStuck) ev.wasStuck = true;
    }
  }

  // ── 4. Index des données par utilisateur ────────────────────────
  const userCards     = {};   // uid → cards[]
  const userActivity  = {};   // uid → activity[]
  const userByNom     = {};   // nom → uid

  usersSnap.forEach(doc => {
    const u = doc.data();
    userCards[doc.id]    = [];
    userActivity[doc.id] = [];
    if (u.nom || u.displayName) {
      userByNom[u.nom || u.displayName] = doc.id;
    }
  });

  for (const card of enrichedCards) {
    for (const uid of (card.members || [])) {
      if (userCards[uid]) userCards[uid].push(card);
    }
  }

  for (const ev of activityEvents) {
    const uid = ev.actorUid;
    if (uid && userActivity[uid]) userActivity[uid].push(ev);
  }

  // ── 5. Deals CRM gagnés par commercial (nom → uid) ──────────────
  const dealsByUser = {};
  crmSnap.forEach(doc => {
    const d = doc.data();
    if (d.statut === 'Gagné') {
      const uid = userByNom[d.responsable] || null;
      if (uid) dealsByUser[uid] = (dealsByUser[uid] || 0) + 1;
    }
  });

  // ── 6. Regroupement par département ─────────────────────────────
  const deptMembers = {};   // dept → uid[]
  const deptCards   = {};   // dept → cards[]

  usersSnap.forEach(doc => {
    const u = doc.data();
    const dept = getDeptKey(u.dept || 'DEFAULT');
    if (!deptMembers[dept]) { deptMembers[dept] = []; deptCards[dept] = []; }
    deptMembers[dept].push(doc.id);
  });

  for (const card of enrichedCards) {
    for (const uid of (card.members || [])) {
      const u = usersSnap.docs.find(d => d.id === uid)?.data();
      const dept = getDeptKey(u?.dept || 'DEFAULT');
      if (deptCards[dept]) deptCards[dept].push(card);
    }
  }

  // ── 7. Indices comportementaux par département ──────────────────
  const behavioralIndices = {};

  for (const dept of Object.keys(deptMembers)) {
    const members = deptMembers[dept];
    const avgCards = members.length > 0
      ? members.reduce((s, uid) => s + (userCards[uid]?.length || 0), 0) / members.length
      : 0;

    const deptBehavior = computeBehavioralIndices({
      userCards:    Object.fromEntries(members.map(uid => [uid, userCards[uid] || []])),
      userActivity: Object.fromEntries(members.map(uid => [uid, userActivity[uid] || []])),
      teamAvgCards: avgCards,
    });
    Object.assign(behavioralIndices, deptBehavior);
  }

  // ── 8. Calcul Nexus Score par utilisateur ───────────────────────
  const results   = [];
  const batchWrites = db.batch();
  const evalBatch   = db.batch();

  for (const userDoc of usersSnap.docs) {
    const uid  = userDoc.id;
    const user = userDoc.data();
    const dept = getDeptKey(user.dept || 'DEFAULT');
    const { omega_indiv, omega_team, max_bonus } = DEPT_WEIGHTS[dept];

    const myCards    = userCards[uid]    || [];
    const allDeptC   = deptCards[dept]   || [];
    const myActivity = userActivity[uid] || [];
    const myDeals    = dealsByUser[uid]  || 0;
    const indices    = behavioralIndices[uid] || { mule: 0, ghost: 0, bridge: 0 };

    // Scores composantes
    const p_indiv  = computeIndividualScore(myCards, myActivity, myDeals);
    const p_team   = computeTeamScore(allDeptC);
    const b_bonus  = computeSynergyBonus(uid, activityEvents, userCards, max_bonus);

    // Formule principale
    const base       = omega_indiv * p_indiv + omega_team * p_team;
    const nexus_score = Math.round(base + b_bonus * 0.20); // bonus = 20% max du score final

    // Breakdown détaillé
    const breakdown = {
      tasksAssigned:       myCards.length,
      tasksCompleted:      myCards.filter(c => c._isDone).length,
      taskCompletionRate:  myCards.length > 0 ? Math.round((myCards.filter(c => c._isDone).length / myCards.length) * 100) : 0,
      overdueCount:        myCards.filter(c => c._overdue).length,
      teamTasksTotal:      allDeptC.length,
      teamTasksCompleted:  allDeptC.filter(c => c._isDone).length,
      teamCompletionRate:  allDeptC.length > 0 ? Math.round((allDeptC.filter(c => c._isDone).length / allDeptC.length) * 100) : 0,
      commentsLeft:        myActivity.filter(e => e.type === 'comment' && e.cardId && !userCards[uid]?.find(c => c.id === e.cardId)).length,
      tasksUnblocked:      myActivity.filter(e => e.wasStuck).length,
      synergyPoints:       b_bonus,
      dealsWon:            myDeals,
    };

    const evalData = {
      uid,
      userName: user.nom || user.displayName || uid,
      dept,
      period,
      periodId: wId,
      personal_performance_index:  p_indiv,
      team_contribution_index:     p_team,
      synergy_bonus:               b_bonus,
      nexus_score:                 clamp(nexus_score, 0, 130),
      weights: { omega_indiv, omega_team, max_bonus },
      indices,
      breakdown,
      computedAt: FS.FieldValue.serverTimestamp(),
      version: 2,
    };

    results.push({ uid, dept, nexus_score, p_indiv, p_team, b_bonus, indices, breakdown });

    // user_scores/{uid}/weeks/{wId}
    const userScoreRef = db.collection('user_scores').doc(uid)
      .collection(period === 'week' ? 'weeks' : 'months').doc(wId);
    batchWrites.set(userScoreRef, evalData, { merge: true });

    // evaluations/{uid}_{wId}
    const evalRef = db.collection('evaluations').doc(`${uid}_${wId}`);
    evalBatch.set(evalRef, evalData, { merge: true });
  }

  // ── 9. Agrégats d'équipe ─────────────────────────────────────────
  const teamBatch = db.batch();

  for (const dept of Object.keys(deptMembers)) {
    const members     = deptMembers[dept];
    const deptResults = results.filter(r => r.dept === dept);
    if (deptResults.length === 0) continue;

    const avgNexus    = Math.round(deptResults.reduce((s, r) => s + r.nexus_score, 0) / deptResults.length);
    const avgPIndiv   = Math.round(deptResults.reduce((s, r) => s + r.p_indiv, 0) / deptResults.length);
    const avgPTeam    = Math.round(deptResults.reduce((s, r) => s + r.p_team, 0) / deptResults.length);

    // Détecte mule (max index), ghost (max ghost), bridge (max bridge)
    const muleUser    = deptResults.reduce((a, b) => a.indices.mule > b.indices.mule ? a : b, deptResults[0]);
    const bridgeUser  = deptResults.reduce((a, b) => a.indices.bridge > b.indices.bridge ? a : b, deptResults[0]);
    const ghostUsers  = deptResults.filter(r => r.indices.ghost > 60).map(r => r.uid);

    const teamStats = {
      dept,
      period, periodId: wId,
      avgNexusScore:    avgNexus,
      avgPIndiv:        avgPIndiv,
      avgPTeam:         avgPTeam,
      memberCount:      members.length,
      muleUserId:       muleUser.indices.mule > 70 ? muleUser.uid : null,
      bridgeUserId:     bridgeUser.indices.bridge > 50 ? bridgeUser.uid : null,
      ghostUserIds:     ghostUsers,
      members: deptResults.map(r => ({
        uid:        r.uid,
        nexusScore: r.nexus_score,
        pIndiv:     r.p_indiv,
        pTeam:      r.p_team,
        bonus:      r.b_bonus,
        mule:       r.indices.mule,
        ghost:      r.indices.ghost,
        bridge:     r.indices.bridge,
      })).sort((a, b) => b.nexusScore - a.nexusScore),
      computedAt: FS.FieldValue.serverTimestamp(),
    };

    const teamRef = db.collection('team_stats').doc(dept)
      .collection(period === 'week' ? 'weeks' : 'months').doc(wId);
    teamBatch.set(teamRef, teamStats, { merge: true });
  }

  // ── 10. Commits ──────────────────────────────────────────────────
  await Promise.all([batchWrites.commit(), evalBatch.commit(), teamBatch.commit()]);

  logger.info(`[NexusScore] ${results.length} scores calculés pour ${wId}`);
  return { count: results.length, periodId: wId };
}

// ─────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────

// Calcul automatique — lundi 6h (semaine) + 1er du mois 6h (mensuel)
exports.computeNexusScoresWeekly = onSchedule({
  schedule: '0 6 * * 1',
  timeZone: 'Africa/Abidjan',
  region:   'us-central1',
  memory:   '512MiB',
  timeoutSeconds: 300,
}, async () => runScoreComputation(7));

exports.computeNexusScoresMonthly = onSchedule({
  schedule: '0 6 1 * *',
  timeZone: 'Africa/Abidjan',
  region:   'us-central1',
  memory:   '512MiB',
  timeoutSeconds: 300,
}, async () => runScoreComputation(30));

// Calcul à la demande (admin / test)
exports.computeNexusScoresNow = onCall({
  region: 'us-central1',
  maxInstances: 3,
}, async (request) => {
  const role = request.auth?.token?.role;
  if (!['SUPER_ADMIN', 'ADMIN'].includes(role)) {
    throw new HttpsError('permission-denied', 'Réservé aux administrateurs.');
  }
  const { periodDays = 7 } = request.data || {};
  const result = await runScoreComputation(periodDays);
  return result;
});
