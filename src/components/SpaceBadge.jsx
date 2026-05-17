/**
 * ════════════════════════════════════════════════════════════════════════════
 * SPACE BADGE — Indicateur textuel "Dans quel espace suis-je ?"
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Affiché en haut de sidebar (PlatformShell), sous le logo de l'espace.
 * Montre le label de l'espace et le nom de l'entité active.
 *
 * Props:
 *   entityType  — HOLDING | SUBSIDIARY | FOUNDATION (from TenantContext)
 *   entityName  — nom lisible (ex: "IPC Filiale Sénégal")
 *   collapsed   — si true, n'affiche que l'initiale
 */

import React from 'react';
import { getSpaceTheme } from '../services/space.config';

export default function SpaceBadge({ entityType, entityName, collapsed = false }) {
  const theme = getSpaceTheme(entityType);

  if (collapsed) {
    return (
      <div
        title={`${theme.label} · ${entityName || ''}`}
        style={{
          width: 40, height: 40, borderRadius: 10,
          background: theme.accentSoft,
          border: `1.5px solid ${theme.accent}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '8px auto', flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 900, color: theme.accent, letterSpacing: '-0.02em' }}>
          {theme.label.charAt(0)}
        </span>
      </div>
    );
  }

  return (
    <div style={{
      margin: '8px 12px',
      padding: '8px 12px',
      background: theme.accentSoft,
      border: `1px solid ${theme.accent}22`,
      borderRadius: 10,
      display: 'flex', flexDirection: 'column', gap: 2,
    }}>
      <div style={{
        fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
        textTransform: 'uppercase', color: theme.accent, opacity: 0.7,
      }}>
        {theme.label}
      </div>
      <div style={{
        fontSize: 12, fontWeight: 700, color: theme.accent,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {entityName || '—'}
      </div>
    </div>
  );
}
