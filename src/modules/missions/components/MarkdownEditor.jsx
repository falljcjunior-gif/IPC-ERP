/**
 * MarkdownEditor — Éditeur write/preview avec debounce autosave
 * Write mode  : <textarea> brut
 * Preview mode: HTML sanitisé rendu via marked + DOMPurify
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Eye, Edit3 } from 'lucide-react';

// Configure marked : GFM + line breaks
marked.setOptions({ gfm: true, breaks: true });

const MarkdownEditor = ({ value = '', onChange, placeholder = 'Ajoutez une description en Markdown…', autoSaveDelay = 800 }) => {
  const [mode, setMode]       = useState('write');
  const [draft, setDraft]     = useState(value);
  const [saving, setSaving]   = useState(false);
  const timerRef              = useRef(null);
  const textareaRef           = useRef(null);

  // Sync externe → draft (ex : rechargement de la carte)
  useEffect(() => { setDraft(value); }, [value]);

  // Autofocus à l'entrée en write mode
  useEffect(() => {
    if (mode === 'write') textareaRef.current?.focus();
  }, [mode]);

  const handleChange = useCallback((e) => {
    const v = e.target.value;
    setDraft(v);
    setSaving(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(v);
      setSaving(false);
    }, autoSaveDelay);
  }, [onChange, autoSaveDelay]);

  // Nettoyage timer au démontage
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const renderedHtml = DOMPurify.sanitize(marked.parse(draft || ''));

  return (
    <div style={{ position: 'relative' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '0.5rem', padding: '2px' }}>
          <button
            onClick={() => setMode('write')}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '4px 10px', borderRadius: '0.4rem', border: 'none',
              cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
              background: mode === 'write' ? 'white' : 'transparent',
              color: mode === 'write' ? '#8B5CF6' : '#64748B',
              boxShadow: mode === 'write' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            <Edit3 size={12} /> Écrire
          </button>
          <button
            onClick={() => setMode('preview')}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '4px 10px', borderRadius: '0.4rem', border: 'none',
              cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
              background: mode === 'preview' ? 'white' : 'transparent',
              color: mode === 'preview' ? '#8B5CF6' : '#64748B',
              boxShadow: mode === 'preview' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            <Eye size={12} /> Aperçu
          </button>
        </div>
        {saving && (
          <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 600 }}>
            Sauvegarde…
          </span>
        )}
      </div>

      {/* Write */}
      {mode === 'write' && (
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={handleChange}
          placeholder={placeholder}
          rows={6}
          style={{
            width: '100%', padding: '0.75rem', borderRadius: '0.75rem',
            border: '1.5px solid #E2E8F0', fontSize: '0.875rem',
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            lineHeight: 1.6, resize: 'vertical', outline: 'none',
            boxSizing: 'border-box', color: '#1E293B',
            transition: 'border 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = '#8B5CF6'}
          onBlur={e  => e.target.style.borderColor = '#E2E8F0'}
        />
      )}

      {/* Preview */}
      {mode === 'preview' && (
        <div
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
          style={{
            minHeight: '120px', padding: '0.75rem',
            borderRadius: '0.75rem', border: '1px solid #E2E8F0',
            fontSize: '0.875rem', lineHeight: 1.7, color: '#1E293B',
            background: '#FAFAFA',
          }}
          className="md-preview"
        />
      )}

      {/* CSS markdown styles (injection globale minimale) */}
      <style>{`
        .md-preview h1,.md-preview h2,.md-preview h3{font-weight:800;margin:0.75em 0 0.25em;color:#0F172A}
        .md-preview h1{font-size:1.2rem}.md-preview h2{font-size:1.05rem}.md-preview h3{font-size:0.95rem}
        .md-preview p{margin:0.4em 0}
        .md-preview ul,.md-preview ol{padding-left:1.25em;margin:0.4em 0}
        .md-preview li{margin:0.2em 0}
        .md-preview code{background:#F1F5F9;padding:1px 5px;border-radius:4px;font-size:0.8em;font-family:monospace;color:#8B5CF6}
        .md-preview pre{background:#1E293B;color:#E2E8F0;padding:0.75em;border-radius:0.5rem;overflow-x:auto;font-size:0.8em}
        .md-preview blockquote{border-left:3px solid #8B5CF6;padding-left:0.75em;color:#64748B;margin:0.5em 0}
        .md-preview a{color:#8B5CF6;text-decoration:underline}
        .md-preview strong{font-weight:800}
        .md-preview hr{border:none;border-top:1px solid #E2E8F0;margin:0.75em 0}
        .md-preview table{border-collapse:collapse;width:100%;font-size:0.85em}
        .md-preview th,.md-preview td{border:1px solid #E2E8F0;padding:0.4em 0.75em}
        .md-preview th{background:#F8FAFC;font-weight:700}
      `}</style>
    </div>
  );
};

export default React.memo(MarkdownEditor);
