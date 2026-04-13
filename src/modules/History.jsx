import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Shield, Download, Activity } from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import EnterpriseView from '../components/EnterpriseView';
import { auditSchema } from '../schemas/audit.schema.js';

/* ════════════════════════════════════
   HISTORY MODULE — Audit Trail
   Now powered by IPC Platform Engine
   ════════════════════════════════════ */
const History = () => {
  const { userRole } = useBusiness();

  // Note: En entreprise réelle, un filtre statique par rôle serait appliqué
  // pour s'assurer que les utilisateurs non-admins ne voient que leurs logs.
  // Pour cette démo, on utilise EnterpriseView tel quel.

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
       {/* Module Header Toolbar */}
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10B981', marginBottom: '0.4rem' }}>
                <Shield size={16} /><span style={{ fontWeight: 800, fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Security & Compliance — Audit Trail</span>
             </div>
             <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Historique d'Audit</h1>
             <p style={{ color: 'var(--text-muted)', margin: '0.3rem 0 0 0', fontSize: '0.92rem' }}>
                {userRole === 'SUPER_ADMIN' 
                   ? "Journal complet des activités système et modifications de données." 
                   : "Suivi de vos actions personnelles sur la plateforme."}
             </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
             <button className="glass" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1.25rem', borderRadius: '0.8rem', fontWeight: 600, border: '1px solid var(--border)' }}>
                <Download size={16} /> Exporter Journal
             </button>
          </div>
       </div>

       <div className="glass" style={{ borderRadius: '1.5rem', flex: 1, minHeight: '600px' }}>
          <EnterpriseView 
             moduleId="audit" 
             modelId="logs"
             schema={auditSchema}
             onOpenDetail={() => {}} // Pas de détail spécifique pour les logs dans cette phase
          />
       </div>

       <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          <Activity size={16} />
          <span>Conservation des logs : 365 jours. Toutes les actions de création et suppression sont enregistrées.</span>
       </div>
    </div>
  );
};

export default History;
