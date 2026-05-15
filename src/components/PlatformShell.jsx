import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { AuthService } from '../services/auth.service';
import { FirestoreService } from '../services/firestore.service';
import { 
  Users, Settings, ChevronLeft, ChevronRight, Bell, Search, LogOut,
  Moon, Sun, Grid, Home, ShoppingCart, Package as Box, FileText, Users2,
  Factory, Briefcase, ShoppingBag, Mail, ArrowRight, ShieldCheck,
  Truck, Wallet, PiggyBank, ChevronDown, TrendingUp, LifeBuoy,
  Calendar as CalIcon, Clock, Layers, FileSignature, BarChart3,
  Folder, Activity as ActivityIcon, Zap, Cpu, MessageCircle,
  Pin, PinOff, CreditCard, Landmark, Key, Camera, Globe, Command
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { registry } from '../services/Registry';
import { useStore } from '../store';
import { isCreatorEmail } from '../utils/creators';
import { useTranslation } from 'react-i18next';

// Lazy loaded components
const DetailOverlay = lazy(() => import('./DetailOverlay'));
import RecordModal from './RecordModal';
import WorkflowAssistant from './WorkflowAssistant';
import ToastContainer from './ToastContainer';
import NotificationCenter from './NotificationCenter';
import { useNotificationStore } from '../store/useNotificationStore';
import TeamChat from './TeamChat';
import AIAssistant from './AIAssistant';
import CallInterface from './CallInterface';
import CallRingingOverlay from './CallRingingOverlay';
import MobileNavbar from './MobileNavbar';
import BarcodeScanner from './BarcodeScanner';
import PointageWidget from './PointageWidget';
import AntigravitySearch from './NexusSearch';

/* ══════════════════════════════════════════════════════════════════════════
   PLATFORM SHELL (NEXT GEN REDESIGN)
   ══════════════════════════════════════════════════════════════════════════ */
const PlatformShell = ({ theme, setView }) => {
  const { t, i18n } = useTranslation();
  const globalSearch = useStore(s => s.globalSearch);
  const searchResults = useStore(s => s.searchResults);
  const updateRecord = useStore(s => s.updateRecord);
  const addRecord = useStore(s => s.addRecord);
  const config = useStore(s => s.config);
  const globalSettings = useStore(s => s.globalSettings);
  const permissions = useStore(s => s.permissions);
  const getModuleAccess = useStore(s => s.getModuleAccess);
  const logout = useStore(s => s.logout);
  const activeApp = useStore(s => s.activeApp);
  const setActiveApp = useStore(s => s.setActiveApp);
  const activeCall = useStore(s => s.activeCall);
  const setActiveCall = useStore(s => s.setActiveCall);
  const acceptCall = useStore(s => s.acceptCall);
  const rejectCall = useStore(s => s.rejectCall);
  const setActiveBrand = useStore(s => s.setActiveBrand);
  const BRANDS = useStore(s => s.BRANDS);
  const currentUser = useStore(s => s.user);
  const { unreadCount, toggleSidebar } = useNotificationStore();
  const notifications = useStore(s => s.notifications || []);
  const data = useStore(s => s.data);

  // Locatized subscription for campaigns to avoid massive shell re-renders
  const marketingCampaigns = useStore(state => state.data.marketing?.campaigns || []);

  const userRole = currentUser?.role || 'GUEST';
  const activeBrand = globalSettings?.brand || 'ALL';

  // Unified UI Flags
  const [shellView, setShellView] = useState({
    sidebar: window.innerWidth > 1024,
    mobile: window.innerWidth < 768,
    profile: false,
    ai: false,
    notifs: false,
    chat: false
  });

  const [search, setSearch] = useState({ query: '', focused: false, nexusOpen: false });
  const [details, setDetails] = useState({ record: null, context: { appId: '', subModule: '' } });
  
  // Password Change State
  const [pwdModal, setPwdModal] = useState({ open: false, newPwd: '', confirmPwd: '', error: '', success: '', loading: false });

  // Mobile Scanner State
  const [showScanner, setShowScanner] = useState(false);

  // Pointage RH State
  const [showPointage, setShowPointage] = useState(false);

  // Navigation State
  const [appsPool, setAppsPool] = useState([]);

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

  // --- ULTIMATE SECURITY GUARD (FORCED ROLE SYNC) ---
  // [BUG FIX RE-RENDER LOOP] N'utiliser que l'EMAIL dans les deps (string stable),
  // pas l'objet `currentUser` (référence change à chaque setUser → boucle infinie
  // ping-pong avec le syncProfile de BusinessContext).
  const creatorEmail = currentUser?.email;
  useEffect(() => {
    if (isCreatorEmail(creatorEmail) && userRole !== 'SUPER_ADMIN') {
      console.warn('[Shell] Security Guard detected role mismatch. Forcing SUPER_ADMIN for creator.');
      useStore.getState().setUserRole('SUPER_ADMIN');
      // Note: on ne réécrit PAS l'objet user complet — uniquement le role via setUserRole,
      // pour préserver la stabilité de la référence user et éviter la boucle.
    }
  }, [creatorEmail, userRole]);

  //  [IPC] ROUTING ENGINE: SYNC URL WITH ACTIVE APP
  useEffect(() => {
    if (!activeApp) return;
    const currentPath = window.location.pathname;
    const targetPath = activeApp === 'home' ? '/' : `/${activeApp}`;
    
    if (currentPath !== targetPath) {
      window.history.pushState({ appId: activeApp }, '', targetPath);
    }
    
    // Handle browser back/forward buttons
    const handlePopState = (event) => {
      if (event.state?.appId) {
        setActiveApp(event.state.appId);
      } else {
        // Fallback to URL path
        const path = window.location.pathname.substring(1);
        setActiveApp(path || 'home');
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeApp, setActiveApp]);

  // Handle initial URL load
  useEffect(() => {
    const path = window.location.pathname.substring(1);
    if (path && path !== activeApp) {
      // [SECURITY FIX] Validation du module avant switch
      const modules = registry.getAllModules();
      const validModule = modules.find(m => m.id === path);
      if (validModule) {
        setActiveApp(path);
      }
    }
  }, []);
  
  // ── Connect Plus - Real-time Presence & Notifications ──
  useEffect(() => {
    if (!currentUser?.id) return;

    // Presence Management
    const updatePresence = (isOnline) => {
      FirestoreService.updateDocument('users', currentUser.id, {
        isOnline,
        lastSeen: new Date().toISOString()
      }).catch(err => console.warn("Presence Error:", err));
    };

    updatePresence(true);

    const handleVisibilityChange = () => {
      updatePresence(document.visibilityState === 'visible');
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // FCM Registration
    if ("Notification" in window) {
      const registerFCM = async () => {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          const token = await AuthService.getFCMToken();
          if (token) {
            await FirestoreService.updateDocument('users', currentUser.id, { 
              fcmToken: token,
              lastTokenUpdate: new Date().toISOString()
            });
          }
        }
      };
      
      // Delay registration to avoid startup heavy load
      const timer = setTimeout(registerFCM, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      updatePresence(false);
    };
  }, [currentUser?.id]);


  // Auto-derived Campaigns for CRM attribution
  const activeCampaigns = useMemo(() => {
    const defaultSources = ['Prospection Directe', 'Bouche à oreille', 'Appel Entrant', 'Email', 'Autre'];
    const dynamicCampaigns = (marketingCampaigns || []).map(c => c.nom);
    return [...dynamicCampaigns, ...defaultSources];
  }, [marketingCampaigns]);

  const openDetail = useCallback((record, appId, subModule) => {
    setDetails({ record, context: { appId, subModule } });
  }, []);

  const navigateTo = useCallback((appId) => setActiveApp(appId), [setActiveApp]);

  useEffect(() => {
    setAppsPool(registry.getModulesByCategory());
  }, [userRole]);

  useEffect(() => {
    const handler = setTimeout(() => {
      globalSearch(search.query);
    }, 300);
    return () => clearTimeout(handler);
  }, [search.query, globalSearch]);

  const renderContent = () => {
    const accessLevel = getModuleAccess(currentUser?.id, activeApp);
    const commonProps = { 
      onOpenDetail: openDetail, 
      navigateTo, 
      appId: activeApp,
      accessLevel,
      data
    };
    
    const regModule = registry.getModule(activeApp);
    if (regModule && regModule.component) {
      const RegComponent = regModule.component;
      return (
        <Suspense fallback={
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
             <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTop: '3px solid var(--accent)', borderRadius: '50%', marginBottom: '1rem' }} />
             <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Cerveau analytique en cours d'activation...</div>
          </div>
        }>
          <RegComponent {...commonProps} />
        </Suspense>
      );
    }

    return (
      <div style={{ 
        height: '100%', display: 'flex', flexDirection: 'column', 
        alignItems: 'center', justifyContent: 'center', gap: '1.5rem',
        opacity: 0.6, minHeight: '400px'
      }}>
        <div className="spinner" style={{ 
          width: '40px', height: '40px', border: '3px solid var(--border)', 
          borderTop: '3px solid var(--accent)', borderRadius: '50%' 
        }} />
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Initialisation du Module {activeApp}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Moteur de plateforme IPC Intelligence en cours de chargement...</p>
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      display: 'flex', height: '100vh', background: 'var(--bg)',
      '--primary': config?.theme?.primary || '#529990', '--accent': config?.theme?.accent || '#3d7870',
      '--accent-hover': (config?.theme?.accent || '#3d7870') + 'dd', '--radius': config?.theme?.borderRadius || '1rem'
    }}>
      
      {/* ── SIDEBAR (Nexus Floating Control) ── */}
      <motion.aside 
        initial={{ x: -100, opacity: 0 }}
        animate={{ 
          x: shellView.mobile && !shellView.sidebar ? -280 : 0,
          opacity: 1,
          width: shellView.sidebar ? '280px' : '90px'
        }}
        className="antigravity-floating-sidebar"
        style={{
          height: 'calc(100vh - 2rem)',
          margin: '1rem',
          position: shellView.mobile ? 'fixed' : 'relative',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Sidebar Header / Logo */}
        <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--nexus-border)' }}>
          <motion.div 
            whileHover={{ rotate: 180, scale: 1.1 }}
            className="antigravity-glow"
            style={{ 
              minWidth: '40px', 
              height: '40px', 
              background: 'var(--antigravity-primary)', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center'
            }}
          >
            <Cpu size={24} color="white" />
          </motion.div>
          {shellView.sidebar && (
            <div style={{ color: 'var(--antigravity-text)' }}>
              <div style={{ fontWeight: 900, fontSize: '1.2rem', letterSpacing: '-0.02em', lineHeight: 1 }}>IPC</div>
              <div className="antigravity-gradient-text" style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', marginTop: '4px' }}>Antigravity OS</div>
            </div>
          )}
        </div>

        {/* Navigation Section */}
        <div style={{ flex: 1, padding: '1rem 0.5rem', overflowY: 'auto' }}>
          {appsPool.map((cat) => {
            const visibleItems = (cat.items || []).filter(item => {
              if (item.hidden) return false;
              if (userRole === 'SUPER_ADMIN') return true;
              if (!currentUser || currentUser.id === 'guest') return item.id === 'home';
              
              // 1. Always show home
              if (item.id === 'home') return true;

              // 2. Check explicit permissions
              const access = getModuleAccess(currentUser?.id, item.id);
              
              // 3. FALLBACK: If no explicit permissions are defined for this user in the store, 
              // use the registry's default roles as a safe baseline.
              const userHasDefinedPerms = permissions && permissions[currentUser?.id];
              if (!userHasDefinedPerms) {
                return (item.roles || []).includes(userRole);
              }

              return access !== 'none';
            });
            if (visibleItems.length === 0) return null;

            return (
              <div key={cat.label} style={{ marginBottom: '1.5rem' }}>
                {shellView.sidebar && (
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--antigravity-text-muted)', textTransform: 'uppercase', padding: '0 0.75rem 0.5rem 0.75rem', letterSpacing: '1px', opacity: 0.5 }}>
                    {cat.label}
                  </div>
                )}
                {visibleItems.map((item) => {
                  const isActive = activeApp === item.id;
                  return (
                    <motion.div
                      key={item.id}
                      whileHover={{ x: 8, backgroundColor: 'rgba(16, 185, 129, 0.05)' }}
                      onClick={() => setActiveApp(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.85rem 1rem',
                        borderRadius: '1rem',
                        cursor: 'pointer',
                        marginBottom: '0.25rem',
                        color: isActive ? 'var(--antigravity-primary)' : 'var(--antigravity-text-muted)',
                        background: isActive ? 'white' : 'transparent',
                        boxShadow: isActive ? 'var(--shadow-antigravity)' : 'none',
                        border: isActive ? '1px solid var(--antigravity-border)' : '1px solid transparent',
                        transition: 'var(--transition-antigravity)',
                        position: 'relative'
                      }}
                    >
                      {isActive && (
                        <motion.div layoutId="active-nav" style={{ position: 'absolute', left: 0, width: '4px', height: '60%', background: 'var(--antigravity-primary)', borderRadius: '0 4px 4px 0' }} />
                      )}
                      <div style={{ marginRight: shellView.sidebar ? '1rem' : 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         {React.cloneElement(item.icon, { size: 20 })}
                      </div>
                      {shellView.sidebar && <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t(`nav.${item.id}`, { defaultValue: item.label })}</span>}
                    </motion.div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* User Profile / Bottom */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--nexus-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem' }}>
             <div className="antigravity-glow" style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'var(--antigravity-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800, color: 'white' }}>
                {currentUser?.nom?.charAt(0)}
             </div>
             {shellView.sidebar && (
               <div style={{ color: 'var(--antigravity-text)', flex: 1, overflow: 'hidden' }}>
                 <div style={{ fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{currentUser?.nom}</div>
                 <div style={{ fontSize: '0.7rem', color: 'var(--antigravity-text-muted)', fontWeight: 600 }}>{userRole}</div>
               </div>
             )}
             <button onClick={() => { logout(); setView('login'); }} style={{ background: 'transparent', border: 'none', color: 'var(--antigravity-text-muted)', cursor: 'pointer', opacity: 0.5 }}>
                <LogOut size={18} />
             </button>
          </div>
        </div>
      </motion.aside>

      {/* ── MAIN CONTENT AREA ── */}
      <main style={{ 
        flex: 1, 
        padding: '2rem',
        transition: 'var(--transition)',
        maxWidth: '100vw',
        overflowX: 'hidden',
        overflowY: 'auto'
      }}>
        {/* Topbar (Nexus Glass) */}
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2.5rem',
          padding: '0.75rem 1.5rem',
          background: 'var(--antigravity-glass)',
          backdropFilter: 'blur(8px)',
          borderRadius: '1.25rem',
          border: '1px solid var(--antigravity-border)',
          boxShadow: 'var(--shadow-antigravity)'
        }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1 }}>
              <button onClick={() => setShellView(p => ({ ...p, sidebar: !p.sidebar }))} style={{ background: 'var(--bg-subtle)', border: 'none', cursor: 'pointer', color: 'var(--antigravity-text)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {shellView.sidebar ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
              </button>
              <div 
                onClick={() => setSearch(p => ({ ...p, nexusOpen: true }))}
                style={{ 
                  display: 'flex', alignItems: 'center', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '1rem', padding: '0.5rem 1.25rem', gap: '0.75rem', flex: 1, maxWidth: '450px', cursor: 'pointer', border: '1px solid rgba(16, 185, 129, 0.2)', transition: 'var(--transition-antigravity)' 
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)';
                  e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)';
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(56, 189, 248, 0.2)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.2)';
                  e.currentTarget.style.background = 'rgba(56, 189, 248, 0.05)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Zap size={16} fill="var(--antigravity-primary)" color="var(--antigravity-primary)" />
                <span style={{ fontSize: '0.9rem', color: 'var(--antigravity-primary)', flex: 1, fontWeight: 500, letterSpacing: '0.5px' }}>Antigravity Command Center...</span>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, background: 'rgba(16, 185, 129, 0.1)', color: 'var(--antigravity-primary)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Command size={10} /> K
                </div>
              </div>
           </div>
           
           <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button 
                onClick={() => {
                  const newLng = i18n.language === 'fr' ? 'en' : 'fr';
                  i18n.changeLanguage(newLng);
                }}
                className="antigravity-card" style={{ width: '42px', height: '42px', padding: 0, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                 <Globe size={18} color="var(--antigravity-text)" />
                 <span style={{ fontSize: '0.55rem', fontWeight: 900, position: 'absolute', bottom: -4, background: 'var(--antigravity-primary)', color: 'white', padding: '1px 4px', borderRadius: '4px', textTransform: 'uppercase' }}>
                   {i18n.language.substring(0, 2)}
                 </span>
              </button>
              {/* NotificationCenter Bell Trigger */}
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => toggleSidebar(true)}
                  className="antigravity-card" 
                  style={{ width: '42px', height: '42px', padding: 0, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}
                >
                  <Bell size={20} color="var(--antigravity-text)" />
                  {unreadCount > 0 && (
                    <span style={{ position: 'absolute', top: -5, right: -5, background: '#EF4444', color: 'white', fontSize: '0.65rem', fontWeight: 900, width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>

              <button onClick={() => setShellView(p => ({ ...p, ai: true }))} className="antigravity-card" style={{ padding: '0.6rem 1.25rem', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--antigravity-secondary)', color: 'white', cursor: 'pointer' }}>
                 <Zap size={16} fill="var(--antigravity-primary)" stroke="none" /> Antigravity
              </button>
           </div>
        </header>

        <AntigravitySearch isOpen={search.nexusOpen} onClose={(val) => setSearch(p => ({ ...p, nexusOpen: val }))} />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeApp}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <Suspense fallback={null}>
        <DetailOverlay 
          isOpen={!!details.record} 
          onClose={() => setDetails({ record: null, context: { appId: '', subModule: '' } })} 
          record={details.record} 
          appId={details.context.appId} 
          subModule={details.context.subModule} 
          onUpdate={updateRecord} 
        />
      </Suspense>

      <RecordModal 
        isOpen={!!details.context.appId && !details.record}
        onClose={() => setDetails({ record: null, context: { appId: '', subModule: '' } })}
        title={registry.getSchema(details.context.appId)?.models?.[details.context.subModule]?.label || 'Nouvel Enregistrement'}
        recordType={details.context.subModule}
        appId={details.context.appId}
        fields={Object.entries(registry.getSchema(details.context.appId)?.models?.[details.context.subModule]?.fields || {}).map(([name, f]) => {
          if (name === 'campagne_id') return { ...f, name, type: 'selection', options: activeCampaigns };
          return { ...f, name };
        })}
        onSave={async (formData) => {
          await addRecord(details.context.appId, details.context.subModule, formData);
          setDetails({ record: null, context: { appId: '', subModule: '' } });
        }}
      />

      <WorkflowAssistant />
      <TeamChat isOpen={shellView.chat} onClose={() => setShellView(p => ({ ...p, chat: false }))} theme={theme} />
      <AIAssistant spotlightOpen={shellView.ai} setSpotlightOpen={(val) => setShellView(p => ({ ...p, ai: val }))} activeModule={activeApp} />
      
      {shellView.mobile && <MobileNavbar activeApp={activeApp} setActiveApp={setActiveApp} hasCrmAccess={getModuleAccess(currentUser?.id, 'crm') !== 'none'} onOpenSettings={() => setShellView(p => ({ ...p, profile: true }))} />}

      <AnimatePresence>
        {pwdModal.open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
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
                      await AuthService.mandatoryPasswordUpdate(pwdModal.newPwd);
                      setPwdModal(p => ({ ...p, success: 'Mot de passe mis à jour avec succès.', newPwd: '', confirmPwd: '', loading: false }));
                      setTimeout(() => setPwdModal({ open: false, newPwd: '', confirmPwd: '', error: '', success: '', loading: false }), 2000);
                    } catch (err) {
                      setPwdModal(p => ({ ...p, error: err.message || 'Erreur de sécurité.', loading: false }));
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

      <CallInterface 
        isOpen={activeCall && activeCall.accepted} 
        onClose={() => setActiveCall(null)}
        callId={activeCall?.roomId || activeCall?.id}
        role={activeCall?.role}
        callType={activeCall?.type}
        contactName={activeCall?.contactName}
      />
      <CallRingingOverlay />
      <AnimatePresence>
        {showScanner && <BarcodeScanner onClose={() => setShowScanner(false)} onScan={(text) => { setSearch(p => ({ ...p, query: text })); setShowScanner(false); }} />}
      </AnimatePresence>
      <AnimatePresence>
        {showPointage && <PointageWidget onClose={() => setShowPointage(false)} />}
      </AnimatePresence>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } } 
        .spinner { animation: spin 0.8s linear infinite; }
      `}</style>
      <NotificationCenter />
      <ToastContainer />
    </div>
  );
};

export default PlatformShell;
