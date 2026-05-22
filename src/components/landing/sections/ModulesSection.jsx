import React from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';
import { Users, TrendingUp, Building2, Package, Factory, Grid3x3 } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

const EASE = [0.16, 1, 0.3, 1];

const CRM_DATA = [
  { m: 'Jan', v: 42 }, { m: 'Fév', v: 58 }, { m: 'Mar', v: 51 },
  { m: 'Avr', v: 74 }, { m: 'Mai', v: 88 }, { m: 'Jun', v: 96 },
];

const FINANCE_DATA = [
  { m: 'Jan', v: 280 }, { m: 'Fév', v: 310 }, { m: 'Mar', v: 290 },
  { m: 'Avr', v: 380 }, { m: 'Mai', v: 420 }, { m: 'Jun', v: 480 },
];

const HR_DATA = [
  { m: 'Jan', v: 62 }, { m: 'Fév', v: 67 }, { m: 'Mar', v: 71 },
  { m: 'Avr', v: 75 }, { m: 'Mai', v: 79 }, { m: 'Jun', v: 84 },
];

const STOCK_DATA = [
  { m: 'Jan', v: 340 }, { m: 'Fév', v: 280 }, { m: 'Mar', v: 390 },
  { m: 'Avr', v: 310 }, { m: 'Mai', v: 420 }, { m: 'Jun', v: 460 },
];

const PRODUCTION_DATA = [
  { m: 'Jan', v: 71 }, { m: 'Fév', v: 78 }, { m: 'Mar', v: 82 },
  { m: 'Avr', v: 85 }, { m: 'Mai', v: 91 }, { m: 'Jun', v: 94 },
];

const MODULES = [
  {
    Icon: Users,
    title: 'CRM',
    desc: 'Gérez vos leads, opportunités et clients avec une vue pipeline temps réel.',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.08)',
    metric: '96 leads',
    delta: '+18%',
    up: true,
    chart: (
      <ResponsiveContainer width="100%" height={80}>
        <LineChart data={CRM_DATA}>
          <Line type="monotone" dataKey="v" stroke="#10B981" strokeWidth={2} dot={false} isAnimationActive />
          <Tooltip contentStyle={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v} leads`]} />
        </LineChart>
      </ResponsiveContainer>
    ),
  },
  {
    Icon: TrendingUp,
    title: 'Finance',
    desc: "Comptabilité, facturation et trésorerie en temps réel. Clôturez en heures.",
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.08)',
    metric: '€480K',
    delta: '+24%',
    up: true,
    chart: (
      <ResponsiveContainer width="100%" height={80}>
        <BarChart data={FINANCE_DATA}>
          <Bar dataKey="v" fill="#059669" radius={[4, 4, 0, 0]} isAnimationActive />
          <Tooltip contentStyle={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12 }} formatter={(v) => [`€${v}K`]} />
        </BarChart>
      </ResponsiveContainer>
    ),
  },
  {
    Icon: Building2,
    title: 'RH',
    desc: "Paie, congés, recrutement et performance. Tout votre capital humain digitalisé.",
    color: '#34D399',
    bg: 'rgba(52, 211, 153, 0.08)',
    metric: '84 actifs',
    delta: '+5%',
    up: true,
    chart: (
      <ResponsiveContainer width="100%" height={80}>
        <AreaChart data={HR_DATA}>
          <defs>
            <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34D399" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke="#34D399" strokeWidth={2} fill="url(#hrGrad)" isAnimationActive />
          <Tooltip contentStyle={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v} employés`]} />
        </AreaChart>
      </ResponsiveContainer>
    ),
  },
  {
    Icon: Package,
    title: 'Stock',
    desc: 'Inventaires automatisés, alertes de rupture et optimisation des commandes.',
    color: '#6EE7B7',
    bg: 'rgba(110, 231, 183, 0.1)',
    metric: '460 SKU',
    delta: '+12%',
    up: true,
    chart: (
      <ResponsiveContainer width="100%" height={80}>
        <BarChart data={STOCK_DATA}>
          <Bar dataKey="v" fill="#6EE7B7" radius={[4, 4, 0, 0]} isAnimationActive />
          <Tooltip contentStyle={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v} unités`]} />
        </BarChart>
      </ResponsiveContainer>
    ),
  },
  {
    Icon: Factory,
    title: 'Production',
    desc: 'Planifiez, suivez et optimisez vos lignes de production avec précision.',
    color: '#064E3B',
    bg: 'rgba(6, 78, 59, 0.06)',
    metric: '94% taux',
    delta: '+3%',
    up: true,
    chart: (
      <ResponsiveContainer width="100%" height={80}>
        <AreaChart data={PRODUCTION_DATA}>
          <defs>
            <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#064E3B" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#064E3B" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke="#064E3B" strokeWidth={2} fill="url(#prodGrad)" isAnimationActive />
          <Tooltip contentStyle={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v}%`]} />
        </AreaChart>
      </ResponsiveContainer>
    ),
  },
];

function ModuleCard({ mod, index }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className="module-card"
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.07, ease: EASE }}
      whileHover={shouldReduceMotion ? {} : {
        y: -8,
        scale: 1.02,
        boxShadow: 'var(--shadow-accent)',
        borderColor: 'rgba(16, 185, 129, 0.25)',
      }}
    >
      <div
        className="module-card-icon"
        style={{ background: mod.bg, border: `1px solid ${mod.color}22` }}
      >
        <mod.Icon size={22} color={mod.color} />
      </div>

      <div className="module-card-title">{mod.title}</div>
      <div className="module-card-desc">{mod.desc}</div>

      <div className="module-card-chart">
        {mod.chart}
      </div>

      <div className="module-card-footer">
        <span className="module-card-metric">{mod.metric}</span>
        <span className={`module-card-delta ${mod.up ? 'up' : 'down'}`}>
          {mod.up ? '↑' : '↓'} {mod.delta}
        </span>
      </div>
    </motion.div>
  );
}

export default function ModulesSection() {
  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: '-60px' });

  return (
    <section className="modules-section landing-section" id="modules">
      <div className="modules-header" ref={headerRef}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <div className="landing-section-label" style={{ justifyContent: 'center' }}>
            <Grid3x3 size={14} />
            Modules Intégrés
          </div>
          <h2 className="modules-title">
            5 modules.{' '}
            <span style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              1 plateforme.
            </span>
          </h2>
          <p className="modules-subtitle">
            Chaque module est conçu pour fonctionner seul ou en parfaite symbiose avec les autres.
            Des données qui se synchronisent automatiquement, en temps réel.
          </p>
        </motion.div>
      </div>

      <div className="modules-grid">
        {MODULES.map((mod, i) => (
          <ModuleCard key={mod.title} mod={mod} index={i} />
        ))}
      </div>
    </section>
  );
}
