import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

const PAGE_SIZES = [10, 25, 50];

export default function DataTable({
  columns,        // [{ key, label, render?, sortable?, width? }]
  data,           // Array of row objects
  keyField = 'id',
  pageSize: initialPageSize = 10,
  searchable = true,
  searchFields,   // which fields to search; defaults to all string columns
  emptyMessage = 'Aucune donnée',
  emptySubMessage,
  loading = false,
  onRowClick,
  rowActions,     // (row) => ReactNode — rendered in last column
  stickyHeader = false,
  style = {},
  className = '',
}) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const handleSort = useCallback((key) => {
    if (!key) return;
    setSortKey(prev => {
      if (prev === key) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return key; }
      setSortDir('asc');
      return key;
    });
    setPage(1);
  }, []);

  const searchKeys = useMemo(() => {
    if (searchFields) return searchFields;
    return columns.map(c => c.key);
  }, [columns, searchFields]);

  const filtered = useMemo(() => {
    let rows = data || [];
    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter(row =>
        searchKeys.some(k => String(row[k] ?? '').toLowerCase().includes(q))
      );
    }
    return rows;
  }, [data, query, searchKeys]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const va = a[sortKey] ?? '';
      const vb = b[sortKey] ?? '';
      const cmp = typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb), 'fr', { sensitivity: 'base' });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const SortIcon = ({ colKey }) => {
    if (sortKey !== colKey) return <ChevronsUpDown size={12} style={{ opacity: 0.3 }} />;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const cols = rowActions
    ? [...columns, { key: '__actions', label: '', sortable: false, width: '1%' }]
    : columns;

  return (
    <div className={`erp-table-wrap${className ? ` ${className}` : ''}`} style={style}>
      {/* Toolbar */}
      {searchable && (
        <div className="erp-table-toolbar">
          <div className="erp-table-search">
            <Search size={14} color="var(--text-muted, #64748B)" style={{ flexShrink: 0 }} />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1); }}
              placeholder="Filtrer..."
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <span className="erp-table-count">
            {filtered.length !== (data?.length || 0)
              ? `${filtered.length} / ${data?.length || 0}`
              : `${data?.length || 0}`} entrées
          </span>
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="erp-table">
          <thead style={stickyHeader ? { position: 'sticky', top: 0, zIndex: 2 } : {}}>
            <tr>
              {cols.map(col => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={sortKey === col.key ? 'sorted' : ''}
                  onClick={() => col.sortable !== false && col.key !== '__actions' && handleSort(col.key)}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    {col.label}
                    {col.sortable !== false && col.key !== '__actions' && <SortIcon colKey={col.key} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: Math.min(pageSize, 5) }).map((_, i) => (
                <tr key={i}>
                  {cols.map(col => (
                    <td key={col.key}>
                      <div style={{
                        height: 14, borderRadius: 4,
                        background: 'rgba(255,255,255,0.04)',
                        width: col.key === '__actions' ? 60 : `${60 + (i * 13 + col.key.length * 7) % 40}%`,
                        animation: 'erp-shimmer 1.5s ease-in-out infinite',
                      }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={cols.length} className="erp-table-empty">
                  <div className="erp-table-empty-icon">
                    <Inbox size={22} color="var(--text-muted, #64748B)" />
                  </div>
                  <div style={{ fontWeight: 700, marginBottom: '0.25rem', color: 'var(--text-muted)' }}>
                    {emptyMessage}
                  </div>
                  {emptySubMessage && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', opacity: 0.6 }}>
                      {emptySubMessage}
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              <AnimatePresence initial={false}>
                {paginated.map((row, i) => (
                  <motion.tr
                    key={row[keyField] ?? i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, delay: i * 0.02 }}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    style={onRowClick ? { cursor: 'pointer' } : {}}
                  >
                    {cols.map(col => (
                      <td key={col.key} style={col.key === '__actions' ? { textAlign: 'right', whiteSpace: 'nowrap' } : {}}>
                        {col.key === '__actions'
                          ? rowActions?.(row)
                          : col.render
                            ? col.render(row[col.key], row)
                            : String(row[col.key] ?? '—')}
                      </td>
                    ))}
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {sorted.length > PAGE_SIZES[0] && (
        <div className="erp-table-pagination">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748B)' }}>Lignes par page:</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '0.375rem', padding: '2px 6px', fontSize: '0.8rem',
                color: 'var(--text, #E2E8F0)', cursor: 'pointer'
              }}
            >
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748B)', marginRight: '0.5rem' }}>
              {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, sorted.length)} sur {sorted.length}
            </span>
            <button className="erp-table-page-btn" onClick={() => setPage(p => p - 1)} disabled={safePage <= 1}>
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              let p;
              if (totalPages <= 5) p = i + 1;
              else if (safePage <= 3) p = i + 1;
              else if (safePage >= totalPages - 2) p = totalPages - 4 + i;
              else p = safePage - 2 + i;
              return (
                <button
                  key={p}
                  className={`erp-table-page-btn${safePage === p ? ' active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              );
            })}
            <button className="erp-table-page-btn" onClick={() => setPage(p => p + 1)} disabled={safePage >= totalPages}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes erp-shimmer {
          0%   { opacity: 0.4; }
          50%  { opacity: 0.7; }
          100% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
