import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Search, Filter, Mail, Phone, MapPin, 
  Crown, Star, Award, ShieldCheck, MoreHorizontal,
  History, DollarSign, ArrowUpRight
} from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, scale: 0.98 }, show: { opacity: 1, scale: 1 } };

const CustomerTab = ({ data, onOpenDetail, formatCurrency }) => {
  const clients = data?.crm?.clients || [
    { id: '1', nom: 'SOGEA SATOM', secteur: 'Construction', level: 'Gold', totalWon: 45000000, lastOrder: '2026-04-10' },
    { id: '2', nom: 'KAMAG', secteur: 'Logistique', level: 'Silver', totalWon: 12500000, lastOrder: '2026-03-25' },
    { id: '3', nom: 'BTP Service', secteur: 'BTP', level: 'Bronze', totalWon: 3400000, lastOrder: '2026-04-12' }
  ];

  const getLevelBadge = (level) => {
    const colors = {
      'Gold': { bg: '#FEF3C7', text: '#92400E', icon: <Crown size={12} /> },
      'Silver': { bg: '#F1F5F9', text: '#475569', icon: <Award size={12} /> },
      'Bronze': { bg: '#FFEDD5', text: '#9A3412', icon: <Star size={12} /> }
    };
    const c = colors[level] || colors.Bronze;
    return (
      <div style={{ background: c.bg, color: c.text, padding: '4px 10px', borderRadius: '2rem', fontSize: '0.65rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'uppercase' }}>
        {c.icon} {level}
      </div>
    );
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Search & Stats Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1rem', flex: 1, maxWidth: '500px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="glass" placeholder="Rechercher un client..." 
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.8rem', borderRadius: '1rem', border: 'none', fontSize: '0.85rem' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
           <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Clients</div>
              <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>{clients.length}</div>
           </div>
           <div style={{ height: '30px', width: '1px', background: 'var(--border)' }} />
           <button className="glass" style={{ padding: '0.75rem 1.5rem', borderRadius: '1rem', fontWeight: 800, fontSize: '0.85rem' }}>
              Exporter
           </button>
           <button 
             onClick={() => onOpenDetail && onOpenDetail(null, 'crm', 'clients')}
             className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '1rem', fontWeight: 800, fontSize: '0.85rem' }}>
              Nouveau Client
           </button>
        </div>
      </div>

      {/* Customer Registry - Professional Table-Card Style */}
      <div className="glass" style={{ borderRadius: '2rem', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1fr 60px', padding: '1.25rem 2rem', background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          <div>Client</div>
          <div>Secteur</div>
          <div>Contribution Totale</div>
          <div>Statut / Level</div>
          <div style={{ textAlign: 'right' }}>Action</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {clients.map((client) => (
            <motion.div 
              key={client.id}
              variants={item}
              whileHover={{ background: 'rgba(59, 130, 246, 0.02)' }}
              onClick={() => onOpenDetail && onOpenDetail(client, 'crm', 'clients')}
              style={{ 
                display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1fr 60px', 
                padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', 
                alignItems: 'center', cursor: 'pointer', transition: '0.2s' 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 900 }}>
                  {client.nom[0]}
                </div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{client.nom}</div>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{client.secteur}</div>

              <div>
                 <div style={{ fontWeight: 900, fontSize: '0.9rem', color: 'var(--text)' }}>{formatCurrency(client.totalWon, true)}</div>
                 <div style={{ fontSize: '0.7rem', color: '#10B981', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 700 }}>
                   <ArrowUpRight size={10} /> +12% LTV
                 </div>
              </div>

              <div>
                {getLevelBadge(client.level)}
              </div>

              <div style={{ textAlign: 'right' }}>
                <button className="glass" style={{ padding: '0.5rem', borderRadius: '0.75rem' }}>
                  <MoreHorizontal size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Advanced Filter / Segment Tags */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
         {['VIP', 'Churn Risk', 'New Business', 'Corporate', 'Government'].map((tag, i) => (
           <div key={i} className="glass" style={{ padding: '0.5rem 1rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
             #{tag}
           </div>
         ))}
      </div>
    </motion.div>
  );
};

export default CustomerTab;
