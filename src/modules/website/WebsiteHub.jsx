import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ShoppingBag, PenSquare, MessageSquare, Headphones, GraduationCap, Plus, Trash2 } from 'lucide-react';
import { useBusiness } from '../../BusinessContext';

const tabs = [
  { id: 'site_web', label: 'Site Web', icon: <Globe size={16} /> },
  { id: 'ecommerce', label: 'eCommerce', icon: <ShoppingBag size={16} /> },
  { id: 'blog', label: 'Blog', icon: <PenSquare size={16} /> },
  { id: 'forum', label: 'Forum', icon: <MessageSquare size={16} /> },
  { id: 'live_chat', label: 'Live Chat', icon: <Headphones size={16} /> },
  { id: 'elearning', label: 'eLearning', icon: <GraduationCap size={16} /> },
];

const cardStyle = {
  padding: '1.25rem',
  borderRadius: '1rem',
  border: '1px solid var(--border)',
  background: 'var(--bg-subtle)',
};

const tabConfig = {
  site_web: { subModule: 'pages', title: 'Page web', fields: ['Titre', 'Slug', 'Statut'] },
  ecommerce: { subModule: 'products', title: 'Produit eCommerce', fields: ['Nom', 'SKU', 'Prix'] },
  blog: { subModule: 'posts', title: 'Article blog', fields: ['Titre', 'Auteur', 'Catégorie'] },
  forum: { subModule: 'topics', title: 'Sujet forum', fields: ['Titre', 'Auteur', 'Tag'] },
  live_chat: { subModule: 'chats', title: 'Conversation chat', fields: ['Visiteur', 'Canal', 'Statut'] },
  elearning: { subModule: 'courses', title: 'Cours eLearning', fields: ['Titre', 'Formateur', 'Niveau'] },
};

const WebsiteHub = () => {
  const [activeTab, setActiveTab] = useState('site_web');
  const [form, setForm] = useState({});
  const { data, addRecord, deleteRecord } = useBusiness();

  const config = tabConfig[activeTab];
  const records = useMemo(() => data?.website?.[config.subModule] || [], [data, config.subModule]);

  const handleCreate = () => {
    const payload = Object.fromEntries(config.fields.map((f) => [f.toLowerCase(), form[f] || '']));
    if (Object.values(payload).every((v) => !String(v).trim())) return;
    addRecord('website', config.subModule, payload);
    setForm({});
  };

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Sites Web</h1>
        <p style={{ marginTop: '0.4rem', color: 'var(--text-muted)' }}>
          Gestion unifiée du contenu web, commerce et relation visiteurs.
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
          style={cardStyle}
        >
          <p style={{ marginTop: 0, color: 'var(--text-muted)' }}>
            Saisie {config.title} — enregistrement immédiat dans le module Website.
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
                <button onClick={() => deleteRecord('website', config.subModule, r.id)} className="glass" style={{ borderRadius: '0.6rem', padding: '0.35rem' }}>
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

export default WebsiteHub;
