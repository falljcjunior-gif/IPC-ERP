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
  <div style={{ display: 'flex', gap: '4px', padding: '4px 0' }}>
    {[0, 1, 2].map(i => (
      <motion.div key={i}
        animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
        transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
        style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }}
      />
    ))}
  </div>
);

// ══ Message bubble ════════════════════════════════════════════
const MessageBubble = ({ m, onExecuteAction }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    style={{
      alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
      maxWidth: '87%',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem'
    }}
  >
    <div style={{
      background: m.role === 'user'
        ? 'linear-gradient(135deg, var(--accent), var(--accent-hover))'
        : 'rgba(255,255,255,0.06)',
      color: m.role === 'user' ? 'white' : '#e2e8f0',
      padding: '0.9rem 1.1rem',
      borderRadius: m.role === 'user'
        ? '1.5rem 1.5rem 0.3rem 1.5rem'
        : '1.5rem 1.5rem 1.5rem 0.3rem',
      fontSize: '0.88rem',
      lineHeight: 1.65,
      boxShadow: m.role === 'user' ? '0 4px 15px rgba(16,185,129,0.3)' : 'none',
      border: m.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)',
      whiteSpace: 'pre-wrap',
    }}>
      {m.content}
    </div>

    {/* Action card */}
    {m.action && (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          padding: '1rem 1.1rem',
          borderRadius: '1.2rem',
          border: '1px solid rgba(16,185,129,0.3)',
          background: 'rgba(16,185,129,0.07)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent)', marginBottom: '0.6rem' }}>
          <Zap size={13} /> Action Nexus disponible
        </div>
        <button
          onClick={() => onExecuteAction(m.action)}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
            color: 'white', border: 'none',
            padding: '0.65rem 1rem',
            borderRadius: '0.85rem',
            fontWeight: 800, fontSize: '0.82rem',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
          }}
        >
          <CheckCircle2 size={14} />
          {m.action.type === 'NAVIGATE' ? `Aller vers ${m.action.appId}` : `Créer : ${m.action.label}`}
        </button>
      </motion.div>
    )}

    {/* Error badge */}
    {m.error && (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#F87171', fontWeight: 600 }}>
        <AlertCircle size={13} /> {m.error}
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
    content: `Bonjour ! Je suis Nexus, votre assistant de gestion.\n\nPosez-moi une question sur vos données, demandez une analyse ou dites-moi de naviguer vers un module.`
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
    <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.92, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 20, scale: 0.92, filter: 'blur(8px)' }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            style={{
              width: shellView?.mobile ? 'calc(100vw - 2rem)' : '420px',
              height: '620px',
              borderRadius: '2rem',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              boxShadow: '0 30px 60px -12px rgba(0,0,0,0.6)',
              border: '1px solid rgba(16,185,129,0.2)',
              background: 'rgba(9, 16, 32, 0.97)',
              backdropFilter: 'blur(24px)',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              background: 'linear-gradient(135deg, #0d9468 0%, #0891b2 100%)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '7px', borderRadius: '12px', display: 'flex' }}>
                  <Cpu size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff', letterSpacing: '-0.02em' }}>Nexus</div>
                  <div style={{ fontSize: '0.65rem', opacity: 0.85, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
                    Votre assistant · Module: {contextLabel}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {!apiConfigured && (
                  <div title="Clé API non configurée" style={{ color: '#FCA5A5', cursor: 'pointer' }}>
                    <Settings size={18} />
                  </div>
                )}
                <button onClick={() => setIsOpen(false)}
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', cursor: 'pointer', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={17} />
                </button>
              </div>
            </div>

            {/* Chat messages */}
            <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', scrollbarWidth: 'none' }}>
              {messages.map((m, i) => <MessageBubble key={i} m={m} onExecuteAction={executeAction} />)}
              {isProcessing && (
                <div style={{ alignSelf: 'flex-start' }}>
                  <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', padding: '0.9rem 1.2rem', borderRadius: '1.5rem 1.5rem 1.5rem 0.3rem' }}>
                    <TypingDots />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '0.6rem', background: 'rgba(255,255,255,0.05)', padding: '0.4rem', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); processMessage(query); } }}
                  placeholder="Interrogez Nexus..."
                  disabled={isProcessing}
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#e2e8f0', padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}
                />
                <button onClick={startVoice}
                  style={{ color: isRecording ? '#EF4444' : 'rgba(255,255,255,0.4)', border: 'none', background: 'transparent', padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Mic size={19} />
                </button>
                <button
                  onClick={() => processMessage(query)}
                  disabled={isProcessing || !query.trim()}
                  style={{ background: isProcessing ? 'rgba(16,185,129,0.4)' : 'linear-gradient(135deg, var(--accent), var(--accent-hover))', color: 'white', border: 'none', width: 38, height: 38, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isProcessing ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
                  {isProcessing ? <Loader2 size={17} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Send size={17} />}
                </button>
              </div>
              <div style={{ textAlign: 'center', fontSize: '0.64rem', color: 'rgba(255,255,255,0.25)', marginTop: '0.5rem', fontWeight: 600 }}>
                Votre assistant de gestion I.P.C
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(p => !p)}
        style={{
          width: 64, height: 64, borderRadius: '20px',
          background: isOpen ? 'var(--accent-hover)' : 'linear-gradient(135deg, var(--accent), #06B6D4)',
          color: 'white', border: 'none',
          boxShadow: '0 10px 40px rgba(16,185,129,0.35)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', width: '150%', height: '150%', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 60%)' }}
        />
        {isProcessing
          ? <Loader2 size={30} style={{ position: 'relative', zIndex: 1, animation: 'spin 0.8s linear infinite' }} />
          : <Cpu size={30} style={{ position: 'relative', zIndex: 1 }} />}
      </motion.button>
    </div>
  );

  // ── Spotlight (Cmd+K) ─────────────────────────────────────
  const renderSpotlight = () => (
    <AnimatePresence>
      {spotlightOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000 }}>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSpotlightOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(9,16,32,0.85)', backdropFilter: 'blur(16px)' }}
          />
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            style={{
              position: 'relative', width: 'min(90vw, 780px)', margin: '12vh auto',
              background: 'rgba(9, 16, 32, 0.98)', borderRadius: '2rem', overflow: 'hidden',
              boxShadow: '0 50px 100px -20px rgba(0,0,0,0.8)', border: '1px solid rgba(16,185,129,0.2)'
            }}
          >
            {/* Search bar */}
            <div style={{ padding: '1.75rem 2rem', display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ position: 'relative', marginRight: '1.25rem' }}>
                <motion.div animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.5, 0.2] }} transition={{ repeat: Infinity, duration: 2 }}
                  style={{ position: 'absolute', inset: -10, background: 'var(--accent)', borderRadius: '50%', filter: 'blur(14px)' }} />
                <Sparkles size={26} color="var(--accent)" style={{ position: 'relative' }} />
              </div>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && query.trim()) { processMessage(query); setSpotlightOpen(false); setIsOpen(true); } }}
                placeholder="Demandez à Nexus une analyse, un KPI, une navigation..."
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#f1f5f9', fontSize: '1.45rem', fontWeight: 700, letterSpacing: '-0.02em' }}
              />
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.08)', padding: '5px 10px', borderRadius: '8px' }}>⏎ Envoyer</span>
                <X size={22} color="rgba(255,255,255,0.3)" style={{ cursor: 'pointer' }} onClick={() => setSpotlightOpen(false)} />
              </div>
            </div>

            {/* Quick suggestions */}
            <div style={{ padding: '1.5rem 2rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1.25rem', letterSpacing: '2px' }}>
                Analyses Rapides
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                {[
                  { title: 'Performance Supply Chain', icon: <Target size={17} />, tag: 'OTIF ANALYSIS', q: 'Analyse ma performance supply chain et OTIF' },
                  { title: 'Santé Financière', icon: <TrendingUp size={17} />, tag: 'P&L OVERVIEW', q: 'Donne-moi un bilan de la santé financière' },
                  { title: 'Masse Salariale & RH', icon: <Activity size={17} />, tag: 'HR INSIGHTS', q: 'Analyse la masse salariale et le turnover' },
                  { title: 'Efficacité Industrielle', icon: <BarChart3 size={17} />, tag: 'OEE REPORT', q: 'Quel est l\'OEE de production ce mois-ci?' },
                ].map((s, i) => (
                  <motion.div key={i}
                    whileHover={{ y: -3, borderColor: 'rgba(16,185,129,0.5)', background: 'rgba(16,185,129,0.05)' }}
                    onClick={() => { setQuery(s.q); processMessage(s.q); setSpotlightOpen(false); setIsOpen(true); }}
                    style={{ padding: '1.1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1.25rem', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  >
                    <div style={{ color: 'var(--accent)', marginBottom: '0.6rem' }}>{s.icon}</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, marginBottom: '0.2rem', color: '#e2e8f0' }}>{s.title}</div>
                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', fontWeight: 700, letterSpacing: '0.5px' }}>{s.tag}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div style={{ padding: '0.85rem 2rem', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><HelpCircle size={13} /> Cmd+K pour ouvrir</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><MessageSquare size={13} /> Réponses contextuelles ERP</span>
              </div>
              <div style={{ fontSize: '0.72rem', fontWeight: 900, color: 'var(--accent)', letterSpacing: '1px' }}>
                NEXUS · Votre assistant IPC
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
