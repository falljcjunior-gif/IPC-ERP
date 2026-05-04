import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Banknote, Wallet, Users, FileText, 
  Plus, Download, CheckCircle2, TrendingUp,
  Clock, Landmark, PieChart, ShieldCheck
} from 'lucide-react';
import { useStore } from '../store';
import KpiCard from '../components/KpiCard';
import SmartButton from '../components/SmartButton';
import { useToastStore } from '../store/useToastStore';

/**
 * 💰 NEXUS OS: PAYROLL HUB
 * Financial engine for salary management and social compliance.
 */
const PayrollHub = () => {
  const { data, formatCurrency } = useStore();
  const [activeTab, setActiveTab] = useState('slips');

  const employees = data.hr?.employees || [];
  const slips = data.payroll?.slips || [
    { id: 1, name: 'Jean Dupont', period: 'Avril 2024', net: 245000, status: 'Payé' },
    { id: 2, name: 'Marie Kouadio', period: 'Avril 2024', net: 185000, status: 'Payé' },
    { id: 3, name: 'Paul Yao', period: 'Avril 2024', net: 310000, status: 'Validé' }
  ];

  const tabs = [
    { id: 'slips', label: 'Bulletins de Paie', icon: <FileText size={18} /> },
    { id: 'variables', label: 'Éléments Variables', icon: <TrendingUp size={18} /> },
    { id: 'charges', label: 'Charges Sociales', icon: <Landmark size={18} /> },
  ];

  return (
    <div style={{ padding: '3rem', minHeight: '100vh', background: 'var(--bg-subtle)' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ padding: '10px', borderRadius: '12px', background: '#059669', boxShadow: '0 4px 15px rgba(5, 150, 105, 0.3)' }}>
              <Banknote size={20} color="white" />
            </div>
            <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '2px', color: '#059669', textTransform: 'uppercase' }}>
              Financial HR Engine
            </span>
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, margin: 0, letterSpacing: '-1.5px' }}>Paie & Social</h1>
          <p style={{ color: 'var(--text-muted)', fontWeight: 500, marginTop: '0.5rem' }}>Automatisation des rémunérations et conformité fiscale.</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <SmartButton 
            variant="secondary" 
            icon={Download} 
            onClick={async () => useToastStore.getState().addToast('Génération du rapport global...', 'info')}
          >
            Exporter SEPA
          </SmartButton>
          <SmartButton 
            variant="primary" 
            icon={Plus} 
            onClick={async () => useToastStore.getState().addToast('Lancement du cycle de paie Mai 2024', 'info')}
          >
            Lancer la Paie
          </SmartButton>
        </div>
      </div>

      {/* KPI ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <KpiCard title="Masse Salariale (Net)" value={formatCurrency(740000)} icon={<Wallet size={20} />} color="#059669" />
        <KpiCard title="Charges Sociales" value={formatCurrency(215000)} icon={<Landmark size={20} />} color="#3B82F6" />
        <KpiCard title="Bulletins Générés" value={slips.length} icon={<FileText size={20} />} color="#8B5CF6" />
        <KpiCard title="Conformité Sociale" value="100%" icon={<ShieldCheck size={20} />} color="#10B981" />
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
              color: activeTab === tab.id ? '#059669' : 'var(--text-muted)',
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
          {activeTab === 'slips' && (
            <div className="glass" style={{ padding: '2rem', borderRadius: '2.5rem', background: 'white', border: '1px solid var(--border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>
                    <th style={{ padding: '1.5rem', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Collaborateur</th>
                    <th style={{ padding: '1.5rem', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Période</th>
                    <th style={{ padding: '1.5rem', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Net à Payer</th>
                    <th style={{ padding: '1.5rem', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Statut</th>
                    <th style={{ padding: '1.5rem', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {slips.map(slip => (
                    <tr key={slip.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '1.5rem', fontWeight: 800 }}>{slip.name}</td>
                      <td style={{ padding: '1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>{slip.period}</td>
                      <td style={{ padding: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>{formatCurrency(slip.net)}</td>
                      <td style={{ padding: '1.5rem' }}>
                        <span style={{ 
                          padding: '4px 12px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 900, 
                          background: slip.status === 'Payé' ? '#10B98115' : '#3B82F615',
                          color: slip.status === 'Payé' ? '#10B981' : '#3B82F6'
                        }}>{slip.status}</span>
                      </td>
                      <td style={{ padding: '1.5rem' }}>
                        <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 700 }}>Détails</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'variables' && (
            <div className="glass" style={{ padding: '4rem', borderRadius: '2.5rem', background: 'white', textAlign: 'center', border: '1px dashed var(--border)' }}>
              <TrendingUp size={64} style={{ color: '#059669', opacity: 0.2, marginBottom: '1.5rem' }} />
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>Saisie des Variables de Paie</h3>
              <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 2rem auto' }}>Enregistrez les heures supplémentaires, les primes et les absences pour le calcul automatique.</p>
              <SmartButton variant="primary" icon={Plus}>Ajouter un élément</SmartButton>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default PayrollHub;
