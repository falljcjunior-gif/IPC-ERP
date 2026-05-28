/**
 * ══════════════════════════════════════════════════════════════
 * VirtualList — Liste virtualisée haute performance
 * ══════════════════════════════════════════════════════════════
 *
 * Utilise @tanstack/react-virtual pour ne rendre que les éléments visibles.
 * Idéal pour : CRM (contacts), HR (employés), Finance (factures), Inventory
 *
 * Usage :
 *   <VirtualList
 *     items={contacts}
 *     estimateSize={72}           // hauteur estimée par item (px)
 *     renderItem={(contact, i) => <ContactCard key={contact.id} data={contact} />}
 *     threshold={50}              // nb items min avant activation
 *     className="my-list"
 *   />
 *
 * Seuil automatique : si items.length < threshold → rendu classique (pas de virtualisation)
 */

import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'framer-motion';

const VirtualList = ({
  items          = [],
  estimateSize   = 72,
  renderItem,
  threshold      = 50,
  className      = '',
  overscan       = 5,
  style          = {},
  emptyState     = null,
  // Framer Motion stagger pour les petites listes
  animateEntrance = true,
}) => {

  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count:        items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  // ── Liste vide ───────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return emptyState || (
      <div style={{
        padding: '3rem', textAlign: 'center',
        color: 'rgba(107,114,128,0.8)', fontSize: '0.95rem', fontWeight: 600
      }}>
        Aucun élément à afficher
      </div>
    );
  }

  // ── Rendu classique pour les petites listes (< threshold) ───────────────────
  if (items.length < threshold) {
    if (!animateEntrance) {
      return (
        <div className={className} style={style}>
          {items.map((item, i) => renderItem(item, i))}
        </div>
      );
    }

    return (
      <motion.div
        className={className}
        style={style}
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.04 } },
        }}
      >
        {items.map((item, i) => (
          <motion.div
            key={item?.id ?? i}
            variants={{
              hidden:  { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
            }}
          >
            {renderItem(item, i)}
          </motion.div>
        ))}
      </motion.div>
    );
  }

  // ── Rendu virtualisé pour les grandes listes ─────────────────────────────────
  const totalSize = virtualizer.getTotalSize();

  return (
    <div
      ref={parentRef}
      className={className}
      style={{
        overflowY: 'auto',
        height:    '100%',
        minHeight: 300,
        maxHeight: '70vh',
        ...style,
      }}
    >
      {/* Conteneur de hauteur totale pour la scrollbar */}
      <div style={{ height: totalSize, width: '100%', position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            style={{
              position:  'absolute',
              top:       0,
              left:      0,
              width:     '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {renderItem(items[virtualRow.index], virtualRow.index)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(VirtualList);

// ── VirtualGrid (grille virtualisée, ex: cartes produits) ────────────────────
export const VirtualGrid = ({
  items        = [],
  columns      = 3,
  estimateSize = 220,
  renderItem,
  threshold    = 50,
  className    = '',
  style        = {},
  emptyState   = null,
  overscan     = 3,
}) => {
  const parentRef = useRef(null);

  // Diviser les items en rangées
  const rows = [];
  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns));
  }

  const rowVirtualizer = useVirtualizer({
    count:        rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  if (items.length === 0) {
    return emptyState || (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', fontWeight: 600 }}>
        Aucun élément à afficher
      </div>
    );
  }

  if (items.length < threshold) {
    return (
      <div
        className={className}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '1.5rem',
          ...style,
        }}
      >
        {items.map((item, i) => renderItem(item, i))}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      style={{ overflowY: 'auto', maxHeight: '70vh', ...style }}
    >
      <div style={{ height: rowVirtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.key}
            style={{
              position:  'absolute',
              top:       0,
              left:      0,
              width:     '100%',
              transform: `translateY(${virtualRow.start}px)`,
              display:   'grid',
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gap:       '1.5rem',
              padding:   '0.75rem 0',
            }}
          >
            {rows[virtualRow.index].map((item, colIdx) =>
              renderItem(item, virtualRow.index * columns + colIdx)
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
