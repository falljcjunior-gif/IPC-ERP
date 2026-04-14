import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Search, Filter, Mail, Phone, 
  MapPin, Building2, Briefcase, ChevronRight, 
  Star, MessageCircle, MoreHorizontal, UserCheck
} from 'lucide-react';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

const DirectoryTab = ({ data, onOpenDetail }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Tous');
  const employees = data.hr?.employees || [];

  const filtered = employees.filter(e => {
    const matchesSearch = e.nom.toLowerCase().includes(search.toLowerCase()) || e.poste.toLowerCase().includes(search.toLowerCase());
    const matchesDept = filter === 'Tous' || e.departement === filter;
    return matchesSearch && matchesDept;
  });

  const departments = ['Tous', ...new Set(employees.map(e => e.departement))];

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Search & Filter Hub */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
         <div>
            <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem', color: '#0F172A' }}>Annuaire d'Entreprise</h3>
            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Connectez-vous avec vos collaborateurs et découvrez leurs expertises.</p>
         </div>
         <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg)', padding: '0.75rem 1.25rem', borderRadius: '1.5rem', border: '1px solid var(--border)', minWidth: '300px' }}>
               <Search size={18} color="var(--text-muted)" />
               <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Chercher un collaborateur..." style={{ background: 'none', border: 'none', outline: 'none', fontSize: '0.9rem', color: 'var(--text)', width: '100%' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-subtle)', padding: '4px', borderRadius: '1rem', border: '1px solid var(--border)' }}>
               {departments.slice(0, 4).map(d => (
                 <button key={d} onClick={() => setFilter(d)} style={{ padding: '8px 16px', borderRadius: '12px', border: 'none', background: filter === d ? 'white' : 'transparent', color: filter === d ? '#8B5CF6' : 'var(--text-muted)', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', boxShadow: filter === d ? 'var(--shadow-sm)' : 'none' }}>{d}</button>
               ))}
            </div>
         </div>
      </div>

      {/* Directory Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
         {filtered.map(emp => (
           <motion.div 
             key={emp.id} 
             variants={item}
               whileHover={{ y: -5 }}
               className="glass"
               style={{ padding: '2rem', borderRadius: '2.5rem', border: '1px solid var(--border)', background: 'var(--bg)' }}
           >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                 <div style={{ position: 'relative' }}>
                    <div style={{ width: '70px', height: '70px', borderRadius: '22px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900, color: '#8B5CF6' }}>
                       {emp.avatar || emp.nom[0]}
                    </div>
                    <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '24px', height: '24px', borderRadius: '10px', background: '#10B981', border: '4px solid var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <UserCheck size={12} color="white" />
                    </div>
                 </div>
                 <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><MoreHorizontal size={20} /></button>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                 <h4 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', fontWeight: 900, color: '#0F172A' }}>{emp.nom}</h4>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8B5CF6', fontSize: '0.85rem', fontWeight: 800 }}>
                    <Briefcase size={14} /> {emp.poste}
                 </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                 <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                       <Building2 size={12} /> Dpt
                    </div>
                    <div style={{ color: 'var(--text)', fontWeight: 800 }}>{emp.departement}</div>
                 </div>
                 <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                       <MapPin size={12} /> Site
                    </div>
                    <div style={{ color: 'var(--text)', fontWeight: 800 }}>{emp.ville || 'Abidjan'}</div>
                 </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                 <button onClick={() => onOpenDetail?.({ id: getDmRoomId(emp.id), label: emp.nom, type: 'direct' })} className="btn-primary" style={{ flex: 1, padding: '0.8rem', borderRadius: '1.25rem', background: '#8B5CF6', borderColor: '#8B5CF6', fontSize: '0.85rem', fontWeight: 900 }}>
                    <MessageCircle size={18} /> Chat
                 </button>
                 <button className="glass" style={{ width: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '1.25rem' }}>
                    <Star size={20} color="#F59E0B" />
                 </button>
              </div>
           </motion.div>
         ))}
      </div>
    </motion.div>
  );
};

export default DirectoryTab;
