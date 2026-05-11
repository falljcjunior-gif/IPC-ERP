/**
 * ═══════════════════════════════════════════════════════════════════
 *  MISSIONS STORE — Zustand avec Optimistic UI
 *
 *  PRINCIPE DE L'OPTIMISTIC UI :
 *  1. L'user drop une carte → l'UI se met à jour IMMÉDIATEMENT (0ms)
 *  2. On sauvegarde l'état précédent ("snapshot")
 *  3. On envoie la mutation à Firebase en arrière-plan
 *  4a. Firebase confirme → on supprime le snapshot (success silencieux)
 *  4b. Firebase échoue  → ROLLBACK : on restaure le snapshot + toast d'erreur
 *
 *  Ceci donne une fluidité Trello-native même sur une connexion 3G.
 *
 *  ARCHITECTURE :
 *  - workspaces[]  — liste des workspaces accessibles
 *  - boards{}      — map boardId → BoardDoc (avec labels, customFields, rules)
 *  - lists{}       — map boardId → ListDoc[] (triées par rank)
 *  - cards{}       — map boardId → CardDoc[] (toutes les cartes du board actif)
 *  - activeBoard   — boardId courant
 *  - cardDetail    — CardDoc en cours d'édition dans la modale
 *  - pendingOps    — Set de cardIds en cours de mutation (spinner discret)
 * ═══════════════════════════════════════════════════════════════════
 */
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { MissionsFS } from '../services/missions.firestore';
import { rankBetween, rankAfter, sortByRank, needsRebalancing, rebalance } from '../services/lexorank';
import { useToastStore } from '../../../store/useToastStore';

// ── Helpers ──────────────────────────────────────────────────────────

const toast = (msg, type = 'error') =>
  useToastStore.getState().addToast(msg, type);

// Snapshot profond des listes + cartes pour rollback
const snapshot = (cards, lists, boardId) => ({
  cards: JSON.parse(JSON.stringify(cards[boardId] || [])),
  lists: JSON.parse(JSON.stringify(lists[boardId] || [])),
});

// ─────────────────────────────────────────────────────────────────────
// STORE
// ─────────────────────────────────────────────────────────────────────

export const useMissionsStore = create(
  subscribeWithSelector((set, get) => ({

    // ── State ──────────────────────────────────────────────────────

    workspaces:        [],
    workspacesLoaded:  false,
    boards:            {},   // boardId → BoardDoc
    lists:        {},   // boardId → ListDoc[]
    cards:        {},   // boardId → CardDoc[]

    activeWorkspaceId: null,
    activeBoardId:     null,
    cardDetail:        null,   // CardDoc ouvert dans la modale

    pendingOps:   new Set(),   // cardIds / listIds en mutation
    listeners:    {},          // cleanup functions des onSnapshot

    // ── Subscriptions temps réel ───────────────────────────────────

    subscribeWorkspaces(uid) {
      const prev = get().listeners['workspaces'];
      if (prev) prev();

      const unsub = MissionsFS.subscribeWorkspaces(uid, workspaces => {
        set({ workspaces, workspacesLoaded: true });
      });
      set(s => ({ listeners: { ...s.listeners, workspaces: unsub } }));
    },

    subscribeBoard(boardId) {
      const { listeners } = get();

      // Dés-abonne les listeners de l'ancien board
      ['lists_' + boardId, 'cards_' + boardId].forEach(k => {
        if (listeners[k]) { listeners[k](); }
      });

      const unsubLists = MissionsFS.subscribeLists(boardId, lists => {
        set(s => ({
          lists: { ...s.lists, [boardId]: sortByRank(lists) },
        }));
      });

      const unsubCards = MissionsFS.subscribeCards(boardId, cards => {
        set(s => ({
          cards: { ...s.cards, [boardId]: sortByRank(cards) },
        }));
      });

      set(s => ({
        activeBoardId: boardId,
        listeners: {
          ...s.listeners,
          [`lists_${boardId}`]: unsubLists,
          [`cards_${boardId}`]: unsubCards,
        },
      }));
    },

    unsubscribeAll() {
      const { listeners } = get();
      Object.values(listeners).forEach(fn => fn && fn());
      set({ listeners: {}, workspacesLoaded: false });
    },

    // ── Getters dérivés ────────────────────────────────────────────

    getListsForBoard(boardId) {
      return get().lists[boardId] || [];
    },

    getCardsForList(boardId, listId) {
      const allCards = get().cards[boardId] || [];
      return sortByRank(allCards.filter(c => c.listId === listId && !c.isArchived));
    },

    getCardsForBoard(boardId) {
      return sortByRank((get().cards[boardId] || []).filter(c => !c.isArchived));
    },

    getBoard(boardId) {
      return get().boards[boardId] || null;
    },

    // ── CREATE CARD ────────────────────────────────────────────────

    async createCard(listId, boardId, workspaceId, title, uid) {
      const { cards } = get();
      const cardsInList = get().getCardsForList(boardId, listId);
      const lastRank = cardsInList.length > 0 ? cardsInList[cardsInList.length - 1].rank : null;

      // Optimistic : on insère une carte temporaire immédiatement
      const tempId = `__temp_${Date.now()}`;
      const newRank = rankAfter(lastRank);
      const tempCard = {
        id: tempId, listId, boardId, workspaceId, title,
        rank: newRank, members: [uid], labelIds: [],
        dueDate: null, dueDateComplete: false, cover: null,
        customFieldValues: {}, linkedEntities: [],
        commentCount: 0, attachmentCount: 0,
        checklistProgress: { total: 0, complete: 0 },
        isArchived: false, _optimistic: true,
      };

      set(s => ({
        cards: {
          ...s.cards,
          [boardId]: sortByRank([...(s.cards[boardId] || []), tempCard]),
        },
      }));

      try {
        const { id: realId, rank: realRank } = await MissionsFS.createCard(
          listId, boardId, workspaceId, title, uid, lastRank
        );
        // Remplace la carte temporaire par la vraie
        set(s => ({
          cards: {
            ...s.cards,
            [boardId]: sortByRank(
              (s.cards[boardId] || [])
                .filter(c => c.id !== tempId)
                .concat({ ...tempCard, id: realId, rank: realRank, _optimistic: false })
            ),
          },
        }));
        return realId;
      } catch (err) {
        // Rollback : supprime la carte temporaire
        set(s => ({
          cards: { ...s.cards, [boardId]: (s.cards[boardId] || []).filter(c => c.id !== tempId) },
        }));
        toast('Échec de la création de la carte. Vérifiez votre connexion.');
        throw err;
      }
    },

    // ── MOVE CARD (cœur du Drag & Drop) ───────────────────────────
    //
    //  Appelé par le handler onDragEnd de @dnd-kit.
    //  Paramètres :
    //   - cardId       : la carte déplacée
    //   - newListId    : liste de destination
    //   - prevCardId   : carte juste au-dessus dans la destination (null = début)
    //   - nextCardId   : carte juste en-dessous dans la destination (null = fin)
    //   - uid          : user courant
    //
    async moveCard(cardId, newListId, prevCardId, nextCardId, uid) {
      const boardId = get().activeBoardId;
      if (!boardId) return;

      const allCards = get().cards[boardId] || [];
      const movingCard = allCards.find(c => c.id === cardId);
      if (!movingCard) return;

      const fromListId = movingCard.listId;
      const prevCard = prevCardId ? allCards.find(c => c.id === prevCardId) : null;
      const nextCard = nextCardId ? allCards.find(c => c.id === nextCardId) : null;
      const newRank  = rankBetween(prevCard?.rank ?? null, nextCard?.rank ?? null);

      // ── SNAPSHOT pour rollback ──────────────────────────────────
      const rollback = snapshot(get().cards, get().lists, boardId);

      // ── OPTIMISTIC UPDATE (synchrone, 0ms) ──────────────────────
      set(s => {
        const updated = (s.cards[boardId] || []).map(c =>
          c.id === cardId
            ? { ...c, listId: newListId, rank: newRank, _optimistic: true }
            : c
        );
        return {
          cards: { ...s.cards, [boardId]: sortByRank(updated) },
          pendingOps: new Set([...s.pendingOps, cardId]),
        };
      });

      // ── FIREBASE (asynchrone) ──────────────────────────────────
      try {
        const lists = get().lists[boardId] || [];
        const cards = get().cards[boardId] || [];

        await MissionsFS.moveCard(
          cardId, newListId,
          prevCard?.rank ?? null, nextCard?.rank ?? null,
          uid, fromListId,
          { lists, cards }
        );

        // Confirme : retire _optimistic flag
        set(s => ({
          cards: {
            ...s.cards,
            [boardId]: (s.cards[boardId] || []).map(c =>
              c.id === cardId ? { ...c, _optimistic: false } : c
            ),
          },
          pendingOps: new Set([...s.pendingOps].filter(id => id !== cardId)),
        }));

      } catch (err) {
        // ── ROLLBACK ──────────────────────────────────────────────
        set(s => ({
          cards: { ...s.cards, [boardId]: rollback.cards },
          lists: { ...s.lists, [boardId]: rollback.lists },
          pendingOps: new Set([...s.pendingOps].filter(id => id !== cardId)),
        }));
        toast('Déplacement échoué. La carte a été replacée à sa position initiale.');
        console.error('[MissionsStore] moveCard rollback:', err);
      }
    },

    // ── MOVE LIST (drag & drop des colonnes) ──────────────────────

    async moveList(listId, prevListId, nextListId, uid) {
      const boardId = get().activeBoardId;
      if (!boardId) return;

      const allLists = get().lists[boardId] || [];
      const prevList = prevListId ? allLists.find(l => l.id === prevListId) : null;
      const nextList = nextListId ? allLists.find(l => l.id === nextListId) : null;
      const newRank  = rankBetween(prevList?.rank ?? null, nextList?.rank ?? null);

      const rollback = { lists: JSON.parse(JSON.stringify(allLists)) };

      // Optimistic
      set(s => ({
        lists: {
          ...s.lists,
          [boardId]: sortByRank(
            (s.lists[boardId] || []).map(l =>
              l.id === listId ? { ...l, rank: newRank, _optimistic: true } : l
            )
          ),
        },
        pendingOps: new Set([...s.pendingOps, listId]),
      }));

      try {
        await MissionsFS.updateList(listId, { rank: newRank });
        set(s => ({
          lists: {
            ...s.lists,
            [boardId]: (s.lists[boardId] || []).map(l =>
              l.id === listId ? { ...l, _optimistic: false } : l
            ),
          },
          pendingOps: new Set([...s.pendingOps].filter(id => id !== listId)),
        }));
      } catch (err) {
        set(s => ({
          lists: { ...s.lists, [boardId]: rollback.lists },
          pendingOps: new Set([...s.pendingOps].filter(id => id !== listId)),
        }));
        toast('Déplacement de la colonne échoué.');
      }
    },

    // ── UPDATE CARD (titre, description, dates, labels…) ──────────

    async updateCard(cardId, data, uid, activityMeta) {
      const boardId = get().activeBoardId;
      if (!boardId) return;

      // Snapshot de la carte uniquement
      const prevCard = (get().cards[boardId] || []).find(c => c.id === cardId);
      if (!prevCard) return;

      // Optimistic
      set(s => ({
        cards: {
          ...s.cards,
          [boardId]: (s.cards[boardId] || []).map(c =>
            c.id === cardId ? { ...c, ...data, _optimistic: true } : c
          ),
        },
        cardDetail: s.cardDetail?.id === cardId
          ? { ...s.cardDetail, ...data, _optimistic: true }
          : s.cardDetail,
      }));

      try {
        await MissionsFS.updateCard(cardId, data, uid, activityMeta);
        set(s => ({
          cards: {
            ...s.cards,
            [boardId]: (s.cards[boardId] || []).map(c =>
              c.id === cardId ? { ...c, _optimistic: false } : c
            ),
          },
          cardDetail: s.cardDetail?.id === cardId
            ? { ...s.cardDetail, _optimistic: false }
            : s.cardDetail,
        }));
      } catch (err) {
        // Rollback de la carte
        set(s => ({
          cards: {
            ...s.cards,
            [boardId]: (s.cards[boardId] || []).map(c =>
              c.id === cardId ? prevCard : c
            ),
          },
          cardDetail: s.cardDetail?.id === cardId ? prevCard : s.cardDetail,
        }));
        toast('Modification non sauvegardée. Vérifiez votre connexion.');
      }
    },

    // ── CARD DETAIL (modale) ───────────────────────────────────────

    openCardDetail(card) {
      set({ cardDetail: card });
    },

    closeCardDetail() {
      set({ cardDetail: null });
    },

    // ── CREATE LIST ────────────────────────────────────────────────

    async createList(boardId, workspaceId, name, uid) {
      const lists = get().lists[boardId] || [];
      const lastRank = lists.length > 0 ? lists[lists.length - 1].rank : null;

      const tempId = `__temp_list_${Date.now()}`;
      const tempList = {
        id: tempId, boardId, workspaceId, name,
        rank: rankAfter(lastRank), cardCount: 0, isArchived: false, _optimistic: true,
      };

      set(s => ({
        lists: {
          ...s.lists,
          [boardId]: sortByRank([...(s.lists[boardId] || []), tempList]),
        },
      }));

      try {
        const realId = await MissionsFS.createList(boardId, workspaceId, name, lastRank);
        set(s => ({
          lists: {
            ...s.lists,
            [boardId]: sortByRank(
              (s.lists[boardId] || [])
                .filter(l => l.id !== tempId)
                .concat({ ...tempList, id: realId, _optimistic: false })
            ),
          },
        }));
        return realId;
      } catch (err) {
        set(s => ({
          lists: { ...s.lists, [boardId]: (s.lists[boardId] || []).filter(l => l.id !== tempId) },
        }));
        toast('Impossible de créer la liste.');
        throw err;
      }
    },

    // ── BOARDS ────────────────────────────────────────────────────

    setBoard(boardDoc) {
      set(s => ({ boards: { ...s.boards, [boardDoc.id]: boardDoc } }));
    },

    // ── isPending helper ──────────────────────────────────────────

    isPending(id) {
      return get().pendingOps.has(id);
    },
  }))
);
