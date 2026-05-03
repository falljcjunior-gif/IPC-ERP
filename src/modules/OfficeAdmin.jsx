import React, { useState } from 'react';
import EnterpriseView from '../components/EnterpriseView';
import { registry } from '../services/Registry';
import { Inbox } from 'lucide-react';

const OfficeAdmin = (props) => {
  const schema = registry.getSchema('office_admin');
  const [activeModel, setActiveModel] = useState('mail_logs');

  if (!schema) return <div style={{ padding: '2rem' }}>Schéma Office Admin introuvable.</div>;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER LUXURY */}
      <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '3rem', background: 'linear-gradient(135deg, rgba(31, 54, 61, 0.02) 0%, rgba(82, 153, 144, 0.03) 100%)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--accent)', marginBottom: '0.75rem' }}>
            <div style={{ background: 'rgba(82, 153, 144, 0.15)', padding: '6px', borderRadius: '8px' }}>
              <Inbox size={18} />
            </div>
            <span style={{ fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2.5px' }}>IPC Office Services — Support</span>
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: 0, letterSpacing: '-1.5px', color: 'var(--text)' }}>Services Généraux</h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.6rem 0 0 0', fontSize: '1rem', fontWeight: 500, maxWidth: '600px', lineHeight: 1.5 }}>
            Administration centralisée : courrier, fournitures, visiteurs et demandes d'interventions techniques.
          </p>
        </div>
      </div>

      <header style={{ 
        display: 'flex', gap: '1rem', padding: '1rem 2.5rem', 
        borderBottom: '1px solid var(--border)', background: 'var(--bg-glass)',
        overflowX: 'auto'
      }}>
        {Object.keys(schema.models || {}).map(modelKey => (
          <button
            key={modelKey}
            onClick={() => setActiveModel(modelKey)}
            className="glass-hover"
            style={{
              padding: '0.7rem 1.5rem',
              borderRadius: '1rem',
              fontWeight: 700,
              border: activeModel === modelKey ? '1px solid var(--accent)' : '1px solid transparent',
              background: activeModel === modelKey ? 'rgba(82, 153, 144, 0.1)' : 'transparent',
              color: activeModel === modelKey ? 'var(--accent)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            {schema.models[modelKey].label}
          </button>
        ))}
      </header>
      
      <div style={{ flex: 1, padding: '2.5rem', overflowY: 'auto' }}>
         <EnterpriseView 
            moduleId="office_admin" 
            modelId={activeModel} 
            schema={schema} 
            {...props} 
         />
      </div>
    </div>
  );
};

export default React.memo(OfficeAdmin);
