/**
 * ═══════════════════════════════════════════════════════════════════
 *  MISSION ENGINE — Data Transform Layer
 *
 *  Normalise les cartes brutes Firestore en "SuperCard" unifiée,
 *  puis projette vers le format attendu par chaque vue.
 *
 *  SuperCard = {
 *    id, title, description,
 *    status,            — nom de la liste parente (dérivé)
 *    priority,          — 'none'|'low'|'medium'|'high'|'urgent'
 *    startDate,         — ISO string | null
 *    endDate,           — alias dueDate
 *    coverImageURL,     — url string | null
 *    colorTag,          — hex string | null
 *    assignees[],       — [{ uid, name, initials, color }]
 *    relatedDepartment, — string | null
 *    listId, boardId, workspaceId, rank,
 *    labelIds[],
 *    checklistProgress: { total, complete }
 *    // Computed
 *    daysRemaining,     — number (négatif = en retard)
 *    completionPct,     — 0-100
 *    isOverdue,         — boolean
 *  }
 * ═══════════════════════════════════════════════════════════════════
 */

// ── Palette for assignee avatars (deterministic by uid) ──────────────────────
const AVATAR_COLORS = [
  '#6366F1','#8B5CF6','#EC4899','#EF4444','#F59E0B',
  '#10B981','#06B6D4','#3B82F6','#84CC16','#F97316',
];
const avatarColor = (uid = '') =>
  AVATAR_COLORS[(uid.charCodeAt(0) + uid.charCodeAt(uid.length - 1)) % AVATAR_COLORS.length];

const initials = (name = '') => {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
};

// ── Priority ordering ────────────────────────────────────────────────────────
export const PRIORITY_ORDER = { urgent: 4, high: 3, medium: 2, low: 1, none: 0 };
export const PRIORITY_META = {
  urgent: { label: 'Urgent',   color: '#EF4444', bg: '#FEF2F2' },
  high:   { label: 'Haute',    color: '#F97316', bg: '#FFF7ED' },
  medium: { label: 'Moyenne',  color: '#F59E0B', bg: '#FFFBEB' },
  low:    { label: 'Basse',    color: '#3B82F6', bg: '#EFF6FF' },
  none:   { label: '—',        color: '#9CA3AF', bg: '#F9FAFB' },
};

// ── Status / list names → colour ─────────────────────────────────────────────
const STATUS_COLOR_MAP = {
  'À faire':      '#9CA3AF',
  'En cours':     '#3B82F6',
  'En révision':  '#F59E0B',
  'Terminé':      '#10B981',
  'Bloqué':       '#EF4444',
  default:        '#6366F1',
};
export const statusColor = (status = '') =>
  STATUS_COLOR_MAP[status] || STATUS_COLOR_MAP.default;

// ─────────────────────────────────────────────────────────────────────────────
// 1. NORMALIZE — raw Firestore card → SuperCard
// ─────────────────────────────────────────────────────────────────────────────

export function normalizeCard(rawCard, listsForBoard = [], userMap = {}) {
  const list = listsForBoard.find(l => l.id === rawCard.listId);
  const status = list?.name || rawCard.status || 'Sans statut';

  const endDate = rawCard.dueDate || rawCard.endDate || null;
  const startDate = rawCard.startDate || null;

  // Computed temporal
  let daysRemaining = null;
  let isOverdue = false;
  if (endDate) {
    const diff = (new Date(endDate) - new Date()) / 86_400_000;
    daysRemaining = Math.round(diff);
    isOverdue = diff < 0;
  }

  // Assignees enrichis
  const memberUids = rawCard.members || rawCard.assignees || [];
  const assignees = memberUids.map(uid => {
    const u = userMap[uid];
    const name = u?.nom || u?.displayName || uid.slice(0, 8);
    return { uid, name, initials: initials(name), color: avatarColor(uid) };
  });

  // Cover image
  const coverImageURL = rawCard.cover?.url || rawCard.coverImageURL || null;

  // Checklist completion
  const { total = 0, complete = 0 } = rawCard.checklistProgress || {};
  const completionPct = total > 0 ? Math.round((complete / total) * 100) : 0;

  return {
    // identité
    id:                rawCard.id,
    title:             rawCard.title || 'Sans titre',
    description:       rawCard.description || '',
    // dimensions Kanban
    listId:            rawCard.listId,
    boardId:           rawCard.boardId,
    workspaceId:       rawCard.workspaceId,
    rank:              rawCard.rank,
    labelIds:          rawCard.labelIds || [],
    // dimensions état
    status,
    priority:          rawCard.priority || 'none',
    // dimensions temporelles
    startDate,
    endDate,
    dueDate:           endDate,   // alias
    dueDateComplete:   rawCard.dueDateComplete || false,
    // dimensions visuelles
    coverImageURL,
    colorTag:          rawCard.colorTag || null,
    // dimensions relationnelles
    assignees,
    relatedDepartment: rawCard.relatedDepartment || null,
    // computed
    daysRemaining,
    completionPct,
    isOverdue,
    // progress
    checklistProgress: rawCard.checklistProgress || { total: 0, complete: 0 },
    commentCount:      rawCard.commentCount || 0,
    attachmentCount:   rawCard.attachmentCount || 0,
    // meta
    createdAt:         rawCard.createdAt,
    updatedAt:         rawCard.updatedAt,
    createdBy:         rawCard.createdBy,
    customFieldValues: rawCard.customFieldValues || {},
    linkedEntities:    rawCard.linkedEntities || [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. FILTER ENGINE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Filter rule: { field, op, value }
 * ops: 'eq','neq','contains','gt','lt','gte','lte','is_empty','is_not_empty'
 */
export function applyFilters(cards, rules = []) {
  if (!rules.length) return cards;
  return cards.filter(card =>
    rules.every(rule => {
      const val = card[rule.field];
      switch (rule.op) {
        case 'eq':           return String(val) === String(rule.value);
        case 'neq':          return String(val) !== String(rule.value);
        case 'contains':     return String(val || '').toLowerCase().includes(String(rule.value).toLowerCase());
        case 'gt':           return Number(val) > Number(rule.value);
        case 'lt':           return Number(val) < Number(rule.value);
        case 'gte':          return Number(val) >= Number(rule.value);
        case 'lte':          return Number(val) <= Number(rule.value);
        case 'is_empty':     return !val || (Array.isArray(val) && val.length === 0);
        case 'is_not_empty': return !!val && (!Array.isArray(val) || val.length > 0);
        default:             return true;
      }
    })
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. SORT ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export function applySort(cards, sortBy = 'rank', sortDir = 'asc') {
  return [...cards].sort((a, b) => {
    let av = a[sortBy], bv = b[sortBy];

    // Priority — use numeric order
    if (sortBy === 'priority') {
      av = PRIORITY_ORDER[av] ?? 0;
      bv = PRIORITY_ORDER[bv] ?? 0;
    }
    // Dates
    if (sortBy === 'endDate' || sortBy === 'startDate') {
      av = av ? new Date(av).getTime() : Infinity;
      bv = bv ? new Date(bv).getTime() : Infinity;
    }
    // Strings
    if (typeof av === 'string' && typeof bv === 'string') {
      av = av.toLowerCase();
      bv = bv.toLowerCase();
    }

    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ?  1 : -1;
    return 0;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. GROUP ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export function applyGrouping(cards, groupBy = null) {
  if (!groupBy) return [{ key: 'all', label: 'Toutes', cards }];

  const groupMap = new Map();

  cards.forEach(card => {
    let groupKey;
    switch (groupBy) {
      case 'status':
        groupKey = card.status;
        break;
      case 'priority':
        groupKey = card.priority;
        break;
      case 'relatedDepartment':
        groupKey = card.relatedDepartment || 'Sans département';
        break;
      case 'assignee': {
        const names = card.assignees.map(a => a.name);
        if (!names.length) { groupKey = 'Non assigné'; break; }
        // Card appears in each assignee's group
        names.forEach(name => {
          if (!groupMap.has(name)) groupMap.set(name, { key: name, label: name, cards: [] });
          groupMap.get(name).cards.push(card);
        });
        return; // handled inline
      }
      case 'dueWeek': {
        if (!card.endDate) { groupKey = 'Sans échéance'; break; }
        const d = new Date(card.endDate);
        const monday = new Date(d);
        monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
        groupKey = monday.toISOString().split('T')[0];
        break;
      }
      default:
        groupKey = String(card[groupBy] ?? 'Autre');
    }
    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, { key: groupKey, label: groupKey, cards: [] });
    }
    groupMap.get(groupKey).cards.push(card);
  });

  // Sort groups for priority
  const groups = Array.from(groupMap.values());
  if (groupBy === 'priority') {
    groups.sort((a, b) => (PRIORITY_ORDER[b.key] ?? 0) - (PRIORITY_ORDER[a.key] ?? 0));
  }
  return groups;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. TIMELINE PROJECTION — cards with valid date range
// ─────────────────────────────────────────────────────────────────────────────

export function projectTimeline(cards) {
  const dated = cards.filter(c => c.startDate || c.endDate).map(c => {
    const start = c.startDate ? new Date(c.startDate) : new Date();
    const end   = c.endDate   ? new Date(c.endDate)   : new Date(start.getTime() + 86_400_000 * 3);
    return { ...c, _start: start, _end: end };
  });
  dated.sort((a, b) => a._start - b._start);
  return dated;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. FILTERABLE FIELDS MANIFEST
// ─────────────────────────────────────────────────────────────────────────────

export const FILTER_FIELDS = [
  { key: 'title',             label: 'Titre',           type: 'text' },
  { key: 'status',            label: 'Statut',          type: 'text' },
  { key: 'priority',          label: 'Priorité',        type: 'select', options: Object.keys(PRIORITY_META) },
  { key: 'relatedDepartment', label: 'Département',     type: 'text' },
  { key: 'daysRemaining',     label: 'Jours restants',  type: 'number' },
  { key: 'completionPct',     label: '% Complétion',    type: 'number' },
  { key: 'isOverdue',         label: 'En retard',       type: 'boolean' },
  { key: 'endDate',           label: 'Échéance',        type: 'date' },
  { key: 'commentCount',      label: 'Commentaires',    type: 'number' },
];

export const OP_OPTIONS = {
  text:    ['contains', 'eq', 'neq', 'is_empty', 'is_not_empty'],
  number:  ['eq', 'gt', 'lt', 'gte', 'lte'],
  select:  ['eq', 'neq'],
  boolean: ['eq'],
  date:    ['eq', 'gt', 'lt'],
};

export const OP_LABELS = {
  eq:           'est',
  neq:          "n'est pas",
  contains:     'contient',
  gt:           'supérieur à',
  lt:           'inférieur à',
  gte:          'supérieur ou égal',
  lte:          'inférieur ou égal',
  is_empty:     'est vide',
  is_not_empty: "n'est pas vide",
};

export const GROUP_OPTIONS = [
  { key: 'status',            label: 'Statut' },
  { key: 'priority',          label: 'Priorité' },
  { key: 'relatedDepartment', label: 'Département' },
  { key: 'assignee',          label: 'Assigné' },
  { key: 'dueWeek',           label: "Semaine d'échéance" },
];
