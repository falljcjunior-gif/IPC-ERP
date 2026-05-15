import React, { useState, useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useMissionsViewStore } from '../store/useMissionsViewStore';
import { PRIORITY_META, statusColor } from '../engine/transforms';

// ── Column definitions ────────────────────────────────────────────────────────

const COLUMNS = [
  { key: 'title',             label: 'Titre',           width: 280, sortable: true },
  { key: 'status',            label: 'Statut',          width: 120, sortable: true },
  { key: 'priority',          label: 'Priorité',        width: 100, sortable: true },
  { key: 'assignees',         label: 'Assigné(s)',      width: 140, sortable: false },
  { key: 'endDate',           label: 'Échéance',        width: 110, sortable: true },
  { key: 'daysRemaining',     label: 'J. restants',     width: 90,  sortable: true },
  { key: 'completionPct',     label: '% Réalisé',       width: 100, sortable: true },
  { key: 'relatedDepartment', label: 'Département',     width: 140, sortable: true },
  { key: 'commentCount',      label: '',              width: 50,  sortable: true },
];

// ── Sub-renderers ─────────────────────────────────────────────────────────────

const StatusChip = ({ status }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
    fontSize: '0.72rem', fontWeight: 600,
    padding: '0.18rem 0.55rem', borderRadius: '1rem',
    background: statusColor(status) + '18',
    color: statusColor(status),
    whiteSpace: 'nowrap', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis',
  }}>
    <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor(status), flexShrink: 0 }} />
    {status}
  </span>
);

const PriorityChip = ({ priority }) => {
  const m = PRIORITY_META[priority] ?? PRIORITY_META.none;
  return (
    <span style={{
      fontSize: '0.72rem', fontWeight: 700,
      padding: '0.18rem 0.5rem', borderRadius: '0.35rem',
      background: m.bg, color: m.color,
    }}>
      {m.label}
    </span>
  );
};

const AssigneeStack = ({ assignees = [] }) => (
  <div style={{ display: 'flex', gap: '-0.25rem' }}>
    {assignees.slice(0, 3).map((a, i) => (
      <div
        key={a.uid}
        title={a.name}
        style={{
          width: 24, height: 24, borderRadius: '50%',
          background: a.color, color: 'white',
          fontSize: '0.6rem', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid var(--bg)',
          marginLeft: i > 0 ? -8 : 0,
          zIndex: 10 - i, position: 'relative',
        }}
      >
        {a.initials}
      </div>
    ))}
    {assignees.length > 3 && (
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        background: 'var(--border)', color: 'var(--text-muted)',
        fontSize: '0.6rem', fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '2px solid var(--bg)', marginLeft: -8,
      }}>
        +{assignees.length - 3}
      </div>
    )}
  </div>
);

const DaysChip = ({ daysRemaining, isOverdue }) => {
  if (daysRemaining === null) return <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>—</span>;
  const color = isOverdue ? '#EF4444' : daysRemaining <= 3 ? '#F59E0B' : 'var(--text-muted)';
  return (
    <span style={{ fontSize: '0.76rem', fontWeight: isOverdue ? 700 : 500, color }}>
      {isOverdue ? `−${Math.abs(daysRemaining)}j` : `${daysRemaining}j`}
    </span>
  );
};

const ProgressBar = ({ pct }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
    <div style={{
      flex: 1, height: 5, background: 'var(--border)',
      borderRadius: 3, overflow: 'hidden',
    }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: pct >= 100 ? '#10B981' : pct >= 50 ? '#3B82F6' : '#F59E0B',
        borderRadius: 3, transition: 'width 0.4s',
      }} />
    </div>
    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', minWidth: 28, textAlign: 'right' }}>
      {pct}%
    </span>
  </div>
);

// ── Cell renderer ─────────────────────────────────────────────────────────────

const CellContent = ({ colKey, card }) => {
  switch (colKey) {
    case 'title':             return <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text)' }}>{card.title}</span>;
    case 'status':            return <StatusChip status={card.status} />;
    case 'priority':          return <PriorityChip priority={card.priority} />;
    case 'assignees':         return <AssigneeStack assignees={card.assignees} />;
    case 'endDate':           return <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{card.endDate ? new Date(card.endDate).toLocaleDateString('fr-FR') : '—'}</span>;
    case 'daysRemaining':     return <DaysChip daysRemaining={card.daysRemaining} isOverdue={card.isOverdue} />;
    case 'completionPct':     return <ProgressBar pct={card.completionPct} />;
    case 'relatedDepartment': return <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{card.relatedDepartment || '—'}</span>;
    case 'commentCount':      return <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{card.commentCount || 0}</span>;
    default:                  return null;
  }
};

// ── Sort header ───────────────────────────────────────────────────────────────

const SortIcon = ({ col, sortBy, sortDir }) => {
  if (sortBy !== col) return <ChevronsUpDown size={11} style={{ opacity: 0.3 }} />;
  return sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />;
};

// ── Group header ──────────────────────────────────────────────────────────────

const GroupHeader = ({ label, count }) => (
  <tr>
    <td
      colSpan={COLUMNS.length}
      style={{
        padding: '0.5rem 1rem', background: 'var(--bg-subtle)',
        fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 41, zIndex: 2,
      }}
    >
      {label}
      <span style={{
        marginLeft: '0.5rem', fontSize: '0.65rem', fontWeight: 500,
        color: 'var(--text-muted)',
      }}>
        ({count})
      </span>
    </td>
  </tr>
);

// ── Main component ────────────────────────────────────────────────────────────

export default function MissionsTableView({ groups = [], onCardClick }) {
  const { sortBy, sortDir, setSort, toggleSortDir } = useMissionsViewStore();
  const [colWidths, setColWidths] = useState(() =>
    Object.fromEntries(COLUMNS.map(c => [c.key, c.width]))
  );

  const handleSort = col => {
    if (sortBy === col) toggleSortDir();
    else setSort(col, 'asc');
  };

  // Column resize
  const startResize = useCallback((e, colKey) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = colWidths[colKey];
    const onMove = ev => {
      const newW = Math.max(60, startW + ev.clientX - startX);
      setColWidths(prev => ({ ...prev, [colKey]: newW }));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [colWidths]);

  const allEmpty = groups.every(g => g.cards.length === 0);

  return (
    <div style={{ flex: 1, overflow: 'auto' }}>
      <table style={{
        width: '100%', borderCollapse: 'collapse',
        fontSize: '0.82rem', tableLayout: 'fixed',
      }}>
        {/* Col widths */}
        <colgroup>
          {COLUMNS.map(c => <col key={c.key} style={{ width: colWidths[c.key] }} />)}
        </colgroup>

        {/* Header */}
        <thead>
          <tr style={{ background: 'var(--bg-subtle)', position: 'sticky', top: 0, zIndex: 3 }}>
            {COLUMNS.map(col => (
              <th
                key={col.key}
                style={{
                  padding: '0.5rem 0.75rem',
                  textAlign: 'left', fontWeight: 700, fontSize: '0.72rem',
                  color: 'var(--text-muted)', textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  borderBottom: '1px solid var(--border)',
                  whiteSpace: 'nowrap', overflow: 'hidden',
                  cursor: col.sortable ? 'pointer' : 'default',
                  userSelect: 'none', position: 'relative',
                }}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {col.label}
                  {col.sortable && <SortIcon col={col.key} sortBy={sortBy} sortDir={sortDir} />}
                </span>
                {/* Resize handle */}
                <div
                  onMouseDown={e => startResize(e, col.key)}
                  style={{
                    position: 'absolute', right: 0, top: 0, bottom: 0,
                    width: 4, cursor: 'col-resize',
                    background: 'transparent',
                  }}
                  onClick={e => e.stopPropagation()}
                />
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {allEmpty ? (
            <tr>
              <td colSpan={COLUMNS.length} style={{
                padding: '3rem', textAlign: 'center',
                color: 'var(--text-muted)', fontSize: '0.85rem',
              }}>
                Aucune mission ne correspond aux filtres actifs.
              </td>
            </tr>
          ) : (
            groups.map(group => (
              <React.Fragment key={group.key}>
                {groups.length > 1 && (
                  <GroupHeader label={group.label} count={group.cards.length} />
                )}
                {group.cards.map((card, idx) => (
                  <tr
                    key={card.id}
                    onClick={() => onCardClick?.(card)}
                    style={{
                      background: idx % 2 === 0 ? 'var(--bg)' : 'var(--bg-subtle)',
                      cursor: 'pointer', transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--accent)10'}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'var(--bg)' : 'var(--bg-subtle)'}
                  >
                    {COLUMNS.map(col => (
                      <td
                        key={col.key}
                        style={{
                          padding: '0.5rem 0.75rem',
                          borderBottom: '1px solid var(--border)',
                          overflow: 'hidden', whiteSpace: 'nowrap',
                          textOverflow: col.key === 'title' ? 'ellipsis' : 'unset',
                          verticalAlign: 'middle',
                        }}
                      >
                        <CellContent colKey={col.key} card={card} />
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
