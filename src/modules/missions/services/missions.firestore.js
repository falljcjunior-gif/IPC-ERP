/**
 * Missions Firestore Service
 * Toutes les interactions DB du module Missions passent ici.
 * Isole le module du FirestoreService générique de l'ERP.
 */
import {
  collection, doc, getDoc, getDocs, addDoc, setDoc,
  updateDoc, deleteDoc, query, where, orderBy, limit,
  onSnapshot, serverTimestamp, increment, writeBatch,
  runTransaction,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../../firebase/config';
import { nanoid } from 'nanoid';
import { rankAfter, rankBetween, rebalance, needsRebalancing, sortByRank } from './lexorank';

// ── Noms des collections top-level ──────────────────────────────
const COL = {
  workspaces: 'missions_workspaces',
  boards:     'missions_boards',
  lists:      'missions_lists',
  cards:      'missions_cards',
};

// ── Sous-collections (chemin relatif à une card) ─────────────────
const SUB = {
  comments:    'comments',
  checklists:  'checklists',
  attachments: 'attachments',
  activity:    'activity',
};

// ─────────────────────────────────────────────────────────────────
// WORKSPACES
// ─────────────────────────────────────────────────────────────────

export const MissionsFS = {

  // ── Workspaces ────────────────────────────────────────────────

  subscribeWorkspaces(uid, callback) {
    // Filter server-side to workspaces where this user is a member.
    // Uses memberRoles map key — requires a Firestore composite index on
    // memberRoles (array-contains is not applicable for maps; we filter
    // client-side on the flat members array as Firestore can't query map keys).
    // The security rules enforce membership — this is a performance filter.
    const q = query(
      collection(db, COL.workspaces),
      where('isArchived', '==', false),
      orderBy('updatedAt', 'desc')
    );
    return onSnapshot(q, snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Client-side membership filter (Firestore can't query map keys)
      const mine = all.filter(ws =>
        ws.memberRoles?.[uid] ||                       // new format
        (ws.members || []).some(m => m.uid === uid)    // legacy fallback
      );
      callback(mine);
    });
  },

  async createWorkspace(data, uid) {
    const id = nanoid();
    await setDoc(doc(db, COL.workspaces, id), {
      ...data,
      id,
      members:     [{ uid, role: 'ADMIN' }],
      memberRoles: { [uid]: 'ADMIN' },   // flat map for O(1) rule lookups
      boardCount:  0,
      createdBy:   uid,
      createdAt:   serverTimestamp(),
      updatedAt:   serverTimestamp(),
      isArchived:  false,
    });
    return id;
  },

  subscribeWorkspaceMembers(workspaceId, callback) {
    return onSnapshot(doc(db, COL.workspaces, workspaceId), snap => {
      if (!snap.exists()) { callback([]); return; }
      callback(snap.data().members || []);
    });
  },

  async addWorkspaceMember(workspaceId, memberUid, role = 'MEMBER') {
    const wsRef = doc(db, COL.workspaces, workspaceId);
    await runTransaction(db, async tx => {
      const snap = await tx.get(wsRef);
      if (!snap.exists()) throw new Error('Workspace not found');
      const data = snap.data();
      const existing = (data.members || []).find(m => m.uid === memberUid);
      if (existing) return; // already a member, no-op
      tx.update(wsRef, {
        members:                   [...(data.members || []), { uid: memberUid, role }],
        [`memberRoles.${memberUid}`]: role,
        updatedAt:                 serverTimestamp(),
      });
    });
  },

  async removeWorkspaceMember(workspaceId, memberUid) {
    // Transactions don't support FieldValue.deleteField() for map keys.
    // So we do a two-step: first validate + update members array,
    // then remove the map key with a plain update.
    const wsRef = doc(db, COL.workspaces, workspaceId);
    const snap  = await getDoc(wsRef);
    if (!snap.exists()) throw new Error('Workspace not found');
    const data = snap.data();

    const updatedMembers = (data.members || []).filter(m => m.uid !== memberUid);
    const wasAdmin       = data.memberRoles?.[memberUid] === 'ADMIN';
    const adminCount     = updatedMembers.filter(m => m.role === 'ADMIN').length;
    if (wasAdmin && adminCount === 0) throw new Error('Cannot remove the only admin');

    const { deleteField } = await import('firebase/firestore');
    await updateDoc(wsRef, {
      members:                      updatedMembers,
      [`memberRoles.${memberUid}`]: deleteField(),
      updatedAt:                    serverTimestamp(),
    });
  },

  async updateWorkspaceMemberRole(workspaceId, memberUid, newRole) {
    const wsRef = doc(db, COL.workspaces, workspaceId);
    await runTransaction(db, async tx => {
      const snap = await tx.get(wsRef);
      if (!snap.exists()) throw new Error('Workspace not found');
      const data = snap.data();
      const updatedMembers = (data.members || []).map(m =>
        m.uid === memberUid ? { ...m, role: newRole } : m
      );
      // Prevent downgrading the last admin
      if (newRole !== 'ADMIN') {
        const remainingAdmins = updatedMembers.filter(m => m.role === 'ADMIN').length;
        if (remainingAdmins === 0) throw new Error('At least one ADMIN is required');
      }
      tx.update(wsRef, {
        members:                   updatedMembers,
        [`memberRoles.${memberUid}`]: newRole,
        updatedAt:                 serverTimestamp(),
      });
    });
  },

  async searchUsersByEmail(email) {
    if (!email || email.length < 3) return [];
    const snap = await getDocs(
      query(
        collection(db, 'users'),
        where('email', '>=', email),
        where('email', '<=', email + ''),
        limit(8)
      )
    );
    return snap.docs.map(d => ({
      uid:    d.id,
      email:  d.data().email,
      nom:    d.data().profile?.nom || d.data().nom || d.data().email,
      avatar: d.data().profile?.avatar || '?',
    }));
  },

  // ── Boards ────────────────────────────────────────────────────

  subscribeBoards(workspaceId, callback) {
    const q = query(
      collection(db, COL.boards),
      where('workspaceId', '==', workspaceId),
      where('isArchived', '==', false),
      orderBy('updatedAt', 'desc')
    );
    return onSnapshot(q, snap =>
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  },

  async createBoard(workspaceId, data, uid) {
    const batch = writeBatch(db);
    const boardId = nanoid();

    batch.set(doc(db, COL.boards, boardId), {
      ...data,
      id: boardId,
      workspaceId,
      visibility:  'workspace',             // 'workspace' | 'private'
      members:     [{ uid, role: 'ADMIN' }],
      memberRoles: { [uid]: 'ADMIN' },
      customFields: [],
      labels: [
        { id: nanoid(), name: 'Urgent',    color: '#EF4444' },
        { id: nanoid(), name: 'Important', color: '#F59E0B' },
        { id: nanoid(), name: 'En attente',color: '#3B82F6' },
        { id: nanoid(), name: 'Validé',    color: '#10B981' },
      ],
      rules: [],
      listCount: 0,
      cardCount: 0,
      createdBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isArchived: false,
      isClosed: false,
    });

    // Incrémente boardCount du workspace
    batch.update(doc(db, COL.workspaces, workspaceId), {
      boardCount: increment(1),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
    return boardId;
  },

  async updateBoard(boardId, data) {
    await updateDoc(doc(db, COL.boards, boardId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  // ── Lists ─────────────────────────────────────────────────────

  subscribeLists(boardId, callback) {
    const q = query(
      collection(db, COL.lists),
      where('boardId', '==', boardId),
      where('isArchived', '==', false),
      orderBy('rank', 'asc')
    );
    return onSnapshot(q, snap =>
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  },

  async createList(boardId, workspaceId, name, lastRank) {
    const id = nanoid();
    await setDoc(doc(db, COL.lists, id), {
      id,
      boardId,
      workspaceId,
      name,
      rank: rankAfter(lastRank),
      wipLimit: null,
      cardCount: 0,
      isArchived: false,
      createdAt: serverTimestamp(),
    });

    await updateDoc(doc(db, COL.boards, boardId), {
      listCount: increment(1),
      updatedAt: serverTimestamp(),
    });

    return id;
  },

  async updateList(listId, data) {
    await updateDoc(doc(db, COL.lists, listId), data);
  },

  // ── Cards ─────────────────────────────────────────────────────

  subscribeCards(boardId, callback) {
    const q = query(
      collection(db, COL.cards),
      where('boardId', '==', boardId),
      where('isArchived', '==', false),
      orderBy('rank', 'asc')
    );
    return onSnapshot(q, snap =>
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  },

  async createCard(listId, boardId, workspaceId, title, uid, lastRankInList) {
    const id = nanoid();
    const rank = rankAfter(lastRankInList);

    const batch = writeBatch(db);

    batch.set(doc(db, COL.cards, id), {
      id,
      listId,
      boardId,
      workspaceId,
      title,
      description: '',
      rank,
      members: [uid],
      labelIds: [],
      startDate: null,
      dueDate: null,
      dueDateComplete: false,
      cover: null,
      customFieldValues: {},
      linkedEntities: [],
      commentCount: 0,
      attachmentCount: 0,
      checklistProgress: { total: 0, complete: 0 },
      createdBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isArchived: false,
    });

    // Compteur list
    batch.update(doc(db, COL.lists, listId), {
      cardCount: increment(1),
    });

    // Compteur board
    batch.update(doc(db, COL.boards, boardId), {
      cardCount: increment(1),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();

    // Journal d'activité (hors batch pour ne pas bloquer)
    this._logActivity(id, 'card_created', uid, {});

    return { id, rank };
  },

  async updateCard(cardId, data, uid, activityMeta = null) {
    const updates = { ...data, updatedAt: serverTimestamp() };
    await updateDoc(doc(db, COL.cards, cardId), updates);

    if (activityMeta) {
      await this._logActivity(cardId, activityMeta.type, uid, activityMeta.meta || {});
    }
  },

  /**
   * DÉPLACEMENT D'UNE CARTE (Optimistic UI compatible)
   * 1 seul write Firestore (juste la carte).
   * Si rebalancing nécessaire → batch de la liste entière.
   *
   * @param {string}      cardId
   * @param {string}      newListId
   * @param {string|null} prevCardRank  — rank de la carte au-dessus dans la destination
   * @param {string|null} nextCardRank  — rank de la carte en-dessous dans la destination
   * @param {string}      uid
   * @param {string}      fromListId
   * @param {object}      listContext   — { lists: ListDoc[], cards: CardDoc[] }
   */
  async moveCard(cardId, newListId, prevCardRank, nextCardRank, uid, fromListId, listContext) {
    const newRank = rankBetween(prevCardRank, nextCardRank);

    if (needsRebalancing(newRank)) {
      // Rebalance les cartes de la liste de destination
      const destCards = sortByRank(
        listContext.cards.filter(c => c.listId === newListId && c.id !== cardId)
      );
      const rebalanced = rebalance(destCards.map(c => c.id));

      const batch = writeBatch(db);
      Object.entries(rebalanced).forEach(([id, rank]) => {
        batch.update(doc(db, COL.cards, id), { rank });
      });
      // Insère la carte déplacée avec son rang recalculé basé sur la nouvelle distribution
      batch.update(doc(db, COL.cards, cardId), {
        listId: newListId,
        rank: rankBetween(prevCardRank ? rebalanced[prevCardRank] || prevCardRank : null,
                          nextCardRank ? rebalanced[nextCardRank] || nextCardRank : null),
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
    } else {
      // Cas normal : 1 write
      const updates = { rank: newRank, updatedAt: serverTimestamp() };
      if (newListId !== fromListId) {
        updates.listId = newListId;
      }
      await updateDoc(doc(db, COL.cards, cardId), updates);
    }

    // Mise à jour des compteurs si changement de liste
    if (newListId !== fromListId) {
      const batch2 = writeBatch(db);
      batch2.update(doc(db, COL.lists, fromListId), { cardCount: increment(-1) });
      batch2.update(doc(db, COL.lists, newListId),  { cardCount: increment(1) });
      await batch2.commit();
    }

    // Activité
    const fromList = listContext.lists.find(l => l.id === fromListId);
    const toList   = listContext.lists.find(l => l.id === newListId);
    await this._logActivity(cardId, 'card_moved', uid, {
      fromListId,
      fromListName: fromList?.name,
      toListId: newListId,
      toListName: toList?.name,
    });
  },

  // ── Checklists ────────────────────────────────────────────────

  subscribeChecklists(cardId, callback) {
    const q = query(
      collection(db, COL.cards, cardId, SUB.checklists),
      orderBy('rank', 'asc')
    );
    return onSnapshot(q, snap =>
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  },

  async createChecklist(cardId, title, uid) {
    const id = nanoid();
    await setDoc(doc(db, COL.cards, cardId, SUB.checklists, id), {
      id, title, rank: rankAfter(null), items: [], createdAt: serverTimestamp(),
    });
    await this._logActivity(cardId, 'checklist_created', uid, { fieldName: title });
    return id;
  },

  async toggleChecklistItem(cardId, checklistId, itemId, complete, uid, cardProgress) {
    const clRef = doc(db, COL.cards, cardId, SUB.checklists, checklistId);
    const clSnap = await getDoc(clRef);
    if (!clSnap.exists()) return;

    const items = clSnap.data().items.map(item =>
      item.id === itemId
        ? { ...item, complete, completedAt: complete ? new Date().toISOString() : null, completedBy: complete ? uid : null }
        : item
    );

    const batch = writeBatch(db);
    batch.update(clRef, { items });

    // Met à jour le progress dénormalisé sur la card
    const allItems = items; // juste cette checklist, approximatif mais fonctionnel
    const totalComplete = allItems.filter(i => i.complete).length;
    const totalItems    = allItems.length;
    batch.update(doc(db, COL.cards, cardId), {
      checklistProgress: {
        total:    (cardProgress.total || totalItems),
        complete: Math.max(0, (cardProgress.complete || 0) + (complete ? 1 : -1)),
      },
      updatedAt: serverTimestamp(),
    });
    await batch.commit();

    await this._logActivity(cardId,
      complete ? 'checklist_item_checked' : 'checklist_item_unchecked',
      uid, {}
    );
  },

  // ── Attachments ───────────────────────────────────────────────

  async uploadAttachment(cardId, file, uid, onProgress) {
    const id = nanoid();
    const path = `missions/cards/${cardId}/${id}_${file.name}`;
    const storageRef = ref(storage, path);

    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on('state_changed',
        snap => onProgress && onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        reject,
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          await setDoc(doc(db, COL.cards, cardId, SUB.attachments, id), {
            id, name: file.name, storagePath: path, downloadUrl,
            mimeType: file.type, size: file.size,
            isCover: false, uploadedBy: uid, createdAt: serverTimestamp(),
          });
          await updateDoc(doc(db, COL.cards, cardId), {
            attachmentCount: increment(1), updatedAt: serverTimestamp(),
          });
          await this._logActivity(cardId, 'attachment_added', uid, { fieldName: file.name });
          resolve({ id, downloadUrl, name: file.name });
        }
      );
    });
  },

  subscribeAttachments(cardId, callback) {
    return onSnapshot(
      collection(db, COL.cards, cardId, SUB.attachments),
      snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  },

  // ── Comments ──────────────────────────────────────────────────

  subscribeComments(cardId, callback) {
    const q = query(
      collection(db, COL.cards, cardId, SUB.comments),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, snap =>
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  },

  async addComment(cardId, text, uid, userName) {
    const id = nanoid();
    await setDoc(doc(db, COL.cards, cardId, SUB.comments, id), {
      id, text, authorUid: uid, authorName: userName,
      edited: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
    await updateDoc(doc(db, COL.cards, cardId), {
      commentCount: increment(1), updatedAt: serverTimestamp(),
    });
    await this._logActivity(cardId, 'comment_added', uid, {});
    return id;
  },

  // ── Activity Log (audit) ─────────────────────────────────────

  subscribeActivity(cardId, callback) {
    const q = query(
      collection(db, COL.cards, cardId, SUB.activity),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    return onSnapshot(q, snap =>
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  },

  async _logActivity(cardId, type, actorUid, meta) {
    try {
      const id = nanoid();
      await setDoc(doc(db, COL.cards, cardId, SUB.activity, id), {
        id, type, actorUid, meta: meta || {},
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      // Non bloquant : le journal ne doit jamais faire planter l'UX
      console.warn('[MissionsFS] Activity log failed:', e.message);
    }
  },

  // ── Liens ERP ────────────────────────────────────────────────

  async addErpLink(cardId, link, uid) {
    const cardRef = doc(db, COL.cards, cardId);
    await runTransaction(db, async tx => {
      const snap = await tx.get(cardRef);
      const current = snap.data().linkedEntities || [];
      if (current.find(l => l.entityId === link.entityId)) return; // dédoublonnage
      tx.update(cardRef, {
        linkedEntities: [...current, link],
        updatedAt: serverTimestamp(),
      });
    });
    await this._logActivity(cardId, 'erp_link_added', uid, { fieldName: link.label });
  },

  async removeErpLink(cardId, entityId, uid) {
    const cardRef = doc(db, COL.cards, cardId);
    await runTransaction(db, async tx => {
      const snap = await tx.get(cardRef);
      const current = snap.data().linkedEntities || [];
      tx.update(cardRef, {
        linkedEntities: current.filter(l => l.entityId !== entityId),
        updatedAt: serverTimestamp(),
      });
    });
    await this._logActivity(cardId, 'erp_link_removed', uid, { fieldName: entityId });
  },

  // ── Butler Rules ─────────────────────────────────────────────

  subscribeButlerRules(boardId, callback) {
    const q = query(
      collection(db, COL.boards, boardId, 'butler_rules'),
      orderBy('updatedAt', 'desc')
    );
    return onSnapshot(q, snap =>
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  },

  async saveButlerRule(boardId, rule) {
    const fn = httpsCallable(getFunctions(), 'saveMissionsButlerRule');
    const res = await fn({ boardId, rule });
    return res.data;
  },

  async deleteButlerRule(boardId, ruleId) {
    const fn = httpsCallable(getFunctions(), 'deleteMissionsButlerRule');
    await fn({ boardId, ruleId });
  },

  async executeButlerRule(boardId, ruleId, cardId) {
    const fn = httpsCallable(getFunctions(), 'executeMissionsButlerRule');
    const res = await fn({ boardId, ruleId, cardId });
    return res.data;
  },

  // ── Weekly Report ────────────────────────────────────────────

  subscribeWeeklyReport(boardId, callback) {
    return onSnapshot(doc(db, 'missions_reports', boardId), snap => {
      callback(snap.exists() ? snap.data() : null);
    });
  },
};

export default MissionsFS;
