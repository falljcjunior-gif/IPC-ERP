import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, UserPlus, ShieldCheck, Key, Lock, 
  Activity, ShieldAlert, BadgeCheck, Search,
  Filter, MoreVertical, LogIn, HardDrive
} from 'lucide-react';
import { useBusiness } from '../../../BusinessContext';
import EnterpriseView from '../../../components/EnterpriseView';
import { adminSchema } from '../../../schemas/admin.schema.js';

const IdentityTab = ({ onOpenDetail }) => {
  const { data } = useBusiness();

  const stats = [
    { label: 'Utilisateurs Actifs', value: 42, icon: <Users size={20}/>, color: '#10B981' },
    { label: 'Rôles Définis', value: 5, icon: <ShieldCheck size={20}/>, color: '#6366F1' },
    { label: 'Sessions Actuelles', value: 12, icon: <LogIn size={20}/>, color: '#F59E0B' },
    { label: 'Alertes Accès', value: 0, icon: <ShieldAlert size={20}/>, color: '#EF4444' }
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      
      {/* Identity Intelligence Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
         {stats.map((stat, i) => (
           <div key={i} className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: '12px', background: `${stat.color}15`, color: stat.color }}>
                 {stat.icon}
              </div>
              <div>
                 <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
                 <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{stat.value}</div>
              </div>
           </div>
         ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
               <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem' }}>Provisionnement & Identités</h3>
               <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Gérez les comptes utilisateurs, les niveaux d'accès et le cycle de vie des identités.</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
               <button className="glass" style={{ padding: '0.6rem 1.25rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, border: '1px solid var(--border)' }}>
                  <Filter size={16} /> Filtrer
               </button>
               <button className="btn-primary" style={{ padding: '0.6rem 1.5rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900, background: '#0F172A', borderColor: '#0F172A' }}>
                  <UserPlus size={18} /> Nouvel Utilisateur
               </button>
            </div>
         </div>

         {/* Advanced User List View */}
         <div className="glass" style={{ borderRadius: '2rem', minHeight: '600px', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <EnterpriseView 
               moduleId="admin" 
               modelId="users"
               schema={adminSchema}
               onOpenDetail={onOpenDetail}
            />
         </div>
      </div>
    </motion.div>
  );
};

export default IdentityTab;
