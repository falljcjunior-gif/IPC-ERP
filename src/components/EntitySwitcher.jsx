/**
 * ════════════════════════════════════════════════════════════════════════════
 * ENTITY SWITCHER — Group Navigation Component
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Allows users with multi-entity access (Holding-level) to switch the active
 * entity scope. Single-entity users see their entity badge only (no switcher).
 *
 * Levels:
 *   🏛️  IPC Holding     → group consolidated view
 *   🧱  IPC Green Blocks → subsidiary operational view
 *   🌱  IPC Foundation   → foundation impact view
 */

import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import {
  GROUP_ENTITIES,
  ENTITY_TYPES,
  isHoldingRole,
} from '../schemas/org.schema';

const T = {
  bg:      'var(--bg, #0a0c10)',
  surface: 'var(--bg-card, #111318)',
  border:  'var(--border, #1f2937)',
  accent:  'var(--accent, #2ecc71)',
  text:    'var(--text, #e5e7eb)',
  muted:   'var(--text-muted, #6b7280)',
};

const TYPE_LABELS = {
  [ENTITY_TYPES.HOLDING]:    'Holding',
  [ENTITY_TYPES.SUBSIDIARY]: 'Filiale',
  [ENTITY_TYPES.FOUNDATION]: 'Foundation',
};

const TYPE_BADGE_COLORS = {
  [ENTITY_TYPES.HOLDING]:    { bg: 'rgba(46,204,113,0.15)', border: '#2ecc71', text: '#2ecc71' },
  [ENTITY_TYPES.SUBSIDIARY]: { bg: 'rgba(52,152,219,0.15)', border: '#3498db', text: '#3498db' },
  [ENTITY_TYPES.FOUNDATION]: { bg: 'rgba(243,156,18,0.15)', border: '#f39c12', text: '#f39c12' },
};

export default function EntitySwitcher({ onEntityChange, compact = false }) {
  const role         = useStore(s => s.userRole || s.user?.role);
  const userProfile  = useStore(s => s.user);
  const [open, setOpen]           = useState(false);
  const [activeId, setActiveId]   = useState(
    userProfile?.entity_id || 'ipc_green_blocks'
  );
  const ref = useRef(null);

  const canSwitch = isHoldingRole(role);
  const activeEntity = GROUP_ENTITIES.find(e => e.id === activeId)
    || GROUP_ENTITIES.find(e => e.id === userProfile?.entity_id)
    || GROUP_ENTITIES[0];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = (entity) => {
    setActiveId(entity.id);
    setOpen(false);
    onEntityChange?.(entity);
  };

  const badge = TYPE_BADGE_COLORS[activeEntity.type] || TYPE_BADGE_COLORS[ENTITY_TYPES.SUBSIDIARY];

  // ── Non-switcher: single entity badge ───────────────────────────────────────
  if (!canSwitch) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: compact ? '4px 10px' : '6px 14px',
        borderRadius: 8,
        background: badge.bg,
        border: `1px solid ${badge.border}22`,
      }}>
        <span style={{ fontSize: compact ? 14 : 16 }}>{activeEntity.icon}</span>
        {!compact && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: badge.text, lineHeight: 1 }}>
              {activeEntity.shortName}
            </div>
            <div style={{ fontSize: 10, color: T.muted, marginTop: 1 }}>
              {TYPE_LABELS[activeEntity.type]}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Switcher: holding users can switch entities ──────────────────────────────
  const grouped = {
    holding:     GROUP_ENTITIES.filter(e => e.type === ENTITY_TYPES.HOLDING),
    subsidiary:  GROUP_ENTITIES.filter(e => e.type === ENTITY_TYPES.SUBSIDIARY && e.active),
    foundation:  GROUP_ENTITIES.filter(e => e.type === ENTITY_TYPES.FOUNDATION),
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: compact ? '4px 10px' : '6px 14px',
          borderRadius: 8,
          background: badge.bg,
          border: `1px solid ${badge.border}44`,
          cursor: 'pointer',
          transition: 'all .15s',
        }}
      >
        <span style={{ fontSize: compact ? 14 : 16 }}>{activeEntity.icon}</span>
        {!compact && (
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: badge.text, lineHeight: 1 }}>
              {activeEntity.shortName}
            </div>
            <div style={{ fontSize: 10, color: T.muted, marginTop: 1 }}>
              {TYPE_LABELS[activeEntity.type]}
            </div>
          </div>
        )}
        <svg width="10" height="6" viewBox="0 0 10 6" style={{
          marginLeft: 2, color: T.muted,
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform .15s',
        }}>
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0,
          width: 280, zIndex: 9999,
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0,0,0,.6)',
          overflow: 'hidden',
          animation: 'fadeSlideDown .15s ease',
        }}>
          {/* Header */}
          <div style={{
            padding: '10px 14px',
            borderBottom: `1px solid ${T.border}`,
            fontSize: 11, fontWeight: 700, color: T.muted,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            Changer d&apos;entité
          </div>

          {/* Holding */}
          <EntityGroup
            label="🏛️ Holding"
            entities={grouped.holding}
            activeId={activeId}
            onSelect={handleSelect}
            badgeType={ENTITY_TYPES.HOLDING}
          />

          {/* Subsidiaries */}
          <EntityGroup
            label="🏢 Filiales"
            entities={grouped.subsidiary}
            activeId={activeId}
            onSelect={handleSelect}
            badgeType={ENTITY_TYPES.SUBSIDIARY}
          />

          {/* Foundation */}
          <EntityGroup
            label="🌱 Foundation"
            entities={grouped.foundation}
            activeId={activeId}
            onSelect={handleSelect}
            badgeType={ENTITY_TYPES.FOUNDATION}
          />
        </div>
      )}
    </div>
  );
}

function EntityGroup({ label, entities, activeId, onSelect, badgeType }) {
  if (!entities.length) return null;
  const colors = TYPE_BADGE_COLORS[badgeType];

  return (
    <div>
      <div style={{
        padding: '8px 14px 4px',
        fontSize: 10, fontWeight: 700, color: colors.text,
        textTransform: 'uppercase', letterSpacing: '0.08em',
        borderTop: `1px solid ${colors.border}22`,
      }}>
        {label}
      </div>
      {entities.map(e => {
        const isActive = e.id === activeId;
        return (
          <button
            key={e.id}
            onClick={() => onSelect(e)}
            style={{
              width: '100%', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 14px',
              background: isActive ? `${colors.bg}` : 'transparent',
              border: 'none', cursor: 'pointer',
              borderLeft: isActive ? `2px solid ${colors.border}` : '2px solid transparent',
              transition: 'background .12s',
            }}
          >
            <span style={{ fontSize: 16 }}>{e.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: isActive ? 700 : 500,
                color: isActive ? colors.text : 'var(--text, #e5e7eb)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {e.name}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted, #6b7280)', marginTop: 1 }}>
                {e.industry}
              </div>
            </div>
            {isActive && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill={colors.border}>
                <path d="M2 7l3.5 3.5L12 3" stroke={colors.border} strokeWidth="2"
                      fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
