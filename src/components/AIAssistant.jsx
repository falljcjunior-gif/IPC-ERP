import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, Send, X, Zap, MessageSquare,
  HelpCircle, Mic, TrendingUp, Activity, BarChart3, Target,
  AlertCircle, CheckCircle2, Sparkles, Loader2, Settings, ShieldAlert
} from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../firebase/config';
import { useStore } from '../store';

// Bind to the same Firebase app instance to ensure auth token is transmitted
const functions = getFunctions(app);
const antigravityChatFn = httpsCallable(functions, 'nexusChat'); // Backend still named nexusChat for stability, but UI is Antigravity

// ══ Typing animation component ═══════════════════════════════
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
        ? 'var(--antigravity-secondary)'
        : 'white',
      color: m.role === 'user' ? 'white' : 'var(--antigravity-text)',
      padding: '1.1rem 1.4rem',
      borderRadius: m.role === 'user'
        ? '1.5rem 1.5rem 0.4rem 1.5rem'
        : '1.5rem 1.5rem 1.5rem 0.4rem',
      fontSize: '0.92rem',
      lineHeight: 1.6,
      boxShadow: 'var(--shadow-antigravity)',
      border: '1px solid var(--antigravity-border)',
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
        className="antigravity-card"
        style={{
          padding: '1.25rem',
          background: 'rgba(52, 211, 153, 0.08)',
          border: '1px solid rgba(52, 211, 153, 0.3)',
          borderRadius: '1.25rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--antigravity-primary)', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
          <Zap size={14} fill="var(--antigravity-primary)" stroke="none" /> Antigravity Exec Protocol
        </div>
        <button
          onClick={() => onExecuteAction(m.action)}
          className="antigravity-btn"
          style={{
            width: '100%',
            background: 'var(--antigravity-secondary)',
            color: 'white', border: 'none',
            padding: '0.85rem 1rem',
            borderRadius: '0.85rem',
            fontWeight: 800, fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
            boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
          }}
        >
          <CheckCircle2 size={16} />
          {m.action.type === 'NAVIGATE' ? `Ouvrir ${m.action.appId.toUpperCase()}` : `Exécuter : ${m.action.label || 'Action Protocole'}`}
        </button>
      </motion.div>
    )}

    {/* Error badge */}
    {m.error && (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#ef4444', fontWeight: 700, paddingLeft: '0.5rem' }}>
        <ShieldAlert size={14} /> {m.error}
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
  const [apiConfigured, setApiConfigured] = useState(true);

  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: `Système Antigravity Intelligence opérationnel.\n\nPrêt pour analyse multisectorielle, automatisation de workflows ou génération d'intelligence stratégique. Que souhaitez-vous accomplir ?`
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
      kpis: {},
    };
  }, [data, activeModule, userRole, currentUser]);

  const processMessage = useCallback(async (input) => {
    if (!input?.trim() || isProcessing) return;
    const userInput = input.trim();
    setQuery('');
    setIsProcessing(true);

    setMessages(prev => [...prev, { role: 'user', content: userInput }]);

    // Optimistic shortcuts
    const lowInput = userInput.toLowerCase();
    const NAV_MAP = {
      'crm': 'crm', 'rh': 'hr', 'hr': 'hr', 'finance': 'finance',
      'vente': 'sales', 'production': 'production', 'logistique': 'logistics',
      'marketing': 'marketing', 'juridique': 'legal', 'admin': 'admin',
      'dashboard': 'dashboard', 'tableau de bord': 'dashboard', 'bi': 'bi', 'commerce': 'commerce'
    };
    const navKey = Object.keys(NAV_MAP).find(k => lowInput.startsWith('va vers ' + k) || lowInput === k || lowInput === 'ouvre ' + k);
    if (navKey) {
      navigateTo(NAV_MAP[navKey]);
      setMessages(prev => [...prev, { role: 'assistant', content: `✅ Navigation vers le module ${navKey.toUpperCase()} effectuée par Antigravity.` }]);
      setSpotlightOpen(false);
      setIsOpen(false);
      setIsProcessing(false);
      return;
    }

    try {
      const chatHistory = messages.filter(m => m.role && m.content && !m.error).slice(-8);
      const result = await antigravityChatFn({
        message: userInput,
        history: chatHistory,
        erpContext: buildERPContext()
      });

      const { response, action, success } = result.data;

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response || 'Antigravity : Aucune réponse exploitable reçue.',
        action: action || null,
        error: !success ? '⚠️ Protocole partiel' : null
      }]);

    } catch (err) {
      console.error('Antigravity AI call failed:', err);
      const errorMsg = err.code === 'functions/unauthenticated'
        ? 'Session expirée. Reconnectez-vous pour réactiver Antigravity.'
        : err.code === 'functions/failed-precondition'
        ? 'Système Antigravity non initialisé sur ce serveur.'
        : 'Interruption du canal de communication Antigravity.';

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
      setMessages(prev => [...prev, { role: 'assistant', content: `✅ Déploiement du module "${action.appId}" terminé.` }]);
    } else if (action.type === 'CREATE_RECORD') {
      addRecord?.(action.appId, action.subModule, {});
      setMessages(prev => [...prev, { role: 'assistant', content: `✅ Séquence de création initiée dans ${action.appId} [${action.subModule}].` }]);
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
      dashboard: 'GLOBAL', crm: 'VENTES', hr: 'TALENT', finance: 'CAPITAL',
      sales: 'COMMERCE', production: 'USINE', logistics: 'FLUX',
      marketing: 'MARKET', legal: 'DROIT', bi: 'BI', admin: 'SYS'
    };
    return map[activeModule] || 'IDLE';
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
            style={{
              width: shellView?.mobile ? 'calc(100vw - 2.5rem)' : '420px',
              height: '680px',
              borderRadius: '2.5rem',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              background: 'rgba(255, 255, 255, 0.96)',
              backdropFilter: 'blur(40px)',
              border: '1px solid var(--antigravity-border)',
              boxShadow: '0 50px 100px -20px rgba(15, 23, 42, 0.2)'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '1.75rem 2.5rem',
              background: 'var(--antigravity-secondary)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div className="antigravity-glow" style={{ background: 'var(--antigravity-primary)', padding: '10px', borderRadius: '14px', display: 'flex' }}>
                  <Cpu size={22} color="white" />
                </div>
                <div>
                  <div style={{ fontWeight: 950, fontSize: '1.2rem', color: '#fff', letterSpacing: '-0.03em' }}>Antigravity</div>
                  <div style={{ fontSize: '0.65rem', opacity: 0.9, fontWeight: 900, color: 'var(--antigravity-primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                    Secteur: {contextLabel}
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', width: 36, height: 36, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Chat messages */}
            <div style={{ flex: 1, padding: '1.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', scrollbarWidth: 'none' }}>
              {messages.map((m, i) => <MessageBubble key={i} m={m} onExecuteAction={executeAction} />)}
              {isProcessing && (
                <div style={{ alignSelf: 'flex-start' }}>
                  <div style={{ background: 'white', border: '1px solid var(--antigravity-border)', padding: '1rem 1.5rem', borderRadius: '1.5rem 1.5rem 1.5rem 0.4rem', boxShadow: 'var(--shadow-antigravity)' }}>
                    <TypingDots />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--antigravity-border)', background: 'var(--bg-subtle)', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '0.85rem', background: 'white', padding: '0.6rem', borderRadius: '1.5rem', border: '1px solid var(--antigravity-border)', boxShadow: 'var(--shadow-sm)', transition: '0.3s' }}>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); processMessage(query); } }}
                  placeholder="Instruire Antigravity..."
                  disabled={isProcessing}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--antigravity-text)', padding: '0.6rem 1rem', fontSize: '0.95rem', fontWeight: 600 }}
                />
                <button onClick={startVoice}
                  style={{ color: isRecording ? '#ef4444' : 'var(--antigravity-text-muted)', border: 'none', background: 'transparent', padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Mic size={22} />
                </button>
                <button
                  onClick={() => processMessage(query)}
                  disabled={isProcessing || !query.trim()}
                  style={{ background: isProcessing ? 'var(--antigravity-text-muted)' : 'var(--antigravity-secondary)', color: 'white', border: 'none', width: 44, height: 44, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isProcessing ? 'not-allowed' : 'pointer', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  {isProcessing ? <Loader2 size={20} className="spinner" /> : <Send size={20} />}
                </button>
              </div>
              <div style={{ textAlign: 'center', fontSize: '0.6rem', color: 'var(--antigravity-text-muted)', marginTop: '1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.7 }}>
                Antigravity Strategy Core — IPC 2026
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
        className="antigravity-glow"
        style={{
          width: 75, height: 75, borderRadius: '24px',
          background: 'var(--antigravity-secondary)',
          color: 'white', border: 'none',
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.3)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle, var(--antigravity-primary-glow) 0%, transparent 70%)', opacity: 0.4 }}
        />
        {isProcessing
          ? <Loader2 size={34} className="spinner" style={{ position: 'relative', zIndex: 1 }} />
          : <Zap size={34} fill="var(--antigravity-primary)" stroke="none" style={{ position: 'relative', zIndex: 1 }} />}
      </motion.button>
    </div>
  );

  // ── Spotlight (Antigravity Command Palette) ──────────────────────────
  const renderSpotlight = () => (
    <AnimatePresence>
      {spotlightOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000 }}>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSpotlightOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(25px)' }}
          />
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            style={{
              position: 'relative', width: 'min(92vw, 900px)', margin: '12vh auto',
              background: 'rgba(255, 255, 255, 0.98)', borderRadius: '3rem', overflow: 'hidden',
              boxShadow: '0 80px 160px -30px rgba(15, 23, 42, 0.4)', border: '1px solid var(--antigravity-border)'
            }}
          >
            {/* Search bar */}
            <div style={{ padding: '2.5rem 3rem', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--antigravity-border)', gap: '2rem' }}>
              <div style={{ position: 'relative' }}>
                <motion.div 
                  animate={{ scale: [1, 1.6, 1], opacity: [0.1, 0.4, 0.1] }} 
                  transition={{ repeat: Infinity, duration: 3 }}
                  style={{ position: 'absolute', inset: -20, background: 'var(--antigravity-primary)', borderRadius: '50%', filter: 'blur(25px)' }} 
                />
                <Cpu size={36} color="var(--antigravity-primary)" style={{ position: 'relative' }} />
              </div>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && query.trim()) { processMessage(query); setSpotlightOpen(false); setIsOpen(true); } }}
                placeholder="Antigravity Command... Instruisez l'IA"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--antigravity-secondary)', fontSize: '1.8rem', fontWeight: 950, letterSpacing: '-0.04em' }}
              />
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <kbd style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--antigravity-text-muted)', background: 'var(--bg-subtle)', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--antigravity-border)' }}>CMD K</kbd>
                <X size={30} color="var(--antigravity-text-muted)" style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => setSpotlightOpen(false)} />
              </div>
            </div>

            {/* Quick Suggestions */}
            <div style={{ padding: '2.5rem 3rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 950, color: 'var(--antigravity-primary)', textTransform: 'uppercase', marginBottom: '2rem', letterSpacing: '4px' }}>
                Antigravity Protocol Core
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
                {[
                  { title: 'Performance Logistique', icon: <Target size={22} />, tag: 'SUPPLY CHAIN', q: 'Analyse OTIF' },
                  { title: 'Santé Financière', icon: <TrendingUp size={22} />, tag: 'FINANCIAL CORE', q: 'Bilan de trésorerie' },
                  { title: 'Audit Capital Humain', icon: <Activity size={22} />, tag: 'HR TELEMETRY', q: 'Audit RH complet' },
                  { title: 'Statut Usine & OEE', icon: <BarChart3 size={22} />, tag: 'INDUSTRIAL', q: 'Rapport production' },
                ].map((s, i) => (
                  <motion.div key={i}
                    whileHover={{ y: -8, borderColor: 'var(--antigravity-primary)', background: 'rgba(52, 211, 153, 0.05)' }}
                    onClick={() => { setQuery(s.q); processMessage(s.q); setSpotlightOpen(false); setIsOpen(true); }}
                    style={{ padding: '1.75rem', background: 'white', cursor: 'pointer', border: '1px solid var(--antigravity-border)', borderRadius: '2rem', transition: '0.3s' }}
                  >
                    <div style={{ color: 'var(--antigravity-primary)', marginBottom: '1rem' }}>{s.icon}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 950, marginBottom: '0.4rem', color: 'var(--antigravity-secondary)', letterSpacing: '-0.02em' }}>{s.title}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--antigravity-text-muted)', fontWeight: 900, letterSpacing: '1.5px' }}>{s.tag}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div style={{ padding: '1.25rem 3rem', background: 'var(--antigravity-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '2.5rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><HelpCircle size={16} /> Aide Protocole</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Zap size={16} fill="var(--antigravity-primary)" stroke="none" /> Intelligence Contextuelle</span>
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 950, color: 'var(--antigravity-primary)', letterSpacing: '3px' }}>
                ANTIGRAVITY OS v6.0
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
