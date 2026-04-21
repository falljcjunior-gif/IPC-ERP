import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, CheckSquare, Briefcase, Activity, UserPlus
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';

import TabBar from './marketing/components/TabBar';
import PeopleTab from './enterprise/tabs/PeopleTab';
import ApprovalsTab from './hr/tabs/ApprovalsTab';
import OnboardingTab from './hr/tabs/OnboardingTab';

const HRControlCenter = ({ onOpenDetail, accessLevel }) => {
  const { data } = useBusiness();
  const [mainTab, setMainTab] = useState('people');

  // Badge count for approvals
  const pendingCount = [
    ...(data.hr?.leaves || []).filter(l => l.statut === 'En attente' || l.statut === 'Brouillon'),
    ...(data.hr?.expenses || []).filter(e => e.statut === 'En attente' || e.statut === 'Brouillon')
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
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '3rem', minHeight: '1000px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#10B981', marginBottom: '0.75rem' }}>
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 4 }} style={{ background: '#10B98120', padding: '6px', borderRadius: '8px' }}>
              <Briefcase size={18} />
            </motion.div>
            <span style={{ fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2.5px' }}>IPC HR OS</span>
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: 0, letterSpacing: '-1.5px', color: 'var(--text)' }}>Ressources Humaines</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.6rem 0 0 0', fontSize: '1rem', fontWeight: 500, maxWidth: '600px', lineHeight: 1.5 }}>
            Centre de commandement RH : Pilotez la paie, la masse salariale et validez les demandes de vos collaborateurs.
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.75rem 1.25rem', borderRadius: '1.5rem', border: '1px solid #F59E0B40', cursor: 'pointer' }} onClick={() => setMainTab('approvals')}>
            <Activity size={16} color="#F59E0B" />
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F59E0B' }}>
              {pendingCount} demande{pendingCount > 1 ? 's' : ''} en attente de validation
            </span>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem' }}>
        <TabBar tabs={tabs} active={mainTab} onChange={setMainTab} />
      </div>

      {/* Dynamic Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mainTab}
          initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          {mainTab === 'people' && <PeopleTab data={data} onOpenDetail={onOpenDetail} accessLevel={accessLevel} />}
          {mainTab === 'approvals' && <ApprovalsTab accessLevel={accessLevel} />}
          {mainTab === 'onboarding' && <OnboardingTab accessLevel={accessLevel} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default HRControlCenter;
