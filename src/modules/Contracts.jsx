import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileSignature, Plus, TrendingUp, RefreshCcw, AlertTriangle,
  CheckCircle2, Building2
} from 'lucide-react';
import { useStore } from '../store';
import { BarChartComp } from '../components/BusinessCharts';
import AnimatedCounter from '../components/Dashboard/AnimatedCounter';
import '../components/GlobalDashboard.css';

const Contracts = () => {
  const { data } = useStore();
  const contractsData = [];
  const mrrData       = [];

  const kpis = [
    { label: 'MRR (Revenu Récurrent)',  value: '0',     unit: 'FCFA', color: '#10B981', tag: 'Revenue', sub: '0% ce mois',           icon: <TrendingUp size={24} /> },
    { label: 'Taux de Churn',           value: '0',     unit: '%',    color: '#F59E0B', tag: 'Risk',    sub: 'Stable vs mois dernier', icon: <AlertTriangle size={24} /> },
    { label: 'Conformité SLA',          value: '0',     unit: '%',    color: '#10B981', tag: 'Quality', sub: 'Obj: 99.9%',             icon: <CheckCircle2 size={24} /> },
  ];

  return (
    <div className="luxury-dashboard-container" style={{ padding: '3rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      
      {/* ── HEADER ── */}
      <div className="luxury-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div className="luxury-subtitle">CRM — Revenus Récurrents</div>
          <h1 className="luxury-title">Contrats & <strong>Abonnements</strong></h1>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <button className="luxury-widget" style={{ padding: '0.9rem 1.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700, border: 'none', cursor: 'pointer', borderRadius: '1.25rem', background: 'rgba(255,255,255,0.9)', color: '#475569' }}>
            <RefreshCcw size={18} /> Renouvellements
          </button>
          <button className="luxury-widget" style={{ padding: '0.9rem 1.75rem', background: '#111827', color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem', border: 'none', cursor: 'pointer', fontWeight: 700, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)', borderRadius: '1.5rem' }}>
            <Plus size={18} /> Nouveau Contrat
          </button>
        </div>
      </div>

      {/* ── KPI ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
        {kpis.map((k, i) => (
          <div key={i} className="luxury-widget" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ background: `${k.color}15`, padding: '14px', borderRadius: '1rem', color: k.color }}>{k.icon}</div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: k.color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{k.tag}</span>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{k.label}</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b', letterSpacing: '-1px' }}>{k.value} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#94a3b8' }}>{k.unit}</span></div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: k.color }}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── CHARTS + LIST ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        <div className="luxury-widget" style={{ padding: '2.5rem' }}>
          <h3 style={{ marginBottom: '2rem', fontWeight: 800, fontSize: '1.25rem', color: '#1e293b' }}>Croissance du Revenu Récurrent (MRR)</h3>
          <BarChartComp data={mrrData} color="#10B981" />
        </div>

        <div className="luxury-widget" style={{ padding: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1.25rem', color: '#1e293b', margin: 0 }}>Contrats Stratégiques</h3>
            <button style={{ background: '#f1f5f9', border: 'none', padding: '6px 16px', borderRadius: '0.75rem', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', color: '#64748b' }}>Voir tout</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {contractsData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                <FileSignature size={48} opacity={0.3} style={{ margin: '0 auto 1rem' }} />
                <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Aucun contrat actif</p>
              </div>
            ) : contractsData.map(contract => (
              <motion.div key={contract.id} whileHover={{ x: 4 }} style={{ padding: '1.5rem', borderRadius: '1.25rem', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '1rem', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileSignature size={22} color="#10B981" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>{contract.titre}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '0.25rem' }}>
                      <Building2 size={12} /> {contract.client}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1e293b' }}>{contract.amount?.toLocaleString()} FCFA</div>
                  <span style={{ fontSize: '0.75rem', padding: '3px 12px', borderRadius: '999px', fontWeight: 700,
                    background: contract.status === 'Actif' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                    color: contract.status === 'Actif' ? '#10B981' : '#F59E0B' }}>
                    {contract.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Contracts);
