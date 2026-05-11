/**
 * URL ↔ View State synchronisation
 * Encodes/decodes view, filters, groupBy, sortBy into URLSearchParams
 * so that any combination can be shared via a link.
 *
 * URL shape: ?view=board&sort=endDate&dir=asc&group=status&f=title:contains:sprint
 */

// ── Encode ──────────────────────────────────────────────────────────────────

export function encodeStateToURL({ view, sortBy, sortDir, groupBy, filters }) {
  const p = new URLSearchParams();
  if (view    && view !== 'board') p.set('view', view);
  if (sortBy  && sortBy !== 'rank') p.set('sort', sortBy);
  if (sortDir && sortDir !== 'asc') p.set('dir', sortDir);
  if (groupBy) p.set('group', groupBy);
  filters.forEach(f => {
    p.append('f', `${f.field}:${f.op}:${encodeURIComponent(String(f.value ?? ''))}`);
  });
  return p;
}

export function pushURLState(state) {
  const p = encodeStateToURL(state);
  const qs = p.toString();
  const base = window.location.pathname;
  const next = qs ? `${base}?${qs}` : base;
  window.history.replaceState({}, '', next);
}

// ── Decode ──────────────────────────────────────────────────────────────────

export function decodeURLToState() {
  const p = new URLSearchParams(window.location.search);
  const filters = [];
  for (const raw of p.getAll('f')) {
    const parts = raw.split(':');
    if (parts.length >= 3) {
      const [field, op, ...rest] = parts;
      filters.push({ field, op, value: decodeURIComponent(rest.join(':')) });
    }
  }
  return {
    view:    p.get('view')  || 'board',
    sortBy:  p.get('sort')  || 'rank',
    sortDir: p.get('dir')   || 'asc',
    groupBy: p.get('group') || null,
    filters,
  };
}

// ── Shareable URL helper ──────────────────────────────────────────────────────

export function getShareableURL(state) {
  const p = encodeStateToURL(state);
  const qs = p.toString();
  return `${window.location.origin}${window.location.pathname}${qs ? '?' + qs : ''}`;
}
