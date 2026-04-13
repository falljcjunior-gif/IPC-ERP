import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, Settings, ChevronLeft, ChevronRight, Bell, Search, LogOut,
  Moon, Sun, Grid, Home, ShoppingCart, Package, FileText, Users2,
  Factory, Briefcase, ShoppingBag, Mail, ArrowRight, ShieldCheck,
  Truck, Wallet, PiggyBank, ChevronDown, TrendingUp, LifeBuoy,
  Calendar as CalIcon, Clock, Layers, FileSignature, BarChart3,
  Folder, Activity as ActivityIcon, Zap, Sparkles, MessageCircle,
  Pin, PinOff, CreditCard, Landmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlobalDashboard from './GlobalDashboard';
import CRM from '../modules/CRM';
import Sales from '../modules/Sales';
import Inventory from '../modules/Inventory';
import Accounting from '../modules/Accounting';
import Finance from '../modules/Finance';
import HR from '../modules/HR';
import Production from '../modules/Production';
import Project from '../modules/Project';
import Purchase from '../modules/Purchase';
import Marketing from '../modules/Marketing';
import BI from '../modules/BI';
import MasterData from '../modules/MasterData';
import Calendar from '../modules/Calendar';
import Helpdesk from '../modules/Helpdesk';
import Timesheets from '../modules/Timesheets';
import Fleet from '../modules/Fleet';
import Quality from '../modules/Quality';
import Expenses from '../modules/Expenses';
import Budget from '../modules/Budget';
import DMS from '../modules/DMS';
import Contracts from '../modules/Contracts';
import Manufacturing from '../modules/Manufacturing';
import Planning from '../modules/Planning';
import Analytics from '../modules/Analytics';
import StaffPortal from '../modules/StaffPortal';
import UserManagement from '../modules/UserManagement';
import History from '../modules/History';
import Workflows from '../modules/Workflows';
import SettingsModule from '../modules/Settings';
import Shipping from '../modules/Shipping';
import Studio from '../modules/Studio';
import { useBusiness } from '../BusinessContext';
import DetailOverlay from './DetailOverlay';
import WorkflowAssistant from './WorkflowAssistant';
import NotificationCenter from './NotificationCenter';
import TeamChat from './TeamChat';
import AIAssistant from './AIAssistant';
import CallInterface from './CallInterface';
import { registry } from '../services/Registry';
import { initRegistry } from '../registry_init';

/* ══════════════════════════════════════════════════════════════════════════
   PLATFORM SHELL (V1)
   The central command center for the ICP Enterprise ERP.
   ══════════════════════════════════════════════════════════════════════════ */
const PlatformShell = ({ toggleTheme, theme, setView }) => {
  const { 
    globalSearch, searchResults, updateRecord, userRole, config, 
    globalSettings, currentUser, permissions, logout, activeApp, 
    setActiveApp, activeCall, setActiveCall, togglePinnedModule 
  } = useBusiness();

  const [uiState, setUiState] = useState({
    isSidebarOpen: window.innerWidth > 1024,
    isMobile: window.innerWidth < 768,
    isSearchFocused: false,
    isProfileOpen: false,
    spotlightOpen: false,
    isNotificationsOpen: false,
    isChatOpen: false
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailContext, setDetailContext] = useState({ appId: '', subModule: '' });
  
  // Navigation State
  const [navCategories, setNavCategories] = useState([]);
  const [expandedNavLabels, setExpandedNavLabels] = useState(['Cœur de Métier', 'Opérations & Logistique', 'Finance & Stratégie', 'RH & Collaboration', 'Configuration']);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setUiState(prev => ({ 
        ...prev, 
        isMobile: mobile, 
        isSidebarOpen: mobile ? false : window.innerWidth > 1024 
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const openDetail = useCallback((record, appId, subModule) => {
    setSelectedRecord(record);
    setDetailContext({ appId, subModule });
  }, []);

  useEffect(() => {
    initRegistry(openDetail);
    setNavCategories(registry.getModulesByCategory());
  }, [openDetail]);

  const toggleCategory = (label) => {
    setExpandedNavLabels(prev => 
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  useEffect(() => {
    globalSearch(searchQuery);
  }, [searchQuery, globalSearch]);

  const renderContent = () => {
    const commonProps = { onOpenDetail: openDetail };
    const regModule = registry.getModule(activeApp);
    if (regModule && regModule.component) {
      const RegComponent = regModule.component;
      return <RegComponent />;
    }

    switch (activeApp) {
      case 'home': return <GlobalDashboard />;
      case 'sales': return <Sales {...commonProps} />;
      case 'inventory': return <Inventory {...commonProps} />;
      case 'finance': return <Finance {...commonProps} />;
      case 'accounting': return <Accounting {...commonProps} />;
      case 'hr': return <HR {...commonProps} />;
      case 'production': return <Production {...commonProps} />;
      case 'projects': return <Project {...commonProps} />;
      case 'purchase': return <Purchase {...commonProps} />;
      case 'shipping': return <Shipping {...commonProps} />;
      case 'marketing': return <Marketing {...commonProps} />;
      case 'bi': return <BI />;
      case 'masterdata': return <MasterData {...commonProps} />;
      case 'calendar': return <Calendar />;
      case 'helpdesk': return <Helpdesk {...commonProps} />;
      case 'timesheets': return <Timesheets />;
      case 'fleet': return <Fleet {...commonProps} />;
      case 'quality': return <Quality {...commonProps} />;
      case 'expenses': return <Expenses {...commonProps} />;
      case 'budget': return <Budget />;
      case 'dms': return <DMS />;
      case 'contracts': return <Contracts {...commonProps} />;
      case 'manufacturing': return <Manufacturing {...commonProps} />;
      case 'planning': return <Planning />;
      case 'analytics': return <Analytics />;
      case 'settings': return <SettingsModule />;
      case 'studio': return <Studio />;
      case 'user_management': return <UserManagement />;
      case 'history': return <History />;
      case 'workflows': return <Workflows />;
      case 'staff_portal': return <StaffPortal />;
      default:
        return (
          <div style={{ padding: '2.5rem' }}>
            <h1 style={{ fontSize: '2rem' }}>Module {activeApp}</h1>
            <p style={{ color: 'var(--text-muted)' }}>Moteur de plateforme en cours de chargement...</p>
          </div>
        );
    }
  };

  return (
    <div style={{ 
      display: 'flex', height: '100vh', background: 'var(--bg-subtle)',
      '--primary': config.theme.primary, '--accent': config.theme.accent,
      '--accent-hover': config.theme.accent + 'dd', '--radius': config.theme.borderRadius
    }}>
      {uiState.isMobile && uiState.isSidebarOpen && (
        <div onClick={() => setUiState(p => ({ ...p, isSidebarOpen: false }))} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }} />
      )}

      <motion.aside
        initial={false}
        animate={{ 
          width: config.theme.isCompact ? (uiState.isSidebarOpen ? '180px' : '60px') : (uiState.isSidebarOpen ? '260px' : '80px'),
          x: uiState.isMobile && !uiState.isSidebarOpen ? -280 : 0
        }}
        className="glass"
        style={{ height: '100%', display: 'flex', flexDirection: 'column', zIndex: 1000, borderRight: '1px solid var(--border)', position: uiState.isMobile ? 'fixed' : 'relative', background: 'var(--bg)' }}
      >
        <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ minWidth: `${globalSettings.logoWidth || 40}px`, height: `${globalSettings.logoHeight || 40}px`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={globalSettings.logoUrl || "/logo.png"} alt="IPC" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          {uiState.isSidebarOpen && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)' }}>{globalSettings.companyName || "IPC ERP"}</motion.span>}
        </div>

        <nav style={{ flex: 1, padding: '0.5rem', overflowY: 'auto' }}>
          {navCategories.map((cat) => {
            const userPerms = permissions[currentUser.id] || { roles: [], allowedModules: [] };
            const visibleItems = cat.items.filter(item => {
              if (userRole === 'SUPER_ADMIN') return true;
              return userPerms.allowedModules.includes(item.id) || item.roles.includes(userRole);
            });
            if (visibleItems.length === 0) return null;
            const isExpanded = expandedNavLabels.includes(cat.label);

            return (
              <div key={cat.label} style={{ marginBottom: '0.5rem' }}>
                {uiState.isSidebarOpen && (
                  <div onClick={() => toggleCategory(cat.label)} style={{ padding: '0.5rem 1rem', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                    {cat.label}
                    <ChevronDown size={12} style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: '0.2s' }} />
                  </div>
                )}
                <AnimatePresence initial={false}>
                  {(isExpanded || !uiState.isSidebarOpen) && (
                    <motion.div initial={uiState.isSidebarOpen ? { height: 0, opacity: 0 } : {}} animate={uiState.isSidebarOpen ? { height: 'auto', opacity: 1 } : {}} exit={uiState.isSidebarOpen ? { height: 0, opacity: 0 } : {}} style={{ overflow: 'hidden' }}>
                      {visibleItems.map((item) => (
                        <motion.div key={item.id} whileHover={{ x: 5 }} onClick={() => setActiveApp(item.id)} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.6rem 1rem', marginBottom: '0.25rem', borderRadius: '0.6rem', cursor: 'pointer', color: activeApp === item.id ? 'var(--accent)' : 'var(--text-muted)', background: activeApp === item.id ? 'var(--bg)' : 'transparent', fontSize: '0.9rem' }}>
                          {item.icon}
                          {uiState.isSidebarOpen && <span style={{ fontWeight: activeApp === item.id ? 700 : 500 }}>{item.label}</span>}
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
            {uiState.isSidebarOpen && <span>Déconnexion</span>}
          </div>
        </div>
      </motion.aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header className="glass" style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '70px', borderBottom: '1px solid var(--border)', zIndex: 50 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <button onClick={() => setUiState(p => ({ ...p, isSidebarOpen: !p.isSidebarOpen }))} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center' }}>
              {uiState.isSidebarOpen ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
            </button>
            <div style={{ position: 'relative', flex: 1, minWidth: uiState.isMobile ? '40px' : '300px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg)', padding: '0.5rem 1rem', borderRadius: '0.75rem', border: uiState.isSearchFocused ? '1px solid var(--accent)' : '1px solid var(--border)', width: '100%' }}>
                <Search size={18} color="var(--text-muted)" />
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onFocus={() => setUiState(p => ({ ...p, isSearchFocused: true }))} onBlur={() => setTimeout(() => setUiState(p => ({ ...p, isSearchFocused: false })), 200)} placeholder="Rechercher..." style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', width: '100%' }} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button onClick={() => setUiState(p => ({ ...p, spotlightOpen: true }))} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.85rem' }}>
              <Sparkles size={20} /> <span className="hide-mobile">IPC Intelligence</span>
            </button>
            <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text)' }}>{theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}</button>
            <div style={{ position: 'relative' }}>
               <Bell size={22} color="var(--text-muted)" style={{ cursor: 'pointer' }} onClick={() => setUiState(p => ({ ...p, isNotificationsOpen: !p.isNotificationsOpen }))} />
               <NotificationCenter isOpen={uiState.isNotificationsOpen} onClose={() => setUiState(p => ({ ...p, isNotificationsOpen: false }))} />
            </div>
            <div onClick={() => setUiState(p => ({ ...p, isChatOpen: true }))} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent)20', color: 'var(--accent)', padding: '0.5rem 1rem', borderRadius: '2rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}><MessageCircle size={18} /> Chat</div>
            <div onClick={() => setUiState(p => ({ ...p, isProfileOpen: !p.isProfileOpen }))} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, cursor: 'pointer' }}>{currentUser.nom[0]}</div>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto' }}>
           <AnimatePresence mode="wait">
            <motion.div key={activeApp} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>{renderContent()}</motion.div>
           </AnimatePresence>
        </div>
      </main>

      <DetailOverlay isOpen={!!selectedRecord} onClose={() => setSelectedRecord(null)} record={selectedRecord} appId={detailContext.appId} subModule={detailContext.subModule} onUpdate={updateRecord} />
      <WorkflowAssistant />
      <TeamChat isOpen={uiState.isChatOpen} onClose={() => setUiState(p => ({ ...p, isChatOpen: false }))} theme={theme} />
      <AIAssistant spotlightOpen={uiState.spotlightOpen} setSpotlightOpen={(val) => setUiState(p => ({ ...p, spotlightOpen: val }))} />
    </div>
  );
};

export default PlatformShell;
