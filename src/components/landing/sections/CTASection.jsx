import React, { Suspense, lazy } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, Calendar, Star } from 'lucide-react';

const ERPOrbitalScene = lazy(() => import('../three/ERPOrbitalScene'));

const EASE = [0.16, 1, 0.3, 1];

const TESTIMONIALS = [
  { name: 'Marie Dubois', role: 'DAF — Groupe Lumière', quote: '"En 3 mois, nous avons réduit notre temps de clôture de 5 jours à 6 heures."' },
  { name: 'Alexandre Chen', role: 'DRH — TechCorp France', quote: '"L\'interface RH a transformé notre onboarding. Les équipes adorent le self-service."' },
];

export default function CTASection({ onCTA }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const shouldReduceMotion = useReducedMotion();

  return (
    <>
      {/* Testimonials strip */}
      <section style={{ padding: '5rem 0', background: 'var(--bg-subtle)', borderTop: '1px solid var(--border-light)' }}>
        <div className="landing-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            ref={ref}
            transition={{ duration: 0.6, ease: EASE }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', maxWidth: 900, margin: '0 auto' }}
          >
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.15 + i * 0.1, ease: EASE }}
                style={{
                  background: 'white',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border-light)',
                  boxShadow: 'var(--shadow-md)',
                  padding: '2rem',
                }}
                whileHover={shouldReduceMotion ? {} : { y: -4, boxShadow: 'var(--shadow-premium)' }}
              >
                <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem' }}>
                  {[...Array(5)].map((_, si) => (
                    <Star key={si} size={14} fill="#F59E0B" color="#F59E0B" />
                  ))}
                </div>
                <p style={{ fontSize: '0.9375rem', color: 'var(--text)', lineHeight: 1.7, marginBottom: '1.25rem', fontStyle: 'italic' }}>
                  {t.quote}
                </p>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary)' }}>{t.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.role}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="cta-section landing-section">
        {/* 3D Background */}
        <div className="cta-canvas-bg">
          <Suspense fallback={null}>
            <ERPOrbitalScene
              scrollProgress={0}
              style={{ width: '100%', height: '100%' }}
            />
          </Suspense>
        </div>

        {/* Dark overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, rgba(6,78,59,0.6) 0%, rgba(6,78,59,0.95) 70%)',
          zIndex: 1,
        }} />

        <div className="cta-content">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <div className="cta-eyebrow">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite' }} />
              Prêt à transformer votre ERP ?
            </div>

            <h2 className="cta-title">
              Passez d'un ERP complexe
              <br />
              <span style={{ color: 'var(--accent)' }}>à une intelligence visuelle</span>
            </h2>

            <p className="cta-subtitle">
              Rejoignez 500+ entreprises qui pilotent leur activité avec une
              clarté inédite. Démo personnalisée en 30 minutes.
            </p>

            <div className="cta-btn-group">
              <motion.button
                className="btn-cta-primary"
                onClick={onCTA}
                whileHover={shouldReduceMotion ? {} : { scale: 1.04, y: -2 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Calendar size={18} />
                Planifier une démo
              </motion.button>

              <motion.button
                className="btn-cta-ghost"
                onClick={onCTA}
                whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                Commencer gratuitement
                <ArrowRight size={16} />
              </motion.button>
            </div>

            {/* Trust badges */}
            <motion.div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', marginTop: '3rem', flexWrap: 'wrap' }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              {['Sans engagement', 'Données sécurisées', 'Support 24/7', 'Déploiement rapide'].map((badge, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: 500 }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent)' }} />
                  {badge}
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--primary)', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <img src="/logo-holding.png" alt="IPC Green Blocks Holding" style={{ height: 32, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
            <img src="/logo-filiale.png" alt="IPC Green Blocks" style={{ height: 32, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
            <img src="/logo-fondation.png" alt="Fondation IPC Collect" style={{ height: 32, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)' }}>
            © {new Date().getFullYear()} IPC Green Blocks. Tous droits réservés.
          </div>
        </div>
      </footer>
    </>
  );
}
