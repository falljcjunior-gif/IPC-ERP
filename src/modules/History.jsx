import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  User, 
  Activity as ActivityIcon, 
  Search, 
  Filter, 
  Download, 
  ChevronRight,
  Shield,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useBusiness } from '../BusinessContext';

const History = () => {
  const { data, userRole, currentUser } = useBusiness();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterApp, setFilterApp] = useState('all');

  // Filter logs based on role
  // SuperAdmin sees all, others see only theirs
  const rawLogs = data.audit?.logs || [];
  const filteredLogs = rawLogs.filter(log => {
    const matchesUser = userRole === 'SUPER_ADMIN' || log.userId === currentUser.id;
    const matchesApp = filterApp === 'all' || log.appId === filterApp;
    const matchesSearch = log.action.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.details.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesUser && matchesApp && matchesSearch;
  });

  const appList = ['crm', 'sales', 'inventory', 'accounting', 'hr', 'production', 'projects', 'system'];

  return (
    <div style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>
            Historique d'Audit
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {userRole === 'SUPER_ADMIN' 
              ? "Journal complet des activités de la plateforme." 
              : "Suivi de vos actions et modifications personnelles."}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={18} /> Exporter CSV
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="glass" style={{ padding: '1.5rem', borderRadius: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Rechercher une action, un utilisateur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', borderRadius: '0.75rem', 
              background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text)',
              fontSize: '0.9rem'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Filter size={18} color="var(--text-muted)" />
          <select 
            value={filterApp}
            onChange={(e) => setFilterApp(e.target.value)}
            style={{ 
              padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'var(--bg-subtle)', 
              border: '1px solid var(--border)', color: 'var(--text)', outline: 'none'
            }}
          >
            <option value="all">Tous les modules</option>
            {appList.map(app => (
              <option key={app} value={app}>{app.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline */}
      <div className="glass" style={{ borderRadius: '1.25rem', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <th style={{ padding: '1rem 1.5rem' }}>Horodatage</th>
              <th style={{ padding: '1rem 1.5rem' }}>Utilisateur</th>
              <th style={{ padding: '1rem 1.5rem' }}>Action</th>
              <th style={{ padding: '1rem 1.5rem' }}>Détails</th>
              <th style={{ padding: '1rem 1.5rem' }}>Module</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, idx) => (
                  <motion.tr 
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    style={{ borderTop: '1px solid var(--border)', fontSize: '0.9rem' }}
                  >
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)' }}>
                      {new Date(log.timestamp).toLocaleString('fr-FR')}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)20', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                          {log.userName[0]}
                        </div>
                        <span style={{ fontWeight: 600 }}>{log.userName}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: 600,
                        background: log.action.includes('Suppression') ? '#EF444415' : 'var(--accent)15',
                        color: log.action.includes('Suppression') ? '#EF4444' : 'var(--accent)'
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.details}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{log.appId.toUpperCase()}</span>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: '4rem', textAlign: 'center' }}>
                    <AlertCircle size={48} color="var(--text-muted)" style={{ marginBottom: '1rem', opacity: 0.3 }} />
                    <p style={{ color: 'var(--text-muted)' }}>Aucune activité trouvée pour ces critères.</p>
                  </td>
                </tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default History;
