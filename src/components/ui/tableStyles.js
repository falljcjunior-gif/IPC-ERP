/**
 * tableStyles.js — Constantes de styles partagées pour les tableaux et badges
 *
 * Remplace les objets style inline dupliqués (×50+ par fichier) dans :
 * Manufacturing.jsx, EntityManagementCenter.jsx, CountryManagementCenter.jsx,
 * StaffPortal.jsx, Holding/tabs/, etc.
 *
 * Usage :
 *   import { TABLE_HEADER, STATUS_BADGE, SECTION_LABEL } from '../components/ui/tableStyles';
 *   <th style={TABLE_HEADER}>Colonne</th>
 */

export const TABLE_HEADER = {
  padding: '0.75rem 1.5rem',
  fontSize: '0.75rem',
  fontWeight: 700,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  textAlign: 'left',
  whiteSpace: 'nowrap',
};

export const TABLE_CELL = {
  padding: '1rem 1.5rem',
  fontSize: '0.875rem',
  color: 'var(--text)',
  borderTop: '1px solid var(--border)',
  verticalAlign: 'middle',
};

export const TABLE_ROW_HOVER = {
  transition: 'background 0.15s',
};

export const STATUS_BADGE = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '3px 10px',
  borderRadius: 999,
  fontSize: '0.72rem',
  fontWeight: 700,
  gap: '0.3rem',
};

export const SECTION_LABEL = {
  fontSize: '0.75rem',
  fontWeight: 700,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '0.5rem',
};

export const CARD_BASE = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '1rem',
  padding: '1.5rem',
};

export const SECTION_CARD = {
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '1rem',
  padding: '1.5rem',
  marginBottom: '1.25rem',
};

export const ICON_BADGE = (color = 'var(--accent)', size = 36) => ({
  width: size,
  height: size,
  borderRadius: '0.6rem',
  background: color + '18',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

/** Badges de statut prédéfinis */
export const STATUS_COLORS = {
  active:    { bg: '#10B98115', color: '#10B981' },
  inactive:  { bg: '#6B728015', color: '#6B7280' },
  pending:   { bg: '#F59E0B15', color: '#F59E0B' },
  error:     { bg: '#EF444415', color: '#EF4444' },
  draft:     { bg: '#3B82F615', color: '#3B82F6' },
  completed: { bg: '#10B98115', color: '#10B981' },
  cancelled: { bg: '#EF444415', color: '#EF4444' },
};

export function statusBadgeStyle(status) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.inactive;
  return { ...STATUS_BADGE, background: colors.bg, color: colors.color };
}
