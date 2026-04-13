import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Bell, 
  Search,
  LogOut,
  Moon,
  Sun,
  Grid,
  Home,
  ShoppingCart,
  Package,
  FileText,
  Users2,
  Factory,
  Briefcase,
  ShoppingBag,
  Mail,
  ArrowRight,
  ShieldCheck,
  Truck,
  Wallet,
  PiggyBank,
  ChevronDown,
  TrendingUp,
  LifeBuoy,
  Calendar as CalIcon,
  Clock,
  Layers,
  FileSignature,
  BarChart3,
  Folder,
  Activity as ActivityIcon,
  Zap,
  Sparkles,
  MessageCircle,
  Pin,
  PinOff,
  CreditCard,
  Landmark
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

const DashboardShell = ({ toggleTheme, theme, setView }) => {
  const { 
    globalSearch, searchResults, updateRecord, userRole, config, 
    globalSettings, currentUser, permissions, logout, activeApp, 
    setActiveApp, activeCall, setActiveCall, togglePinnedModule 
  } = useBusiness();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
      else if (window.innerWidth > 1024) setIsSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Collaboration State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Detail View State
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailContext, setDetailContext] = useState({ appId: '', subModule: '' });

  const openDetail = useCallback((record, appId, subModule) => {
    setSelectedRecord(record);
    setDetailContext({ appId, subModule });
  }, []);

  // Initialize Registry on Mount
  useEffect(() => {
    initRegistry(openDetail);
  }, [openDetail]);

  const [dynamicCategories, setDynamicCategories] = useState([]);

  useEffect(() => {
    // Get modules from registry and merge with legacy structure
    const regCats = registry.getModulesByCategory();
    setDynamicCategories(regCats);
  }, []);

  const [expandedCategories, setExpandedCategories] = useState(['Cœur de Métier', 'Opérations & Logistique', 'Finance & Stratégie', 'RH & Collaboration', 'Configuration']);


  const currentCategories = dynamicCategories;

  const [expandedCategories, setExpandedCategories] = useState(['Cœur de Métier', 'Opérations & Logistique', 'Finance & Stratégie', 'RH & Collaboration', 'Configuration']);

  const toggleCategory = (label) => {
    setExpandedCategories(prev => 
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  useEffect(() => {
    globalSearch(searchQuery);
  }, [searchQuery, globalSearch]);

  const renderContent = () => {
    const commonProps = { onOpenDetail: openDetail };
    
    // 1. Try to load from Registry
    const regModule = registry.getModule(activeApp);
    if (regModule && regModule.component) {
      const RegComponent = regModule.component;
      return <RegComponent />;
    }

    // 2. Fallback to Legacy Switch
    switch (activeApp) {
      case 'home':
        return <GlobalDashboard />;
      case 'sales':
        return <Sales {...commonProps} />;
      case 'inventory':
        return <Inventory {...commonProps} />;
      case 'finance':
        return <Finance {...commonProps} />;
      case 'accounting':
        return <Accounting {...commonProps} />;
      case 'hr':
        return <HR {...commonProps} />;
      case 'production':
        return <Production {...commonProps} />;
      case 'projects':
        return <Project {...commonProps} />;
      case 'purchase':
        return <Purchase {...commonProps} />;
      case 'shipping':
        return <Shipping {...commonProps} />;
      case 'marketing':
        return <Marketing {...commonProps} />;
      case 'bi':
        return <BI />;
      case 'masterdata':
        return <MasterData {...commonProps} />;
      case 'calendar':
        return <Calendar />;
      case 'helpdesk':
        return <Helpdesk {...commonProps} />;
      case 'timesheets':
        return <Timesheets />;
      case 'fleet':
        return <Fleet {...commonProps} />;
      case 'quality':
        return <Quality {...commonProps} />;
      case 'expenses':
        return <Expenses {...commonProps} />;
      case 'budget':
        return <Budget />;
      case 'dms':
        return <DMS />;
      case 'contracts':
        return <Contracts {...commonProps} />;
      case 'manufacturing':
        return <Manufacturing {...commonProps} />;
      case 'planning':
        return <Planning />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <SettingsModule />;
      case 'studio':
        return <Studio />;
      case 'user_management':
        return <UserManagement />;
      case 'history':
        return <History />;
      case 'workflows':
        return <Workflows />;
      case 'staff_portal':
        return <StaffPortal />;
      default:
        return (
          <div style={{ padding: '2.5rem' }}>
            <h1 style={{ fontSize: '2rem' }}>Module {activeApp}</h1>
            <p style={{ color: 'var(--text-muted)' }}>Bientôt disponible.</p>
          </div>
        );
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      background: 'var(--bg-subtle)',
      '--primary': config.theme.primary,
      '--accent': config.theme.accent,
      '--accent-hover': config.theme.accent + 'dd',
      '--radius': config.theme.borderRadius
    }}>
      {/* Sidebar Overlay for Mobile */}
      {isMobile && isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 999,
          }}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ 
          width: config.theme.isCompact ? (isSidebarOpen ? '180px' : '60px') : (isSidebarOpen ? '260px' : '80px'),
          x: isMobile && !isSidebarOpen ? -280 : 0
        }}
        className="glass"
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          borderRight: '1px solid var(--border)',
          position: isMobile ? 'fixed' : 'relative',
          background: 'var(--bg)',
        }}
      >
        <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            minWidth: `${globalSettings.logoWidth || 40}px`, 
            height: `${globalSettings.logoHeight || 40}px`, 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <img 
              src={globalSettings.logoUrl || "/logo.png"} 
              alt={globalSettings.companyName || "IPC"} 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
          </div>
          {isSidebarOpen && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)' }}
            >
              {globalSettings.companyName || "IPC ERP"}
            </motion.span>
          )}
        </div>

        <nav style={{ flex: 1, padding: '0.5rem', overflowY: 'auto' }}>
          {/* Pinned Modules Section */}
          {globalSettings.pinnedModules && globalSettings.pinnedModules.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              {isSidebarOpen && (
                <div style={{ padding: '0.5rem 1rem', fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Épinglés
                </div>
              )}
              {categories.flatMap(c => c.items)
                .filter(item => globalSettings.pinnedModules.includes(item.id))
                .filter(item => {
                  if (userRole === 'SUPER_ADMIN') return true;
                  const userPerms = permissions[currentUser.id] || { roles: [], allowedModules: [] };
                  return userPerms.allowedModules.includes(item.id) || item.roles.includes(userRole);
                })
                .map(item => (
                  <motion.div
                    key={`pinned-${item.id}`}
                    whileHover={{ x: 5 }}
                    onClick={() => setActiveApp(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.6rem 1rem',
                      marginBottom: '0.25rem',
                      borderRadius: '0.6rem',
                      cursor: 'pointer',
                      color: activeApp === item.id ? 'var(--accent)' : 'var(--text-muted)',
                      background: activeApp === item.id ? 'var(--bg)' : 'transparent',
                      fontSize: '0.9rem',
                      position: 'relative'
                    }}
                  >
                    {item.icon}
                    {isSidebarOpen && <span style={{ fontWeight: activeApp === item.id ? 700 : 500 }}>{item.label}</span>}
                    {userRole === 'SUPER_ADMIN' && isSidebarOpen && (
                       <Pin 
                         size={12} 
                         onClick={(e) => { e.stopPropagation(); togglePinnedModule(item.id); }}
                         style={{ marginLeft: 'auto', opacity: 0.4 }} 
                       />
                    )}
                  </motion.div>
                ))}
              {isSidebarOpen && <div style={{ height: '1px', background: 'var(--border)', margin: '0.5rem 1rem' }} />}
            </div>
          )}

          {currentCategories.map((cat) => {
            const userPerms = permissions[currentUser.id] || { roles: [], allowedModules: [] };
            const visibleItems = cat.items.filter(item => {
              // Super Admin sees everything
              if (userRole === 'SUPER_ADMIN') return true;
              
              // If user is STAFF, they always see items with 'STAFF' role (default ESS)
              // PLUS any modules explicitly granted by Super Admin
              const hasExplicitAccess = userPerms.allowedModules.includes(item.id);
              const hasRoleAccess = item.roles.includes(userRole);
              
              return hasExplicitAccess || hasRoleAccess;
            });
            if (visibleItems.length === 0) return null;
            
            const isExpanded = expandedCategories.includes(cat.label);

            return (
              <div key={cat.label} style={{ marginBottom: '0.5rem' }}>
                {isSidebarOpen && (
                  <div 
                    onClick={() => toggleCategory(cat.label)}
                    style={{ 
                      padding: '0.5rem 1rem', 
                      fontSize: '0.65rem', 
                      fontWeight: 800, 
                      color: 'var(--text-muted)', 
                      textTransform: 'uppercase', 
                      letterSpacing: '1px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    {cat.label}
                    <ChevronDown size={12} style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: '0.2s' }} />
                  </div>
                )}
                
                <AnimatePresence initial={false}>
                  {(isExpanded || !isSidebarOpen) && (
                    <motion.div
                      initial={isSidebarOpen ? { height: 0, opacity: 0 } : {}}
                      animate={isSidebarOpen ? { height: 'auto', opacity: 1 } : {}}
                      exit={isSidebarOpen ? { height: 0, opacity: 0 } : {}}
                      style={{ overflow: 'hidden' }}
                    >
                      {visibleItems.map((item) => (
                        <motion.div
                          key={item.id}
                          whileHover={{ x: 5 }}
                          onClick={() => setActiveApp(item.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '0.6rem 1rem',
                            marginBottom: '0.25rem',
                            borderRadius: '0.6rem',
                            cursor: 'pointer',
                            color: activeApp === item.id ? 'var(--accent)' : 'var(--text-muted)',
                            background: activeApp === item.id ? 'var(--bg)' : 'transparent',
                            fontSize: '0.9rem'
                          }}
                        >
                          {item.icon}
                          {isSidebarOpen && <span style={{ fontWeight: activeApp === item.id ? 700 : 500 }}>{item.label}</span>}
                          {userRole === 'SUPER_ADMIN' && isSidebarOpen && (
                             <motion.div 
                               initial={{ opacity: 0 }}
                               whileHover={{ opacity: 1 }}
                               onClick={(e) => { e.stopPropagation(); togglePinnedModule(item.id); }}
                               style={{ marginLeft: 'auto', cursor: 'pointer' }}
                             >
                               {globalSettings.pinnedModules?.includes(item.id) ? <PinOff size={12} /> : <Pin size={12} />}
                             </motion.div>
                          )}
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
            {isSidebarOpen && <span>Déconnexion</span>}
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header className="glass" style={{
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '70px',
          borderBottom: '1px solid var(--border)',
          zIndex: 50
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text)', display: 'flex', alignItems: 'center' }}
            >
              {isSidebarOpen ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
            </button>

            {activeApp !== 'home' && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
              >
                <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />
                <button 
                  onClick={() => setActiveApp('home')}
                  style={{ 
                    background: 'var(--bg-subtle)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '0.5rem', 
                    padding: '0.4rem 0.75rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)40'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <Home size={14} /> Retour
                </button>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)', whiteSpace: 'nowrap' }}>
                  {categories.flatMap(c => c.items).find(i => i.id === activeApp)?.label || 'Module'}
                </span>
                <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />
              </motion.div>
            )}
            
            <div style={{ position: 'relative', flex: 1, minWidth: isMobile ? '40px' : '300px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem',
                background: 'var(--bg)',
                padding: '0.5rem 1rem',
                borderRadius: '0.75rem',
                border: isSearchFocused ? '1px solid var(--accent)' : '1px solid var(--border)',
                width: '100%'
              }}>
                <Search size={18} color="var(--text-muted)" />
                <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  placeholder="Rechercher..." 
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', width: '100%' }}
                />
              </div>

              <AnimatePresence>
                {isSearchFocused && searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="glass"
                    style={{ position: 'absolute', top: 'calc(100% + 10px)', left: 0, width: '100%', maxHeight: '400px', overflowY: 'auto', borderRadius: '1rem', padding: '0.5rem', zIndex: 1000 }}
                  >
                    {searchResults.map((result, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setActiveApp(result.appId);
                          setSearchQuery('');
                        }}
                        style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 700 }}>{result.type}</div>
                          <div style={{ fontWeight: 600 }}>{result.name}</div>
                        </div>
                        <ArrowRight size={16} color="var(--text-muted)" />
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button 
              onClick={() => setSpotlightOpen(true)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.85rem' }}
            >
              <Sparkles size={20} /> <span className="hide-mobile">IPC Intelligence</span>
            </button>
            <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text)' }}>
              {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
            </button>
            
            <div style={{ position: 'relative' }}>
               <Bell 
                  size={22} 
                  color="var(--text-muted)" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} 
               />
               <NotificationCenter isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
            </div>
            
            <div 
               onClick={() => setIsChatOpen(true)}
               style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.5rem', 
                  background: 'var(--accent)20', color: 'var(--accent)', 
                  padding: '0.5rem 1rem', borderRadius: '2rem', cursor: 'pointer',
                  fontWeight: 700, fontSize: '0.85rem'
               }}
            >
               <MessageCircle size={18} />
               Chat
            </div>
            
            <div style={{ position: 'relative' }}>
              <div 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                style={{ 
                  width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', 
                  fontWeight: 600, cursor: 'pointer' 
                }}
              >
                {currentUser.nom[0]}
              </div>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="glass"
                    style={{ 
                      position: 'absolute', top: 'calc(100% + 15px)', right: 0, width: '220px', 
                      padding: '1rem', borderRadius: '1.25rem', zIndex: 1000,
                      boxShadow: 'var(--shadow-lg)'
                    }}
                  >
                    <div style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', pb: '0.75rem' }}>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)' }}>{currentUser.nom}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{currentUser.email}</div>
                      <div style={{ marginTop: '0.4rem', fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase' }}>
                        {currentUser.role}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div 
                        onClick={() => { setActiveApp('settings'); setIsProfileOpen(false); }}
                        style={{ 
                          padding: '0.6rem 1rem', borderRadius: '0.75rem', cursor: 'pointer',
                          color: 'var(--text)', fontWeight: 600, fontSize: '0.9rem',
                          display: 'flex', alignItems: 'center', gap: '0.75rem'
                        }}
                      >
                        <Settings size={16} /> Paramètres Profil
                      </div>
                      
                      <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                         <div onClick={() => { logout(); setView('login'); }} style={{ color: '#EF4444', fontWeight: 600, fontSize: '0.9rem', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <LogOut size={16} /> Déconnexion
                         </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
           <AnimatePresence mode="wait">
            <motion.div
              key={activeApp}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
           </AnimatePresence>
        </div>
      </main>

      {/* Detail View Drawer */}
      <DetailOverlay 
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        record={selectedRecord}
        appId={detailContext.appId}
        subModule={detailContext.subModule}
        onUpdate={updateRecord}
      />

      <NotificationCenter isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
      <WorkflowAssistant />
      <TeamChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} theme={theme} />
      <AIAssistant spotlightOpen={spotlightOpen} setSpotlightOpen={setSpotlightOpen} />

      {/* Global WebRTC Call Interface */}
      {activeCall && (
        <CallInterface 
          isOpen={!!activeCall}
          onClose={() => setActiveCall(null)}
          callId={activeCall.id}
          role={activeCall.role}
          callType={activeCall.type}
          contactName={activeCall.contactName}
          onHangup={() => setActiveCall(null)}
        />
      )}
    </div>
  );
};

export default DashboardShell;
