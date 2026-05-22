import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { BarChart2, TrendingUp, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';

const EASE = [0.16, 1, 0.3, 1];

const REVENUE_DATA = [
  { m: 'Jan', revenue: 180, prev: 140 },
  { m: 'Fév', revenue: 220, prev: 175 },
  { m: 'Mar', revenue: 195, prev: 168 },
  { m: 'Avr', revenue: 310, prev: 230 },
  { m: 'Mai', revenue: 380, prev: 295 },
  { m: 'Jun', revenue: 420, prev: 320 },
  { m: 'Jul', revenue: 460, prev: 340 },
];

const DEPT_DATA = [
  { dept: 'CRM',     val: 96, target: 100 },
  { dept: 'Finance', val: 88, target: 95 },
  { dept: 'RH',      val: 92, target: 90 },
  { dept: 'Stock',   val: 78, target: 85 },
  { dept: 'Prod.',   val: 94, target: 92 },
];

const KPIS = [
  { label: 'Chiffre d\'affaires', value: 2400000, prefix: '€', suffix: '', display: '€2.4M', trend: '+12%', up: true },
  { label: 'Employés actifs',     value: 847,     prefix: '',  suffix: '', display: '847',   trend: '+5%',  up: true },
  { label: 'Commandes traitées',  value: 12431,   prefix: '',  suffix: '', display: '12,431',trend: '+8.3%',up: true },
  { label: 'Satisfaction client', value: 98,      prefix: '',  suffix: '%',display: '98.2%', trend: '+1.4%',up: true },
];

function useCounter(target, isActive, duration = 1800) {
  const [value, setValue] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isActive || shouldReduceMotion) {
      setValue(target);
      return;
    }
    const start = Date.now();
    const raf = requestAnimationFrame(function tick() {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [isActive, target, duration, shouldReduceMotion]);

  return value;
}

function KPICard({ kpi, index, isInView }) {
  const count = useCounter(kpi.value, isInView, 1600 + index * 200);

  const formatted =
    kpi.value > 10000
      ? `${kpi.prefix}${(count / 1000).toFixed(count >= kpi.value ? 1 : 0)}K${kpi.suffix}`
      : `${kpi.prefix}${count.toLocaleString('fr-FR')}${kpi.suffix}`;

  return (
    <motion.div
      className="kpi-card"
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.08, ease: EASE }}
    >
      <div className="kpi-label">{kpi.label}</div>
      <div className="kpi-value">{isInView ? kpi.display : '—'}</div>
      <div className={`kpi-trend ${kpi.up ? '' : 'negative'}`}>
        {kpi.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {kpi.trend} vs N-1
      </div>
    </motion.div>
  );
}

export default function DashboardSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="dashboard-section landing-section" ref={ref} id="dashboard">
      <div className="dashboard-header">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <div className="dashboard-label">
            <Activity size={14} />
            Dashboard Live
          </div>
          <h2 className="dashboard-title">
            Votre entreprise,{' '}
            <span style={{ color: 'var(--accent)' }}>observable en temps réel</span>
          </h2>
          <p className="dashboard-subtitle">
            Des KPI qui se mettent à jour automatiquement. Des alertes intelligentes.
            Une vision 360° sans effort.
          </p>
        </motion.div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid">
        {KPIS.map((kpi, i) => (
          <KPICard key={kpi.label} kpi={kpi} index={i} isInView={isInView} />
        ))}
      </div>

      {/* Charts Row */}
      <motion.div
        className="charts-row"
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, delay: 0.4, ease: EASE }}
      >
        {/* Revenue Line Chart */}
        <div className="chart-card-dark">
          <div className="chart-card-title">Évolution du chiffre d'affaires (K€)</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={REVENUE_DATA}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="prevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6EE7B7" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6EE7B7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="m" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'rgba(6,78,59,0.95)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, fontSize: 12 }}
                itemStyle={{ color: '#10B981' }}
                labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
              />
              <Area type="monotone" dataKey="prev" name="N-1" stroke="#6EE7B7" strokeWidth={1.5} strokeDasharray="5 3" fill="url(#prevGrad)" isAnimationActive={!shouldReduceMotion} />
              <Area type="monotone" dataKey="revenue" name="Actuel" stroke="#10B981" strokeWidth={2.5} fill="url(#revenueGrad)" isAnimationActive={!shouldReduceMotion} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Department Bar Chart */}
        <div className="chart-card-dark">
          <div className="chart-card-title">Performance par département (%)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={DEPT_DATA} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="dept" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} width={50} />
              <Tooltip
                contentStyle={{ background: 'rgba(6,78,59,0.95)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, fontSize: 12 }}
                itemStyle={{ color: '#10B981' }}
                labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                formatter={(v) => [`${v}%`]}
              />
              <Bar dataKey="target" name="Objectif" fill="rgba(255,255,255,0.08)" radius={[0, 4, 4, 0]} barSize={10} isAnimationActive={!shouldReduceMotion} />
              <Bar dataKey="val" name="Réalisé" fill="#10B981" radius={[0, 4, 4, 0]} barSize={10} isAnimationActive={!shouldReduceMotion} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </section>
  );
}
