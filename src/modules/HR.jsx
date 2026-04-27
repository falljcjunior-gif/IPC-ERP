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

  const pendingCount = [
    ...(hrData.leaves || []).filter(l => l.statut === 'En attente' || l.statut === 'Brouillon'),
    ...(hrData.expenses || []).filter(e => e.statut === 'En attente' || e.statut === 'Brouillon')
  ].length;

  const tabs = [
    { id: 'people', label: 'Espace Talents', icon: <Users size={16} /> },
    { 
      id: 'approvals', 
      label: `Validations Nexus${pendingCount > 0 ? ` (${pendingCount})` : ''}`, 
      icon: <CheckSquare size={16} /> 
    },
    { id: 'onboarding', label: 'Intégration Stratégique', icon: <UserPlus size={16} /> }
  ];

  return (
    <div style={{ padding: shellView?.mobile ? '1rem' : '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', minHeight: '100%' }}>
      
      {/* Nexus HR Header */}
      {!shellView?.mobile ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="nexus-glow" style={{ background: 'var(--nexus-primary)', padding: '6px', borderRadius: '10px' }}>
                <Users size={16} color="white" fill="white" />
              </div>
              <span style={{ fontWeight: 900, fontSize: '0.7rem', color: 'var(--nexus-primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                Nexus Talent Intelligence
              </span>
            </div>
            <h1 className="nexus-gradient-text" style={{ fontSize: '3.5rem', fontWeight: 900, margin: 0, letterSpacing: '-2px' }}>
              Human Capital
            </h1>
            <p style={{ color: 'var(--nexus-text-muted)', fontSize: '1.1rem', fontWeight: 500, maxWidth: '650px', lineHeight: 1.6 }}>
              Pilotez l'excellence opérationnelle de vos équipes avec la vision contextuelle Nexus.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {pendingCount > 0 && (
              <motion.div 
                whileHover={{ scale: 1.02 }}
                onClick={() => setMainTab('approvals')}
                className="nexus-card" 
                style={{ 
                  padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'white',
                  border: '1px solid rgba(245, 158, 11, 0.3)', cursor: 'pointer'
                }}
              >
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase' }}>Alertes Nexus</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#F59E0B' }}>{pendingCount} Validation{pendingCount > 1 ? 's' : ''}</div>
                </div>
                <Activity size={24} color="#F59E0B" />
              </motion.div>
            )}
            
            <div className="nexus-card" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'white' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--nexus-text-muted)', textTransform: 'uppercase' }}>Onboarding Actif</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--nexus-primary)' }}>+4 Talents</div>
              </div>
              <TrendingUp size={24} color="var(--nexus-primary)" />
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem' }} className="nexus-gradient-text">Talent Hub</h2>
          <div style={{ background: 'var(--nexus-primary)', color: 'white', padding: '6px 12px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 900 }}>
            {pendingCount} Validations
          </div>
        </div>
      )}

      {/* Navigation Nexus */}
      <div className="nexus-card" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)', padding: '0.5rem', borderRadius: '1.5rem' }}>
        <TabBar tabs={tabs} active={mainTab} onChange={setMainTab} />
      </div>

      {/* Content Nexus */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mainTab}
          initial={{ opacity: 0, scale: 0.98, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -20 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'relative', minHeight: '60vh' }}
        >
          {mainTab === 'people' && <PeopleTab data={hrData} onOpenDetail={onOpenDetail} accessLevel={accessLevel} />}
          {mainTab === 'approvals' && <ApprovalsTab accessLevel={accessLevel} />}
          {mainTab === 'onboarding' && <OnboardingTab accessLevel={accessLevel} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default React.memo(HRControlCenter);
