/**
 * MissionsBoard — Vue Kanban principale
 * Gère le DnD context, les colonnes (SortableList) et les cartes (SortableCard).
 * Optimistic UI : les cartes en mutation affichent un ring de chargement discret.
 */
import React, { useEffect, useCallback, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, MoreHorizontal, GripVertical, Clock,
  CheckSquare, Paperclip, MessageSquare, AlertCircle, Zap,
} from 'lucide-react';
import { useMissionsStore } from '../store/useMissionsStore';
import { useDragDrop } from '../hooks/useDragDrop';
import { useStore } from '../../../store';

// ─────────────────────────────────────────────────────────────────
// SORTABLE CARD
// ─────────────────────────────────────────────────────────────────

const SortableCard = React.memo(({ card, board, onOpenCard, isPending, isBeingDragged }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card', cardId: card.id, listId: card.listId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const labels = (board?.labels || []).filter(l => card.labelIds?.includes(l.id));
  const isOverdue = card.dueDate && !card.dueDateComplete && new Date(card.dueDate.seconds * 1000) < new Date();
  const progress = card.checklistProgress?.total > 0
    ? Math.round((card.checklistProgress.complete / card.checklistProgress.total) * 100)
    : null;

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <motion.div
        layoutId={isBeingDragged ? undefined : card.id}
        onClick={() => onOpenCard(card)}
        whileHover={{ y: -2, boxShadow: '0 8px 25px -5px rgba(0,0,0,0.12)' }}
        style={{
          background: 'white',
          borderRadius: '0.875rem',
          padding: '1rem',
          cursor: 'pointer',
          border: isPending ? '1.5px solid #8B5CF6' : '1px solid #E2E8F0',
          position: 'relative',
          userSelect: 'none',
          outline: isPending ? '0' : undefined,
          boxShadow: isPending ? '0 0 0 3px rgba(139,92,246,0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        {/* Grip handle */}
        <div
          {...listeners}
          style={{
            position: 'absolute', top: '0.75rem', right: '0.5rem',
            color: '#CBD5E1', cursor: 'grab', padding: '2px',
          }}
          onClick={e => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </div>

        {/* Labels */}
        {labels.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
            {labels.map(l => (
              <div
                key={l.id}
                style={{
                  height: '6px', width: '32px', borderRadius: '999px',
                  background: l.color, flexShrink: 0,
                }}
              />
            ))}
          </div>
        )}

        {/* Cover */}
        {card.cover?.type === 'color' && (
          <div style={{
            position: 'absolute', inset: 0, top: 0, borderRadius: '0.875rem 0.875rem 0 0',
            height: '5px', background: card.cover.value,
          }} />
        )}

        {/* Title */}
        <div style={{
          fontWeight: 700, fontSize: '0.9rem', color: '#1E293B',
          lineHeight: 1.4, marginRight: '1rem', marginBottom: '0.75rem',
        }}>
          {card.title}
        </div>

        {/* Checklist progress bar */}
        {progress !== null && (
          <div style={{ marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#64748B' }}>
                <CheckSquare size={10} style={{ display: 'inline', marginRight: '3px' }} />
                {card.checklistProgress.complete}/{card.checklistProgress.total}
              </span>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: progress === 100 ? '#10B981' : '#64748B' }}>
                {progress}%
              </span>
            </div>
            <div style={{ height: '3px', background: '#F1F5F9', borderRadius: '999px' }}>
              <div style={{
                height: '100%', borderRadius: '999px',
                width: `${progress}%`,
                background: progress === 100 ? '#10B981' : '#8B5CF6',
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        )}

        {/* Footer : assignees + badges + due date */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Assignees avatars */}
          <div style={{ display: 'flex', gap: '-4px' }}>
            {(card.members || []).slice(0, 3).map((uid, i) => (
              <div key={uid} style={{
                width: '24px', height: '24px', borderRadius: '50%',
                background: `hsl(${uid.charCodeAt(0) * 37 % 360}, 60%, 65%)`,
                border: '2px solid white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.6rem', fontWeight: 800, color: 'white',
                marginLeft: i > 0 ? '-6px' : '0',
              }}>
                {uid.slice(0, 2).toUpperCase()}
              </div>
            ))}
          </div>

          {/* Badges */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {card.commentCount > 0 && (
              <span style={{ fontSize: '0.65rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '2px' }}>
                <MessageSquare size={10} /> {card.commentCount}
              </span>
            )}
            {card.attachmentCount > 0 && (
              <span style={{ fontSize: '0.65rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '2px' }}>
                <Paperclip size={10} /> {card.attachmentCount}
              </span>
            )}

            {/* Due date badge */}
            {card.dueDate && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '3px',
                padding: '2px 6px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700,
                background: card.dueDateComplete ? '#D1FAE5' : isOverdue ? '#FEE2E2' : '#F1F5F9',
                color: card.dueDateComplete ? '#10B981' : isOverdue ? '#EF4444' : '#64748B',
              }}>
                <Clock size={9} />
                {new Date(card.dueDate.seconds * 1000).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
              </div>
            )}

            {/* Pending spinner */}
            {isPending && (
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                border: '2px solid #8B5CF6', borderTopColor: 'transparent',
                animation: 'spin 0.6s linear infinite',
              }} />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────
// SORTABLE LIST (Colonne Kanban)
// ─────────────────────────────────────────────────────────────────

const SortableList = React.memo(({
  list, cards, board, onOpenCard, onAddCard,
  isPendingList, pendingOps, isOver, activeCardId,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: list.id,
    data: { type: 'list', listId: list.id },
  });

  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');

  const handleQuickAdd = async () => {
    if (!newCardTitle.trim()) { setAddingCard(false); return; }
    await onAddCard(list.id, newCardTitle.trim());
    setNewCardTitle('');
    setAddingCard(false);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  const isWipWarning = list.wipLimit && cards.length >= list.wipLimit;

  return (
    <div ref={setNodeRef} style={{ ...style, flexShrink: 0 }}>
      <div style={{
        width: '280px',
        background: isOver ? 'rgba(139,92,246,0.06)' : '#F8FAFC',
        borderRadius: '1.25rem',
        padding: '0.875rem',
        border: isOver ? '2px solid rgba(139,92,246,0.3)' : '1px solid #E2E8F0',
        transition: 'border 0.15s, background 0.15s',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0',
      }}>
        {/* Header */}
        <div
          {...listeners} {...attributes}
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '0.875rem', cursor: 'grab', padding: '0 2px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {list.name}
            </h3>
            <span style={{
              fontSize: '0.7rem', fontWeight: 800, padding: '1px 7px',
              borderRadius: '999px', background: isWipWarning ? '#FEE2E2' : '#E2E8F0',
              color: isWipWarning ? '#EF4444' : '#64748B',
            }}>
              {cards.length}{list.wipLimit ? `/${list.wipLimit}` : ''}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '4px', cursor: 'default' }}>
            {isWipWarning && <AlertCircle size={14} color="#EF4444" />}
            <button
              onClick={e => { e.stopPropagation(); setAddingCard(true); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '2px' }}
            >
              <Plus size={16} />
            </button>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '2px' }}>
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>

        {/* Cards */}
        <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
            {cards.map(card => (
              <SortableCard
                key={card.id}
                card={card}
                board={board}
                onOpenCard={onOpenCard}
                isPending={pendingOps.has(card.id)}
                isBeingDragged={card.id === activeCardId}
              />
            ))}

            {/* Drop zone vide */}
            {cards.length === 0 && !isOver && (
              <div style={{
                padding: '1.5rem', textAlign: 'center',
                color: '#CBD5E1', fontSize: '0.8rem',
                border: '1.5px dashed #E2E8F0',
                borderRadius: '0.75rem',
              }}>
                Glissez une carte ici
              </div>
            )}

            {/* Zone de drop highlight */}
            {isOver && cards.length === 0 && (
              <div style={{
                height: '60px', borderRadius: '0.75rem',
                background: 'rgba(139,92,246,0.1)',
                border: '2px dashed rgba(139,92,246,0.4)',
              }} />
            )}
          </div>
        </SortableContext>

        {/* Quick Add Card */}
        <AnimatePresence>
          {addingCard ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginTop: '0.6rem' }}
            >
              <textarea
                autoFocus
                value={newCardTitle}
                onChange={e => setNewCardTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleQuickAdd(); }
                  if (e.key === 'Escape') { setAddingCard(false); setNewCardTitle(''); }
                }}
                placeholder="Titre de la carte..."
                rows={2}
                style={{
                  width: '100%', padding: '0.6rem 0.75rem',
                  borderRadius: '0.75rem', border: '2px solid #8B5CF6',
                  fontSize: '0.875rem', resize: 'none', outline: 'none',
                  fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                <button
                  onClick={handleQuickAdd}
                  style={{
                    padding: '0.4rem 1rem', borderRadius: '0.5rem',
                    background: '#8B5CF6', color: 'white', border: 'none',
                    fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Ajouter
                </button>
                <button
                  onClick={() => { setAddingCard(false); setNewCardTitle(''); }}
                  style={{
                    padding: '0.4rem 0.75rem', borderRadius: '0.5rem',
                    background: 'transparent', border: 'none',
                    color: '#64748B', cursor: 'pointer', fontSize: '0.8rem',
                  }}
                >
                  ✕
                </button>
              </div>
            </motion.div>
          ) : (
            <button
              onClick={() => setAddingCard(true)}
              style={{
                marginTop: '0.6rem', width: '100%', padding: '0.6rem',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600,
                borderRadius: '0.75rem', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Plus size={14} /> Ajouter une carte
            </button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────
// MISSIONS BOARD — Composant racine
// ─────────────────────────────────────────────────────────────────

const MissionsBoard = ({ boardId, onOpenCard }) => {
  const { user }   = useStore();
  const uid        = user?.uid || user?.id || 'anonymous';

  const board        = useMissionsStore(s => s.boards[boardId]);
  const lists        = useMissionsStore(s => s.lists[boardId] || []);
  const pendingOps   = useMissionsStore(s => s.pendingOps);
  const subscribeBoard = useMissionsStore(s => s.subscribeBoard);
  const setBoard       = useMissionsStore(s => s.setBoard);
  const createCard     = useMissionsStore(s => s.createCard);
  const createList     = useMissionsStore(s => s.createList);
  const getCardsForList= useMissionsStore(s => s.getCardsForList);

  const [addingList, setAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');

  const {
    sensors, collisionDetection,
    activeCardId, activeListId, overListId,
    handleDragStart, handleDragOver, handleDragEnd, handleDragCancel,
  } = useDragDrop(boardId, uid);

  // Abonne aux données temps réel du board
  useEffect(() => {
    if (!boardId) return;
    subscribeBoard(boardId);
  }, [boardId, subscribeBoard]);

  const handleAddCard = useCallback(async (listId, title) => {
    const workspace = board?.workspaceId;
    if (!workspace) return;
    await createCard(listId, boardId, workspace, title, uid);
  }, [boardId, board, uid, createCard]);

  const handleAddList = async () => {
    if (!newListName.trim()) { setAddingList(false); return; }
    await createList(boardId, board?.workspaceId, newListName.trim(), uid);
    setNewListName('');
    setAddingList(false);
  };

  // Carte active pour le DragOverlay
  const allCards = useMissionsStore(s => s.cards[boardId] || []);
  const activeCard = activeCardId ? allCards.find(c => c.id === activeCardId) : null;

  if (!boardId) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#94A3B8' }}>
        <div style={{ textAlign: 'center' }}>
          <Zap size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
          <p>Sélectionnez un tableau pour commencer</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* CSS animation pour le spinner pending */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {/* Board scroll horizontal */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          overflowX: 'auto',
          padding: '1.5rem',
          alignItems: 'flex-start',
          minHeight: '600px',
          // Curseur grab global quand on drag une liste
          cursor: activeListId ? 'grabbing' : 'default',
        }}>
          <SortableContext items={lists.map(l => l.id)} strategy={horizontalListSortingStrategy}>
            {lists.map(list => {
              const cards = getCardsForList(boardId, list.id);
              return (
                <SortableList
                  key={list.id}
                  list={list}
                  cards={cards}
                  board={board}
                  onOpenCard={onOpenCard}
                  onAddCard={handleAddCard}
                  isPendingList={pendingOps.has(list.id)}
                  pendingOps={pendingOps}
                  isOver={overListId === list.id}
                  activeCardId={activeCardId}
                />
              );
            })}
          </SortableContext>

          {/* Ajouter une liste */}
          <div style={{ flexShrink: 0 }}>
            <AnimatePresence mode="wait">
              {addingList ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  style={{
                    width: '280px', background: '#F8FAFC',
                    borderRadius: '1.25rem', padding: '0.875rem',
                    border: '2px solid #8B5CF6',
                  }}
                >
                  <input
                    autoFocus
                    value={newListName}
                    onChange={e => setNewListName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddList();
                      if (e.key === 'Escape') { setAddingList(false); setNewListName(''); }
                    }}
                    placeholder="Nom de la liste..."
                    style={{
                      width: '100%', padding: '0.6rem 0.75rem',
                      borderRadius: '0.75rem', border: '1px solid #E2E8F0',
                      fontSize: '0.875rem', outline: 'none',
                      fontFamily: 'inherit', boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button onClick={handleAddList} style={{ padding: '0.4rem 1rem', borderRadius: '0.5rem', background: '#8B5CF6', color: 'white', border: 'none', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
                      Ajouter
                    </button>
                    <button onClick={() => { setAddingList(false); setNewListName(''); }} style={{ padding: '0.4rem', background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '0.8rem' }}>
                      ✕
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  key="btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setAddingList(true)}
                  style={{
                    width: '280px', padding: '1rem',
                    background: 'rgba(255,255,255,0.5)',
                    border: '1.5px dashed #CBD5E1',
                    borderRadius: '1.25rem', cursor: 'pointer',
                    color: '#64748B', fontWeight: 700, fontSize: '0.875rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    backdropFilter: 'blur(4px)',
                    transition: 'all 0.2s',
                  }}
                  whileHover={{ background: 'rgba(139,92,246,0.06)', borderColor: '#8B5CF6', color: '#8B5CF6' }}
                >
                  <Plus size={18} /> Ajouter une liste
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* DragOverlay — carte fantôme pendant le drag */}
        <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {activeCard ? (
            <div style={{
              background: 'white', borderRadius: '0.875rem', padding: '1rem',
              border: '2px solid #8B5CF6',
              boxShadow: '0 20px 40px -10px rgba(139,92,246,0.4)',
              width: '280px', fontWeight: 700, fontSize: '0.9rem', color: '#1E293B',
              cursor: 'grabbing', transform: 'rotate(2deg)',
            }}>
              {activeCard.title}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
};

export default React.memo(MissionsBoard);
