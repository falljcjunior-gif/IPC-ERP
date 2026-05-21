/**
 * EmptyState — Composant réutilisable pour les états vides
 * Remplace tous les `return null` sur liste vide → écran blanc
 *
 * Usage :
 *   <EmptyState icon={FileText} title="Aucun contrat" subtitle="Créez votre premier contrat." action={{ label: 'Nouveau', onClick: () => {} }} />
 *   <EmptyState inline title="—" />  ← version inline pour cellule
 */
import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Aucune donnée',
  subtitle = '',
  action = null,
  inline = false,
  color = 'var(--accent)',
}) {
  if (inline) {
    return (
      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
        {title}
      </span>
    );
  }

  return (
    <div
      role="status"
      aria-label={title}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 2rem',
        gap: '0.75rem',
        textAlign: 'center',
        color: 'var(--text-muted)',
      }}
    >
      {/* Icon container */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '1rem',
          background: color + '15',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '0.25rem',
        }}
      >
        <Icon size={26} style={{ color }} />
      </div>

      {/* Title */}
      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
        {title}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: 320, lineHeight: 1.5 }}>
          {subtitle}
        </div>
      )}

      {/* Action button */}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem 1.25rem',
            borderRadius: '0.6rem',
            background: color,
            color: 'white',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
