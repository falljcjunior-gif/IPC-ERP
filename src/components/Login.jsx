import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, ArrowRight, AlertCircle, Eye, EyeOff,
  Zap, Lock, Server, Globe,
} from 'lucide-react';
import { AuthService } from '../services/auth.service';
import { useToast } from './ToastProvider';
import { useStore } from '../store';
import { useTranslation } from 'react-i18next';

const EASE = [0.16, 1, 0.3, 1];

/* ── Design tokens ─────────────────────────────────────────────────────────── */
const L = {
  bg:          '#F7F7F5',
  panel:       '#FFFFFF',
  border:      'rgba(0,0,0,0.07)',
  borderFocus: 'rgba(0,0,0,0.25)',
  input:       '#F9F9F8',
  text:        '#0F0F10',
  sub:         '#6B7280',
  muted:       '#9CA3AF',
  dim:         '#D1D5DB',
  btnBg:       '#0F0F10',
  btnHover:    '#000000',
  errorColor:  'rgba(220,38,38,0.85)',
  errorBg:     'rgba(220,38,38,0.04)',
  errorBorder: 'rgba(220,38,38,0.15)',
};

/* ── IPC isometric logo ────────────────────────────────────────────────────── */
function IPCLogo({ size = 40 }) {
  return (
    <svg width={size} height={Math.round(size * 0.875)} viewBox="0 0 64 56" fill="none">
      <path d="M2 20 L18 11 L34 20 L18 29 Z" fill="#0F0F10"/>
      <path d="M2 20 L2 36 L18 45 L18 29 Z" fill="rgba(0,0,0,0.28)"/>
      <path d="M34 20 L34 36 L18 45 L18 29 Z" fill="rgba(0,0,0,0.14)"/>
      <path d="M30 8 L46 0 L62 8 L46 16 Z" fill="rgba(0,0,0,0.72)"/>
      <path d="M30 8 L30 24 L46 32 L46 16 Z" fill="rgba(0,0,0,0.22)"/>
      <path d="M62 8 L62 24 L46 32 L46 16 Z" fill="rgba(0,0,0,0.11)"/>
      <path d="M18 29 L34 20 L46 16 L46 32 L34 36 L18 45 Z" fill="rgba(0,0,0,0.06)"/>
    </svg>
  );
}

/* ── IPC logo white variant (for dark scene) ───────────────────────────────── */
function IPCLogoWhite({ size = 16 }) {
  return (
    <svg width={size} height={Math.round(size * 0.875)} viewBox="0 0 64 56" fill="none">
      <path d="M2 20 L18 11 L34 20 L18 29 Z" fill="rgba(255,255,255,0.95)"/>
      <path d="M2 20 L2 36 L18 45 L18 29 Z" fill="rgba(255,255,255,0.4)"/>
      <path d="M34 20 L34 36 L18 45 L18 29 Z" fill="rgba(255,255,255,0.22)"/>
      <path d="M30 8 L46 0 L62 8 L46 16 Z" fill="rgba(255,255,255,0.7)"/>
      <path d="M30 8 L30 24 L46 32 L46 16 Z" fill="rgba(255,255,255,0.3)"/>
      <path d="M62 8 L62 24 L46 32 L46 16 Z" fill="rgba(255,255,255,0.15)"/>
      <path d="M18 29 L34 20 L46 16 L46 32 L34 36 L18 45 Z" fill="rgba(255,255,255,0.1)"/>
    </svg>
  );
}

/* ── Text input ────────────────────────────────────────────────────────────── */
function TextInput({ type = 'text', value, onChange, placeholder, required }) {
  const onFocus = e => {
    e.target.style.borderColor = L.borderFocus;
    e.target.style.boxShadow   = '0 0 0 3px rgba(0,0,0,0.05)';
    e.target.style.background  = '#FFFFFF';
  };
  const onBlur = e => {
    e.target.style.borderColor = L.border;
    e.target.style.boxShadow   = 'none';
    e.target.style.background  = L.input;
  };
  return (
    <input
      type={type} value={value} onChange={onChange}
      placeholder={placeholder} required={required}
      onFocus={onFocus} onBlur={onBlur}
      style={{
        width: '100%', padding: '14px 16px', boxSizing: 'border-box',
        background: L.input, border: `1px solid ${L.border}`,
        borderRadius: 12, color: L.text, outline: 'none',
        fontSize: '0.9rem', fontWeight: 500, fontFamily: 'inherit',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease',
      }}
    />
  );
}

/* ── Password input ────────────────────────────────────────────────────────── */
function PasswordInput({ value, onChange, placeholder, required }) {
  const [visible, setVisible] = useState(false);
  const onFocus = e => {
    e.target.style.borderColor = L.borderFocus;
    e.target.style.boxShadow   = '0 0 0 3px rgba(0,0,0,0.05)';
    e.target.style.background  = '#FFFFFF';
  };
  const onBlur = e => {
    e.target.style.borderColor = L.border;
    e.target.style.boxShadow   = 'none';
    e.target.style.background  = L.input;
  };
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={visible ? 'text' : 'password'}
        value={value} onChange={onChange}
        placeholder={placeholder} required={required}
        onFocus={onFocus} onBlur={onBlur}
        style={{
          width: '100%', padding: '14px 3rem 14px 16px', boxSizing: 'border-box',
          background: L.input, border: `1px solid ${L.border}`,
          borderRadius: 12, color: L.text, outline: 'none',
          fontSize: '0.9rem', fontWeight: 500, fontFamily: 'inherit',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease',
        }}
      />
      <button
        type="button" onClick={() => setVisible(v => !v)}
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        style={{
          position: 'absolute', right: '0.875rem', top: '50%',
          transform: 'translateY(-50%)', background: 'none', border: 'none',
          cursor: 'pointer', color: L.muted, padding: 0,
          display: 'flex', alignItems: 'center',
          transition: 'color 0.15s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = L.sub)}
        onMouseLeave={e => (e.currentTarget.style.color = L.muted)}
      >
        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

/* ── Field label ─────────────────────────────────────────────────────────────── */
function Label({ children }) {
  return (
    <div style={{
      fontSize: '0.67rem', fontWeight: 700, color: L.sub,
      textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: '0.45rem',
    }}>
      {children}
    </div>
  );
}

/* ── Entity logo marks ──────────────────────────────────────────────────────── */
function HoldingMark({ size = 48 }) {
  return <img src="/logo-holding.png" alt="IPC Green Blocks Holding" style={{ height: size, width: 'auto', objectFit: 'contain' }} />;
}
function SubsidiaryMark({ size = 48 }) {
  return <img src="/logo-filiale.png" alt="IPC Green Blocks Filiale" style={{ height: size, width: 'auto', objectFit: 'contain' }} />;
}
function FoundationMark({ size = 48 }) {
  return <img src="/logo-fondation.png" alt="Fondation IPC-Collect" style={{ height: size, width: 'auto', objectFit: 'contain' }} />;
}

/* ── Floating chip for the dark scene panel ─────────────────────────────────── */
function SceneChip({ pos, delay, icon, label, value }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: EASE }}
      style={{
        position: 'absolute', ...pos,
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
        border: '1px solid rgba(255,255,255,0.11)',
        boxShadow: '0 4px 28px rgba(0,0,0,0.35)',
        borderRadius: 13, padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
        zIndex: 20, pointerEvents: 'none',
      }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: 7,
        background: 'rgba(255,255,255,0.09)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{
          fontSize: '7.5px', fontWeight: 700, letterSpacing: '0.12em',
          color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase',
          lineHeight: 1, marginBottom: 3,
        }}>
          {label}
        </div>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.88)', lineHeight: 1 }}>
          {value}
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   3D ORG CHART SCENE
   Hierarchy: IPC Holding (top) → 3 Filiales → 2 Fondations
   Effect: CSS perspective tilt + mouse parallax + flowing SVG paths + glow
══════════════════════════════════════════════════════════════════════════════ */
function OrgChart({ mouse }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Ambient emerald glow — center */}
      <div style={{
        position: 'absolute',
        top: '15%', left: '50%', transform: 'translateX(-50%)',
        width: 420, height: 320,
        background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.10) 0%, transparent 68%)',
        pointerEvents: 'none',
      }} />
      {/* Ambient cyan glow — bottom right */}
      <div style={{
        position: 'absolute',
        bottom: '8%', right: '10%',
        width: 280, height: 220,
        background: 'radial-gradient(circle, rgba(34,211,238,0.07) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />
      {/* Ambient green glow — bottom left */}
      <div style={{
        position: 'absolute',
        bottom: '10%', left: '10%',
        width: 240, height: 200,
        background: 'radial-gradient(circle, rgba(132,204,22,0.07) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* 3D tilted chart container */}
      <div style={{
        transform: `perspective(900px) rotateX(${15 - mouse.y * 7}deg) rotateY(${mouse.x * 6}deg)`,
        transition: 'transform 0.28s cubic-bezier(0.16,1,0.3,1)',
        transformOrigin: '50% 46%',
        width: '86%',
        maxWidth: 560,
      }}>
        <svg viewBox="0 0 600 470" style={{ width: '100%', overflow: 'visible' }}>
          <defs>
            {/* Glow filters */}
            <filter id="lgw" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="5" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="lgc" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="6" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="lgg" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="6" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* ── BASE CONNECTION LINES (static, faint) ── */}
          <g stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" fill="none">
            <path d="M 300,78 C 300,155 120,155 120,228"/>
            <path d="M 300,78 C 300,158 300,158 300,228"/>
            <path d="M 300,78 C 300,155 480,155 480,228"/>
            <path d="M 120,228 C 120,305 195,305 195,378"/>
            <path d="M 300,228 C 300,305 195,305 195,378"/>
            <path d="M 300,228 C 300,305 405,305 405,378"/>
            <path d="M 480,228 C 480,305 405,305 405,378"/>
          </g>

          {/* ── FLOWING EDGES — Holding → Filiales (cyan) ── */}
          <g fill="none" strokeWidth="1.8">
            <path
              d="M 300,78 C 300,155 120,155 120,228"
              stroke="rgba(103,232,249,0.60)"
              strokeDasharray="3 8"
              style={{ animation: 'ipc-flow 2.0s linear infinite' }}
            />
            <path
              d="M 300,78 C 300,158 300,158 300,228"
              stroke="rgba(103,232,249,0.60)"
              strokeDasharray="3 8"
              style={{ animation: 'ipc-flow 2.3s linear infinite', animationDelay: '0.35s' }}
            />
            <path
              d="M 300,78 C 300,155 480,155 480,228"
              stroke="rgba(103,232,249,0.60)"
              strokeDasharray="3 8"
              style={{ animation: 'ipc-flow 2.1s linear infinite', animationDelay: '0.7s' }}
            />
          </g>

          {/* ── FLOWING EDGES — Filiales → Fondations (green) ── */}
          <g fill="none" strokeWidth="1.6">
            <path
              d="M 120,228 C 120,305 195,305 195,378"
              stroke="rgba(134,239,172,0.55)"
              strokeDasharray="3 8"
              style={{ animation: 'ipc-flow 2.2s linear infinite', animationDelay: '0.2s' }}
            />
            <path
              d="M 300,228 C 300,305 195,305 195,378"
              stroke="rgba(134,239,172,0.55)"
              strokeDasharray="3 8"
              style={{ animation: 'ipc-flow 1.9s linear infinite', animationDelay: '0.55s' }}
            />
            <path
              d="M 300,228 C 300,305 405,305 405,378"
              stroke="rgba(134,239,172,0.55)"
              strokeDasharray="3 8"
              style={{ animation: 'ipc-flow 2.4s linear infinite', animationDelay: '0.9s' }}
            />
            <path
              d="M 480,228 C 480,305 405,305 405,378"
              stroke="rgba(134,239,172,0.55)"
              strokeDasharray="3 8"
              style={{ animation: 'ipc-flow 2.0s linear infinite', animationDelay: '1.2s' }}
            />
          </g>

          {/* ══════════════════════════════════
              HOLDING NODE — top centre
          ══════════════════════════════════ */}
          {/* Outer pulse ring */}
          <circle cx="300" cy="78" r="38"
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1"
            style={{ animation: 'ipc-pulse 3.0s ease-in-out infinite' }}
          />
          {/* Main circle */}
          <circle cx="300" cy="78" r="27"
            fill="rgba(255,255,255,0.92)"
            filter="url(#lgw)"
          />
          {/* Label inside */}
          <text x="300" y="78" dominantBaseline="middle" textAnchor="middle"
            style={{ fontSize: '8px', fontWeight: 800, fill: '#030714', fontFamily: 'Outfit, sans-serif', letterSpacing: '0.04em' }}
          >IPC</text>
          {/* Label below */}
          <text x="300" y="116" textAnchor="middle"
            style={{ fontSize: '9.5px', fontWeight: 700, fill: 'rgba(255,255,255,0.88)', fontFamily: 'Outfit, sans-serif' }}
          >Holding</text>
          <text x="300" y="129" textAnchor="middle"
            style={{ fontSize: '7px', fontWeight: 400, fill: 'rgba(255,255,255,0.38)', fontFamily: 'Inter, sans-serif' }}
          >Gouvernance Groupe</text>

          {/* ══════════════════════════════════
              FILIALE NODES — middle row
          ══════════════════════════════════ */}
          {/* CI */}
          <circle cx="120" cy="228" r="30"
            fill="rgba(103,232,249,0.04)"
            stroke="rgba(103,232,249,0.28)"
            strokeWidth="1"
            style={{ animation: 'ipc-pulse 2.8s ease-in-out infinite', animationDelay: '0.5s' }}
          />
          <circle cx="120" cy="228" r="21"
            fill="rgba(103,232,249,0.82)"
            filter="url(#lgc)"
          />
          <text x="120" y="228" dominantBaseline="middle" textAnchor="middle"
            style={{ fontSize: '7px', fontWeight: 800, fill: '#030714', fontFamily: 'Outfit, sans-serif' }}
          >CI</text>
          <text x="120" y="260" textAnchor="middle"
            style={{ fontSize: '8.5px', fontWeight: 700, fill: 'rgba(255,255,255,0.78)', fontFamily: 'Outfit, sans-serif' }}
          >Filiale CI</text>
          <text x="120" y="271" textAnchor="middle"
            style={{ fontSize: '6.5px', fontWeight: 400, fill: 'rgba(255,255,255,0.36)', fontFamily: 'Inter, sans-serif' }}
          >Abidjan</text>

          {/* SN */}
          <circle cx="300" cy="228" r="30"
            fill="rgba(103,232,249,0.04)"
            stroke="rgba(103,232,249,0.28)"
            strokeWidth="1"
            style={{ animation: 'ipc-pulse 3.2s ease-in-out infinite', animationDelay: '0.9s' }}
          />
          <circle cx="300" cy="228" r="21"
            fill="rgba(103,232,249,0.82)"
            filter="url(#lgc)"
          />
          <text x="300" y="228" dominantBaseline="middle" textAnchor="middle"
            style={{ fontSize: '7px', fontWeight: 800, fill: '#030714', fontFamily: 'Outfit, sans-serif' }}
          >SN</text>
          <text x="300" y="260" textAnchor="middle"
            style={{ fontSize: '8.5px', fontWeight: 700, fill: 'rgba(255,255,255,0.78)', fontFamily: 'Outfit, sans-serif' }}
          >Filiale SN</text>
          <text x="300" y="271" textAnchor="middle"
            style={{ fontSize: '6.5px', fontWeight: 400, fill: 'rgba(255,255,255,0.36)', fontFamily: 'Inter, sans-serif' }}
          >Dakar</text>

          {/* GN */}
          <circle cx="480" cy="228" r="30"
            fill="rgba(103,232,249,0.04)"
            stroke="rgba(103,232,249,0.28)"
            strokeWidth="1"
            style={{ animation: 'ipc-pulse 2.6s ease-in-out infinite', animationDelay: '1.3s' }}
          />
          <circle cx="480" cy="228" r="21"
            fill="rgba(103,232,249,0.82)"
            filter="url(#lgc)"
          />
          <text x="480" y="228" dominantBaseline="middle" textAnchor="middle"
            style={{ fontSize: '7px', fontWeight: 800, fill: '#030714', fontFamily: 'Outfit, sans-serif' }}
          >GN</text>
          <text x="480" y="260" textAnchor="middle"
            style={{ fontSize: '8.5px', fontWeight: 700, fill: 'rgba(255,255,255,0.78)', fontFamily: 'Outfit, sans-serif' }}
          >Filiale GN</text>
          <text x="480" y="271" textAnchor="middle"
            style={{ fontSize: '6.5px', fontWeight: 400, fill: 'rgba(255,255,255,0.36)', fontFamily: 'Inter, sans-serif' }}
          >Conakry</text>

          {/* ══════════════════════════════════
              FOUNDATION NODES — bottom row
          ══════════════════════════════════ */}
          {/* Fondation IPC */}
          <circle cx="195" cy="378" r="25"
            fill="rgba(134,239,172,0.05)"
            stroke="rgba(134,239,172,0.24)"
            strokeWidth="1"
            style={{ animation: 'ipc-pulse 3.0s ease-in-out infinite', animationDelay: '0.7s' }}
          />
          <circle cx="195" cy="378" r="18"
            fill="rgba(134,239,172,0.78)"
            filter="url(#lgg)"
          />
          <text x="195" y="378" dominantBaseline="middle" textAnchor="middle"
            style={{ fontSize: '6px', fontWeight: 800, fill: '#030714', fontFamily: 'Outfit, sans-serif' }}
          >FDN</text>
          <text x="195" y="407" textAnchor="middle"
            style={{ fontSize: '8px', fontWeight: 700, fill: 'rgba(255,255,255,0.72)', fontFamily: 'Outfit, sans-serif' }}
          >Fondation IPC</text>
          <text x="195" y="418" textAnchor="middle"
            style={{ fontSize: '6px', fontWeight: 400, fill: 'rgba(255,255,255,0.34)', fontFamily: 'Inter, sans-serif' }}
          >Impact Social</text>

          {/* IPC-Collect */}
          <circle cx="405" cy="378" r="25"
            fill="rgba(134,239,172,0.05)"
            stroke="rgba(134,239,172,0.24)"
            strokeWidth="1"
            style={{ animation: 'ipc-pulse 2.7s ease-in-out infinite', animationDelay: '1.1s' }}
          />
          <circle cx="405" cy="378" r="18"
            fill="rgba(134,239,172,0.78)"
            filter="url(#lgg)"
          />
          <text x="405" y="378" dominantBaseline="middle" textAnchor="middle"
            style={{ fontSize: '6px', fontWeight: 800, fill: '#030714', fontFamily: 'Outfit, sans-serif' }}
          >COL</text>
          <text x="405" y="407" textAnchor="middle"
            style={{ fontSize: '8px', fontWeight: 700, fill: 'rgba(255,255,255,0.72)', fontFamily: 'Outfit, sans-serif' }}
          >IPC-Collect</text>
          <text x="405" y="418" textAnchor="middle"
            style={{ fontSize: '6px', fontWeight: 400, fill: 'rgba(255,255,255,0.34)', fontFamily: 'Inter, sans-serif' }}
          >Microfinance</text>
        </svg>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════════ */
const Login = ({ onLogin }) => {
  const { t } = useTranslation();
  const { addToast } = useToast();

  /* ── State ──────────────────────────────────────────────────────────────── */
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error,           setError]           = useState('');
  const [isLoading,       setIsLoading]       = useState(false);
  const [mustChange,      setMustChange]      = useState(false);
  const [isMobile,        setIsMobile]        = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* Mouse parallax — drives 3D chart tilt */
  useEffect(() => {
    if (isMobile) return;
    const handler = (e) => {
      setMouse({
        x: (e.clientX / window.innerWidth  - 0.5),
        y: (e.clientY / window.innerHeight - 0.5),
      });
    };
    window.addEventListener('mousemove', handler, { passive: true });
    return () => window.removeEventListener('mousemove', handler);
  }, [isMobile]);

  /* ── Auth handlers ──────────────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const { user, userData } = await AuthService.login(email, password);
      if (userData.profile?.mustChangePassword) {
        setMustChange(true);
        setIsLoading(false);
        return;
      }
      addToast('Connexion établie.', 'success');
      onLogin();
    } catch (err) {
      setError(err.message || 'Identifiants invalides.');
    } finally {
      if (!mustChange) setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (newPassword.length < 6)          { setError('Minimum 6 caractères requis.'); return; }
    setIsLoading(true);
    setError('');
    try {
      await AuthService.mandatoryPasswordUpdate(newPassword);
      onLogin();
    } catch (err) {
      setError(err.message || 'Échec de la mise à jour.');
    } finally {
      setIsLoading(false);
    }
  };

  /* ════════════════════════════════════════════════════════════════════════
     RIGHT PANEL — form
  ════════════════════════════════════════════════════════════════════════ */
  const FormPanel = (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      style={{
        flex: isMobile ? '0 0 auto' : '0 0 460px',
        width: isMobile ? '100%' : undefined,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: isMobile ? '2rem 1.75rem 2.5rem' : '2.5rem 3rem',
        background: L.panel,
        borderLeft: isMobile ? 'none' : `1px solid ${L.border}`,
        borderTop:  isMobile ? `1px solid ${L.border}` : 'none',
        position: 'relative', zIndex: 10,
        overflowY: 'auto',
      }}
    >
      <div style={{ width: '100%', maxWidth: isMobile ? 420 : 360 }}>

        {/* ── OS version pill ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.06, ease: EASE }}
          style={{ marginBottom: '1.8rem', display: 'flex', justifyContent: 'center' }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '5px 13px',
            background: 'rgba(16,185,129,0.07)',
            border: '1px solid rgba(16,185,129,0.18)',
            borderRadius: 100,
            fontSize: '0.62rem', fontWeight: 700,
            color: '#059669', letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', flexShrink: 0 }} />
            IPC Antigravity OS — v4
          </div>
        </motion.div>

        {/* ── Three entity logos ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.14, ease: EASE }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: '2rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <HoldingMark size={44} />
          </div>
          <div style={{ width: 1, height: 44, background: 'rgba(0,0,0,0.07)', flexShrink: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <SubsidiaryMark size={44} />
          </div>
          <div style={{ width: 1, height: 44, background: 'rgba(0,0,0,0.07)', flexShrink: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <FoundationMark size={44} />
          </div>
        </motion.div>

        {/* ── Headline ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.20, ease: EASE }}
          style={{ marginBottom: '1.85rem' }}
        >
          {!mustChange && (
            <p style={{
              fontSize: '0.76rem', color: L.muted, fontWeight: 500,
              margin: '0 0 6px 0', letterSpacing: '0.005em',
            }}>
              Bonne journée —
            </p>
          )}
          <h1 style={{
            fontSize: '1.95rem', fontWeight: 800, color: L.text,
            letterSpacing: '-0.045em', lineHeight: 1.14, margin: 0,
          }}>
            {mustChange
              ? <>Nouveau mot<br />de passe</>
              : <>Pilotez votre<br />groupe.</>
            }
          </h1>
          {!mustChange && (
            <p style={{
              fontSize: '0.8rem', color: L.sub, margin: '9px 0 0',
              lineHeight: 1.58, letterSpacing: '-0.005em',
            }}>
              Gouvernez vos opérations.<br />
              Accélérez votre croissance.
            </p>
          )}
        </motion.div>

        {/* ── Error banner ──────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: '1rem' }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                overflow: 'hidden',
                background: L.errorBg, border: `1px solid ${L.errorBorder}`,
                color: L.errorColor, padding: '0.75rem 1rem',
                borderRadius: 10, fontSize: '0.8rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <AlertCircle size={14} strokeWidth={2.5} style={{ flexShrink: 0 }} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Form ──────────────────────────────────────────────────────── */}
        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.30, ease: EASE }}
          onSubmit={mustChange ? handleChangePassword : handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          {!mustChange && (
            <>
              <div>
                <Label>Adresse e-mail</Label>
                <TextInput
                  type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="prenom.nom@ipc.com" required
                />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                  <Label>Mot de passe</Label>
                  <a
                    href="#"
                    style={{ fontSize: '0.68rem', fontWeight: 600, color: L.muted, textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.target.style.color = L.text)}
                    onMouseLeave={e => (e.target.style.color = L.muted)}
                  >
                    Oublié ?
                  </a>
                </div>
                <PasswordInput
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                />
              </div>
            </>
          )}

          {mustChange && (
            <>
              <div>
                <Label>Nouveau mot de passe</Label>
                <PasswordInput
                  value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 caractères" required
                />
              </div>
              <div>
                <Label>Confirmation</Label>
                <PasswordInput
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le mot de passe" required
                />
              </div>
            </>
          )}

          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={!isLoading ? { scale: 1.006, backgroundColor: L.btnHover } : {}}
            whileTap={!isLoading ? { scale: 0.994 } : {}}
            style={{
              width: '100%', padding: '15px 1.5rem',
              borderRadius: 12, marginTop: '0.2rem',
              background: L.btnBg, color: '#FFFFFF', border: 'none',
              cursor: isLoading ? 'wait' : 'pointer',
              fontWeight: 700, fontSize: '0.92rem', fontFamily: 'inherit',
              letterSpacing: '0.005em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'background 0.15s ease',
            }}
          >
            {isLoading
              ? <div style={{ width: 17, height: 17, border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#FFF', borderRadius: '50%', animation: 'login-spin 0.7s linear infinite' }} />
              : <>{mustChange ? 'Définir le mot de passe' : 'Accéder à mon espace'}<ArrowRight size={16} strokeWidth={2.5} /></>
            }
          </motion.button>
        </motion.form>

        {/* ── Trust footer — 3 badges ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          style={{
            marginTop: '2rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 0, flexWrap: 'wrap',
          }}
        >
          {[
            { icon: <Lock size={9} strokeWidth={2.5} />, label: 'TLS Chiffré' },
            { icon: <Server size={9} strokeWidth={2.5} />, label: 'Données isolées' },
            { icon: <Globe size={9} strokeWidth={2.5} />, label: 'Firebase Cloud' },
          ].map((item, i) => (
            <React.Fragment key={i}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: '0.6rem', fontWeight: 700, color: L.dim,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                padding: '0 12px',
              }}>
                {item.icon}
                {item.label}
              </div>
              {i < 2 && <div style={{ width: 1, height: 10, background: L.dim, flexShrink: 0 }} />}
            </React.Fragment>
          ))}
        </motion.div>

      </div>
    </motion.div>
  );

  /* ════════════════════════════════════════════════════════════════════════
     LEFT PANEL — 3D org chart scene (replaces YouTube video)
  ════════════════════════════════════════════════════════════════════════ */
  const ScenePanel = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.1, ease: EASE }}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background: '#030714',
        minHeight: isMobile ? 280 : undefined,
        height: isMobile ? '58vw' : undefined,
        maxHeight: isMobile ? 360 : undefined,
      }}
    >
      {/* Subtle dot grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        pointerEvents: 'none',
      }} />

      {/* Org chart (desktop only — simplified on mobile) */}
      {!isMobile
        ? <OrgChart mouse={mouse} />
        : (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 10,
          }}>
            <IPCLogoWhite size={44} />
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              IPC Group
            </div>
          </div>
        )
      }

      {/* Chips (desktop only) */}
      {!isMobile && (
        <>
          <SceneChip
            pos={{ top: '1.5rem', left: '1.5rem' }}
            delay={1.0}
            icon={<IPCLogoWhite size={14} />}
            label="IPC Group"
            value="Antigravity OS"
          />
          <SceneChip
            pos={{ bottom: '1.5rem', right: '1.5rem' }}
            delay={1.25}
            icon={<Zap size={13} strokeWidth={2} style={{ color: '#67E8F9' }} />}
            label="3 entités actives"
            value="Holding · Filiales · Fondations"
          />
        </>
      )}
    </motion.div>
  );

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{
      height: '100vh', width: '100vw',
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      overflow: isMobile ? 'auto' : 'hidden',
      fontFamily: "'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {ScenePanel}
      {FormPanel}

      <style>{`
        @keyframes login-spin  { to { transform: rotate(360deg); } }
        @keyframes ipc-flow    { from { stroke-dashoffset: 11; } to { stroke-dashoffset: 0; } }
        @keyframes ipc-pulse   { 0%, 100% { opacity: 0.22; } 50% { opacity: 0.60; } }
        input::placeholder     { color: #B0B0B0 !important; }
      `}</style>
    </div>
  );
};

export default Login;
