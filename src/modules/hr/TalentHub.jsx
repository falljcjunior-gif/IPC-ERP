import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, CalendarClock, ClipboardCheck, Handshake, Plus, Trash2 } from 'lucide-react';
import { useBusiness } from '../../BusinessContext';

const tabs = [
  { id: 'recruitment', label: 'Recrutement', icon: <UserPlus size={16} /> },
  { id: 'leaves', label: 'Congés', icon: <CalendarClock size={16} /> },
  { id: 'appraisals', label: 'Évaluations', icon: <ClipboardCheck size={16} /> },
  { id: 'referrals', label: 'Recommandations', icon: <Handshake size={16} /> },
];

const tabConfig = {
  recruitment: { subModule: 'candidates', title: 'Candidat', fields: ['Nom', 'Poste', 'Statut'] },
  leaves: { subModule: 'leaveRequests', title: 'Demande de congé', fields: ['Employé', 'Du', 'Au'] },
  appraisals: { subModule: 'appraisals', title: 'Évaluation', fields: ['Employé', 'Période', 'Score'] },
  referrals: { subModule: 'referrals', title: 'Recommandation', fields: ['Parrain', 'Candidat', 'Poste'] },
};

const TalentHub = () => {
  const [activeTab, setActiveTab] = useState('recruitment');
  const [form, setForm] = useState({});
  const { data, addRecord, deleteRecord } = useBusiness();
  const config = tabConfig[activeTab];
  const records = useMemo(() => data?.talent?.[config.subModule] || [], [data, config.subModule]);

  const handleCreate = () => {
    const payload = Object.fromEntries(config.fields.map((f) => [f.toLowerCase(), form[f] || '']));
    if (Object.values(payload).every((v) => !String(v).trim())) return;
    addRecord('talent', config.subModule, payload);
    setForm({});
  };

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
          <p style={{ marginTop: 0, color: 'var(--text-muted)' }}>
            Saisie {config.title} — enregistrement immédiat dans le module Talent.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.6rem', marginBottom: '0.8rem' }}>
            {config.fields.map((label) => (
              <input
                key={label}
                value={form[label] || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, [label]: e.target.value }))}
                placeholder={label}
                style={{ padding: '0.65rem 0.75rem', borderRadius: '0.7rem', border: '1px solid var(--border)', background: 'var(--bg)' }}
              />
            ))}
          </div>

          <button className="btn-primary" onClick={handleCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', marginBottom: '1rem' }}>
            <Plus size={16} /> Nouveau
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {records.length === 0 && <div style={{ color: 'var(--text-muted)' }}>Aucune saisie pour cet onglet.</div>}
            {records.map((r) => (
              <div key={r.id} className="glass" style={{ padding: '0.65rem 0.75rem', borderRadius: '0.7rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.9rem' }}>
                  {Object.entries(r)
                    .filter(([k]) => !['id', 'createdAt', 'subModule', 'ownerId'].includes(k))
                    .slice(0, 3)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(' • ')}
                </div>
                <button onClick={() => deleteRecord('talent', config.subModule, r.id)} className="glass" style={{ borderRadius: '0.6rem', padding: '0.35rem' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default TalentHub;
