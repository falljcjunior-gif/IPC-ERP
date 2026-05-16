import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, CheckSquare, UserPlus, Activity, TrendingUp, Search
} from 'lucide-react';
import { useStore } from '../store';

// On n'importe plus TabBar, on utilise les boutons en verre dépoli
import HumanCapitalTab from './hr/tabs/HumanCapitalTab';
import PeopleTab from './enterprise/tabs/PeopleTab';
import ApprovalsTab from './hr/tabs/ApprovalsTab';
import OnboardingTab from './hr/tabs/OnboardingTab';
import AnimatedCounter from '../components/Dashboard/AnimatedCounter';
import '../components/GlobalDashboard.css';

const HRControlCenter = ({ onOpenDetail, accessLevel }) => {
  const hrData = useStore(state => state.data.hr || {});
  const [mainTab, setMainTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  const pendingCount = [
    ...(hrData.leaves || []).filter(l => l.statut === 'En attente' || l.statut === 'Brouillon'),
    ...(hrData.expenses || []).filter(e => e.statut === 'En attente' || e.statut === 'Brouillon')
  ].length;

  // Performance Index: % of employees with evaluation score >= 3/5 (or any score > 0)
  const performanceIndex = React.useMemo(() => {
    const employees = hrData.employees || [];
    if (employees.length === 0) return 0;
    const scored = employees.filter(e => Number(e.performanceScore || e.score || 0) > 0);
    const avgScore = scored.length > 0
      ? scored.reduce((s, e) => s + Number(e.performanceScore || e.score || 0), 0) / scored.length
      : 0;
    // Normalize to 0-100: assume scores are 0-5
    return avgScore > 0 ? Math.round((avgScore / 5) * 100) : 0;
  }, [hrData.employees]);

  return (
    <div className="luxury-dashboard-container" style={{ padding: '3rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── HEADER LUXURY ── */}
      <div className="luxury-header" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="luxury-subtitle">Nexus Talent Intelligence</div>
          <h1 className="luxury-title" style={{ fontSize: '4rem', letterSpacing: '-0.04em' }}>Human <strong>Capital</strong></h1>
        </div>
        
        <div style={{ display: 'flex', gap: '4rem', alignItems: 'flex-end' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '0.5rem' }}>Indice de Performance</div>
            <div style={{ fontSize: '3.5rem', fontWeight: 900, color: '#111827', lineHeight: 1 }}>
              {performanceIndex > 0
                ? <AnimatedCounter from={0} to={performanceIndex} duration={2} formatter={(v) => `${Math.round(v)}%`} />
                : <span style={{ fontSize: '2rem', color: '#9ca3af' }}>—</span>
              }
            </div>
          </div>
          
          {pendingCount > 0 && (
            <div style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => setMainTab('approvals')}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '0.5rem' }}>Alertes Critiques</div>
              <div style={{ fontSize: '3.5rem', fontWeight: 900, color: '#F59E0B', lineHeight: 1 }}>
                <AnimatedCounter from={0} to={pendingCount} duration={1.5} formatter={(v) => `${v}`} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CONTROLS (FROSTED GLASS TABS & SEARCH) ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.4)', padding: '0.4rem', borderRadius: '1.5rem', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.5)' }}>
          <button 
            onClick={() => setMainTab('dashboard')}
            style={{ 
              padding: '0.8rem 2.5rem', borderRadius: '1.2rem', border: 'none', fontWeight: 800, cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              background: mainTab === 'dashboard' ? 'white' : 'transparent',
              color: mainTab === 'dashboard' ? '#111827' : '#9ca3af',
              boxShadow: mainTab === 'dashboard' ? '0 10px 30px -10px rgba(0,0,0,0.1)' : 'none',
              display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem'
            }}
          >
            <Activity size={16} /> Intelligence
          </button>
          <button 
            onClick={() => setMainTab('people')}
            style={{ 
              padding: '0.8rem 2.5rem', borderRadius: '1.2rem', border: 'none', fontWeight: 800, cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              background: mainTab === 'people' ? 'white' : 'transparent',
              color: mainTab === 'people' ? '#111827' : '#9ca3af',
              boxShadow: mainTab === 'people' ? '0 10px 30px -10px rgba(0,0,0,0.1)' : 'none',
              display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem'
            }}
          >
            <Users size={16} /> Annuaire
          </button>
          <button 
            onClick={() => setMainTab('approvals')}
            style={{ 
              padding: '0.8rem 2.5rem', borderRadius: '1.2rem', border: 'none', fontWeight: 800, cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              background: mainTab === 'approvals' ? 'white' : 'transparent',
              color: mainTab === 'approvals' ? '#111827' : '#9ca3af',
              boxShadow: mainTab === 'approvals' ? '0 10px 30px -10px rgba(0,0,0,0.1)' : 'none',
              display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem'
            }}
          >
            <CheckSquare size={16} /> Validations
          </button>
          <button 
            onClick={() => setMainTab('onboarding')}
            style={{ 
              padding: '0.8rem 2.5rem', borderRadius: '1.2rem', border: 'none', fontWeight: 800, cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              background: mainTab === 'onboarding' ? 'white' : 'transparent',
              color: mainTab === 'onboarding' ? '#111827' : '#9ca3af',
              boxShadow: mainTab === 'onboarding' ? '0 10px 30px -10px rgba(0,0,0,0.1)' : 'none',
              display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem'
            }}
          >
            <UserPlus size={16} /> Onboarding
          </button>
        </div>

        {/* Global Search pour HR */}
        <div style={{ width: '340px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input 
            type="text" 
            placeholder="Explorer le capital humain..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', padding: '1rem 1.5rem 1rem 3.5rem', borderRadius: '2rem', 
              border: 'none', background: 'white',
              boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)',
              fontSize: '0.95rem', outline: 'none', fontWeight: 600, color: '#111827'
            }} 
          />
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ flex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={mainTab}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: 'relative', minHeight: '60vh' }}
          >
            {mainTab === 'dashboard' && <HumanCapitalTab data={hrData} onOpenDetail={onOpenDetail} searchQuery={searchQuery} />}
            {mainTab === 'people' && <PeopleTab data={hrData} onOpenDetail={onOpenDetail} accessLevel={accessLevel} searchQuery={searchQuery} />}
            {mainTab === 'approvals' && <ApprovalsTab accessLevel={accessLevel} />}
            {mainTab === 'onboarding' && <OnboardingTab accessLevel={accessLevel} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default React.memo(HRControlCenter);
