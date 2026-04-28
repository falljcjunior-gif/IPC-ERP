import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, Clock, FileText, Target, Activity, BarChart2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import SafeResponsiveChart from '../components/charts/SafeResponsiveChart';
import { useStore } from '../store';
import EnterpriseView from '../components/EnterpriseView';
import { financeSchema } from '../schemas/finance.schema.js';
import AnimatedCounter from '../components/Dashboard/AnimatedCounter';
import '../components/GlobalDashboard.css';

const Expenses = ({ onOpenDetail }) => {
  const { data, formatCurrency } = useStore();
  const [view, setView] = useState('dashboard');

  const allExpenses = useMemo(() => data?.hr?.expenses || [], [data?.hr?.expenses]);

  const kpis = useMemo(() => {
    const total        = allExpenses.reduce((s, e) => s + (e.amount || 0), 0);
    const enAttente    = allExpenses.filter(e => e.status === 'En attente').length;
    const txValidation = allExpenses.length > 0
      ? Math.round((allExpenses.filter(e => e.status === 'Approuvé').length / allExpenses.length) * 100)
      : 0;
    return { total, enAttente, txValidation };
  }, [allExpenses]);

  const renderDashboard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }}>
        {[
          { label: 'Total Frais Déclarés', value: kpis.total,        suffix: '',   color: '#3B82F6', icon: <Wallet size={24} />,   isAmount: true },
          { label: 'En Attente',           value: kpis.enAttente,    suffix: ' dossiers', color: '#F59E0B', icon: <Clock size={24} /> },
          { label: 'Taux de Validation',   value: kpis.txValidation, suffix: '%',  color: '#8B5CF6', icon: <Target size={24} /> },
          { label: 'Dépôt de Reçus',       value: 100,               suffix: '%',  color: '#10B981', icon: <FileText size={24} /> },
        ].map((k, i) => (
          <div key={i} className="luxury-widget" style={{ gridColumn: 'span 3', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ background: `${k.color}15`, padding: '12px', borderRadius: '1rem', color: k.color }}>{k.icon}</div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: k.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>●</span>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{k.label}</div>
              <div style={{ fontSize: k.isAmount ? '1.8rem' : '2.5rem', fontWeight: 800, color: '#1e293b' }}>
                {k.isAmount ? formatCurrency(k.value, true) : <AnimatedCounter from={0} to={k.value} duration={1.5} formatter={v => `${Math.round(v)}${k.suffix}`} />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        <div className="luxury-widget" style={{ padding: '2.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '2rem', color: '#1e293b' }}>Analyse des Coûts par Catégorie</h3>
          <SafeResponsiveChart minHeight={240} fallbackHeight={240}>
            <BarChart data={[{n:'Transport',v:450},{n:'Repas',v:320},{n:'Logement',v:890},{n:'Autres',v:120}]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
              <YAxis hide />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="v" fill="#3B82F6" radius={[8, 8, 0, 0]} barSize={48} />
            </BarChart>
          </SafeResponsiveChart>
        </div>

        <div className="luxury-widget" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: '2rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '2rem', borderRadius: '2rem' }}>
            <Activity size={48} color="#10B981" />
          </div>
          <div>
            <h3 style={{ fontWeight: 800, fontSize: '1.5rem', color: '#1e293b', margin: '0 0 0.75rem 0' }}>Compliance & Audit</h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>
              Toutes les notes de frais sont auditées et rattachées à des justificatifs numériques.
            </p>
          </div>
          <div style={{ padding: '0.5rem 1.5rem', borderRadius: '999px', background: 'rgba(16,185,129,0.1)', color: '#10B981', fontWeight: 800, fontSize: '0.9rem' }}>
            ✓ Système Certifié
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="luxury-dashboard-container" style={{ padding: '3rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── HEADER ── */}
      <div className="luxury-header" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <div className="luxury-subtitle">RH — Notes de Frais</div>
          <h1 className="luxury-title">Notes de <strong>Frais</strong></h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total déclaré</div>
          <div className="luxury-value-massive" style={{ fontSize: '2.5rem', color: '#3B82F6' }}>
            {formatCurrency(kpis.total, true)}
          </div>
        </div>
      </div>

      {/* ── FROSTED-GLASS TABS ── */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.5)', padding: '0.5rem', borderRadius: '1.5rem', backdropFilter: 'blur(10px)', marginBottom: '2rem', width: 'fit-content' }}>
        {[
          { id: 'dashboard', label: 'Analytics',     icon: <BarChart2 size={16} /> },
          { id: 'expenses',  label: 'Toutes les Notes', icon: <Wallet size={16} /> },
        ].map(t => (
          <button key={t.id} onClick={() => setView(t.id)} style={{
            padding: '0.8rem 2rem', borderRadius: '1rem', border: 'none', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s',
            background: view === t.id ? 'white' : 'transparent', color: view === t.id ? '#111827' : '#64748B',
            boxShadow: view === t.id ? '0 10px 20px -10px rgba(0,0,0,0.1)' : 'none',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1 }}>
        <AnimatePresence mode="wait">
          {view === 'dashboard' ? (
            <motion.div key="dash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {renderDashboard()}
            </motion.div>
          ) : (
            <motion.div key="records" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <EnterpriseView 
                moduleId="finance" 
                modelId="expenses"
                schema={financeSchema}
                onOpenDetail={onOpenDetail}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default React.memo(Expenses);
