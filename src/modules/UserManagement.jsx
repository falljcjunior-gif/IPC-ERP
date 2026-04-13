import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, ShieldCheck, Key, Lock, Activity, Users } from 'lucide-react';
import { useBusiness } from '../BusinessContext';
import EnterpriseView from '../components/EnterpriseView';
import { adminSchema } from '../schemas/admin.schema.js';

/* ════════════════════════════════════
   USER MANAGEMENT MODULE — Admin Core
   Now powered by IPC Platform Engine
   ════════════════════════════════════ */
const UserManagement = ({ onOpenDetail }) => {
  const { userRole } = useBusiness();

  if (userRole !== 'SUPER_ADMIN') {
     return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
           <Lock size={48} color="#EF4444" style={{ marginBottom: '1.5rem', opacity: 0.3 }} />
           <h2 style={{ fontWeight: 800 }}>Accès Restreint</h2>
           <p style={{ color: 'var(--text-muted)' }}>Seuls les Super Administrateurs peuvent gérer les comptes et les permissions.</p>
        </div>
     );
  }

  return (
    <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
       {/* Module Header Toolbar */}
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', marginBottom: '0.4rem' }}>
                <ShieldCheck size={16} /><span style={{ fontWeight: 800, fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Identity & Access — Security Command</span>
             </div>
             <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>Gestion Utilisateurs</h1>
             <p style={{ color: 'var(--text-muted)', margin: '0.3rem 0 0 0', fontSize: '0.92rem' }}>Contrôle d'accès · Provisionnement · Rôles RBAC</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
             <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1.25rem', borderRadius: '0.8rem', fontWeight: 600 }}>
                <UserPlus size={16} /> Créer un utilisateur
             </button>
          </div>
       </div>

       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
             <div style={{ padding: '0.75rem', borderRadius: '10px', background: 'var(--accent)10', color: 'var(--accent)' }}><Users size={20}/></div>
             <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Utilisateurs Actifs</div>
                <div style={{ fontWeight: 800, fontSize: '1.25rem' }}>42</div>
             </div>
          </div>
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
             <div style={{ padding: '0.75rem', borderRadius: '10px', background: '#F59E0B10', color: '#F59E0B' }}><Key size={20}/></div>
             <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sessions en cours</div>
                <div style={{ fontWeight: 800, fontSize: '1.25rem' }}>8</div>
             </div>
          </div>
       </div>

       <div className="glass" style={{ borderRadius: '1.5rem', flex: 1, minHeight: '600px' }}>
          <EnterpriseView 
             moduleId="admin" 
             modelId="users"
             schema={adminSchema}
             onOpenDetail={onOpenDetail}
          />
       </div>
    </div>
  );
};

export default UserManagement;
