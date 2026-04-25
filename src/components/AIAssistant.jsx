import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, Send, X, Search, Zap, ArrowRight, MessageSquare,
  Command, HelpCircle, Layout, Mic, CheckCircle2, AlertCircle,
  TrendingUp, Activity, BarChart3, Target, Info
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';

const AIAssistant = ({ spotlightOpen, setSpotlightOpen, activeModule }) => {
  const { config, navigateTo, globalSearch, data, addRecord, shellView } = useBusiness();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const aiName = config.aiName || 'Nexus AI';
  
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: `Système Nexus en ligne. Je suis votre copilote stratégique. Comment puis-je optimiser vos opérations aujourd'hui ?` 
    }
  ]);
  
  const inputRef = useRef(null);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (spotlightOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [spotlightOpen]);

  // Command+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSpotlightOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setSpotlightOpen(false);
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSpotlightOpen]);

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      processIntent(transcript);
    };
    recognition.start();
  };

  const processIntent = (input) => {
    setIsProcessing(true);
    const lowInput = input.toLowerCase();
    
    setTimeout(() => {
      let response = "";
      let proposedAction = null;

      if (lowInput.includes('crée') || lowInput.includes('ajoute') || lowInput.includes('nouveau')) {
        if (lowInput.includes('facture')) {
          proposedAction = { type: 'CREATE_RECORD', appId: 'finance', subModule: 'invoices', label: 'Facture Client' };
          response = "Facturation identifiée. Je peux initialiser un brouillon de facture pour vous.";
        }
      } else if (lowInput.includes('analyse') || lowInput.includes('bi') || lowInput.includes('santé')) {
         response = "Analyse systémique en cours... La santé globale de l'ERP est excellente. L'OTIF est à 94.2% et la marge nette consolidée à 18.5%.";
      } else if (lowInput.includes('va vers') || lowInput.includes('ouvre')) {
         const appMap = { 'rh': 'hr', 'finance': 'finance', 'vente': 'sales', 'crm': 'crm', 'prod': 'production' };
         const matched = Object.keys(appMap).find(k => lowInput.includes(k));
         if (matched) { navigateTo(appMap[matched]); setSpotlightOpen(false); setIsOpen(false); return; }
      } else {
         response = "Nexus prêt. Je peux analyser vos KPIs, naviguer entre les modules ou automatiser vos saisies de données.";
      }

      setMessages(prev => [...prev, { role: 'user', content: input }, { role: 'assistant', content: response, action: proposedAction }]);
      setQuery('');
      setIsProcessing(false);
    }, 800);
  };

  const executeAction = (action) => {
     if (action.type === 'CREATE_RECORD') {
        setMessages(prev => [...prev, { role: 'assistant', content: `✅ Action exécutée : Création de ${action.label} initiée.` }]);
     }
  };

  const currentModuleContext = useMemo(() => {
     const contexts = {
        'dashboard': "Analyse globale cross-domaine.",
        'crm': "Optimisation du tunnel de vente et conversion leads.",
        'hr': "Gestion des talents et conformité sociale.",
        'finance': "Sécurisation des flux et pilotage du ROI.",
        'production': "Optimisation de l'OEE et maintenance prédictive."
     };
     return contexts[activeModule] || "Soutien opérationnel standard.";
  }, [activeModule]);

  const renderBubble = () => (
    <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 20, scale: 0.9, filter: 'blur(10px)' }}
            className="glass"
            style={{
              width: shellView?.mobile ? 'calc(100vw - 2rem)' : '400px',
              height: '600px',
              borderRadius: '2rem',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '1px solid var(--accent-glow)',
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(20px)'
            }}
          >
            {/* Header */}
            <div style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--accent), #06B6D4)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: '10px' }}>
                   <Cpu size={18} />
                </div>
                <div>
                   <div style={{ fontWeight: 800, fontSize: '1rem' }}>Nexus Intelligence</div>
                   <div style={{ fontSize: '0.65rem', opacity: 0.8, fontWeight: 600 }}>CONTEXTE : {currentModuleContext}</div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>

            {/* Chat Body */}
            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', scrollbarWidth: 'none' }}>
              {messages.map((m, i) => (
                <div key={i} style={{ 
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ 
                    background: m.role === 'user' ? 'var(--accent)' : 'var(--bg-subtle)',
                    color: m.role === 'user' ? 'white' : 'var(--text)',
                    padding: '1rem 1.25rem',
                    borderRadius: m.role === 'user' ? '1.5rem 1.5rem 0.25rem 1.5rem' : '1.5rem 1.5rem 1.5rem 0.25rem',
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                    boxShadow: m.role === 'user' ? '0 4px 15px var(--accent-glow)' : 'none',
                    border: m.role === 'user' ? 'none' : '1px solid var(--border)'
                  }}>
                    {m.content}
                  </div>
                  {m.action && (
                    <div className="glass" style={{ padding: '1.25rem', borderRadius: '1.5rem', border: '1px solid var(--accent-glow)', background: 'rgba(16, 185, 129, 0.05)' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent)', marginBottom: '0.5rem' }}>
                          <Zap size={14} /> Action Automatisée
                       </div>
                       <button 
                         onClick={() => executeAction(m.action)}
                         style={{ width: '100%', background: 'var(--accent)', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '0.85rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                       >
                         Exécuter : {m.action.label}
                       </button>
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input Footer */}
            <div style={{ padding: '1.25rem', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.1)' }}>
               <div style={{ display: 'flex', gap: '0.75rem', background: 'var(--bg-subtle)', padding: '0.5rem', borderRadius: '1.25rem', border: '1px solid var(--border)' }}>
                 <input 
                   value={query}
                   onChange={(e) => setQuery(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && processIntent(query)}
                   placeholder="Commandez Nexus..."
                   style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', padding: '0.5rem 0.75rem', fontSize: '0.95rem' }}
                 />
                 <button onClick={startVoice} style={{ color: isRecording ? '#EF4444' : 'var(--text-muted)', border: 'none', background: 'transparent', padding: '0.5rem', cursor: 'pointer' }}>
                   <Mic size={20} />
                 </button>
                 <button onClick={() => processIntent(query)} style={{ background: 'var(--accent)', color: 'white', border: 'none', width: '38px', height: '38px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                   <Send size={18} />
                 </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1, rotate: [0, 5, -5, 0] }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '64px', height: '64px', borderRadius: '20px',
          background: 'var(--accent)', color: 'white', border: 'none',
          boxShadow: '0 10px 40px var(--accent-glow)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden'
        }}
      >
        <motion.div
           animate={{ rotate: 360 }}
           transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
           style={{ position: 'absolute', width: '150%', height: '150%', background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 60%)' }}
        />
        <Cpu size={32} style={{ position: 'relative', zIndex: 1 }} />
      </motion.button>
    </div>
  );

  const renderSpotlight = () => (
    <AnimatePresence>
      {spotlightOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000 }}>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSpotlightOpen(false)}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(15px)' }}
          />
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.98 }}
            className="glass"
            style={{
              position: 'relative', width: 'min(90vw, 800px)', margin: '15vh auto',
              background: 'var(--bg)', borderRadius: '2rem', overflow: 'hidden',
              boxShadow: '0 50px 100px -20px rgba(0,0,0,0.7)', border: '1px solid var(--accent-glow)'
            }}
          >
            <div style={{ padding: '2rem', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
              <div style={{ position: 'relative', marginRight: '1.5rem' }}>
                 <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} 
                    style={{ position: 'absolute', inset: -8, background: 'var(--accent)', borderRadius: '50%', filter: 'blur(12px)' }} />
                 <Cpu size={28} color="var(--accent)" style={{ position: 'relative' }} />
              </div>
              <input 
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && processIntent(query)}
                placeholder="Exploration Nexus : Demandez une analyse, un record ou un module..."
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}
              />
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                 <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>CMD K</div>
                 <X size={24} color="var(--text-muted)" style={{ cursor: 'pointer' }} onClick={() => setSpotlightOpen(false)} />
              </div>
            </div>

            <div style={{ padding: '1.5rem', maxHeight: '500px', overflowY: 'auto' }}>
               {query === "" && (
                 <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '1.5rem', letterSpacing: '2px' }}>Parcours Prise de Décision</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                       {[
                         { title: "Performance Supply Chain", icon: <Target size={18} />, tag: "OTIF ANALYSIS" },
                         { title: "Santé Financière Q2", icon: <TrendingUp size={18} />, tag: "P&L OVERVIEW" },
                         { title: "Masse Salariale & Turnover", icon: <Activity size={18} />, tag: "HR INSIGHTS" },
                         { title: "Efficiency Industrielle", icon: <BarChart3 size={18} />, tag: "OEE REPORT" }
                       ].map((s, i) => (
                         <motion.div key={i} whileHover={{ y: -4, background: 'var(--bg-subtle)', borderColor: 'var(--accent)' }} 
                            onClick={() => { setQuery(s.title); processIntent(s.title); }}
                            style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1.25rem', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                            <div style={{ color: 'var(--accent)', marginBottom: '0.75rem' }}>{s.icon}</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '0.25rem' }}>{s.title}</div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700 }}>{s.tag}</div>
                         </motion.div>
                       ))}
                    </div>
                 </div>
               )}
            </div>

            <div style={{ padding: '1rem 2rem', background: 'var(--bg-subtle)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', gap: '2rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><HelpCircle size={14} /> Guide de commandes</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MessageSquare size={14} /> Support Nexus 24/7</span>
               </div>
               <div style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--accent)' }}>NEXUS AI v2.0</div>
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
