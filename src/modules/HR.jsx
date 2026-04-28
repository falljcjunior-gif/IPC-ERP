import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, CheckSquare, UserPlus, Activity, TrendingUp, Search
} from 'lucide-react';
import { useStore } from '../store';

// On n'importe plus TabBar, on utilise les boutons en verre dépoli
import PeopleTab from './enterprise/tabs/PeopleTab';
import ApprovalsTab from './hr/tabs/ApprovalsTab';
import OnboardingTab from './hr/tabs/OnboardingTab';
import AnimatedCounter from '../components/Dashboard/AnimatedCounter';
import '../components/GlobalDashboard.css';

const HRControlCenter = ({ onOpenDetail, accessLevel }) => {
  const hrData = useStore(state => state.data.hr || {});
  const [mainTab, setMainTab] = useState('people');
  const [searchQuery, setSearchQuery] = useState('');

  const pendingCount = [
    ...(hrData.leaves || []).filter(l => l.statut === 'En attente' || l.statut === 'Brouillon'),
    ...(hrData.expenses || []).filter(e => e.statut === 'En attente' || e.statut === 'Brouillon')
  ].length;

  return (
    <div className="luxury-dashboard-container" style={{ padding: '3rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── HEADER LUXURY ── */}
      <div className="luxury-header" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div className="luxury-subtitle">Nexus Talent Intelligence</div>
          <h1 className="luxury-title">Human <strong>Capital</strong></h1>
        </div>
        
        <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-end' }}>
          {pendingCount > 0 && (
            <div style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => setMainTab('approvals')}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Alertes Nexus</div>
              <div className="luxury-value-massive" style={{ fontSize: '3rem', color: '#F59E0B' }}>
                <AnimatedCounter from={0} to={pendingCount} duration={1.5} formatter={(v) => `${v}`} />
              </div>
            </div>
          )}
          
          <div style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => setMainTab('onboarding')}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Onboarding Actif</div>
            <div className="luxury-value-massive" style={{ fontSize: '3rem', color: '#10B981' }}>
              +<AnimatedCounter from={0} to={4} duration={1.5} formatter={(v) => `${v}`} />
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTROLS (FROSTED GLASS TABS & SEARCH) ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.5)', padding: '0.5rem', borderRadius: '1.5rem', backdropFilter: 'blur(10px)' }}>
          <button 
            onClick={() => setMainTab('people')}
            style={{ 
              padding: '0.8rem 2rem', borderRadius: '1rem', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s',
              background: mainTab === 'people' ? 'white' : 'transparent',
              color: mainTab === 'people' ? '#111827' : '#6b7280',
              boxShadow: mainTab === 'people' ? '0 10px 20px -10px rgba(0,0,0,0.1)' : 'none',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            <Users size={16} /> Espace Talents
          </button>
          <button 
            onClick={() => setMainTab('approvals')}
            style={{ 
              padding: '0.8rem 2rem', borderRadius: '1rem', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s',
              background: mainTab === 'approvals' ? 'white' : 'transparent',
              color: mainTab === 'approvals' ? '#111827' : '#6b7280',
              boxShadow: mainTab === 'approvals' ? '0 10px 20px -10px rgba(0,0,0,0.1)' : 'none',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            <CheckSquare size={16} /> Validations {pendingCount > 0 && `(${pendingCount})`}
          </button>
          <button 
            onClick={() => setMainTab('onboarding')}
            style={{ 
              padding: '0.8rem 2rem', borderRadius: '1rem', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s',
              background: mainTab === 'onboarding' ? 'white' : 'transparent',
              color: mainTab === 'onboarding' ? '#111827' : '#6b7280',
              boxShadow: mainTab === 'onboarding' ? '0 10px 20px -10px rgba(0,0,0,0.1)' : 'none',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            <UserPlus size={16} /> Intégration
          </button>
        </div>

        {/* Global Search pour HR */}
        <div style={{ width: '300px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input 
            type="text" 
            placeholder="Rechercher un talent..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', padding: '0.8rem 1rem 0.8rem 3rem', borderRadius: '2rem', 
              border: '1px solid rgba(0,0,0,0.05)', background: 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(10px)', fontSize: '0.9rem', outline: 'none', fontWeight: 500
            }} 
          />
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ flex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={mainTab}
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -20 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            style={{ position: 'relative', minHeight: '60vh' }}
          >
            {/* The child tabs themselves might need minor tweaks, but we pass searchQuery if needed */}
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
