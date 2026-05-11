/**
 * ══════════════════════════════════════════════════════════════════
 * NEXUS ACADEMY — Module de connaissance stratégique
 * ══════════════════════════════════════════════════════════════════
 * Design system : identique aux autres modules Nexus OS
 *   – light theme (var(--bg), var(--text), var(--border))
 *   – .glass panels, .btn-primary, luxury classes
 *   – framer-motion animations
 *   – accent vert (#10B981), primary (#064E3B)
 */

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, BookOpen, HelpCircle, Search, X,
  ChevronDown, ChevronRight, Sparkles, Cpu, Target,
  Layers, Building2, Compass, Activity, Fingerprint,
  Scale, Landmark, CheckCircle, Award, Zap, BarChart2,
  Heart, Rocket, UserPlus, Gauge, Eye, Grid, FileText,
  Wifi, Globe, Shield, Lock, Kanban, TrendingUp, Factory,
  Users, Database,
} from 'lucide-react';
import { NEXUS_GUIDE_DATA, searchGuide } from './nexusGuideData';
import '../../components/GlobalDashboard.css';

// ─────────────────────────────────────────────────────────────────
// ICON MAP
// ─────────────────────────────────────────────────────────────────
const ICON_MAP = {
  Kanban, TrendingUp, Factory, Users, Database,
  Cpu, Target, Layers, Building2, Compass,
  Activity, Fingerprint, Scale, Landmark,
  CheckCircle, Award, Zap,
  BarChart2, Heart, Rocket, UserPlus, Gauge, Eye,
  Grid, FileText, Wifi, Globe, Shield, Lock,
};

function LucideIcon({ name, size = 16, color, style }) {
  const Icon = ICON_MAP[name] || BookOpen;
  return <Icon size={size} color={color} style={style} />;
}

// ─────────────────────────────────────────────────────────────────
// ANIMATION VARIANTS
// ─────────────────────────────────────────────────────────────────
const fade = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.32 } },
};
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
};

// ─────────────────────────────────────────────────────────────────
// MODULE PILL (sidenav interne — liste gauche dans le header)
// ─────────────────────────────────────────────────────────────────
function ModulePill({ mod, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '0.55rem 1.1rem', borderRadius: '1rem',
        border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem',
        whiteSpace: 'nowrap', transition: 'all 0.18s',
        background: active ? mod.color : 'transparent',
        color: active ? '#fff' : 'var(--text-muted)',
        boxShadow: active ? `0 4px 12px ${mod.color}40` : 'none',
      }}
    >
      <LucideIcon name={mod.icon} size={14} color={active ? '#fff' : mod.color} />
      {mod.label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────
// ARTICLE CARD
// ─────────────────────────────────────────────────────────────────
function ArticleCard({ article, color }) {
  return (
    <motion.div variants={fade} className="luxury-widget" style={{ borderRadius: '1.5rem', overflow: 'hidden', marginBottom: '1.5rem' }}>
      {/* Card header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '1.1rem 1.5rem',
        background: `linear-gradient(90deg, ${color}12, transparent)`,
        borderBottom: '1px solid var(--border-light)',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '0.75rem',
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <LucideIcon name={article.logic.icon} size={17} color={color} />
        </div>
        <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--text)', fontFamily: 'var(--font-heading)' }}>
          {article.title}
        </div>
      </div>

      {/* Two-column body */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        {/* Logique technique */}
        <div style={{ padding: '1.5rem', borderRight: '1px solid var(--border-light)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.1em', color: '#3B82F6', marginBottom: '0.9rem',
          }}>
            <Cpu size={12} color="#3B82F6" />
            {article.logic.heading}
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
            {article.logic.content}
          </p>
          {article.logic.bullets && (
            <ul style={{ margin: '0.9rem 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {article.logic.bullets.map((b, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#3B82F6', marginTop: 6, flexShrink: 0 }} />
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Finalité stratégique */}
        <div style={{ padding: '1.5rem', background: `${color}06` }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.1em', color, marginBottom: '0.9rem',
          }}>
            <LucideIcon name={article.finality.icon} size={12} color={color} />
            {article.finality.heading}
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
            {article.finality.content}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// FAQ ENGINE
// ─────────────────────────────────────────────────────────────────
function FaqEngine({ faqItems, color }) {
  const [openIdx, setOpenIdx] = useState(null);
  const [query, setQuery]     = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return faqItems;
    const q = query.toLowerCase();
    return faqItems.filter(f => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
  }, [query, faqItems]);

  return (
    <div>
      {/* Search */}
      <div className="glass" style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0.65rem 1.1rem', borderRadius: '1rem',
        marginBottom: '1.25rem',
      }}>
        <Search size={15} color="var(--text-muted)" />
        <input
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '0.87rem', color: 'var(--text)' }}
          placeholder="Filtrer les questions…"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpenIdx(null); }}
        />
        {query && <X size={14} color="var(--text-muted)" style={{ cursor: 'pointer' }} onClick={() => { setQuery(''); setOpenIdx(null); }} />}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.87rem', padding: '2rem 0' }}>
          Aucune question ne correspond à &quot;{query}&quot;
        </div>
      )}

      <motion.div variants={stagger} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {filtered.map((item, idx) => (
          <motion.div key={idx} variants={fade}>
            <div
              className="glass"
              style={{
                borderRadius: '1rem', overflow: 'hidden',
                border: openIdx === idx ? `1px solid ${color}40` : '1px solid var(--border-light)',
                transition: 'border-color 0.2s ease',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '1rem 1.25rem', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              >
                <HelpCircle size={16} color={color} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, fontWeight: 700, fontSize: '0.87rem', color: 'var(--text)' }}>{item.q}</span>
                {openIdx === idx
                  ? <ChevronDown size={15} color="var(--text-muted)" />
                  : <ChevronRight size={15} color="var(--text-muted)" />
                }
              </div>
              <AnimatePresence>
                {openIdx === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{
                      padding: '0 1.25rem 1rem 2.8rem',
                      fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.7,
                      borderTop: '1px solid var(--border-light)',
                      paddingTop: '0.85rem',
                    }}>
                      {item.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SEARCH OVERLAY (Cmd+K)
// ─────────────────────────────────────────────────────────────────
function SearchOverlay({ onClose, onNavigate }) {
  const [query, setQuery]         = useState('');
  const [hoveredIdx, setHoveredIdx] = useState(0);
  const inputRef = useRef(null);

  const results = useMemo(() => searchGuide(query), [query]);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setHoveredIdx(0); }, [results]);

  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHoveredIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setHoveredIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[hoveredIdx]) { onNavigate(results[hoveredIdx]); onClose(); }
  }, [results, hoveredIdx, onClose, onNavigate]);

  const SUGGESTIONS = ['LexoRank', 'Monte-Carlo', 'WebAuthn', 'Nexus Score', 'Registry Pattern'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '14vh',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.97 }}
        transition={{ duration: 0.2 }}
        className="luxury-widget"
        style={{ width: 560, borderRadius: '1.75rem', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-light)' }}>
          <Search size={17} color="var(--text-muted)" />
          <input
            ref={inputRef}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '1rem', color: 'var(--text)', fontFamily: 'var(--font-main)' }}
            placeholder="Rechercher dans Nexus Academy…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
          />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg-subtle)', borderRadius: '0.4rem', padding: '2px 6px', fontWeight: 700 }}>ESC</span>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {results.map((r, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '0.9rem 1.5rem', cursor: 'pointer',
                  background: hoveredIdx === i ? 'var(--bg-subtle)' : 'transparent',
                  transition: 'background 0.12s ease',
                  borderBottom: '1px solid var(--border-light)',
                }}
                onMouseEnter={() => setHoveredIdx(i)}
                onClick={() => { onNavigate(r); onClose(); }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.87rem', color: 'var(--text)', marginBottom: 3 }}>{r.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{r.excerpt}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
                    color: r.color, background: `${r.color}15`, border: `1px solid ${r.color}30`,
                    borderRadius: '0.4rem', padding: '2px 7px',
                  }}>{r.moduleLabel}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {r.type === 'faq' ? 'FAQ' : 'Article'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No result */}
        {query.length > 1 && results.length === 0 && (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.87rem' }}>
            Aucun résultat pour &quot;<strong>{query}</strong>&quot;
          </div>
        )}

        {/* Suggestions */}
        {!query && (
          <div style={{ padding: '1rem 1.5rem 1.25rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Suggestions
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => setQuery(s)}
                  style={{
                    padding: '4px 12px', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: 600,
                    background: 'var(--bg-subtle)', color: 'var(--text-muted)',
                    border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ContextualHelp — bouton flottant exportable
// ─────────────────────────────────────────────────────────────────
export function ContextualHelp() {
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const h = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowSearch(true); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowSearch(true)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
          width: 46, height: 46, borderRadius: '50%',
          background: 'var(--primary)', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(6,78,59,0.35)',
        }}
        title="Nexus Academy (⌘K)"
      >
        <GraduationCap size={20} color="#fff" />
      </motion.button>

      <AnimatePresence>
        {showSearch && (
          <SearchOverlay onClose={() => setShowSearch(false)} onNavigate={() => {}} />
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// NEXUS ACADEMY — composant principal
// ─────────────────────────────────────────────────────────────────
export default function NexusAcademy() {
  const [activeModId, setActiveModId] = useState(NEXUS_GUIDE_DATA[0].id);
  const [activeTab, setActiveTab]     = useState('articles');
  const [showSearch, setShowSearch]   = useState(false);

  const activeMod = useMemo(
    () => NEXUS_GUIDE_DATA.find(m => m.id === activeModId) || NEXUS_GUIDE_DATA[0],
    [activeModId]
  );

  // Cmd+K
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowSearch(s => !s); }
      if (e.key === 'Escape') setShowSearch(false);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const handleNavigate = useCallback((result) => {
    setActiveModId(result.moduleId);
    setActiveTab(result.type === 'faq' ? 'faq' : 'articles');
  }, []);

  const handleSelectModule = useCallback((id) => {
    setActiveModId(id);
    setActiveTab('articles');
  }, []);

  return (
    <div className="luxury-dashboard-container" style={{ padding: '2.5rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="luxury-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <div className="luxury-subtitle" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ repeat: Infinity, duration: 4 }}
              style={{ background: 'var(--accent-glow)', padding: '5px', borderRadius: '8px', display: 'flex' }}>
              <GraduationCap size={17} color="var(--accent)" />
            </motion.div>
            Nexus Academy — Base de Connaissance Stratégique
          </div>
          <h1 className="luxury-title">
            Knowledge <strong>Engine</strong>
          </h1>
          <p style={{ margin: '0.5rem 0 0', color: 'var(--text-muted)', fontWeight: 500, fontSize: '1rem', maxWidth: 560, lineHeight: 1.5 }}>
            Documentation vivante de Nexus OS : logique technique et finalité stratégique pour chaque module.
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.55rem 1.1rem', borderRadius: '2rem', border: '1px solid var(--accent-glow)' }}>
            <Sparkles size={15} color="var(--accent)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent)' }}>{NEXUS_GUIDE_DATA.length} modules documentés</span>
          </div>
          <button
            onClick={() => setShowSearch(true)}
            className="btn-primary"
            style={{ padding: '0.7rem 1.5rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            <Search size={15} />
            Rechercher
            <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '0.4rem', padding: '1px 6px', fontSize: '0.72rem', fontWeight: 800 }}>⌘K</span>
          </button>
        </div>
      </div>

      {/* ── MODULE PILLS ───────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: '0.4rem', flexWrap: 'wrap',
        background: 'var(--bg-subtle)', padding: '5px', borderRadius: '1.5rem',
        border: '1px solid var(--border)', width: 'fit-content',
      }}>
        {NEXUS_GUIDE_DATA.map(mod => (
          <ModulePill
            key={mod.id}
            mod={mod}
            active={activeModId === mod.id}
            onClick={() => handleSelectModule(mod.id)}
          />
        ))}
      </div>

      {/* ── ACTIVE MODULE ─────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeModId}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}
        >
          {/* Module overview banner */}
          <div className="glass" style={{
            display: 'flex', alignItems: 'flex-start', gap: 16,
            padding: '1.25rem 1.75rem', borderRadius: '1.5rem',
            background: `linear-gradient(90deg, ${activeMod.color}10, transparent)`,
            borderLeft: `4px solid ${activeMod.color}`,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '0.875rem',
              background: `${activeMod.color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <LucideIcon name={activeMod.icon} size={22} color={activeMod.color} />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--text)', marginBottom: 4, fontFamily: 'var(--font-heading)' }}>
                {activeMod.label}
              </div>
              <div style={{ fontSize: '0.87rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8 }}>
                {activeMod.tagline}
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 760 }}>
                {activeMod.overview}
              </p>
            </div>
          </div>

          {/* Tab bar */}
          <div style={{
            display: 'flex', gap: '0.4rem',
            background: 'var(--bg-subtle)', padding: '5px', borderRadius: '1.25rem',
            border: '1px solid var(--border)', width: 'fit-content',
          }}>
            {[
              { id: 'articles', label: `Articles (${activeMod.articles.length})`, icon: <BookOpen size={14} /> },
              { id: 'faq',      label: `FAQ (${activeMod.faq.length})`,           icon: <HelpCircle size={14} /> },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '0.5rem 1.1rem', borderRadius: '0.9rem',
                  border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem',
                  transition: 'all 0.18s',
                  background: activeTab === t.id ? 'var(--accent)' : 'transparent',
                  color: activeTab === t.id ? '#fff' : 'var(--text-muted)',
                  boxShadow: activeTab === t.id ? 'var(--shadow-accent)' : 'none',
                }}
              >
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'articles' && (
              <motion.div
                key="articles"
                variants={stagger}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0 }}
              >
                {activeMod.articles.map(article => (
                  <ArticleCard key={article.id} article={article} color={activeMod.color} />
                ))}
              </motion.div>
            )}

            {activeTab === 'faq' && (
              <motion.div
                key="faq"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <FaqEngine faqItems={activeMod.faq} color={activeMod.color} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* ── SEARCH OVERLAY ────────────────────────────────────────── */}
      <AnimatePresence>
        {showSearch && (
          <SearchOverlay
            onClose={() => setShowSearch(false)}
            onNavigate={handleNavigate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
