import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wrench, Settings, AlertTriangle, ClipboardList, 
  Plus, Search, Filter, Activity, 
  CheckCircle2, Clock, Zap, Monitor
} from 'lucide-react';
import { useStore } from '../store';
import KpiCard from '../components/KpiCard';
import SmartButton from '../components/SmartButton';
import { useToastStore } from '../store/useToastStore';

/**
 * 🏭 NEXUS OS: GMAO (GESTION DE MAINTENANCE)
 * Operational cockpit for factory machinery and technical interventions.
 */
const MaintenanceHub = () => {
  const { data } = useStore();
  const [activeTab, setActiveTab] = useState('assets');

  const assets = data.maintenance?.assets || [
    { id: 'M-001', name: 'Presse Hydraulique #01', code: 'PR-H1', type: 'Presse', status: 'Opérationnel', healthScore: 92, lastMaint: '2024-04-15' },
    { id: 'M-002', name: 'Mixeur Industriel V2', code: 'MX-02', type: 'Mixeur', status: 'En Panne', healthScore: 35, lastMaint: '2024-03-20' },
    { id: 'M-003', name: 'Moule Brique 20x40', code: 'ML-B1', type: 'Moule', status: 'Opérationnel', healthScore: 88, lastMaint: '2024-05-01' },
    { id: 'M-004', name: 'Convoyeur Principal', code: 'CV-P', type: 'Convoyeur', status: 'En Maintenance', healthScore: 70, lastMaint: '2024-05-02' }
  ];

  const orders = data.maintenance?.workOrders || [];

  const tabs = [
    { id: 'assets', label: 'Parc Machines', icon: <Monitor size={18} /> },
    { id: 'orders', label: 'Bons de Travail', icon: <ClipboardList size={18} /> },
    { id: 'inventory', label: 'Pièces de Rechange', icon: <Settings size={18} /> },
  ];

  return (
    <div style={{ padding: '3rem', minHeight: '100vh', background: 'var(--bg-subtle)' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ padding: '10px', borderRadius: '12px', background: '#DC2626', boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)' }}>
              <Wrench size={20} color="white" />
            </div>
            <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '2px', color: '#DC2626', textTransform: 'uppercase' }}>
              Industrial Asset Management
            </span>
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: 0, letterSpacing: '-1.5px' }}>Maintenance (GMAO)</h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 500, marginTop: '0.5rem' }}>Surveillance proactive et gestion des interventions techniques.</p>
        </div>

        <SmartButton 
          variant="primary" 
          icon={Plus} 
          onClick={async () => useToastStore.getState().addToast('Création d\'un nouveau bon de travail', 'info')}
        >
          Nouvelle Intervention
        </SmartButton>
      </div>

      {/* KPI ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <KpiCard title="Disponibilité Machines" value="94.2%" icon={<Activity size={20} />} color="#10B981" sparklineData={[{val: 92}, {val: 95}, {val: 94.2}]} />
        <KpiCard title="Machines en Panne" value={assets.filter(a => a.status === 'En Panne').length} icon={<AlertTriangle size={20} />} color="#EF4444" sparklineData={[{val: 1}, {val: 2}, {val: 1}]} />
        <KpiCard title="Interventions Ouvertes" value={orders.length} icon={<Clock size={20} />} color="#F59E0B" sparklineData={[{val: 4}, {val: 6}, {val: 2}]} />
        <KpiCard title="TRS Moyen" value="88.5%" icon={<Zap size={20} />} color="#8B5CF6" sparklineData={[{val: 80}, {val: 85}, {val: 88.5}]} />
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
              color: activeTab === tab.id ? '#DC2626' : 'var(--text-muted)',
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
          {activeTab === 'assets' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
              {assets.map(machine => (
                <motion.div 
                  key={machine.id}
                  whileHover={{ y: -8 }}
                  className="glass" 
                  style={{ padding: '2rem', borderRadius: '2rem', background: 'white', border: '1px solid var(--border)', position: 'relative' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '0.75rem', borderRadius: '14px', background: 'var(--bg-subtle)', color: 'var(--primary)' }}>
                      <Monitor size={24} />
                    </div>
                    <span style={{ 
                      padding: '4px 12px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase',
                      background: machine.status === 'Opérationnel' ? '#10B98115' : (machine.status === 'En Panne' ? '#EF444415' : '#F59E0B15'),
                      color: machine.status === 'Opérationnel' ? '#10B981' : (machine.status === 'En Panne' ? '#EF4444' : '#F59E0B')
                    }}>
                      {machine.status}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '0 0 0.25rem 0' }}>{machine.name}</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '1.5rem' }}>REF: {machine.code} • {machine.type}</div>
                  
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>État de Santé</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>{machine.healthScore}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--bg-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                      <motion.div 
                        initial={{ width: 0 }} animate={{ width: `${machine.healthScore}%` }}
                        style={{ height: '100%', background: machine.healthScore > 80 ? '#10B981' : (machine.healthScore > 50 ? '#F59E0B' : '#EF4444') }} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    <span>Dernière : {machine.lastMaint}</span>
                    <span style={{ color: '#DC2626' }}>Prochaine : 25 Mai 2024</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="glass" style={{ padding: '2rem', borderRadius: '2.5rem', background: 'white', border: '1px solid var(--border)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h3 style={{ margin: 0, fontWeight: 900 }}>Flux des Interventions</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                     <button style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--border)', background: 'white', fontSize: '0.8rem', fontWeight: 700 }}>Tout</button>
                     <button style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', border: 'none', background: '#EF444415', color: '#EF4444', fontSize: '0.8rem', fontWeight: 700 }}>Critiques</button>
                  </div>
               </div>
               <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <ClipboardList size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                  <p>Tous les bons de travail ont été clôturés. Système nominal.</p>
               </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default MaintenanceHub;
