import React from 'react';
import { motion } from 'framer-motion';
import { 
  UserPlus, Mail, Phone, Calendar, Search, Filter, Plus,
  MoreVertical, CheckCircle2, User, Building2, Zap,
  ArrowRight, ShieldAlert, Star
} from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } };

const LeadsTab = ({ leads, onOpenDetail }) => {
  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem', background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', color: 'white', border: 'none' }}>
          <div style={{ opacity: 0.8, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Nouveaux Leads (7j)</div>
          <div style={{ fontSize: '2rem', fontWeight: 900 }}>0</div>
        </div>
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>À Qualifier</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#F59E0B' }}>0</div>
        </div>
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.5rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Taux de Qualification</div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10B981' }}>0%</div>
        </div>
      </div>

      {/* Control Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1rem', flex: 1, maxWidth: '500px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="glass" placeholder="Rechercher un prospect..." 
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.8rem', borderRadius: '1rem', border: 'none', fontSize: '0.85rem' }} />
          </div>
        </div>
        <button 
          onClick={() => onOpenDetail && onOpenDetail(null, 'crm', 'leads')}
          className="btn-primary" style={{ padding: '0.8rem 1.75rem', borderRadius: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900 }}>
          <Plus size={20} /> Ajouter un Lead
        </button>
      </div>

      {/* Leads Grid - High density premium cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {leads.length > 0 ? leads.map((lead) => (
          <motion.div 
            key={lead.id} 
            variants={item}
            whileHover={{ y: -5 }}
            className="glass" 
            style={{ padding: '2rem', borderRadius: '1.75rem', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}
          >
            {/* Top Badge */}
            <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
              <div style={{ background: '#F59E0B15', color: '#F59E0B', padding: '4px 10px', borderRadius: '2rem', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase' }}>
                À Traiter
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
               <div style={{ width: '56px', height: '56px', borderRadius: '1.25rem', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '1.2rem' }}>
                 {(lead.prenom || lead.nom || 'L')[0]}
               </div>
               <div>
                 <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>{lead.prenom} {lead.nom}</div>
                 <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                   <Building2 size={13} /> {lead.entreprise || 'Particulier'}
                 </div>
               </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                 <Mail size={14} /> {lead.email || 'Pas d\'email'}
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                 <Phone size={14} /> {lead.telephone || 'Pas de téléphone'}
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                 <Zap size={14} color="#F59E0B" /> <span style={{ fontWeight: 700 }}>Source : Facebook Ads</span>
               </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                onClick={() => onOpenDetail && onOpenDetail(lead, 'crm', 'leads')}
                className="glass" 
                style={{ flex: 1, padding: '0.75rem', borderRadius: '1rem', fontWeight: 800, fontSize: '0.8rem' }}
              >
                Détails
              </button>
              <button 
                onClick={() => onOpenDetail && onOpenDetail(lead, 'crm', 'leads')}
                className="btn-primary" style={{ flex: 1, padding: '0.75rem', borderRadius: '1rem', fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'var(--text)', color: 'white' }}>
                 Qualifier <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        )) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem', opacity: 0.5 }}>
            <UserPlus size={48} style={{ marginBottom: '1rem' }} />
            <p style={{ fontWeight: 800 }}>Aucun prospect en attente.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LeadsTab;
