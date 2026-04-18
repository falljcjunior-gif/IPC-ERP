import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ShoppingBag, PenSquare, MessageSquare, Headphones, GraduationCap } from 'lucide-react';

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

const WebsiteHub = () => {
  const [activeTab, setActiveTab] = useState('site_web');

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
          {activeTab === 'site_web' && <p>Pages, menus, SEO, formulaires de contact.</p>}
          {activeTab === 'ecommerce' && <p>Catalogue, panier, commandes, paiements.</p>}
          {activeTab === 'blog' && <p>Articles, catégories, éditeur, publication.</p>}
          {activeTab === 'forum' && <p>Discussions, modération, tags, réputation.</p>}
          {activeTab === 'live_chat' && <p>Widget chat, file agents, réponses rapides.</p>}
          {activeTab === 'elearning' && <p>Cours, chapitres, quiz, progression apprenant.</p>}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default WebsiteHub;
