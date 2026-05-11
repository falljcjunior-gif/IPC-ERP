import React, { useState } from 'react';
import { Plus, X, ChevronDown } from 'lucide-react';
import { useMissionsViewStore } from '../store/useMissionsViewStore';
import {
  FILTER_FIELDS, OP_OPTIONS, OP_LABELS,
  PRIORITY_META, GROUP_OPTIONS,
} from '../engine/transforms';

// ── Helpers ──────────────────────────────────────────────────────────────────

const Select = ({ value, onChange, options, style = {} }) => (
  <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', ...style }}>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        appearance: 'none', border: '1px solid var(--border)',
        borderRadius: '0.45rem', background: 'var(--bg)',
        color: 'var(--text)', fontSize: '0.78rem', fontWeight: 500,
        padding: '0.28rem 1.6rem 0.28rem 0.55rem', cursor: 'pointer',
        outline: 'none',
      }}
    >
      {options.map(o => (
        <option key={o.value ?? o} value={o.value ?? o}>
          {o.label ?? o}
        </option>
      ))}
    </select>
    <ChevronDown size={11} style={{
      position: 'absolute', right: '0.45rem',
      pointerEvents: 'none', color: 'var(--text-muted)',
    }} />
  </div>
);

// Build value input based on field type
const ValueInput = ({ field, value, onChange }) => {
  const meta = FILTER_FIELDS.find(f => f.key === field);
  if (!meta) return null;

  if (meta.type === 'select') {
    return (
      <Select
        value={value ?? ''}
        onChange={onChange}
        options={meta.options.map(k => ({
          value: k,
          label: PRIORITY_META[k]?.label ?? k,
        }))}
      />
    );
  }
  if (meta.type === 'boolean') {
    return (
      <Select
        value={value ?? 'true'}
        onChange={onChange}
        options={[{ value: 'true', label: 'Oui' }, { value: 'false', label: 'Non' }]}
      />
    );
  }
  return (
    <input
      type={meta.type === 'number' ? 'number' : meta.type === 'date' ? 'date' : 'text'}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder="Valeur…"
      style={{
        border: '1px solid var(--border)', borderRadius: '0.45rem',
        background: 'var(--bg)', color: 'var(--text)',
        fontSize: '0.78rem', padding: '0.28rem 0.55rem',
        width: meta.type === 'date' ? 130 : 120, outline: 'none',
      }}
    />
  );
};

// ── Filter Row ────────────────────────────────────────────────────────────────

const FilterRow = ({ filter }) => {
  const { updateFilter, removeFilter } = useMissionsViewStore();
  const meta = FILTER_FIELDS.find(f => f.key === filter.field);
  const opList = OP_OPTIONS[meta?.type ?? 'text'];

  const handleField = newField => {
    const newMeta = FILTER_FIELDS.find(f => f.key === newField);
    const newOps  = OP_OPTIONS[newMeta?.type ?? 'text'];
    updateFilter(filter.id, {
      field: newField,
      op:    newOps[0],
      value: '',
    });
  };

  const handleOp = op => updateFilter(filter.id, { op });
  const handleValue = val => updateFilter(filter.id, { value: val });

  const noValue = ['is_empty', 'is_not_empty'].includes(filter.op);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.4rem',
      padding: '0.35rem 0',
      borderBottom: '1px solid var(--border)',
    }}>
      {/* Field */}
      <Select
        value={filter.field}
        onChange={handleField}
        options={FILTER_FIELDS.map(f => ({ value: f.key, label: f.label }))}
        style={{ minWidth: 130 }}
      />

      {/* Operator */}
      <Select
        value={filter.op}
        onChange={handleOp}
        options={opList.map(op => ({ value: op, label: OP_LABELS[op] ?? op }))}
        style={{ minWidth: 130 }}
      />

      {/* Value */}
      {!noValue && (
        <ValueInput field={filter.field} value={filter.value} onChange={handleValue} />
      )}

      {/* Remove */}
      <button
        onClick={() => removeFilter(filter.id)}
        style={{
          marginLeft: 'auto', background: 'none', border: 'none',
          cursor: 'pointer', color: 'var(--text-muted)', padding: '0.2rem',
          display: 'flex', alignItems: 'center', borderRadius: '0.35rem',
        }}
        title="Supprimer ce filtre"
      >
        <X size={13} />
      </button>
    </div>
  );
};

// ── Main Panel ────────────────────────────────────────────────────────────────

export default function FilterPanel() {
  const {
    filters, addFilter, clearFilters, filterOpen,
    sortBy, sortDir, setSort, toggleSortDir,
    groupBy, setGroupBy,
  } = useMissionsViewStore();

  if (!filterOpen) return null;

  const handleAddFilter = () => {
    addFilter({ field: 'title', op: 'contains', value: '' });
  };

  const SORT_FIELDS = FILTER_FIELDS.map(f => ({ value: f.key, label: f.label }));

  return (
    <div style={{
      background: 'var(--bg)', border: '1px solid var(--border)',
      borderTop: 'none', padding: '0.75rem 1rem',
      display: 'flex', flexDirection: 'column', gap: '0.6rem',
    }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)', flex: 1 }}>
          Filtres actifs
        </span>
        {filters.length > 0 && (
          <button
            onClick={clearFilters}
            style={{
              fontSize: '0.72rem', color: '#EF4444', background: 'none',
              border: 'none', cursor: 'pointer', fontWeight: 600,
            }}
          >
            Tout effacer
          </button>
        )}
      </div>

      {/* ── Filter rows ── */}
      {filters.length === 0 && (
        <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>
          Aucun filtre actif. Ajoutez une règle ci-dessous.
        </p>
      )}
      {filters.map(f => <FilterRow key={f.id} filter={f} />)}

      {/* ── Add filter ── */}
      <button
        onClick={handleAddFilter}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          background: 'none', border: '1px dashed var(--border)',
          borderRadius: '0.5rem', padding: '0.3rem 0.7rem',
          color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer',
          width: 'fit-content', fontWeight: 500,
        }}
      >
        <Plus size={12} /> Ajouter une règle
      </button>

      {/* ── Separator ── */}
      <div style={{ height: 1, background: 'var(--border)', margin: '0.25rem 0' }} />

      {/* ── Sort + Group row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {/* Sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Trier par
          </span>
          <Select
            value={sortBy}
            onChange={field => setSort(field, sortDir)}
            options={SORT_FIELDS}
          />
          <button
            onClick={toggleSortDir}
            title={sortDir === 'asc' ? 'Croissant → Décroissant' : 'Décroissant → Croissant'}
            style={{
              border: '1px solid var(--border)', borderRadius: '0.45rem',
              background: 'var(--bg)', color: 'var(--text)',
              fontSize: '0.75rem', padding: '0.28rem 0.5rem',
              cursor: 'pointer', fontWeight: 700,
            }}
          >
            {sortDir === 'asc' ? '↑ Asc' : '↓ Desc'}
          </button>
        </div>

        {/* Group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Grouper par
          </span>
          <Select
            value={groupBy ?? ''}
            onChange={val => setGroupBy(val || null)}
            options={[
              { value: '', label: 'Aucun groupement' },
              ...GROUP_OPTIONS.map(g => ({ value: g.key, label: g.label })),
            ]}
          />
        </div>
      </div>
    </div>
  );
}
