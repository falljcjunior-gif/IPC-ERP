/**
 * useDragDrop — Pont entre @dnd-kit et useMissionsStore
 *
 * Ce hook gère tout l'état de drag :
 * - activeCard : la carte en cours de drag (pour le DragOverlay)
 * - activeList : la liste en cours de drag
 * - overListId : liste survolée pendant le drag (highlight visuel)
 *
 * STRATÉGIE DE CALCUL DE POSITION :
 * Quand une carte est droppée dans une liste, on détermine
 * "entre quelles cartes" elle est insérée en comparant le
 * centre Y du pointeur avec les centres Y des cartes de la colonne.
 */
import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  getFirstCollision,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable';
import { useMissionsStore } from '../store/useMissionsStore';

export function useDragDrop(boardId, uid) {
  const moveCard = useMissionsStore(s => s.moveCard);
  const moveList = useMissionsStore(s => s.moveList);
  const getCardsForList = useMissionsStore(s => s.getCardsForList);
  const getListsForBoard = useMissionsStore(s => s.getListsForBoard);

  const [activeCardId, setActiveCardId] = useState(null);
  const [activeListId, setActiveListId] = useState(null);
  const [overListId, setOverListId]     = useState(null);

  // ── Sensors ────────────────────────────────────────────────────
  // PointerSensor avec activation distance = 5px (évite les clics accidentels)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ── Collision Detection hybride ────────────────────────────────
  // Priorité : pointerWithin (précis sur les cartes) → closestCorners (fallback colonne)
  const collisionDetection = useCallback((args) => {
    // Essaie d'abord de détecter une carte cible précise
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) return pointerCollisions;
    return closestCorners(args);
  }, []);

  // ── Handlers ───────────────────────────────────────────────────

  const handleDragStart = useCallback(({ active }) => {
    const { type, cardId, listId } = active.data.current || {};
    if (type === 'card') {
      setActiveCardId(cardId || active.id);
      setActiveListId(null);
    } else if (type === 'list') {
      setActiveListId(listId || active.id);
      setActiveCardId(null);
    }
  }, []);

  const handleDragOver = useCallback(({ active, over }) => {
    if (!over) { setOverListId(null); return; }

    const overData = over.data.current || {};
    // Si on survole une carte → highlight de sa liste parente
    if (overData.type === 'card') {
      setOverListId(overData.listId);
    } else if (overData.type === 'list' || overData.type === 'list-container') {
      setOverListId(over.id);
    }
  }, []);

  const handleDragEnd = useCallback(({ active, over }) => {
    setActiveCardId(null);
    setActiveListId(null);
    setOverListId(null);

    if (!over || active.id === over.id) return;

    const activeData = active.data.current || {};
    const overData   = over.data.current || {};

    // ── Déplacement de CARTE ──────────────────────────────────
    if (activeData.type === 'card') {
      const cardId     = active.id;
      const targetListId = overData.type === 'card' ? overData.listId
                         : overData.type === 'list-container' ? over.id
                         : overData.listId || over.id;

      // Cartes de la liste de destination (sans la carte active)
      const destCards = getCardsForList(boardId, targetListId)
        .filter(c => c.id !== cardId);

      let prevCardId = null;
      let nextCardId = null;

      if (overData.type === 'card' && overData.cardId !== cardId) {
        // Drop sur une carte → on insère avant ou après selon la position Y
        const overIdx = destCards.findIndex(c => c.id === over.id);
        prevCardId = overIdx > 0 ? destCards[overIdx - 1].id : null;
        nextCardId = destCards[overIdx]?.id || null;
      } else {
        // Drop sur une liste vide ou la fin de liste
        prevCardId = destCards.length > 0 ? destCards[destCards.length - 1].id : null;
        nextCardId = null;
      }

      moveCard(cardId, targetListId, prevCardId, nextCardId, uid);
    }

    // ── Déplacement de LISTE ─────────────────────────────────
    if (activeData.type === 'list') {
      const listId   = active.id;
      const lists    = getListsForBoard(boardId).filter(l => l.id !== listId);
      const overIdx  = lists.findIndex(l => l.id === over.id);
      const prevListId = overIdx > 0 ? lists[overIdx - 1].id : null;
      const nextListId = lists[overIdx]?.id || null;

      moveList(listId, prevListId, nextListId, uid);
    }
  }, [boardId, uid, moveCard, moveList, getCardsForList, getListsForBoard]);

  const handleDragCancel = useCallback(() => {
    setActiveCardId(null);
    setActiveListId(null);
    setOverListId(null);
  }, []);

  return {
    sensors,
    collisionDetection,
    activeCardId,
    activeListId,
    overListId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
}
