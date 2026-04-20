import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileSignature, Send, CopyPlus, History, 
  CheckCircle2, Folder
} from 'lucide-react';
import { useBusiness } from '../../BusinessContext';
import RequestsTab from './tabs/RequestsTab';
// We will import TabBar safely

const TABS = [
  { id: 'requests', label: 'Demandes (En cours)', icon: <Send size={16} /> },
  { id: 'templates', label: 'Modèles & Historique', icon: <History size={16} /> }
];

const SignatureHub = () => {
  const { data } = useBusiness();
  const [activeTab, setActiveTab] = useState('requests');

  const renderTab = () => {
    switch (activeTab) {
      case 'requests':
        return <RequestsTab />;
      case 'templates':
        return (
          <div className="glass" style={{ padding: '3rem', textAlign: 'center', borderRadius: '1.5rem' }}>
            <Folder size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
            <h2>Gestion des Modèles (Bientôt Disponible)</h2>
            <p style={{ color: 'var(--text-muted)' }}>La création de modèles de contrat prédéfinis sera activée prochainement.</p>
          </div>
        );
      default:
        return <RequestsTab />;
    }
  };

  return (
    <div style={{ padding: '2.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            width: '48px', height: '48px', borderRadius: '12px', 
            background: 'var(--accent)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(82, 153, 144, 0.3)'
          }}>
            <FileSignature size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Signature Électronique</h1>
            <p style={{ color: 'var(--text-muted)' }}>Envoyez et suivez vos documents à signer (Contrats, Avenants, NDA).</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '2rem', borderBottom: '2px solid var(--border-color)' }}>
        {TABS.map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)}
            style={{ 
              background: activeTab === tab.id ? 'var(--bg-card)' : 'transparent', 
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
              padding: '0.75rem 1.25rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              marginBottom: '-2px',
              transition: 'all 0.2s'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderTab()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SignatureHub;
