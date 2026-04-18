import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { auth, db } from '../firebase/config';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { 
  Users, Settings, ChevronLeft, ChevronRight, Bell, Search, LogOut,
  Moon, Sun, Grid, Home, ShoppingCart, Package, FileText, Users2,
  Factory, Briefcase, ShoppingBag, Mail, ArrowRight, ShieldCheck,
  Truck, Wallet, PiggyBank, ChevronDown, TrendingUp, LifeBuoy,
  Calendar as CalIcon, Clock, Layers, FileSignature, BarChart3,
  Folder, Activity as ActivityIcon, Zap, Sparkles, MessageCircle,
  Pin, PinOff, CreditCard, Landmark, Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBusiness } from '../BusinessContext';
import { registry } from '../services/Registry';
import { initRegistry } from '../registry_init';
import DetailOverlay from './DetailOverlay';
import RecordModal from './RecordModal';
import WorkflowAssistant from './WorkflowAssistant';
import NotificationCenter from './NotificationCenter';
import TeamChat from './TeamChat';
import AIAssistant from './AIAssistant';
import CallInterface from './CallInterface';
import MobileNavbar from './MobileNavbar';

/* ══════════════════════════════════════════════════════════════════════════
   PLATFORM SHELL (V1.2 - CLEAN)
   ══════════════════════════════════════════════════════════════════════════ */
const PlatformShell = ({ toggleTheme, theme, setView }) => {
  const { 
    globalSearch, searchResults, updateRecord, addRecord, data, userRole, config, 
    globalSettings, currentUser, permissions, logout, activeApp, 
    setActiveApp, activeCall, setActiveCall, acceptCall, rejectCall, togglePinnedModule 
  } = useBusiness();

  // Unified UI Flags
  const [shellView, setShellView] = useState({
    sidebar: window.innerWidth > 1024,
    mobile: window.innerWidth < 768,
    profile: false,
    ai: false,
    notifs: false,
    chat: false
  });

  const [search, setSearch] = useState({ query: '', focused: false });
  const [details, setDetails] = useState({ record: null, context: { appId: '', subModule: '' } });
  
  // Password Change State
  const [pwdModal, setPwdModal] = useState({ open: false, newPwd: '', confirmPwd: '', error: '', success: '', loading: false });

  // Navigation State (UNQIUE NAMES)
  const [appsPool, setAppsPool] = useState([]);
  const [openSections, setOpenSections] = useState(['Cœur de Métier', 'Opérations & Logistique', 'Finance & Stratégie', 'RH & Collaboration', 'Configuration']);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setShellView(p => ({ 
        ...p, 
        mobile: isMobile, 
        sidebar: isMobile ? false : window.innerWidth > 1024 
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-derived Campaigns for CRM attribution
  const activeCampaigns = useMemo(() => {
    const defaultSources = ['Prospection Directe', 'Bouche à oreille', 'Appel Entrant', 'Email', 'Autre'];
    const dynamicCampaigns = (data?.marketing?.campaigns || []).map(c => c.nom);
    return [...dynamicCampaigns, ...defaultSources];
  }, [data?.marketing?.campaigns]);

  const openDetail = useCallback((record, appId, subModule) => {
    setDetails({ record, context: { appId, subModule } });
  }, []);

  const navigateTo = useCallback((appId) => setActiveApp(appId), [setActiveApp]);

  useEffect(() => {
    // Registry is now initialized at App level. 
    // We just need to sync the appsPool here.
    setAppsPool(registry.getModulesByCategory());
  }, []);

  const toggleSection = (label) => {
    setOpenSections(prev => 
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  useEffect(() => {
    globalSearch(search.query);
  }, [search.query, globalSearch]);

  const renderContent = () => {
    const commonProps = { onOpenDetail: openDetail, navigateTo };
    // 1. Check Registry First (Primary)
    const regModule = registry.getModule(activeApp);
    if (regModule && regModule.component) {
      const RegComponent = regModule.component;
      return <RegComponent {...commonProps} />;
    }

    // 2. Fallback / Loading
    return (
      <div style={{ 
        height: '100%', display: 'flex', flexDirection: 'column', 
        alignItems: 'center', justifyContent: 'center', gap: '1.5rem',
        opacity: 0.6
      }}>
        <div className="spinner" style={{ 
          width: '40px', height: '40px', border: '3px solid var(--border)', 
          borderTop: '3px solid var(--accent)', borderRadius: '50%' 
        }} />
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Initialisation du Module {activeApp}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Moteur de plateforme IPC Intelligence en cours de chargement...</p>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } .spinner { animation: spin 0.8s linear infinite; }`}</style>
      </div>
    );
  };

  return (
    <div style={{ 
      display: 'flex', height: '100vh', background: 'var(--bg-subtle)',
      '--primary': config.theme.primary, '--accent': config.theme.accent,
      '--accent-hover': config.theme.accent + 'dd', '--radius': config.theme.borderRadius
    }}>
      {shellView.mobile && shellView.sidebar && (
        <div onClick={() => setShellView(p => ({ ...p, sidebar: false }))} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }} />
      )}

      <motion.aside
        initial={false}
        animate={{ 
          width: config.theme.isCompact ? (shellView.sidebar ? '180px' : '60px') : (shellView.sidebar ? '260px' : '80px'),
          x: shellView.mobile && !shellView.sidebar ? -280 : 0
        }}
        className="glass"
        style={{ height: '100%', display: 'flex', flexDirection: 'column', zIndex: 1000, borderRight: '1px solid var(--border)', position: shellView.mobile ? 'fixed' : 'relative', background: 'var(--bg)' }}
      >
        <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ minWidth: `${globalSettings.logoWidth || 40}px`, height: `${globalSettings.logoHeight || 40}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={globalSettings.logoUrl || "/logo.png"} alt="IPC" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          {shellView.sidebar && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)' }}>{globalSettings.companyName || "IPC ERP"}</motion.span>}
        </div>

        <nav style={{ flex: 1, padding: '0.5rem', overflowY: 'auto' }}>
          {appsPool.map((cat) => {
            const userPerms = permissions[currentUser.id] || { roles: [], allowedModules: [] };
            const allowedMods = Array.isArray(userPerms.allowedModules) ? userPerms.allowedModules : [];
            const visibleItems = (cat.items || []).filter(item => {
              if (userRole === 'SUPER_ADMIN') return true;
              const itemRoles = Array.isArray(item.roles) ? item.roles : [];
              return allowedMods.includes(item.id) || itemRoles.includes(userRole);
            });
            if (visibleItems.length === 0) return null;
            const isExpanded = openSections.includes(cat.label);

            return (
              <div key={cat.label} style={{ marginBottom: '0.5rem' }}>
                {shellView.sidebar && (
                  <div onClick={() => toggleSection(cat.label)} style={{ padding: '0.5rem 1rem', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                    {cat.label}
                    <ChevronDown size={12} style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: '0.2s' }} />
                  </div>
                )}
                <AnimatePresence initial={false}>
                  {(isExpanded || !shellView.sidebar) && (
                    <motion.div initial={shellView.sidebar ? { height: 0, opacity: 0 } : {}} animate={shellView.sidebar ? { height: 'auto', opacity: 1 } : {}} exit={shellView.sidebar ? { height: 0, opacity: 0 } : {}} style={{ overflow: 'hidden' }}>
                      {visibleItems.map((item) => (
                        <motion.div key={item.id} whileHover={{ x: 5 }} onClick={() => setActiveApp(item.id)} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.6rem 1rem', marginBottom: '0.25rem', borderRadius: '0.6rem', cursor: 'pointer', color: activeApp === item.id ? 'var(--accent)' : 'var(--text-muted)', background: activeApp === item.id ? 'var(--bg)' : 'transparent', fontSize: '0.9rem' }}>
                          {item.icon}
                          {shellView.sidebar && <span style={{ fontWeight: activeApp === item.id ? 700 : 500 }}>{item.label}</span>}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
          <div onClick={() => { logout(); setView('login'); }} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <LogOut size={20} />
            {shellView.sidebar && <span>Déconnexion</span>}
          </div>
        </div>
      </motion.aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header className="glass" style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '70px', borderBottom: '1px solid var(--border)', zIndex: 50 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <button onClick={() => setShellView(p => ({ ...p, sidebar: !p.sidebar }))} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center' }}>
              {shellView.sidebar ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
            </button>
            <div style={{ position: 'relative', flex: 1, minWidth: shellView.mobile ? '40px' : '300px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg)', padding: '0.5rem 1rem', borderRadius: '0.75rem', border: search.focused ? '1px solid var(--accent)' : '1px solid var(--border)', width: '100%' }}>
                <Search size={18} color="var(--text-muted)" />
                <input value={search.query} onChange={(e) => setSearch(p => ({ ...p, query: e.target.value }))} onFocus={() => setSearch(p => ({ ...p, focused: true }))} onBlur={() => setTimeout(() => setSearch(p => ({ ...p, focused: false })), 200)} placeholder="Rechercher..." style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', width: '100%' }} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button onClick={() => setShellView(p => ({ ...p, ai: true }))} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.85rem' }}>
              <Sparkles size={20} /> <span className="hide-mobile">IPC Intelligence</span>
            </button>
            <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text)' }}>{theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}</button>
            <div style={{ position: 'relative' }}>
               <Bell size={22} color="var(--text-muted)" style={{ cursor: 'pointer' }} onClick={() => setShellView(p => ({ ...p, notifs: !p.notifs }))} />
               <NotificationCenter isOpen={shellView.notifs} onClose={() => setShellView(p => ({ ...p, notifs: false }))} />
            </div>
            <div onClick={() => setShellView(p => ({ ...p, chat: true }))} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent)20', color: 'var(--accent)', padding: '0.5rem 1rem', borderRadius: '2rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}><MessageCircle size={18} /> Chat</div>
            <div style={{ position: 'relative' }}>
              <div onClick={() => setShellView(p => ({ ...p, profile: !p.profile }))} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, cursor: 'pointer' }}>{currentUser.nom[0]}</div>
              <AnimatePresence>
                {shellView.profile && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="glass"
                    style={{ position: 'absolute', top: '120%', right: 0, minWidth: '220px', padding: '1rem', borderRadius: '1.25rem', border: '1px solid var(--border)', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', zIndex: 100 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)', marginBottom: '0.75rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{currentUser.nom[0]}</div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{currentUser.nom}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{userRole}</div>
                      </div>
                    </div>
                    <button onClick={() => { setShellView(p => ({...p, profile: false})); setPwdModal(p => ({...p, open: true})) }}
                      style={{ width: '100%', padding: '0.5rem', background: 'transparent', border: 'none', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, borderRadius: '0.5rem' }}>
                      <Key size={16} /> Changer le mot de passe
                    </button>
                    <button onClick={() => { logout(); setView('login'); }}
                      style={{ width: '100%', padding: '0.5rem', background: 'transparent', border: 'none', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, borderRadius: '0.5rem', marginTop: '4px' }}>
                      <LogOut size={16} /> Déconnexion
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto' }}>
           <AnimatePresence mode="wait">
            <motion.div key={activeApp} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>{renderContent()}</motion.div>
           </AnimatePresence>
        </div>
      </main>

      <DetailOverlay 
        isOpen={!!details.record} 
        onClose={() => setDetails({ record: null, context: { appId: '', subModule: '' } })} 
        record={details.record} 
        appId={details.context.appId} 
        subModule={details.context.subModule} 
        onUpdate={updateRecord} 
      />

      <RecordModal 
        isOpen={!!details.context.appId && !details.record}
        onClose={() => setDetails({ record: null, context: { appId: '', subModule: '' } })}
        title={registry.getSchema(details.context.appId)?.models[details.context.subModule]?.label || 'Nouvel Enregistrement'}
        recordType={details.context.subModule}
        fields={Object.entries(registry.getSchema(details.context.appId)?.models[details.context.subModule]?.fields || {}).map(([name, f]) => {
          // Dynamic Injection for Campaign Source
          if (name === 'campagne_id') {
            return { ...f, name, type: 'selection', options: activeCampaigns };
          }
          return { ...f, name };
        })}
        onSave={(formData) => {
          addRecord(details.context.appId, details.context.subModule, formData);
          setDetails({ record: null, context: { appId: '', subModule: '' } });
        }}
      />

      <WorkflowAssistant />
      <TeamChat isOpen={shellView.chat} onClose={() => setShellView(p => ({ ...p, chat: false }))} theme={theme} />
      <AIAssistant spotlightOpen={shellView.ai} setSpotlightOpen={(val) => setShellView(p => ({ ...p, ai: val }))} />
      
      {shellView.mobile && (
        <MobileNavbar 
          activeApp={activeApp} 
          setActiveApp={setActiveApp} 
          onOpenAI={() => setShellView(p => ({ ...p, ai: true }))}
          onOpenSearch={() => setSearch(p => ({ ...p, focused: true }))}
        />
      )}

      {/* Password Change Modal */}
      <AnimatePresence>
        {pwdModal.open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass" style={{ width: '100%', maxWidth: '400px', padding: '2rem', borderRadius: '1.5rem', border: '1px solid var(--border)', background: 'var(--bg)' }}>
              <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Key size={20} color="var(--accent)" /> Changer de mot de passe</h3>
              
              {pwdModal.error && <div style={{ padding: '0.75rem', background: '#EF444415', color: '#EF4444', borderRadius: '0.5rem', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600 }}>{pwdModal.error}</div>}
              {pwdModal.success && <div style={{ padding: '0.75rem', background: '#10B98115', color: '#10B981', borderRadius: '0.5rem', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600 }}>{pwdModal.success}</div>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>Nouveau mot de passe</label>
                  <input type="password" value={pwdModal.newPwd} onChange={e => setPwdModal(p => ({ ...p, newPwd: e.target.value, error: '', success: '' }))}
                    style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text)', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>Confirmer le mot de passe</label>
                  <input type="password" value={pwdModal.confirmPwd} onChange={e => setPwdModal(p => ({ ...p, confirmPwd: e.target.value, error: '', success: '' }))}
                    style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text)', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
                <button onClick={() => setPwdModal({ open: false, newPwd: '', confirmPwd: '', error: '', success: '', loading: false })}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: 'none', background: 'var(--bg-subtle)', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer' }}>
                  Fermer
                </button>
                <button 
                  onClick={async () => {
                    if (pwdModal.newPwd !== pwdModal.confirmPwd) { setPwdModal(p => ({ ...p, error: 'Les mots de passe ne correspondent pas.' })); return; }
                    if (pwdModal.newPwd.length < 6) { setPwdModal(p => ({ ...p, error: 'Le mot de passe doit faire au moins 6 caractères.' })); return; }
                    setPwdModal(p => ({ ...p, loading: true, error: '' }));
                    try {
                      await updatePassword(auth.currentUser, pwdModal.newPwd);
                      // Update DB flag if exists
                      if (currentUser?.id) {
                        await updateDoc(doc(db, 'users', currentUser.id), {
                          'profile.mustChangePassword': false
                        }).catch(e => console.warn("Mise à jour drapeau échouée:", e));
                      }
                      setPwdModal(p => ({ ...p, success: 'Mot de passe mis à jour avec succès.', newPwd: '', confirmPwd: '', loading: false }));
                      setTimeout(() => setPwdModal({ open: false, newPwd: '', confirmPwd: '', error: '', success: '', loading: false }), 2000);
                    } catch (err) {
                      setPwdModal(p => ({ ...p, error: 'Erreur: Veuillez vous reconnecter puis réessayer. (' + err.message + ')', loading: false }));
                    }
                  }}
                  disabled={pwdModal.loading || pwdModal.newPwd === ''}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: 700, cursor: pwdModal.loading ? 'wait' : 'pointer', opacity: pwdModal.loading || pwdModal.newPwd === '' ? 0.7 : 1 }}>
                  {pwdModal.loading ? 'En cours...' : 'Enregistrer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- CALL SYSTEM --- */}
      <AnimatePresence>
        {activeCall && activeCall.status === 'ringing' && !activeCall.accepted && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            style={{ 
              position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 5000, 
              width: '320px', padding: '1.5rem', borderRadius: '1.5rem',
              background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.1)', color: 'white',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)', textAlign: 'center'
            }}
          >
            {/* Animated Pulse Ring */}
            <div className="call-pulse" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent)', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <MessageCircle size={40} />
            </div>
            
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 900, fontSize: '1.1rem' }}>{activeCall.contactName}</h4>
            <p style={{ margin: '0 0 1.5rem 0', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', fontWeight: 600 }}>Appel {activeCall.type === 'video' ? 'Vidéo' : 'Audio'} Entrant...</p>

            <div style={{ display: 'flex', gap: '1rem' }}>
               <button onClick={rejectCall} style={{ flex: 1, padding: '0.8rem', borderRadius: '1rem', border: 'none', background: '#EF4444', color: 'white', fontWeight: 800, cursor: 'pointer' }}>Refuser</button>
               <button onClick={acceptCall} style={{ flex: 1, padding: '0.8rem', borderRadius: '1rem', border: 'none', background: '#10B981', color: 'white', fontWeight: 800, cursor: 'pointer' }}>Répondre</button>
            </div>

            <style>{`
              @keyframes callPulse {
                0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.7); transform: scale(0.95); }
                70% { box-shadow: 0 0 0 20px rgba(139, 92, 246, 0); transform: scale(1); }
                100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); transform: scale(0.95); }
              }
              .call-pulse { animation: callPulse 1.5s infinite; }
            `}</style>
          </motion.div>
        )}
      </AnimatePresence>

      <CallInterface 
        isOpen={activeCall && activeCall.accepted} 
        onClose={() => setActiveCall(null)}
        callId={activeCall?.roomId || activeCall?.id}
        role={activeCall?.role}
        callType={activeCall?.type}
        contactName={activeCall?.contactName}
        onHangup={async () => {
          const roomId = activeCall?.roomId || activeCall?.id;
          if (roomId) {
            try {
               // 1. Cancel any ringing receivers
               const q = query(collection(db, 'calls'), where('roomId', '==', roomId), where('status', '==', 'ringing'));
               const snap = await getDocs(q);
               snap.forEach(d => updateDoc(d.ref, { status: 'ended' }).catch(()=>{}));
               
               // 2. Instruct any active participants in the room to hang up via a room signal
               await setDoc(doc(db, 'rooms', roomId), { status: 'ended', endedAt: new Date().toISOString() }, { merge: true });
            } catch (e) {
               console.warn("Error ending call globally:", e);
            }
          }
          setActiveCall(null);
        }}
      />
    </div>
  );
};

export default PlatformShell;
