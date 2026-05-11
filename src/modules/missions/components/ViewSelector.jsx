import React from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, Table2, GanttChart, Image, Filter, X, Share2, Search } from 'lucide-react';
import { useMissionsViewStore } from '../store/useMissionsViewStore';
import { getShareableURL } from '../engine/urlState';
import { useToastStore } from '../../../store/useToastStore';

const VIEWS = [
  { id: 'board',    label: 'Kanban',    icon: LayoutGrid,  desc: 'Vue processus' },
  { id: 'table',    label: 'Table',     icon: Table2,      desc: 'Vue tableur' },
  { id: 'timeline', label: 'Timeline',  icon: GanttChart,  desc: 'Vue Gantt' },
  { id: 'gallery',  label: 'Galerie',   icon: Image,       desc: 'Vue visuels' },
];

export default function ViewSelector({ cardCount = 0 }) {
  const {
    view, setView, filters, filterOpen, toggleFilterPanel,
    searchQuery, setSearchQuery, clearFilters,
    view: currentView, sortBy, sortDir, groupBy,
  } = useMissionsViewStore();

  const addToast = useToastStore(s => s.addToast);

  const hasFilters = filters.length > 0;

  const handleShare = () => {
    const url = getShareableURL({ view: currentView, sortBy, sortDir, groupBy, filters });
    navigator.clipboard.writeText(url).then(() => {
      addToast('Lien copié dans le presse-papiers', 'success');
    }).catch(() => addToast(url, 'info'));
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      flexWrap: 'wrap', padding: '0.75rem 1rem',
      background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 10,
    }}>

      {/* ── View tabs ── */}
      <div style={{
        display: 'flex', background: 'var(--bg)', borderRadius: '0.75rem',
        padding: '0.2rem', gap: '0.1rem', border: '1px solid var(--border)',
      }}>
        {VIEWS.map(({ id, label, icon: Icon, desc }) => {
          const active = view === id;
          return (
            <button
              key={id}
              onClick={() => setView(id)}
              title={desc}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.35rem 0.75rem', borderRadius: '0.55rem',
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                fontSize: '0.8rem', fontWeight: active ? 700 : 500,
                background: active ? 'var(--accent)' : 'transparent',
                color: active ? 'white' : 'var(--text-muted)',
                position: 'relative',
              }}
            >
              {active && (
                <motion.div
                  layoutId="view-pill"
                  style={{
                    position: 'absolute', inset: 0,
                    borderRadius: '0.55rem',
                    background: 'var(--accent)',
                    zIndex: -1,
                  }}
                  transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }}
                />
              )}
              <Icon size={14} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Separator ── */}
      <div style={{ width: 1, height: 24, background: 'var(--border)', flexShrink: 0 }} />

      {/* ── Search ── */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Search size={13} style={{
          position: 'absolute', left: '0.6rem', top: '50%',
          transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none',
        }} />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Rechercher..."
          style={{
            paddingLeft: '1.8rem', paddingRight: '0.6rem', height: 32,
            border: '1px solid var(--border)', borderRadius: '0.55rem',
            background: 'var(--bg)', fontSize: '0.8rem', color: 'var(--text)',
            width: 160, outline: 'none',
          }}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} style={{
            position: 'absolute', right: '0.4rem', top: '50%',
            transform: 'translateY(-50%)', background: 'none', border: 'none',
            cursor: 'pointer', color: 'var(--text-muted)', padding: 0, lineHeight: 1,
          }}>
            <X size={12} />
          </button>
        )}
      </div>

      {/* ── Filters button ── */}
      <button
        onClick={toggleFilterPanel}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.35rem 0.75rem', borderRadius: '0.55rem',
          border: `1px solid ${hasFilters ? 'var(--accent)' : 'var(--border)'}`,
          background: hasFilters ? 'var(--accent)15' : 'var(--bg)',
          color: hasFilters ? 'var(--accent)' : 'var(--text-muted)',
          cursor: 'pointer', fontSize: '0.8rem', fontWeight: hasFilters ? 700 : 500,
          transition: 'all 0.15s',
        }}
      >
        <Filter size={13} />
        Filtres
        {hasFilters && (
          <span style={{
            background: 'var(--accent)', color: 'white',
            fontSize: '0.65rem', fontWeight: 900,
            borderRadius: '50%', width: 16, height: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {filters.length}
          </span>
        )}
      </button>

      {hasFilters && (
        <button
          onClick={clearFilters}
          title="Effacer tous les filtres"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.3rem',
            padding: '0.35rem 0.6rem', borderRadius: '0.55rem',
            border: '1px solid #EF444440', background: '#EF44440F',
            color: '#EF4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
          }}
        >
          <X size={12} /> Effacer
        </button>
      )}

      {/* ── Spacer ── */}
      <div style={{ flex: 1 }} />

      {/* ── Card count ── */}
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
        {cardCount} mission{cardCount !== 1 ? 's' : ''}
      </span>

      {/* ── Share ── */}
      <button
        onClick={handleShare}
        title="Copier le lien (vue + filtres inclus)"
        style={{
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          padding: '0.35rem 0.7rem', borderRadius: '0.55rem',
          border: '1px solid var(--border)', background: 'var(--bg)',
          color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem',
          transition: 'all 0.15s',
        }}
      >
        <Share2 size={12} /> Partager
      </button>
    </div>
  );
}
