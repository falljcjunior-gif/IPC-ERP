/**
 * ═══════════════════════════════════════════════════════════════════
 *  MISSIONS VIEW STORE — Vue, Filtres, Tri, Groupement
 *
 *  Store léger séparé du store de données pour respecter le SRP.
 *  Synchronisé avec l'URL via urlState.js (replaceState, pas pushState).
 * ═══════════════════════════════════════════════════════════════════
 */
import { create } from 'zustand';
import { pushURLState, decodeURLToState } from '../engine/urlState';

const initial = decodeURLToState();

export const useMissionsViewStore = create((set, get) => ({

  // ── View mode ──────────────────────────────────────────────────
  view:    initial.view,    // 'board' | 'table' | 'timeline' | 'gallery'

  // ── Sort ───────────────────────────────────────────────────────
  sortBy:  initial.sortBy,  // field key
  sortDir: initial.sortDir, // 'asc' | 'desc'

  // ── Grouping ───────────────────────────────────────────────────
  groupBy: initial.groupBy, // null | field key

  // ── Filters ────────────────────────────────────────────────────
  filters: initial.filters, // [{ id, field, op, value }]

  // ── Filter panel open state ────────────────────────────────────
  filterOpen: false,

  // ── Search (local, no URL) ─────────────────────────────────────
  searchQuery: '',

  // ─────────────────────────────────────────────────────────────
  // ACTIONS
  // ─────────────────────────────────────────────────────────────

  setView(view) {
    set({ view });
    get()._syncURL();
  },

  setSort(sortBy, sortDir) {
    set({ sortBy, sortDir });
    get()._syncURL();
  },

  toggleSortDir() {
    const next = get().sortDir === 'asc' ? 'desc' : 'asc';
    set({ sortDir: next });
    get()._syncURL();
  },

  setGroupBy(groupBy) {
    set({ groupBy });
    get()._syncURL();
  },

  setSearchQuery(q) {
    set({ searchQuery: q });
  },

  // ── Filters ────────────────────────────────────────────────────

  addFilter({ field, op, value }) {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    set(s => ({ filters: [...s.filters, { id, field, op, value }] }));
    get()._syncURL();
  },

  updateFilter(id, patch) {
    set(s => ({
      filters: s.filters.map(f => f.id === id ? { ...f, ...patch } : f),
    }));
    get()._syncURL();
  },

  removeFilter(id) {
    set(s => ({ filters: s.filters.filter(f => f.id !== id) }));
    get()._syncURL();
  },

  clearFilters() {
    set({ filters: [], groupBy: null, sortBy: 'rank', sortDir: 'asc', searchQuery: '' });
    get()._syncURL();
  },

  toggleFilterPanel() {
    set(s => ({ filterOpen: !s.filterOpen }));
  },

  // ── URL sync (internal) ────────────────────────────────────────
  _syncURL() {
    const { view, sortBy, sortDir, groupBy, filters } = get();
    pushURLState({ view, sortBy, sortDir, groupBy, filters });
  },

  // ── Reset (on board change) ────────────────────────────────────
  resetView() {
    set({ view: 'board', sortBy: 'rank', sortDir: 'asc', groupBy: null, filters: [], searchQuery: '' });
  },
}));
