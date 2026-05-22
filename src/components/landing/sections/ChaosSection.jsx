import React, { useState } from 'react';
import { motion, useInView, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';
import { AlertTriangle, X, CheckCircle, ArrowRight, Zap } from 'lucide-react';

const EASE = [0.16, 1, 0.3, 1];

const CHAOS_CARDS = [
  { label: 'Données RH', x: '5%',  y: '8%',  rot: -12, type: 'error' },
  { label: 'Stock Excel', x: '55%', y: '5%',  rot: 8,  type: 'error' },
  { label: 'Factures PDF', x: '20%',y: '50%', rot: 15,  type: 'error' },
  { label: 'CRM Manuel', x: '65%', y: '45%', rot: -7,  type: 'error' },
  { label: 'Paie papier', x: '38%', y: '72%', rot: 10,  type: 'error' },
  { label: 'Emails',      x: '8%',  y: '70%', rot: -5,  type: 'error' },
];

const ORDER_CARDS = [
  { label: 'CRM Unifié',     icon: '👥', color: '#10B981', value: '+24% ventes' },
  { label: 'Finance Live',   icon: '💰', color: '#059669', value: 'Temps réel' },
  { label: 'RH Digitale',    icon: '🏢', color: '#34D399', value: '100% auto' },
  { label: 'Stock Précis',   icon: '📦', color: '#6EE7B7', value: '0 rupture' },
];

export default function ChaosSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const shouldReduceMotion = useReducedMotion();
  const [showOrder, setShowOrder] = useState(false);

  return (
    <section className="chaos-section landing-section" ref={ref}>
      <div className="chaos-grid">
        {/* Text side */}
        <motion.div
          className="chaos-text"
          initial={{ opacity: 0, x: -40 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <div className="landing-section-label">
            <AlertTriangle size={14} />
            Le Problème
          </div>

          <h2 className="chaos-title">
            Votre entreprise tourne sur{' '}
            <span className="accent-red">le chaos</span>
          </h2>

          <p className="chaos-body">
            Données dispersées dans 12 outils différents. Équipes qui ne se
            parlent pas. Décisions prises sur des informations obsolètes.
            Chaque jour coûte du temps, de l'argent et de la sérénité.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
            {[
              'Fichiers Excel éparpillés entre les équipes',
              'Pas de vision globale en temps réel',
              'Erreurs humaines coûteuses et répétées',
              'Processus manuels qui bloquent la croissance',
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.08, ease: EASE }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}
              >
                <X size={14} color="#dc2626" style={{ flexShrink: 0 }} />
                {item}
              </motion.div>
            ))}
          </div>

          <motion.button
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={() => setShowOrder(!showOrder)}
            whileHover={shouldReduceMotion ? {} : { scale: 1.03 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <Zap size={16} />
            {showOrder ? 'Voir le chaos' : 'Voir la solution'}
          </motion.button>
        </motion.div>

        {/* Visual side */}
        <motion.div
          className="chaos-visual"
          initial={{ opacity: 0, x: 40 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
        >
          <AnimatePresence mode="wait">
            {!showOrder ? (
              <motion.div
                key="chaos"
                style={{ position: 'absolute', inset: 0 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* Broken connector lines */}
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                  {CHAOS_CARDS.slice(0, 4).map((_, i) => (
                    <motion.line
                      key={i}
                      x1={`${20 + i * 15}%`}
                      y1={`${30 + i * 10}%`}
                      x2={`${50 + i * 10}%`}
                      y2={`${60 - i * 8}%`}
                      stroke="rgba(220,38,38,0.2)"
                      strokeWidth="1.5"
                      strokeDasharray="6,4"
                      initial={{ pathLength: 0 }}
                      animate={isInView ? { pathLength: 1 } : {}}
                      transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                    />
                  ))}
                </svg>

                {CHAOS_CARDS.map((card, i) => (
                  <motion.div
                    key={i}
                    className={`chaos-card ${card.type}`}
                    style={{
                      left: card.x,
                      top: card.y,
                      transform: `rotate(${card.rot}deg)`,
                    }}
                    initial={{ opacity: 0, scale: 0.6, rotate: card.rot + 20 }}
                    animate={isInView ? {
                      opacity: 1,
                      scale: 1,
                      rotate: shouldReduceMotion ? 0 : card.rot,
                      x: shouldReduceMotion ? 0 : [0, 4, -4, 4, 0],
                    } : {}}
                    transition={{
                      opacity: { duration: 0.4, delay: 0.3 + i * 0.08 },
                      scale: { duration: 0.4, delay: 0.3 + i * 0.08 },
                      x: { duration: 4, delay: 1, repeat: Infinity, repeatType: 'loop' },
                    }}
                  >
                    <AlertTriangle size={14} />
                    {card.label}
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="order"
                style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', justifyContent: 'center' }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                {/* Central hub */}
                <motion.div
                  style={{
                    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                    borderRadius: 'var(--radius)',
                    padding: '1.25rem',
                    textAlign: 'center',
                    color: 'white',
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 800,
                    fontSize: '1.125rem',
                    letterSpacing: '-0.02em',
                    boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
                  }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.5, ease: EASE }}
                >
                  I.P.C — Intelligence Centrale
                </motion.div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {ORDER_CARDS.map((card, i) => (
                    <motion.div
                      key={i}
                      style={{
                        background: 'white',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-light)',
                        padding: '1rem',
                        boxShadow: 'var(--shadow-md)',
                      }}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 + i * 0.07, duration: 0.5, ease: EASE }}
                      whileHover={shouldReduceMotion ? {} : { y: -4, boxShadow: 'var(--shadow-accent)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <CheckCircle size={14} color={card.color} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>{card.label}</span>
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: card.color }}>{card.value}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
