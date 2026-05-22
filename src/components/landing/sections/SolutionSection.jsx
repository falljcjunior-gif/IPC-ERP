import React from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';
import { Layers, TrendingUp, Users, Package, Factory, BarChart2, CheckCircle } from 'lucide-react';

const EASE = [0.16, 1, 0.3, 1];

const MODULES = [
  { label: 'CRM',        Icon: Users,      color: '#10B981', angle: 0 },
  { label: 'Finance',    Icon: TrendingUp,  color: '#059669', angle: 72 },
  { label: 'RH',         Icon: Users,      color: '#34D399', angle: 144 },
  { label: 'Stock',      Icon: Package,    color: '#6EE7B7', angle: 216 },
  { label: 'Production', Icon: Factory,    color: '#A7F3D0', angle: 288 },
];

const ORBIT_R = 180;

function getOrbitalPos(angleDeg, r) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return {
    x: r * Math.cos(rad),
    y: r * Math.sin(rad),
  };
}

const BENEFITS = [
  'Vision unifiée de tous vos départements',
  'Synchronisation automatique des données',
  'Tableaux de bord temps réel',
  'Automatisation des processus métier',
];

export default function SolutionSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="solution-section landing-section" ref={ref}>
      <div className="landing-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <div className="landing-section-label" style={{ justifyContent: 'center' }}>
            <CheckCircle size={14} />
            La Solution
          </div>

          <h2 className="solution-title">
            Un ERP qui{' '}
            <span style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              respire
            </span>
          </h2>
          <p className="solution-description">
            Fini les outils cloisonnés. I.P.C connecte tous vos modules en un
            écosystème vivant, où chaque donnée alimente intelligemment l'ensemble
            de votre entreprise.
          </p>
        </motion.div>

        {/* Two-column layout: orbit + benefits */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', maxWidth: 1000, margin: '0 auto' }}>

          {/* Orbital diagram */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: 420, height: 420 }}>
              {/* Orbit rings */}
              {[ORBIT_R, ORBIT_R * 0.6].map((r, i) => (
                <motion.div
                  key={i}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: r * 2,
                    height: r * 2,
                    marginTop: -r,
                    marginLeft: -r,
                    borderRadius: '50%',
                    border: `1px solid rgba(16, 185, 129, ${0.12 - i * 0.04})`,
                    pointerEvents: 'none',
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={isInView ? { scale: 1, opacity: 1 } : {}}
                  transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: EASE }}
                />
              ))}

              {/* SVG connection lines */}
              <svg
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
              >
                {MODULES.map((m, i) => {
                  const pos = getOrbitalPos(m.angle, ORBIT_R);
                  return (
                    <motion.line
                      key={i}
                      x1="210"
                      y1="210"
                      x2={210 + pos.x}
                      y2={210 + pos.y}
                      stroke={m.color}
                      strokeWidth="1.5"
                      strokeDasharray="6 4"
                      opacity="0.5"
                      initial={{ pathLength: 0 }}
                      animate={isInView ? { pathLength: 1 } : {}}
                      transition={{ duration: 0.6, delay: 0.6 + i * 0.1, ease: EASE }}
                    />
                  );
                })}
              </svg>

              {/* Center hub */}
              <motion.div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 88,
                  height: 88,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 40px rgba(16, 185, 129, 0.35)',
                  zIndex: 10,
                  cursor: 'pointer',
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={isInView ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.3, type: 'spring', stiffness: 300, damping: 20 }}
                whileHover={shouldReduceMotion ? {} : { scale: 1.08 }}
              >
                <Layers size={24} color="white" />
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginTop: 4, letterSpacing: '0.05em' }}>I.P.C</span>
              </motion.div>

              {/* Module nodes */}
              {MODULES.map((m, i) => {
                const pos = getOrbitalPos(m.angle, ORBIT_R);
                return (
                  <motion.div
                    key={i}
                    className="solution-node"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      marginTop: -40,
                      marginLeft: -40,
                      transform: `translate(${pos.x}px, ${pos.y}px)`,
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={isInView ? { scale: 1, opacity: 1 } : {}}
                    transition={{
                      duration: 0.55,
                      delay: 0.55 + i * 0.1,
                      type: 'spring',
                      stiffness: 280,
                      damping: 22,
                    }}
                    whileHover={shouldReduceMotion ? {} : {
                      scale: 1.12,
                      boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)',
                      borderColor: 'rgba(16, 185, 129, 0.4)',
                    }}
                  >
                    <m.Icon size={18} color={m.color} />
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)' }}>{m.label}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Benefits list */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
          >
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.02em', marginBottom: '1.5rem', lineHeight: 1.2 }}>
              Tout connecté.<br />Tout visible.
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              {BENEFITS.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.5 + i * 0.08, ease: EASE }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--accent-glow)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 1,
                  }}>
                    <CheckCircle size={14} color="var(--accent)" />
                  </div>
                  <span style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', lineHeight: 1.6, paddingTop: 3 }}>{b}</span>
                </motion.div>
              ))}
            </div>

            {/* Mini metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                { value: '−40%', label: "Temps d'administration" },
                { value: '+67%', label: 'Visibilité opérationnelle' },
              ].map((m, i) => (
                <motion.div
                  key={i}
                  style={{
                    background: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    padding: '1.25rem',
                  }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.8 + i * 0.1, ease: EASE }}
                >
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 900, color: 'var(--accent)', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '0.375rem' }}>
                    {m.value}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, lineHeight: 1.4 }}>{m.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
