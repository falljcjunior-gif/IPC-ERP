import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { AuthService } from '../services/auth.service';
import { auth } from '../firebase/config';
import { FirestoreService } from '../services/firestore.service';
import { 
  ChevronLeft, ChevronRight, Bell, LogOut, ShieldCheck,
  Zap, Key, Globe, Command
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageTransition } from '../lib/MotionComponents';
import { registry } from '../services/Registry';
import { useStore } from '../store';
import { useTranslation } from 'react-i18next';
import { getTenantContext, onTenantContextChange } from '../services/TenantContext';
import { resolveSpace, getSpaceHome } from '../services/space.config';
import SpaceBadge from './SpaceBadge';

// Lazy loaded components
const DetailOverlay    = lazy(() => import('./DetailOverlay'));
const OnboardingWizard = lazy(() => import('./OnboardingWizard'));
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
import './HoldingShell.css';
import './SubsidiaryShell.css';
import './FoundationShell.css';
import './shell/ERPDark.css';
import './AuraVision.css';
import CommandPalette from './shell/CommandPalette';
import ErrorBoundary from './ErrorBoundary';
import { logger } from '../utils/logger';
import { useIdleTimeout } from '../hooks/useIdleTimeout';

/* ══════════════════════════════════════════════════════════════════════════
   PLATFORM SHELL (NEXT GEN REDESIGN)
   ══════════════════════════════════════════════════════════════════════════ */
const PlatformShell = ({ theme, setView }) => {
  const { t, i18n } = useTranslation();
  // [FIX AUDIT P0] Session idle timeout — déconnexion automatique après inactivité
  useIdleTimeout({ enabled: true });
  const globalSearch = useStore(s => s.globalSearch);
  const updateRecord = useStore(s => s.updateRecord);
  const addRecord = useStore(s => s.addRecord);
  const config = useStore(s => s.config);
  const permissions = useStore(s => s.permissions);
  const getModuleAccess = useStore(s => s.getModuleAccess);
  const logout = useStore(s => s.logout);
  const activeApp = useStore(s => s.activeApp);
  const setActiveApp = useStore(s => s.setActiveApp);
  const activeCall = useStore(s => s.activeCall);
  const setActiveCall = useStore(s => s.setActiveCall);
  const currentUser = useStore(s => s.user);
  const { unreadCount, toggleSidebar } = useNotificationStore();
  const data = useStore(s => s.data);
  // [3-SPACE] TenantContext est la source de vérité pour l'espace actif.
  // Il est posé par BusinessContext dès que syncProfile() complète.
  const [tenantCtx, setTenantCtxLocal] = useState(() => getTenantContext());

  // Locatized subscription for campaigns to avoid massive shell re-renders
  const marketingCampaigns = useStore(state => state.data.marketing?.campaigns || []);

  const userRole = currentUser?.role || tenantCtx?.role || 'GUEST';

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
  const [cmdOpen, setCmdOpen] = useState(false);
  const [details, setDetails] = useState({ record: null, context: { appId: '', subModule: '' } });
  
  // Password Change State
  const [pwdModal, setPwdModal] = useState({ open: false, newPwd: '', confirmPwd: '', error: '', success: '', loading: false });

  // Mobile Scanner State
  const [showScanner, setShowScanner] = useState(false);

  // Pointage RH State
  const [showPointage, setShowPointage] = useState(false);

  // Onboarding Wizard — première connexion
  const [showOnboarding, setShowOnboarding] = useState(() => {
    const uid = currentUser?.id;
    if (!uid || uid === 'guest') return false;
    if (currentUser?.onboardingCompleted) return false;
    try { return !localStorage.getItem(`ipc_onboarded_${uid}`); } catch { return false; }
  });

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

  // Role is always sourced from Firebase Custom Claims via BusinessContext — no client-side override.

  useEffect(() => {
    // Souscrire aux changements de TenantContext pour forcer le re-render
    const unsub = onTenantContextChange((ctx) => setTenantCtxLocal({ ...ctx }));
    return unsub;
  }, []);

  const activeSpace = useMemo(() => {
    // Priorité 1 : TenantContext (posé par syncProfile, fiable et réactif)
    const ctxType = tenantCtx?.entity_type;
    if (ctxType && ctxType !== 'SUBSIDIARY') return ctxType;
    // Priorité 2 : fallback sur le profil store (cas SUBSIDIARY ou loading)
    return resolveSpace(currentUser);
  }, [tenantCtx?.entity_type, tenantCtx?.role, currentUser?.entity_type, currentUser?.role]);

  const canAccessModule = useCallback((appId) => {
    const module = registry.getModule(appId);
    if (!module) return false;
    if (module.hidden) return false;
    if (module.entityTypes?.length && !module.entityTypes.includes(activeSpace)) return false;
    if (appId === 'home') return true;
    if (userRole === 'SUPER_ADMIN') return true;
    if (!currentUser || currentUser.id === 'guest') return false;

    const userHasDefinedPerms = Boolean(permissions && permissions[currentUser?.id]);
    if (!userHasDefinedPerms) {
      return (module.roles || []).includes(userRole);
    }

    return getModuleAccess(currentUser?.id, appId) !== 'none';
  }, [activeSpace, currentUser, getModuleAccess, permissions, userRole]);

  const getSafeFallbackApp = useCallback(() => {
    const preferred = getSpaceHome(activeSpace);
    if (preferred && canAccessModule(preferred)) return preferred;
    const firstAllowed = registry.getModulesByEntityType(activeSpace).find(module => canAccessModule(module.id));
    return firstAllowed?.id || 'home';
  }, [activeSpace, canAccessModule]);

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
      if (canAccessModule(path)) {
        setActiveApp(path);
      } else {
        const fallbackApp = getSafeFallbackApp();
        window.history.replaceState({ appId: fallbackApp }, '', fallbackApp === 'home' ? '/' : `/${fallbackApp}`);
        setActiveApp(fallbackApp);
      }
    }
  }, [activeApp, canAccessModule, getSafeFallbackApp, setActiveApp]);
  
  // ── Connect Plus - Real-time Presence & Notifications ──
  useEffect(() => {
    if (!currentUser?.id) return;
    // Skip presence in dev bypass mode (no Firebase auth token)
    if (!auth.currentUser) return;

    const updatePresence = (isOnline) => {
      FirestoreService.updateDocument('users', currentUser.id, {
        isOnline,
        lastSeen: new Date().toISOString()
      }).catch(err => logger.warn("Presence Error:", err));
    };

    updatePresence(true);

    const handleVisibilityChange = () => {
      updatePresence(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    let fcmTimer = null;
    if ("Notification" in window) {
      const registerFCM = async () => {
        try {
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
        } catch (err) {
          logger.warn('[FCM] Registration failed:', err.message);
        }
      };
      fcmTimer = setTimeout(registerFCM, 3000);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      updatePresence(false);
      if (fcmTimer) clearTimeout(fcmTimer);
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
    // Sidebar dynamique : seuls les modules autorisés pour ce type d'entité
    setAppsPool(registry.getModulesByCategoryForSpace(activeSpace));
  }, [userRole, activeSpace]);

  // [3-SPACE] Auto-routing vers le cockpit du bon espace au premier mount
  useEffect(() => {
    if (!activeApp || activeApp === 'home') {
      const spaceHome = getSafeFallbackApp();
      // Ne reroute QUE si l'app active n'est pas valide pour cet espace
      if (spaceHome) setActiveApp(spaceHome);
    }
  }, [activeApp, getSafeFallbackApp, setActiveApp]);

  useEffect(() => {
    if (!activeApp || canAccessModule(activeApp)) return;
    const fallbackApp = getSafeFallbackApp();
    setActiveApp(fallbackApp);
  }, [activeApp, canAccessModule, getSafeFallbackApp, setActiveApp]);

  useEffect(() => {
    const handler = setTimeout(() => {
      globalSearch(search.query);
    }, 300);
    return () => clearTimeout(handler);
  }, [search.query, globalSearch]);

  // ── Global Ctrl+K / Cmd+K shortcut ──────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(o => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const renderContent = () => {
    if (!canAccessModule(activeApp)) {
      return (
        <div style={{
          minHeight: '420px',
          display: 'grid',
          placeItems: 'center',
          padding: '2rem'
        }}>
          <div style={{
            maxWidth: 520,
            width: '100%',
            border: '1px solid var(--antigravity-border)',
            borderRadius: '1rem',
            background: 'var(--antigravity-glass)',
            boxShadow: 'var(--shadow-antigravity)',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <ShieldCheck size={36} color="var(--antigravity-primary)" style={{ marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--antigravity-text)' }}>Accès module non autorisé</h2>
            <p style={{ color: 'var(--antigravity-text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Ce module n&apos;est pas activé pour votre espace ou votre rôle actuel.
            </p>
            <button
              onClick={() => setActiveApp(getSafeFallbackApp())}
              style={{
                border: 'none',
                borderRadius: '0.75rem',
                padding: '0.75rem 1rem',
                background: 'var(--antigravity-primary)',
                color: 'white',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Retour à l&apos;espace autorisé
            </button>
          </div>
        </div>
      );
    }

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
        <ErrorBoundary key={activeApp} fallbackScope="module" moduleName={activeApp}>
          <Suspense fallback={
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
               <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTop: '3px solid var(--accent)', borderRadius: '50%', marginBottom: '1rem' }} />
               <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Cerveau analytique en cours d&apos;activation...</div>
            </div>
          }>
            <RegComponent {...commonProps} />
          </Suspense>
        </ErrorBoundary>
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
    <div
      data-space={activeSpace}
      data-erp-theme={theme || 'dark'}
      style={{
        display: 'flex', height: '100vh', overflow: 'hidden',
        background: 'var(--bg)',
        '--primary': config?.theme?.primary || '#10B981',
        '--accent':  config?.theme?.accent  || '#10B981',
        '--accent-hover': (config?.theme?.accent || '#10B981') + 'dd',
        '--radius':  config?.theme?.borderRadius || '1rem'
      }}
    >
      
      {/* ── SIDEBAR (AuraHealth flush full-height) ── */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{
          x: shellView.mobile && !shellView.sidebar ? -260 : 0,
          opacity: 1,
          width: shellView.sidebar ? '260px' : '72px'
        }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="antigravity-floating-sidebar"
        style={{
          height: '100vh',
          flexShrink: 0,
          position: shellView.mobile ? 'fixed' : 'relative',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Sidebar Header / Logo espace actif */}
        {(() => {
          const SIDEBAR_LOGOS = {
            HOLDING:    '/logo-holding.png',
            SUBSIDIARY: '/logo-filiale.png',
            FOUNDATION: '/logo-fondation.png',
          };
          const logoSrc = SIDEBAR_LOGOS[activeSpace] || '/logo-holding.png';
          return (
            <div style={{
              padding: shellView.sidebar ? '1.25rem 1.25rem' : '1rem 0',
              display: 'flex', alignItems: 'center',
              justifyContent: shellView.sidebar ? 'flex-start' : 'center',
              borderBottom: '1px solid var(--nexus-border)',
              minHeight: 72,
              gap: '0.75rem',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'rgba(16,185,129,0.10)',
                border: '1px solid rgba(16,185,129,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}>
                <img src={logoSrc} alt="Logo espace" style={{ height: 22, objectFit: 'contain' }} />
              </div>
              {shellView.sidebar && (
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--antigravity-primary)', opacity: 0.7, lineHeight: 1 }}>
                    IPC Group
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--antigravity-text)', lineHeight: 1.4 }}>
                    {activeSpace === 'HOLDING' ? 'Intelligence Engine' : activeSpace === 'SUBSIDIARY' ? 'Filiale ERP' : 'Foundation'}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* [3-SPACE] Space Badge — indicateur visuel d'espace actif */}
        <SpaceBadge
          entityType={activeSpace}
          entityName={tenantCtx?.entity_name || tenantCtx?.entity_id}
          collapsed={!shellView.sidebar}
        />

        {/* Navigation Section */}
        <div style={{ flex: 1, padding: '0.75rem 0.5rem', overflowY: 'auto', overflowX: 'hidden' }}>
          {appsPool.map((cat) => {
            const visibleItems = (cat.items || []).filter(item => canAccessModule(item.id));
            if (visibleItems.length === 0) return null;

            return (
              <div key={cat.label} style={{ marginBottom: '1.25rem' }}>
                {shellView.sidebar && (
                  <div style={{
                    fontSize: '0.62rem', fontWeight: 800, color: 'var(--antigravity-text-muted)',
                    textTransform: 'uppercase', padding: '0 0.875rem 0.4rem 0.875rem',
                    letterSpacing: '0.12em', opacity: 0.4
                  }}>
                    {cat.label}
                  </div>
                )}
                {visibleItems.map((item) => {
                  const isActive = activeApp === item.id;
                  return (
                    <motion.div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      aria-label={t(`nav.${item.id}`, { defaultValue: item.label })}
                      aria-current={isActive ? 'page' : undefined}
                      whileHover={{ x: isActive ? 0 : 3 }}
                      onClick={() => setActiveApp(item.id)}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveApp(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: shellView.sidebar ? '0.65rem 0.875rem' : '0.65rem 0',
                        justifyContent: shellView.sidebar ? 'flex-start' : 'center',
                        minHeight: '40px',
                        borderRadius: '0.75rem',
                        cursor: 'pointer',
                        marginBottom: '0.15rem',
                        color: isActive
                          ? 'var(--nav-active-text, var(--antigravity-primary))'
                          : 'var(--antigravity-text-muted)',
                        background: isActive
                          ? 'var(--nav-active-bg, rgba(16,185,129,0.10))'
                          : 'transparent',
                        border: isActive
                          ? '1px solid var(--nav-active-border, rgba(16,185,129,0.18))'
                          : '1px solid transparent',
                        transition: 'all 0.18s ease',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-nav"
                          style={{
                            position: 'absolute', left: 0,
                            width: '3px', height: '55%',
                            background: 'var(--nav-active-text, var(--antigravity-primary))',
                            borderRadius: '0 3px 3px 0',
                            boxShadow: '0 0 6px var(--nav-active-text, var(--antigravity-primary))',
                          }}
                        />
                      )}
                      <div style={{
                        marginRight: shellView.sidebar ? '0.75rem' : 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {React.cloneElement(item.icon, { size: 18 })}
                      </div>
                      {shellView.sidebar && (
                        <span style={{ fontWeight: isActive ? 700 : 500, fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t(`nav.${item.id}`, { defaultValue: item.label })}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* AI Copilot card — AuraHealth upgrade-card style */}
        {shellView.sidebar && (
          <div className="erp-sidebar-upgrade-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Zap size={13} color="#34D399" />
              <div className="erp-sidebar-upgrade-title">JARVIS AI Copilot</div>
            </div>
            <div className="erp-sidebar-upgrade-sub">Analyse en temps réel · Prévisions · Alertes proactives</div>
            <button className="erp-sidebar-upgrade-btn" onClick={() => setShellView(p => ({ ...p, ai: true }))}>
              <Zap size={11} /> Activer JARVIS
            </button>
          </div>
        )}

        {/* User Profile / Bottom */}
        <div style={{ padding: '0.75rem 0.625rem', borderTop: '1px solid var(--nexus-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.375rem', borderRadius: '0.75rem' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--antigravity-primary) 0%, rgba(16,185,129,0.7) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', fontWeight: 800, color: 'white',
              boxShadow: '0 2px 8px rgba(16,185,129,0.2)',
            }}>
              {currentUser?.nom?.charAt(0) || '?'}
            </div>
            {shellView.sidebar && (
              <div style={{ color: 'var(--antigravity-text)', flex: 1, overflow: 'hidden', minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {currentUser?.nom || 'Utilisateur'}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--antigravity-primary)', fontWeight: 600, opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {userRole}
                </div>
              </div>
            )}
            <button
              onClick={() => { logout(); setView('login'); }}
              aria-label={t('auth.logout')}
              title={t('auth.logout')}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--antigravity-text-muted)', opacity: 0.45,
                width: '32px', height: '32px', minWidth: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '8px', flexShrink: 0,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.color = '#EF4444'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '0.45'; e.currentTarget.style.color = 'var(--antigravity-text-muted)'; }}
            >
              <LogOut size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* ── MAIN CONTENT AREA ── */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        height: '100vh',
        overflow: 'hidden',
      }}>
        {/* Topbar (AuraHealth floating glass) */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 1.5rem',
          flexShrink: 0,
          background: 'var(--antigravity-glass)',
          backdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: '1px solid var(--antigravity-border)',
          boxShadow: '0 1px 0 rgba(16,185,129,0.05)',
          position: 'relative',
          zIndex: 100,
        }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1 }}>
              <button
                onClick={() => setShellView(p => ({ ...p, sidebar: !p.sidebar }))}
                aria-label={shellView.sidebar ? t('nav.collapse_menu') : t('nav.expand_menu')}
                title={shellView.sidebar ? t('nav.collapse') : t('nav.expand')}
                style={{ background: 'var(--bg-subtle)', border: 'none', cursor: 'pointer', color: 'var(--antigravity-text)', width: '44px', height: '44px', minWidth: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {shellView.sidebar ? <ChevronLeft size={20} aria-hidden="true" /> : <ChevronRight size={20} aria-hidden="true" />}
              </button>

              {/* ── BREADCRUMB NAVIGATION (WCAG 2.4.8) ── */}
              {activeApp && activeApp !== 'home' && (
                <nav
                  aria-label={t('nav.breadcrumb')}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}
                >
                  <button
                    onClick={() => setActiveApp('home')}
                    aria-label="Accueil"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.82rem', padding: '0.35rem 0.5rem', minHeight: '44px', borderRadius: '4px', transition: 'var(--transition)', display: 'flex', alignItems: 'center' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    Accueil
                  </button>
                  <ChevronRight size={12} aria-hidden="true" style={{ flexShrink: 0, opacity: 0.5 }} />
                  <span
                    aria-current="page"
                    style={{ color: 'var(--text)', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}
                  >
                    {(() => {
                      const mod = registry.getModule(activeApp);
                      return mod?.label || t(`nav.${activeApp}`, { defaultValue: activeApp });
                    })()}
                  </span>
                </nav>
              )}

              <div
                onClick={() => setCmdOpen(true)}
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
                aria-label={i18n.language === 'fr' ? 'Passer en anglais' : 'Switch to French'}
                title={i18n.language === 'fr' ? 'Passer en anglais' : 'Switch to French'}
                className="antigravity-card" style={{ width: '44px', height: '44px', minWidth: '44px', padding: 0, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
                 <Globe size={18} color="var(--antigravity-text)" aria-hidden="true" />
                 <span style={{ fontSize: '0.55rem', fontWeight: 900, position: 'absolute', bottom: -4, background: 'var(--antigravity-primary)', color: 'white', padding: '1px 4px', borderRadius: '4px', textTransform: 'uppercase' }}>
                   {i18n.language.substring(0, 2)}
                 </span>
              </button>
              {/* NotificationCenter Bell Trigger */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => toggleSidebar(true)}
                  aria-label={unreadCount > 0 ? `Notifications — ${unreadCount} non lues` : 'Notifications'}
                  title="Notifications"
                  className="antigravity-card"
                  style={{ width: '44px', height: '44px', minWidth: '44px', padding: 0, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}
                >
                  <Bell size={20} color="var(--antigravity-text)" aria-hidden="true" />
                  {unreadCount > 0 && (
                    <span style={{ position: 'absolute', top: -5, right: -5, background: '#EF4444', color: 'white', fontSize: '0.65rem', fontWeight: 900, width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>

              <button onClick={() => setShellView(p => ({ ...p, ai: true }))} className="antigravity-card" style={{ padding: '0.6rem 1.25rem', borderRadius: '1rem', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--antigravity-secondary)', color: 'white', cursor: 'pointer' }}>
                 <Zap size={16} color="white" /> Antigravity
              </button>
           </div>
        </header>

        <CommandPalette
          isOpen={cmdOpen}
          onClose={() => setCmdOpen(false)}
          appsPool={appsPool}
          onNavigate={(id) => setActiveApp(id)}
          onAction={(id) => {
            if (id === '_logout') { logout(); setView('login'); }
            if (id === '_settings') setActiveApp('settings');
          }}
        />
        <AntigravitySearch isOpen={search.nexusOpen} onClose={(val) => setSearch(p => ({ ...p, nexusOpen: val }))} />

        {/* Scrollable content area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '1.75rem 2rem',
          paddingBottom: shellView.mobile ? 'calc(1.75rem + 80px)' : '1.75rem',
        }}>
          <PageTransition id={activeApp}>
            {renderContent()}
          </PageTransition>
        </div>
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
              <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Key size={20} color="var(--accent)" /> {t('auth.change_password')}</h3>
              
              {pwdModal.error && <div style={{ padding: '0.75rem', background: '#EF444415', color: '#EF4444', borderRadius: '0.5rem', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600 }}>{pwdModal.error}</div>}
              {pwdModal.success && <div style={{ padding: '0.75rem', background: '#10B98115', color: '#10B981', borderRadius: '0.5rem', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600 }}>{pwdModal.success}</div>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>{t('auth.new_password')}</label>
                  <input type="password" value={pwdModal.newPwd} onChange={e => setPwdModal(p => ({ ...p, newPwd: e.target.value, error: '', success: '' }))}
                    style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text)', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>{t('auth.confirm_password')}</label>
                  <input type="password" value={pwdModal.confirmPwd} onChange={e => setPwdModal(p => ({ ...p, confirmPwd: e.target.value, error: '', success: '' }))}
                    style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', color: 'var(--text)', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
                <button onClick={() => setPwdModal({ open: false, newPwd: '', confirmPwd: '', error: '', success: '', loading: false })}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: 'none', background: 'var(--bg-subtle)', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer' }}>
                  {t('common.close')}
                </button>
                <button
                  onClick={async () => {
                    if (pwdModal.newPwd !== pwdModal.confirmPwd) { setPwdModal(p => ({ ...p, error: t('auth.passwords_mismatch') })); return; }
                    if (pwdModal.newPwd.length < 6) { setPwdModal(p => ({ ...p, error: t('auth.password_too_short') })); return; }
                    setPwdModal(p => ({ ...p, loading: true, error: '' }));
                    try {
                      await AuthService.mandatoryPasswordUpdate(pwdModal.newPwd);
                      setPwdModal(p => ({ ...p, success: t('auth.password_updated'), newPwd: '', confirmPwd: '', loading: false }));
                      setTimeout(() => setPwdModal({ open: false, newPwd: '', confirmPwd: '', error: '', success: '', loading: false }), 2000);
                    } catch (err) {
                      setPwdModal(p => ({ ...p, error: err.message || t('auth.security_error'), loading: false }));
                    }
                  }}
                  disabled={pwdModal.loading || pwdModal.newPwd === ''}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '0.75rem', border: 'none', background: 'var(--accent)', color: 'white', fontWeight: 700, cursor: pwdModal.loading ? 'wait' : 'pointer', opacity: pwdModal.loading || pwdModal.newPwd === '' ? 0.7 : 1 }}>
                  {pwdModal.loading ? t('common.saving') : t('common.save')}
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

      {/* ── Onboarding Wizard — première connexion ── */}
      <AnimatePresence>
        {showOnboarding && (
          <Suspense fallback={null}>
            <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlatformShell;
