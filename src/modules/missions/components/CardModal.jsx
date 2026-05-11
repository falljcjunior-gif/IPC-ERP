/**
 * CardModal — Modale complète d'une carte Missions
 *
 * Layout : 2 colonnes
 *   LEFT  (flex: 1) — Titre · Description Markdown · Checklists · Activité
 *   RIGHT (280px)   — Sidebar : Labels · Dates · Custom Fields · Liens ERP
 *
 * Toutes les modifications passent par useMissionsStore.updateCard (Optimistic UI).
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Archive, CheckSquare, Paperclip, AlignLeft,
  Activity, ExternalLink, Clock, Tag,
} from 'lucide-react';
import { useMissionsStore } from '../store/useMissionsStore';
import { MissionsFS } from '../services/missions.firestore';
import { useStore } from '../../../store';
import MarkdownEditor from './MarkdownEditor';
import ChecklistSection from './ChecklistSection';
import ActivityLog from './ActivityLog';
import CardSidebar from './CardSidebar';

// ── Sous-section header ───────────────────────────────────────────

const SectionHeader = ({ icon, title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
    {React.cloneElement(icon, { size: 16, color: '#64748B' })}
    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {title}
    </span>
  </div>
);

// ── Attachments section ───────────────────────────────────────────

const AttachmentsSection = ({ cardId, uid }) => {
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading]     = useState(false);
  const [progress, setProgress]       = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!cardId) return;
    const unsub = MissionsFS.subscribeAttachments(cardId, setAttachments);
    return unsub;
  }, [cardId]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      await MissionsFS.uploadAttachment(cardId, file, uid, setProgress);
    } finally {
      setUploading(false);
      setProgress(0);
      e.target.value = '';
    }
  };

  const getMimeIcon = (mime = '') => {
    if (mime.startsWith('image/')) return '🖼️';
    if (mime.includes('pdf')) return '📄';
    if (mime.includes('sheet') || mime.includes('excel')) return '📊';
    if (mime.includes('word') || mime.includes('document')) return '📝';
    return '📎';
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.75rem' }}>
        {attachments.map(a => (
          <a
            key={a.id}
            href={a.downloadUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.4rem 0.75rem', borderRadius: '0.625rem',
              border: '1px solid #E2E8F0', background: '#F8FAFC',
              color: '#1E293B', textDecoration: 'none', fontSize: '0.8rem',
              fontWeight: 600, transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
            onMouseLeave={e => e.currentTarget.style.background = '#F8FAFC'}
          >
            <span>{getMimeIcon(a.mimeType)}</span>
            <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {a.name}
            </span>
            <ExternalLink size={11} color="#94A3B8" />
          </a>
        ))}
      </div>

      {/* Upload */}
      <input ref={fileInputRef} type="file" onChange={handleUpload} style={{ display: 'none' }} />
      {uploading ? (
        <div>
          <div style={{ height: '4px', background: '#F1F5F9', borderRadius: '999px', marginBottom: '0.4rem' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: '#8B5CF6', borderRadius: '999px', transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Envoi… {progress}%</span>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.45rem 0.875rem', borderRadius: '0.5rem',
            background: '#F1F5F9', border: 'none', cursor: 'pointer',
            color: '#475569', fontSize: '0.8rem', fontWeight: 700,
          }}
        >
          <Paperclip size={13} /> Joindre un fichier
        </button>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// CARD MODAL
// ─────────────────────────────────────────────────────────────────

const CardModal = () => {
  const { user }       = useStore();
  const uid            = user?.uid || user?.id || 'anonymous';
  const userName       = user?.nom || user?.displayName || uid.slice(0, 6);

  const cardDetail     = useMissionsStore(s => s.cardDetail);
  const activeBoardId  = useMissionsStore(s => s.activeBoardId);
  const board          = useMissionsStore(s => s.boards[activeBoardId]);
  const closeCardDetail= useMissionsStore(s => s.closeCardDetail);
  const updateCard     = useMissionsStore(s => s.updateCard);
  const isPending      = useMissionsStore(s => s.isPending);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft]     = useState('');
  const titleRef = useRef(null);

  const card = cardDetail;

  // Sync title draft quand la carte change
  useEffect(() => {
    if (card) setTitleDraft(card.title);
  }, [card?.id]);

  // Focus title input
  useEffect(() => {
    if (editingTitle) titleRef.current?.focus();
  }, [editingTitle]);

  // Fermeture sur Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') closeCardDetail(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeCardDetail]);

  const handleUpdateCard = useCallback((data, activityMeta) => {
    if (!card) return;
    updateCard(card.id, data, uid, activityMeta);
  }, [card, uid, updateCard]);

  const commitTitle = () => {
    if (titleDraft.trim() && titleDraft !== card?.title) {
      handleUpdateCard({ title: titleDraft.trim() }, { type: 'card_renamed' });
    }
    setEditingTitle(false);
  };

  const handleAddLink = async (link) => {
    if (!card) return;
    await MissionsFS.addErpLink(card.id, link, uid);
  };

  const handleRemoveLink = async (entityId) => {
    if (!card) return;
    await MissionsFS.removeErpLink(card.id, entityId, uid);
  };

  if (!card) return null;

  const coverColor = card.cover?.type === 'color' ? card.cover.value : null;
  const pending    = isPending(card.id);

  // Labels sélectionnées
  const selectedLabels = (board?.labels || []).filter(l => card.labelIds?.includes(l.id));

  return (
    <AnimatePresence>
      {card && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCardDetail}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 9000,
            }}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed', inset: 0,
              zIndex: 9001,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '1.5rem',
              pointerEvents: 'none',
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                pointerEvents: 'auto',
                width: '100%', maxWidth: '860px', maxHeight: '92vh',
                background: 'white', borderRadius: '1.5rem',
                overflow: 'hidden', display: 'flex', flexDirection: 'column',
                boxShadow: '0 25px 60px -10px rgba(0,0,0,0.35)',
                border: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              {/* Cover color */}
              {coverColor && (
                <div style={{ height: '80px', background: coverColor, flexShrink: 0 }} />
              )}

              {/* Header */}
              <div style={{
                padding: '1.5rem 1.75rem 1rem',
                borderBottom: '1px solid #F1F5F9',
                flexShrink: 0,
              }}>
                {/* Labels inline */}
                {selectedLabels.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    {selectedLabels.map(l => (
                      <span key={l.id} style={{
                        padding: '2px 10px', borderRadius: '999px',
                        background: l.color, color: 'white',
                        fontSize: '0.7rem', fontWeight: 700,
                      }}>
                        {l.name}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  {/* Titre */}
                  {editingTitle ? (
                    <textarea
                      ref={titleRef}
                      value={titleDraft}
                      onChange={e => setTitleDraft(e.target.value)}
                      onBlur={commitTitle}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitTitle(); } if (e.key === 'Escape') { setTitleDraft(card.title); setEditingTitle(false); } }}
                      rows={2}
                      style={{
                        flex: 1, fontSize: '1.35rem', fontWeight: 800, color: '#0F172A',
                        border: 'none', outline: 'none', resize: 'none',
                        fontFamily: 'inherit', background: '#F8FAFC',
                        borderRadius: '0.5rem', padding: '0.3rem 0.5rem',
                        lineHeight: 1.3,
                      }}
                    />
                  ) : (
                    <h2
                      onClick={() => setEditingTitle(true)}
                      style={{
                        flex: 1, fontSize: '1.35rem', fontWeight: 800, color: '#0F172A',
                        margin: 0, cursor: 'text', lineHeight: 1.3,
                        padding: '0.3rem 0',
                      }}
                    >
                      {card.title}
                      {pending && (
                        <span style={{
                          display: 'inline-block', width: '8px', height: '8px',
                          borderRadius: '50%', background: '#8B5CF6',
                          marginLeft: '0.5rem', verticalAlign: 'middle',
                          animation: 'pulse 1s ease-in-out infinite',
                        }} />
                      )}
                    </h2>
                  )}

                  {/* Actions header */}
                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                    <button
                      onClick={() => handleUpdateCard({ isArchived: true })}
                      title="Archiver"
                      style={{ background: '#F1F5F9', border: 'none', padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer', color: '#64748B', display: 'flex' }}
                    >
                      <Archive size={16} />
                    </button>
                    <button
                      onClick={closeCardDetail}
                      style={{ background: '#F1F5F9', border: 'none', padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer', color: '#64748B', display: 'flex' }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* Méta (liste + membres) */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.75rem', color: '#94A3B8', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={11} />
                    {card.dueDate
                      ? new Date(card.dueDate.seconds * 1000).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })
                      : 'Pas d\'échéance'
                    }
                  </span>
                  {card.members?.length > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Tag size={11} /> {card.members.length} membre{card.members.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Body — scroll */}
              <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* LEFT */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.75rem' }}>

                  {/* Description */}
                  <div style={{ marginBottom: '2rem' }}>
                    <SectionHeader icon={<AlignLeft />} title="Description" />
                    <MarkdownEditor
                      value={card.description || ''}
                      onChange={val => handleUpdateCard(
                        { description: val },
                        { type: 'description_updated' }
                      )}
                      placeholder="Décrivez cette carte en Markdown…&#10;&#10;# Titre&#10;- Item 1&#10;- Item 2&#10;&#10;**Important** : _notes_"
                    />
                  </div>

                  {/* Checklists */}
                  <div style={{ marginBottom: '2rem' }}>
                    <SectionHeader icon={<CheckSquare />} title="Checklists" />
                    <ChecklistSection
                      cardId={card.id}
                      cardProgress={card.checklistProgress}
                      uid={uid}
                    />
                  </div>

                  {/* Pièces jointes */}
                  <div style={{ marginBottom: '2rem' }}>
                    <SectionHeader icon={<Paperclip />} title="Pièces Jointes" />
                    <AttachmentsSection cardId={card.id} uid={uid} />
                  </div>

                  {/* Journal d'activité */}
                  <div>
                    <SectionHeader icon={<Activity />} title="Activité & Commentaires" />
                    <ActivityLog cardId={card.id} uid={uid} userName={userName} />
                  </div>
                </div>

                {/* RIGHT — Sidebar */}
                <div style={{
                  width: '230px', flexShrink: 0,
                  borderLeft: '1px solid #F1F5F9',
                  overflowY: 'auto',
                  padding: '1.25rem 0.75rem',
                  background: '#FAFAFA',
                }}>
                  <CardSidebar
                    card={card}
                    board={board}
                    uid={uid}
                    onUpdate={handleUpdateCard}
                    onAddLink={handleAddLink}
                    onRemoveLink={handleRemoveLink}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }`}</style>
        </>
      )}
    </AnimatePresence>
  );
};

export default CardModal;
