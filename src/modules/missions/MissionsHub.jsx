/**
 * MissionsHub — entry-point shell for the Missions module.
 *
 * Layout:
 *   ┌─────────────┬──────────────────────────────────────────┐
 *   │  Workspace  │  Board grid  ──or──  Active Board        │
 *   │  sidebar    │  (MissionsBoard + CardModal + Butler)     │
 *   └─────────────┴──────────────────────────────────────────┘
 */
import React, {
  useEffect, useState, useCallback, useRef, lazy, Suspense,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Settings, ChevronRight, Users, Lock, Globe,
  LayoutGrid, X, Rocket, Zap,
  Loader2,
} from 'lucide-react';

import { useMissionsStore } from './store/useMissionsStore';
import { MissionsFS, seedDefaultWorkspaces } from './services/missions.firestore';
import { useWorkspaceAuth } from './hooks/useWorkspaceAuth';
import { useStore }         from '../../store';

const MissionsBoard    = lazy(() => import('./components/MissionsBoard'));
const CardModal        = lazy(() => import('./components/CardModal'));
const ButlerPanel      = lazy(() => import('./components/ButlerPanel'));
const WorkspaceSettings = lazy(() => import('./components/WorkspaceSettings'));

// ── tiny palette for workspace avatars ─────────────────────────────────────
const WS_COLORS = [
  '#3B82F6','#8B5CF6','#10B981','#F59E0B','#EF4444',
  '#06B6D4','#EC4899','#84CC16','#F97316','#6366F1',
];
const wsColor = (id = '') =>
  WS_COLORS[id.charCodeAt(0) % WS_COLORS.length];

// ── Board background presets ────────────────────────────────────────────────
const BG_PRESETS = [
  { label: 'Indigo',   value: 'linear-gradient(135deg,#4f46e5,#7c3aed)' },
  { label: 'Teal',     value: 'linear-gradient(135deg,#0d9488,#0891b2)' },
  { label: 'Slate',    value: 'linear-gradient(135deg,#334155,#1e293b)' },
  { label: 'Rose',     value: 'linear-gradient(135deg,#e11d48,#db2777)' },
  { label: 'Amber',    value: 'linear-gradient(135deg,#d97706,#dc2626)' },
  { label: 'Emerald',  value: 'linear-gradient(135deg,#059669,#065f46)' },
];

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', minHeight:200 }}>
      <Loader2 size={32} style={{ animation:'spin 1s linear infinite', color:'var(--accent)' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Workspace avatar pill ───────────────────────────────────────────────────
function WsAvatar({ ws, size = 36 }) {
  const color = wsColor(ws.id);
  const initial = (ws.name || '?')[0].toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.4, flexShrink: 0,
    }}>
      {initial}
    </div>
  );
}

// ── Workspace creation modal ────────────────────────────────────────────────
function CreateWorkspaceModal({ onCreated, onClose }) {
  const [name, setName]       = useState('');
  const [desc, setDesc]       = useState('');
  const [busy, setBusy]       = useState(false);
  const uid                   = useStore(s => s.user?.uid || s.user?.id);

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const id = await MissionsFS.createWorkspace({ name: name.trim(), description: desc.trim() }, uid);
      onCreated(id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <motion.div
        initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }}
        style={modalStyle}
      >
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h3 style={{ margin:0, fontWeight:700, fontSize:'1.1rem' }}>Nouvel espace de travail</h3>
          <button onClick={onClose} style={iconBtnStyle}><X size={18}/></button>
        </div>
        <label style={labelStyle}>Nom</label>
        <input
          autoFocus value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key==='Enter' && submit()}
          placeholder="ex : Projet Alpha"
          style={inputStyle}
        />
        <label style={{ ...labelStyle, marginTop:12 }}>Description (optionnel)</label>
        <textarea
          value={desc} onChange={e => setDesc(e.target.value)}
          rows={2} placeholder="Objectif, contexte…"
          style={{ ...inputStyle, resize:'vertical', minHeight:60 }}
        />
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:20 }}>
          <button onClick={onClose} style={ghostBtnStyle}>Annuler</button>
          <button onClick={submit} disabled={!name.trim() || busy} style={primaryBtnStyle}>
            {busy ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : 'Créer'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Board creation modal ────────────────────────────────────────────────────
function CreateBoardModal({ workspaceId, onCreated, onClose }) {
  const [name, setBoardName]  = useState('');
  const [bg, setBg]           = useState(BG_PRESETS[0].value);
  const [visibility, setVis]  = useState('workspace');
  const [busy, setBusy]       = useState(false);
  const uid                   = useStore(s => s.user?.uid || s.user?.id);

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const id = await MissionsFS.createBoard(workspaceId, {
        name: name.trim(), background: bg, visibility,
      }, uid);
      onCreated(id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <motion.div
        initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }}
        style={modalStyle}
      >
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h3 style={{ margin:0, fontWeight:700, fontSize:'1.1rem' }}>Nouveau tableau</h3>
          <button onClick={onClose} style={iconBtnStyle}><X size={18}/></button>
        </div>

        {/* Prévisualisation */}
        <div style={{
          height:80, borderRadius:10, background:bg,
          marginBottom:16, display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <span style={{ color:'#fff', fontWeight:700, fontSize:'1rem', opacity:.9 }}>
            {name || 'Nom du tableau'}
          </span>
        </div>

        <label style={labelStyle}>Arrière-plan</label>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
          {BG_PRESETS.map(p => (
            <button
              key={p.value}
              onClick={() => setBg(p.value)}
              style={{
                width:28, height:28, borderRadius:6, background:p.value,
                border: bg===p.value ? '2px solid var(--accent)' : '2px solid transparent',
                cursor:'pointer',
              }}
              title={p.label}
            />
          ))}
        </div>

        <label style={labelStyle}>Nom</label>
        <input
          autoFocus value={name} onChange={e => setBoardName(e.target.value)}
          onKeyDown={e => e.key==='Enter' && submit()}
          placeholder="ex : Pipeline Q3"
          style={inputStyle}
        />

        <label style={{ ...labelStyle, marginTop:12 }}>Visibilité</label>
        <div style={{ display:'flex', gap:8 }}>
          {[
            { v:'workspace', icon:<Users size={14}/>, label:'Workspace' },
            { v:'private',   icon:<Lock size={14}/>, label:'Privé' },
          ].map(({ v, icon, label }) => (
            <button
              key={v}
              onClick={() => setVis(v)}
              style={{
                flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                padding:'8px 0', borderRadius:8, fontSize:'0.8rem', fontWeight:600, cursor:'pointer',
                border: visibility===v ? '2px solid var(--accent)' : '2px solid var(--border)',
                background: visibility===v ? 'var(--accent)15' : 'transparent',
                color: visibility===v ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:20 }}>
          <button onClick={onClose} style={ghostBtnStyle}>Annuler</button>
          <button onClick={submit} disabled={!name.trim() || busy} style={primaryBtnStyle}>
            {busy ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : 'Créer'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Board card in grid ──────────────────────────────────────────────────────
function BoardCard({ board, onClick }) {
  return (
    <motion.div
      whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
      onClick={onClick}
      style={{
        borderRadius:12, overflow:'hidden', cursor:'pointer',
        border:'1px solid var(--border)',
        boxShadow:'0 2px 8px rgba(0,0,0,.06)',
      }}
    >
      <div style={{
        height:80, background: board.background || BG_PRESETS[0].value,
        display:'flex', alignItems:'flex-end', padding:'10px 12px',
      }}>
        <div style={{
          background:'rgba(0,0,0,.35)', borderRadius:6,
          padding:'2px 8px', fontSize:'0.75rem', color:'#fff',
          display:'flex', alignItems:'center', gap:4,
        }}>
          {board.visibility === 'private' ? <Lock size={10}/> : <Globe size={10}/>}
          {board.visibility === 'private' ? 'Privé' : 'Workspace'}
        </div>
      </div>
      <div style={{ padding:'10px 12px', background:'var(--bg-subtle)' }}>
        <div style={{ fontWeight:700, fontSize:'0.9rem', marginBottom:4 }}>{board.name}</div>
        <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', display:'flex', gap:10 }}>
          <span>{board.listCount || 0} listes</span>
          <span>{board.cardCount || 0} cartes</span>
        </div>
      </div>
    </motion.div>
  );
}

// ── New-board "+" card ──────────────────────────────────────────────────────
function NewBoardCard({ onClick }) {
  return (
    <motion.div
      whileHover={{ scale:1.02, background:'var(--bg-card)' }}
      whileTap={{ scale:0.98 }}
      onClick={onClick}
      style={{
        borderRadius:12, border:'2px dashed var(--border)', cursor:'pointer',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        gap:8, minHeight:140, color:'var(--text-muted)', transition:'background .2s',
      }}
    >
      <div style={{
        width:36, height:36, borderRadius:'50%', background:'var(--bg-subtle)',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <Plus size={18}/>
      </div>
      <span style={{ fontSize:'0.8rem', fontWeight:600 }}>Nouveau tableau</span>
    </motion.div>
  );
}

// ── Board grid (workspace home) ─────────────────────────────────────────────
function BoardGrid({ workspaceId, onSelectBoard, isAdmin }) {
  const [boards, setBoards]           = useState([]);
  const [showCreate, setShowCreate]   = useState(false);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsub = MissionsFS.subscribeBoards(workspaceId, data => {
      setBoards(data);
      setLoading(false);
    });
    return unsub;
  }, [workspaceId]);

  if (loading) return <Spinner />;

  return (
    <>
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))',
        gap:14, padding:'4px 0',
      }}>
        {boards.map(b => (
          <BoardCard key={b.id} board={b} onClick={() => onSelectBoard(b)} />
        ))}
        {isAdmin && <NewBoardCard onClick={() => setShowCreate(true)} />}
      </div>

      <AnimatePresence>
        {showCreate && (
          <CreateBoardModal
            workspaceId={workspaceId}
            onCreated={id => {
              setShowCreate(false);
              const created = boards.find(b => b.id === id);
              if (created) onSelectBoard(created);
            }}
            onClose={() => setShowCreate(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HUB
// ─────────────────────────────────────────────────────────────────────────────

export default function MissionsHub() {
  const uid              = useStore(s => s.user?.uid || s.user?.id);

  const workspaces       = useMissionsStore(s => s.workspaces);
  const workspacesLoaded = useMissionsStore(s => s.workspacesLoaded);
  const subscribeWorkspaces = useMissionsStore(s => s.subscribeWorkspaces);
  const unsubscribeAll   = useMissionsStore(s => s.unsubscribeAll);
  const cardDetail       = useMissionsStore(s => s.cardDetail);
  const subscribeBoard   = useMissionsStore(s => s.subscribeBoard);

  const [activeWsId, setActiveWsId]     = useState(null);
  const [activeBoard, setActiveBoard]   = useState(null);   // full BoardDoc
  const [showCreateWs, setShowCreateWs] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showButler, setShowButler]     = useState(false);
  const [sidebarCollapsed, setSidebar]  = useState(false);
  const autoSelected = useRef(false);

  const wsAuth = useWorkspaceAuth(activeWsId);

  // Subscribe to workspaces once
  useEffect(() => {
    if (!uid) return;
    subscribeWorkspaces(uid);
    return () => unsubscribeAll();
  }, [uid]);

  // Auto-select first workspace — ref guard prevents the spin loop
  useEffect(() => {
    if (!autoSelected.current && workspaces.length > 0) {
      setActiveWsId(workspaces[0].id);
      autoSelected.current = true;
    }
  }, [workspaces]);

  // Seed 9 department workspaces on first-ever load (localStorage flag prevents re-seeding)
  useEffect(() => {
    if (!uid || !workspacesLoaded) return;
    if (workspaces.length === 0) {
      seedDefaultWorkspaces(uid).catch(err =>
        console.warn('[MissionsHub] Seeding failed:', err)
      );
    }
  }, [uid, workspacesLoaded, workspaces.length]);

  // Subscribe board data when a board is selected
  useEffect(() => {
    if (activeBoard?.id) {
      subscribeBoard(activeBoard.id);
    }
  }, [activeBoard?.id]);

  const selectWorkspace = useCallback((wsId) => {
    setActiveWsId(wsId);
    setActiveBoard(null);
    setShowButler(false);
    setShowSettings(false);
  }, []);

  const selectBoard = useCallback((board) => {
    setActiveBoard(board);
    setShowButler(false);
    setShowSettings(false);
  }, []);

  const activeWs = workspaces.find(w => w.id === activeWsId);

  // ── Sidebar ──────────────────────────────────────────────────────────────
  const sidebar = (
    <motion.div
      animate={{ width: sidebarCollapsed ? 54 : 220 }}
      transition={{ duration:.2, ease:'easeInOut' }}
      style={{
        height:'100%', background:'var(--bg-subtle)', borderRight:'1px solid var(--border)',
        display:'flex', flexDirection:'column', overflow:'hidden', flexShrink:0,
      }}
    >
      {/* Header */}
      <div style={{
        padding: sidebarCollapsed ? '14px 8px' : '14px 12px',
        display:'flex', alignItems:'center', gap:8,
        borderBottom:'1px solid var(--border)',
      }}>
        <Rocket size={18} style={{ color:'var(--accent)', flexShrink:0 }} />
        {!sidebarCollapsed && (
          <span style={{ fontWeight:800, fontSize:'0.9rem', flex:1 }}>Missions</span>
        )}
        <button
          onClick={() => setSidebar(v => !v)}
          style={{ ...iconBtnStyle, marginLeft:'auto' }}
          title={sidebarCollapsed ? 'Ouvrir' : 'Réduire'}
        >
          <ChevronRight size={15} style={{ transform: sidebarCollapsed ? 'none' : 'rotate(180deg)', transition:'transform .2s' }} />
        </button>
      </div>

      {/* Workspace list */}
      <div style={{ flex:1, overflowY:'auto', padding:'8px 6px' }}>
        {workspaces.map(ws => (
          <button
            key={ws.id}
            onClick={() => selectWorkspace(ws.id)}
            title={ws.name}
            style={{
              width:'100%', display:'flex', alignItems:'center', gap:10,
              padding: sidebarCollapsed ? '8px' : '8px 10px',
              borderRadius:8, border:'none', cursor:'pointer',
              background: activeWsId===ws.id ? 'var(--accent)20' : 'transparent',
              color: activeWsId===ws.id ? 'var(--accent)' : 'var(--text)',
              transition:'background .15s', marginBottom:2,
            }}
          >
            <WsAvatar ws={ws} size={28} />
            {!sidebarCollapsed && (
              <span style={{ fontSize:'0.82rem', fontWeight:600, textAlign:'left', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>
                {ws.name}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* New workspace */}
      <div style={{ padding:'8px 6px', borderTop:'1px solid var(--border)' }}>
        <button
          onClick={() => setShowCreateWs(true)}
          title="Nouvel espace de travail"
          style={{
            width:'100%', display:'flex', alignItems:'center', gap:8,
            padding: sidebarCollapsed ? '8px' : '8px 10px',
            borderRadius:8, border:'1px dashed var(--border)', cursor:'pointer',
            background:'transparent', color:'var(--text-muted)', fontSize:'0.8rem',
          }}
        >
          <Plus size={16} style={{ flexShrink:0 }} />
          {!sidebarCollapsed && 'Nouveau workspace'}
        </button>
      </div>
    </motion.div>
  );

  // ── Main content ─────────────────────────────────────────────────────────
  const mainContent = activeWs ? (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

      {/* Workspace header bar */}
      <div style={{
        display:'flex', alignItems:'center', gap:12, padding:'10px 20px',
        borderBottom:'1px solid var(--border)', background:'var(--bg)',
        flexShrink:0,
      }}>
        <WsAvatar ws={activeWs} size={32} />
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700, fontSize:'1rem' }}>{activeWs.name}</div>
          {activeWs.description && (
            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{activeWs.description}</div>
          )}
        </div>

        {/* Breadcrumb if board is open */}
        {activeBoard && (
          <>
            <ChevronRight size={14} style={{ color:'var(--text-muted)' }} />
            <span style={{ fontSize:'0.85rem', fontWeight:600 }}>{activeBoard.name}</span>
            <button
              onClick={() => setActiveBoard(null)}
              style={{ ...iconBtnStyle, marginLeft:4 }}
              title="Retour aux tableaux"
            >
              <LayoutGrid size={15} />
            </button>
          </>
        )}

        <div style={{ display:'flex', gap:6, marginLeft:'auto' }}>
          {activeBoard && wsAuth.isAdmin && (
            <button
              onClick={() => setShowButler(v => !v)}
              style={{
                ...ghostBtnStyle, display:'flex', alignItems:'center', gap:6,
                background: showButler ? 'var(--accent)15' : undefined,
                color: showButler ? 'var(--accent)' : undefined,
              }}
              title="Butler (automatisations)"
            >
              <Zap size={15} />
              <span style={{ fontSize:'0.78rem' }}>Butler</span>
            </button>
          )}
          {wsAuth.isAdmin && (
            <button
              onClick={() => setShowSettings(v => !v)}
              style={{
                ...ghostBtnStyle, display:'flex', alignItems:'center', gap:6,
                background: showSettings ? 'var(--accent)15' : undefined,
                color: showSettings ? 'var(--accent)' : undefined,
              }}
              title="Paramètres du workspace"
            >
              <Settings size={15} />
              {!activeBoard && <span style={{ fontSize:'0.78rem' }}>Paramètres</span>}
            </button>
          )}
        </div>
      </div>

      {/* Content area */}
      <div style={{ flex:1, display:'flex', overflow:'hidden', position:'relative' }}>

        {/* Board view or board grid */}
        <div style={{ flex:1, overflow:'auto' }}>
          <Suspense fallback={<Spinner />}>
            {activeBoard ? (
              <MissionsBoard
                boardId={activeBoard.id}
                workspaceId={activeWsId}
              />
            ) : (
              <div style={{ padding:'24px 28px' }}>
                <div style={{
                  display:'flex', alignItems:'center', gap:8, marginBottom:20,
                }}>
                  <LayoutGrid size={18} style={{ color:'var(--accent)' }} />
                  <h2 style={{ margin:0, fontSize:'1rem', fontWeight:700 }}>Tableaux</h2>
                </div>
                <BoardGrid
                  workspaceId={activeWsId}
                  onSelectBoard={selectBoard}
                  isAdmin={wsAuth.isAdmin}
                />
              </div>
            )}
          </Suspense>
        </div>

        {/* Butler panel (slide-in) */}
        <AnimatePresence>
          {showButler && activeBoard && (
            <motion.div
              initial={{ width:0, opacity:0 }} animate={{ width:340, opacity:1 }}
              exit={{ width:0, opacity:0 }} transition={{ duration:.2 }}
              style={{
                borderLeft:'1px solid var(--border)', background:'var(--bg)',
                overflow:'auto', flexShrink:0,
              }}
            >
              <Suspense fallback={<Spinner />}>
                <ButlerPanel boardId={activeBoard.id} />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  ) : (
    /* No workspace selected / empty state */
    <div style={{
      flex:1, display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', gap:16, opacity:.6,
    }}>
      <Rocket size={48} />
      <div style={{ textAlign:'center' }}>
        <div style={{ fontWeight:700, fontSize:'1.1rem', marginBottom:6 }}>
          {workspaces.length === 0 ? 'Aucun espace de travail' : 'Sélectionnez un workspace'}
        </div>
        {workspaces.length === 0 && (
          <button onClick={() => setShowCreateWs(true)} style={primaryBtnStyle}>
            Créer mon premier workspace
          </button>
        )}
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display:'flex', height:'100%', overflow:'hidden', background:'var(--bg)' }}>
      {sidebar}
      {mainContent}

      {/* Card detail modal */}
      <AnimatePresence>
        {cardDetail && (
          <Suspense fallback={null}>
            <CardModal />
          </Suspense>
        )}
      </AnimatePresence>

      {/* Workspace settings panel (full-screen overlay) */}
      <AnimatePresence>
        {showSettings && activeWsId && (
          <Suspense fallback={null}>
            <WorkspaceSettings
              workspaceId={activeWsId}
              onClose={() => setShowSettings(false)}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* Workspace creation modal */}
      <AnimatePresence>
        {showCreateWs && (
          <CreateWorkspaceModal
            onCreated={id => {
              setShowCreateWs(false);
              setActiveWsId(id);
            }}
            onClose={() => setShowCreateWs(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Shared micro-styles ─────────────────────────────────────────────────────
const overlayStyle = {
  position:'fixed', inset:0, background:'rgba(0,0,0,.5)',
  display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000,
};
const modalStyle = {
  background:'var(--bg)', borderRadius:16, padding:24, width:420,
  maxWidth:'90vw', boxShadow:'0 20px 60px rgba(0,0,0,.25)',
};
const labelStyle = {
  display:'block', fontSize:'0.78rem', fontWeight:600,
  color:'var(--text-muted)', marginBottom:4,
};
const inputStyle = {
  width:'100%', padding:'8px 10px', borderRadius:8,
  border:'1px solid var(--border)', background:'var(--bg-subtle)',
  color:'var(--text)', fontSize:'0.875rem', boxSizing:'border-box',
  outline:'none',
};
const primaryBtnStyle = {
  padding:'8px 18px', borderRadius:8, background:'var(--accent)',
  color:'#fff', border:'none', fontWeight:600, fontSize:'0.85rem',
  cursor:'pointer', display:'flex', alignItems:'center', gap:6,
};
const ghostBtnStyle = {
  padding:'6px 12px', borderRadius:8, background:'transparent',
  color:'var(--text)', border:'1px solid var(--border)',
  fontWeight:600, fontSize:'0.85rem', cursor:'pointer',
};
const iconBtnStyle = {
  width:28, height:28, borderRadius:6, background:'transparent',
  border:'none', cursor:'pointer', display:'flex',
  alignItems:'center', justifyContent:'center', color:'var(--text-muted)',
};
