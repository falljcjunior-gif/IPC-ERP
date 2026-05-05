import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, Radar, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Target, Zap, 
  AlertTriangle, CheckCircle, Shield, 
  Activity, DollarSign, Users, Briefcase, FileText,
  ArrowRight
} from 'lucide-react';
import { useStore } from '../store';
import SmartButton from '../components/SmartButton';
import '../components/GlobalDashboard.css'; // Might need to inject some specific dark styles if not existing

// ==========================================
// THE COCKPIT - LUXURY COMMAND CENTER
// ==========================================
const CockpitOverview = () => {
  const data = useStore(state => state.data);
  const currentUser = useStore(state => state.currentUser);
  
  // Aggregate data from the cockpit collection
  const cockpitMetrics = data.cockpit?.global_metrics?.find(m => m.id === 'global_metrics') || {
    finance: { totalCA: 1250000000, cashFlow: 350000000 },
    hr: { headcount: 0, pulseScore: 92 },
    crm: { conversionRate: 0, totalLeads: 0 },
    production: { trs: 87.2 },
    forecasts: { cashFlowTrend: [] }
  };

  const smartAlerts = data.cockpit?.alerts || [];

  const cashFlowTrend = cockpitMetrics.forecasts?.cashFlowTrend?.length > 0 
    ? cockpitMetrics.forecasts.cashFlowTrend 
    : [
        { name: 'Jan', rev: 100, exp: 80 },
        { name: 'Fév', rev: 120, exp: 90 },
        { name: 'Mar', rev: 150, exp: 100 },
        { name: 'Avr', rev: 140, exp: 110 },
        { name: 'Mai', rev: 180, exp: 120 },
        { name: 'Juin', rev: 210, exp: 130 },
      ];

  const radarData = [
    { subject: 'Finance', A: 95, fullMark: 100 },
    { subject: 'Production', A: cockpitMetrics.production?.trs || 87, fullMark: 100 },
    { subject: 'RH', A: 92, fullMark: 100 },
    { subject: 'Commercial', A: cockpitMetrics.crm?.conversionRate || 68, fullMark: 100 },
    { subject: 'Logistique', A: 85, fullMark: 100 },
  ];

  const okrs = [
    { id: 1, title: 'Dominance Marché BTP', progress: 75, status: 'En cours', dept: 'Global' },
    { id: 2, title: 'Optimisation Carbone', progress: 42, status: 'En retard', dept: 'Production' },
    { id: 3, title: 'Transformation Digitale', progress: 90, status: 'Atteint', dept: 'IT' }
  ];

  const hasCriticalAlert = smartAlerts.some(a => a.level === 'critical');

  return (
    <div 
      style={{ 
        backgroundColor: '#050505', 
        minHeight: '100vh', 
        color: '#F8FAFC',
        padding: '3rem',
        fontFamily: '"Inter", sans-serif'
      }}
    >
      {/* ── HEADER (LUXURY MINIMALISM) ── */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ width: '40px', height: '2px', backgroundColor: '#D4AF37' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase', color: '#D4AF37' }}>
              Strategic Command Center
            </span>
          </div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 300, margin: 0, letterSpacing: '-1px' }}>
            C-Level <strong style={{ fontWeight: 800 }}>Cockpit</strong>
          </h1>
          <p style={{ color: '#64748B', marginTop: '0.5rem', fontSize: '1rem', letterSpacing: '0.5px' }}>
            Vue consolidée en temps réel. Accès restreint.
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>
            Statut Global des Opérations
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <div style={{ 
              width: '12px', height: '12px', borderRadius: '50%', 
              backgroundColor: hasCriticalAlert ? '#EF4444' : '#10B981', 
              boxShadow: `0 0 15px ${hasCriticalAlert ? '#EF4444' : '#10B981'}` 
            }} />
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#F8FAFC' }}>
              {hasCriticalAlert ? 'ACTION REQUISE' : 'NOMINAL'}
            </span>
          </div>
        </div>
      </header>

      {/* ── SMART ALERTS STRIP ── */}
      {smartAlerts.length > 0 && (
        <div style={{ marginBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {smartAlerts.map(alert => (
            <motion.div 
              key={alert.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              style={{ 
                backgroundColor: alert.level === 'critical' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                borderLeft: `4px solid ${alert.level === 'critical' ? '#EF4444' : '#F59E0B'}`,
                padding: '1.5rem',
                borderRadius: '0 8px 8px 0',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1.5rem'
              }}
            >
              <AlertTriangle size={24} color={alert.level === 'critical' ? '#EF4444' : '#F59E0B'} style={{ marginTop: '2px' }} />
              <div>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC' }}>{alert.title}</h4>
                <p style={{ margin: 0, color: '#CBD5E1', fontSize: '0.95rem' }}>{alert.message}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── KEY METRICS (GOLD / DARK) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', marginBottom: '4rem' }}>
        {[
          { label: 'Chiffre d\'Affaires Global', val: `${(cockpitMetrics.finance?.totalCA / 1000000).toFixed(1)}M`, sub: 'FCFA', icon: <Briefcase size={22} />, trend: '+12%' },
          { label: 'Cash Flow (30 Jours)', val: `${(cockpitMetrics.forecasts?.cashFlow30d / 1000000).toFixed(1)}M`, sub: 'FCFA', icon: <DollarSign size={22} />, trend: cockpitMetrics.forecasts?.cashFlow30d < 1000000 ? 'CRITIQUE' : 'STABLE' },
          { label: 'TRS Usine', val: `${cockpitMetrics.production?.trs}%`, sub: 'Efficience', icon: <Activity size={22} />, trend: '+1.2%' },
          { label: 'Effectif Global', val: cockpitMetrics.hr?.headcount, sub: 'Collaborateurs', icon: <Users size={22} />, trend: '+4' }
        ].map((kpi, idx) => (
          <motion.div 
            key={idx}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: idx * 0.1 }}
            style={{ 
              backgroundColor: '#121212', 
              border: '1px solid #262626',
              borderRadius: '16px',
              padding: '2rem',
              position: 'relative',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            whileHover={{ y: -5, borderColor: '#D4AF37', boxShadow: '0 10px 30px rgba(212, 175, 55, 0.05)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
              <div style={{ color: '#D4AF37' }}>{kpi.icon}</div>
              <div style={{ 
                fontSize: '0.75rem', 
                fontWeight: 700, 
                color: kpi.trend.startsWith('+') ? '#10B981' : '#EF4444',
                backgroundColor: kpi.trend.startsWith('+') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                padding: '4px 8px',
                borderRadius: '12px'
              }}>
                {kpi.trend}
              </div>
            </div>
            
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>
              {kpi.label}
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 300, color: '#F8FAFC', letterSpacing: '-1px', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              {kpi.val}
              <span style={{ fontSize: '1rem', fontWeight: 600, color: '#64748B' }}>{kpi.sub}</span>
            </div>
            
            <div style={{ position: 'absolute', bottom: '1.5rem', right: '1.5rem', color: '#475569', opacity: 0.5 }}>
              <ArrowRight size={16} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── CHARTS & OKRS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        
        {/* Cash Flow Area Chart */}
        <div style={{ backgroundColor: '#121212', border: '1px solid #262626', borderRadius: '16px', padding: '2.5rem' }}>
          <h3 style={{ margin: '0 0 2rem 0', fontSize: '1.2rem', fontWeight: 600, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <TrendingUp size={20} color="#D4AF37" /> Projection de Trésorerie
          </h3>
          <div style={{ height: '350px', width: '100%' }}>
            <ResponsiveContainer>
              <AreaChart data={cashFlowTrend}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#475569" tick={{fill: '#94A3B8', fontSize: 12}} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" tick={{fill: '#94A3B8', fontSize: 12}} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1E1E1E', border: '1px solid #333', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="rev" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="exp" stroke="#64748B" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* OKR Tracker & Radar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Radar */}
          <div style={{ backgroundColor: '#121212', border: '1px solid #262626', borderRadius: '16px', padding: '2rem', flex: 1 }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#F8FAFC', textAlign: 'center' }}>
              Équilibre Multidimensionnel
            </h3>
            <div style={{ height: '220px', width: '100%' }}>
              <ResponsiveContainer>
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <Radar name="Performance" dataKey="A" stroke="#D4AF37" fill="#D4AF37" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* OKRs */}
          <div style={{ backgroundColor: '#121212', border: '1px solid #262626', borderRadius: '16px', padding: '2rem', flex: 1 }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', fontWeight: 600, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Target size={18} color="#D4AF37" /> Objectifs Stratégiques (OKR)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {okrs.map(okr => (
                <div key={okr.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#E2E8F0' }}>{okr.title}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#D4AF37' }}>{okr.progress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#262626', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${okr.progress}%`, 
                      height: '100%', 
                      backgroundColor: okr.progress < 50 ? '#EF4444' : '#D4AF37',
                      borderRadius: '3px'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CockpitOverview;
