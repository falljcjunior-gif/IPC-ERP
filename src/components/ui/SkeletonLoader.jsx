import React from 'react';

/**
 * NEXUS OS — SKELETON LOADER SYSTEM
 *
 * Composants skeleton réutilisables pour les états de chargement.
 * Utilise les classes CSS .skeleton définies dans index.css.
 *
 * Usage:
 *   <SkeletonLoader.Table rows={5} columns={4} />
 *   <SkeletonLoader.Cards count={3} />
 *   <SkeletonLoader.List count={6} />
 *   <SkeletonLoader.Form fields={4} />
 */

// ─── Blocs primitifs ──────────────────────────────────────────────────────────

const Line = ({ width = '100%', height = 14, style = {} }) => (
  <div
    className="skeleton"
    style={{ width, height, borderRadius: 6, ...style }}
    role="presentation"
    aria-hidden="true"
  />
);

const Circle = ({ size = 40 }) => (
  <div
    className="skeleton"
    style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0 }}
    role="presentation"
    aria-hidden="true"
  />
);

const Block = ({ width = '100%', height = 80, borderRadius = 12, style = {} }) => (
  <div
    className="skeleton"
    style={{ width, height, borderRadius, ...style }}
    role="presentation"
    aria-hidden="true"
  />
);

// ─── Composants métier ────────────────────────────────────────────────────────

/** Skeleton pour une table de données */
const Table = ({ rows = 5, columns = 4 }) => (
  <div
    style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}
    role="status"
    aria-label="Chargement des données…"
  >
    {/* Header */}
    <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem', background: 'var(--bg-subtle)' }}>
      {Array.from({ length: columns }).map((_, i) => (
        <Line key={i} width={`${100 / columns}%`} height={12} />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIdx) => (
      <div
        key={rowIdx}
        style={{
          padding: '1rem 1.5rem',
          borderBottom: rowIdx < rows - 1 ? '1px solid var(--border-light)' : 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        {Array.from({ length: columns }).map((_, colIdx) => (
          <Line key={colIdx} width={colIdx === 0 ? '30%' : `${70 / (columns - 1)}%`} height={14} />
        ))}
      </div>
    ))}
  </div>
);

/** Skeleton pour une grille de cartes */
const Cards = ({ count = 3, columns = 3 }) => (
  <div
    style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '1.5rem' }}
    role="status"
    aria-label="Chargement…"
  >
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        style={{
          background: 'white',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Circle size={36} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Line height={14} width="70%" />
            <Line height={11} width="45%" />
          </div>
        </div>
        <Block height={60} />
        <Line height={12} width="55%" />
      </div>
    ))}
  </div>
);

/** Skeleton pour une liste d'items (style feed) */
const List = ({ count = 6 }) => (
  <div
    style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
    role="status"
    aria-label="Chargement…"
  >
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1rem 1.25rem',
          background: 'white',
          border: '1px solid var(--border)',
          borderRadius: '1rem',
        }}
      >
        <Circle size={44} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Line height={15} width={`${50 + Math.random() * 30}%`} />
          <Line height={12} width={`${30 + Math.random() * 30}%`} />
        </div>
        <Line height={12} width={60} />
      </div>
    ))}
  </div>
);

/** Skeleton pour un formulaire */
const Form = ({ fields = 4 }) => (
  <div
    style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
    role="status"
    aria-label="Chargement du formulaire…"
  >
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Line height={12} width="25%" />
        <Block height={42} borderRadius={10} />
      </div>
    ))}
    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
      <Block width="120px" height={42} borderRadius={10} />
      <Block width="100px" height={42} borderRadius={10} />
    </div>
  </div>
);

/** Skeleton pour un header de module */
const Header = () => (
  <div
    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}
    role="status"
    aria-label="Chargement…"
  >
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <Line height={28} width={280} />
      <Line height={14} width={200} />
    </div>
    <div style={{ display: 'flex', gap: '0.75rem' }}>
      <Block width={120} height={42} borderRadius={12} />
      <Block width={100} height={42} borderRadius={12} />
    </div>
  </div>
);

/** Skeleton page complète (header + cards + table) */
const Page = ({ cards = 4, tableRows = 5 }) => (
  <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
    <Header />
    <Cards count={cards} columns={cards} />
    <Table rows={tableRows} columns={4} />
  </div>
);

const SkeletonLoader = { Table, Cards, List, Form, Header, Page, Line, Circle, Block };
export default SkeletonLoader;
