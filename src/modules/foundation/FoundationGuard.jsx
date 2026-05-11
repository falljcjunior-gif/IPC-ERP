/**
 * FoundationGuard — RBAC isolé filiale IPC Collect Foundation
 *
 * Rôles autorisés :
 *   FOUNDATION_ADMIN   — accès complet + validation décaissements
 *   FOUNDATION_STAFF   — accès lecture + saisie terrain
 *   SUPER_ADMIN        — bypass total (audit)
 *   ADMIN              — bypass total (audit)
 *
 * Tout autre rôle → page "Accès Refusé" branded Foundation
 */
import React from 'react';
import { motion } from 'framer-motion';
import { ShieldOff, Lock, ArrowLeft, Leaf } from 'lucide-react';
import { useStore } from '../../store';

const ALLOWED_ROLES = ['FOUNDATION_ADMIN', 'FOUNDATION_STAFF', 'SUPER_ADMIN', 'ADMIN'];

// ── Design tokens Antigravity Foundation ───────────────────────
const T = {
  bg:       '#0a0c10',
  surface:  '#0d1117',
  card:     '#111318',
  border:   '#1f2937',
  accent:   '#2ecc71',
  accentDim:'rgba(46,204,113,0.12)',
  text:     '#e5e7eb',
  muted:    '#6b7280',
};

export default function FoundationGuard({ children }) {
  const userRole = useStore(s => s.userRole);
  const allowed  = ALLOWED_ROLES.includes(userRole);

  if (allowed) return <>{children}</>;

  return (
    <div style={{
      minHeight: '100vh', background: T.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 0, padding: '2rem',
    }}>
      {/* Logo Foundation */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: '2.5rem', textAlign: 'center' }}
      >
        <div style={{
          width: 72, height: 72, borderRadius: '1.5rem', margin: '0 auto 1rem',
          background: `linear-gradient(135deg, ${T.accent}22, ${T.accent}08)`,
          border: `1px solid ${T.accent}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Leaf size={30} color={T.accent} />
        </div>
        <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.accent, marginBottom: 4 }}>
          IPC Collect Foundation
        </div>
        <div style={{ fontSize: '0.75rem', color: T.muted }}>Filiale Indépendante — Accès Restreint</div>
      </motion.div>

      {/* Card accès refusé */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        style={{
          background: T.card, border: `1px solid ${T.border}`,
          borderRadius: '1.5rem', padding: '3rem', maxWidth: 440, width: '100%',
          textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{
          width: 64, height: 64, borderRadius: '50%', margin: '0 auto 1.5rem',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Lock size={26} color="#EF4444" />
        </div>

        <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.5rem', fontWeight: 900, color: T.text, fontFamily: 'system-ui' }}>
          Accès Non Autorisé
        </h2>
        <p style={{ margin: '0 0 1.5rem', fontSize: '0.9rem', color: T.muted, lineHeight: 1.6 }}>
          Ce module appartient à la filiale <strong style={{ color: T.accent }}>IPC Collect Foundation</strong> et ses données sont strictement isolées du Groupe IPC Green Blocks.
        </p>

        <div style={{
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: '0.875rem',
          padding: '1rem 1.25rem', marginBottom: '1.5rem', textAlign: 'left',
        }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#EF4444', marginBottom: 8 }}>
            Rôles requis
          </div>
          {['FOUNDATION_ADMIN', 'FOUNDATION_STAFF'].map(role => (
            <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <ShieldOff size={12} color={T.muted} />
              <span style={{ fontSize: '0.82rem', color: T.muted, fontFamily: 'monospace' }}>{role}</span>
            </div>
          ))}
        </div>

        <div style={{ fontSize: '0.78rem', color: T.muted }}>
          Votre rôle actuel : <code style={{ color: '#F59E0B', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: '0.3rem' }}>{userRole}</code>
        </div>

        <div style={{ marginTop: '1.75rem', fontSize: '0.8rem', color: T.muted }}>
          Contactez un administrateur Foundation pour obtenir les droits d'accès.
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        onClick={() => window.history.back()}
        style={{
          marginTop: '2rem', display: 'flex', alignItems: 'center', gap: 8,
          background: 'transparent', border: `1px solid ${T.border}`, borderRadius: '0.875rem',
          padding: '0.65rem 1.25rem', color: T.muted, fontSize: '0.82rem',
          cursor: 'pointer', fontWeight: 600,
        }}
        whileHover={{ borderColor: T.accent, color: T.accent }}
      >
        <ArrowLeft size={14} /> Retour à Nexus OS
      </motion.button>
    </div>
  );
}
