import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Send, 
  X, 
  Search, 
  Zap, 
  ArrowRight,
  MessageSquare,
  Command,
  HelpCircle,
  Layout,
  Mic,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';

const AIAssistant = ({ spotlightOpen, setSpotlightOpen }) => {
  const { config, navigateTo, globalSearch, data, addRecord } = useBusiness();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const aiName = config.aiName || 'IPC Intelligence';
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Bonjour ! Je suis **${aiName}**. Comment puis-je vous aider aujourd'hui ?` }
  ]);
  
  const inputRef = useRef(null);

  useEffect(() => {
    if (spotlightOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [spotlightOpen]);

  // Handle Command+K
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
    if (!SpeechRecognition) {
      alert("Votre navigateur ne supporte pas la reconnaissance vocale.");
      return;
    }
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

  const executeAction = (action) => {
    try {
      if (action.type === 'CREATE_RECORD') {
        addRecord(action.appId, action.subModule, action.data);
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `✅ Action exécutée : ${action.label} a été créé avec succès.` 
        }]);
      }
    } catch (_e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "❌ Désolé, je n'ai pas pu exécuter cette action." }]);
    }
  };

  const processIntent = (input) => {
    setIsProcessing(true);
    const lowInput = input.toLowerCase();
    
    setTimeout(() => {
      let response = "";
      let newResults = [];
      let proposedAction = null;

      if (lowInput.includes('crée') || lowInput.includes('ajoute') || lowInput.includes('nouveau')) {
        if (lowInput.includes('facture')) {
          proposedAction = {
            type: 'CREATE_RECORD',
            appId: 'finance',
            subModule: 'invoices',
            label: 'Facture Client',
            data: { client: 'A définir', montant: 0, statut: 'Brouillon' }
          };
          response = "Je peux préparer cette facture pour vous. Voulez-vous que je l'ajoute maintenant ?";
        } else if (lowInput.includes('client') || lowInput.includes('contact')) {
          proposedAction = {
            type: 'CREATE_RECORD',
            appId: 'base',
            subModule: 'contacts',
            label: 'Nouveau Contact',
            data: { nom: 'Nouveau Client', type: 'Client' }
          };
          response = "Souhaitez-vous créer une fiche pour ce nouveau contact ?";
        }
      }

      if (!proposedAction) {
        if (lowInput.includes('cherch') || lowInput.includes('trouv')) {
          const searchTerms = lowInput.replace('cherche', '').replace('trouve', '').trim();
          const found = globalSearch(searchTerms);
          response = `Résultats pour "${searchTerms}" :`;
          setResults(searchResults || []);
        } else if (lowInput.includes('vent') || lowInput.includes('ca')) {
          const sales = data.sales?.orders || [];
          const total = sales.reduce((sum, s) => sum + (s.totalTTC || s.total || 0), 0);
          response = `Le chiffre d'affaires total est de **${total.toLocaleString()} FCFA**.`;
        } else if (lowInput.includes('va vers') || lowInput.includes('aller à') || lowInput.includes('ouvre')) {
           const appMap = { 'crm': 'crm', 'rh': 'hr', 'finance': 'finance', 'compta': 'accounting', 'stock': 'inventory' };
           const matched = Object.keys(appMap).find(k => lowInput.includes(k));
           if (matched) {
             navigateTo(appMap[matched]);
             setSpotlightOpen(false);
             return;
           }
        } else {
          response = "Je peux vous aider à rechercher des données, naviguer ou exécuter des tâches. Essayez : 'Crée une facture' ou 'Cherche Raphael'.";
        }
      }

      setMessages(prev => [
        ...prev, 
        { role: 'user', content: input }, 
        { role: 'assistant', content: response, action: proposedAction }
      ]);
      setQuery('');
      setIsProcessing(false);
    }, 600);
  };

  const handleSend = () => {
    if (!query.trim()) return;
    processIntent(query);
  };

  const renderFloating = () => (
    <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000 }}>
      {/* Floating Bubble */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="glass"
            style={{
              position: 'absolute',
              bottom: '5rem',
              right: 0,
              width: '380px',
              height: '500px',
              borderRadius: '2rem',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            {/* Header */}
            <div style={{ padding: '1.5rem', background: 'var(--accent)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Sparkles size={20} />
                <span style={{ fontWeight: 700 }}>IPC Intelligence</span>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Chat Messages */}
            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.map((m, i) => (
                <div key={i} style={{ 
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  maxWidth: '85%'
                }}>
                  <div style={{ 
                    background: m.role === 'user' ? 'var(--accent)' : 'var(--bg-subtle)',
                    color: m.role === 'user' ? 'white' : 'var(--text)',
                    padding: '0.75rem 1rem',
                    borderRadius: m.role === 'user' ? '1.25rem 1.25rem 0.25rem 1.25rem' : '1.25rem 1.25rem 1.25rem 0.25rem',
                    fontSize: '0.9rem',
                    lineHeight: 1.5
                  }}>
                    {m.content}
                  </div>
                  {m.action && (
                    <div className="glass" style={{ padding: '1rem', borderRadius: '1rem', border: '1px solid var(--accent)33', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>
                          <Zap size={14} color="var(--accent)" /> Instruction détectée
                       </div>
                       <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Action: {m.action.label}</div>
                       <button 
                         onClick={() => executeAction(m.action)}
                         style={{ 
                           background: 'var(--accent)', 
                           color: 'white', 
                           border: 'none', 
                           padding: '0.5rem', 
                           borderRadius: '0.5rem', 
                           fontSize: '0.8rem', 
                           fontWeight: 700, 
                           cursor: 'pointer',
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'center',
                           gap: '0.5rem'
                         }}
                       >
                         <CheckCircle2 size={16} /> Valider l'exécution
                       </button>
                    </div>
                  )}
                </div>
              ))}
              {isProcessing && (
                <div style={{ alignSelf: 'flex-start', background: 'var(--bg-subtle)', padding: '0.75rem 1rem', borderRadius: '1rem' }}>
                   <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }}>...</motion.div>
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-subtle)', padding: '0.5rem', borderRadius: '1rem' }}>
                <input 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Posez une question..."
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', padding: '0.5rem' }}
                />
                <button 
                  onClick={startVoice}
                  style={{ background: isRecording ? '#EF4444' : 'transparent', border: 'none', color: isRecording ? 'white' : 'var(--accent)', padding: '0.5rem', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Mic size={20} />
                </button>
                <button 
                  onClick={handleSend}
                  style={{ background: 'var(--accent)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: 700 }}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {config.aiPreference !== 'spotlight' && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '30px',
            background: 'var(--accent)',
            color: 'white',
            border: 'none',
            boxShadow: '0 10px 25px rgba(82, 153, 144, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Sparkles size={28} />
        </motion.button>
      )}
    </div>
  );

  const renderSpotlight = () => (
    <AnimatePresence>
      {spotlightOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000 }}>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSpotlightOpen(false)}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)' }}
          />
          
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            className="glass"
            style={{
              position: 'relative',
              width: '700px',
              margin: '10vh auto',
              background: 'var(--bg)',
              borderRadius: '1.5rem',
              overflow: 'hidden',
              boxShadow: '0 30px 60px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
              <Sparkles size={24} color="var(--accent)" style={{ marginRight: '1rem' }} />
              <input 
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Chercher une donnée, naviguer ou analyser..."
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '1.25rem' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                 <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg-subtle)', padding: '0.2rem 0.5rem', borderRadius: '0.4rem', border: '1px solid var(--border)' }}>ESC</div>
                 <X size={20} color="var(--text-muted)" style={{ cursor: 'pointer' }} onClick={() => setSpotlightOpen(false)} />
              </div>
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '1rem' }}>
              {query === "" && results.length === 0 && (
                <div style={{ padding: '1rem' }}>
                   <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase' }}>Suggestions d'IA</div>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {[
                        { icon: <Search size={16}/>, text: "Chercher lead 'Raphael'" },
                        { icon: <Zap size={16}/>, text: "Total ventes ce mois" },
                        { icon: <Layout size={16}/>, text: "Aller au module RH" },
                        { icon: <HelpCircle size={16}/>, text: "Besoin d'aide sur les factures" }
                      ].map((s, i) => (
                        <div key={i} onClick={() => setQuery(s.text)} style={{ padding: '1rem', background: 'var(--bg-subtle)', borderRadius: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                           {s.icon} <span style={{ fontSize: '0.9rem' }}>{s.text}</span>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              {searchResults.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '0.5rem' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>Résultats de recherche</div>
                  {searchResults.slice(0, 10).map((res, i) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ x: 4, background: 'var(--bg-subtle)' }}
                      onClick={() => { navigateTo(res.appId); setSpotlightOpen(false); }}
                      style={{ padding: '0.85rem 1rem', borderRadius: '0.75rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '6px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--border)' }}>
                           <Layout size={14} color="var(--accent)" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase' }}>{res.type}</div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{res.name}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{res.appId}</span>
                        <ArrowRight size={16} color="var(--border)" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            
            <div style={{ padding: '0.75rem 1.5rem', background: 'var(--bg-subtle)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
               <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <span><Command size={12} style={{verticalAlign: 'middle'}}/> K - Ouvrir</span>
                  <span>ENTER - Sélectionner</span>
               </div>
               <span style={{ fontWeight: 600, color: 'var(--accent)' }}>IPC Intelligence v1.0</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {renderFloating()}
      {renderSpotlight()}
    </>
  );
};

export default AIAssistant;
