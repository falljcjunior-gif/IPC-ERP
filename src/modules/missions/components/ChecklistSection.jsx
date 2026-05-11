/**
 * ChecklistSection — Checklists dans la modale de carte
 * Chaque checklist est une sous-collection Firestore.
 * Items = array dans le document checklist (max ~100, jamais > 1MB).
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Square, Plus, Trash2, GripVertical, X } from 'lucide-react';
import { MissionsFS } from '../services/missions.firestore';
import { nanoid } from 'nanoid';

// ── Barre de progression ─────────────────────────────────────────

const ProgressBar = ({ complete, total }) => {
  const pct = total > 0 ? Math.round((complete / total) * 100) : 0;
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: pct === 100 ? '#10B981' : '#64748B' }}>
          {pct}%
        </span>
        <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{complete}/{total}</span>
      </div>
      <div style={{ height: '4px', background: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{
            height: '100%', borderRadius: '999px',
            background: pct === 100 ? '#10B981' : '#8B5CF6',
          }}
        />
      </div>
    </div>
  );
};

// ── Item individuel ───────────────────────────────────────────────

const CheckItem = ({ item, onToggle, onDelete, onRename }) => {
  const [editing, setEditing] = useState(false);
  const [text, setText]       = useState(item.text);
  const inputRef              = useRef(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const commit = () => {
    if (text.trim() && text !== item.text) onRename(item.id, text.trim());
    setEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.3rem 0', group: true }}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(item.id, !item.complete)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', marginTop: '1px', flexShrink: 0 }}
      >
        {item.complete
          ? <CheckSquare size={16} color="#10B981" />
          : <Square size={16} color="#CBD5E1" />
        }
      </button>

      {/* Texte / éditeur inline */}
      {editing ? (
        <input
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setText(item.text); setEditing(false); } }}
          style={{
            flex: 1, border: 'none', outline: 'none', fontSize: '0.875rem',
            background: 'transparent', fontFamily: 'inherit', color: '#1E293B',
          }}
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          style={{
            flex: 1, fontSize: '0.875rem', lineHeight: 1.5, cursor: 'text',
            color: item.complete ? '#94A3B8' : '#1E293B',
            textDecoration: item.complete ? 'line-through' : 'none',
            transition: 'color 0.2s',
          }}
        >
          {item.text}
        </span>
      )}

      {/* Supprimer */}
      <button
        onClick={() => onDelete(item.id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', padding: '2px', flexShrink: 0, opacity: 0, transition: 'opacity 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.style.opacity = '0'}
      >
        <X size={13} />
      </button>
    </motion.div>
  );
};

// ── Checklist complète ────────────────────────────────────────────

const Checklist = ({ checklist, cardId, cardProgress, uid }) => {
  const [addingItem, setAddingItem] = useState(false);
  const [newItemText, setNewItemText] = useState('');

  const complete = checklist.items.filter(i => i.complete).length;
  const total    = checklist.items.length;

  const addItem = async () => {
    if (!newItemText.trim()) { setAddingItem(false); return; }
    const newItem = {
      id: nanoid(), text: newItemText.trim(),
      complete: false, assignee: null, dueDate: null,
      completedAt: null, completedBy: null,
    };
    const { doc, updateDoc } = await import('firebase/firestore');
    const { db } = await import('../../../firebase/config');
    const clRef = doc(db, 'missions_cards', cardId, 'checklists', checklist.id);
    await updateDoc(clRef, { items: [...checklist.items, newItem] });
    setNewItemText('');
    setAddingItem(false);
  };

  const toggleItem = async (itemId, complete) => {
    await MissionsFS.toggleChecklistItem(cardId, checklist.id, itemId, complete, uid, cardProgress);
  };

  const deleteItem = async (itemId) => {
    const { doc, updateDoc } = await import('firebase/firestore');
    const { db } = await import('../../../firebase/config');
    const clRef = doc(db, 'missions_cards', cardId, 'checklists', checklist.id);
    await updateDoc(clRef, { items: checklist.items.filter(i => i.id !== itemId) });
  };

  const renameItem = async (itemId, newText) => {
    const { doc, updateDoc } = await import('firebase/firestore');
    const { db } = await import('../../../firebase/config');
    const clRef = doc(db, 'missions_cards', cardId, 'checklists', checklist.id);
    await updateDoc(clRef, { items: checklist.items.map(i => i.id === itemId ? { ...i, text: newText } : i) });
  };

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <CheckSquare size={16} color="#8B5CF6" />
        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1E293B', flex: 1 }}>
          {checklist.title}
        </span>
        <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{complete}/{total}</span>
      </div>

      <ProgressBar complete={complete} total={total} />

      {/* Items */}
      <AnimatePresence>
        {checklist.items.map(item => (
          <CheckItem
            key={item.id}
            item={item}
            onToggle={toggleItem}
            onDelete={deleteItem}
            onRename={renameItem}
          />
        ))}
      </AnimatePresence>

      {/* Ajouter un item */}
      {addingItem ? (
        <div style={{ marginTop: '0.5rem', paddingLeft: '1.6rem' }}>
          <input
            autoFocus
            value={newItemText}
            onChange={e => setNewItemText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addItem(); if (e.key === 'Escape') { setAddingItem(false); setNewItemText(''); } }}
            placeholder="Nouvel élément…"
            style={{
              width: '100%', padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem', border: '1.5px solid #8B5CF6',
              fontSize: '0.875rem', outline: 'none',
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
            <button onClick={addItem} style={{ padding: '0.35rem 0.75rem', borderRadius: '0.4rem', background: '#8B5CF6', color: 'white', border: 'none', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
              Ajouter
            </button>
            <button onClick={() => { setAddingItem(false); setNewItemText(''); }} style={{ padding: '0.35rem', background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '0.8rem' }}>
              ✕
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAddingItem(true)}
          style={{
            marginTop: '0.4rem', marginLeft: '1.6rem',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#94A3B8', fontSize: '0.8rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '0.3rem 0',
          }}
        >
          <Plus size={12} /> Ajouter un élément
        </button>
      )}
    </div>
  );
};

// ── Export principal ──────────────────────────────────────────────

const ChecklistSection = ({ cardId, cardProgress, uid }) => {
  const [checklists, setChecklists] = useState([]);
  const [addingCl, setAddingCl]     = useState(false);
  const [newClTitle, setNewClTitle] = useState('');

  useEffect(() => {
    if (!cardId) return;
    const unsub = MissionsFS.subscribeChecklists(cardId, setChecklists);
    return unsub;
  }, [cardId]);

  const createChecklist = async () => {
    if (!newClTitle.trim()) { setAddingCl(false); return; }
    await MissionsFS.createChecklist(cardId, newClTitle.trim(), uid);
    setNewClTitle('');
    setAddingCl(false);
  };

  return (
    <div>
      {checklists.map(cl => (
        <Checklist key={cl.id} checklist={cl} cardId={cardId} cardProgress={cardProgress} uid={uid} />
      ))}

      {addingCl ? (
        <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '0.75rem', border: '1.5px solid #8B5CF6', marginBottom: '0.75rem' }}>
          <input
            autoFocus
            value={newClTitle}
            onChange={e => setNewClTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') createChecklist(); if (e.key === 'Escape') { setAddingCl(false); setNewClTitle(''); } }}
            placeholder="Titre de la checklist…"
            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
            <button onClick={createChecklist} style={{ padding: '0.4rem 0.875rem', borderRadius: '0.4rem', background: '#8B5CF6', color: 'white', border: 'none', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
              Créer
            </button>
            <button onClick={() => { setAddingCl(false); setNewClTitle(''); }} style={{ padding: '0.4rem', background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer' }}>
              ✕
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAddingCl(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 0.875rem', borderRadius: '0.625rem',
            background: '#F1F5F9', border: 'none', cursor: 'pointer',
            color: '#475569', fontSize: '0.8rem', fontWeight: 700,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#E2E8F0'}
          onMouseLeave={e => e.currentTarget.style.background = '#F1F5F9'}
        >
          <CheckSquare size={14} /> Ajouter une checklist
        </button>
      )}
    </div>
  );
};

export default ChecklistSection;
