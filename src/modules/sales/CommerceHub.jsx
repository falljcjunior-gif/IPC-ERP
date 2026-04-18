import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, UtensilsCrossed, Repeat, KeyRound } from 'lucide-react';

const tabs = [
  { id: 'pos_boutique', label: 'PdV Boutique', icon: <Store size={16} /> },
  { id: 'pos_restaurant', label: 'PdV Restaurant', icon: <UtensilsCrossed size={16} /> },
  { id: 'subscriptions', label: 'Abonnements', icon: <Repeat size={16} /> },
  { id: 'rental', label: 'Location', icon: <KeyRound size={16} /> },
];

const CommerceHub = () => {
  const [activeTab, setActiveTab] = useState('pos_boutique');

  return (
    <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Commerce & Points de Vente</h1>
        <p style={{ marginTop: '0.4rem', color: 'var(--text-muted)' }}>
          Ventes omnicanales : boutique, restauration, abonnements et location.
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
          {activeTab === 'pos_boutique' && <p>Tickets caisse, remises, fidélité, clôture de caisse.</p>}
          {activeTab === 'pos_restaurant' && <p>Prises de commandes, tables, cuisine, encaissement.</p>}
          {activeTab === 'subscriptions' && <p>Plans récurrents, cycles de facturation, renouvellements.</p>}
          {activeTab === 'rental' && <p>Contrats de location, calendrier, disponibilité, retours.</p>}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CommerceHub;
