/**
 * AfricanWorkplaceScene
 * ─────────────────────
 * Ultra-premium animated hero scene.
 * Three afro-descendant professionals collaborating around a holographic ERP core.
 * Pure CSS + Framer Motion — no external image deps.
 *
 * Design system: Antigravity Protocol
 *   emerald-900 #064E3B  primary
 *   emerald-500 #10B981  accent
 *   emerald-400 #34D399  glow
 *   Background : #03100A (almost-black green)
 */

import React, { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// ── Skin + style palette ──────────────────────────────────────────────────────
const SKINS = {
  richEbony:   '#2C1A0E',
  deepMahogany:'#3D1F0A',
  warmBrown:   '#5C2E10',
  caramel:     '#7A3B1E',
};
const HAIR = {
  afro:    '#0D0503',
  braids:  '#150A04',
  locks:   '#1A0A03',
  fade:    '#0A0300',
};
const FITS = {
  emeraldBlaze: 'linear-gradient(145deg, #064E3B 0%, #065F46 60%, #047857 100%)',
  mintSage:     'linear-gradient(145deg, #0D3327 0%, #134E4A 100%)',
  charcoalTech: 'linear-gradient(145deg, #111827 0%, #1F2937 100%)',
  whiteTech:    'linear-gradient(145deg, #E5E7EB 0%, #D1FAE5 100%)',
};

// ── Floating glassmorphism KPI cards ─────────────────────────────────────────
const CARDS = [
  {
    id: 'ca',
    icon: '📈',
    label: 'CA Consolidé',
    value: '2.4 M XOF',
    delta: '+23%',
    deltaPos: true,
    x: -32,
    y: 48,
    delay: 0,
    dur: 4.2,
  },
  {
    id: 'effectif',
    icon: '👥',
    label: 'Effectif Total',
    value: '847 Employés',
    delta: '+12',
    deltaPos: true,
    x: 58,
    y: 12,
    delay: 0.6,
    dur: 3.8,
  },
  {
    id: 'leads',
    icon: '🎯',
    label: 'Pipeline CRM',
    value: '127 Opportunités',
    delta: '68% conversion',
    deltaPos: true,
    x: 62,
    y: 72,
    delay: 1.2,
    dur: 5.1,
  },
  {
    id: 'stock',
    icon: '📦',
    label: 'Stock Critique',
    value: '3 alertes',
    delta: 'À traiter',
    deltaPos: false,
    x: -18,
    y: 82,
    delay: 1.8,
    dur: 4.7,
  },
];

// ── ERP Module nodes ──────────────────────────────────────────────────────────
const MODULES = [
  { id: 'rh',       label: 'RH',         icon: '👤', angle: 0,    r: 48 },
  { id: 'finance',  label: 'Finance',    icon: '💰', angle: 51,   r: 48 },
  { id: 'crm',      label: 'CRM',        icon: '🎯', angle: 103,  r: 48 },
  { id: 'stock',    label: 'Stock',      icon: '📦', angle: 154,  r: 48 },
  { id: 'prod',     label: 'Prod',       icon: '⚙️', angle: 205,  r: 48 },
  { id: 'ia',       label: 'IA',         icon: '🤖', angle: 257,  r: 48 },
  { id: 'analytics',label: 'Analytics',  icon: '📊', angle: 308,  r: 48 },
];

// ── Character shapes (SVG-based, illustrated style) ────────────────────────────
function CharacterCEO({ x = 0, y = 0, reduced }) {
  // Male, fade haircut, blazer, standing — centre stage
  return (
    <motion.g
      animate={reduced ? {} : {
        y: [0, -6, 0],
        rotate: [0, 0.4, 0, -0.4, 0],
      }}
      transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      style={{ originX: '50%', originY: '100%' }}
    >
      <g transform={`translate(${x}, ${y})`}>
        {/* Shadow */}
        <ellipse cx="50" cy="195" rx="38" ry="8" fill="rgba(0,0,0,0.35)" />
        {/* Body — smart blazer */}
        <path d="M18 105 Q50 100 82 105 L90 195 L10 195 Z" fill="#065F46" />
        {/* Lapels */}
        <path d="M42 105 L50 128 L34 115 Z" fill="#D1FAE5" opacity="0.9" />
        <path d="M58 105 L50 128 L66 115 Z" fill="#D1FAE5" opacity="0.9" />
        {/* Shirt */}
        <rect x="44" y="128" width="12" height="22" fill="#F0FDF4" />
        {/* Left arm — gesturing */}
        <path d="M18 115 Q0 130 -12 148" stroke="#3D1F0A" strokeWidth="16" strokeLinecap="round" fill="none" />
        {/* Right arm — holding tablet */}
        <path d="M82 115 Q100 125 108 145" stroke="#3D1F0A" strokeWidth="16" strokeLinecap="round" fill="none" />
        {/* Tablet */}
        <rect x="102" y="138" width="28" height="36" rx="4" fill="#0D3327" stroke="#34D399" strokeWidth="1.5" />
        <rect x="106" y="143" width="20" height="12" rx="2" fill="#10B981" opacity="0.4" />
        <line x1="106" y1="160" x2="126" y2="160" stroke="#34D399" strokeWidth="1" opacity="0.6" />
        <line x1="106" y1="165" x2="120" y2="165" stroke="#34D399" strokeWidth="1" opacity="0.4" />
        {/* Neck */}
        <rect x="44" y="88" width="12" height="18" rx="4" fill="#3D1F0A" />
        {/* Head */}
        <circle cx="50" cy="68" r="28" fill="#2C1A0E" />
        {/* Fade haircut — clean top */}
        <path d="M22 68 Q22 40 50 40 Q78 40 78 68" fill="#0A0300" />
        {/* Fade sides — gradient */}
        <path d="M22 68 Q22 58 30 54 Q22 62 22 68 Z" fill="#150A04" />
        <path d="M78 68 Q78 58 70 54 Q78 62 78 68 Z" fill="#150A04" />
        {/* Eyes */}
        <ellipse cx="41" cy="68" rx="4" ry="4.5" fill="#0D0503" />
        <ellipse cx="59" cy="68" rx="4" ry="4.5" fill="#0D0503" />
        {/* Eye whites */}
        <ellipse cx="42.5" cy="67" rx="1.8" ry="2" fill="white" opacity="0.9" />
        <ellipse cx="60.5" cy="67" rx="1.8" ry="2" fill="white" opacity="0.9" />
        {/* Smile */}
        <path d="M41 79 Q50 86 59 79" stroke="#1A0A03" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {/* Ear */}
        <ellipse cx="22" cy="70" rx="5" ry="7" fill="#2C1A0E" />
        <ellipse cx="78" cy="70" rx="5" ry="7" fill="#2C1A0E" />
        {/* Ambient glow */}
        <circle cx="50" cy="68" r="38" fill="rgba(52,211,153,0.04)" />
      </g>
    </motion.g>
  );
}

function CharacterAnalyst({ x = 0, y = 0, reduced }) {
  // Female, afro hair, seated at desk, fingers hovering over holographic charts
  return (
    <motion.g
      animate={reduced ? {} : {
        y: [0, -4, 1, -4, 0],
        rotate: [0, -0.3, 0, 0.3, 0],
      }}
      transition={{ duration: 6.2, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
      style={{ originX: '50%', originY: '100%' }}
    >
      <g transform={`translate(${x}, ${y})`}>
        {/* Shadow */}
        <ellipse cx="50" cy="185" rx="36" ry="7" fill="rgba(0,0,0,0.3)" />
        {/* Desk edge */}
        <rect x="-10" y="152" width="120" height="8" rx="4" fill="#0D3327" stroke="#10B981" strokeWidth="0.5" />
        {/* Laptop */}
        <rect x="12" y="118" width="72" height="34" rx="4" fill="#111827" />
        <rect x="16" y="122" width="64" height="26" rx="2" fill="#064E3B" />
        {/* Laptop screen content */}
        <rect x="20" y="126" width="28" height="8" rx="2" fill="#10B981" opacity="0.5" />
        <rect x="52" y="126" width="24" height="3" rx="1" fill="#34D399" opacity="0.4" />
        <rect x="52" y="131" width="18" height="3" rx="1" fill="#34D399" opacity="0.3" />
        {/* Laptop base */}
        <rect x="8" y="152" width="80" height="4" rx="2" fill="#1F2937" />
        {/* Body — colorful blazer */}
        <path d="M16 90 Q50 84 84 90 L88 152 L12 152 Z" fill="#134E4A" />
        {/* Collar detail */}
        <path d="M42 90 L50 106 L36 96 Z" fill="#D1FAE5" opacity="0.8" />
        <path d="M58 90 L50 106 L64 96 Z" fill="#D1FAE5" opacity="0.8" />
        {/* Arms on desk */}
        <path d="M16 105 Q10 125 14 148" stroke="#5C2E10" strokeWidth="15" strokeLinecap="round" fill="none" />
        <path d="M84 105 Q90 125 86 148" stroke="#5C2E10" strokeWidth="15" strokeLinecap="round" fill="none" />
        {/* Hands */}
        <ellipse cx="14" cy="152" rx="10" ry="6" fill="#5C2E10" />
        <ellipse cx="86" cy="152" rx="10" ry="6" fill="#5C2E10" />
        {/* Neck */}
        <rect x="44" y="75" width="12" height="16" rx="4" fill="#5C2E10" />
        {/* Head */}
        <circle cx="50" cy="56" r="26" fill="#5C2E10" />
        {/* Afro hair — big beautiful natural crown */}
        <ellipse cx="50" cy="38" rx="38" ry="32" fill="#0D0503" />
        {/* Hair texture/volume detail */}
        <ellipse cx="36" cy="30" rx="16" ry="14" fill="#150A04" opacity="0.6" />
        <ellipse cx="62" cy="28" rx="18" ry="14" fill="#150A04" opacity="0.6" />
        <ellipse cx="50" cy="22" rx="20" ry="12" fill="#0A0300" opacity="0.7" />
        {/* Afro highlight — cinematic rim light */}
        <path d="M24 35 Q28 18 48 16" stroke="#34D399" strokeWidth="1.5" fill="none" opacity="0.25" strokeLinecap="round" />
        {/* Earrings */}
        <circle cx="24" cy="56" r="4" fill="#34D399" opacity="0.8" />
        <circle cx="76" cy="56" r="4" fill="#34D399" opacity="0.8" />
        {/* Ears */}
        <ellipse cx="24" cy="58" rx="5" ry="7" fill="#5C2E10" />
        <ellipse cx="76" cy="58" rx="5" ry="7" fill="#5C2E10" />
        {/* Eyes */}
        <ellipse cx="41" cy="56" rx="3.5" ry="4" fill="#0D0503" />
        <ellipse cx="59" cy="56" rx="3.5" ry="4" fill="#0D0503" />
        <ellipse cx="42.5" cy="55" rx="1.5" ry="1.8" fill="white" opacity="0.85" />
        <ellipse cx="60.5" cy="55" rx="1.5" ry="1.8" fill="white" opacity="0.85" />
        {/* Subtle smile / focused expression */}
        <path d="M43 67 Q50 72 57 67" stroke="#1A0A03" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* Glow */}
        <circle cx="50" cy="56" r="34" fill="rgba(16,185,129,0.05)" />
      </g>
    </motion.g>
  );
}

function CharacterDirector({ x = 0, y = 0, reduced }) {
  // Male, locks/dreadlocks, standing, pointing at a floating KPI
  return (
    <motion.g
      animate={reduced ? {} : {
        y: [0, -5, 0],
        rotate: [0, 0.3, 0, -0.3, 0],
      }}
      transition={{ duration: 7.0, repeat: Infinity, ease: 'easeInOut', delay: 2.4 }}
      style={{ originX: '50%', originY: '100%' }}
    >
      <g transform={`translate(${x}, ${y})`}>
        {/* Shadow */}
        <ellipse cx="50" cy="200" rx="34" ry="7" fill="rgba(0,0,0,0.28)" />
        {/* Legs hint */}
        <rect x="30" y="170" width="16" height="30" rx="6" fill="#1F2937" />
        <rect x="54" y="170" width="16" height="30" rx="6" fill="#1F2937" />
        {/* Body — high-end casual */}
        <path d="M14 95 Q50 88 86 95 L92 170 L8 170 Z" fill="#047857" />
        {/* Turtleneck accent */}
        <rect x="38" y="82" width="24" height="14" rx="6" fill="#064E3B" />
        {/* Arm — right, pointing outward */}
        <path d="M86 108 Q104 100 118 92" stroke="#2C1A0E" strokeWidth="16" strokeLinecap="round" fill="none" />
        {/* Pointing finger */}
        <circle cx="120" cy="90" r="6" fill="#2C1A0E" />
        {/* Arm — left, relaxed at side */}
        <path d="M14 108 Q4 132 6 158" stroke="#2C1A0E" strokeWidth="16" strokeLinecap="round" fill="none" />
        {/* Neck */}
        <rect x="44" y="75" width="12" height="12" rx="3" fill="#2C1A0E" />
        {/* Head */}
        <circle cx="50" cy="56" r="27" fill="#2C1A0E" />
        {/* Locs/dreadlocks — hanging over shoulders */}
        <rect x="14" y="42" width="8" height="52" rx="4" fill="#150A04" />
        <rect x="24" y="36" width="7" height="58" rx="3.5" fill="#0D0503" />
        <rect x="34" y="30" width="7" height="62" rx="3.5" fill="#150A04" />
        <rect x="59" y="30" width="7" height="62" rx="3.5" fill="#0D0503" />
        <rect x="69" y="36" width="7" height="56" rx="3.5" fill="#150A04" />
        <rect x="78" y="42" width="8" height="50" rx="4" fill="#0D0503" />
        {/* Top locks converging */}
        <ellipse cx="50" cy="32" rx="22" ry="8" fill="#0D0503" />
        {/* Eyes */}
        <ellipse cx="42" cy="54" rx="4" ry="4.5" fill="#0D0503" />
        <ellipse cx="58" cy="54" rx="4" ry="4.5" fill="#0D0503" />
        <ellipse cx="43.5" cy="53" rx="1.8" ry="2" fill="white" opacity="0.9" />
        <ellipse cx="59.5" cy="53" rx="1.8" ry="2" fill="white" opacity="0.9" />
        {/* Beard — subtle */}
        <path d="M36 70 Q44 78 50 80 Q56 78 64 70" stroke="#1A0A04" strokeWidth="3" fill="none" opacity="0.7" strokeLinecap="round" />
        {/* Smile */}
        <path d="M40 66 Q50 73 60 66" stroke="#0D0503" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        {/* Ears */}
        <ellipse cx="23" cy="58" rx="5" ry="7" fill="#2C1A0E" />
        <ellipse cx="77" cy="58" rx="5" ry="7" fill="#2C1A0E" />
        {/* Glow */}
        <circle cx="50" cy="56" r="36" fill="rgba(52,211,153,0.04)" />
      </g>
    </motion.g>
  );
}

// ── Particle data-flow connection ─────────────────────────────────────────────
function DataParticle({ d, delay, dur, color = '#34D399' }) {
  return (
    <motion.circle
      r="3"
      fill={color}
      opacity={0}
      animate={{ opacity: [0, 0.9, 0.9, 0] }}
      transition={{ duration: dur, repeat: Infinity, delay, ease: 'linear' }}
    >
      <animateMotion
        dur={`${dur}s`}
        repeatCount="indefinite"
        begin={`${delay}s`}
        path={d}
      />
    </motion.circle>
  );
}

// ── Floating glassmorphism card ────────────────────────────────────────────────
function FloatingCard({ card, reduced }) {
  return (
    <motion.div
      style={{
        position: 'absolute',
        left: `${card.x}%`,
        top: `${card.y}%`,
        transform: 'translate(-50%, -50%)',
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: '1px solid rgba(52,211,153,0.18)',
        borderRadius: 16,
        padding: '12px 16px',
        minWidth: 170,
        zIndex: 10,
        boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
        pointerEvents: 'none',
      }}
      initial={{ opacity: 0, y: 20, scale: 0.92 }}
      animate={{
        opacity: 1,
        y: reduced ? 0 : [0, -6, 0],
        scale: 1,
      }}
      transition={{
        opacity: { duration: 0.6, delay: 0.8 + card.delay },
        scale:   { duration: 0.6, delay: 0.8 + card.delay },
        y: reduced ? {} : {
          duration: card.dur,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: card.delay,
        },
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 14 }}>{card.icon}</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {card.label}
        </span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 4 }}>
        {card.value}
      </div>
      <div style={{
        fontSize: 11, fontWeight: 700,
        color: card.deltaPos ? '#34D399' : '#F87171',
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        {card.deltaPos ? '↑' : '↓'} {card.delta}
      </div>
      {/* Subtle pulse line */}
      <motion.div
        style={{ position: 'absolute', bottom: 0, left: 12, right: 12, height: 2, borderRadius: 1, background: 'rgba(52,211,153,0.25)', overflow: 'hidden' }}
      >
        <motion.div
          style={{ height: '100%', background: '#10B981', borderRadius: 1 }}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: card.delay }}
        />
      </motion.div>
    </motion.div>
  );
}

// ── Main exported component ────────────────────────────────────────────────────
export default function AfricanWorkplaceScene() {
  const reduced = useReducedMotion();
  const canvasRef = useRef(null);

  // Subtle particle canvas background
  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width  = canvas.offsetWidth  * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.4 + 0.1,
    }));

    let raf;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(52,211,153,${p.alpha})`;
        ctx.fill();
      });
      // Connection lines
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach(b => {
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(16,185,129,${0.12 * (1 - dist / 80)})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        });
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  // Module orbit angles → positions on a circle (cx=290, cy=220, r=170)
  const orbitModules = MODULES.map(m => {
    const rad = (m.angle * Math.PI) / 180;
    return {
      ...m,
      cx: 290 + m.r * 1.82 * Math.cos(rad),  // r=48 → scaled orbit radius ~87
      cy: 220 + m.r * 1.82 * Math.sin(rad),
    };
  });

  // Connection paths between modules and central ERP hub (cx=290, cy=220)
  const connectionPaths = orbitModules.map(m =>
    `M290,220 Q${(290 + m.cx) / 2},${(220 + m.cy) / 2 - 20} ${m.cx},${m.cy}`
  );

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 560,
        borderRadius: 28,
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #020D06 0%, #031A0E 40%, #041F10 70%, #052516 100%)',
        isolation: 'isolate',
      }}
    >
      {/* Particle canvas background */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.7 }}
      />

      {/* Emerald glow core */}
      <div style={{
        position: 'absolute',
        top: '30%', left: '45%',
        width: 320, height: 320,
        transform: 'translate(-50%, -50%)',
        background: 'radial-gradient(ellipse, rgba(16,185,129,0.14) 0%, rgba(6,78,59,0.08) 45%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
        filter: 'blur(2px)',
      }} />
      {/* Secondary glow — warm top-left */}
      <div style={{
        position: 'absolute',
        top: '-10%', left: '5%',
        width: 200, height: 200,
        background: 'radial-gradient(ellipse, rgba(52,211,153,0.07) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      {/* SVG scene layer */}
      <svg
        viewBox="0 0 580 520"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '92%' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#34D399" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* === ERP MODULE ORBIT === */}
        {/* Orbit ring */}
        <motion.circle
          cx="290" cy="220" r="150"
          fill="none"
          stroke="rgba(52,211,153,0.1)"
          strokeWidth="1"
          strokeDasharray="6 8"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '290px', originY: '220px' }}
        />

        {/* Connection lines — data flows */}
        {connectionPaths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="rgba(16,185,129,0.15)"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
        ))}

        {/* Data particles flowing along connections */}
        {connectionPaths.map((d, i) => (
          <DataParticle key={i} d={d} delay={i * 0.5} dur={2.5 + i * 0.3} color="#34D399" />
        ))}

        {/* Module nodes */}
        {orbitModules.map((m, i) => (
          <motion.g
            key={m.id}
            animate={reduced ? {} : { y: [0, -4, 0] }}
            transition={{ duration: 3.5 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
          >
            {/* Node glow */}
            <circle cx={m.cx} cy={m.cy} r="22" fill={`url(#glowGrad)`} />
            {/* Node pill */}
            <rect x={m.cx - 24} y={m.cy - 16} width="48" height="32" rx="10"
              fill="rgba(6,30,20,0.9)"
              stroke="rgba(52,211,153,0.3)"
              strokeWidth="1"
              filter="url(#glow)"
            />
            <text x={m.cx} y={m.cy - 3} textAnchor="middle" fontSize="12" fill="white">{m.icon}</text>
            <text x={m.cx} y={m.cy + 11} textAnchor="middle" fontSize="8" fontWeight="700"
              fill="rgba(52,211,153,0.9)" letterSpacing="0.05em">
              {m.label}
            </text>
          </motion.g>
        ))}

        {/* === CENTRAL ERP CORE === */}
        {/* Outer ring pulse */}
        <motion.circle
          cx="290" cy="220" r="42"
          fill="none"
          stroke="rgba(52,211,153,0.2)"
          strokeWidth="1"
          animate={{ r: [42, 50, 42], opacity: [0.2, 0.05, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.circle
          cx="290" cy="220" r="52"
          fill="none"
          stroke="rgba(16,185,129,0.1)"
          strokeWidth="1"
          animate={{ r: [52, 62, 52], opacity: [0.1, 0.02, 0.1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />
        {/* Core circle */}
        <circle cx="290" cy="220" r="36" fill="rgba(6,78,59,0.95)" stroke="rgba(52,211,153,0.45)" strokeWidth="1.5" filter="url(#softGlow)" />
        <circle cx="290" cy="220" r="30" fill="rgba(4,120,87,0.4)" />
        <text x="290" y="214" textAnchor="middle" fontSize="18" fill="#34D399">⚡</text>
        <text x="290" y="230" textAnchor="middle" fontSize="10" fontWeight="800" fill="rgba(255,255,255,0.9)" letterSpacing="0.1em">I.P.C</text>
        <text x="290" y="242" textAnchor="middle" fontSize="7" fill="rgba(52,211,153,0.7)" letterSpacing="0.12em">ERP CORE</text>

        {/* === CHARACTERS === */}
        {/* Analyst — bottom left */}
        <CharacterAnalyst  x={52}  y={278} reduced={reduced} />
        {/* CEO — center, slightly behind core */}
        <CharacterCEO      x={230} y={282} reduced={reduced} />
        {/* Director — right, pointing at a module */}
        <CharacterDirector x={380} y={272} reduced={reduced} />

        {/* Floor line for depth */}
        <line x1="20" y1="478" x2="560" y2="478" stroke="rgba(52,211,153,0.08)" strokeWidth="1" />

        {/* Holographic chart floating above CEO's tablet */}
        <motion.g
          animate={reduced ? {} : { y: [0, -5, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        >
          <rect x="348" y="195" width="80" height="50" rx="6" fill="rgba(6,30,20,0.85)" stroke="rgba(52,211,153,0.25)" strokeWidth="1" />
          {/* Mini bar chart */}
          {[8, 16, 12, 22, 18, 26, 20].map((h, i) => (
            <motion.rect
              key={i}
              x={354 + i * 10} y={234 - h} width="7" height={h} rx="2"
              fill="#10B981"
              opacity="0.7"
              animate={{ height: [h, h * 1.15, h] }}
              transition={{ duration: 2 + i * 0.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
              style={{ originY: '234px' }}
            />
          ))}
          <text x="388" y="208" textAnchor="middle" fontSize="7" fill="rgba(52,211,153,0.8)" fontWeight="700">ANALYTICS</text>
        </motion.g>

        {/* Holographic KPI chips near Director */}
        <motion.g
          animate={reduced ? {} : { y: [0, -6, 0], x: [0, 3, 0] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }}
        >
          <rect x="460" y="145" width="90" height="28" rx="8" fill="rgba(6,78,59,0.85)" stroke="rgba(52,211,153,0.3)" strokeWidth="1" />
          <text x="466" y="160" fontSize="8" fill="rgba(52,211,153,0.9)" fontWeight="700">↑ Revenue</text>
          <text x="466" y="170" fontSize="9" fill="white" fontWeight="800">+23.4%</text>
        </motion.g>

      </svg>

      {/* Floating KPI cards (DOM layer, top of z-stack) */}
      {CARDS.map(card => (
        <FloatingCard key={card.id} card={card} reduced={reduced} />
      ))}

      {/* Premium bottom gradient fade */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 100,
        background: 'linear-gradient(to top, rgba(2,13,6,0.9) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* Left gradient fade (blends with hero text area) */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: 60,
        background: 'linear-gradient(to right, rgba(2,13,6,0.95) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}
