/**
 * ═══════════════════════════════════════════════════════════════════
 *  MISSION ENGINE — Master View Controller
 *
 *  Sits between MissionsHub (data source) and the 4 views.
 *  Pipeline:
 *    rawCards (Firestore)
 *    → normalizeCard() → SuperCards
 *    → applyFilters()  (view store rules + search query)
 *    → applySort()
 *    → applyGrouping() → groups[]
 *    → active view component
 * ═══════════════════════════════════════════════════════════════════
 */
import React, { useMemo, lazy, Suspense } from 'react';
import { useMissionsViewStore } from './store/useMissionsViewStore';
import {
  normalizeCard,
  applyFilters,
  applySort,
  applyGrouping,
} from './engine/transforms';

import ViewSelector from './components/ViewSelector';
import FilterPanel  from './components/FilterPanel';

// ── View components (lazy for code-splitting) ─────────────────────────────────
const MissionsKanbanView   = lazy(() => import('./views/MissionsKanbanView'));
const MissionsTableView    = lazy(() => import('./views/MissionsTableView'));
const MissionsTimelineView = lazy(() => import('./views/MissionsTimelineView'));
const MissionsGalleryView  = lazy(() => import('./views/MissionsGalleryView'));

const VIEW_MAP = {
  board:    MissionsKanbanView,
  table:    MissionsTableView,
  timeline: MissionsTimelineView,
  gallery:  MissionsGalleryView,
};

// ── Loading fallback ──────────────────────────────────────────────────────────

const ViewFallback = () => (
  <div style={{
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-muted)', fontSize: '0.85rem',
  }}>
    Chargement de la vue…
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

/**
 * @param {Object[]} rawCards        — raw Firestore card documents
 * @param {Object[]} listsForBoard   — list docs for the active board (for status derivation)
 * @param {Object}   userMap         — { uid → user doc } for assignee enrichment
 * @param {string}   boardId         — active board id (passed to Kanban view)
 * @param {string}   workspaceId     — active workspace id (passed to Kanban view)
 * @param {Function} onCardClick     — called when user clicks a card in Table/Gallery/Timeline
 */
export default function MissionEngine({
  rawCards = [],
  listsForBoard = [],
  userMap = {},
  boardId,
  workspaceId,
  onCardClick,
}) {
  const {
    view,
    filters,
    sortBy, sortDir,
    groupBy,
    searchQuery,
  } = useMissionsViewStore();

  // ── 1. Normalize ─────────────────────────────────────────────────────────────
  const superCards = useMemo(
    () => rawCards.map(c => normalizeCard(c, listsForBoard, userMap)),
    [rawCards, listsForBoard, userMap]
  );

  // ── 2. Search filter (local, no URL) ─────────────────────────────────────────
  const searched = useMemo(() => {
    if (!searchQuery.trim()) return superCards;
    const q = searchQuery.toLowerCase();
    return superCards.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.status.toLowerCase().includes(q) ||
      (c.relatedDepartment || '').toLowerCase().includes(q) ||
      c.assignees.some(a => a.name.toLowerCase().includes(q))
    );
  }, [superCards, searchQuery]);

  // ── 3. Apply URL filters ──────────────────────────────────────────────────────
  const filtered = useMemo(() => applyFilters(searched, filters), [searched, filters]);

  // ── 4. Sort ──────────────────────────────────────────────────────────────────
  const sorted = useMemo(() => applySort(filtered, sortBy, sortDir), [filtered, sortBy, sortDir]);

  // ── 5. Group ──────────────────────────────────────────────────────────────────
  // Kanban manages its own grouping (by list); others use our grouping engine.
  const groups = useMemo(
    () => view === 'board' ? [{ key: 'all', label: 'Toutes', cards: sorted }] : applyGrouping(sorted, groupBy),
    [view, sorted, groupBy]
  );

  // ── 6. Resolve active view component ─────────────────────────────────────────
  const ActiveView = VIEW_MAP[view] ?? MissionsKanbanView;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
    }}>
      {/* ── Top bar: view tabs + search + filter toggle + share ── */}
      <ViewSelector cardCount={sorted.length} />

      {/* ── Filter panel (conditionally visible) ── */}
      <FilterPanel />

      {/* ── Active view ── */}
      <Suspense fallback={<ViewFallback />}>
        <ActiveView
          /* common props */
          cards={sorted}
          groups={groups}
          onCardClick={onCardClick}
          /* kanban-specific */
          boardId={boardId}
          workspaceId={workspaceId}
        />
      </Suspense>
    </div>
  );
}
