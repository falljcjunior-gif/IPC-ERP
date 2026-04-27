import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Search, Mail, Phone, 
  MapPin, Building2, Briefcase, MessageCircle, 
  Star, UserCheck, Clock
} from 'lucide-react';
import { useStore } from '../../../store';
import { FirestoreService } from '../../../services/firestore.service';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

const DEPT_COLORS = {
  'Informatique': '#6366F1', 'Finance': '#10B981', 'Commercial': '#F59E0B',
  'Production': '#EF4444', 'RH': '#EC4899', 'Direction': '#8B5CF6',
  'Marketing': '#D946EF', 'Logistique': '#3B82F6'
};

const DirectoryTab = ({ data, onOpenDetail }) => {
  const { currentUser, setNavigationIntent } = useStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter]  = useState('Tous');
  const [presenceData, setPresenceData] = useState({});
  const employees = data?.hr?.employees || [];

  useEffect(() => {
    const unsub = FirestoreService.subscribeToCollection('users', {}, (users) => {
      const pMap = {};
      users.forEach(u => { pMap[u.id] = u; });
      setPresenceData(pMap);
    });
    return () => unsub();
  }, []);

  const getDmRoomId = (userId) => {
    const ids = [currentUser?.id || 'me', userId].sort();
    return `dm_${ids[0]}_${ids[1]}`;
  };

  const filtered = employees.filter(e => {
    const matchSearch = e.nom?.toLowerCase().includes(search.toLowerCase()) ||
                        e.poste?.toLowerCase().includes(search.toLowerCase());
    const matchDept   = filter === 'Tous' || e.departement === filter;
    return matchSearch && matchDept;
  });

  const departments = ['Tous', ...new Set(employees.map(e => e.departement).filter(Boolean))];

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Search & Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.4rem' }}>Annuaire d'Entreprise</h3>
          <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {employees.length} collaborateur{employees.length > 1 ? 's' : ''} enregistré{employees.length > 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="glass" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1.25rem', borderRadius: '1.25rem', border: '1px solid var(--border)', minWidth: '260px' }}>
            <Search size={16} color="var(--text-muted)" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un collaborateur…"
              style={{ background: 'none', border: 'none', outline: 'none', fontSize: '0.88rem', width: '100%' }} />
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-subtle)', padding: '4px', borderRadius: '1rem', border: '1px solid var(--border)' }}>
            {departments.slice(0, 5).map(d => (
              <button key={d} onClick={() => setFilter(d)} style={{ padding: '7px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.78rem',
                background: filter === d ? 'white' : 'transparent', color: filter === d ? '#8B5CF6' : 'var(--text-muted)',
                boxShadow: filter === d ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s' }}>
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Users size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <div style={{ fontWeight: 700 }}>Aucun collaborateur trouvé</div>
          <div style={{ fontSize: '0.85rem', marginTop: '0.4rem' }}>Ajoutez des employés depuis le module RH.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '1.25rem' }}>
          {filtered.map(emp => {
            const color = DEPT_COLORS[emp.departement] || '#8B5CF6';
            const presence = presenceData[emp.id];
            const isOnline = presence?.isOnline;
            const lastSeen = presence?.lastSeen;

            return (
              <motion.div key={emp.id} variants={item} whileHover={{ y: -4 }} className="glass"
                style={{ padding: '1.75rem', borderRadius: '2rem', border: '1px solid var(--border)', background: 'var(--bg)', position: 'relative' }}>
                
                {/* Status Badge */}
                <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', alignItems: 'center', gap: '6px', background: isOnline ? '#10B98115' : '#94A3B815', padding: '4px 10px', borderRadius: '20px' }}>
                   <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isOnline ? '#10B981' : '#94A3B8' }} />
                   <span style={{ fontSize: '0.65rem', fontWeight: 800, color: isOnline ? '#10B981' : '#94A3B8' }}>{isOnline ? 'EN LIGNE' : 'HORS LIGNE'}</span>
                </div>

                {/* Avatar & Status Indicator */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 900, color }}>
                      {emp.avatar || emp.nom?.[0] || '?'}
                    </div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 800,
                    background: `${color}15`, color, marginTop: '2.5rem' }}>
                    {emp.departement || '—'}
                  </span>
                </div>

                {/* Info */}
                <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', fontWeight: 900 }}>{emp.nom}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 700, color, marginBottom: '1.25rem' }}>
                  <Briefcase size={13} /> {emp.poste || '—'}
                </div>

                {/* Detail items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  {emp.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      <Mail size={12} /> {emp.email}
                    </div>
                  )}
                  {emp.telephone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      <Phone size={12} /> {emp.telephone}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    <MapPin size={12} /> {emp.ville || 'Abidjan'}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button onClick={() => setNavigationIntent({ module: 'connect', tab: 'messenger', roomId: getDmRoomId(emp.id), label: emp.nom })}
                    style={{ flex: 1, padding: '0.65rem', borderRadius: '0.9rem', background: color, color: 'white', border: 'none', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <MessageCircle size={15} /> Message
                  </button>
                  {emp.email && (
                    <a href={`mailto:${emp.email}`}
                      style={{ padding: '0.65rem', borderRadius: '0.9rem', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textDecoration: 'none' }}>
                      <Mail size={15} />
                    </a>
                  )}
                  {emp.telephone && (
                    <a href={`tel:${emp.telephone}`}
                      style={{ padding: '0.65rem', borderRadius: '0.9rem', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textDecoration: 'none' }}>
                      <Phone size={15} />
                    </a>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default DirectoryTab;
