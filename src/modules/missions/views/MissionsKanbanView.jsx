/**
 * MissionsKanbanView — thin wrapper over the existing MissionsBoard
 * Passes the pre-filtered + pre-sorted cards down as a prop so the board
 * can render its lists without re-fetching from Firestore.
 */
import React from 'react';
import MissionsBoard from '../components/MissionsBoard';

export default function MissionsKanbanView({ cards, boardId, workspaceId }) {
  // MissionsBoard manages its own DnD, list creation, and card modal.
  // We simply mount it here — the engine already applied filters/sort.
  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <MissionsBoard
        boardId={boardId}
        workspaceId={workspaceId}
        filteredCardIds={cards.map(c => c.id)}
      />
    </div>
  );
}
