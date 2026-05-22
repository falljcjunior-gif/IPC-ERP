import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useInView, useReducedMotion } from 'framer-motion';
import { Globe, TrendingUp, Users, Factory, ArrowRight } from 'lucide-react';

const EASE = [0.16, 1, 0.3, 1];

const DEPARTMENTS = [
  {
    id: 'global',
    Icon: Globe,
    title: 'Vue Globale',
    color: '#064E3B',
    badge: 'Temps réel',
    metrics: [
      { label: 'CA Mensuel',      value: '€2.4M',  sub: '↑ 12%' },
      { label: 'Clients actifs',  value: '1,284',  sub: '↑ 8%' },
      { label: 'Satisfaction',    value: '98.2%',  sub: '↑ 1.4%' },
    ],
    description: 'Une vision consolidée de toute votre entreprise. Indicateurs clés, alertes et tendances en un seul écran.',
  },
  {
    id: 'finance',
    Icon: TrendingUp,
    title: 'Finance',
    color: '#059669',
    badge: 'Clôture auto',
    metrics: [
      { label: 'Trésorerie',      value: '€847K',  sub: 'Disponible' },
      { label: 'Factures dues',   value: '23',     sub: 'En attente' },
      { label: 'Marge brute',     value: '38.4%',  sub: '↑ 2.1pts' },
    ],
    description: 'Comptabilité en temps réel, facturation automatique et prévisions de trésorerie avec IA.',
  },
  {
    id: 'rh',
    Icon: Users,
    title: 'Ressources Humaines',
    color: '#34D399',
    badge: 'Self-service',
    metrics: [
      { label: 'Effectifs',       value: '847',    sub: 'Actifs' },
      { label: 'Congés en cours', value: '34',     sub: 'Approuvés' },
      { label: 'Recrutements',    value: '8',      sub: 'En cours' },
    ],
    description: 'Gérez votre capital humain de la paie au recrutement, avec un portail self-service pour chaque employé.',
  },
  {
    id: 'production',
    Icon: Factory,
    title: 'Production',
    color: '#10B981',
    badge: 'OEE 94%',
    metrics: [
      { label: 'Rendement',       value: '94%',    sub: 'OEE' },
      { label: 'Ordres actifs',   value: '156',    sub: 'En cours' },
      { label: 'Délai livraison', value: '2.3j',   sub: 'Moyen' },
    ],
    description: "Planification, ordres de fabrication et suivi qualité pour une chaîne de production sans friction.",
  },
];

function DemoPanel({ dept, style = {} }) {
  return (
    <div className="demo-panel" style={style}>
      <div className="demo-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '0.75rem',
            background: `${dept.color}18`,
            border: `1px solid ${dept.color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <dept.Icon size={20} color={dept.color} />
          </div>
          <div>
            <div className="demo-panel-title">{dept.title}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 1 }}>{dept.description}</div>
          </div>
        </div>
        <div className="demo-panel-badge">
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: dept.color, display: 'inline-block' }} />
          {dept.badge}
        </div>
      </div>

      <div className="demo-panel-content">
        {dept.metrics.map((m, i) => (
          <div key={i} className="demo-mini-card">
            <div className="demo-mini-label">{m.label}</div>
            <div className="demo-mini-value" style={{ color: dept.color }}>{m.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 500 }}>{m.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DemoSection() {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: '-60px' });
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  const panelX = useTransform(
    scrollYProgress,
    [0.1, 0.9],
    ['0%', shouldReduceMotion ? '0%' : `-${(DEPARTMENTS.length - 1) * 100 / DEPARTMENTS.length}%`]
  );

  const activeIndex = useTransform(scrollYProgress, [0.1, 0.9], [0, DEPARTMENTS.length - 1]);

  return (
    <section
      id="demo-section"
      ref={sectionRef}
      style={{ height: `${DEPARTMENTS.length * 80}vh`, position: 'relative' }}
    >
      {/* Section header */}
      <div
        ref={headerRef}
        style={{ position: 'sticky', top: 0, padding: '4rem 2rem 2rem', background: 'var(--bg)', zIndex: 10, textAlign: 'center' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <div className="landing-section-label" style={{ justifyContent: 'center' }}>
            <ArrowRight size={14} />
            Démonstration Interactive
          </div>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            color: 'var(--primary)',
            lineHeight: 1.1,
            marginBottom: '0.5rem',
          }}>
            Naviguez dans votre entreprise
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Défiler pour changer de département
          </p>
        </motion.div>

        {/* Progress dots */}
        <div className="demo-progress-dots" style={{ marginTop: '1.25rem' }}>
          {DEPARTMENTS.map((_, i) => (
            <motion.div
              key={i}
              className="demo-dot"
              style={{
                background: useTransform(
                  scrollYProgress,
                  [0.1 + (i - 0.5) / DEPARTMENTS.length, 0.1 + i / DEPARTMENTS.length, 0.1 + (i + 0.5) / DEPARTMENTS.length],
                  ['#E2E8F0', '#10B981', '#E2E8F0']
                ),
                width: useTransform(
                  scrollYProgress,
                  [0.1 + (i - 0.3) / DEPARTMENTS.length, 0.1 + i / DEPARTMENTS.length, 0.1 + (i + 0.3) / DEPARTMENTS.length],
                  ['8px', '24px', '8px']
                ),
              }}
            />
          ))}
        </div>
      </div>

      {/* Sticky panels viewport */}
      <div
        style={{
          position: 'sticky',
          top: '180px',
          height: 'calc(100vh - 180px)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <motion.div
          style={{
            display: 'flex',
            gap: '2rem',
            paddingLeft: '2rem',
            x: panelX,
          }}
          transition={{ type: 'spring', stiffness: 60, damping: 20 }}
        >
          {DEPARTMENTS.map((dept, i) => (
            <DemoPanel key={dept.id} dept={dept} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
