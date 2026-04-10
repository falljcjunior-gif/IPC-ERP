import React from 'react';
import { motion, Reorder } from 'framer-motion';
import { MoreVertical, GripVertical, Plus } from 'lucide-react';

const KanbanBoard = ({ 
  columns, 
  items, 
  onMove, 
  onItemClick, 
  onAddClick,
  columnMapping = 'statut',
  renderCardContent 
}) => {
  return (
    <div style={{ 
      display: 'flex', 
      gap: '1.5rem', 
      overflowX: 'auto', 
      paddingBottom: '1.5rem',
      minHeight: '600px',
      alignItems: 'flex-start'
    }}>
      {columns.map((column) => {
        const columnItems = items.filter(item => item[columnMapping] === column);
        
        return (
          <div 
            key={column} 
            style={{ 
              minWidth: '320px', 
              maxWidth: '320px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            {/* Column Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '0.5rem 1rem',
              marginBottom: '0.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {column}
                </h3>
                <span style={{ 
                  background: 'var(--bg-subtle)', 
                  padding: '2px 8px', 
                  borderRadius: '10px', 
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)'
                }}>
                  {columnItems.length}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => onAddClick && onAddClick(column)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <Plus size={16} />
                </button>
                <MoreVertical size={16} color="var(--text-muted)" />
              </div>
            </div>

            {/* Column Content */}
            <div 
              style={{ 
                background: 'var(--bg-subtle)', 
                borderRadius: '1.25rem', 
                padding: '0.75rem',
                minHeight: '100px',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              {columnItems.map((item) => (
                <motion.div
                  key={item.id}
                  layoutId={item.id}
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onItemClick(item)}
                  className="glass"
                  style={{ 
                    padding: '1.25rem', 
                    borderRadius: '1rem', 
                    cursor: 'pointer',
                    position: 'relative',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ 
                    position: 'absolute', 
                    top: '1.25rem', 
                    right: '0.75rem', 
                    color: 'var(--text-muted)',
                    opacity: 0.5 
                  }}>
                    <GripVertical size={16} />
                  </div>
                  
                  {renderCardContent ? renderCardContent(item) : (
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.5rem', paddingRight: '1rem' }}>
                        {item.nom || item.titre}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {item.entreprise || item.projet}
                      </div>
                    </div>
                  )}

                  {/* Move Helper (Mobile focus) */}
                  <div style={{ 
                    marginTop: '1rem', 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    gap: '0.5rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border)'
                  }}>
                    {columns.indexOf(column) > 0 && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const prevCol = columns[columns.indexOf(column) - 1];
                          onMove(item, prevCol);
                        }}
                        style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}
                      >
                         ←
                      </button>
                    )}
                    {columns.indexOf(column) < columns.length - 1 && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextCol = columns[columns.indexOf(column) + 1];
                          onMove(item, nextCol);
                        }}
                        style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}
                      >
                         →
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {columnItems.length === 0 && (
                <div style={{ 
                  padding: '2rem', 
                  textAlign: 'center', 
                  color: 'var(--text-muted)', 
                  fontSize: '0.8rem',
                  border: '1px dashed var(--border)',
                  borderRadius: '1rem'
                }}>
                  Vide
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
