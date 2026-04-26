import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, CheckSquare, Briefcase, Activity, UserPlus, Sparkles, TrendingUp
} from 'lucide-react';
import { useStore } from '../store';

import TabBar from './marketing/components/TabBar';
import PeopleTab from './enterprise/tabs/PeopleTab';
import ApprovalsTab from './hr/tabs/ApprovalsTab';
import OnboardingTab from './hr/tabs/OnboardingTab';

const HRControlCenter = ({ onOpenDetail, accessLevel }) => {
  const hrData = useStore(state => state.data.hr || {});
  const shellView = useStore(state => state.shellView);
  const [mainTab, setMainTab] = useState('people');

  // Badge count for approvals - Sélecteur isolé pour la performance
  const pendingCount = [
    ...(hrData.leaves || []).filter(l => l.statut === 'En attente' || l.statut === 'Brouillon'),
    ...(hrData.expenses || []).filter(e => e.statut === 'En attente' || e.statut === 'Brouillon')
  ].length;

  const tabs = [
    { id: 'people', label: 'Annuaire & Paie', icon: <Users size={16} /> },
    { 
      id: 'approvals', 
      label: `Approbations${pendingCount > 0 ? ` (${pendingCount})` : ''}`, 
      icon: <CheckSquare size={16} /> 
    },
    { id: 'onboarding', label: 'Onboarding & Accès', icon: <UserPlus size={16} /> }
  ];

  return (
    <div style={{ 
      padding: shellView?.mobile ? '1rem' : '2.5rem', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: shellView?.mobile ? '1.5rem' : '3rem', 
      minHeight: '100%',
      backgroundImage: 'radial-gradient(circle at 0% 0%, rgba(16, 185, 129, 0.03) 0%, transparent 50%)'
    }}>
      
      {/* --- NEXT GEN HEADER --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--accent)', marginBottom: '0.75rem' }}>
            <motion.div 
              animate={{ 
                rotate: [0, 10, -10, 0],
                boxShadow: ['0 0 0px var(--accent-glow)', '0 0 20px var(--accent-glow)', '0 0 0px var(--accent-glow)']
              }} 
              transition={{ repeat: Infinity, duration: 4 }} 
              style={{ background: 'var(--accent)', color: 'white', padding: '8px', borderRadius: '12px' }}
            >
              <Briefcase size={20} />
            </motion.div>
            <span style={{ fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '3px' }}>IPC Talent Cloud</span>
          </div>
          <h1 style={{ fontSize: shellView?.mobile ? '2.5rem' : '3.5rem', fontWeight: 900, margin: 0, letterSpacing: '-0.04em', color: 'var(--text)', lineHeight: 1 }}>Ressources Humaines</h1>
          <p style={{ color: 'var(--text-muted)', margin: '1rem 0 0 0', fontSize: '1.1rem', fontWeight: 500, maxWidth: '700px', lineHeight: 1.6 }}>
            Optimisez le capital humain et pilotez la performance de vos équipes avec une vision à 360°.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {pendingCount > 0 && (
            <motion.div 
              whileHover={{ scale: 1.05 }}
              onClick={() => setMainTab('approvals')}
              className="glass" 
              style={{ 
                display: 'flex', alignItems: 'center', gap: '12px', padding: '0.85rem 1.5rem', 
                borderRadius: '1.25rem', border: '1px solid #F59E0B60', cursor: 'pointer',
                background: 'rgba(245, 158, 11, 0.05)'
              }}
            >
              <Activity size={18} color="#F59E0B" />
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#F59E0B' }}>
                {pendingCount} Alerte{pendingCount > 1 ? 's' : ''} Validation
              </span>
            </motion.div>
          )}
          <div className="glass" style={{ padding: '0.85rem 1.25rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
             <TrendingUp size={18} color="var(--accent)" />
             <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>+4 Recrutements</div>
          </div>
        </div>
      </div>

      {/* --- PREMIUM TAB NAVIGATION --- */}
      <div style={{ display: 'flex', justifyContent: shellView?.mobile ? 'flex-start' : 'center', alignItems: 'center', overflowX: 'auto' }}>
        <TabBar tabs={tabs} active={mainTab} onChange={setMainTab} />
      </div>

      {/* --- CONTENT FRAME --- */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mainTab}
          initial={{ opacity: 0, y: 15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -15, scale: 0.98 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          style={{ position: 'relative' }}
        >
          {mainTab === 'people' && <PeopleTab data={hrData} onOpenDetail={onOpenDetail} accessLevel={accessLevel} />}
          {mainTab === 'approvals' && <ApprovalsTab accessLevel={accessLevel} />}
          {mainTab === 'onboarding' && <OnboardingTab accessLevel={accessLevel} />}
        </motion.div>
      </AnimatePresence>

      <style>{`
        .bento-card-hover:hover { transform: translateY(-5px); border-color: var(--accent); }
      `}</style>
    </div>
  );
};

export default React.memo(HRControlCenter);
