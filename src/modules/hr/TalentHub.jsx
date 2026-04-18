import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, CalendarClock, ClipboardCheck, Handshake } from 'lucide-react';

const tabs = [
  { id: 'recruitment', label: 'Recrutement', icon: <UserPlus size={16} /> },
  { id: 'leaves', label: 'Congés', icon: <CalendarClock size={16} /> },
  { id: 'appraisals', label: 'Évaluations', icon: <ClipboardCheck size={16} /> },
  { id: 'referrals', label: 'Recommandations', icon: <Handshake size={16} /> },
];

const TalentHub = () => {
  const [activeTab, setActiveTab] = useState('recruitment');

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Ressources Humaines</h1>
        <p style={{ marginTop: '0.4rem', color: 'var(--text-muted)' }}>
          Talents, absences, performance et cooptation.
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="glass"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 0.9rem',
              borderRadius: '999px',
              border: '1px solid var(--border)',
              background: activeTab === tab.id ? 'var(--bg-subtle)' : 'transparent',
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          style={{
            padding: '1.25rem',
            borderRadius: '1rem',
            border: '1px solid var(--border)',
            background: 'var(--bg-subtle)',
          }}
        >
          {activeTab === 'recruitment' && <p>Offres, candidats, entretiens, embauche.</p>}
          {activeTab === 'leaves' && <p>Demandes de congés, validation, soldes et calendrier.</p>}
          {activeTab === 'appraisals' && <p>Campagnes d’évaluation, objectifs et feedback.</p>}
          {activeTab === 'referrals' && <p>Programme de cooptation et suivi des recommandations.</p>}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default TalentHub;
