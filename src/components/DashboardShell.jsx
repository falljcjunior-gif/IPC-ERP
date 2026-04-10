import React, { useState, useEffect } from 'react';
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
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlobalDashboard from './GlobalDashboard';
import CRM from '../modules/CRM';
import Sales from '../modules/Sales';
import Inventory from '../modules/Inventory';
import Accounting from '../modules/Accounting';
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
import Studio from '../modules/Studio';
import { useBusiness } from '../BusinessContext';
import DetailOverlay from './DetailOverlay';
import WorkflowAssistant from './WorkflowAssistant';
import NotificationCenter from './NotificationCenter';
import TeamChat from './TeamChat';
import AIAssistant from './AIAssistant';

const DashboardShell = ({ toggleTheme, theme, setView }) => {
  const { globalSearch, searchResults, updateRecord, userRole, config, globalSettings, currentUser, switchUser, permissions, logout, activeApp, setActiveApp } = useBusiness();
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

  const openDetail = (record, appId, subModule) => {
    setSelectedRecord(record);
    setDetailContext({ appId, subModule });
  };

  const categories = [
    {
      label: 'Cœur de Métier',
      items: [
        { id: 'home', icon: <Home size={18} />, label: 'Tableau de bord', roles: ['ADMIN', 'SALES', 'HR', 'FINANCE'] },
        { id: 'crm', icon: <Users size={18} />, label: 'CRM', roles: ['ADMIN', 'SALES'] },
        { id: 'sales', icon: <ShoppingCart size={18} />, label: 'Ventes', roles: ['ADMIN', 'SALES', 'FINANCE'] },
        { id: 'marketing', icon: <Mail size={18} />, label: 'Marketing', roles: ['ADMIN', 'HR', 'SALES'] },
      ]
    },
    {
      label: 'Opérations & Logistique',
      items: [
        { id: 'inventory', icon: <Package size={18} />, label: 'Stocks', roles: ['ADMIN', 'SALES', 'FINANCE'] },
        { id: 'production', icon: <Factory size={18} />, label: 'Projets Prod', roles: ['ADMIN', 'HR'] },
        { id: 'manufacturing', icon: <Layers size={18} />, label: 'Manufacturing', roles: ['ADMIN', 'PRODUCTION', 'FINANCE'] },
        { id: 'purchase', icon: <ShoppingBag size={18} />, label: 'Achats', roles: ['ADMIN', 'FINANCE'] },
        { id: 'fleet', icon: <Truck size={18} />, label: 'Parc Auto', roles: ['ADMIN', 'SALES', 'HR'] },
        { id: 'quality', icon: <ShieldCheck size={18} />, label: 'Qualité', roles: ['ADMIN', 'PRODUCTION'] },
      ]
    },
    {
      label: 'Finance & Stratégie',
      items: [
        { id: 'accounting', icon: <FileText size={18} />, label: 'Comptabilité', roles: ['ADMIN', 'FINANCE'] },
        { id: 'expenses', icon: <Wallet size={18} />, label: 'Frais', roles: ['ADMIN', 'SALES', 'HR', 'FINANCE'] },
        { id: 'budget', icon: <PiggyBank size={18} />, label: 'Budget', roles: ['ADMIN', 'FINANCE'] },
        { id: 'contracts', icon: <FileSignature size={18} />, label: 'Contrats', roles: ['ADMIN', 'FINANCE', 'SALES'] },
        { id: 'bi', icon: <TrendingUp size={18} />, label: 'Analyses BI', roles: ['ADMIN', 'FINANCE', 'SALES'] },
        { id: 'analytics', icon: <BarChart3 size={18} />, label: 'Enterprise BI', roles: ['ADMIN', 'FINANCE'] },
      ]
    },
    {
      label: 'RH & Collaboration',
      items: [
        { id: 'hr', icon: <Users2 size={18} />, label: 'RH', roles: ['ADMIN', 'HR'] },
        { id: 'staff_portal', icon: <Users2 size={18} />, label: 'Mon Espace', roles: ['STAFF', 'ADMIN'] },
        { id: 'timesheets', icon: <Clock size={18} />, label: 'Temps', roles: ['ADMIN', 'SALES', 'HR', 'STAFF'] },
        { id: 'projects', icon: <Briefcase size={18} />, label: 'Projets Collab', roles: ['ADMIN', 'HR'] },
        { id: 'calendar', icon: <CalIcon size={18} />, label: 'Agenda', roles: ['ADMIN', 'SALES', 'HR', 'STAFF'] },
        { id: 'planning', icon: <CalIcon size={18} />, label: 'Planning Global', roles: ['ADMIN', 'HR', 'PRODUCTION', 'STAFF'] },
        { id: 'dms', icon: <Folder size={18} />, label: 'G.E.D', roles: ['ADMIN', 'HR', 'FINANCE', 'SALES', 'STAFF'] },
        { id: 'helpdesk', icon: <LifeBuoy size={18} />, label: 'Helpdesk', roles: ['ADMIN', 'SALES'] },
      ]
    },
    {
      label: 'Configuration',
      items: [
        { id: 'masterdata', icon: <Grid size={18} />, label: 'Données Maîtres', roles: ['ADMIN', 'SALES', 'FINANCE'] },
        { id: 'studio', icon: <Layers size={18} />, label: 'IPC Studio', roles: ['ADMIN'] },
        { id: 'history', icon: <ActivityIcon size={18} />, label: 'Historique d\'Audit', roles: ['ADMIN', 'STAFF'] },
        { id: 'workflows', icon: <Zap size={18} />, label: 'Automatisations', roles: ['ADMIN'] },
        { id: 'user_management', icon: <ShieldCheck size={18} />, label: 'Gestion Utilisateurs', roles: ['SUPER_ADMIN'] },
        { id: 'settings', icon: <Settings size={18} />, label: 'Paramètres', roles: ['ADMIN', 'SALES', 'HR', 'FINANCE'] },
      ]
    }
  ];


  const currentCategories = categories;

  const [expandedCategories, setExpandedCategories] = useState(['Cœur de Métier', 'Opérations & Logistique', 'Finance & Stratégie', 'RH & Collaboration', 'Configuration']);

  const toggleCategory = (label) => {
    setExpandedCategories(prev => 
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  useEffect(() => {
    globalSearch(searchQuery);
  }, [searchQuery]);

  const renderContent = () => {
    const commonProps = { onOpenDetail: openDetail };
    
    switch (activeApp) {
      case 'home':
        return <GlobalDashboard />;
      case 'crm':
        return <CRM {...commonProps} />;
      case 'sales':
        return <Sales {...commonProps} />;
      case 'inventory':
        return <Inventory {...commonProps} />;
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text)' }}
            >
              {isSidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
            </button>
            
            <div style={{ position: 'relative', flex: 1, maxWidth: isMobile ? '100%' : '400px' }}>
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
      <TeamChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <AIAssistant spotlightOpen={spotlightOpen} setSpotlightOpen={setSpotlightOpen} />
    </div>
  );
};

export default DashboardShell;
