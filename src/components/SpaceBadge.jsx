/**
 * ════════════════════════════════════════════════════════════════════════════
 * SPACE BADGE — Indicateur visuel "Dans quel espace suis-je ?"
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Affiché en haut de sidebar (PlatformShell). Permet à l'utilisateur de savoir
 * immédiatement dans quel espace (Holding / Filiale / Foundation) il se trouve.
 *
 * Props:
 *   entityType  — HOLDING | SUBSIDIARY | FOUNDATION (from TenantContext)
 *   entityName  — nom lisible (ex: "IPC Filiale Sénégal")
 *   collapsed   — si true, n'affiche que l'icône
 */

import React from 'react';
import { Landmark, Building2, Sprout } from 'lucide-react';
import { getSpaceTheme } from '../services/space.config';
import { ENTITY_TYPES } from '../schemas/org.schema';

const SPACE_ICONS = {
  [ENTITY_TYPES.HOLDING]:    Landmark,
  [ENTITY_TYPES.SUBSIDIARY]: Building2,
  [ENTITY_TYPES.FOUNDATION]: Sprout,
};

export default function SpaceBadge({ entityType, entityName, collapsed = false }) {
  const theme = getSpaceTheme(entityType);
  const Icon = SPACE_ICONS[entityType] || Building2;

  if (collapsed) {
    return (
      <div
        title={`${theme.label} · ${entityName || ''}`}
        style={{
          width: 40, height: 40, borderRadius: 10,
          background: theme.badgeBg, color: theme.badgeFg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '12px auto', flexShrink: 0,
        }}
      >
        <Icon size={18} strokeWidth={2} />
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px',
      margin: '12px',
      background: theme.badgeBg,
      color: theme.badgeFg,
      borderRadius: 12,
      boxShadow: `0 2px 8px ${theme.badgeBg}33`,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: 'rgba(255,255,255,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={16} strokeWidth={2.2} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          fontWeight: 700,
          opacity: 0.7,
          marginBottom: 2,
        }}>
          {theme.label}
        </div>
        <div style={{
          fontSize: 12,
          fontWeight: 700,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {entityName || '—'}
        </div>
      </div>
    </div>
  );
}
