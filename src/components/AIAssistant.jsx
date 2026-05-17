import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, X, Zap, HelpCircle, Mic, TrendingUp, Activity, BarChart3, Target,
  CheckCircle2, Loader2, ShieldAlert, Volume2, VolumeX, CheckCircle,
  Bot, ImagePlus, XCircle, Cpu,
} from 'lucide-react';
import { getAuth } from 'firebase/auth';
import app from '../firebase/config';
import { useStore } from '../store';

// ── Config ────────────────────────────────────────────────────────
const JARVIS_STREAM_URL = import.meta.env.DEV
  ? 'http://localhost:5001/ipc-erp/us-central1/jarvisStream'
  : 'https://us-central1-ipc-erp.cloudfunctions.net/jarvisStream';

// ── Typing dots ───────────────────────────────────────────────────
const TypingDots = () => (
  <div style={{ display: 'flex', gap: '6px', padding: '6px 0' }}>
    {[0, 1, 2].map(i => (
      <motion.div key={i}
        animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
        style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--antigravity-primary)' }}
      />
    ))}
  </div>
);

// ── Speaking wave ─────────────────────────────────────────────────
const SpeakingWave = () => (
  <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
    {[0, 1, 2, 3].map(i => (
      <motion.div key={i}
        animate={{ height: [4, 16, 4] }}
        transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
        style={{ width: 3, background: 'white', borderRadius: 2, opacity: 0.85 }}
      />
    ))}
  </div>
);

// ── Tool status badge ─────────────────────────────────────────────
const TOOL_LABELS = {
  query_invoices: 'Analyse des factures', query_crm: 'Lecture CRM',
  query_stock: 'Vérification stock', query_hr: 'Données RH',
  query_finance_summary: 'Résumé financier', create_lead: 'Création lead',
  approve_leave: 'Approbation congé', create_invoice: 'Création facture',
  assign_task: 'Assignation tâche', send_alert: 'Envoi alerte',
};

const ToolBadge = ({ tools }) => (
  <motion.div
    initial={{ opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
      background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
      borderRadius: '2rem', padding: '0.4rem 0.85rem',
      fontSize: '0.72rem', fontWeight: 800, color: '#6366F1',
      letterSpacing: '0.5px',
    }}
  >
    <Loader2 size={12} className="spinner" />
    {tools.map(t => TOOL_LABELS[t] || t).join(' · ')}
  </motion.div>
);

// ── Message bubble ────────────────────────────────────────────────
const MessageBubble = ({ m, onExecuteAction }) => (
  <motion.div
    initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
    animate={{ opacity: 1, x: 0 }}
    style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
  >
    {/* Image preview in user bubble */}
    {m.imagePreview && (
      <img src={m.imagePreview} alt="Image envoyée"
        style={{ maxWidth: 220, maxHeight: 160, borderRadius: '1.25rem', objectFit: 'cover', alignSelf: 'flex-end', border: '2px solid var(--antigravity-border)' }}
      />
    )}

    <div style={{
      background: m.role === 'user' ? 'var(--antigravity-secondary)' : 'white',
      color: m.role === 'user' ? 'white' : 'var(--antigravity-text)',
      padding: '1rem 1.3rem',
      borderRadius: m.role === 'user' ? '1.5rem 1.5rem 0.4rem 1.5rem' : '1.5rem 1.5rem 1.5rem 0.4rem',
      fontSize: '0.92rem', lineHeight: 1.65,
      boxShadow: 'var(--shadow-antigravity)',
      border: '1px solid var(--antigravity-border)',
      whiteSpace: 'pre-wrap', fontWeight: 500,
    }}>
      {m.content}
      {m.streaming && (
        <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.6 }}
          style={{ display: 'inline-block', width: 2, height: '1em', background: 'var(--antigravity-primary)', marginLeft: 3, verticalAlign: 'text-bottom', borderRadius: 1 }}
        />
      )}
    </div>

    {/* Nav / Create action card */}
    {m.action && (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="antigravity-card"
        style={{ padding: '1.1rem', background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '1.25rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', fontWeight: 800, color: 'var(--antigravity-primary)', marginBottom: '0.7rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
          <Zap size={13} color="var(--antigravity-primary)" /> JARVIS Exec Protocol
        </div>
        <button onClick={() => onExecuteAction(m.action)} className="antigravity-btn"
          style={{ width: '100%', background: 'var(--antigravity-secondary)', color: 'white', border: 'none', padding: '0.8rem 1rem', borderRadius: '0.85rem', fontWeight: 800, fontSize: '0.84rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}
        >
          <CheckCircle2 size={15} />
          {m.action.type === 'NAVIGATE' ? `Ouvrir ${m.action.appId.toUpperCase()}` : `Exécuter : ${m.action.label}`}
        </button>
      </motion.div>
    )}

    {/* Write action confirmation */}
    {m.writeConfirm && (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        style={{ padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.22)', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}
      >
        <CheckCircle size={16} color="#10B981" />
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#065F46' }}>{m.writeConfirm}</span>
      </motion.div>
    )}

    {/* Error */}
    {m.error && (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.74rem', color: '#ef4444', fontWeight: 700, paddingLeft: '0.4rem' }}>
        <ShieldAlert size={13} /> {m.error}
      </div>
    )}
  </motion.div>
);

// ══ MAIN COMPONENT ════════════════════════════════════════════════
const AIAssistant = ({ spotlightOpen, setSpotlightOpen, activeModule }) => {
  const { navigateTo, data, addRecord, shellView, currentUser, userRole } = useStore();

  const [isOpen, setIsOpen]           = useState(false);
  const [query, setQuery]             = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking]   = useState(false);
  const [toolStatus, setToolStatus]   = useState(null); // array of tool names or null
  const [imageData, setImageData]     = useState(null); // { base64, mimeType, preview }

  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: `JARVIS opérationnel — Intelligence Souveraine IPC.\n\nCapacités actives : analyse données ERP, exécution d'actions, vision multimodale, mémoire long terme, workflows autonomes.\n\nQue souhaitez-vous accomplir ?`,
  }]);

  const inputRef    = useRef(null);
  const chatEndRef  = useRef(null);
  const imageInputRef = useRef(null);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages, toolStatus]);

  useEffect(() => { if (spotlightOpen && inputRef.current) inputRef.current.focus(); }, [spotlightOpen]);

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSpotlightOpen(p => !p); }
      if (e.key === 'Escape') { setSpotlightOpen(false); setIsOpen(false); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [setSpotlightOpen]);

  useEffect(() => { if (!isOpen && window.speechSynthesis) window.speechSynthesis.cancel(); }, [isOpen]);

  // ── TTS ────────────────────────────────────────────────────────
  const speak = useCallback((text) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text.replace(/\[.*?\]/g, '').substring(0, 400));
    utt.lang = 'fr-FR'; utt.rate = 1.05; utt.pitch = 0.9;
    utt.onstart = () => setIsSpeaking(true);
    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    const voices = window.speechSynthesis.getVoices();
    const frVoice = voices.find(v => v.lang === 'fr-FR' && v.name.toLowerCase().includes('male'))
                 || voices.find(v => v.lang === 'fr-FR') || voices[0];
    if (frVoice) utt.voice = frVoice;
    window.speechSynthesis.speak(utt);
  }, [voiceEnabled]);

  const toggleVoice = useCallback(() => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setVoiceEnabled(v => !v);
  }, []);

  // ── Image pick ─────────────────────────────────────────────────
  const handleImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.split(',')[1];
      setImageData({ base64, mimeType: file.type, preview: dataUrl });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ── ERP context ─────────────────────────────────────────────────
  const buildERPContext = useCallback(() => {
    const counts = {};
    if (data?.crm?.leads) counts['Leads CRM'] = data.crm.leads.length;
    if (data?.hr?.employees) counts['Employés'] = data.hr.employees.length;
    if (data?.base) Object.entries(data.base).forEach(([k, v]) => { if (Array.isArray(v) && v.length > 0) counts[k] = v.length; });
    return {
      activeModule: activeModule || 'dashboard',
      userRole: userRole || currentUser?.role || 'STAFF',
      userName: currentUser?.nom || currentUser?.email?.split('@')[0] || 'Utilisateur',
      recordCounts: counts, kpis: {},
    };
  }, [data, activeModule, userRole, currentUser]);

  // ── Process message (streaming) ─────────────────────────────────
  const processMessage = useCallback(async (input, imgData = imageData) => {
    if (!input?.trim() || isProcessing) return;
    const userInput = input.trim();
    setQuery('');
    setImageData(null);
    setIsProcessing(true);
    setToolStatus(null);

    // Add user message (with image preview if any)
    setMessages(prev => [...prev, {
      role: 'user', content: userInput,
      imagePreview: imgData?.preview || null,
    }]);

    // Optimistic nav shortcuts (no AI call needed)
    const lowInput = userInput.toLowerCase();
    const NAV_MAP = { 'crm': 'crm', 'rh': 'hr', 'hr': 'hr', 'finance': 'finance', 'vente': 'sales', 'production': 'production', 'logistique': 'logistics', 'marketing': 'marketing', 'juridique': 'legal', 'admin': 'admin', 'dashboard': 'dashboard', 'tableau de bord': 'dashboard', 'bi': 'bi', 'commerce': 'commerce' };
    const navKey = Object.keys(NAV_MAP).find(k => lowInput.startsWith('va vers ' + k) || lowInput === k || lowInput === 'ouvre ' + k);
    if (navKey) {
      navigateTo(NAV_MAP[navKey]);
      const msg = `Navigation vers ${navKey.toUpperCase()} effectuée.`;
      setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
      speak(msg);
      setSpotlightOpen(false); setIsOpen(false); setIsProcessing(false);
      return;
    }

    // Add streaming placeholder
    setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }]);

    try {
      const auth = getAuth(app);
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Non authentifié');

      const chatHistory = messages
        .filter(m => m.role && m.content && !m.error)
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const body = {
        message: userInput,
        history: chatHistory,
        erpContext: buildERPContext(),
      };
      if (imgData?.base64) {
        body.imageBase64 = imgData.base64;
        body.imageMimeType = imgData.mimeType;
      }

      const response = await fetch(JARVIS_STREAM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error(`Erreur serveur ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamedText = '';
      let finalAction = null;
      let finalWriteConfirm = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let event;
          try { event = JSON.parse(line.slice(6)); } catch { continue; }

          switch (event.type) {
            case 'text':
              streamedText += event.text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: streamedText, streaming: true };
                return updated;
              });
              break;
            case 'tool_start':
              setToolStatus(event.tools || []);
              break;
            case 'tool_done':
              setToolStatus(null);
              break;
            case 'done':
              finalAction = event.action || null;
              finalWriteConfirm = event.writeConfirm || null;
              break;
            case 'error':
              throw new Error(event.message || 'Erreur JARVIS');
          }
        }
      }

      // Finalize message
      const displayText = streamedText.replace(/\[(NAV|CREATE|AUDIT|FILTER):[^\]]+\]/g, '').trim();
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: displayText || 'Réponse reçue.',
          streaming: false,
          action: finalAction,
          writeConfirm: finalWriteConfirm,
        };
        return updated;
      });
      speak(displayText);

    } catch (err) {
      console.error('JARVIS Stream error:', err);
      const errorMsg = err.message?.includes('401') || err.message?.includes('authentifié')
        ? 'Session expirée. Reconnectez-vous.'
        : 'Interruption du canal JARVIS.';
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: errorMsg, error: err.message };
        return updated;
      });
    }

    setIsProcessing(false);
    setToolStatus(null);
  }, [isProcessing, messages, buildERPContext, navigateTo, setSpotlightOpen, speak, imageData]);

  const executeAction = useCallback((action) => {
    if (action.type === 'NAVIGATE') {
      navigateTo(action.appId);
      setSpotlightOpen(false); setIsOpen(false);
      setMessages(prev => [...prev, { role: 'assistant', content: `Module "${action.appId}" ouvert.` }]);
    } else if (action.type === 'CREATE_RECORD') {
      addRecord?.(action.appId, action.subModule, {});
      setMessages(prev => [...prev, { role: 'assistant', content: `Formulaire de création ouvert.` }]);
    }
  }, [navigateTo, addRecord, setSpotlightOpen]);

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'fr-FR';
    rec.onstart = () => setIsRecording(true);
    rec.onend = () => setIsRecording(false);
    rec.onerror = () => setIsRecording(false);
    rec.onresult = (e) => { const t = e.results[0][0].transcript; setQuery(t); processMessage(t); };
    rec.start();
  };

  const contextLabel = useMemo(() => {
    const map = { dashboard: 'GLOBAL', crm: 'VENTES', hr: 'TALENT', finance: 'CAPITAL', sales: 'COMMERCE', production: 'USINE', logistics: 'FLUX', marketing: 'MARKET', legal: 'DROIT', bi: 'BI', admin: 'SYS' };
    return map[activeModule] || 'IDLE';
  }, [activeModule]);

  // ── Chat bubble ────────────────────────────────────────────────
  const renderBubble = () => (
    <div style={{ position: 'fixed', bottom: '2.5rem', right: '2.5rem', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1.25rem' }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{ width: shellView?.mobile ? 'calc(100vw - 2.5rem)' : '440px', height: '700px', borderRadius: '2.5rem', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(40px)', border: '1px solid var(--antigravity-border)', boxShadow: '0 50px 100px -20px rgba(15,23,42,0.22)' }}
          >
            {/* Header */}
            <div style={{ padding: '1.5rem 1.75rem', background: 'var(--antigravity-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                <div className="antigravity-glow" style={{ background: 'var(--antigravity-primary)', padding: '9px', borderRadius: '12px', display: 'flex' }}>
                  <Bot size={20} color="white" />
                </div>
                <div>
                  <div style={{ fontWeight: 950, fontSize: '1.15rem', color: '#fff', letterSpacing: '-0.03em' }}>JARVIS</div>
                  <div style={{ fontSize: '0.58rem', fontWeight: 900, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: 1 }}>
                    {isSpeaking ? <SpeakingWave /> : `Secteur: ${contextLabel} · Gemini 2.5 Pro`}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button onClick={toggleVoice} title={voiceEnabled ? 'Couper la voix' : 'Activer la voix'}
                  style={{ background: voiceEnabled ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)', border: voiceEnabled ? '1px solid rgba(255,255,255,0.35)' : '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', width: 34, height: 34, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}>
                  {voiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                </button>
                <button onClick={() => setIsOpen(false)}
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', width: 34, height: 34, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', scrollbarWidth: 'none' }}>
              {messages.map((m, i) => <MessageBubble key={i} m={m} onExecuteAction={executeAction} />)}

              {/* Tool execution status */}
              <AnimatePresence>
                {toolStatus && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ alignSelf: 'flex-start' }}>
                    <ToolBadge tools={toolStatus} />
                  </motion.div>
                )}
              </AnimatePresence>

              {isProcessing && !toolStatus && messages[messages.length - 1]?.content === '' && (
                <div style={{ alignSelf: 'flex-start' }}>
                  <div style={{ background: 'white', border: '1px solid var(--antigravity-border)', padding: '0.9rem 1.25rem', borderRadius: '1.5rem 1.5rem 1.5rem 0.4rem', boxShadow: 'var(--shadow-antigravity)' }}>
                    <TypingDots />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Image preview */}
            {imageData && (
              <div style={{ padding: '0 1.5rem', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ position: 'relative' }}>
                  <img src={imageData.preview} alt="Aperçu"
                    style={{ height: 56, width: 56, objectFit: 'cover', borderRadius: '0.75rem', border: '1.5px solid var(--antigravity-border)' }}
                  />
                  <button onClick={() => setImageData(null)}
                    style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', border: 'none', color: 'white', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                    <XCircle size={14} />
                  </button>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--antigravity-text-muted)', fontWeight: 600 }}>Image jointe — JARVIS analysera cette image</span>
              </div>
            )}

            {/* Input */}
            <div style={{ padding: '1rem 1.5rem 1.25rem', borderTop: '1px solid var(--antigravity-border)', background: 'var(--bg-subtle)', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '0.6rem', background: 'white', padding: '0.5rem', borderRadius: '1.5rem', border: '1px solid var(--antigravity-border)', boxShadow: 'var(--shadow-sm)' }}>
                {/* Image picker */}
                <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImagePick} style={{ display: 'none' }} />
                <button onClick={() => imageInputRef.current?.click()}
                  title="Joindre une image"
                  style={{ color: imageData ? 'var(--antigravity-primary)' : 'var(--antigravity-text-muted)', border: 'none', background: 'transparent', padding: '0.4rem 0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <ImagePlus size={20} />
                </button>

                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); processMessage(query); } }}
                  placeholder="Instruire JARVIS..."
                  disabled={isProcessing}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--antigravity-text)', padding: '0.5rem 0.75rem', fontSize: '0.93rem', fontWeight: 600 }}
                />

                <button onClick={startVoice}
                  style={{ color: isRecording ? '#ef4444' : 'var(--antigravity-text-muted)', border: 'none', background: 'transparent', padding: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Mic size={20} />
                </button>

                <button onClick={() => processMessage(query)} disabled={isProcessing || (!query.trim() && !imageData)}
                  style={{ background: isProcessing ? 'var(--antigravity-text-muted)' : 'var(--antigravity-secondary)', color: 'white', border: 'none', width: 42, height: 42, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isProcessing ? 'not-allowed' : 'pointer', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  {isProcessing ? <Loader2 size={18} className="spinner" /> : <Send size={18} />}
                </button>
              </div>
              <div style={{ textAlign: 'center', fontSize: '0.58rem', color: 'var(--antigravity-text-muted)', marginTop: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.65 }}>
                J.A.R.V.I.S v2 · Streaming · Mémoire · Vision · Workflows
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(p => !p)}
        className="antigravity-glow"
        style={{ width: 75, height: 75, borderRadius: '24px', background: 'var(--antigravity-secondary)', color: 'white', border: 'none', boxShadow: '0 20px 50px rgba(15,23,42,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}
      >
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 3, repeat: Infinity }}
          style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, var(--antigravity-primary-glow) 0%, transparent 70%)', opacity: 0.4 }}
        />
        {isProcessing
          ? <Loader2 size={34} className="spinner" style={{ position: 'relative', zIndex: 1 }} />
          : <Zap size={34} color="white" style={{ position: 'relative', zIndex: 1 }} />}
      </motion.button>
    </div>
  );

  // ── Spotlight ─────────────────────────────────────────────────
  const renderSpotlight = () => (
    <AnimatePresence>
      {spotlightOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000 }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSpotlightOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(25px)' }}
          />
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            style={{ position: 'relative', width: 'min(92vw, 900px)', margin: '12vh auto', background: 'rgba(255,255,255,0.98)', borderRadius: '3rem', overflow: 'hidden', boxShadow: '0 80px 160px -30px rgba(15,23,42,0.4)', border: '1px solid var(--antigravity-border)' }}
          >
            <div style={{ padding: '2.5rem 3rem', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--antigravity-border)', gap: '2rem' }}>
              <div style={{ position: 'relative' }}>
                <motion.div animate={{ scale: [1, 1.6, 1], opacity: [0.1, 0.4, 0.1] }} transition={{ repeat: Infinity, duration: 3 }}
                  style={{ position: 'absolute', inset: -20, background: 'var(--antigravity-primary)', borderRadius: '50%', filter: 'blur(25px)' }}
                />
                <Bot size={36} color="var(--antigravity-primary)" style={{ position: 'relative' }} />
              </div>
              <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && query.trim()) { processMessage(query); setSpotlightOpen(false); setIsOpen(true); } }}
                placeholder="JARVIS Command… Instruisez l'IA"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--antigravity-secondary)', fontSize: '1.8rem', fontWeight: 950, letterSpacing: '-0.04em' }}
              />
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <kbd style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--antigravity-text-muted)', background: 'var(--bg-subtle)', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--antigravity-border)' }}>CMD K</kbd>
                <X size={28} color="var(--antigravity-text-muted)" style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => setSpotlightOpen(false)} />
              </div>
            </div>

            <div style={{ padding: '2.5rem 3rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 950, color: 'var(--antigravity-primary)', textTransform: 'uppercase', marginBottom: '1.75rem', letterSpacing: '4px' }}>
                JARVIS Protocol Core · Gemini 2.5 Pro
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                {[
                  { title: 'Santé Financière', icon: <TrendingUp size={22} />, tag: 'FINANCIAL CORE', q: 'Bilan de trésorerie complet' },
                  { title: 'Audit Capital Humain', icon: <Activity size={22} />, tag: 'HR TELEMETRY', q: 'Audit RH complet' },
                  { title: 'Performance Logistique', icon: <Target size={22} />, tag: 'SUPPLY CHAIN', q: 'Analyse OTIF' },
                  { title: 'Statut Usine & OEE', icon: <BarChart3 size={22} />, tag: 'INDUSTRIAL', q: 'Rapport production' },
                ].map((s, i) => (
                  <motion.div key={i}
                    whileHover={{ y: -6, borderColor: 'var(--antigravity-primary)', background: 'rgba(52,211,153,0.04)' }}
                    onClick={() => { setQuery(s.q); processMessage(s.q); setSpotlightOpen(false); setIsOpen(true); }}
                    style={{ padding: '1.5rem', background: 'white', cursor: 'pointer', border: '1px solid var(--antigravity-border)', borderRadius: '1.75rem', transition: '0.3s' }}
                  >
                    <div style={{ color: 'var(--antigravity-primary)', marginBottom: '0.85rem' }}>{s.icon}</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 950, marginBottom: '0.3rem', color: 'var(--antigravity-secondary)', letterSpacing: '-0.02em' }}>{s.title}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--antigravity-text-muted)', fontWeight: 900, letterSpacing: '1.5px' }}>{s.tag}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div style={{ padding: '1.1rem 3rem', background: 'var(--antigravity-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '2rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><HelpCircle size={14} /> Aide</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Zap size={14} color="white" /> Streaming · Vision · Mémoire</span>
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 950, color: 'white', letterSpacing: '3px', opacity: 0.8 }}>
                J.A.R.V.I.S v2.0
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return <>{renderBubble()}{renderSpotlight()}</>;
};

export default React.memo(AIAssistant);
