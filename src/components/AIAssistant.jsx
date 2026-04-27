import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, Send, X, Zap, MessageSquare,
  HelpCircle, Mic, TrendingUp, Activity, BarChart3, Target,
  AlertCircle, CheckCircle2, Sparkles, Loader2, Settings
} from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../firebase/config';
import { useStore } from '../store';

// Bind to the same Firebase app instance to ensure auth token is transmitted
const functions = getFunctions(app);
const nexusChatFn = httpsCallable(functions, 'nexusChat');

// ══ Typing animation component ═══════════════════════════════
const TypingDots = () => (
  <div style={{ display: 'flex', gap: '6px', padding: '6px 0' }}>
    {[0, 1, 2].map(i => (
      <motion.div key={i}
        animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
        style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--nexus-primary)' }}
      />
    ))}
  </div>
);

// ══ Message bubble ════════════════════════════════════════════
const MessageBubble = ({ m, onExecuteAction }) => (
  <motion.div
    initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
    animate={{ opacity: 1, x: 0 }}
    style={{
      alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
      maxWidth: '85%',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.6rem'
    }}
  >
    <div style={{
      background: m.role === 'user'
        ? 'var(--nexus-secondary)'
        : 'white',
      color: m.role === 'user' ? 'white' : 'var(--nexus-text)',
      padding: '1rem 1.25rem',
      borderRadius: m.role === 'user'
        ? '1.5rem 1.5rem 0.4rem 1.5rem'
        : '1.5rem 1.5rem 1.5rem 0.4rem',
      fontSize: '0.9rem',
      lineHeight: 1.6,
      boxShadow: 'var(--shadow-nexus)',
      border: '1px solid var(--nexus-border)',
      whiteSpace: 'pre-wrap',
      fontWeight: 500
    }}>
      {m.content}
    </div>

    {/* Action card */}
    {m.action && (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="nexus-card"
        style={{
          padding: '1.25rem',
          background: 'rgba(16, 185, 129, 0.05)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--nexus-primary)', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          <Zap size={14} fill="var(--nexus-primary)" stroke="none" /> Nexus Intelligence Action
        </div>
        <button
          onClick={() => onExecuteAction(m.action)}
          className="nexus-card"
          style={{
            width: '100%',
            background: 'var(--nexus-secondary)',
            color: 'white', border: 'none',
            padding: '0.75rem 1rem',
            fontWeight: 800, fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem'
          }}
        >
          <CheckCircle2 size={16} />
          {m.action.type === 'NAVIGATE' ? `Ouvrir ${m.action.appId.toUpperCase()}` : `Exécuter : ${m.action.label}`}
        </button>
      </motion.div>
    )}

    {/* Error badge */}
    {m.error && (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#ef4444', fontWeight: 700, paddingLeft: '0.5rem' }}>
        <AlertCircle size={14} /> {m.error}
      </div>
    )}
  </motion.div>
);

// ══ MAIN COMPONENT ════════════════════════════════════════════
const AIAssistant = ({ spotlightOpen, setSpotlightOpen, activeModule }) => {
  const { config, navigateTo, globalSearch, data, addRecord, shellView, currentUser, userRole, formatCurrency } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [apiConfigured, setApiConfigured] = useState(true); // optimistic
  const aiName = config?.aiName || 'Nexus AI';

  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: `Système Nexus OS activé.\n\nJe suis prêt à analyser vos opérations, naviguer entre les pôles ou générer des rapports stratégiques. Comment puis-je vous assister ?`
  }]);

  const inputRef = useRef(null);
  const chatEndRef = useRef(null);
  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (spotlightOpen && inputRef.current) inputRef.current.focus();
  }, [spotlightOpen]);

  // Cmd+K listener
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSpotlightOpen(p => !p); }
      if (e.key === 'Escape') { setSpotlightOpen(false); setIsOpen(false); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [setSpotlightOpen]);

  // Build live ERP context to send to AI
  const buildERPContext = useCallback(() => {
    const counts = {};
    if (data?.crm?.leads) counts['Leads CRM'] = data.crm.leads.length;
    if (data?.hr?.employees) counts['Employés'] = data.hr.employees.length;
    if (data?.base) {
      Object.entries(data.base).forEach(([key, val]) => {
        if (Array.isArray(val) && val.length > 0) counts[key] = val.length;
      });
    }

    return {
      activeModule: activeModule || 'dashboard',
      userRole: userRole || currentUser?.role || 'STAFF',
      userName: currentUser?.nom || currentUser?.email?.split('@')[0] || 'Utilisateur',
      recordCounts: counts,
      kpis: {}, // Could be populated from Analytics store
    };
  }, [data, activeModule, userRole, currentUser]);

  const processMessage = useCallback(async (input) => {
    if (!input?.trim() || isProcessing) return;
    const userInput = input.trim();
    setQuery('');
    setIsProcessing(true);

    setMessages(prev => [...prev, { role: 'user', content: userInput }]);

    // Optimistic: Check for local navigation shortcuts first
    const lowInput = userInput.toLowerCase();
    const NAV_MAP = {
      'crm': 'crm', 'rh': 'hr', 'hr': 'hr', 'finance': 'finance',
      'vente': 'sales', 'production': 'production', 'logistique': 'logistics',
      'marketing': 'marketing', 'juridique': 'legal', 'admin': 'admin',
      'dashboard': 'dashboard', 'tableau de bord': 'dashboard'
    };
    const navKey = Object.keys(NAV_MAP).find(k => lowInput.startsWith('va vers ' + k) || lowInput === k || lowInput === 'ouvre ' + k);
    if (navKey) {
      navigateTo(NAV_MAP[navKey]);
      setMessages(prev => [...prev, { role: 'assistant', content: `✅ Navigation vers le module ${navKey.toUpperCase()} effectuée.` }]);
      setSpotlightOpen(false);
      setIsOpen(false);
      setIsProcessing(false);
      return;
    }

    try {
      const chatHistory = messages.filter(m => m.role && m.content && !m.error).slice(-8);
      const result = await nexusChatFn({
        message: userInput,
        history: chatHistory,
        erpContext: buildERPContext()
      });

      const { response, action, success } = result.data;

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response || 'Désolé, aucune réponse reçue.',
        action: action || null,
        error: !success ? '⚠️ Réponse partielle' : null
      }]);

    } catch (err) {
      console.error('Nexus AI call failed:', err);
      const errorMsg = err.code === 'functions/unauthenticated'
        ? 'Vous devez être connecté pour utiliser Nexus.'
        : err.code === 'functions/failed-precondition'
        ? 'Nexus n\'est pas encore configuré. Contactez l\'administrateur.'
        : err.code === 'functions/unavailable' || err.code === 'functions/internal'
        ? 'Nexus est temporairement indisponible. Réessayez dans un instant.'
        : 'Je ne suis pas disponible pour le moment. Vérifiez votre connexion.';

      if (err.code === 'functions/failed-precondition') setApiConfigured(false);
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg, error: err.code }]);
    }

    setIsProcessing(false);
  }, [isProcessing, messages, buildERPContext, navigateTo, setSpotlightOpen]);

  const executeAction = useCallback((action) => {
    if (action.type === 'NAVIGATE') {
      navigateTo(action.appId);
      setSpotlightOpen(false);
      setIsOpen(false);
      setMessages(prev => [...prev, { role: 'assistant', content: `✅ Navigation vers "${action.appId}" effectuée.` }]);
    } else if (action.type === 'CREATE_RECORD') {
      addRecord?.(action.appId, action.subModule, {});
      setMessages(prev => [...prev, { role: 'assistant', content: `✅ Création de "${action.label}" initiée dans ${action.appId}.` }]);
    }
  }, [navigateTo, addRecord, setSpotlightOpen]);

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'fr-FR';
    rec.onstart = () => setIsRecording(true);
    rec.onend = () => setIsRecording(false);
    rec.onresult = (e) => {
      const t = e.results[0][0].transcript;
      setQuery(t);
      processMessage(t);
    };
    rec.start();
  };

  const contextLabel = useMemo(() => {
    const map = {
      dashboard: 'Vue Globale', crm: 'CRM', hr: 'RH', finance: 'Finance',
      sales: 'Commerce', production: 'Production', logistics: 'Logistique',
      marketing: 'Marketing', legal: 'Juridique', bi: 'BI', admin: 'Admin'
    };
    return map[activeModule] || 'Global';
  }, [activeModule]);

  // ── Bubble (floating chat) ────────────────────────────────
  const renderBubble = () => (
    <div style={{ position: 'fixed', bottom: '2.5rem', right: '2.5rem', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1.25rem' }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="nexus-card"
            style={{
              width: shellView?.mobile ? 'calc(100vw - 2.5rem)' : '450px',
              height: '650px',
              borderRadius: '2rem',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(30px)',
              border: '1px solid var(--nexus-border)',
              boxShadow: '0 40px 80px -15px rgba(15, 23, 42, 0.15)'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '1.5rem 2rem',
              background: 'var(--nexus-secondary)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="nexus-glow" style={{ background: 'var(--nexus-primary)', padding: '8px', borderRadius: '12px', display: 'flex' }}>
                  <Cpu size={20} color="white" />
                </div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#fff', letterSpacing: '-0.02em' }}>Nexus Intelligence</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: 700, color: 'var(--nexus-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Mode: {contextLabel}
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', width: 34, height: 34, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'var(--transition-nexus)' }}>
                <X size={18} />
              </button>
            </div>

            {/* Chat messages */}
            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', scrollbarWidth: 'none' }}>
              {messages.map((m, i) => <MessageBubble key={i} m={m} onExecuteAction={executeAction} />)}
              {isProcessing && (
                <div style={{ alignSelf: 'flex-start' }}>
                  <div style={{ background: 'white', border: '1px solid var(--nexus-border)', padding: '1rem 1.5rem', borderRadius: '1.5rem 1.5rem 1.5rem 0.4rem', boxShadow: 'var(--shadow-nexus)' }}>
                    <TypingDots />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--nexus-border)', background: 'var(--bg-subtle)', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '0.75rem', background: 'white', padding: '0.5rem', borderRadius: '1.25rem', border: '1px solid var(--nexus-border)', boxShadow: 'var(--shadow-sm)', transition: 'var(--transition-nexus)' }}>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); processMessage(query); } }}
                  placeholder="Instruire Nexus..."
                  disabled={isProcessing}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--nexus-text)', padding: '0.6rem 1rem', fontSize: '0.95rem', fontWeight: 500 }}
                />
                <button onClick={startVoice}
                  style={{ color: isRecording ? '#ef4444' : 'var(--nexus-text-muted)', border: 'none', background: 'transparent', padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Mic size={20} />
                </button>
                <button
                  onClick={() => processMessage(query)}
                  disabled={isProcessing || !query.trim()}
                  className="nexus-card"
                  style={{ background: isProcessing ? 'var(--nexus-text-muted)' : 'var(--nexus-secondary)', color: 'white', border: 'none', width: 42, height: 42, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isProcessing ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
                  {isProcessing ? <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Send size={18} />}
                </button>
              </div>
              <div style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--nexus-text-muted)', marginTop: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6 }}>
                Powered by IPC Nexus Strategy Core
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB button */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(p => !p)}
        className="nexus-glow"
        style={{
          width: 70, height: 70, borderRadius: '22px',
          background: 'var(--nexus-secondary)',
          color: 'white', border: 'none',
          boxShadow: '0 15px 45px rgba(15, 23, 42, 0.25)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, var(--nexus-primary-glow) 0%, transparent 70%)', opacity: 0.3 }}
        />
        {isProcessing
          ? <Loader2 size={32} style={{ position: 'relative', zIndex: 1, animation: 'spin 1s linear infinite' }} />
          : <Zap size={32} fill="var(--nexus-primary)" stroke="none" style={{ position: 'relative', zIndex: 1 }} />}
      </motion.button>
    </div>
  );

  // ── Spotlight (Nexus Command Palette) ──────────────────────────
  const renderSpotlight = () => (
    <AnimatePresence>
      {spotlightOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000 }}>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSpotlightOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(20px)' }}
          />
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            className="nexus-card"
            style={{
              position: 'relative', width: 'min(90vw, 850px)', margin: '10vh auto',
              background: 'rgba(255, 255, 255, 0.95)', borderRadius: '2.5rem', overflow: 'hidden',
              boxShadow: '0 60px 120px -25px rgba(15, 23, 42, 0.3)', border: '1px solid var(--nexus-border)'
            }}
          >
            {/* Search bar */}
            <div style={{ padding: '2rem 2.5rem', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--nexus-border)', gap: '1.5rem' }}>
              <div style={{ position: 'relative' }}>
                <motion.div 
                  animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.3, 0.1] }} 
                  transition={{ repeat: Infinity, duration: 3 }}
                  style={{ position: 'absolute', inset: -15, background: 'var(--nexus-primary)', borderRadius: '50%', filter: 'blur(20px)' }} 
                />
                <Cpu size={32} className="nexus-gradient-text" style={{ position: 'relative' }} />
              </div>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && query.trim()) { processMessage(query); setSpotlightOpen(false); setIsOpen(true); } }}
                placeholder="Nexus Command... Demandez une analyse stratégique"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--nexus-secondary)', fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.03em' }}
              />
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <kbd style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--nexus-text-muted)', background: 'var(--bg-subtle)', padding: '6px 12px', borderRadius: '10px', border: '1px solid var(--nexus-border)' }}>Enter</kbd>
                <X size={26} color="var(--nexus-text-muted)" style={{ cursor: 'pointer', opacity: 0.5 }} onClick={() => setSpotlightOpen(false)} />
              </div>
            </div>

            {/* Quick Suggestions (Nexus Style) */}
            <div style={{ padding: '2rem 2.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--nexus-primary)', textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '3px' }}>
                Moteurs de Calcul Nexus
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                {[
                  { title: 'Performance & OTIF', icon: <Target size={20} />, tag: 'SUPPLY CHAIN', q: 'Analyse OTIF' },
                  { title: 'Bilan de Santé Global', icon: <TrendingUp size={20} />, tag: 'FINANCIAL CORE', q: 'Bilan financier' },
                  { title: 'Analyse Capital Humain', icon: <Activity size={20} />, tag: 'HR TELEMETRY', q: 'Analyse RH' },
                  { title: 'Audit de Production', icon: <BarChart3 size={20} />, tag: 'OEE INDUSTRIAL', q: 'Audit production' },
                ].map((s, i) => (
                  <motion.div key={i}
                    whileHover={{ y: -5, borderColor: 'var(--nexus-primary)', background: 'rgba(16, 185, 129, 0.05)' }}
                    onClick={() => { setQuery(s.q); processMessage(s.q); setSpotlightOpen(false); setIsOpen(true); }}
                    className="nexus-card"
                    style={{ padding: '1.5rem', background: 'white', cursor: 'pointer', border: '1px solid var(--nexus-border)' }}
                  >
                    <div style={{ color: 'var(--nexus-primary)', marginBottom: '0.75rem' }}>{s.icon}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '0.3rem', color: 'var(--nexus-secondary)', letterSpacing: '-0.01em' }}>{s.title}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--nexus-text-muted)', fontWeight: 800, letterSpacing: '1px' }}>{s.tag}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div style={{ padding: '1rem 2.5rem', background: 'var(--nexus-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '2rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><HelpCircle size={14} /> Cmd+K pour Command Palette</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Zap size={14} fill="var(--nexus-primary)" stroke="none" /> Intelligence Contextuelle</span>
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--nexus-primary)', letterSpacing: '2px' }}>
                NEXUS OS v5.0
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {renderBubble()}
      {renderSpotlight()}
    </>
  );
};

export default React.memo(AIAssistant);
