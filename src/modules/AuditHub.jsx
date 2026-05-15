import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, History, Award, AlertTriangle, 
  Search, Plus, Filter, FileText, 
  CheckCircle2, Clock, ShieldAlert, Scale
} from 'lucide-react';
import { useStore } from '../store';
import KpiCard from '../components/KpiCard';
import SmartButton from '../components/SmartButton';
import { useToastStore } from '../store/useToastStore';

/**
 *  NEXUS OS: AUDIT & COMPLIANCE HUB
 * High-fidelity interface for system traceability, ISO certifications, and internal audits.
 */
const AuditHub = ({ onOpenDetail }) => {
  const { data } = useStore();
  const [activeTab, setActiveTab] = useState('logs');
  const [searchQuery, setSearchQuery] = useState('');

  const logs = data.audit?.logs || [];
  const sessions = data.audit?.sessions || [];
  const certs = data.audit?.certifications || [
    { id: 1, name: 'ISO 9001:2015', validUntil: '2025-12-31', status: 'Actif', score: 94 },
    { id: 2, name: 'ISO 14001:2015', validUntil: '2024-06-15', status: 'À renouveler', score: 88 },
    { id: 3, name: 'Norme Environnementale', validUntil: '2026-01-01', status: 'Actif', score: 91 }
  ];

  const filteredLogs = useMemo(() => {
    return logs
      .filter(l => l.details?.toLowerCase().includes(searchQuery.toLowerCase()) || l.action?.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [logs, searchQuery]);

  const tabs = [
    { id: 'logs', label: 'Journal d\'Activité', icon: <History size={18} /> },
    { id: 'sessions', label: 'Sessions d\'Audit', icon: <Scale size={18} /> },
    { id: 'compliance', label: 'Certifications', icon: <Award size={18} /> },
  ];

  return (
    <div style={{ padding: '3rem', minHeight: '100vh', background: 'var(--bg-subtle)' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ padding: '10px', borderRadius: '12px', background: 'var(--primary)', boxShadow: 'var(--shadow-accent)' }}>
              <ShieldCheck size={20} color="white" />
            </div>
            <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '2px', color: 'var(--primary)', textTransform: 'uppercase' }}>
              Governance & Risk
            </span>
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: 0, letterSpacing: '-1.5px' }}>Audit & Conformité</h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 500, marginTop: '0.5rem' }}>Tracuabilité totale et gestion des standards de qualité.</p>
        </div>

        <SmartButton 
          variant="primary" 
          icon={Plus} 
          onClick={() => onOpenDetail && onOpenDetail(null, 'audit', 'sessions')}
        >
          Nouvel Audit
        </SmartButton>
      </div>

      {/* KPI ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <KpiCard title="Intégrité Système" value="99.9%" icon={<ShieldCheck size={20} />} color="#10B981" trend="0.2" trendType="up" sparklineData={[{val: 99}, {val: 99.5}, {val: 99.9}]} />
        <KpiCard title="Alertes Sécurité" value="0" icon={<ShieldCheck size={20} />} color="#EF4444" trend="0" trendType="up" sparklineData={[{val: 0}, {val: 0}, {val: 0}]} />
        <KpiCard title="Audits Clôturés" value={sessions.length} icon={<CheckCircle2 size={20} />} color="#3B82F6" trend="12" trendType="up" sparklineData={[{val: 2}, {val: 4}, {val: 5}]} />
        <KpiCard title="Score Conformité" value="92%" icon={<Award size={20} />} color="#8B5CF6" trend="2.4" trendType="up" sparklineData={[{val: 85}, {val: 90}, {val: 92}]} />
      </div>

      {/* NAVIGATION TABS */}
      <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.03)', padding: '6px', borderRadius: '1.5rem', border: '1px solid var(--border-light)', width: 'fit-content', marginBottom: '2.5rem' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.8rem 1.75rem', borderRadius: '1.25rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', transition: 'var(--transition)',
              background: activeTab === tab.id ? 'white' : 'transparent',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: activeTab === tab.id ? 'var(--shadow-md)' : 'none'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
        >
          {activeTab === 'logs' && (
            <div className="glass" style={{ padding: '2rem', borderRadius: '2.5rem', background: 'white', border: '1px solid var(--border)', boxShadow: 'var(--shadow-premium)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.4rem' }}>Flux d'Activité Temps Réel</h3>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder="Filtrer les logs..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'var(--bg-subtle)', outline: 'none', width: '300px' }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredLogs.length > 0 ? filteredLogs.map((log, i) => (
                  <div key={i} style={{ padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-subtle)' }}>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', boxShadow: 'var(--shadow-sm)' }}>
                        <Clock size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1rem' }}>{log.action}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                          <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{log.userName}</span> • {log.details}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{log.appId}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <History size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                    <p>Aucun log correspondant à votre recherche.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
              {certs.map(cert => (
                <motion.div 
                  key={cert.id}
                  whileHover={{ y: -8 }}
                  className="glass" 
                  style={{ padding: '2.5rem', borderRadius: '2.5rem', background: 'white', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                    <div style={{ padding: '1rem', borderRadius: '1rem', background: cert.status === 'Actif' ? '#10B98115' : '#F59E0B15', color: cert.status === 'Actif' ? '#10B981' : '#F59E0B' }}>
                      <Award size={28} />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: cert.status === 'Actif' ? '#10B981' : '#F59E0B' }}>{cert.status}</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{cert.score}%</div>
                    </div>
                  </div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0 0 0.5rem 0' }}>{cert.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>Échéance : <strong>{cert.validUntil}</strong></p>
                  
                  <div style={{ height: '6px', background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden', marginBottom: '2rem' }}>
                    <motion.div 
                      initial={{ width: 0 }} animate={{ width: `${cert.score}%` }}
                      style={{ height: '100%', background: cert.status === 'Actif' ? '#10B981' : '#F59E0B' }} 
                    />
                  </div>

                  <SmartButton 
                    variant="secondary" 
                    fullWidth 
                    onClick={async () => useToastStore.getState().addToast('Téléchargement du certificat...', 'info')}
                  >
                    Voir le Certificat
                  </SmartButton>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'sessions' && (
             <div className="glass" style={{ padding: '4rem', borderRadius: '2.5rem', background: 'white', textAlign: 'center', border: '1px dashed var(--border)' }}>
                <Scale size={64} style={{ color: 'var(--primary)', opacity: 0.2, marginBottom: '1.5rem' }} />
                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>Planificateur d'Audit Interne</h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 2rem auto' }}>Menez des audits rigoureux par module pour préparer vos certifications ISO.</p>
                <SmartButton 
                  variant="primary" 
                  icon={Plus}
                  onClick={() => onOpenDetail && onOpenDetail(null, 'audit', 'sessions')}
                >
                  Programmer un Audit
                </SmartButton>
             </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AuditHub;
