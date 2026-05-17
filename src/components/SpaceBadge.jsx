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
import { getSpaceTheme } from '../services/space.config';
import { ENTITY_TYPES } from '../schemas/org.schema';

const SPACE_LOGOS = {
  [ENTITY_TYPES.HOLDING]:    '/logo-holding.png',
  [ENTITY_TYPES.SUBSIDIARY]: '/logo-filiale.png',
  [ENTITY_TYPES.FOUNDATION]: '/logo-fondation.png',
};

export default function SpaceBadge({ entityType, entityName, collapsed = false }) {
  const theme = getSpaceTheme(entityType);
  const logoSrc = SPACE_LOGOS[entityType] || SPACE_LOGOS[ENTITY_TYPES.HOLDING];

  if (collapsed) {
    return (
      <div
        title={`${theme.label} · ${entityName || ''}`}
        style={{
          width: 40, height: 40, borderRadius: 10,
          background: '#FFFFFF',
          border: `1.5px solid ${theme.accent}33`,
          boxShadow: `0 1px 6px ${theme.accent}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '12px auto', flexShrink: 0, overflow: 'hidden',
        }}
      >
        <img
          src={logoSrc}
          alt={theme.label}
          style={{ height: 22, width: '100%', objectFit: 'contain', padding: '0 4px' }}
        />
      </div>
    );
  }

  return (
    <div style={{
      margin: '12px',
      background: '#FFFFFF',
      border: `1px solid ${theme.accent}22`,
      borderRadius: 12,
      boxShadow: `0 2px 8px ${theme.accent}18`,
      padding: '10px 14px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
    }}>
      <img
        src={logoSrc}
        alt={theme.label}
        style={{ height: 36, objectFit: 'contain', maxWidth: '100%' }}
      />
      {entityName && (
        <div style={{
          fontSize: 10, color: theme.accent, fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          maxWidth: '100%',
        }}>
          {entityName}
        </div>
      )}
    </div>
  );
}
