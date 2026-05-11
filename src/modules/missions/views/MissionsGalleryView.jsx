import React from 'react';
import { MessageSquare, Paperclip, CheckSquare, Clock } from 'lucide-react';
import { PRIORITY_META, statusColor } from '../engine/transforms';

// ── Card ──────────────────────────────────────────────────────────────────────

const GalleryCard = ({ card, onCardClick }) => {
  const m = PRIORITY_META[card.priority] ?? PRIORITY_META.none;
  const hasImage = !!card.coverImageURL;

  return (
    <div
      onClick={() => onCardClick?.(card)}
      style={{
        borderRadius: '0.85rem', overflow: 'hidden',
        border: '1px solid var(--border)',
        background: 'var(--bg)',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s, transform 0.15s',
        display: 'flex', flexDirection: 'column',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'none';
      }}
    >
      {/* ── Cover ── */}
      {hasImage ? (
        <div style={{
          height: 120, overflow: 'hidden',
          background: card.colorTag || 'var(--bg-subtle)',
        }}>
          <img
            src={card.coverImageURL}
            alt={card.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        </div>
      ) : card.colorTag ? (
        <div style={{ height: 6, background: card.colorTag }} />
      ) : null}

      {/* ── Body ── */}
      <div style={{ padding: '0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

        {/* Title + priority */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
          <span style={{
            fontWeight: 700, fontSize: '0.83rem', color: 'var(--text)',
            flex: 1, lineHeight: 1.35,
          }}>
            {card.title}
          </span>
          <span style={{
            fontSize: '0.65rem', fontWeight: 700,
            padding: '0.12rem 0.4rem', borderRadius: '0.3rem',
            background: m.bg, color: m.color,
            flexShrink: 0, marginTop: '0.05rem',
          }}>
            {m.label}
          </span>
        </div>

        {/* Status chip */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
          fontSize: '0.7rem', fontWeight: 600,
          color: statusColor(card.status),
          background: statusColor(card.status) + '18',
          padding: '0.15rem 0.45rem', borderRadius: '1rem',
          width: 'fit-content',
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor(card.status) }} />
          {card.status}
        </div>

        {/* Description snippet */}
        {card.description && (
          <p style={{
            fontSize: '0.74rem', color: 'var(--text-muted)',
            margin: 0, lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {card.description}
          </p>
        )}

        {/* Checklist progress bar */}
        {card.checklistProgress?.total > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Checklist</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                {card.checklistProgress.complete}/{card.checklistProgress.total}
              </span>
            </div>
            <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
              <div style={{
                height: '100%',
                width: `${card.completionPct}%`,
                background: card.completionPct >= 100 ? '#10B981' : 'var(--accent)',
                borderRadius: 2, transition: 'width 0.3s',
              }} />
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          marginTop: 'auto', paddingTop: '0.4rem',
          borderTop: '1px solid var(--border)',
        }}>
          {/* Assignees */}
          <div style={{ display: 'flex', flex: 1 }}>
            {card.assignees.slice(0, 4).map((a, i) => (
              <div key={a.uid} title={a.name} style={{
                width: 22, height: 22, borderRadius: '50%',
                background: a.color, color: 'white', fontSize: '0.58rem',
                fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--bg)', marginLeft: i > 0 ? -6 : 0,
                zIndex: 10 - i, position: 'relative',
              }}>
                {a.initials}
              </div>
            ))}
          </div>

          {/* Meta icons */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {card.commentCount > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                <MessageSquare size={11} /> {card.commentCount}
              </span>
            )}
            {card.attachmentCount > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                <Paperclip size={11} /> {card.attachmentCount}
              </span>
            )}
            {card.checklistProgress?.total > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                <CheckSquare size={11} /> {card.completionPct}%
              </span>
            )}
            {card.endDate && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: '0.2rem',
                fontSize: '0.68rem',
                color: card.isOverdue ? '#EF4444' : 'var(--text-muted)',
                fontWeight: card.isOverdue ? 700 : 400,
              }}>
                <Clock size={11} />
                {new Date(card.endDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Group section ─────────────────────────────────────────────────────────────

const GroupSection = ({ group, onCardClick }) => (
  <div style={{ marginBottom: '1.5rem' }}>
    <h3 style={{
      fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)',
      margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem',
    }}>
      {group.label}
      <span style={{
        fontSize: '0.68rem', fontWeight: 500, color: 'var(--text-muted)',
        background: 'var(--border)', padding: '0.1rem 0.4rem', borderRadius: '1rem',
      }}>
        {group.cards.length}
      </span>
    </h3>
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
      gap: '0.85rem',
    }}>
      {group.cards.map(card => (
        <GalleryCard key={card.id} card={card} onCardClick={onCardClick} />
      ))}
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

export default function MissionsGalleryView({ groups = [], onCardClick }) {
  const allEmpty = groups.every(g => g.cards.length === 0);

  if (allEmpty) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-muted)', fontSize: '0.85rem', padding: '3rem',
      }}>
        Aucune mission ne correspond aux filtres actifs.
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
      {groups.map(group => (
        <GroupSection key={group.key} group={group} onCardClick={onCardClick} />
      ))}
    </div>
  );
}
