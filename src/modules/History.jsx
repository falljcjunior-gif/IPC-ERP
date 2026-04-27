import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Shield, Download, Activity } from 'lucide-react';
import { useStore } from '../store';
import EnterpriseView from '../components/EnterpriseView';
import { auditSchema } from '../schemas/audit.schema.js';

/* ════════════════════════════════════
   HISTORY MODULE — Audit Trail
   Now powered by IPC Platform Engine
   ════════════════════════════════════ */
const History = () => {
  const { userRole, shellView } = useStore();

  return (
    <div style={{ padding: shellView?.mobile ? '1rem' : '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', minHeight: '100%' }}>
      
      {/* Nexus Header */}
      {!shellView?.mobile && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="nexus-glow" style={{ background: 'var(--nexus-primary)', padding: '6px', borderRadius: '10px' }}>
                <Shield size={16} color="white" />
              </div>
              <span style={{ fontWeight: 900, fontSize: '0.7rem', color: 'var(--nexus-primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                Nexus Security — Audit Trail
              </span>
            </div>
            <h1 className="nexus-gradient-text" style={{ fontSize: '3.5rem', fontWeight: 900, margin: 0, letterSpacing: '-2px' }}>
              Journal d'Audit
            </h1>
            <p style={{ color: 'var(--nexus-text-muted)', fontSize: '1.1rem', fontWeight: 500, maxWidth: '650px', lineHeight: 1.6 }}>
               {userRole === 'SUPER_ADMIN' 
                   ? "Journal complet des activités système et modifications de données avec intégrité garantie." 
                   : "Suivi de vos actions personnelles sur la plateforme Nexus."}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
             <button className="nexus-card" style={{ background: 'white', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900, color: 'var(--nexus-secondary)', border: '1px solid var(--nexus-border)', cursor: 'pointer' }}>
                <Download size={18} /> Exporter Logs
             </button>
          </div>
        </div>
      )}

      <div className="nexus-card" style={{ background: 'white', flex: 1, minHeight: '700px', padding: '1.5rem' }}>
          <EnterpriseView 
             moduleId="audit" 
             modelId="logs"
             schema={auditSchema}
             onOpenDetail={() => {}} 
          />
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem', color: 'var(--nexus-text-muted)', fontWeight: 600 }}>
          <Activity size={18} color="var(--nexus-primary)" />
          <span>Conservation Nexus : 365 jours. Toutes les sessions et mutations de données sont scellées cryptographiquement.</span>
      </div>
    </div>
  );
};

export default History;
