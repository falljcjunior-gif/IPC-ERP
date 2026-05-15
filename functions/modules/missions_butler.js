/**
 * Missions Butler — Cloud Functions v2
 *
 * Triggers :
 *   onMissionsCardMoved    Firestore onDocumentUpdated → butler rules + cross-module writes
 *   onMissionsCardCreated  Firestore onDocumentCreated → butler "card created" rules
 *
 * CRON :
 *   missionsDeadlineScanner  daily 08:00 Abidjan — flag overdue, notify members
 *   missionsWeeklyReport     Monday 07:00 Abidjan — aggregate board stats
 *   missionsResetDueSoonFlags midnight Abidjan — clean transient isDueSoon flags
 *
 * Callables :
 *   saveMissionsButlerRule     CRUD a butler rule on a board
 *   deleteMissionsButlerRule
 *   executeMissionsButlerRule  manual trigger for testing
 */
const { onDocumentUpdated, onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();
const FS  = admin.firestore;

// ─────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────

const DONE_PATTERNS = ['terminé', 'terminée', 'done', 'completed', 'fermé', 'clôturé', 'livré', 'closed'];
const DUE_SOON_MS  = 24 * 60 * 60 * 1000; // 24 h

const isDoneList = (name = '') =>
  DONE_PATTERNS.some(p => name.toLowerCase().includes(p));

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

async function logActivity(cardId, type, meta = {}) {
  try {
    await db.collection('missions_cards').doc(cardId)
      .collection('activity').add({
        type,
        actorUid:  'butler',
        actorName: '🤖 Butler',
        meta,
        createdAt: FS.FieldValue.serverTimestamp(),
      });
  } catch (e) {
    logger.warn('[Butler] Activity log failed:', e.message);
  }
}

async function pushNotification(targetUserId, { title, body, cardId, boardId }) {
  await db.collection('notifications').add({
    targetUserId,
    type:    'missions_butler',
    title,
    body,
    cardId:  cardId  || null,
    boardId: boardId || null,
    read:    false,
    createdAt:  FS.FieldValue.serverTimestamp(),
    _createdAt: FS.FieldValue.serverTimestamp(),
    _deletedAt: null,
  });
}

// ─────────────────────────────────────────────────────────────────
// ACTION EXECUTOR
// Executes a single butler action object against a card.
// ─────────────────────────────────────────────────────────────────

async function executeAction(action, card, cardRef) {
  const now = FS.FieldValue.serverTimestamp();

  switch (action.type) {

    case 'assign_member': {
      if (!action.memberId) break;
      const members = [...new Set([...(card.members || []), action.memberId])];
      await cardRef.update({ members, updatedAt: now });
      await logActivity(cardRef.id, 'member_added', { memberId: action.memberId });
      break;
    }

    case 'set_due_date': {
      const d = new Date();
      d.setDate(d.getDate() + (action.daysFromNow || 7));
      const seconds = Math.floor(d.getTime() / 1000);
      await cardRef.update({ dueDate: { seconds }, updatedAt: now });
      await logActivity(cardRef.id, 'due_date_set', {});
      break;
    }

    case 'add_label': {
      if (!action.labelId) break;
      const labelIds = [...new Set([...(card.labelIds || []), action.labelId])];
      await cardRef.update({ labelIds, updatedAt: now });
      await logActivity(cardRef.id, 'label_added', {});
      break;
    }

    case 'move_to_list': {
      if (!action.listName || !card.boardId) break;
      const listsSnap = await db.collection('missions_lists')
        .where('boardId', '==', card.boardId)
        .where('isArchived', '==', false)
        .get();
      const target = listsSnap.docs.find(
        d => d.data().name.toLowerCase() === action.listName.toLowerCase()
      );
      if (!target) break;
      await cardRef.update({ listId: target.id, updatedAt: now });
      await logActivity(cardRef.id, 'card_moved', { toListName: action.listName });
      break;
    }

    case 'create_finance_invoice': {
      const invoiceId = `INV_MISS_${cardRef.id}_${Date.now()}`;
      await db.collection('finance').doc(invoiceId).set({
        id:           invoiceId,
        subModule:    'invoices',
        label:        `Facture — Mission : ${card.title}`,
        origine:      'missions',
        missionCardId: cardRef.id,
        boardId:       card.boardId || null,
        statut:        'Brouillon',
        montant:       action.amount || 0,
        devise:        'XOF',
        entity_id:     card.entity_id   || null,
        entity_type:   card.entity_type || null,
        country_id:    card.country_id  || null,
        createdAt:     now,
        _domain:       'finance',
        _createdBy:    'missions_butler',
        _deletedAt:    null,
        _createdAt:    now,
      });
      await logActivity(cardRef.id, 'butler_action_fired', {
        actionType: 'create_finance_invoice',
        refId:      invoiceId,
      });
      logger.info(`[Butler] Finance invoice ${invoiceId} created for card ${cardRef.id}`);
      break;
    }

    case 'create_hr_task': {
      const taskId = `HR_MISS_${cardRef.id}_${Date.now()}`;
      await db.collection('hr').doc(taskId).set({
        id:           taskId,
        subModule:    'tasks',
        label:        `Tâche RH — Mission : ${card.title}`,
        missionCardId: cardRef.id,
        type:          action.taskType || 'evaluation',
        statut:        'Ouvert',
        assigneeId:    action.assigneeId || null,
        entity_id:     card.entity_id   || null,
        entity_type:   card.entity_type || null,
        country_id:    card.country_id  || null,
        createdAt:     now,
        _domain:       'hr',
        _createdBy:    'missions_butler',
        _deletedAt:    null,
        _createdAt:    now,
      });
      await logActivity(cardRef.id, 'butler_action_fired', {
        actionType: 'create_hr_task',
        refId:      taskId,
      });
      logger.info(`[Butler] HR task ${taskId} created for card ${cardRef.id}`);
      break;
    }

    case 'notify': {
      const targets = action.userIds || (action.userId ? [action.userId] : []);
      for (const uid of targets) {
        await pushNotification(uid, {
          title:   action.title || '🤖 Butler — Mise à jour',
          body:    action.body  || `La carte "${card.title}" a été mise à jour automatiquement.`,
          cardId:  cardRef.id,
          boardId: card.boardId,
        });
      }
      break;
    }

    default:
      logger.warn(`[Butler] Unknown action type: ${action.type}`);
  }
}

// ─────────────────────────────────────────────────────────────────
// Cross-module writes when a card reaches a "done" list
// ─────────────────────────────────────────────────────────────────

async function syncLinkedEntitiesOnDone(card, cardId) {
  const linked = card.linkedEntities || [];
  if (linked.length === 0) return;

  for (const link of linked) {
    try {
      if (link.module === 'sales') {
        const snap = await db.collection('sales')
          .where('id', '==', link.entityId).limit(1).get();
        if (!snap.empty) {
          await snap.docs[0].ref.update({
            missionStatus:  'completed',
            missionCardId:  cardId,
            updatedAt:      FS.FieldValue.serverTimestamp(),
          });
          logger.info(`[Butler] Sales ${link.entityId} → missionStatus = completed`);
        }
      }

      if (link.module === 'crm') {
        const crmDoc = await db.collection('crm').doc(link.entityId).get();
        if (crmDoc.exists) {
          await crmDoc.ref.update({
            missionCompleted:   true,
            missionCardId:      cardId,
            updatedAt:          FS.FieldValue.serverTimestamp(),
          });
        }
      }

      if (link.module === 'hr') {
        await db.collection('hr').doc(link.entityId).update({
          lastMissionCompleted:   cardId,
          lastMissionCompletedAt: FS.FieldValue.serverTimestamp(),
        }).catch(() => {});
      }

      if (link.module === 'production') {
        await db.collection('production').doc(link.entityId).update({
          missionStatus: 'completed',
          missionCardId: cardId,
          updatedAt:     FS.FieldValue.serverTimestamp(),
        }).catch(() => {});
      }

      if (link.module === 'finance') {
        await db.collection('finance').doc(link.entityId).update({
          missionStatus: 'completed',
          missionCardId: cardId,
          updatedAt:     FS.FieldValue.serverTimestamp(),
        }).catch(() => {});
      }
    } catch (e) {
      logger.error(`[Butler] Cross-module write ${link.module}/${link.entityId}:`, e.message);
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// TRIGGER 1 — CARD MOVED
// Fires on any card update; returns early if listId didn't change.
// ─────────────────────────────────────────────────────────────────

exports.onMissionsCardMoved = onDocumentUpdated(
  'missions_cards/{cardId}',
  async (event) => {
    const newData = event.data.after.data();
    const oldData = event.data.before.data();
    const { cardId } = event.params;
    const cardRef    = event.data.after.ref;

    if (newData.listId === oldData.listId) return null;

    try {
      // ── Destination list name ───────────────────────────
      const listDoc     = await db.collection('missions_lists').doc(newData.listId).get();
      const destListName = listDoc.exists ? listDoc.data().name : '';

      // ── Cross-module writes on "done" ───────────────────
      if (isDoneList(destListName)) {
        await syncLinkedEntitiesOnDone(newData, cardId);
        await cardRef.update({
          dueDateComplete: true,
          completedAt:     FS.FieldValue.serverTimestamp(),
        });
        logger.info(`[Butler] Card ${cardId} marked completed in "${destListName}"`);
      }

      // ── Butler rule evaluation ──────────────────────────
      if (!newData.boardId) return null;
      const rulesSnap = await db
        .collection('missions_boards').doc(newData.boardId)
        .collection('butler_rules')
        .where('active', '==', true)
        .get();

      for (const ruleDoc of rulesSnap.docs) {
        const rule = ruleDoc.data();
        if (rule.trigger?.type !== 'card_moved') continue;

        const cond = rule.trigger.conditions || {};

        if (cond.toListName &&
            destListName.toLowerCase() !== cond.toListName.toLowerCase()) continue;

        if (cond.fromListName) {
          const fromDoc = await db.collection('missions_lists').doc(oldData.listId).get();
          const fromName = fromDoc.exists ? fromDoc.data().name : '';
          if (fromName.toLowerCase() !== cond.fromListName.toLowerCase()) continue;
        }

        if (cond.labelId && !newData.labelIds?.includes(cond.labelId)) continue;

        for (const action of (rule.actions || [])) {
          await executeAction(action, newData, cardRef);
        }
        await logActivity(cardId, 'butler_action_fired', { ruleName: rule.name });
        logger.info(`[Butler] Rule "${rule.name}" fired on card ${cardId}`);
      }
    } catch (err) {
      logger.error('[Butler] onMissionsCardMoved error:', err);
    }

    return null;
  }
);

// ─────────────────────────────────────────────────────────────────
// TRIGGER 2 — CARD CREATED
// ─────────────────────────────────────────────────────────────────

exports.onMissionsCardCreated = onDocumentCreated(
  'missions_cards/{cardId}',
  async (event) => {
    const card    = event.data.data();
    const cardRef = event.data.ref;
    const { cardId } = event.params;

    if (!card?.boardId) return null;

    try {
      const rulesSnap = await db
        .collection('missions_boards').doc(card.boardId)
        .collection('butler_rules')
        .where('active', '==', true)
        .get();

      for (const ruleDoc of rulesSnap.docs) {
        const rule = ruleDoc.data();
        if (rule.trigger?.type !== 'card_created') continue;

        const cond = rule.trigger.conditions || {};
        if (cond.inListId  && card.listId !== cond.inListId)                 continue;
        if (cond.labelId   && !card.labelIds?.includes(cond.labelId))        continue;

        for (const action of (rule.actions || [])) {
          await executeAction(action, card, cardRef);
        }
        await logActivity(cardId, 'butler_action_fired', { ruleName: rule.name });
        logger.info(`[Butler] Create rule "${rule.name}" fired on card ${cardId}`);
      }
    } catch (err) {
      logger.error('[Butler] onMissionsCardCreated error:', err);
    }

    return null;
  }
);

// ─────────────────────────────────────────────────────────────────
// CRON 1 — DAILY DEADLINE SCANNER (08:00 Abidjan = UTC+0)
// ─────────────────────────────────────────────────────────────────

exports.missionsDeadlineScanner = onSchedule(
  { schedule: '0 8 * * *', timeZone: 'Africa/Abidjan' },
  async () => {
    const now          = new Date();
    const nowTs        = FS.Timestamp.fromDate(now);
    const dueSoonTs    = FS.Timestamp.fromDate(new Date(now.getTime() + DUE_SOON_MS));

    try {
      // Cards already overdue
      const overdueSnap = await db.collection('missions_cards')
        .where('isArchived',       '==', false)
        .where('dueDateComplete',  '==', false)
        .where('isOverdue',        '==', false)
        .where('dueDate',          '<',  nowTs)
        .limit(200)
        .get();

      // Cards due within 24 h
      const dueSoonSnap = await db.collection('missions_cards')
        .where('isArchived',       '==', false)
        .where('dueDateComplete',  '==', false)
        .where('isDueSoon',        '==', false)
        .where('dueDate',          '>=', nowTs)
        .where('dueDate',          '<=', dueSoonTs)
        .limit(200)
        .get();

      const batch = db.batch();

      for (const docSnap of overdueSnap.docs) {
        const card = docSnap.data();
        batch.update(docSnap.ref, { isOverdue: true });
        for (const uid of (card.members || [])) {
          const ref = db.collection('notifications').doc();
          batch.set(ref, {
            targetUserId: uid,
            type:         'mission_overdue',
            title:        '⏰ Carte en retard',
            body:         `La carte "${card.title}" est en retard.`,
            cardId:       docSnap.id,
            boardId:      card.boardId || null,
            read:         false,
            createdAt:    FS.FieldValue.serverTimestamp(),
            _createdAt:   FS.FieldValue.serverTimestamp(),
            _deletedAt:   null,
          });
        }
      }

      for (const docSnap of dueSoonSnap.docs) {
        const card = docSnap.data();
        batch.update(docSnap.ref, { isDueSoon: true });
        for (const uid of (card.members || [])) {
          const ref = db.collection('notifications').doc();
          batch.set(ref, {
            targetUserId: uid,
            type:         'mission_due_soon',
            title:        '🔔 Échéance imminente',
            body:         `La carte "${card.title}" est due dans moins de 24h.`,
            cardId:       docSnap.id,
            boardId:      card.boardId || null,
            read:         false,
            createdAt:    FS.FieldValue.serverTimestamp(),
            _createdAt:   FS.FieldValue.serverTimestamp(),
            _deletedAt:   null,
          });
        }
      }

      await batch.commit();
      logger.info(
        `[Missions CRON] Deadline scan: ${overdueSnap.size} overdue, ${dueSoonSnap.size} due-soon.`
      );
    } catch (err) {
      logger.error('[Missions CRON] Deadline scanner:', err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────
// CRON 2 — WEEKLY REPORT (Monday 07:00 Abidjan)
// Writes board stats to missions_reports/{boardId}
// ─────────────────────────────────────────────────────────────────

exports.missionsWeeklyReport = onSchedule(
  { schedule: '0 7 * * 1', timeZone: 'Africa/Abidjan' },
  async () => {
    const now     = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const nowTs   = FS.Timestamp.fromDate(now);
    const weekTs  = FS.Timestamp.fromDate(weekAgo);

    try {
      const boardsSnap = await db.collection('missions_boards')
        .where('isArchived', '==', false)
        .get();

      const batch = db.batch();

      for (const boardDoc of boardsSnap.docs) {
        const boardId = boardDoc.id;

        const [completedSnap, overdueSnap, createdSnap] = await Promise.all([
          db.collection('missions_cards')
            .where('boardId', '==', boardId)
            .where('isArchived', '==', false)
            .where('dueDateComplete', '==', true)
            .where('completedAt', '>=', weekTs)
            .get(),
          db.collection('missions_cards')
            .where('boardId', '==', boardId)
            .where('isArchived', '==', false)
            .where('isOverdue',  '==', true)
            .get(),
          db.collection('missions_cards')
            .where('boardId', '==', boardId)
            .where('isArchived', '==', false)
            .where('createdAt', '>=', weekTs)
            .get(),
        ]);

        const reportRef = db.collection('missions_reports').doc(boardId);
        batch.set(reportRef, {
          boardId,
          workspaceId: boardDoc.data().workspaceId || null,
          boardName:   boardDoc.data().name || boardId,
          periodStart: weekTs,
          periodEnd:   nowTs,
          stats: {
            completed: completedSnap.size,
            overdue:   overdueSnap.size,
            created:   createdSnap.size,
          },
          generatedAt: FS.FieldValue.serverTimestamp(),
        }, { merge: true });
      }

      await batch.commit();
      logger.info(`[Missions CRON] Weekly reports for ${boardsSnap.size} boards.`);
    } catch (err) {
      logger.error('[Missions CRON] Weekly report:', err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────
// CRON 3 — RESET isDueSoon FLAGS (midnight Abidjan)
// Cards whose dueDate has now passed get the flag cleared.
// ─────────────────────────────────────────────────────────────────

exports.missionsResetDueSoonFlags = onSchedule(
  { schedule: '0 0 * * *', timeZone: 'Africa/Abidjan' },
  async () => {
    const nowTs = FS.Timestamp.fromDate(new Date());
    try {
      const snap = await db.collection('missions_cards')
        .where('isDueSoon', '==', true)
        .where('dueDate',   '<',  nowTs)
        .limit(200)
        .get();
      if (snap.empty) return;
      const batch = db.batch();
      snap.docs.forEach(d => batch.update(d.ref, { isDueSoon: false }));
      await batch.commit();
      logger.info(`[Missions CRON] isDueSoon reset on ${snap.size} cards.`);
    } catch (err) {
      logger.error('[Missions CRON] Reset flags:', err);
    }
  }
);

// ─────────────────────────────────────────────────────────────────
// CALLABLE — Save Butler Rule
// ─────────────────────────────────────────────────────────────────

exports.saveMissionsButlerRule = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Authentication required');

  const { boardId, rule } = request.data;
  if (!boardId) throw new HttpsError('invalid-argument', 'boardId required');
  if (!rule?.trigger?.type) throw new HttpsError('invalid-argument', 'rule.trigger.type required');
  if (!Array.isArray(rule.actions) || rule.actions.length === 0) {
    throw new HttpsError('invalid-argument', 'rule.actions must be a non-empty array');
  }

  // [AUDIT FIX] IDOR guard: verify caller has write access to this board
  const boardDoc = await db.collection('missions_boards').doc(boardId).get();
  if (!boardDoc.exists) throw new HttpsError('not-found', 'Board not found');
  const board = boardDoc.data();
  const callerRole = request.auth.token?.role;
  const isBoardMember = board.createdBy === uid ||
    (Array.isArray(board.members) && board.members.includes(uid)) ||
    ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(callerRole);
  if (!isBoardMember) {
    throw new HttpsError('permission-denied', 'Accès refusé : vous n\'êtes pas membre de ce tableau.');
  }

  const ruleId  = rule.id || `rule_${Date.now()}`;
  const ruleRef = db.collection('missions_boards').doc(boardId)
    .collection('butler_rules').doc(ruleId);

  await ruleRef.set({
    ...rule,
    id:        ruleId,
    boardId,
    createdBy: uid,
    updatedAt: FS.FieldValue.serverTimestamp(),
    active:    rule.active !== false,
  }, { merge: true });

  return { ruleId };
});

// ─────────────────────────────────────────────────────────────────
// CALLABLE — Delete Butler Rule
// ─────────────────────────────────────────────────────────────────

exports.deleteMissionsButlerRule = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Authentication required');

  const { boardId, ruleId } = request.data;
  if (!boardId || !ruleId) throw new HttpsError('invalid-argument', 'boardId and ruleId required');

  // [AUDIT FIX] IDOR guard: verify caller is board owner or admin
  const boardDoc = await db.collection('missions_boards').doc(boardId).get();
  if (!boardDoc.exists) throw new HttpsError('not-found', 'Board not found');
  const board = boardDoc.data();
  const callerRole = request.auth.token?.role;
  const canDelete = board.createdBy === uid ||
    ['SUPER_ADMIN', 'ADMIN'].includes(callerRole);
  if (!canDelete) {
    throw new HttpsError('permission-denied',
      'Seul le créateur du tableau ou un administrateur peut supprimer une règle Butler.');
  }

  await db.collection('missions_boards').doc(boardId)
    .collection('butler_rules').doc(ruleId).delete();

  return { success: true };
});

// ─────────────────────────────────────────────────────────────────
// CALLABLE — Execute Butler Rule (manual / test)
// ─────────────────────────────────────────────────────────────────

exports.executeMissionsButlerRule = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Authentication required');

  const { cardId, ruleId, boardId } = request.data;
  if (!cardId || !ruleId || !boardId) {
    throw new HttpsError('invalid-argument', 'cardId, ruleId, boardId required');
  }

  const [cardDoc, ruleDoc] = await Promise.all([
    db.collection('missions_cards').doc(cardId).get(),
    db.collection('missions_boards').doc(boardId)
      .collection('butler_rules').doc(ruleId).get(),
  ]);

  if (!cardDoc.exists) throw new HttpsError('not-found', 'Card not found');
  if (!ruleDoc.exists) throw new HttpsError('not-found', 'Butler rule not found');

  const card    = cardDoc.data();
  const rule    = ruleDoc.data();
  const cardRef = cardDoc.ref;

  for (const action of (rule.actions || [])) {
    await executeAction(action, card, cardRef);
  }
  await logActivity(cardId, 'butler_action_fired', { ruleId, ruleName: rule.name });

  return { success: true, actionsExecuted: rule.actions?.length || 0 };
});
