import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { auth, db } from '../firebase/config';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { 
  Users, Settings, ChevronLeft, ChevronRight, Bell, Search, LogOut,
  Moon, Sun, Grid, Home, ShoppingCart, Package as Box, FileText, Users2,
  Factory, Briefcase, ShoppingBag, Mail, ArrowRight, ShieldCheck,
  Truck, Wallet, PiggyBank, ChevronDown, TrendingUp, LifeBuoy,
  Calendar as CalIcon, Clock, Layers, FileSignature, BarChart3,
  Folder, Activity as ActivityIcon, Zap, Cpu, MessageCircle,
  Pin, PinOff, CreditCard, Landmark, Key, Camera, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { registry } from '../services/Registry';
import { useStore } from '../store';
import { useTranslation } from 'react-i18next';

// Lazy loaded components
const DetailOverlay = lazy(() => import('./DetailOverlay'));
import RecordModal from './RecordModal';
import WorkflowAssistant from './WorkflowAssistant';
import NotificationCenter from './NotificationCenter';
import TeamChat from './TeamChat';
import AIAssistant from './AIAssistant';
import CallInterface from './CallInterface';
import MobileNavbar from './MobileNavbar';
import BarcodeScanner from './BarcodeScanner';
import PointageWidget from './PointageWidget';

/* ══════════════════════════════════════════════════════════════════════════
   PLATFORM SHELL (NEXT GEN REDESIGN)
   ══════════════════════════════════════════════════════════════════════════ */
const PlatformShell = ({ toggleTheme, theme, setView }) => {
  const { t, i18n } = useTranslation();
  const store = useStore();
  const { 
    globalSearch, searchResults, updateRecord, addRecord, data, userRole, config, 
    globalSettings, currentUser, permissions, getModuleAccess, logout, activeApp, 
    setActiveApp, activeCall, setActiveCall, acceptCall, rejectCall, togglePinnedModule,
    activeBrand, setActiveBrand, BRANDS
  } = useStore();

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
    setAppsPool(registry.getModulesByCategory());
  }, []);

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
      accessLevel
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
      '--primary': config.theme.primary, '--accent': config.theme.accent,
      '--accent-hover': config.theme.accent + 'dd', '--radius': config.theme.borderRadius
    }}>
      
      {/* ── SIDEBAR (Floating Glass Control) ── */}
      <motion.aside 
        initial={{ x: -100, opacity: 0 }}
        animate={{ 
          x: shellView.mobile && !shellView.sidebar ? -280 : 0,
          opacity: 1,
          width: shellView.sidebar ? '280px' : '80px'
        }}
        style={{
          width: shellView.sidebar ? '280px' : '80px',
          height: 'calc(100vh - 2rem)',
          margin: '1rem',
          position: shellView.mobile ? 'fixed' : 'relative',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          transition: 'var(--transition)',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 4px 24px -1px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}
      >
        {/* Sidebar Header / Logo */}
        <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <div style={{ 
            minWidth: '40px', 
            height: '40px', 
            background: 'var(--accent)', 
            borderRadius: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 0 20px var(--accent-glow)'
          }}>
            <Box size={24} color="white" />
          </div>
          {shellView.sidebar && (
            <div style={{ color: '#1F363D' }}>
              <div style={{ fontWeight: 900, fontSize: '1.2rem', letterSpacing: '-0.02em', lineHeight: 1 }}>IPC</div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', marginTop: '4px' }}>Control Center</div>
            </div>
          )}
        </div>

        {/* Navigation Section */}
        <div style={{ flex: 1, padding: '1rem 0.5rem', overflowY: 'auto' }}>
          {appsPool.map((cat) => {
            const visibleItems = (cat.items || []).filter(item => {
              if (item.hidden) return false;
              if (userRole === 'SUPER_ADMIN') return true;
              return getModuleAccess(currentUser.id, item.id) !== 'none';
            });
            if (visibleItems.length === 0) return null;

            return (
              <div key={cat.label} style={{ marginBottom: '1.5rem' }}>
                {shellView.sidebar && (
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', padding: '0 0.75rem 0.5rem 0.75rem', letterSpacing: '1px' }}>
                    {cat.label}
                  </div>
                )}
                {visibleItems.map((item) => {
                  const isActive = activeApp === item.id;
                  return (
                    <motion.div
                      key={item.id}
                      whileHover={{ x: 4 }}
                      onClick={() => setActiveApp(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.85rem 1rem',
                        borderRadius: '1rem',
                        cursor: 'pointer',
                        marginBottom: '0.25rem',
                        color: isActive ? '#1F363D' : 'rgba(31, 54, 61, 0.6)',
                        background: isActive ? 'rgba(255, 255, 255, 0.5)' : 'transparent',
                        boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.03)' : 'none',
                        border: isActive ? '1px solid rgba(255,255,255,0.8)' : '1px solid transparent',
                        transition: 'var(--transition)',
                        position: 'relative'
                      }}
                    >
                      {isActive && (
                        <motion.div layoutId="active-nav" style={{ position: 'absolute', left: 0, width: '4px', height: '60%', background: 'var(--accent)', borderRadius: '0 4px 4px 0' }} />
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
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem' }}>
             <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, color: 'white' }}>
                {currentUser?.nom?.charAt(0)}
             </div>
             {shellView.sidebar && (
               <div style={{ color: '#1F363D', flex: 1, overflow: 'hidden' }}>
                 <div style={{ fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{currentUser?.nom}</div>
                 <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>{userRole}</div>
               </div>
             )}
             <button onClick={() => { logout(); setView('login'); }} style={{ background: 'transparent', border: 'none', color: 'rgba(31, 54, 61, 0.4)', cursor: 'pointer' }}>
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
        {/* Topbar (Actions) */}
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2.5rem',
          padding: '0.75rem 1.5rem',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(10px)',
          borderRadius: '1.5rem',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)'
        }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1 }}>
              <button onClick={() => setShellView(p => ({ ...p, sidebar: !p.sidebar }))} style={{ background: 'var(--bg-subtle)', border: 'none', cursor: 'pointer', color: 'var(--text)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {shellView.sidebar ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
              </button>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-subtle)', borderRadius: '1rem', padding: '0.5rem 1rem', gap: '0.75rem', flex: 1, maxWidth: '400px' }}>
                <Search size={18} color="var(--text-muted)" />
                <input value={search.query} onChange={(e) => setSearch(p => ({ ...p, query: e.target.value }))} placeholder="Rechercher ou scanner..." style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '0.85rem', width: '100%' }} />
                <button onClick={() => setShowScanner(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent)' }}>
                  <Camera size={18} />
                </button>
              </div>
           </div>
           
           <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button 
                onClick={toggleTheme}
                className="btn-glass" style={{ width: '40px', height: '40px', padding: 0, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              <button 
                onClick={() => {
                  const newLng = i18n.language === 'fr' ? 'en' : 'fr';
                  i18n.changeLanguage(newLng);
                }}
                className="btn-glass" style={{ width: '40px', height: '40px', padding: 0, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <Globe size={18} />
                 <span style={{ fontSize: '0.6rem', fontWeight: 900, position: 'absolute', bottom: -5, background: 'var(--accent)', color: 'white', padding: '1px 4px', borderRadius: '4px', textTransform: 'uppercase' }}>
                   {i18n.language.substring(0, 2)}
                 </span>
              </button>
              <div style={{ position: 'relative' }}>
                <Bell size={22} color="var(--text-muted)" style={{ cursor: 'pointer' }} onClick={() => setShellView(p => ({ ...p, notifs: !p.notifs }))} />
                <NotificationCenter isOpen={shellView.notifs} onClose={() => setShellView(p => ({ ...p, notifs: false }))} />
              </div>
              <button onClick={() => setShellView(p => ({ ...p, ai: true }))} className="btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: '1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <Cpu size={16} /> Nexus
              </button>
           </div>
        </header>

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
        title={registry.getSchema(details.context.appId)?.models[details.context.subModule]?.label || 'Nouvel Enregistrement'}
        recordType={details.context.subModule}
        appId={details.context.appId}
        fields={Object.entries(registry.getSchema(details.context.appId)?.models[details.context.subModule]?.fields || {}).map(([name, f]) => {
          if (name === 'campagne_id') return { ...f, name, type: 'selection', options: activeCampaigns };
          return { ...f, name };
        })}
        onSave={(formData) => {
          addRecord(details.context.appId, details.context.subModule, formData);
          setDetails({ record: null, context: { appId: '', subModule: '' } });
        }}
      />

      <WorkflowAssistant />
      <TeamChat isOpen={shellView.chat} onClose={() => setShellView(p => ({ ...p, chat: false }))} theme={theme} />
      <AIAssistant spotlightOpen={shellView.ai} setSpotlightOpen={(val) => setShellView(p => ({ ...p, ai: val }))} activeModule={activeApp} />
      
      {shellView.mobile && <MobileNavbar activeApp={activeApp} setActiveApp={setActiveApp} hasCrmAccess={getModuleAccess(currentUser.id, 'crm') !== 'none'} onOpenSettings={() => setShellView(p => ({ ...p, profile: true }))} />}

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
                      await updatePassword(auth.currentUser, pwdModal.newPwd);
                      if (currentUser?.id) await updateDoc(doc(db, 'users', currentUser.id), { 'profile.mustChangePassword': false });
                      setPwdModal(p => ({ ...p, success: 'Mot de passe mis à jour avec succès.', newPwd: '', confirmPwd: '', loading: false }));
                      setTimeout(() => setPwdModal({ open: false, newPwd: '', confirmPwd: '', error: '', success: '', loading: false }), 2000);
                    } catch (err) {
                      setPwdModal(p => ({ ...p, error: 'Erreur: Veuillez vous reconnecter.', loading: false }));
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
    </div>
  );
};

export default PlatformShell;
